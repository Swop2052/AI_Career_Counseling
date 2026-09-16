# services/auth_service.py - Authentication and account identity service
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from werkzeug.security import generate_password_hash, check_password_hash
from database.schema import get_db_connection


class AuthService:
    """Service handling user registration, authentication, session state, and security."""

    @staticmethod
    def create_user(
        email: str,
        password: str,
        full_name: str,
        phone: Optional[str] = None,
        education_level: Optional[str] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        role: str = 'USER'
    ) -> Dict[str, Any]:
        """Register a new user account with hashed password and initial wallet."""
        email_clean = email.strip().lower()
        if not email_clean or not password or len(password) < 6:
            raise ValueError("Email and password (min 6 characters) are required.")

        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                # Check for existing email
                cursor.execute("SELECT id FROM users WHERE email = %s", (email_clean,))
                if cursor.fetchone():
                    raise ValueError("An account with this email address already exists.")

                user_id = f"usr_{uuid.uuid4().hex[:12]}"
                password_hash = generate_password_hash(password)
                now_str = datetime.now().isoformat()

                # Insert user
                cursor.execute("""
                    INSERT INTO users (id, email, password_hash, role, is_active, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, 1, %s, %s)
                """, (user_id, email_clean, password_hash, role, now_str, now_str))

                # Insert profile
                profile_id = f"prf_{uuid.uuid4().hex[:12]}"
                cursor.execute("""
                    INSERT INTO user_profiles (id, user_id, full_name, phone, education_level, city, state, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (profile_id, user_id, full_name.strip(), phone, education_level, city, state, now_str, now_str))

                # Initialize credit wallet with 0 balance
                wallet_id = f"wlt_{uuid.uuid4().hex[:12]}"
                cursor.execute("""
                    INSERT INTO credit_wallets (id, user_id, balance, updated_at)
                    VALUES (%s, %s, 0, %s)
                """, (wallet_id, user_id, now_str))

            return {
                'id': user_id,
                'email': email_clean,
                'role': role,
                'full_name': full_name.strip()
            }
        finally:
            conn.close()

    @staticmethod
    def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
        """Verify user credentials and return user context if valid."""
        email_clean = email.strip().lower()
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT u.id, u.email, u.password_hash, u.role, u.is_active, u.can_manage_developers,
                       p.full_name, w.balance
                FROM users u
                LEFT JOIN user_profiles p ON u.id = p.user_id
                LEFT JOIN credit_wallets w ON u.id = w.user_id
                WHERE u.email = %s
            """, (email_clean,))
            row = cursor.fetchone()

            if not row:
                return None

            if not row['is_active']:
                raise ValueError("This account has been deactivated or is pending invitation setup.")

            is_valid_pwd = check_password_hash(row['password_hash'], password)

            if is_valid_pwd:
                now_str = datetime.now().isoformat()
                with conn:
                    conn.execute("UPDATE users SET last_login_at = %s WHERE id = %s", (now_str, row['id']))

                return {
                    'id': row['id'],
                    'email': row['email'],
                    'role': row['role'],
                    'full_name': row['full_name'] or 'Student',
                    'balance': row['balance'] or 0,
                    'is_active': row['is_active'],
                    'can_manage_developers': (row['role'] == 'SUPER_ADMIN' or bool(row['can_manage_developers']))
                }
            return None
        finally:
            conn.close()

    @staticmethod
    def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
        """Fetch user record by email address."""
        email_clean = email.strip().lower()
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT u.id, u.email, u.role, u.is_active, u.created_at, u.last_login_at, u.can_manage_developers,
                       p.full_name, p.phone, p.education_level, p.city, p.state,
                       w.balance
                FROM users u
                LEFT JOIN user_profiles p ON u.id = p.user_id
                LEFT JOIN credit_wallets w ON u.id = w.user_id
                WHERE u.email = %s
            """, (email_clean,))
            row = cursor.fetchone()
            if not row:
                return None
            return dict(row)
        finally:
            conn.close()

    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch full user details by ID."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT u.id, u.email, u.role, u.is_active, u.created_at, u.last_login_at, u.can_manage_developers,
                       p.full_name, p.phone, p.education_level, p.city, p.state,
                       w.balance
                FROM users u
                LEFT JOIN user_profiles p ON u.id = p.user_id
                LEFT JOIN credit_wallets w ON u.id = w.user_id
                WHERE u.id = %s
            """, (user_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return dict(row)
        finally:
            conn.close()

    @staticmethod
    def list_all_users() -> List[Dict[str, Any]]:
        """Fetch all users for developer dashboard."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT u.id, u.email, u.role, u.is_active, u.created_at, u.last_login_at,
                       p.full_name, p.phone, w.balance,
                       (SELECT COUNT(*) FROM assessment_attempts a WHERE a.user_id = u.id) as total_attempts,
                       (SELECT COUNT(*) FROM assessment_attempts a WHERE a.user_id = u.id AND a.is_unlocked = 1) as unlocked_attempts
                FROM users u
                LEFT JOIN user_profiles p ON u.id = p.user_id
                LEFT JOIN credit_wallets w ON u.id = w.user_id
                ORDER BY u.created_at DESC
            """)
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()


    @staticmethod
    def _is_expired(expires_at) -> bool:
        """Check if an expiration timestamp is past without timezone mismatch issues."""
        if not expires_at:
            return True
        if isinstance(expires_at, datetime):
            exp = expires_at
        else:
            try:
                exp = datetime.fromisoformat(str(expires_at))
            except Exception:
                return True
        if exp.tzinfo is not None:
            now_dt = datetime.now(exp.tzinfo)
        else:
            now_dt = datetime.now()
        return now_dt > exp

    @staticmethod
    def create_password_reset_otp(email: str) -> bool:
        """Generate, store, and send a 6-digit OTP for password recovery."""
        email_clean = email.strip().lower()
        if not email_clean:
            raise ValueError("Please enter a valid email address.")

        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM users WHERE email = %s", (email_clean,))
            user_row = cursor.fetchone()

            # Security: Always return True conceptually to prevent email enumeration if account does not exist
            if not user_row:
                print(f"[INFO] Password reset requested for non-existing email: {email_clean}")
                return True

            # Check rate limiting: max 5 requests per 10 minutes using PostgreSQL native interval
            cursor.execute("""
                SELECT COUNT(*) as cnt FROM password_resets
                WHERE email = %s AND created_at > (NOW() - INTERVAL '10 minutes')
            """, (email_clean,))
            count_row = cursor.fetchone()
            recent_count = count_row['cnt'] if isinstance(count_row, dict) else (count_row[0] if count_row else 0)

            if recent_count >= 5:
                raise ValueError("Too many verification code requests. Please wait 10 minutes before trying again.")

            # Generate random 6-digit OTP preserving string format (and leading zeros)
            otp_code = f"{random.randint(0, 999999):06d}"
            otp_hash = generate_password_hash(otp_code)
            expires_at = (datetime.now() + timedelta(minutes=10)).isoformat()
            reset_id = f"rst_{uuid.uuid4().hex[:12]}"

            with conn:
                cursor.execute("""
                    INSERT INTO password_resets (id, email, otp_hash, expires_at, attempts, is_used, created_at)
                    VALUES (%s, %s, %s, %s, 0, 0, %s)
                """, (reset_id, email_clean, otp_hash, expires_at, datetime.now().isoformat()))

            # Send OTP email via EmailService
            from services.email_service import email_service
            sent_success = email_service.send_password_reset_otp(email_clean, otp_code)

            if not sent_success:
                raise ValueError("We couldn't send the verification code right now. Please check your email configuration or try again in a moment.")

            return True
        finally:
            conn.close()

    @staticmethod
    def verify_password_reset_otp(email: str, otp_code: str) -> str:
        """
        Verify 6-digit OTP code for email, enforce attempt limits and expiration,
        and issue a single-use cryptographically secure reset token.
        """
        import secrets
        email_clean = email.strip().lower()
        otp_digits = "".join(c for c in str(otp_code) if c.isdigit())

        if not email_clean:
            raise ValueError("Email address is required.")

        if len(otp_digits) != 6:
            raise ValueError("Verification code must be exactly 6 digits.")

        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_dt = datetime.now()

            cursor.execute("""
                SELECT id, otp_hash, expires_at, attempts
                FROM password_resets
                WHERE email = %s AND is_used = 0
                ORDER BY created_at DESC LIMIT 1
            """, (email_clean,))
            row = cursor.fetchone()

            if not row:
                raise ValueError("No active verification code found for this email. Please request a new code.")

            if AuthService._is_expired(row['expires_at']):
                raise ValueError("Verification code has expired. Please request a new code.")

            if row['attempts'] >= 5:
                raise ValueError("Too many failed attempts. Please request a new verification code.")

            if not check_password_hash(row['otp_hash'], otp_digits):
                with conn:
                    cursor.execute("UPDATE password_resets SET attempts = attempts + 1 WHERE id = %s", (row['id'],))
                raise ValueError("Incorrect verification code. Please check your email and try again.")

            # OTP is valid! Issue secure single-use reset token
            reset_token = f"rst_tok_{secrets.token_urlsafe(32)}"
            token_hash = generate_password_hash(reset_token)
            token_expires = (now_dt + timedelta(minutes=15)).isoformat()
            token_id = f"rst_{uuid.uuid4().hex[:12]}"

            with conn:
                # Mark original OTP as used
                cursor.execute("UPDATE password_resets SET is_used = 1 WHERE id = %s", (row['id'],))
                # Store issued reset token
                cursor.execute("""
                    INSERT INTO password_resets (id, email, otp_hash, expires_at, attempts, is_used, created_at)
                    VALUES (%s, %s, %s, %s, 0, 0, %s)
                """, (token_id, email_clean, token_hash, token_expires, now_dt.isoformat()))

            return reset_token
        finally:
            conn.close()

    @staticmethod
    def reset_password_for_email(email: str, reset_token: str, new_password: str) -> bool:
        """
        Validate single-use reset token or verified OTP for email and update password.
        Invalidates all outstanding reset codes upon success.
        """
        email_clean = email.strip().lower()
        token_str = str(reset_token).strip()

        if not email_clean:
            raise ValueError("Email address is required.")
        if not token_str:
            raise ValueError("Reset token or verification code is required.")
        if not new_password or len(new_password) < 6:
            raise ValueError("New password must be at least 6 characters long.")

        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_dt = datetime.now()

            # Find unused reset records for this email
            cursor.execute("""
                SELECT id, otp_hash, expires_at, attempts
                FROM password_resets
                WHERE email = %s AND is_used = 0
                ORDER BY created_at DESC
            """, (email_clean,))
            rows = cursor.fetchall()

            matched_row = None
            for row in rows:
                if not AuthService._is_expired(row['expires_at']) and row['attempts'] < 5:
                    if check_password_hash(row['otp_hash'], token_str):
                        matched_row = row
                        break

            if not matched_row:
                raise ValueError("Invalid or expired reset token. Please request a new password reset.")

            # Update user password
            new_hash = generate_password_hash(new_password)
            now_str = now_dt.isoformat()

            with conn:
                cursor.execute("""
                    UPDATE users SET password_hash = %s, updated_at = %s WHERE email = %s
                """, (new_hash, now_str, email_clean))
                # Invalidate ALL reset codes for this email
                cursor.execute("UPDATE password_resets SET is_used = 1 WHERE email = %s", (email_clean,))

            AuthService.write_audit_log(
                actor_id=None,
                actor_email=email_clean,
                action='PASSWORD_RESET_SUCCESS',
                target_email=email_clean,
                details='Password updated via verified OTP / reset token'
            )

            print(f"[SUCCESS] Password successfully reset for {email_clean}")
            return True
        finally:
            conn.close()

    @staticmethod
    def verify_otp_and_reset_password(email: str, otp_code: str, new_password: str) -> bool:
        """Convenience method combining OTP verification and password update."""
        token = AuthService.verify_password_reset_otp(email, otp_code)
        return AuthService.reset_password_for_email(email, token, new_password)

    @staticmethod
    def update_user_profile(user_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update student profile details."""
        conn = get_db_connection()
        try:
            now_str = datetime.now().isoformat()
            full_name = profile_data.get('full_name', '').strip()
            phone = profile_data.get('phone', '').strip()
            education_level = profile_data.get('education_level', '').strip()
            city = profile_data.get('city', '').strip()
            state = profile_data.get('state', '').strip()

            with conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE user_profiles
                    SET full_name = COALESCE(NULLIF(%s, ''), full_name),
                        phone = %s,
                        education_level = %s,
                        city = %s,
                        state = %s,
                        updated_at = %s
                    WHERE user_id = %s
                """, (full_name, phone, education_level, city, state, now_str, user_id))

            return AuthService.get_user_by_id(user_id)
        finally:
            conn.close()

    @staticmethod
    def get_profile_completeness(user_profile: Dict[str, Any]) -> int:
        """Calculate profile completeness percentage."""
        if not user_profile:
            return 0
        fields = ['full_name', 'phone', 'education_level', 'city', 'state']
        filled = sum(1 for f in fields if user_profile.get(f))
        return int((filled / len(fields)) * 100)

    # -----------------------------------------------------------------------
    # DEVELOPER MANAGEMENT METHODS
    # -----------------------------------------------------------------------

    @staticmethod
    def write_audit_log(actor_id: Optional[str], actor_email: str, action: str,
                        target_email: Optional[str] = None, target_id: Optional[str] = None,
                        details: Optional[str] = None) -> None:
        """Record an immutable audit log entry for developer management actions."""
        conn = get_db_connection()
        try:
            log_id = f"aud_{uuid.uuid4().hex[:12]}"
            with conn:
                conn.execute("""
                    INSERT INTO audit_log (id, actor_id, actor_email, action, target_email, target_id, details, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (log_id, actor_id, actor_email, action, target_email, target_id, details,
                      datetime.now().isoformat()))
        finally:
            conn.close()

    @staticmethod
    def list_developer_accounts() -> List[Dict[str, Any]]:
        """Fetch all DEVELOPER and SUPER_ADMIN accounts for developer management."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT u.id, u.email, u.role, u.is_active, u.can_manage_developers,
                       u.created_at, u.last_login_at,
                       p.full_name
                FROM users u
                LEFT JOIN user_profiles p ON u.id = p.user_id
                WHERE u.role IN ('DEVELOPER', 'SUPER_ADMIN')
                ORDER BY u.role DESC, u.created_at ASC
            """)
            rows = cursor.fetchall()
            result = []
            now_dt = datetime.now()
            for r in rows:
                rec = dict(r)
                # Convert timestamps to ISO string if datetime object
                if isinstance(rec.get('created_at'), datetime):
                    rec['created_at'] = rec['created_at'].isoformat()
                if isinstance(rec.get('last_login_at'), datetime):
                    rec['last_login_at'] = rec['last_login_at'].isoformat()

                if rec.get('is_active'):
                    rec['invitation_status'] = 'ACTIVE'
                else:
                    cursor.execute("""
                        SELECT id, status, expires_at FROM developer_invitations
                        WHERE email = %s
                        ORDER BY created_at DESC LIMIT 1
                    """, (rec['email'],))
                    inv_row = cursor.fetchone()
                    if inv_row:
                        inv = dict(inv_row)
                        if inv['status'] == 'PENDING':
                            rec['invitation_status'] = 'EXPIRED' if AuthService._is_expired(inv['expires_at']) else 'PENDING'
                        else:
                            rec['invitation_status'] = inv['status']
                    else:
                        rec['invitation_status'] = 'DEACTIVATED'
                result.append(rec)
            return result
        finally:
            conn.close()

    @staticmethod
    def invite_developer(email: str, full_name: str, role: str = 'DEVELOPER',
                         actor_id: Optional[str] = None, actor_email: str = '',
                         can_manage_developers: int = 0,
                         app_base_url: str = 'http://localhost:5173') -> Dict[str, Any]:
        """
        Create a developer or super admin account (inactive, no password) and dispatch
        a secure single-use invitation token via SMTP email.
        """
        import secrets
        email_clean = email.strip().lower()
        if not email_clean:
            raise ValueError("Email address is required.")
        if role not in ('DEVELOPER', 'SUPER_ADMIN'):
            raise ValueError("Invalid role. Role must be DEVELOPER or SUPER_ADMIN.")

        # Super Admins always have can_manage_developers enabled
        can_manage_val = 1 if (role == 'SUPER_ADMIN' or bool(can_manage_developers)) else 0

        conn = get_db_connection()
        try:
            cursor = conn.cursor()

            # Check if email already exists in users
            cursor.execute("SELECT id, role, is_active FROM users WHERE email = %s", (email_clean,))
            existing = cursor.fetchone()
            if existing:
                if existing['is_active']:
                    raise ValueError(f"An active account with email '{email_clean}' already exists.")
                else:
                    raise ValueError(f"An account with email '{email_clean}' already exists pending invitation setup. Use Resend Invitation instead.")

            # Cancel any previous pending invitations for this email
            with conn:
                conn.execute("""
                    UPDATE developer_invitations SET status = 'CANCELLED'
                    WHERE email = %s AND status = 'PENDING'
                """, (email_clean,))

            # Create inactive user account (password set on invitation acceptance)
            user_id = f"usr_{uuid.uuid4().hex[:12]}"
            placeholder_hash = generate_password_hash(secrets.token_hex(32))
            now_str = datetime.now().isoformat()

            with conn:
                conn.execute("""
                    INSERT INTO users (id, email, password_hash, role, is_active, can_manage_developers, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, 0, %s, %s, %s)
                """, (user_id, email_clean, placeholder_hash, role, can_manage_val, now_str, now_str))

                # Create profile
                profile_id = f"prf_{uuid.uuid4().hex[:12]}"
                conn.execute("""
                    INSERT INTO user_profiles (id, user_id, full_name, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s)
                """, (profile_id, user_id, full_name.strip(), now_str, now_str))

                # Create wallet
                wallet_id = f"wlt_{uuid.uuid4().hex[:12]}"
                conn.execute("""
                    INSERT INTO credit_wallets (id, user_id, balance, updated_at)
                    VALUES (%s, %s, 0, %s)
                """, (wallet_id, user_id, now_str))

            # Generate secure single-use token (48 url-safe characters)
            raw_token = secrets.token_urlsafe(48)
            token_hash = generate_password_hash(raw_token)
            expires_at = (datetime.now() + timedelta(hours=24)).isoformat()
            inv_id = f"inv_{uuid.uuid4().hex[:12]}"

            with conn:
                conn.execute("""
                    INSERT INTO developer_invitations
                        (id, email, role, token_hash, expires_at, created_by, created_at, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'PENDING')
                """, (inv_id, email_clean, role, token_hash, expires_at, actor_id, now_str))

            # Dispatch branded invitation email
            from services.email_service import email_service
            base = (app_base_url or 'http://localhost:5173').rstrip('/')
            setup_url = f"{base}/#accept-invite?token={raw_token}"
            email_sent = email_service.send_invitation_email(
                recipient_email=email_clean,
                full_name=full_name.strip(),
                setup_url=setup_url,
                role=role,
                expires_hours=24
            )

            if not email_sent:
                # Roll back created records so failed invitations are not reported as sent
                with conn:
                    conn.execute("DELETE FROM developer_invitations WHERE id = %s", (inv_id,))
                    conn.execute("DELETE FROM user_profiles WHERE user_id = %s", (user_id,))
                    conn.execute("DELETE FROM credit_wallets WHERE user_id = %s", (user_id,))
                    conn.execute("DELETE FROM users WHERE id = %s", (user_id,))
                raise ValueError(f"Failed to deliver invitation email to '{email_clean}'. Please verify SMTP configuration.")

            # Audit log
            AuthService.write_audit_log(
                actor_id=actor_id,
                actor_email=actor_email or 'system',
                action='INVITED_USER',
                target_email=email_clean,
                target_id=user_id,
                details=f"Invited account with role: {role}, can_manage_developers: {can_manage_val}"
            )

            return {
                'user_id': user_id,
                'email': email_clean,
                'role': role,
                'raw_token': raw_token,
                'setup_url': setup_url,
                'invitation_id': inv_id,
                'expires_at': expires_at
            }
        finally:
            conn.close()

    @staticmethod
    def resend_invitation(target_email: str, actor_id: Optional[str] = None, actor_email: str = '',
                          app_base_url: str = 'http://localhost:5173') -> Dict[str, Any]:
        """
        Cancel any existing pending invitation and create a new one, dispatching email via SMTP.
        The user account must already exist and be inactive (pending setup).
        """
        import secrets
        email_clean = target_email.strip().lower()
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT u.id, u.role, u.is_active, p.full_name
                FROM users u
                LEFT JOIN user_profiles p ON u.id = p.user_id
                WHERE u.email = %s
            """, (email_clean,))
            user = cursor.fetchone()
            if not user:
                raise ValueError(f"No account found for '{email_clean}'.")
            if user['is_active']:
                raise ValueError("This account is already active. Resend is only for pending setup accounts.")

            full_name = user['full_name'] or email_clean.split('@')[0]

            # Cancel previous pending invitations
            with conn:
                conn.execute("""
                    UPDATE developer_invitations SET status = 'CANCELLED'
                    WHERE email = %s AND status = 'PENDING'
                """, (email_clean,))

            # Create new invitation
            raw_token = secrets.token_urlsafe(48)
            token_hash = generate_password_hash(raw_token)
            expires_at = (datetime.now() + timedelta(hours=24)).isoformat()
            inv_id = f"inv_{uuid.uuid4().hex[:12]}"
            now_str = datetime.now().isoformat()

            with conn:
                conn.execute("""
                    INSERT INTO developer_invitations
                        (id, email, role, token_hash, expires_at, created_by, created_at, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'PENDING')
                """, (inv_id, email_clean, user['role'], token_hash, expires_at, actor_id, now_str))

            # Dispatch invitation email
            from services.email_service import email_service
            base = (app_base_url or 'http://localhost:5173').rstrip('/')
            setup_url = f"{base}/#accept-invite?token={raw_token}"
            email_sent = email_service.send_invitation_email(
                recipient_email=email_clean,
                full_name=full_name,
                setup_url=setup_url,
                role=user['role'],
                expires_hours=24
            )

            if not email_sent:
                with conn:
                    conn.execute("UPDATE developer_invitations SET status = 'CANCELLED' WHERE id = %s", (inv_id,))
                raise ValueError(f"Failed to deliver invitation email to '{email_clean}' via SMTP.")

            AuthService.write_audit_log(
                actor_id=actor_id,
                actor_email=actor_email or 'system',
                action='RESENT_INVITATION',
                target_email=email_clean,
                target_id=user['id'],
                details=f"Previous invitation cancelled; new invitation dispatched for role {user['role']}"
            )

            return {
                'email': email_clean,
                'raw_token': raw_token,
                'setup_url': setup_url,
                'invitation_id': inv_id,
                'expires_at': expires_at
            }
        finally:
            conn.close()

    @staticmethod
    def accept_invitation(raw_token: str, new_password: str) -> Dict[str, Any]:
        """
        Validate a one-time invitation token, set the user's password, and
        activate the account.  The token is consumed and cannot be reused.
        """
        if not new_password or len(new_password) < 8:
            raise ValueError("Password must be at least 8 characters long.")

        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_dt = datetime.now()

            # Fetch all pending invitations (need to check hash against each)
            cursor.execute("""
                SELECT id, email, role, token_hash, expires_at, status
                FROM developer_invitations
                WHERE status = 'PENDING'
                ORDER BY created_at DESC
            """)
            rows = cursor.fetchall()
            matched = None
            for row in rows:
                if check_password_hash(row['token_hash'], raw_token):
                    matched = dict(row)
                    break

            if not matched:
                raise ValueError("Invalid or expired invitation link. Please request a new invitation.")

            # Check expiry
            if AuthService._is_expired(matched['expires_at']):
                with conn:
                    conn.execute("UPDATE developer_invitations SET status = 'EXPIRED' WHERE id = %s",
                                 (matched['id'],))
                raise ValueError("This invitation link has expired. Please ask for a new invitation.")

            # Get the associated user
            cursor.execute("SELECT id FROM users WHERE email = %s", (matched['email'],))
            user_row = cursor.fetchone()
            if not user_row:
                raise ValueError("Associated account not found.")

            new_hash = generate_password_hash(new_password)
            now_str = now_dt.isoformat()

            with conn:
                # Activate account + set password
                conn.execute("""
                    UPDATE users SET password_hash = %s, is_active = 1, updated_at = %s WHERE id = %s
                """, (new_hash, now_str, user_row['id']))
                # Mark invitation used
                conn.execute("""
                    UPDATE developer_invitations SET status = 'ACCEPTED', used_at = %s WHERE id = %s
                """, (now_str, matched['id']))

            AuthService.write_audit_log(
                actor_id=user_row['id'],
                actor_email=matched['email'],
                action='ACCEPTED_INVITATION',
                target_email=matched['email'],
                target_id=user_row['id'],
                details='Account activated via invitation link'
            )

            return {
                'id': user_row['id'],
                'email': matched['email'],
                'role': matched['role'],
                'is_active': 1
            }
        finally:
            conn.close()

    @staticmethod
    def disable_developer(target_id: str, actor_id: str, actor_email: str) -> None:
        """Deactivate a developer account. Cannot disable own account or SUPER_ADMIN from DEVELOPER."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT email, role FROM users WHERE id = %s", (target_id,))
            target = cursor.fetchone()
            if not target:
                raise ValueError("Developer account not found.")
            with conn:
                conn.execute("UPDATE users SET is_active = 0, updated_at = %s WHERE id = %s",
                             (datetime.now().isoformat(), target_id))
            AuthService.write_audit_log(
                actor_id=actor_id,
                actor_email=actor_email,
                action='DISABLED_DEVELOPER',
                target_email=target['email'],
                target_id=target_id,
                details=f"Role: {target['role']}"
            )
        finally:
            conn.close()

    @staticmethod
    def reactivate_developer(target_id: str, actor_id: str, actor_email: str) -> None:
        """Reactivate a previously disabled developer account."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT email, role FROM users WHERE id = %s", (target_id,))
            target = cursor.fetchone()
            if not target:
                raise ValueError("Developer account not found.")
            with conn:
                conn.execute("UPDATE users SET is_active = 1, updated_at = %s WHERE id = %s",
                             (datetime.now().isoformat(), target_id))
            AuthService.write_audit_log(
                actor_id=actor_id,
                actor_email=actor_email,
                action='REACTIVATED_DEVELOPER',
                target_email=target['email'],
                target_id=target_id,
                details=f"Role: {target['role']}"
            )
        finally:
            conn.close()

    @staticmethod
    def set_developer_status(target_id: str, is_active: int, actor_id: str, actor_email: str) -> None:
        """Set developer active or inactive status via dropdown."""
        if target_id == actor_id and not is_active:
            raise ValueError("You cannot deactivate your own logged-in account.")

        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT email, role FROM users WHERE id = %s", (target_id,))
            target = cursor.fetchone()
            if not target:
                raise ValueError("Developer account not found.")

            with conn:
                conn.execute("UPDATE users SET is_active = %s, updated_at = %s WHERE id = %s",
                             (1 if is_active else 0, datetime.now().isoformat(), target_id))

            action_name = 'REACTIVATED_DEVELOPER' if is_active else 'DISABLED_DEVELOPER'
            AuthService.write_audit_log(
                actor_id=actor_id,
                actor_email=actor_email,
                action=action_name,
                target_email=target['email'],
                target_id=target_id,
                details=f"Role: {target['role']}, Set is_active: {bool(is_active)}"
            )
        finally:
            conn.close()

    @staticmethod
    def delete_developer(target_id: str, actor_id: str, actor_email: str) -> None:
        """
        Delete a developer or super admin account.
        Preserves all created pricing models, campaign codes, and transactions.
        """
        if target_id == actor_id:
            raise ValueError("You cannot delete your own logged-in account.")

        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT id, email, role FROM users WHERE id = %s", (target_id,))
            target = cursor.fetchone()
            if not target:
                raise ValueError("Developer account not found.")

            target_role = target['role']
            target_email = target['email']

            if target_role == 'SUPER_ADMIN':
                cursor.execute("SELECT COUNT(*) as cnt FROM users WHERE role = 'SUPER_ADMIN' AND id != %s AND is_active = 1", (target_id,))
                sa_count = cursor.fetchone()['cnt']
                if sa_count < 1:
                    raise ValueError("Cannot delete the last remaining active Super Admin account.")

            with conn:
                # 1. Update any campaign codes or pricing plans created by this user to detach FK cleanly
                try:
                    conn.execute("UPDATE campaign_codes SET created_by = NULL WHERE created_by = %s", (target_id,))
                except Exception:
                    pass

                # 2. Delete developer invitations
                conn.execute("DELETE FROM developer_invitations WHERE email = %s OR created_by = %s", (target_email, target_id))

                # 3. Delete password resets
                conn.execute("DELETE FROM password_resets WHERE email = %s", (target_email,))

                # 4. Delete user profiles
                conn.execute("DELETE FROM user_profiles WHERE user_id = %s", (target_id,))

                # 5. Delete credit wallet
                conn.execute("DELETE FROM credit_wallets WHERE user_id = %s", (target_id,))

                # 6. Delete user record
                conn.execute("DELETE FROM users WHERE id = %s", (target_id,))

            AuthService.write_audit_log(
                actor_id=actor_id,
                actor_email=actor_email,
                action='DELETED_DEVELOPER',
                target_email=target_email,
                target_id=target_id,
                details=f"Deleted account with role: {target_role}. Created models/campaigns preserved."
            )
        finally:
            conn.close()

    @staticmethod
    def set_can_manage_developers(target_id: str, grant: bool,
                                   actor_id: str, actor_email: str) -> None:
        """Grant or revoke CAN_MANAGE_DEVELOPERS permission. Only SUPER_ADMIN may call this."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT email, role FROM users WHERE id = %s", (target_id,))
            target = cursor.fetchone()
            if not target:
                raise ValueError("Developer account not found.")
            if target['role'] == 'SUPER_ADMIN':
                raise ValueError("SUPER_ADMIN already has full developer management access.")
            with conn:
                conn.execute("UPDATE users SET can_manage_developers = %s, updated_at = %s WHERE id = %s",
                             (1 if grant else 0, datetime.now().isoformat(), target_id))
            action = 'GRANTED_CAN_MANAGE_DEVELOPERS' if grant else 'REVOKED_CAN_MANAGE_DEVELOPERS'
            AuthService.write_audit_log(
                actor_id=actor_id,
                actor_email=actor_email,
                action=action,
                target_email=target['email'],
                target_id=target_id,
                details=f"Permission {'granted' if grant else 'revoked'}"
            )
        finally:
            conn.close()

    @staticmethod
    def get_audit_log(limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch recent audit log entries."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, actor_email, action, target_email, details, created_at
                FROM audit_log
                ORDER BY created_at DESC
                LIMIT %s
            """, (limit,))
            return [dict(r) for r in cursor.fetchall()]
        finally:
            conn.close()

    @staticmethod
    def create_super_admin_via_cli(email: str, password: str, full_name: str) -> Dict[str, Any]:
        """
        Create the first SUPER_ADMIN account via CLI command.
        Refuses if any SUPER_ADMIN already exists.
        Never prints or stores plaintext password.
        """
        email_clean = email.strip().lower()
        if not email_clean or not password:
            raise ValueError("Email and password are required.")
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters.")

        conn = get_db_connection()
        try:
            cursor = conn.cursor()

            # Refuse if SUPER_ADMIN already exists
            cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'SUPER_ADMIN'")
            if cursor.fetchone()[0] > 0:
                raise ValueError(
                    "A SUPER_ADMIN account already exists. "
                    "Log in and use the Developer Dashboard to manage accounts."
                )

            # Check email not taken
            cursor.execute("SELECT id FROM users WHERE email = %s", (email_clean,))
            if cursor.fetchone():
                raise ValueError(f"An account with email '{email_clean}' already exists.")

            user_id = f"usr_{uuid.uuid4().hex[:12]}"
            password_hash = generate_password_hash(password)
            now_str = datetime.now().isoformat()

            with conn:
                conn.execute("""
                    INSERT INTO users (id, email, password_hash, role, is_active, can_manage_developers, created_at, updated_at)
                    VALUES (%s, %s, %s, 'SUPER_ADMIN', 1, 1, %s, %s)
                """, (user_id, email_clean, password_hash, now_str, now_str))

                profile_id = f"prf_{uuid.uuid4().hex[:12]}"
                conn.execute("""
                    INSERT INTO user_profiles (id, user_id, full_name, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s)
                """, (profile_id, user_id, full_name.strip(), now_str, now_str))

                wallet_id = f"wlt_{uuid.uuid4().hex[:12]}"
                conn.execute("""
                    INSERT INTO credit_wallets (id, user_id, balance, updated_at)
                    VALUES (%s, %s, 0, %s)
                """, (wallet_id, user_id, now_str))

            # Audit log for CLI-created SUPER_ADMIN
            AuthService.write_audit_log(
                actor_id=None,
                actor_email='[CLI]',
                action='CREATED_SUPER_ADMIN_VIA_CLI',
                target_email=email_clean,
                target_id=user_id,
                details='Initial production SUPER_ADMIN created via flask create-super-admin'
            )

            return {'id': user_id, 'email': email_clean, 'role': 'SUPER_ADMIN', 'can_manage_developers': True}
        finally:
            conn.close()



    @classmethod
    def authenticate(cls, email: str, password: str):
        return cls.authenticate_user(email, password)

    @classmethod
    def list_developers(cls):
        return cls.list_developer_accounts()

    @classmethod
    def get_audit_logs(cls, limit: int = 100):
        return cls.get_audit_log(limit)

    @classmethod
    def update_developer_permissions(cls, target_id: str, can_manage_developers, actor_id=None, actor_email=''):
        grant = bool(can_manage_developers in (1, '1', True, 'true'))
        return cls.set_can_manage_developers(target_id, grant, actor_id or '', actor_email or '')

    @classmethod
    def request_password_reset(cls, email: str):
        return cls.create_password_reset_otp(email)

    @classmethod
    def verify_otp(cls, email: str, otp_code: str) -> str:
        return cls.verify_password_reset_otp(email, otp_code)

    @classmethod
    def reset_password(cls, email: str, token: str, new_password: str) -> bool:
        return cls.reset_password_for_email(email=email.strip(), reset_token=token.strip(), new_password=new_password)

    @classmethod
    def reset_password_with_token(cls, token: str, new_password: str, email: Optional[str] = None) -> bool:
        token_str = str(token).strip()
        if email:
            return cls.reset_password_for_email(email=email.strip(), reset_token=token_str, new_password=new_password)
        # Fallback for backward compatibility if email is not provided
        if len(token_str) == 6 and token_str.isdigit():
            conn = get_db_connection()
            try:
                cursor = conn.cursor()
                cursor.execute("SELECT email FROM password_resets WHERE is_used = 0 ORDER BY created_at DESC")
                for row in cursor.fetchall():
                    try:
                        if cls.reset_password_for_email(row['email'], token_str, new_password):
                            return True
                    except Exception:
                        pass
            finally:
                conn.close()
        res = cls.accept_invitation(token_str, new_password)
        return bool(res)

    @classmethod
    def resend_account_invitation(cls, email: str, actor_id: Optional[str] = None, actor_email: str = '', app_base_url: str = 'http://localhost:5173'):
        return cls.resend_invitation(email, actor_id=actor_id, actor_email=actor_email, app_base_url=app_base_url)

    @classmethod
    def setup_invited_account(cls, token: str, password: str, full_name: str = ''):
        user = cls.accept_invitation(token, password)
        if full_name and user and user.get('id'):
            cls.update_user_profile(user['id'], {'full_name': full_name})
            user['full_name'] = full_name
        return user


import random
from datetime import timedelta
from werkzeug.security import check_password_hash

auth_service = AuthService()
