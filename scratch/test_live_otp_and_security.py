# scratch/test_live_otp_and_security.py - Live Verification of OTP Flow, Security & Password Reset
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from database.schema import get_db_connection
from services.auth_service import auth_service
from services.email_service import email_service

def test_live_otp_security_flow():
    print("=" * 70)
    print("RUNNING LIVE OTP & PASSWORD RESET SECURITY VERIFICATION")
    print("=" * 70)

    test_email = "premzumble@gmail.com"
    initial_pass = "TestPass123!"
    new_pass = "NewSecurePass999!"

    # 1. Ensure test user exists in SQLite
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = ?", (test_email,))
        user_row = cursor.fetchone()
        if not user_row:
            print(f"[INFO] Creating test user account for {test_email}...")
            user = auth_service.create_user(test_email, initial_pass, "Prem Zumble")
            user_id = user['id']
        else:
            user_id = user_row['id']
            from werkzeug.security import generate_password_hash
            with conn:
                conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (generate_password_hash(initial_pass), user_id))
    finally:
        conn.close()

    # 2. Trigger Forgot Password Request (Generates OTP & sends email via SMTP)
    print(f"\n[STEP 1] Generating OTP & sending email via SMTP to {test_email}...")
    success = auth_service.create_password_reset_otp(test_email)
    assert success == True, "Failed to create password reset OTP!"
    print("   [OK] OTP generated & SMTP email delivered successfully!")

    # 3. Verify OTP generated in DB
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, otp_hash, created_at, expires_at FROM password_resets WHERE email = ? ORDER BY created_at DESC LIMIT 1", (test_email,))
        reset_row = cursor.fetchone()
        assert reset_row is not None, "No record found in password_resets!"
        print(f"   [OK] Verification record created in DB. Expires at: {reset_row['expires_at']}")
    finally:
        conn.close()

    # 4. Test Invalid OTP Rejection
    print("\n[STEP 2] Testing Invalid OTP Rejection ('000000')...")
    try:
        auth_service.verify_otp_and_reset_password(test_email, '000000', new_pass)
        assert False, "Expected invalid OTP to fail!"
    except ValueError as ve:
        assert "Incorrect" in str(ve) or "Invalid" in str(ve)
        print(f"   [OK] Correctly rejected invalid OTP. Error: {ve}")

    # 5. Inject known leading-zero OTP '004821' to test string format & leading zero preservation
    conn = get_db_connection()
    try:
        with conn:
            from werkzeug.security import generate_password_hash
            conn.execute("UPDATE password_resets SET otp_hash = ? WHERE id = ?", (generate_password_hash('004821'), reset_row['id']))
    finally:
        conn.close()

    # 6. Test OTP verification with spaces/pasted format (' 004821 \n')
    print("\n[STEP 3] Testing Pasted OTP Verification with Whitespace (' 004821 \\n')...")
    res_success = auth_service.verify_otp_and_reset_password(test_email, ' 004821 \n', new_pass)
    assert res_success == True
    print("   [OK] Successfully verified leading-zero OTP '004821' with whitespace & reset password!")

    # 7. Test Login with New Password
    print("\n[STEP 4] Authenticating with NEW Password...")
    auth_user = auth_service.authenticate_user(test_email, new_pass)
    assert auth_user is not None, "Failed to authenticate with new password!"
    print(f"   [OK] Authenticated successfully! User ID: {auth_user['id']}")

    # 8. Test Old Password Rejection
    print("\n[STEP 5] Authenticating with OLD Password (Must Fail)...")
    old_auth = auth_service.authenticate_user(test_email, initial_pass)
    assert old_auth is None, "Old password was not invalidated!"
    print("   [OK] Old password successfully rejected.")

    # 9. Verify NO Plaintext Passwords in DB or API
    print("\n[STEP 6] Security Check: Verifying NO Plaintext Passwords in DB...")
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT password_hash FROM users WHERE email = ?", (test_email,))
        pass_hash = cursor.fetchone()['password_hash']
        assert pass_hash.startswith("scrypt:") or pass_hash.startswith("pbkdf2:") or pass_hash.startswith("argon2:"), "Password is not standard Werkzeug hash!"
        assert initial_pass not in pass_hash and new_pass not in pass_hash, "Plaintext password leak in hash!"
        print("   [OK] Security audit passed: Passwords stored strictly as one-way cryptographic hashes.")
    finally:
        conn.close()

    print("\n" + "=" * 70)
    print("ALL LIVE OTP & SECURITY TESTS COMPLETED SUCCESSFULLY! [OK]")
    print("=" * 70)

if __name__ == '__main__':
    test_live_otp_security_flow()
