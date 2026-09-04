"""
End-to-End Test Suite: No Automatic Unlock After Credit Purchase
Verifies that:
1. Purchasing credits adds credit to wallet but does NOT automatically unlock recent assessment.
2. 100% referral code redemption adds credit but does NOT automatically unlock recent assessment.
3. Scenario A: User clicks "Not Now" -> assessment remains locked, credit remains in wallet.
4. Scenario B: User clicks "Unlock Assessment" -> 1 credit deducted, targeted assessment unlocked.
5. Scenario C: Generic "Buy Credits" purchase -> credit added, no assessment context targeted.
6. Scenario D: 100% discount redemption -> credit added, explicit unlock required.
7. Scenario E: Multiple locked assessments (A & B) -> purchase from B context targets B; A remains locked.
8. Idempotency: Duplicate payment verification does not re-add credits or unlock assessments.
"""

import sys
if sys.platform == 'win32' and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

import unittest
import json
import uuid
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from database.schema import get_db_connection
from services.auth_service import auth_service
from services.assessment_service import assessment_service
from services.payment_service import payment_service
from services.campaign_service import campaign_service
from services.wallet_service import wallet_service


class TestNoAutoUnlockFlow(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False

        # Mock provider verification methods so we don't depend on external Razorpay servers
        self.original_verify_signature = payment_service.provider.verify_signature
        self.original_fetch_payment_status = payment_service.provider.fetch_payment_status
        self.original_create_order = payment_service.provider.create_order

        payment_service.provider.verify_signature = lambda sig_dict: True
        payment_service.provider.fetch_payment_status = lambda pid, amt: {'captured': True, 'status': 'captured'}
        payment_service.provider.create_order = lambda amount_in_subunits, currency, receipt, notes: {
            'order_id': f"order_{uuid.uuid4().hex[:14]}",
            'amount': amount_in_subunits,
            'currency': currency,
            'key_id': 'rzp_test_mock'
        }

    def tearDown(self):
        payment_service.provider.verify_signature = self.original_verify_signature
        payment_service.provider.fetch_payment_status = self.original_fetch_payment_status
        payment_service.provider.create_order = self.original_create_order

    def create_test_student(self, prefix="student"):
        unique_suffix = uuid.uuid4().hex[:8]
        email = f"{prefix}_{unique_suffix}@example.com"
        name = f"Test Student {unique_suffix}"
        password = "Password123!"

        user = auth_service.create_user(email, password, name)
        user_id = user['id']

        # Clear any initial bonus credits for test isolation
        current_bal = wallet_service.get_balance(user_id)
        if current_bal > 0:
            wallet_service.deduct_credits(user_id, current_bal, "test_setup_reset")

        return user_id, email, password

    def create_completed_locked_assessment(self, user_id):
        sample_profile = {"name": "Test Student", "education_level": "Undergraduate", "stream": "Science"}
        sample_scores = {"R": 18, "I": 24, "A": 15, "S": 20, "E": 14, "C": 12}
        top_careers = [{"career_name": "Data Scientist", "fit_score": 92}]

        attempt = assessment_service.save_assessment_attempt(
            user_id=user_id,
            student_profile=sample_profile,
            riasec_answers=[4]*42,
            riasec_scores=sample_scores,
            riasec_code="IRS",
            top_careers=top_careers
        )
        attempt_id = attempt['attempt_id']

        # Verify it is initially locked
        conn = get_db_connection()
        try:
            row = conn.execute("SELECT is_unlocked, unlocked_at FROM assessment_attempts WHERE id = ?", (attempt_id,)).fetchone()
            self.assertEqual(row['is_unlocked'], 0)
            self.assertIsNone(row['unlocked_at'])
        finally:
            conn.close()

        return attempt_id

    def login_client(self, email, password):
        login_res = self.client.post('/api/auth/login', 
            data=json.dumps({'email': email, 'password': password}),
            content_type='application/json'
        )
        self.assertEqual(login_res.status_code, 200)

    # -------------------------------------------------------------
    # SCENARIO A: Recent assessment + no credit -> purchase credit
    # -> Credit added, A STILL LOCKED, user can choose Not Now
    # -------------------------------------------------------------
    def test_scenario_a_credit_added_assessment_remains_locked(self):
        user_id, email, password = self.create_test_student("scen_a")
        attempt_id = self.create_completed_locked_assessment(user_id)
        self.login_client(email, password)

        # Step 1: Student creates payment order for 1 credit from Assessment A context
        order = payment_service.create_payment_order(
            user_id=user_id,
            plan_id='plan_single',
            attempt_id=attempt_id
        )
        order_id = order['order_id']
        fake_payment_id = f"pay_{uuid.uuid4().hex[:14]}"

        # Step 2: Payment completes and calls verify_and_process_payment
        result = payment_service.verify_and_process_payment(
            user_id=user_id,
            razorpay_order_id=order_id,
            razorpay_payment_id=fake_payment_id,
            razorpay_signature="simulated_sig",
            attempt_id=attempt_id
        )

        self.assertEqual(result['status'], 'success')
        self.assertEqual(result['credits_granted'], 1)
        self.assertEqual(result['pending_attempt_id'], attempt_id)

        # Step 3: CRITICAL CHECK - Wallet balance must be 1, but assessment MUST STILL BE LOCKED!
        bal = wallet_service.get_balance(user_id)
        self.assertEqual(bal, 1, "Wallet balance should be 1 credit")

        conn = get_db_connection()
        try:
            row = conn.execute("SELECT is_unlocked, unlocked_at FROM assessment_attempts WHERE id = ?", (attempt_id,)).fetchone()
            self.assertEqual(row['is_unlocked'], 0, "Assessment A must NOT be automatically unlocked!")
            self.assertIsNone(row['unlocked_at'], "unlocked_at must remain None")
        finally:
            conn.close()

        # Step 4: Student chooses "Not Now" (frontend simply redirects to /account without calling unlock API)
        acc_res = self.client.get('/api/account/summary')
        self.assertEqual(acc_res.status_code, 200)
        acc_data = acc_res.get_json()
        self.assertEqual(acc_data['wallet']['balance'], 1)

        # Teaser is still locked
        teaser_res = self.client.get(f'/api/assessment/{attempt_id}/teaser')
        self.assertEqual(teaser_res.status_code, 200)
        self.assertFalse(teaser_res.get_json()['is_unlocked'])

    # -------------------------------------------------------------
    # SCENARIO B: Purchase credit -> explicit Unlock Assessment
    # -> 1 credit deducted, A unlocked, full roadmap accessible
    # -------------------------------------------------------------
    def test_scenario_b_explicit_unlock_assessment(self):
        user_id, email, password = self.create_test_student("scen_b")
        attempt_id = self.create_completed_locked_assessment(user_id)
        self.login_client(email, password)

        # Add 1 credit via purchase
        order = payment_service.create_payment_order(
            user_id=user_id,
            plan_id='plan_single',
            attempt_id=attempt_id
        )
        order_id = order['order_id']
        fake_payment_id = f"pay_{uuid.uuid4().hex[:14]}"

        result = payment_service.verify_and_process_payment(
            user_id=user_id,
            razorpay_order_id=order_id,
            razorpay_payment_id=fake_payment_id,
            razorpay_signature="simulated_sig",
            attempt_id=attempt_id
        )
        self.assertEqual(result['status'], 'success')
        self.assertEqual(wallet_service.get_balance(user_id), 1)

        # Assessment is still locked before explicit unlock
        conn = get_db_connection()
        try:
            row_before = conn.execute("SELECT is_unlocked FROM assessment_attempts WHERE id = ?", (attempt_id,)).fetchone()
            self.assertEqual(row_before['is_unlocked'], 0)
        finally:
            conn.close()

        # Student explicitly clicks "Unlock Assessment"
        unlock_res = self.client.post(f'/api/assessment/{attempt_id}/unlock')
        self.assertEqual(unlock_res.status_code, 200)
        unlock_data = unlock_res.get_json()
        self.assertEqual(unlock_data['status'], 'success')
        self.assertEqual(unlock_data['credits_remaining'], 0)

        # Verify DB state: wallet deducted, assessment unlocked with timestamp
        self.assertEqual(wallet_service.get_balance(user_id), 0)
        conn = get_db_connection()
        try:
            row = conn.execute("SELECT is_unlocked, unlocked_at FROM assessment_attempts WHERE id = ?", (attempt_id,)).fetchone()
            self.assertEqual(row['is_unlocked'], 1)
            self.assertIsNotNone(row['unlocked_at'])
        finally:
            conn.close()

        # Verify full report is now accessible
        full_res = self.client.get(f'/api/assessment/{attempt_id}/full')
        self.assertEqual(full_res.status_code, 200)
        full_data = full_res.get_json()
        self.assertIn('full_report', full_data)

    # -------------------------------------------------------------
    # SCENARIO C: Generic Buy Credits (no attempt context)
    # -> Credit added, pending_attempt_id is None
    # -------------------------------------------------------------
    def test_scenario_c_generic_buy_credits_no_attempt_context(self):
        user_id, email, password = self.create_test_student("scen_c")
        self.login_client(email, password)

        order = payment_service.create_payment_order(
            user_id=user_id,
            plan_id='plan_single',
            attempt_id=None
        )
        order_id = order['order_id']
        fake_payment_id = f"pay_{uuid.uuid4().hex[:14]}"

        result = payment_service.verify_and_process_payment(
            user_id=user_id,
            razorpay_order_id=order_id,
            razorpay_payment_id=fake_payment_id,
            razorpay_signature="simulated_sig",
            attempt_id=None
        )
        self.assertEqual(result['status'], 'success')
        self.assertEqual(result['credits_granted'], 1)
        self.assertIsNone(result['pending_attempt_id'], "Generic purchase must not have a pending attempt ID")
        self.assertEqual(wallet_service.get_balance(user_id), 1)

    # -------------------------------------------------------------
    # SCENARIO D: 100% referral / zero-amount order
    # -> Credit redeemed, NOT auto unlocked, explicit unlock works
    # -------------------------------------------------------------
    def test_scenario_d_free_code_redemption_no_auto_unlock(self):
        user_id, email, password = self.create_test_student("scen_d")
        attempt_id = self.create_completed_locked_assessment(user_id)
        self.login_client(email, password)

        # Create a 100% free campaign code using campaign_service
        code_str = f"FREE100_{uuid.uuid4().hex[:6].upper()}"
        campaign_service.create_campaign_code(
            code=code_str,
            campaign_name="Test 100% Free",
            valid_from=datetime.now().isoformat(),
            valid_until=(datetime.now() + timedelta(days=30)).isoformat(),
            max_uses=10,
            discount_type="PERCENTAGE",
            discount_value=100.0,
            benefit_type="FREE_CREDITS",
            benefit_value=1.0
        )

        # Redeem via payment_service
        redeem_result = payment_service.redeem_zero_amount_order(
            user_id=user_id,
            plan_id="plan_single",
            referral_code=code_str,
            attempt_id=attempt_id
        )

        self.assertEqual(redeem_result['status'], 'success')
        self.assertEqual(redeem_result['credits_granted'], 1)
        self.assertEqual(redeem_result['pending_attempt_id'], attempt_id)

        # Balance increased by 1
        self.assertEqual(wallet_service.get_balance(user_id), 1)

        # CRITICAL: Assessment must still be locked
        conn = get_db_connection()
        try:
            row = conn.execute("SELECT is_unlocked, unlocked_at FROM assessment_attempts WHERE id = ?", (attempt_id,)).fetchone()
            self.assertEqual(row['is_unlocked'], 0, "100% promo redemption must NOT auto-unlock assessment!")
            self.assertIsNone(row['unlocked_at'])
        finally:
            conn.close()

        # Explicit unlock works
        unlock_res = self.client.post(f'/api/assessment/{attempt_id}/unlock')
        self.assertEqual(unlock_res.status_code, 200)
        self.assertEqual(wallet_service.get_balance(user_id), 0)

        conn = get_db_connection()
        try:
            row = conn.execute("SELECT is_unlocked FROM assessment_attempts WHERE id = ?", (attempt_id,)).fetchone()
            self.assertEqual(row['is_unlocked'], 1)
        finally:
            conn.close()

    # -------------------------------------------------------------
    # SCENARIO E: Multiple locked assessments (A & B)
    # Purchase from B context -> explicit unlock on B -> A remains locked
    # -------------------------------------------------------------
    def test_scenario_e_multiple_locked_assessments_isolation(self):
        user_id, email, password = self.create_test_student("scen_e")
        attempt_a = self.create_completed_locked_assessment(user_id)
        attempt_b = self.create_completed_locked_assessment(user_id)
        self.login_client(email, password)

        # Student purchases 1 credit from Assessment B context
        order = payment_service.create_payment_order(
            user_id=user_id,
            plan_id='plan_single',
            attempt_id=attempt_b
        )
        order_id = order['order_id']
        fake_payment_id = f"pay_{uuid.uuid4().hex[:14]}"

        result = payment_service.verify_and_process_payment(
            user_id=user_id,
            razorpay_order_id=order_id,
            razorpay_payment_id=fake_payment_id,
            razorpay_signature="simulated_sig",
            attempt_id=attempt_b
        )

        self.assertEqual(result['pending_attempt_id'], attempt_b)

        # Neither assessment should be unlocked automatically
        conn = get_db_connection()
        try:
            row_a = conn.execute("SELECT is_unlocked FROM assessment_attempts WHERE id = ?", (attempt_a,)).fetchone()
            row_b = conn.execute("SELECT is_unlocked FROM assessment_attempts WHERE id = ?", (attempt_b,)).fetchone()
            self.assertEqual(row_a['is_unlocked'], 0)
            self.assertEqual(row_b['is_unlocked'], 0)
        finally:
            conn.close()

        # Student explicitly unlocks B
        unlock_b = self.client.post(f'/api/assessment/{attempt_b}/unlock')
        self.assertEqual(unlock_b.status_code, 200)

        # Verify B is unlocked, but A strictly remains locked!
        conn = get_db_connection()
        try:
            row_a = conn.execute("SELECT is_unlocked FROM assessment_attempts WHERE id = ?", (attempt_a,)).fetchone()
            row_b = conn.execute("SELECT is_unlocked FROM assessment_attempts WHERE id = ?", (attempt_b,)).fetchone()
            self.assertEqual(row_a['is_unlocked'], 0, "Assessment A must strictly remain locked!")
            self.assertEqual(row_b['is_unlocked'], 1, "Assessment B must be unlocked!")
        finally:
            conn.close()

    # -------------------------------------------------------------
    # IDEMPOTENCY / REFRESH SAFETY
    # Re-verifying the same payment callback does NOT grant extra credits
    # and does NOT auto-unlock
    # -------------------------------------------------------------
    def test_idempotency_duplicate_verification(self):
        user_id, email, password = self.create_test_student("scen_idem")
        attempt_id = self.create_completed_locked_assessment(user_id)
        self.login_client(email, password)

        order = payment_service.create_payment_order(
            user_id=user_id,
            plan_id='plan_single',
            attempt_id=attempt_id
        )
        order_id = order['order_id']
        fake_payment_id = f"pay_{uuid.uuid4().hex[:14]}"

        # First verification
        res1 = payment_service.verify_and_process_payment(
            user_id=user_id,
            razorpay_order_id=order_id,
            razorpay_payment_id=fake_payment_id,
            razorpay_signature="simulated_sig",
            attempt_id=attempt_id
        )
        self.assertEqual(res1['status'], 'success')
        self.assertEqual(wallet_service.get_balance(user_id), 1)

        # Second verification (e.g. user reloads or webhook re-fires)
        res2 = payment_service.verify_and_process_payment(
            user_id=user_id,
            razorpay_order_id=order_id,
            razorpay_payment_id=fake_payment_id,
            razorpay_signature="simulated_sig",
            attempt_id=attempt_id
        )
        self.assertEqual(res2['status'], 'already_processed')
        # Balance must remain exactly 1 (no double credit)
        self.assertEqual(wallet_service.get_balance(user_id), 1)

        # Attempt must still remain locked
        conn = get_db_connection()
        try:
            row = conn.execute("SELECT is_unlocked FROM assessment_attempts WHERE id = ?", (attempt_id,)).fetchone()
            self.assertEqual(row['is_unlocked'], 0)
        finally:
            conn.close()


if __name__ == '__main__':
    unittest.main()
