# tests/test_e2e_student_flow.py
import sys
import os
import json
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import werkzeug
if not hasattr(werkzeug, '__version__'):
    werkzeug.__version__ = '3.0.0'

from app import app
from database.schema import init_db, get_db_connection
from services.auth_service import auth_service
from services.wallet_service import wallet_service
from services.assessment_service import assessment_service
from services.pricing_service import pricing_service
from services.campaign_service import campaign_service
from services.payment_service import payment_service


class TestStudentFlowE2E(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        app.config['TESTING'] = True
        cls.client = app.test_client()

    def test_01_referral_discount_validation(self):
        """Test server-side referral discount calculation and validation."""
        plans = pricing_service.get_active_plans()
        self.assertTrue(len(plans) > 0)
        single_plan = [p for p in plans if p['credits'] == 1][0]

        # Valid coupon SCHOOL20 (20% off)
        res = campaign_service.validate_discount_code(
            user_id=None,
            plan_id=single_plan['id'],
            code_str='SCHOOL20'
        )
        self.assertTrue(res['valid'])
        self.assertEqual(res['code'], 'SCHOOL20')
        self.assertGreater(res['original_price'], 0)
        self.assertEqual(res['discount_amount'], round(res['original_price'] * 0.20, 2))
        self.assertEqual(res['final_price'], round(res['original_price'] - res['discount_amount'], 2))

        # Invalid coupon
        with self.assertRaises(ValueError):
            campaign_service.validate_discount_code(None, single_plan['id'], 'INVALID_CODE_99')

    def test_02_guest_assessment_and_account_claim(self):
        """Test guest taking assessment -> teaser -> signup -> claiming attempt -> pricing redirect."""
        # 1. Guest completes assessment
        guest_sess = "guest_sess_test_123"
        student_profile = {
            "name": "Arjun Sharma",
            "age": 17,
            "class": "12th",
            "education": "Science"
        }
        top_careers = [
            {"name": "Computer Systems Analyst", "score": 92.0},
            {"name": "Data Scientist", "score": 88.0}
        ]
        riasec_scores = {"R": 14, "I": 24, "A": 12, "S": 10, "E": 18, "C": 16}

        save_res = assessment_service.save_assessment_attempt(
            user_id=None,
            guest_session_id=guest_sess,
            student_profile=student_profile,
            riasec_scores=riasec_scores,
            riasec_code="IER",
            top_careers=top_careers
        )
        attempt_id = save_res['attempt_id']
        self.assertFalse(save_res['is_unlocked'])
        self.assertNotIn('primary_match_score', save_res['teaser'])
        self.assertIn("teaser_headline", save_res['teaser'])

        # 2. Guest registers account with attempt_id context
        unique_email = f"arjun_{attempt_id}@example.com"
        signup_res = self.client.post('/api/auth/signup', json={
            'email': unique_email,
            'password': 'Password123!',
            'full_name': 'Arjun Sharma',
            'phone': '9876543210',
            'education_level': '12th Science',
            'attempt_id': attempt_id
        })
        signup_data = signup_res.get_json()
        self.assertEqual(signup_res.status_code, 200)
        self.assertEqual(signup_data['status'], 'success')
        self.assertTrue('/account' in signup_data['redirect'] or f'/pricing?attempt_id={attempt_id}' in signup_data['redirect'])

        user_id = signup_data['user']['id']

        # 3. Verify attempt was claimed by this new user in DB
        user_attempts = assessment_service.get_user_attempts(user_id)
        self.assertEqual(len(user_attempts), 1)
        self.assertEqual(user_attempts[0]['id'], attempt_id)
        self.assertFalse(user_attempts[0]['is_unlocked'])

        # 4. Verify Account Summary API for this user
        with self.client.session_transaction() as sess:
            sess['user_id'] = user_id
            sess['email'] = unique_email
            sess['role'] = 'STUDENT'
            sess['full_name'] = 'Arjun Sharma'

        acc_res = self.client.get('/api/account/summary')
        acc_data = acc_res.get_json()
        self.assertEqual(acc_res.status_code, 200)
        self.assertEqual(acc_data['wallet']['balance'], 0)
        self.assertEqual(len(acc_data['attempts']), 1)
        self.assertEqual(acc_data['attempts'][0]['primary_career_title'], "Computer Systems Analyst")

        # 5. User checks out with SCHOOL20 discount
        order_res = self.client.post('/api/payments/create-order', json={
            'plan_id': 'plan_single',
            'referral_code': 'SCHOOL20',
            'attempt_id': attempt_id
        })
        order_data = order_res.get_json()
        self.assertEqual(order_res.status_code, 200)
        self.assertGreater(order_data['amount'], 0)
        self.assertGreater(order_data['display_amount'], 0)
        self.assertGreater(order_data['discount_amount'], 0)

        # 6. Verify payment in test mode and auto-unlock
        order_id = order_data['order_id']
        test_payment_id = f"pay_test_{attempt_id}"
        test_signature = "test_signature_valid"

        verify_res = self.client.post('/api/payments/verify', json={
            'razorpay_order_id': order_id,
            'razorpay_payment_id': test_payment_id,
            'razorpay_signature': test_signature,
            'attempt_id': attempt_id
        })
        verify_data = verify_res.get_json()
        self.assertEqual(verify_res.status_code, 200)
        self.assertEqual(verify_data['status'], 'success')
        self.assertEqual(verify_data.get('pending_attempt_id'), attempt_id)

        # 7. Check that redemption was logged in DB
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM campaign_redemptions WHERE user_id = ?", (user_id,))
            redemption = cursor.fetchone()
            self.assertIsNotNone(redemption)
            self.assertGreater(redemption['discount_applied'], 0)
        finally:
            conn.close()

        # Explicit Unlock Policy: Student uses 1 purchased credit to unlock assessment
        unlock_res = self.client.post(f'/api/assessment/{attempt_id}/unlock')
        self.assertEqual(unlock_res.status_code, 200)

        # 8. Check that full report is now accessible via /api/assessment/<id>/full
        full_res = self.client.get(f'/api/assessment/{attempt_id}/full')
        full_data = full_res.get_json()
        self.assertEqual(full_res.status_code, 200)
        self.assertTrue(full_data['is_unlocked'])
        self.assertEqual(full_data['full_report']['top_careers'][0]['name'], "Computer Systems Analyst")

        # 9. Permanent access: Calling unlock again is idempotent and deducts 0 credits
        unl_again = assessment_service.unlock_assessment(user_id, attempt_id)
        self.assertEqual(unl_again['status'], 'already_unlocked')

    def test_03_multiple_independent_assessments(self):
        """Test that a student can take multiple independent tests and both are preserved in history."""
        import uuid
        unique_email = f"student_multi_{uuid.uuid4().hex[:6]}@example.com"
        user = auth_service.create_user(unique_email, "Password123!", "Multi Student")
        user_id = user['id']

        # Assessment 1: Engineering
        ast1 = assessment_service.save_assessment_attempt(
            user_id=user_id,
            student_profile={"name": "Multi Student", "class": "10th"},
            riasec_scores={"R": 20, "I": 20, "A": 5, "S": 5, "E": 10, "C": 10},
            riasec_code="RIE",
            top_careers=[{"name": "Mechanical Engineer", "score": 90.0}]
        )

        # Assessment 2: Design
        ast2 = assessment_service.save_assessment_attempt(
            user_id=user_id,
            student_profile={"name": "Multi Student", "class": "10th"},
            riasec_scores={"R": 5, "I": 10, "A": 25, "S": 15, "E": 12, "C": 8},
            riasec_code="ASE",
            top_careers=[{"name": "UX / Product Designer", "score": 94.0}]
        )

        attempts = assessment_service.get_user_attempts(user_id)
        self.assertEqual(len(attempts), 2)
        # Verify reverse chronological ordering
        self.assertEqual(attempts[0]['id'], ast2['attempt_id'])
        self.assertEqual(attempts[0]['primary_career_title'], "UX / Product Designer")
        self.assertEqual(attempts[1]['id'], ast1['attempt_id'])
        self.assertEqual(attempts[1]['primary_career_title'], "Mechanical Engineer")

    def test_04_developer_campaign_creation_and_stats(self):
        """Test developer creating a new discount campaign and reading audit stats."""
        import uuid
        code_str = f"SUMMER{uuid.uuid4().hex[:4].upper()}"
        cmp = campaign_service.create_campaign_code(
            code=code_str,
            campaign_name="Summer Student Fest",
            valid_from="2026-01-01T00:00:00",
            valid_until="2026-12-31T23:59:59",
            max_uses=500,
            discount_type="PERCENTAGE",
            discount_value=30.0
        )
        self.assertEqual(cmp['code'], code_str)
        self.assertEqual(cmp['discount_type'], 'PERCENTAGE')
        self.assertEqual(cmp['discount_value'], 30.0)

        # Validate code discount
        disc = campaign_service.validate_discount_code(None, "plan_single", code_str)
        self.assertTrue(disc['valid'])
        self.assertGreater(disc['discount_amount'], 0)
        self.assertEqual(disc['final_price'], round(disc['original_price'] - disc['discount_amount'], 2))


if __name__ == '__main__':
    unittest.main()
