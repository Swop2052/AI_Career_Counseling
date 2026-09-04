# scratch/test_section48_features.py - Verification for Forgot Password OTP, Profile Editor & Snapshot Immutability
import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from database.schema import get_db_connection
from services.auth_service import auth_service
from services.assessment_service import assessment_service

def test_section_48():
    print("=" * 70)
    print("RUNNING SECTION 48 VERIFICATION TESTS (AUTH, OTP, PROFILE)")
    print("=" * 70)

    # 1. Test User Signup & Profile Creation
    test_email = f"student_s48_{datetime.now().strftime('%M%S')}@skillsense.ai"
    orig_pass = "OrigPassword123"
    new_pass = "NewSecretPass456"

    user = auth_service.create_user(
        email=test_email,
        password=orig_pass,
        full_name="Section 48 Student",
        phone="9876543210",
        education_level="Class 12th",
        city="Mumbai",
        state="Maharashtra"
    )
    user_id = user['id']
    print(f"[TEST 1] Registered user {user_id} ({test_email})")

    # Verify Profile Completeness calculation
    prof = auth_service.get_user_by_id(user_id)
    completeness = auth_service.get_profile_completeness(prof)
    assert completeness == 100, f"Expected 100% completeness, got {completeness}%"
    print(f"   ✓ Calculated profile completeness: {completeness}%")

    # 2. Test Assessment Profile Snapshot Immutability
    print("\n[TEST 2] Historical Assessment Profile Snapshot Immutability...")
    august_profile = {'name': 'Section 48 Student', 'education': 'Class 12th', 'city': 'Mumbai'}
    attempt = assessment_service.save_assessment_attempt(
        user_id=user_id,
        guest_session_id=None,
        student_profile=august_profile,
        riasec_answers=[],
        riasec_scores={"R": 20, "I": 20},
        riasec_code="RI",
        top_careers=[{'name': 'Engineer', 'score': 90.0, 'data': {}}]
    )
    attempt_id = attempt['attempt_id']

    # Update profile in September
    auth_service.update_user_profile(user_id, {
        'full_name': 'Section 48 Graduate',
        'education_level': 'Graduate',
        'city': 'Pune',
        'state': 'Maharashtra',
        'phone': '9876543210'
    })
    print("   ✓ Updated live user profile to Graduate in Pune.")

    # Verify historical assessment snapshot remains unchanged!
    teaser_data = assessment_service.get_teaser(attempt_id)
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT student_profile FROM assessment_attempts WHERE id = ?", (attempt_id,))
        snap_json = cursor.fetchone()['student_profile']
        import json
        snap_profile = json.loads(snap_json)
        assert snap_profile['education'] == 'Class 12th', "Historical profile snapshot was mutated!"
        assert snap_profile['city'] == 'Mumbai', "Historical profile snapshot city was mutated!"
        print("   ✓ Immutability verified: August assessment snapshot preserved 'Class 12th / Mumbai' context.")
    finally:
        conn.close()

    # 3. Test Forgot Password OTP Generation & Verification
    print("\n[TEST 3] Password Reset OTP Generation & Verification...")
    auth_service.create_password_reset_otp(test_email)

    # Fetch stored OTP for testing
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT otp_hash FROM password_resets WHERE email = ? ORDER BY created_at DESC LIMIT 1", (test_email,))
        row = cursor.fetchone()
        assert row is not None, "OTP was not saved in password_resets table!"
        print("   ✓ Cryptographic OTP created & saved in password_resets table.")
    finally:
        conn.close()

    # Test incorrect OTP refusal
    try:
        auth_service.verify_otp_and_reset_password(test_email, "000000", new_pass)
        assert False, "Incorrect OTP should have been rejected!"
    except ValueError as e:
        assert "Incorrect" in str(e)
        print("   ✓ Correctly rejected invalid OTP.")

    # In test mode, get actual code by checking code list or mocking
    # Perform reset with correct password via auth_service logic
    conn = get_db_connection()
    try:
        with conn:
            # Set known test OTP for deterministic verification
            from werkzeug.security import generate_password_hash
            conn.execute("UPDATE password_resets SET otp_hash = ? WHERE email = ?", (generate_password_hash("123456"), test_email))
    finally:
        conn.close()

    reset_success = auth_service.verify_otp_and_reset_password(test_email, "123456", new_pass)
    assert reset_success == True
    print("   ✓ Successfully reset password with valid OTP.")

    # Authenticate with new password
    auth_user = auth_service.authenticate_user(test_email, new_pass)
    assert auth_user is not None and auth_user['id'] == user_id
    print("   ✓ Authenticated successfully with NEW password.")

    # Authenticate with old password (must fail)
    old_auth = auth_service.authenticate_user(test_email, orig_pass)
    assert old_auth is None
    print("   ✓ Old password invalidated.")

    print("\n" + "=" * 70)
    print("ALL SECTION 48 VERIFICATION TESTS PASSED! ✓")
    print("=" * 70)

if __name__ == '__main__':
    test_section_48()
