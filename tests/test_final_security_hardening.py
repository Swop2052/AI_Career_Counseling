# tests/test_final_security_hardening.py - Final Production Security Hardening & Business Logic Verification
import unittest
import uuid
import json
import threading
from datetime import datetime, timedelta
from app import app
from database.schema import init_db, get_db_connection
from services.auth_service import auth_service, AuthService
from services.wallet_service import wallet_service
from services.pricing_service import pricing_service
from services.campaign_service import campaign_service
from services.payment_service import payment_service
from services.assessment_service import assessment_service
from core.education import SUPPORTED_CLASS_YEAR_OPTIONS, normalize_class_year, is_valid_class_year


class TestFinalSecurityHardening(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def setUp(self):
        self.app = app
        self.client = app.test_client()
        self.app.config['TESTING'] = True

    # ----------------------------------------------------------------------
    # 1. CLASS / YEAR VALIDATION TESTS
    # ----------------------------------------------------------------------
    def test_class_year_validation_and_normalization(self):
        """Verify controlled Class/Year options are accepted and arbitrary strings rejected."""
        # 1. Canonical options must all be valid
        self.assertTrue(is_valid_class_year("7th"))
        self.assertTrue(is_valid_class_year("10th"))
        self.assertTrue(is_valid_class_year("12th"))
        self.assertTrue(is_valid_class_year("Undergraduate — 1st Year"))
        self.assertTrue(is_valid_class_year("Undergraduate — 4th Year"))
        self.assertTrue(is_valid_class_year("Postgraduate — 1st Year"))
        self.assertTrue(is_valid_class_year("Diploma"))
        self.assertTrue(is_valid_class_year("Other"))

        # 2. Legacy / Alias normalizations must cleanly map
        self.assertEqual(normalize_class_year("Class 10"), "10th")
        self.assertEqual(normalize_class_year("Class 12"), "12th")
        self.assertEqual(normalize_class_year("1st Year College"), "Undergraduate — 1st Year")

        # 3. Arbitrary / injection strings must be rejected
        self.assertIsNone(normalize_class_year("hacker_stage"))
        self.assertIsNone(normalize_class_year("DROP TABLE users;"))
        self.assertIsNone(normalize_class_year("InvalidClass99"))
        self.assertIsNone(normalize_class_year(""))

        # 4. API level validation rejection
        email = f"student_{uuid.uuid4().hex[:8]}@example.com"
        pwd = "SecurePassword123!"
        user = auth_service.create_user(email=email, password=pwd, full_name="Akash Verma")
        self.client.post('/api/auth/login', json={'email': email, 'password': pwd})

        # Put with arbitrary classYear should be rejected with 400
        res_bad = self.client.put('/api/auth/profile', json={'classYear': 'ArbitraryString123'})
        self.assertEqual(res_bad.status_code, 400)
        self.assertIn('classYear', str(res_bad.get_json()))

        # Put with valid canonical classYear should succeed
        res_good = self.client.put('/api/auth/profile', json={'classYear': 'Undergraduate — 2nd Year'})
        self.assertEqual(res_good.status_code, 200)
        self.assertEqual(res_good.get_json()['user']['class_year'], 'Undergraduate — 2nd Year')

    # ----------------------------------------------------------------------
    # 2. CREDIT CONCURRENCY & DOUBLE-CLICK PROTECTION
    # ----------------------------------------------------------------------
    def test_credit_double_click_concurrency(self):
        """
        Test 1: User has exactly 1 credit.
        User fires unlock request twice concurrently.
        Expected: exactly 1 credit deducted, report unlocked, second request succeeds with 0 credit deduction.
        """
        email = f"doubleclick_{uuid.uuid4().hex[:8]}@example.com"
        pwd = "Password123!"
        user = auth_service.create_user(email=email, password=pwd, full_name="Concurrency Student")
        uid = user['id']

        # Grant exactly 1 credit
        wallet_service.add_credits(uid, 1, 'TEST_CREDIT')
        self.assertEqual(wallet_service.get_balance(uid), 1)

        # Create locked attempt owned by this user
        attempt = assessment_service.save_assessment_attempt(
            user_id=uid,
            student_profile={'fullName': 'Concurrency Student', 'age': 18, 'classYear': '12th'},
            top_careers=[{'name': 'Software Engineer', 'score': 92.0}]
        )
        attempt_id = attempt['attempt_id']

        # Fire unlock via service concurrently
        results = []
        errors = []

        def do_unlock():
            try:
                res = assessment_service.unlock_assessment(uid, attempt_id)
                results.append(res)
            except Exception as e:
                errors.append(e)

        t1 = threading.Thread(target=do_unlock)
        t2 = threading.Thread(target=do_unlock)
        t1.start()
        t2.start()
        t1.join()
        t2.join()

        # Both calls completed without unhandled exceptions
        self.assertEqual(len(results), 2)
        # Remaining balance must be exactly 0 (NOT negative, NOT -1)
        final_balance = wallet_service.get_balance(uid)
        self.assertEqual(final_balance, 0)

        # One call was initial unlock, the other was already_unlocked
        statuses = [r.get('status') for r in results]
        self.assertIn('success', statuses)
        self.assertIn('already_unlocked', statuses)

    # ----------------------------------------------------------------------
    # 3. NEGATIVE BALANCE MANIPULATION PREVENTION
    # ----------------------------------------------------------------------
    def test_zero_credit_tampered_unlock(self):
        """
        Test 2: User has 0 credits.
        Attempt to send manipulated request or unlock attempt.
        Expected: Rejected with 402/400; balance remains 0.
        """
        email = f"zerocredit_{uuid.uuid4().hex[:8]}@example.com"
        pwd = "Password123!"
        user = auth_service.create_user(email=email, password=pwd, full_name="Zero Credit Student")
        uid = user['id']
        self.assertEqual(wallet_service.get_balance(uid), 0)

        attempt = assessment_service.save_assessment_attempt(
            user_id=uid,
            student_profile={'fullName': 'Zero Credit Student', 'age': 17, 'classYear': '11th'},
            top_careers=[{'name': 'Data Scientist', 'score': 90.0}]
        )
        attempt_id = attempt['attempt_id']

        self.client.post('/api/auth/login', json={'email': email, 'password': pwd})

        # Client attempts to unlock with manipulated payload claiming 1 credit
        res = self.client.post(f'/api/assessment/{attempt_id}/unlock', json={
            'credits': 1,
            'credits_to_deduct': 0,
            'is_unlocked': True
        })
        self.assertEqual(res.status_code, 402)
        self.assertTrue(res.get_json().get('insufficient_credits'))
        self.assertEqual(wallet_service.get_balance(uid), 0)

    # ----------------------------------------------------------------------
    # 4. PRICE & DISCOUNT TAMPERING IN PAYMENT CREATION
    # ----------------------------------------------------------------------
    def test_price_and_discount_tampering_ignored(self):
        """
        Test 3 & 4: Client modifies intercepted request with manipulated amount, price, credits, or discount.
        Expected: Server ignores client financial parameters and computes price and credits strictly from database plan.
        """
        email = f"tamper_{uuid.uuid4().hex[:8]}@example.com"
        pwd = "Password123!"
        user = auth_service.create_user(email=email, password=pwd, full_name="Tamper Student")
        self.client.post('/api/auth/login', json={'email': email, 'password': pwd})

        # Find active plan
        active_plans = [p for p in pricing_service.get_all_plans() if p.get('is_active')]
        self.assertTrue(len(active_plans) > 0, "At least one active plan must exist")
        plan = active_plans[0]
        actual_price = float(plan['price'])
        expected_subunits = int(round(actual_price * 100))

        # Intercepted request attempting to pay 1 rupee for 1000 credits with 99% fake discount
        order_res = self.client.post('/api/payments/create-order', json={
            'plan_id': plan['id'],
            'amount': 100,            # Tampered: 1 rupee
            'price': 1.0,             # Tampered: 1 rupee
            'credits': 1000,          # Tampered: 1000 credits
            'discount': 99.0,         # Tampered: 99% discount
            'discount_amount': 598.0  # Tampered
        })
        self.assertEqual(order_res.status_code, 200)
        order_data = order_res.get_json()

        # Authoritative order amount must match the database plan (NOT 100 paise)
        self.assertEqual(order_data['amount'], expected_subunits)

    # ----------------------------------------------------------------------
    # 5. USER ID / SESSION IDENTITY TAMPERING
    # ----------------------------------------------------------------------
    def test_user_id_tampering_ignored(self):
        """
        Test 5: Client sends request specifying a different user_id.
        Expected: Server strictly uses authenticated session identity, ignoring client-provided user_id.
        """
        # Create victim and attacker
        victim = auth_service.create_user(email=f"victim_{uuid.uuid4().hex[:8]}@example.com", password="Password123!", full_name="Victim User")
        attacker = auth_service.create_user(email=f"attacker_{uuid.uuid4().hex[:8]}@example.com", password="Password123!", full_name="Attacker User")

        wallet_service.add_credits(victim['id'], 5, 'TEST_CREDIT')
        self.assertEqual(wallet_service.get_balance(victim['id']), 5)
        self.assertEqual(wallet_service.get_balance(attacker['id']), 0)

        # Attacker logs in
        self.client.post('/api/auth/login', json={'email': attacker['email'], 'password': 'Password123!'})

        # Attacker attempts to modify victim's profile by injecting victim's user_id
        res = self.client.put('/api/auth/profile', json={
            'user_id': victim['id'],
            'fullName': 'Hacked Name'
        })
        self.assertEqual(res.status_code, 200)

        # Victim's profile must be untouched; attacker's own profile was updated
        db_victim = auth_service.get_user_by_id(victim['id'])
        db_attacker = auth_service.get_user_by_id(attacker['id'])
        self.assertEqual(db_victim['full_name'], 'Victim User')
        self.assertEqual(db_attacker['full_name'], 'Hacked Name')

    # ----------------------------------------------------------------------
    # 6. IDOR ASSESSMENT PROTECTION
    # ----------------------------------------------------------------------
    def test_idor_assessment_protection(self):
        """
        Test 6: User A attempts to access User B's /api/assessment/<attempt_id>/full.
        Expected: HTTP 403 Forbidden.
        """
        user_a = auth_service.create_user(email=f"usera_{uuid.uuid4().hex[:8]}@example.com", password="Password123!", full_name="Student A")
        user_b = auth_service.create_user(email=f"userb_{uuid.uuid4().hex[:8]}@example.com", password="Password123!", full_name="Student B")

        # User B creates and unlocks an assessment
        wallet_service.add_credits(user_b['id'], 1, 'TEST_CREDIT')
        attempt_b = assessment_service.save_assessment_attempt(
            user_id=user_b['id'],
            student_profile={'fullName': 'Student B', 'age': 16, 'classYear': '10th'},
            top_careers=[{'name': 'Doctor', 'score': 95.0}]
        )
        assessment_service.unlock_assessment(user_b['id'], attempt_b['attempt_id'])

        # User A logs in
        self.client.post('/api/auth/login', json={'email': user_a['email'], 'password': 'Password123!'})

        # User A attempts to view User B's full report
        res = self.client.get(f"/api/assessment/{attempt_b['attempt_id']}/full")
        self.assertEqual(res.status_code, 403)
        self.assertIn('Unauthorized', res.get_json().get('error', ''))

    # ----------------------------------------------------------------------
    # 7. PAYMENT REPLAY PREVENTION
    # ----------------------------------------------------------------------
    def test_payment_replay_prevention(self):
        """
        Test 7: Replay a successful payment verification request.
        Expected: Credits granted only once; second call returns already_processed without duplicate credits.
        """
        email = f"replay_{uuid.uuid4().hex[:8]}@example.com"
        pwd = "Password123!"
        user = auth_service.create_user(email=email, password=pwd, full_name="Replay Student")
        uid = user['id']
        self.client.post('/api/auth/login', json={'email': email, 'password': pwd})

        active_plans = pricing_service.get_active_plans()
        plan = active_plans[0] if active_plans else pricing_service.get_all_plans()[0]
        order_res = self.client.post('/api/payments/create-order', json={'plan_id': plan['id']})
        self.assertEqual(order_res.status_code, 200)
        order_id = order_res.get_json()['order_id']
        payment_id = f"pay_test_{uuid.uuid4().hex[:10]}"

        # First verification succeeds
        v_res1 = self.client.post('/api/payments/verify', json={
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': 'test_signature_valid'
        })
        self.assertEqual(v_res1.status_code, 200)
        bal1 = wallet_service.get_balance(uid)
        self.assertEqual(bal1, plan['credits'])

        # Second verification (replay) returns already_processed with NO new credits added
        v_res2 = self.client.post('/api/payments/verify', json={
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': 'test_signature_valid'
        })
        self.assertEqual(v_res2.status_code, 200)
        self.assertEqual(v_res2.get_json().get('status'), 'already_processed')
        bal2 = wallet_service.get_balance(uid)
        self.assertEqual(bal2, bal1)  # Balance unchanged

    # ----------------------------------------------------------------------
    # 8. CAMPAIGN ONE-PER-USER RULE ENFORCEMENT
    # ----------------------------------------------------------------------
    def test_campaign_one_per_user_enforcement(self):
        """
        Test 8: Replay campaign redemption for a one-use-per-user campaign code.
        Expected: First redemption succeeds; second redemption fails with 'already used'.
        """
        email = f"cmp_user_{uuid.uuid4().hex[:8]}@example.com"
        pwd = "Password123!"
        user = auth_service.create_user(email=email, password=pwd, full_name="Campaign Student")
        uid = user['id']

        code_str = f"ONEPER_{uuid.uuid4().hex[:6]}".upper()
        now = datetime.now()
        campaign_service.create_campaign_code(
            code=code_str,
            campaign_name="One Per User Test",
            valid_from=now.isoformat(),
            valid_until=(now + timedelta(days=10)).isoformat(),
            max_uses=100,
            benefit_type="FREE_CREDIT",
            benefit_value=1,
            one_use_per_user=1
        )

        # First redemption succeeds
        res1 = campaign_service.redeem_code(uid, code_str)
        self.assertEqual(res1['status'], 'success')
        self.assertEqual(wallet_service.get_balance(uid), 1)

        # Second redemption by same user must be rejected
        with self.assertRaises(ValueError) as ctx:
            campaign_service.redeem_code(uid, code_str)
        self.assertIn("already redeemed", str(ctx.exception).lower())

        # Balance remains 1 (no second credit granted)
        self.assertEqual(wallet_service.get_balance(uid), 1)

    # ----------------------------------------------------------------------
    # 9. ROLE ELEVATION / MASS ASSIGNMENT PREVENTION
    # ----------------------------------------------------------------------
    def test_role_elevation_prevented(self):
        """
        Test 9: Client sends role = 'SUPER_ADMIN' in profile update or signup.
        Expected: Role remains 'USER'.
        """
        email = f"normal_{uuid.uuid4().hex[:8]}@example.com"
        pwd = "Password123!"
        user = auth_service.create_user(email=email, password=pwd, full_name="Regular Student")
        self.assertEqual(user['role'], 'USER')

        self.client.post('/api/auth/login', json={'email': email, 'password': pwd})

        # Put with manipulated role
        res = self.client.put('/api/auth/profile', json={
            'role': 'SUPER_ADMIN',
            'can_manage_developers': True,
            'is_active': 1
        })
        self.assertEqual(res.status_code, 200)

        # Role in database must still be USER
        db_user = auth_service.get_user_by_id(user['id'])
        self.assertEqual(db_user['role'], 'USER')
        self.assertFalse(db_user.get('can_manage_developers'))

    # ----------------------------------------------------------------------
    # 10. DEVELOPER ROLE ACCESSING SUPER ADMIN APIS
    # ----------------------------------------------------------------------
    def test_developer_cannot_access_super_admin_apis(self):
        """
        Test 10: Developer attempts to call Super Admin endpoints.
        Expected: HTTP 403 Forbidden.
        """
        dev_email = f"dev_{uuid.uuid4().hex[:8]}@example.com"
        pwd = "Password123!"
        dev_user = auth_service.create_user(email=dev_email, password=pwd, full_name="Dev User", role='DEVELOPER')
        self.client.post('/api/auth/login', json={'email': dev_email, 'password': pwd})

        # Try to access Super Admin verification endpoint
        res = self.client.get('/api/developer/verify-super-admin')
        self.assertEqual(res.status_code, 403)


if __name__ == '__main__':
    unittest.main()
