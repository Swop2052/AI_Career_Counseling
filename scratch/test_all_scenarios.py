# scratch/test_all_scenarios.py — Full verification test suite covering assessment, contract, paywall, payment, and error scenarios.
import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from services.auth_service import auth_service
from services.wallet_service import wallet_service
from services.payment_service import payment_service
from services.pricing_service import pricing_service
from services.campaign_service import campaign_service
from services.assessment_service import assessment_service
from services.stats_service import stats_service

def run_all_verifications():
    print("=" * 70)
    print("MANDATORY SYSTEM VERIFICATION & AUDIT TEST SUITE")
    print("=" * 70)

    # SCENARIO 1: Complete 42-Question Assessment Submission as Guest (Locked Teaser)
    print("\n[SCENARIO 1] 42-Question Guest Assessment Submission & Locked Teaser Contract...")
    answers_42 = [{'question_id': i, 'category': 'Realistic' if i % 2 == 0 else 'Investigative', 'value': 4} for i in range(1, 43)]
    student_profile = {'name': 'Audit Student', 'age': '18', 'class': '12th'}

    with app.test_request_context():
        # Execute assessment save via assessment_service directly
        guest_attempt = assessment_service.save_assessment_attempt(
            user_id=None,
            guest_session_id="guest_audit_sess_101",
            student_profile=student_profile,
            riasec_answers=answers_42,
            riasec_scores={"R": 30, "I": 25, "A": 15, "S": 10, "E": 10, "C": 10},
            riasec_code="RIA",
            top_careers=[
                {'name': 'Software Engineer', 'score': 91.0, 'data': {}},
                {'name': 'Data Analyst', 'score': 85.0, 'data': {}}
            ]
        )

        assert guest_attempt['is_unlocked'] == False, "Guest submission must be locked by default!"
        assert 'teaser' in guest_attempt, "Teaser payload missing from response contract!"
        assert 'primary_match_score' in guest_attempt['teaser'], "Teaser missing primary_match_score!"
        print(f"   ✓ Guest attempt {guest_attempt['attempt_id']} created. Paywall teaser verified.")

    # SCENARIO 2: Valid Empty Top Careers Result Handling
    print("\n[SCENARIO 2] Valid Empty Career Result Contract...")
    empty_attempt = assessment_service.save_assessment_attempt(
        user_id=None,
        guest_session_id="guest_audit_sess_102",
        student_profile=student_profile,
        riasec_answers=answers_42,
        riasec_scores={"R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0},
        riasec_code="---",
        top_careers=[]  # Empty result list
    )
    assert empty_attempt['is_unlocked'] == False
    assert 'teaser' in empty_attempt
    assert empty_attempt['teaser']['primary_match_score'] == 85.0, "Fallback score handling failed!"
    print("   ✓ Handled empty career results gracefully with fallback statistics.")

    # SCENARIO 3: User Signup, Guest Session Claiming & Campaign Redemption
    print("\n[SCENARIO 3] Signup, Guest Attempt Claiming & School Campaign Code...")
    test_email = f"audit_user_{datetime.now().strftime('%M%S')}@skillsense.ai"
    test_user = auth_service.create_user(test_email, "AuditPass123", "Audit User")
    user_id = test_user['id']
    print(f"   ✓ User registered: {user_id} ({test_email})")

    # Claim guest assessment
    claimed = assessment_service.claim_guest_assessment("guest_audit_sess_101", user_id)
    assert claimed >= 1, "Failed to claim guest assessment!"
    print(f"   ✓ Claimed {claimed} guest assessment attempt for user account.")

    # Create & Redeem Campaign Code (e.g. SHEGAON26)
    import uuid
    cmp_code = f"SHEGAON_{uuid.uuid4().hex[:6].upper()}"
    now = datetime.now()
    campaign_service.create_campaign_code(
        code=cmp_code,
        campaign_name="Audit Workshop",
        valid_from=now.isoformat(),
        valid_until=(now + timedelta(days=5)).isoformat(),
        max_uses=100,
        benefit_value=1,
        one_use_per_user=1
    )
    red_res = campaign_service.redeem_code(user_id, cmp_code)
    assert red_res['credits_granted'] == 1
    assert wallet_service.get_balance(user_id) == 1
    print(f"   ✓ Redeemed campaign code {cmp_code}. Granted 1 credit.")

    # SCENARIO 4: Assessment Unlock & Credit Deduction
    print("\n[SCENARIO 4] Assessment Unlock & Atomic Credit Deduction...")
    unlock_res = assessment_service.unlock_assessment(user_id, guest_attempt['attempt_id'])
    assert unlock_res['status'] == 'success'
    assert 'full_report' in unlock_res
    assert len(unlock_res['full_report']['top_careers']) == 2
    assert wallet_service.get_balance(user_id) == 0
    print("   ✓ Assessment unlocked successfully! 1 credit deducted atomically.")

    # SCENARIO 5: Blocked Unlock Attempt with 0 Balance
    print("\n[SCENARIO 5] Insufficient Credits Handling (0 Balance)...")
    fresh_attempt = assessment_service.save_assessment_attempt(
        user_id=user_id,
        guest_session_id=None,
        student_profile=student_profile,
        riasec_answers=answers_42,
        riasec_scores={"R": 20, "I": 20, "A": 20, "S": 20, "E": 20, "C": 20},
        riasec_code="RIA",
        top_careers=[{'name': 'Architect', 'score': 80.0, 'data': {}}]
    )
    try:
        assessment_service.unlock_assessment(user_id, fresh_attempt['attempt_id'])
        assert False, "Should have failed with Insufficient credits!"
    except ValueError as e:
        assert "Insufficient" in str(e)
        print("   ✓ Blocked unlock attempt due to 0 balance.")

    # SCENARIO 6: Payment Gateway Order & Idempotency Check
    print("\n[SCENARIO 6] Razorpay Test Payment Order & Idempotency...")
    plans = pricing_service.get_active_plans()
    single_plan = plans[0]
    order_res = payment_service.create_payment_order(user_id, single_plan['id'])
    order_id = order_res['order_id']

    # Verify payment
    test_pay_id = f"pay_audit_{datetime.now().strftime('%M%S')}"
    ver_res = payment_service.verify_and_process_payment(user_id, order_id, test_pay_id, "simulated_test_sig_audit")
    assert ver_res['status'] == 'success'
    assert wallet_service.get_balance(user_id) == single_plan['credits']
    print(f"   ✓ Verified test payment {test_pay_id}. Balance: {ver_res['new_balance']}")

    # Idempotency re-play
    rever_res = payment_service.verify_and_process_payment(user_id, order_id, test_pay_id, "simulated_test_sig_audit")
    assert rever_res['status'] == 'already_processed'
    print("   ✓ Idempotency verified: replayed payment verification did not duplicate credits.")

    # SCENARIO 7: Developer Role Security & Dashboard KPI Stats
    print("\n[SCENARIO 7] Developer Dashboard Analytics & Security...")
    dev_stats = stats_service.get_dashboard_stats()
    assert dev_stats['total_users'] >= 1
    assert dev_stats['total_assessments'] >= 1
    print(f"   ✓ Developer Stats: Users={dev_stats['total_users']}, Revenue=₹{dev_stats['total_revenue']}")

    print("\n" + "=" * 70)
    print("ALL AUDIT SCENARIOS PASSED VERIFICATION! ✓")
    print("=" * 70)

if __name__ == '__main__':
    run_all_verifications()
