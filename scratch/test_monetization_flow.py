# scratch/test_monetization_flow.py - Complete integration test for monetization system
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from database.schema import init_db
from services.auth_service import auth_service
from services.wallet_service import wallet_service
from services.payment_service import payment_service
from services.pricing_service import pricing_service
from services.campaign_service import campaign_service
from services.assessment_service import assessment_service
from services.stats_service import stats_service
from datetime import datetime, timedelta

def run_tests():
    print("=" * 60)
    print("RUNNING AUTOMATED MONETIZATION & ACCESS SYSTEM INTEGRATION TESTS")
    print("=" * 60)

    # 1. Test Auth: Signup & Login
    print("\n[TEST 1] User Registration & Auth...")
    test_email = f"student_{datetime.now().strftime('%M%S')}@example.com"
    test_pass = "Password123"

    user = auth_service.create_user(
        email=test_email,
        password=test_pass,
        full_name='Test Student',
        phone='9876543210',
        education_level='Class 12th'
    )
    user_id = user['id']
    print(f"   [SUCCESS] Registered user {user_id} ({test_email})")

    # Verify duplicate email prevention
    try:
        auth_service.create_user(email=test_email, password=test_pass, full_name='Dup')
        assert False, "Duplicate email should have raised ValueError!"
    except ValueError:
        print("   [SUCCESS] Prevented duplicate email registration.")

    # Authenticate
    auth_user = auth_service.authenticate_user(test_email, test_pass)
    assert auth_user is not None and auth_user['id'] == user_id
    print("   [SUCCESS] User authenticated successfully.")

    # 2. Test Guest Assessment & Paywall Teaser
    print("\n[TEST 2] Guest Assessment Submission & Locked Teaser...")
    guest_sess_id = f"guest_sess_{datetime.now().strftime('%M%S')}"

    saved_attempt = assessment_service.save_assessment_attempt(
        user_id=None,
        guest_session_id=guest_sess_id,
        student_profile={'name': 'Guest Student', 'age': '17', 'class': '12th'},
        riasec_answers=[{'question_id': i, 'category': 'Realistic', 'value': 5} for i in range(1, 43)],
        riasec_scores={"R": 35, "I": 20, "A": 15, "S": 10, "E": 10, "C": 10},
        riasec_code="RIA",
        top_careers=[
            {'name': 'Software Engineer', 'score': 92.0, 'data': {}},
            {'name': 'Data Scientist', 'score': 88.0, 'data': {}}
        ]
    )

    attempt_id = saved_attempt['attempt_id']
    assert saved_attempt['is_unlocked'] == False, "Guest submission must be locked by default!"
    assert 'teaser' in saved_attempt, "Teaser payload must be present!"
    assert saved_attempt['teaser']['primary_match_score'] == 92.0
    print(f"   [SUCCESS] Guest assessment attempt {attempt_id} saved with teaser statistics.")

    # Test claiming guest assessment
    claimed_count = assessment_service.claim_guest_assessment(guest_sess_id, user_id)
    assert claimed_count >= 1, "Guest assessment claim failed!"
    print("   [SUCCESS] Claimed guest assessment for newly registered user.")

    # 3. Test Campaign Referral Code System (e.g. SHEGAON26)
    print("\n[TEST 3] Campaign Code Creation & Redemption...")
    now = datetime.now()
    future = now + timedelta(days=7)
    code_str = f"SHEGAON{now.strftime('%S')}"

    code_res = campaign_service.create_campaign_code(
        code=code_str,
        campaign_name="Shegaon College Workshop",
        valid_from=now.isoformat(),
        valid_until=future.isoformat(),
        max_uses=300,
        benefit_value=1,
        one_use_per_user=1
    )
    assert code_res['code'] == code_str
    print(f"   [SUCCESS] Created campaign code {code_str}.")

    # Redeem campaign code for user
    red_res = campaign_service.redeem_code(user_id, code_str)
    assert red_res['status'] == 'success'
    assert red_res['credits_granted'] == 1
    print(f"   [SUCCESS] Redeemed {code_str}. New balance: {red_res['new_balance']}")

    # Prevent duplicate redemption
    try:
        campaign_service.redeem_code(user_id, code_str)
        assert False, "Duplicate redemption should have failed!"
    except ValueError:
        print("   [SUCCESS] Prevented duplicate campaign code redemption.")

    # 4. Test Assessment Unlock via Credit Wallet
    print("\n[TEST 4] Assessment Unlock & Credit Deduction...")
    unlock_res = assessment_service.unlock_assessment(user_id, attempt_id)
    assert unlock_res['status'] == 'success'
    assert 'full_report' in unlock_res
    assert len(unlock_res['full_report']['top_careers']) == 2
    print("   [SUCCESS] Assessment report unlocked and full career roadmap returned.")

    new_bal = wallet_service.get_balance(user_id)
    assert new_bal == 0, f"Expected balance 0, got {new_bal}"
    print("   [SUCCESS] 1 credit deducted atomically from wallet.")

    # Attempt second unlock with 0 credits -> expect ValueError refusal
    fresh_att = assessment_service.save_assessment_attempt(user_id=user_id, guest_session_id=None)
    try:
        assessment_service.unlock_assessment(user_id, fresh_att['attempt_id'])
        assert False, "Unlock with 0 balance should have failed!"
    except ValueError as ve:
        assert "Insufficient" in str(ve)
        print("   [SUCCESS] Correctly blocked unlock attempt due to 0 balance.")

    # 5. Test Razorpay Order Creation & Signature Verification (Test Mode)
    print("\n[TEST 5] Razorpay Payment Order & Idempotent Verification...")
    plans = pricing_service.get_active_plans()
    assert len(plans) >= 2, "Active pricing plans missing!"
    single_plan = plans[0]

    pay_res = payment_service.create_payment_order(user_id, single_plan['id'])
    order_id = pay_res['order_id']
    print(f"   [SUCCESS] Created Razorpay order {order_id} for ₹{pay_res['amount']}")

    # Verify payment
    test_pay_id = f"pay_test_{now.strftime('%M%S')}"
    test_sig = "simulated_test_sig_123"
    ver_res = payment_service.verify_and_process_payment(
        user_id=user_id,
        razorpay_order_id=order_id,
        razorpay_payment_id=test_pay_id,
        razorpay_signature=test_sig
    )
    assert ver_res['status'] == 'success'
    assert ver_res['credits_granted'] == single_plan['credits']
    print(f"   [SUCCESS] Verified payment & credited {ver_res['credits_granted']} credits. Balance: {ver_res['new_balance']}")

    # Replayed payment verification (idempotency check)
    rever_res = payment_service.verify_and_process_payment(
        user_id=user_id,
        razorpay_order_id=order_id,
        razorpay_payment_id=test_pay_id,
        razorpay_signature=test_sig
    )
    assert rever_res['status'] == 'already_processed'
    print("   [SUCCESS] Idempotency verified: replayed payment verification did not double-credit.")

    # 6. Test Developer Stats
    print("\n[TEST 6] Developer Analytics & KPIs...")
    stats = stats_service.get_dashboard_stats()
    assert stats['total_users'] >= 1
    assert stats['total_assessments'] >= 2
    assert stats['unlocked_assessments'] >= 1
    assert stats['successful_payments'] >= 1
    print(f"   [SUCCESS] Dashboard Stats: Users={stats['total_users']}, Assessments={stats['total_assessments']}, Unlocked={stats['unlocked_assessments']}, Revenue=₹{stats['total_revenue']}")

    print("\n" + "=" * 60)
    print("ALL MONETIZATION & ACCESS SYSTEM INTEGRATION TESTS PASSED! ✓")
    print("=" * 60)

if __name__ == '__main__':
    run_tests()
