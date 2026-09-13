# services/campaign_service.py - School referral code & access campaign service
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List, Tuple
from database.schema import get_db_connection
from services.wallet_service import wallet_service


def parse_campaign_datetime(val: Any, is_end_of_day: bool = False) -> Optional[datetime]:
    """Robustly parse campaign datetime across ISO 8601 strings (including 'Z' and offsets),
    SQL timestamps, date-only formats, and Python datetimes, returning a normalized naive datetime."""
    if not val:
        return None
    if isinstance(val, datetime):
        if val.tzinfo is not None:
            return val.astimezone(timezone.utc).replace(tzinfo=None)
        return val
    st = str(val).strip()
    if not st:
        return None

    # Strip trailing 'Z' / 'z' if present
    if st.endswith('Z') or st.endswith('z'):
        st = st[:-1]
        try:
            return datetime.fromisoformat(st).replace(tzinfo=None)
        except Exception:
            pass

    try:
        dt = datetime.fromisoformat(st)
        if dt.tzinfo is not None:
            dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt
    except Exception:
        pass

    for fmt in (
        '%Y-%m-%dT%H:%M:%S.%f',
        '%Y-%m-%dT%H:%M:%S',
        '%Y-%m-%d %H:%M:%S.%f',
        '%Y-%m-%d %H:%M:%S',
        '%Y-%m-%d %H:%M',
        '%Y-%m-%d',
        '%Y/%m/%d %H:%M:%S',
        '%Y/%m/%d'
    ):
        try:
            dt = datetime.strptime(st, fmt)
            if fmt in ('%Y-%m-%d', '%Y/%m/%d') and is_end_of_day:
                dt = dt.replace(hour=23, minute=59, second=59, microsecond=999999)
            return dt
        except Exception:
            continue
    return None


def is_campaign_within_window(valid_from_val: Any, valid_until_val: Any) -> Tuple[bool, str]:
    """Check if current time is within valid_from and valid_until bounds.
    Compares against both UTC and local server time to prevent premature expiry or lockout
    due to UTC vs local timezone differences."""
    vf_dt = parse_campaign_datetime(valid_from_val, is_end_of_day=False)
    vu_dt = parse_campaign_datetime(valid_until_val, is_end_of_day=True)

    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    now_local = datetime.now().replace(tzinfo=None)

    if vf_dt:
        if now_utc < vf_dt and now_local < vf_dt:
            return False, 'not_started'

    if vu_dt:
        if now_utc > vu_dt and now_local > vu_dt:
            return False, 'expired'

    return True, 'active'


