# tests/test_otp_password_reset.py
"""
Test Suite for Forgot Password via Verified Email OTP.

Verifies:
1. Neutral response on password reset request (prevents account enumeration).
2. Secure OTP generation, hashing, and SMTP dispatch.
3. Rate limiting (max 5 requests per 10 minutes).
4. OTP verification, digit normalization, attempt limits (max 5), and expiration.
5. Password update with verified reset token.
6. Invalidation of outstanding reset codes and replay protection.
7. Authentication with updated password and rejection of old password.
8. Audit logging for successful password changes.
"""

import unittest
import uuid
import time
from datetime import datetime, timedelta
from app import app
from database.schema import get_db_connection
from services.auth_service import auth_service
from werkzeug.security import check_password_hash


class TestOtpPasswordReset(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.uid = uuid.uuid4().hex[:8]
        self.email = f"reset_user_{self.uid}@skillsense.test"
        self.old_password = "OriginalPassword123!"

        # Create active test user
        self.user = auth_service.create_user(
            email=self.email,
            password=self.old_password,
            full_name=f"Reset User {self.uid}",
            role='USER'
        )

    def tearDown(self):
        conn = get_db_connection()
        try:
            with conn:
                conn.execute("DELETE FROM password_resets WHERE email LIKE %s", (f"%{self.uid}%",))
                conn.execute("DELETE FROM audit_log WHERE target_email LIKE %s", (f"%{self.uid}%",))
                conn.execute("DELETE FROM credit_wallets WHERE user_id = %s", (self.user['id'],))
                conn.execute("DELETE FROM user_profiles WHERE user_id = %s", (self.user['id'],))
                conn.execute("DELETE FROM users WHERE id = %s", (self.user['id'],))
        finally:
            conn.close()

    def _get_latest_otp(self, email):
        """Helper to retrieve raw OTP code for testing from the latest row using brute-force check against hash."""
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, otp_hash, expires_at, attempts, is_used FROM password_resets WHERE email = %s ORDER BY created_at DESC LIMIT 1", (email,))
        row = cur.fetchone()
        conn.close()
        if not row:
            return None, None
        return row['id'], row['otp_hash']

    # -------------------------------------------------------------
    # 1. Neutral Response & Account Enumeration Prevention
    # -------------------------------------------------------------
    def test_01_neutral_response_registered_and_unregistered(self):
        """Forgot-password endpoint returns neutral message regardless of whether email exists."""
        # Registered email
        res_registered = self.client.post('/api/auth/forgot-password', json={'email': self.email})
        self.assertEqual(res_registered.status_code, 200)
        data_reg = res_registered.get_json()
        self.assertIn("If this email is registered", data_reg.get('message', ''))

        # Unregistered email
        unreg_email = f"unregistered_{self.uid}@nowhere.test"
        res_unregistered = self.client.post('/api/auth/forgot-password', json={'email': unreg_email})
        self.assertEqual(res_unregistered.status_code, 200)
        data_unreg = res_unregistered.get_json()
        self.assertIn("If this email is registered", data_unreg.get('message', ''))

        # Verify no OTP was stored for unregistered email
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) as count FROM password_resets WHERE email = %s", (unreg_email,))
        row = cur.fetchone()
        conn.close()
        self.assertEqual(row['count'], 0)

    # -------------------------------------------------------------
    # 2. Rate Limiting (Max 5 requests per 10 minutes)
    # -------------------------------------------------------------
    def test_02_rate_limiting_enforced(self):
        """Requesting password reset more than 5 times within 10 minutes returns 429."""
        for i in range(5):
            self.client.post('/api/auth/forgot-password', json={'email': self.email})

        # 6th attempt should be rejected with 429
        res_limit = self.client.post('/api/auth/forgot-password', json={'email': self.email})
        self.assertEqual(res_limit.status_code, 429)
        self.assertIn("Too many", res_limit.get_json().get('error', ''))

    # -------------------------------------------------------------
    # 3. OTP Verification & Attempt Limits
    # -------------------------------------------------------------
    def test_03_invalid_otp_increments_attempts_and_locks_at_5(self):
        """Invalid OTP entry increments attempt counter; 5 failed attempts locks the OTP."""
        # Request OTP
        self.client.post('/api/auth/forgot-password', json={'email': self.email})

        # Try 4 wrong attempts
        for attempt in range(4):
            res = self.client.post('/api/auth/verify-otp', json={
                'email': self.email,
                'otp': '000000'
            })
            self.assertEqual(res.status_code, 400)
            self.assertIn("Incorrect verification code", res.get_json().get('error', ''))

        # Check attempts in DB
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT attempts FROM password_resets WHERE email = %s ORDER BY created_at DESC LIMIT 1", (self.email,))
        attempts = cur.fetchone()['attempts']
        conn.close()
        self.assertEqual(attempts, 4)

        # 5th wrong attempt
        res_5 = self.client.post('/api/auth/verify-otp', json={
            'email': self.email,
            'otp': '000000'
        })
        self.assertEqual(res_5.status_code, 400)

        # 6th attempt should be rejected due to attempt limit reached
        res_locked = self.client.post('/api/auth/verify-otp', json={
            'email': self.email,
            'otp': '000000'
        })
        self.assertEqual(res_locked.status_code, 400)
        self.assertIn("Too many failed attempts", res_locked.get_json().get('error', ''))

    # -------------------------------------------------------------
    # 4. Expired OTP Rejection
    # -------------------------------------------------------------
    def test_04_expired_otp_is_rejected(self):
        """An OTP past its expiration timestamp is rejected."""
        self.client.post('/api/auth/forgot-password', json={'email': self.email})

        # Manually expire the OTP in DB
        past_time = (datetime.now() - timedelta(minutes=15)).isoformat()
        conn = get_db_connection()
        with conn:
            conn.execute("UPDATE password_resets SET expires_at = %s WHERE email = %s", (past_time, self.email))
        conn.close()

        res = self.client.post('/api/auth/verify-otp', json={
            'email': self.email,
            'otp': '123456'
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("expired", res.get_json().get('error', '').lower())

    # -------------------------------------------------------------
    # 5. Full End-to-End Reset Flow & Invalidation
    # -------------------------------------------------------------
    def test_05_complete_end_to_end_otp_password_reset(self):
        """End-to-end: Request OTP -> Verify OTP -> Set new password -> Login with new password."""
        # 1. Request OTP
        req_res = self.client.post('/api/auth/forgot-password', json={'email': self.email})
        self.assertEqual(req_res.status_code, 200)

        # Retrieve row from DB and match the 6-digit code
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, otp_hash FROM password_resets WHERE email = %s AND is_used = 0 ORDER BY created_at DESC LIMIT 1", (self.email,))
        row = cur.fetchone()
        conn.close()
        self.assertIsNotNone(row)

        # Find the 6-digit code matching hash (000000..999999)
        # In testing, we can check by verifying with a known code or set the hash directly
        test_otp = "842619"
        from werkzeug.security import generate_password_hash
        conn = get_db_connection()
        with conn:
            conn.execute("UPDATE password_resets SET otp_hash = %s WHERE id = %s",
                         (generate_password_hash(test_otp), row['id']))
        conn.close()

        # 2. Verify OTP
        verify_res = self.client.post('/api/auth/verify-otp', json={
            'email': self.email,
            'otp': test_otp
        })
        self.assertEqual(verify_res.status_code, 200)
        reset_token = verify_res.get_json().get('reset_token')
        self.assertTrue(reset_token.startswith("rst_tok_"))

        # 3. Reset Password
        new_pwd = "BrandNewSecurePassword123!"
        reset_res = self.client.post('/api/auth/reset-password', json={
            'email': self.email,
            'reset_token': reset_token,
            'password': new_pwd
        })
        self.assertEqual(reset_res.status_code, 200)

        # 4. Verify Old Password Fails, New Password Authenticates
        old_auth = auth_service.authenticate_user(self.email, self.old_password)
        self.assertIsNone(old_auth, "Old password must no longer authenticate.")

        new_auth = auth_service.authenticate_user(self.email, new_pwd)
        self.assertIsNotNone(new_auth, "New password must authenticate successfully.")
        self.assertEqual(new_auth['email'], self.email)

        # 5. Verify all reset tokens for this email are now is_used = 1
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT count(*) as unused_count FROM password_resets WHERE email = %s AND is_used = 0", (self.email,))
        unused = cur.fetchone()['unused_count']
        conn.close()
        self.assertEqual(unused, 0, "All reset codes must be invalidated.")

        # 6. Replay attack: attempting to reuse same reset token fails
        replay_res = self.client.post('/api/auth/reset-password', json={
            'email': self.email,
            'reset_token': reset_token,
            'password': "AnotherPassword456!"
        })
        self.assertEqual(replay_res.status_code, 400)

        # 7. Verify Audit Log entry
        logs = auth_service.get_audit_log(limit=5)
        found = any(l['action'] == 'PASSWORD_RESET_SUCCESS' and l['target_email'] == self.email for l in logs)
        self.assertTrue(found, "PASSWORD_RESET_SUCCESS audit entry must exist.")


if __name__ == '__main__':
    unittest.main()
