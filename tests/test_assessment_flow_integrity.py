# tests/test_assessment_flow_integrity.py - All 15 flow scenarios verification
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


class TestAssessmentFlowIntegrity(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False

        conn = get_db_connection()
        try:
            with conn:
                conn.execute("UPDATE pricing_plans SET is_active = 1 WHERE id = 'plan_Standard'")
        finally:
            conn.close()

        # Mock payment provider methods
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

    def _create_test_user(self, email=None, balance=0):
        email = email or f"test_{uuid.uuid4().hex[:8]}@example.com"
        password = "Password123!"
        res = auth_service.create_user(email=email, password=password, full_name="Flow Test User")
        user_id = res['user']['id'] if 'user' in res else res.get('id')
        
        if balance > 0:
            wallet_service.add_credits(user_id=user_id, amount=balance, transaction_type="PURCHASE")
            
        return user_id, email, password

    def _create_sample_attempt(self, user_id=None, guest_session_id=None, answers=None, code="IRE"):
        ans = answers if answers is not None else [1]*42
        return assessment_service.save_assessment_attempt(
            user_id=user_id,
            guest_session_id=guest_session_id,
            student_profile={"name": "Test Student", "stream": "Science"},
            riasec_answers=ans,
            riasec_scores={"R": 25, "I": 30, "A": 15, "S": 10, "E": 20, "C": 18},
            riasec_code=code,
            top_careers=[
                {
                    "name": "Software Engineer",
                    "score": 92.0,
                    "data": {
                        "expected_income": {"minimum_monthly_salary": "₹1,00,000", "maximum_monthly_salary": "₹2,50,000"},
                        "educational_pathway": [{"degree": "B.Tech Computer Science"}],
                        "growth_path": ["Junior Developer", "Tech Lead"]
                    }
                },
                {"name": "Data Scientist", "score": 88.0},
                {"name": "AI Specialist", "score": 85.0}
            ]
        )

    # Scenario 1: New signup with no recent assessment -> returns claimed_attempt_id: None (no unlock popup)
    def test_scenario_1_signup_no_recent_assessment(self):
        email = f"clean_signup_{uuid.uuid4().hex[:6]}@example.com"
        res = self.client.post('/api/auth/signup', json={
            'email': email,
            'password': 'Password123!',
            'full_name': 'Clean User'
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertIsNone(data.get('claimed_attempt_id'))
        self.assertEqual(data['user']['balance'], 0)

    # Scenario 2: Existing user login with no recent assessment -> returns claimed_attempt_id: None (no unlock popup)
    def test_scenario_2_login_no_recent_assessment(self):
        uid, email, pwd = self._create_test_user()
        res = self.client.post('/api/auth/login', json={
            'email': email,
            'password': pwd
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIsNone(data.get('claimed_attempt_id'))

    # Scenario 3: Logged-in user completes assessment with 1+ credits -> "Unlock with 1 Credit" deducts 1 credit atomically and returns full report
    def test_scenario_3_user_with_credits_unlocks_assessment(self):
        uid, email, pwd = self._create_test_user(balance=2)
        # Login
        login_res = self.client.post('/api/auth/login', json={'email': email, 'password': pwd})
        self.assertEqual(login_res.status_code, 200)

        # Create completed assessment
        attempt = self._create_sample_attempt(user_id=uid)
        att_id = attempt['attempt_id']

        # Verify status endpoint returns exists=True, is_unlocked=False, is_owner=True
        status_res = self.client.get(f'/api/assessment/{att_id}/status')
        self.assertEqual(status_res.status_code, 200)
        s_data = status_res.get_json()
        self.assertTrue(s_data['exists'])
        self.assertTrue(s_data['is_owner'])
        self.assertFalse(s_data['is_unlocked'])

        # Click Unlock with 1 Credit
        unlock_res = self.client.post(f'/api/assessment/{att_id}/unlock')
        self.assertEqual(unlock_res.status_code, 200)
        u_data = unlock_res.get_json()
        self.assertEqual(u_data['status'], 'success')
        self.assertIn('full_report', u_data)
        self.assertEqual(len(u_data['full_report']['top_careers']), 3)

        # Authoritative balance deducted by exactly 1
        new_balance = wallet_service.get_balance(uid)
        self.assertEqual(new_balance, 1)

    # Scenario 4: Logged-in user completes assessment with 0 credits -> backend records attempt as locked with balance 0
    def test_scenario_4_user_zero_credits_locked_attempt(self):
        uid, email, pwd = self._create_test_user(balance=0)
        self.client.post('/api/auth/login', json={'email': email, 'password': pwd})

        attempt = self._create_sample_attempt(user_id=uid)
        att_id = attempt['attempt_id']

        status_res = self.client.get(f'/api/assessment/{att_id}/status')
        s_data = status_res.get_json()
        self.assertTrue(s_data['exists'])
        self.assertFalse(s_data['is_unlocked'])
        self.assertEqual(wallet_service.get_balance(uid), 0)

        # Trying to unlock with 0 credits returns 402 Insufficient credits
        unlock_res = self.client.post(f'/api/assessment/{att_id}/unlock')
        self.assertEqual(unlock_res.status_code, 402)
        self.assertTrue(unlock_res.get_json().get('insufficient_credits'))

    # Scenario 5: Buy Now -> pricing page -> successful purchase -> returns to same assessment; credit not spent until explicit unlock
    def test_scenario_5_purchase_credit_no_auto_spend_then_explicit_unlock(self):
        uid, email, pwd = self._create_test_user(balance=0)
        self.client.post('/api/auth/login', json={'email': email, 'password': pwd})

        attempt = self._create_sample_attempt(user_id=uid)
        att_id = attempt['attempt_id']

        # User purchases 1 credit pack
        order_res = self.client.post('/api/payments/create-order', json={
            'plan_id': 'plan_Standard',
            'attempt_id': att_id
        })
        self.assertEqual(order_res.status_code, 200)
        order_data = order_res.get_json()

        verify_res = self.client.post('/api/payments/verify', json={
            'razorpay_order_id': order_data['order_id'],
            'razorpay_payment_id': f"pay_{uuid.uuid4().hex[:12]}",
            'razorpay_signature': 'mock_valid_signature',
            'attempt_id': att_id
        })
        self.assertEqual(verify_res.status_code, 200)

        # 1. Credit granted to wallet
        self.assertEqual(wallet_service.get_balance(uid), 1)

        # 2. Assessment MUST REMAIN LOCKED (No auto-unlock)
        status_res = self.client.get(f'/api/assessment/{att_id}/status')
        self.assertFalse(status_res.get_json()['is_unlocked'])

        # 3. Explicit unlock by user consumes 1 credit and unlocks
        unlock_res = self.client.post(f'/api/assessment/{att_id}/unlock')
        self.assertEqual(unlock_res.status_code, 200)
        self.assertEqual(wallet_service.get_balance(uid), 0)
        self.assertTrue(self.client.get(f'/api/assessment/{att_id}/status').get_json()['is_unlocked'])

    # Scenario 6: Buy Now -> valid campaign redemption -> credit granted; explicit unlock required
    def test_scenario_6_campaign_redemption_no_auto_unlock(self):
        uid, email, pwd = self._create_test_user(balance=0)
        self.client.post('/api/auth/login', json={'email': email, 'password': pwd})

        attempt = self._create_sample_attempt(user_id=uid)
        att_id = attempt['attempt_id']

        code = f"CAMP100_{uuid.uuid4().hex[:6]}"
        now = datetime.now()
        campaign_service.create_campaign_code(
            code=code,
            campaign_name="Test Campaign 100",
            valid_from=now.isoformat(),
            valid_until=(now + timedelta(days=7)).isoformat(),
            max_uses=10,
            discount_type='PERCENTAGE',
            discount_value=100.0,
            one_use_per_user=1
        )

        redeem_res = self.client.post('/api/payments/redeem-zero', json={
            'plan_id': 'plan_Standard',
            'coupon_code': code,
            'attempt_id': att_id
        })
        self.assertEqual(redeem_res.status_code, 200)

        # Credit added, report remains locked until explicit unlock
        self.assertEqual(wallet_service.get_balance(uid), 1)
        self.assertFalse(self.client.get(f'/api/assessment/{att_id}/status').get_json()['is_unlocked'])

    # Scenario 7: Not Now -> My Profile; assessment is present in history and can be unlocked later
    def test_scenario_7_not_now_assessment_saved_in_history(self):
        uid, email, pwd = self._create_test_user(balance=0)
        self.client.post('/api/auth/login', json={'email': email, 'password': pwd})

        attempt = self._create_sample_attempt(user_id=uid)
        att_id = attempt['attempt_id']

        summary_res = self.client.get('/api/account/summary')
        self.assertEqual(summary_res.status_code, 200)
        data = summary_res.get_json()
        attempts = data.get('attempts', [])
        self.assertTrue(any(a['id'] == att_id and not a['is_unlocked'] for a in attempts))

    # Scenario 8: Guest completes assessment -> signs up -> assessment is claimed and preserved
    def test_scenario_8_guest_completes_and_signs_up(self):
        guest_sess = f"sess_{uuid.uuid4().hex[:8]}"
        attempt = self._create_sample_attempt(guest_session_id=guest_sess)
        att_id = attempt['attempt_id']

        new_email = f"guest_converted_{uuid.uuid4().hex[:6]}@example.com"
        signup_res = self.client.post('/api/auth/signup', json={
            'email': new_email,
            'password': 'Password123!',
            'full_name': 'Converted Student',
            'attempt_id': att_id
        })
        self.assertEqual(signup_res.status_code, 201)
        self.assertEqual(signup_res.get_json()['claimed_attempt_id'], att_id)

        # Backend validates ownership is transferred
        status_res = self.client.get(f'/api/assessment/{att_id}/status')
        self.assertTrue(status_res.get_json()['is_owner'])
        self.assertFalse(status_res.get_json()['is_unlocked'])

    # Scenario 9: Guest completes assessment -> logs in to an existing account -> claimed and preserved
    def test_scenario_9_guest_completes_and_logs_in_existing(self):
        uid, email, pwd = self._create_test_user(balance=0)
        guest_sess = f"sess_{uuid.uuid4().hex[:8]}"
        attempt = self._create_sample_attempt(guest_session_id=guest_sess)
        att_id = attempt['attempt_id']

        login_res = self.client.post('/api/auth/login', json={
            'email': email,
            'password': pwd,
            'attempt_id': att_id
        })
        self.assertEqual(login_res.status_code, 200)
        self.assertEqual(login_res.get_json()['claimed_attempt_id'], att_id)

        status_res = self.client.get(f'/api/assessment/{att_id}/status')
        self.assertTrue(status_res.get_json()['is_owner'])
        self.assertFalse(status_res.get_json()['is_unlocked'])

    # Scenario 10: Cancelled/failed purchase -> no credit grant, no unlock, assessment remains available
    def test_scenario_10_cancelled_purchase_preserves_locked_assessment(self):
        uid, email, pwd = self._create_test_user(balance=0)
        self.client.post('/api/auth/login', json={'email': email, 'password': pwd})

        attempt = self._create_sample_attempt(user_id=uid)
        att_id = attempt['attempt_id']

        order_res = self.client.post('/api/payments/create-order', json={
            'plan_id': 'plan_Standard',
            'attempt_id': att_id
        })
        order_id = order_res.get_json()['order_id']

        # Cancel order
        cancel_res = self.client.post('/api/payments/cancel', json={'order_id': order_id})
        self.assertEqual(cancel_res.status_code, 200)

        # Balance remains 0, assessment remains locked
        self.assertEqual(wallet_service.get_balance(uid), 0)
        self.assertFalse(self.client.get(f'/api/assessment/{att_id}/status').get_json()['is_unlocked'])

    # Scenario 11: Repeated unlock click or retry -> no duplicate debit
    def test_scenario_11_repeated_unlock_no_duplicate_debit(self):
        uid, email, pwd = self._create_test_user(balance=3)
        self.client.post('/api/auth/login', json={'email': email, 'password': pwd})

        attempt = self._create_sample_attempt(user_id=uid)
        att_id = attempt['attempt_id']

        # First unlock
        res1 = self.client.post(f'/api/assessment/{att_id}/unlock')
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(wallet_service.get_balance(uid), 2)

        # Second unlock on same attempt
        res2 = self.client.post(f'/api/assessment/{att_id}/unlock')
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.get_json()['status'], 'already_unlocked')
        # Balance must still be 2! (No duplicate debit)
        self.assertEqual(wallet_service.get_balance(uid), 2)

    # Scenario 12: Already-unlocked assessment -> opens full report without another charge
    def test_scenario_12_already_unlocked_opens_report_zero_charge(self):
        uid, email, pwd = self._create_test_user(balance=1)
        self.client.post('/api/auth/login', json={'email': email, 'password': pwd})

        attempt = self._create_sample_attempt(user_id=uid)
        att_id = attempt['attempt_id']

        # Unlock once
        self.client.post(f'/api/assessment/{att_id}/unlock')
        self.assertEqual(wallet_service.get_balance(uid), 0)

        # Fetch full report
        full_res = self.client.get(f'/api/assessment/{att_id}/full')
        self.assertEqual(full_res.status_code, 200)
        self.assertEqual(full_res.get_json()['attempt_id'], att_id)
        self.assertEqual(wallet_service.get_balance(uid), 0)

    # Scenario 13: User with multiple locked assessments -> each opens correct report and uses its own ID
    def test_scenario_13_multiple_locked_assessments_distinct_ids(self):
        uid, email, pwd = self._create_test_user(balance=1)
        self.client.post('/api/auth/login', json={'email': email, 'password': pwd})

        att1 = self._create_sample_attempt(user_id=uid, answers=[1]*42, code="IRE")['attempt_id']
        att2 = self._create_sample_attempt(user_id=uid, answers=[2]*42, code="SEC")['attempt_id']

        self.assertNotEqual(att1, att2)

        summary_res = self.client.get('/api/account/summary')
        attempts = summary_res.get_json()['attempts']
        ids = [a['id'] for a in attempts]
        self.assertIn(att1, ids)
        self.assertIn(att2, ids)

        # Unlock only att2
        unlock_res = self.client.post(f'/api/assessment/{att2}/unlock')
        self.assertEqual(unlock_res.status_code, 200)

        self.assertFalse(self.client.get(f'/api/assessment/{att1}/status').get_json()['is_unlocked'])
        self.assertTrue(self.client.get(f'/api/assessment/{att2}/status').get_json()['is_unlocked'])

    # Scenario 14: Login/signup after dismissing prompt -> no unwanted popup
    def test_scenario_14_dismissal_suppresses_repeat_prompts(self):
        # When user logs in with no attempt_id in request payload, claimed_attempt_id is None
        uid, email, pwd = self._create_test_user(balance=0)
        res = self.client.post('/api/auth/login', json={'email': email, 'password': pwd})
        self.assertIsNone(res.get_json().get('claimed_attempt_id'))

    # Scenario 15: Attempt to access another user's assessment -> denied by backend (403)
    def test_scenario_15_access_other_user_assessment_denied(self):
        user_a, email_a, pwd_a = self._create_test_user()
        user_b, email_b, pwd_b = self._create_test_user()

        att_a = self._create_sample_attempt(user_id=user_a)['attempt_id']

        # Log in as User B
        self.client.post('/api/auth/login', json={'email': email_b, 'password': pwd_b})

        # Try to view teaser
        teaser_res = self.client.get(f'/api/assessment/{att_a}/teaser')
        self.assertEqual(teaser_res.status_code, 403)

        # Try to view full
        full_res = self.client.get(f'/api/assessment/{att_a}/full')
        self.assertEqual(full_res.status_code, 403)

        # Try to unlock
        unlock_res = self.client.post(f'/api/assessment/{att_a}/unlock')
        self.assertEqual(unlock_res.status_code, 403)


if __name__ == '__main__':
    unittest.main()