class CampaignValidationError(ValueError):
    """Structured exception for campaign code validation failures.
    Inherits from ValueError for 100% backward compatibility with existing callers/tests."""
    def __init__(self, message: str, status: str = 'invalid_code', details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.status = status
        self.details = details or {}

    def to_dict(self) -> Dict[str, Any]:
        d = {
            'valid': False,
            'status': self.status,
            'error': self.message
        }
        d.update(self.details)
        return d


class CampaignService:
    """Manages school/workshop referral campaign codes and redemption tracking."""

    @staticmethod
    def create_campaign_code(
        code: str,
        campaign_name: str,
        valid_from: str,
        valid_until: str,
        max_uses: int,
        discount_type: str = "PERCENTAGE",
        discount_value: Optional[float] = None,
        benefit_type: Optional[str] = None,
        benefit_value: Optional[float] = None,
        one_use_per_user: int = 1,
        created_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new campaign referral code from developer dashboard."""
        code_clean = code.strip().upper()
        if not code_clean or not campaign_name:
            raise ValueError("Campaign code and campaign name are required.")

        d_type = discount_type or benefit_type or "PERCENTAGE"
        if discount_value is not None:
            d_val = float(discount_value)
        elif benefit_value is not None:
            d_val = float(benefit_value)
        else:
            d_val = 20.0

        vf = parse_campaign_datetime(valid_from, is_end_of_day=False) or datetime.now()
        vu = parse_campaign_datetime(valid_until, is_end_of_day=True) or (vf + timedelta(days=30))
        valid_from_str = vf.isoformat()
        valid_until_str = vu.isoformat()

        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute("SELECT id FROM campaign_codes WHERE UPPER(TRIM(code)) = %s", (code_clean,))
                if cursor.fetchone():
                    raise ValueError(f"Campaign code '{code_clean}' already exists.")

                code_id = f"cmp_{uuid.uuid4().hex[:12]}"
                now_str = datetime.now().isoformat()

                cursor.execute("""
                    INSERT INTO campaign_codes (
                        id, code, campaign_name, discount_type, discount_value, benefit_type, benefit_value,
                        valid_from, valid_until, max_uses, used_count, one_use_per_user, is_active, created_at, updated_at, created_by
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 0, %s, 1, %s, %s, %s)
                """, (code_id, code_clean, campaign_name.strip(), d_type, d_val, d_type, d_val, valid_from_str, valid_until_str, int(max_uses), int(one_use_per_user), now_str, now_str, created_by))

            return CampaignService.get_campaign_by_id(code_id)
        finally:
            conn.close()

    @staticmethod
    def validate_discount_code(
        user_id: Optional[str],
        plan_id: str,
        code_str: str,
        raise_exception: bool = True
    ) -> Dict[str, Any]:
        """Server-side referral code validation and secure payable amount calculation.
        
        Strictly distinguishes:
        - valid code (status: 'valid')
        - invalid code (status: 'invalid_code')
        - expired code (status: 'expired_code')
        - inactive code (status: 'inactive_code')
        - exhausted code (status: 'exhausted_code')
        - already used code (status: 'already_used')
        - plan not eligible (status: 'plan_not_eligible')
        - server error (status: 'server_error')
        """
        code_clean = (code_str or '').strip().upper()
        if not code_clean:
            err = CampaignValidationError("Please enter a referral code.", status='invalid_code')
            if raise_exception: raise err
            return err.to_dict()

        from services.pricing_service import pricing_service
        plan = pricing_service.get_plan_by_id(plan_id)
        if not plan or not plan.get('is_active', 1):
            err = CampaignValidationError("The selected pricing plan is unavailable or not eligible.", status='plan_not_eligible', details={'code': code_clean, 'plan_id': plan_id})
            if raise_exception: raise err
            return err.to_dict()

        original_price = float(plan['price'])

        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM campaign_codes WHERE UPPER(TRIM(code)) = %s", (code_clean,))
            code_row = cursor.fetchone()

            if not code_row:
                err = CampaignValidationError("This referral code is invalid or does not exist.", status='invalid_code', details={'code': code_clean})
                if raise_exception: raise err
                return err.to_dict()

            # Active / Inactive check
            if not code_row['is_active']:
                err = CampaignValidationError("This referral code has been deactivated.", status='inactive_code', details={'code': code_clean})
                if raise_exception: raise err
                return err.to_dict()

            # Date window check
            in_window, window_reason = is_campaign_within_window(code_row['valid_from'], code_row['valid_until'])
            if not in_window:
                if window_reason == 'not_started':
                    err_msg = f"This referral code is not active yet (Valid from: {code_row['valid_from']})."
                else:
                    err_msg = "This referral code has expired."
                err = CampaignValidationError(err_msg, status='expired_code', details={'code': code_clean, 'valid_from': code_row['valid_from'], 'valid_until': code_row['valid_until']})
                if raise_exception: raise err
                return err.to_dict()

            # Max uses check
            max_uses = int(code_row['max_uses']) if code_row['max_uses'] is not None else 300
            used_count = int(code_row['used_count']) if code_row['used_count'] is not None else 0
            if used_count >= max_uses:
                err = CampaignValidationError("This referral code has reached its maximum usage limit.", status='exhausted_code', details={'code': code_clean})
                if raise_exception: raise err
                return err.to_dict()

            # One use per user check (if user is authenticated)
            if user_id and code_row['one_use_per_user']:
                cursor.execute("""
                    SELECT id FROM campaign_redemptions WHERE campaign_code_id = %s AND user_id = %s
                """, (code_row['id'], user_id))
                if cursor.fetchone():
                    err = CampaignValidationError("You have already used this referral code.", status='already_used', details={'code': code_clean})
                    if raise_exception: raise err
                    return err.to_dict()

            # Determine discount type and value
            d_type = code_row['discount_type'] if ('discount_type' in code_row.keys() and code_row['discount_type']) else code_row['benefit_type']
            raw_d_val = code_row['discount_value'] if ('discount_value' in code_row.keys() and code_row['discount_value'] is not None) else code_row['benefit_value']
            d_val = float(raw_d_val) if raw_d_val is not None else 0.0

            if d_type == 'FIXED':
                discount_amount = round(min(d_val, original_price), 2)
            elif d_type == 'PERCENTAGE':
                discount_amount = round(original_price * (min(d_val, 100.0) / 100.0), 2)
            else:
                discount_amount = 0.0

            final_price = round(max(0.0, original_price - discount_amount), 2)

            return {
                'valid': True,
                'status': 'valid',
                'campaign_id': code_row['id'],
                'code': code_clean,
                'campaign_name': code_row['campaign_name'],
                'discount_type': d_type,
                'discount_value': d_val,
                'original_price': original_price,
                'discount_amount': discount_amount,
                'final_price': final_price,
                'currency': plan.get('currency', 'INR'),
                'credits': plan['credits'],
                'plan_name': plan['name'],
                'message': f"Referral code '{code_clean}' applied successfully."
            }
        finally:
            conn.close()

    @staticmethod
    def record_discount_redemption(campaign_code_id: str, user_id: str, payment_id: str, discount_amount: float) -> str:
        """Record referral code redemption after verified payment."""
        now_dt = datetime.now()
        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE campaign_codes
                    SET used_count = used_count + 1, updated_at = %s
                    WHERE id = %s
                """, (now_dt.isoformat(), campaign_code_id))

                redemption_id = f"rdm_{uuid.uuid4().hex[:12]}"
                cursor.execute("""
                    INSERT INTO campaign_redemptions (id, campaign_code_id, user_id, benefit_granted, discount_applied, payment_id, redeemed_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (redemption_id, campaign_code_id, user_id, f"Applied ₹{discount_amount:.2f} discount", discount_amount, payment_id, now_dt.isoformat()))

                return redemption_id
        finally:
            conn.close()

    @staticmethod
    def get_campaign_by_id(code_id: str) -> Optional[Dict[str, Any]]:
        """Fetch campaign details by ID."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM campaign_codes WHERE id = %s", (code_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    @staticmethod
    def get_all_campaigns() -> List[Dict[str, Any]]:
        """Fetch all campaigns with usage stats for developer dashboard."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT c.*,
                       (SELECT COUNT(*) FROM campaign_redemptions r WHERE r.campaign_code_id = c.id) as real_redemption_count
                FROM campaign_codes c
                ORDER BY c.created_at DESC
            """)
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()

    @staticmethod
    def set_campaign_active(code_id: str, is_active: int) -> Optional[Dict[str, Any]]:
        """Manually activate or disable a campaign code."""
        conn = get_db_connection()
        try:
            with conn:
                cur = conn.execute("""
                    UPDATE campaign_codes SET is_active = %s, updated_at = %s WHERE id = %s
                """, (1 if is_active else 0, datetime.now().isoformat(), code_id))
                if cur.rowcount == 0:
                    raise ValueError(f"Campaign with ID '{code_id}' not found.")
            return CampaignService.get_campaign_by_id(code_id)
        finally:
            conn.close()

    @staticmethod
    def update_campaign_code(
        code_id: str,
        campaign_name: str,
        valid_from: str,
        valid_until: str,
        max_uses: int,
        discount_type: str = "PERCENTAGE",
        discount_value: float = 20.0,
        one_use_per_user: int = 1,
        is_active: int = 1
    ) -> Dict[str, Any]:
        """Update an existing campaign referral code from developer dashboard."""
        vf = parse_campaign_datetime(valid_from, is_end_of_day=False) or datetime.now()
        vu = parse_campaign_datetime(valid_until, is_end_of_day=True) or (vf + timedelta(days=30))
        valid_from_str = vf.isoformat()
        valid_until_str = vu.isoformat()

        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                now_str = datetime.now().isoformat()
                cursor.execute("""
                    UPDATE campaign_codes
                    SET campaign_name = %s,
                        valid_from = %s,
                        valid_until = %s,
                        max_uses = %s,
                        discount_type = %s,
                        discount_value = %s,
                        benefit_type = %s,
                        benefit_value = %s,
                        one_use_per_user = %s,
                        is_active = %s,
                        updated_at = %s
                    WHERE id = %s
                """, (
                    campaign_name.strip(),
                    valid_from_str,
                    valid_until_str,
                    int(max_uses),
                    discount_type,
                    float(discount_value),
                    discount_type,
                    float(discount_value),
                    int(one_use_per_user),
                    int(is_active),
                    now_str,
                    code_id
                ))
            return CampaignService.get_campaign_by_id(code_id)
        finally:
            conn.close()

    @staticmethod
    def redeem_code(user_id: str, code_str: str) -> Dict[str, Any]:
        """Validate free credit campaign code server-side and grant credits atomically."""
        code_clean = code_str.strip().upper()
        if not code_clean:
            raise ValueError("Please enter a valid campaign code.")

        now_dt = datetime.now()

        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM campaign_codes WHERE UPPER(TRIM(code)) = %s", (code_clean,))
                code_row = cursor.fetchone()

                if not code_row:
                    raise ValueError(f"Campaign code '{code_clean}' does not exist.")

                if not code_row['is_active']:
                    raise ValueError(f"Campaign code '{code_clean}' has been deactivated.")

                # Server-side timestamp validation
                in_window, window_reason = is_campaign_within_window(code_row['valid_from'], code_row['valid_until'])
                if not in_window:
                    if window_reason == 'not_started':
                        raise ValueError(f"Campaign code '{code_clean}' is not active yet (Valid from: {code_row['valid_from']}).")
                    else:
                        raise ValueError(f"Campaign code '{code_clean}' expired on {code_row['valid_until']}.")

                # Usage limit validation
                if code_row['used_count'] >= code_row['max_uses']:
                    raise ValueError(f"Campaign code '{code_clean}' has reached its maximum redemptions limit.")

                # Per-user limit validation
                if code_row['one_use_per_user']:
                    cursor.execute("""
                        SELECT id FROM campaign_redemptions WHERE campaign_code_id = %s AND user_id = %s
                    """, (code_row['id'], user_id))
                    if cursor.fetchone():
                        raise ValueError(f"You have already redeemed campaign code '{code_clean}'.")

                # Increment used_count atomically with max_uses check to prevent race condition (V16)
                cursor.execute("""
                    UPDATE campaign_codes
                    SET used_count = used_count + 1, updated_at = %s
                    WHERE id = %s AND used_count < max_uses AND is_active = 1
                """, (now_dt.isoformat(), code_row['id']))
                if cursor.rowcount == 0:
                    raise ValueError(f"Campaign code '{code_clean}' has reached its maximum redemptions limit.")

                # Record redemption
                redemption_id = f"rdm_{uuid.uuid4().hex[:12]}"
                raw_benefit = code_row['benefit_value'] or code_row.get('discount_value') or 1
                try:
                    benefit_val = int(raw_benefit)
                except (ValueError, TypeError):
                    benefit_val = 1
                benefit_val = min(max(1, benefit_val), 100)
                benefit_desc = f"Granted {benefit_val} Free Credit(s)"
                cursor.execute("""
                    INSERT INTO campaign_redemptions (id, campaign_code_id, user_id, benefit_granted, discount_applied, redeemed_at)
                    VALUES (%s, %s, %s, %s, 0, %s)
                """, (redemption_id, code_row['id'], user_id, benefit_desc, now_dt.isoformat()))

            credits_granted = benefit_val
            new_balance = wallet_service.add_credits(
                user_id=user_id,
                amount=credits_granted,
                transaction_type='PROMOTION',
                reference_type='campaign_code',
                reference_id=code_row['id'],
                description=f"Redeemed school/workshop code '{code_clean}' ({code_row['campaign_name']})"
            )

            return {
                'status': 'success',
                'message': f"Success! Code '{code_clean}' redeemed for {credits_granted} free credit(s).",
                'credits_granted': credits_granted,
                'new_balance': new_balance,
                'campaign_name': code_row['campaign_name']
            }
        finally:
            conn.close()

    @staticmethod
    def get_code_redemptions(code_id: str) -> List[Dict[str, Any]]:
        """Get audit list of users who redeemed a campaign code."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT r.id, r.benefit_granted, r.discount_applied, r.payment_id, r.redeemed_at, u.email, p.full_name
                FROM campaign_redemptions r
                JOIN users u ON r.user_id = u.id
                LEFT JOIN user_profiles p ON u.id = p.user_id
                WHERE r.campaign_code_id = %s
                ORDER BY r.redeemed_at DESC
            """, (code_id,))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()


campaign_service = CampaignService()
