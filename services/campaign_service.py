# services/campaign_service.py - School referral code & access campaign service
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from database.schema import get_db_connection
from services.wallet_service import wallet_service


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

        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute("SELECT id FROM campaign_codes WHERE code = ?", (code_clean,))
                if cursor.fetchone():
                    raise ValueError(f"Campaign code '{code_clean}' already exists.")

                code_id = f"cmp_{uuid.uuid4().hex[:12]}"
                now_str = datetime.now().isoformat()

                cursor.execute("""
                    INSERT INTO campaign_codes (
                        id, code, campaign_name, discount_type, discount_value, benefit_type, benefit_value,
                        valid_from, valid_until, max_uses, used_count, one_use_per_user, is_active, created_at, updated_at, created_by
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 1, ?, ?, ?)
                """, (code_id, code_clean, campaign_name.strip(), d_type, d_val, d_type, d_val, valid_from, valid_until, int(max_uses), int(one_use_per_user), now_str, now_str, created_by))

            return CampaignService.get_campaign_by_id(code_id)
        finally:
            conn.close()

    @staticmethod
    def validate_discount_code(user_id: Optional[str], plan_id: str, code_str: str) -> Dict[str, Any]:
        """Server-side referral code validation and secure payable amount calculation."""
        code_clean = code_str.strip().upper()
        if not code_clean:
            raise ValueError("Please enter a referral code.")

        from services.pricing_service import pricing_service
        plan = pricing_service.get_plan_by_id(plan_id)
        if not plan or not plan['is_active']:
            raise ValueError("The selected pricing plan is unavailable.")

        original_price = float(plan['price'])
        now_dt = datetime.now()

        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM campaign_codes WHERE code = ?", (code_clean,))
            code_row = cursor.fetchone()

            if not code_row:
                raise ValueError("This referral code is invalid or expired.")

            if not code_row['is_active']:
                raise ValueError("This referral code is invalid or expired.")

            # Server-side timestamp window check
            try:
                vf_dt = datetime.fromisoformat(code_row['valid_from'])
                vu_dt = datetime.fromisoformat(code_row['valid_until'])
            except Exception:
                vf_dt = now_dt
                vu_dt = now_dt

            if now_dt < vf_dt or now_dt > vu_dt:
                raise ValueError("This referral code is invalid or expired.")

            # Max uses cap check
            if code_row['used_count'] >= code_row['max_uses']:
                raise ValueError("This referral code has reached its maximum usage limit.")

            # One use per user check
            if user_id and code_row['one_use_per_user']:
                cursor.execute("""
                    SELECT id FROM campaign_redemptions WHERE campaign_code_id = ? AND user_id = ?
                """, (code_row['id'], user_id))
                if cursor.fetchone():
                    raise ValueError("You have already used this referral code.")

            # Determine discount type and value
            d_type = code_row['discount_type'] if 'discount_type' in code_row.keys() and code_row['discount_type'] else code_row['benefit_type']
            d_val = float(code_row['discount_value'] if 'discount_value' in code_row.keys() and code_row['discount_value'] is not None else code_row['benefit_value'])

            if d_type == 'FIXED':
                discount_amount = round(min(d_val, original_price), 2)
            elif d_type == 'PERCENTAGE':
                discount_amount = round(original_price * (min(d_val, 100.0) / 100.0), 2)
            else:
                # FREE_CREDITS or other types
                discount_amount = 0.0

            final_price = round(max(0.0, original_price - discount_amount), 2)

            return {
                'valid': True,
                'campaign_id': code_row['id'],
                'code': code_clean,
                'campaign_name': code_row['campaign_name'],
                'discount_type': d_type,
                'discount_value': d_val,
                'original_price': original_price,
                'discount_amount': discount_amount,
                'final_price': final_price,
                'currency': plan['currency'],
                'credits': plan['credits'],
                'plan_name': plan['name']
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
                    SET used_count = used_count + 1, updated_at = ?
                    WHERE id = ?
                """, (now_dt.isoformat(), campaign_code_id))

                redemption_id = f"rdm_{uuid.uuid4().hex[:12]}"
                cursor.execute("""
                    INSERT INTO campaign_redemptions (id, campaign_code_id, user_id, benefit_granted, discount_applied, payment_id, redeemed_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
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
            cursor.execute("SELECT * FROM campaign_codes WHERE id = ?", (code_id,))
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
                    UPDATE campaign_codes SET is_active = ?, updated_at = ? WHERE id = ?
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
        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                now_str = datetime.now().isoformat()
                cursor.execute("""
                    UPDATE campaign_codes
                    SET campaign_name = ?,
                        valid_from = ?,
                        valid_until = ?,
                        max_uses = ?,
                        discount_type = ?,
                        discount_value = ?,
                        benefit_type = ?,
                        benefit_value = ?,
                        one_use_per_user = ?,
                        is_active = ?,
                        updated_at = ?
                    WHERE id = ?
                """, (
                    campaign_name.strip(),
                    valid_from,
                    valid_until,
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
                cursor.execute("SELECT * FROM campaign_codes WHERE code = ?", (code_clean,))
                code_row = cursor.fetchone()

                if not code_row:
                    raise ValueError(f"Campaign code '{code_clean}' does not exist.")

                if not code_row['is_active']:
                    raise ValueError(f"Campaign code '{code_clean}' has been deactivated.")

                # Server-side timestamp validation
                try:
                    vf_dt = datetime.fromisoformat(code_row['valid_from'])
                    vu_dt = datetime.fromisoformat(code_row['valid_until'])
                except Exception:
                    vf_dt = now_dt
                    vu_dt = now_dt

                if now_dt < vf_dt:
                    raise ValueError(f"Campaign code '{code_clean}' is not active yet (Valid from: {code_row['valid_from']}).")

                if now_dt > vu_dt:
                    raise ValueError(f"Campaign code '{code_clean}' expired on {code_row['valid_until']}.")

                # Usage limit validation
                if code_row['used_count'] >= code_row['max_uses']:
                    raise ValueError(f"Campaign code '{code_clean}' has reached its maximum redemptions limit.")

                # Per-user limit validation
                if code_row['one_use_per_user']:
                    cursor.execute("""
                        SELECT id FROM campaign_redemptions WHERE campaign_code_id = ? AND user_id = ?
                    """, (code_row['id'], user_id))
                    if cursor.fetchone():
                        raise ValueError(f"You have already redeemed campaign code '{code_clean}'.")

                # Increment used_count
                cursor.execute("""
                    UPDATE campaign_codes SET used_count = used_count + 1, updated_at = ? WHERE id = ?
                """, (now_dt.isoformat(), code_row['id']))

                # Record redemption
                redemption_id = f"rdm_{uuid.uuid4().hex[:12]}"
                benefit_val = int(code_row['benefit_value'] or code_row.get('discount_value') or 1)
                benefit_desc = f"Granted {benefit_val} Free Credit(s)"
                cursor.execute("""
                    INSERT INTO campaign_redemptions (id, campaign_code_id, user_id, benefit_granted, discount_applied, redeemed_at)
                    VALUES (?, ?, ?, ?, 0, ?)
                """, (redemption_id, code_row['id'], user_id, benefit_desc, now_dt.isoformat()))

            # Grant benefit outside cursor lock (using wallet service)
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
                WHERE r.campaign_code_id = ?
                ORDER BY r.redeemed_at DESC
            """, (code_id,))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()


campaign_service = CampaignService()
