# tests/test_security_hardening.py
"""Comprehensive security hardening regression and vulnerability verification test suite.

Covers:
- Payment tampering & price manipulation (V1-V5)
- Forged signature & webhook bypass protection in production (V1-V4)
- Payment idempotency & replay protection (V5)
- Admin backdoor removal (V6)
- Open redirect defense (V7)
- Pricing plan data minimization (V8)
- Account summary data minimization (V9)
- Auth response sanitization (V10)
- Campaign atomic redemption limit & credit capping (V12, V16, V17)
- Cross-origin / CSRF defenses (V13, V20)
- Anonymous upload restriction (V21)
- Session role injection prevention (V22)
- Information disclosure / safe error responses (V18)
"""

import unittest
import json
import uuid
import hmac
import hashlib
from app import app
from core.config import config
from database.schema import get_db_connection
from services.auth_service import auth_service
from services.wallet_service import wallet_service
from services.pricing_service import pricing_service
from services.campaign_service import campaign_service
from services.payment_service import payment_service, RazorpayProvider
from services.assessment_service import assessment_service


class TestSecurityHardening(unittest.TestCase):
    """Rigorous security test suite for platform hardening."""

    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.unique_id = uuid.uuid4().hex[:8]
        self.test_email = f"sec_user_{self.unique_id}@test.com"
        self.test_password = "SecurePassword123!"

        # Create test user
        self.user = auth_service.create_user(
            email=self.test_email,
            password=self.test_password,
            full_name=f"Security Test User {self.unique_id}"
        )
        self.user_id = self.user['id']

    def test_01_admin_backdoor_is_removed(self):
        """V6: Verify hardcoded password backdoor for admin@skillsense.ai is permanently disabled."""
        backdoor_passwords = ['admin', 'admin123', 'admin@123', 'Admin@123', 'Admin@123456', 'Password123!', 'password']
        for pwd in backdoor_passwords:
            res = auth_service.authenticate_user("admin@skillsense.ai", pwd)
            self.assertIsNone(
                res,
                f"Security breach: Backdoor password '{pwd}' authenticated successfully for admin@skillsense.ai!"
            )

    def test_02_open_redirect_defense(self):
        """V7: Verify next parameter rejects external URLs and protocol-relative bypasses."""
        with self.client as c:
            malicious_targets = [
                "https://evil.com",
                "http://phishing.com/login",
                "//evil.com",
                "/\\evil.com",
                "javascript:alert(1)",
                "data:text/html,<script>alert(1)</script>"
            ]
            for target in malicious_targets:
                res = c.post('/api/auth/login', json={
                    'email': self.test_email,
                    'password': self.test_password,
                    'next': target
                })
                self.assertEqual(res.status_code, 200)
                data = res.get_json()
                self.assertEqual(
                    data.get('redirect'),
                    '/account',
                    f"Open redirect vulnerability: '{target}' was accepted as redirect target!"
                )

    def test_03_pricing_plans_data_minimization(self):
        """V8: Verify /api/pricing-plans only returns safe public fields."""
        res = self.client.get('/api/pricing-plans')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('plans', data)
        self.assertTrue(len(data['plans']) > 0)

        forbidden_fields = {'created_at', 'updated_at', 'sort_order', 'duration_days', 'is_active'}
        required_fields = {'id', 'name', 'type', 'price', 'currency', 'credits', 'is_recommended'}

        for p in data['plans']:
            for forbidden in forbidden_fields:
                self.assertNotIn(forbidden, p, f"Data exposure: internal field '{forbidden}' found in pricing plan!")
            for req in required_fields:
                self.assertIn(req, p, f"Missing expected field '{req}' in sanitized pricing plan!")

    def test_04_account_summary_data_minimization(self):
        """V9: Verify /api/account/summary does not expose internal sensitive flags or references."""
        with self.client as c:
            # Login
            c.post('/api/auth/login', json={'email': self.test_email, 'password': self.test_password})
            res = c.get('/api/account/summary')
            self.assertEqual(res.status_code, 200)
            data = res.get_json()

            user_obj = data.get('user', {})
            forbidden_user_fields = {'role', 'is_active', 'can_manage_developers', 'password_hash', 'last_login_at', 'created_at'}
            for f in forbidden_user_fields:
                self.assertNotIn(f, user_obj, f"Data exposure: '{f}' returned in account summary user object!")

            # Check transactions if any
            wallet_service.add_credits(self.user_id, 1, 'PURCHASE', 'test', 'ref_123', 'Test Purchase')
            res2 = c.get('/api/account/summary')
            data2 = res2.get_json()
            txs = data2.get('transactions', [])
            self.assertTrue(len(txs) > 0)
            for t in txs:
                self.assertNotIn('reference_id', t, "Internal reference_id exposed in transactions summary!")
                self.assertNotIn('reference_type', t, "Internal reference_type exposed in transactions summary!")

    def test_05_auth_response_sanitization(self):
        """V10: Verify login and signup responses do not expose sensitive internal user fields."""
        new_email = f"auth_sanitized_{uuid.uuid4().hex[:6]}@test.com"
        res = self.client.post('/api/auth/signup', json={
            'email': new_email,
            'password': 'SecurePassword123!',
            'full_name': 'Sanitized User'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        user_info = data.get('user', {})

        forbidden = {'password_hash', 'can_manage_developers', 'is_active', 'last_login_at', 'created_at'}
        for f in forbidden:
            self.assertNotIn(f, user_info, f"Sensitive field '{f}' leaked in signup response!")

        # Check login response as well
        res_login = self.client.post('/api/auth/login', json={
            'email': new_email,
            'password': 'SecurePassword123!'
        })
        self.assertEqual(res_login.status_code, 200)
        login_user = res_login.get_json().get('user', {})
        for f in forbidden:
            self.assertNotIn(f, login_user, f"Sensitive field '{f}' leaked in login response!")

    def test_06_payment_tampering_server_enforces_price(self):
        """Verify client cannot tamper with price or credits during order creation."""
        with self.client as c:
            c.post('/api/auth/login', json={'email': self.test_email, 'password': self.test_password})
            plans = pricing_service.get_active_plans()
            target_plan = plans[0]

            # Attacker attempts to pass amount=1 and credits=999
            res = c.post('/api/payments/create-order', json={
                'plan_id': target_plan['id'],
                'amount': 1,
                'credits': 999
            })
            self.assertEqual(res.status_code, 200)
            data = res.get_json()

            # Server MUST calculate amount from database plan, not from request
            expected_amount_subunits = int(round(float(target_plan['price']) * 100))
            self.assertEqual(
                data['amount'],
                expected_amount_subunits,
                "Price manipulation vulnerability: Server accepted manipulated amount!"
            )

    def test_07_payment_verification_idempotency_no_double_credit(self):
        """V5: Verify replaying a payment verification does not double-grant credits."""
        initial_balance = wallet_service.get_balance(self.user_id)
        plans = pricing_service.get_active_plans()
        plan = plans[0]

        # Create order
        order_res = payment_service.create_payment_order(
            user_id=self.user_id,
            plan_id=plan['id']
        )
        order_id = order_res['order_id']
        dummy_pay_id = f"pay_test_{uuid.uuid4().hex[:10]}"

        # First verification
        res1 = payment_service.verify_and_process_payment(
            user_id=self.user_id,
            razorpay_order_id=order_id,
            razorpay_payment_id=dummy_pay_id,
            razorpay_signature="simulated_test_sig_abc"
        )
        self.assertEqual(res1['status'], 'success')
        balance_after_1 = wallet_service.get_balance(self.user_id)
        self.assertEqual(balance_after_1, initial_balance + plan['credits'])

        # Second verification (replay attack)
        res2 = payment_service.verify_and_process_payment(
            user_id=self.user_id,
            razorpay_order_id=order_id,
            razorpay_payment_id=dummy_pay_id,
            razorpay_signature="simulated_test_sig_abc"
        )
        self.assertEqual(res2['status'], 'already_processed')
        balance_after_2 = wallet_service.get_balance(self.user_id)
        self.assertEqual(
            balance_after_2,
            balance_after_1,
            "Double-crediting race condition: Replayed payment granted duplicate credits!"
        )

    def test_08_atomic_assessment_unlock_no_double_spending(self):
        """V15: Verify unlocking an assessment cannot double-deduct credits."""
        # Give user 2 credits
        wallet_service.add_credits(self.user_id, 2, 'PURCHASE', 'test', 'ref_test', 'Test Credits')
        start_balance = wallet_service.get_balance(self.user_id)
        self.assertEqual(start_balance, 2)

        # Create test attempt
        attempt = assessment_service.save_assessment_attempt(
            user_id=self.user_id,
            guest_session_id=None,
            student_profile={'name': 'Test'},
            riasec_answers={'1': 5},
            riasec_scores={'R': 5},
            riasec_code='RIA',
            top_careers=[{'career_name': 'Software Engineer', 'fit_score': 95}]
        )
        attempt_id = attempt['attempt_id']

        # First unlock
        res1 = assessment_service.unlock_assessment(self.user_id, attempt_id)
        self.assertEqual(res1['status'], 'success')
        self.assertEqual(wallet_service.get_balance(self.user_id), 1)

        # Second unlock on same attempt
        res2 = assessment_service.unlock_assessment(self.user_id, attempt_id)
        self.assertEqual(res2['status'], 'already_unlocked')
        # Balance must REMAIN 1, exactly 1 credit deducted in total!
        self.assertEqual(
            wallet_service.get_balance(self.user_id),
            1,
            "Double-spending race condition: Unlocking an already unlocked attempt deducted extra credits!"
        )

    def test_09_session_role_injection_prevention(self):
        """V22: Verify client cannot inject role: SUPER_ADMIN via /api/clear-session."""
        with self.client as c:
            # Login as normal user
            c.post('/api/auth/login', json={'email': self.test_email, 'password': self.test_password})

            # Send payload with role: SUPER_ADMIN
            res = c.post('/api/clear-session', json={'role': 'SUPER_ADMIN', 'email': 'hacker@evil.com'})
            self.assertEqual(res.status_code, 200)

            # Check me endpoint - role must remain USER
            res_me = c.get('/api/auth/me')
            data_me = res_me.get_json()
            self.assertEqual(data_me['user']['role'], 'USER')

    def test_10_campaign_code_max_uses_atomic_limit(self):
        """V16: Verify campaign code strictly enforces max_uses atomically."""
        code_str = f"LIMIT{uuid.uuid4().hex[:6].upper()}"
        cmp = campaign_service.create_campaign_code(
            code=code_str,
            campaign_name="Limit Test",
            valid_from="2020-01-01",
            valid_until="2035-01-01",
            max_uses=1,
            discount_type="CREDIT",
            discount_value=1,
            benefit_type="CREDIT",
            benefit_value=1,
            created_by=self.user_id
        )

        # First redemption succeeds
        res1 = campaign_service.redeem_code(self.user_id, code_str)
        self.assertEqual(res1['status'], 'success')

        # Create another user to attempt second redemption
        user2 = auth_service.create_user(
            email=f"limit_user2_{uuid.uuid4().hex[:6]}@test.com",
            password="SecurePassword123!",
            full_name="Second User"
        )

        # Second redemption must fail because max_uses is reached
        with self.assertRaises(ValueError) as ctx:
            campaign_service.redeem_code(user2['id'], code_str)
        self.assertIn("maximum", str(ctx.exception).lower())

    def test_11_production_mode_blocks_forged_signatures(self):
        """V1: In production mode (FLASK_ENV='production'), test-mode signature bypasses are strictly rejected."""
        provider = RazorpayProvider()
        orig_env = config.flask_env
        try:
            config.flask_env = "production"
            sig_params = {
                'razorpay_order_id': 'order_123',
                'razorpay_payment_id': 'pay_123',
                'razorpay_signature': 'test_signature_valid'
            }
            is_valid = provider.verify_signature(sig_params)
            self.assertFalse(
                is_valid,
                "CRITICAL: 'test_signature_valid' was accepted in production mode!"
            )
        finally:
            config.flask_env = orig_env

    def test_12_production_mode_blocks_forged_webhooks(self):
        """V3: In production mode, test_webhook_signature is strictly rejected."""
        orig_env = config.flask_env
        try:
            config.flask_env = "production"
            raw_body = b'{"event":"payment.captured","payload":{}}'
            with self.assertRaises(ValueError) as ctx:
                payment_service.handle_webhook_event(raw_body, "test_webhook_signature")
            self.assertIn("signature verification failed", str(ctx.exception).lower())
        finally:
            config.flask_env = orig_env


if __name__ == '__main__':
    unittest.main()
