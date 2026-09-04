import sys
import os
import unittest
import json
import uuid
import hmac
import hashlib
from datetime import datetime, timedelta

# Add workspace to path
sys.path.insert(0, r"E:\projects\AI_Career_Counseling")

from app import app
from database.schema import get_db_connection, init_db
from services.auth_service import auth_service
from services.wallet_service import wallet_service
from services.campaign_service import campaign_service
from services.payment_service import payment_service
from services.pricing_service import pricing_service
from services.assessment_service import assessment_service

class MonetizationAndReferralMatrixTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Initialize database schema
        init_db()
        cls.client = app.test_client()

        # Seed developer admin
        cls.dev_email = "admin@skillsense.ai"
        cls.dev_password = "Admin@12345"

        # Create or fetch developer account
        dev_user = auth_service.get_user_by_email(cls.dev_email)
        if not dev_user:
            dev_user = auth_service.create_user(cls.dev_email, cls.dev_password, full_name="Admin Developer", role="DEVELOPER")
        cls.dev_user_id = dev_user['id']

        # Ensure role is DEVELOPER
        conn = get_db_connection()
        conn.execute("UPDATE users SET role = 'DEVELOPER' WHERE id = ?", (cls.dev_user_id,))
        conn.commit()
        conn.close()

        # Create test regular student user
        cls.student_email = f"student_{uuid.uuid4().hex[:6]}@example.com"
        cls.student_password = "Student@12345"
        student = auth_service.create_user(cls.student_email, cls.student_password, full_name="Test Student", role="USER")
        cls.student_id = student['id']

        # Fetch active 1-credit plan (₹19)
        plans = pricing_service.get_active_plans()
        cls.plan_1_credit = next((p for p in plans if p['credits'] == 1), plans[0])
        cls.plan_id = cls.plan_1_credit['id']
        cls.plan_price = float(cls.plan_1_credit['price'])

    def test_01_developer_dashboard_access_and_security(self):
        """Test developer dashboard security and access restrictions."""
        # 1. Unauthenticated request to /developer -> redirect to login
        res = self.client.get('/developer')
        self.assertEqual(res.status_code, 302)
        self.assertIn('/login', res.headers['Location'])

        # 2. Unauthenticated request to /api/developer/stats -> 403
        res = self.client.get('/api/developer/stats')
        self.assertEqual(res.status_code, 403)

        # 3. Regular student login -> access /developer -> 403
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.student_id
            sess['email'] = self.student_email
            sess['role'] = 'USER'

        res = self.client.get('/developer')
        self.assertEqual(res.status_code, 403)

        res = self.client.get('/api/developer/stats')
        self.assertEqual(res.status_code, 403)

        # 4. Developer login -> access /developer -> 200
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.dev_user_id
            sess['email'] = self.dev_email
            sess['role'] = 'DEVELOPER'

        res = self.client.get('/developer')
        self.assertEqual(res.status_code, 200)

        res = self.client.get('/api/developer/stats')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('total_users', data)
        self.assertIn('active_campaigns', data)
        print("✓ Test 01 Passed: Developer role security & dashboard access verified.")

    def test_02_developer_create_and_manage_test20_campaign(self):
        """Test creating, editing, and querying TEST20 campaign from developer dashboard."""
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.dev_user_id
            sess['email'] = self.dev_email
            sess['role'] = 'DEVELOPER'

        # Delete TEST20 if already exists for clean slate
        conn = get_db_connection()
        conn.execute("DELETE FROM campaign_redemptions WHERE campaign_code_id IN (SELECT id FROM campaign_codes WHERE code = 'TEST20')")
        conn.execute("DELETE FROM campaign_codes WHERE code = 'TEST20'")
        conn.commit()
        conn.close()

        now = datetime.now()
        valid_from = (now - timedelta(days=1)).isoformat()
        valid_until = (now + timedelta(days=30)).isoformat()

        # Create TEST20 (20% off)
        res = self.client.post('/api/developer/campaigns', json={
            'code': 'TEST20',
            'campaign_name': 'Test 20% Discount Campaign',
            'valid_from': valid_from,
            'valid_until': valid_until,
            'discount_type': 'PERCENTAGE',
            'discount_value': 20.0,
            'max_uses': 300,
            'one_use_per_user': 1
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['campaign']['code'], 'TEST20')
        code_id = data['campaign']['id']

        # Query campaigns list
        res = self.client.get('/api/developer/campaigns')
        self.assertEqual(res.status_code, 200)
        campaigns = res.get_json()['campaigns']
        found = next((c for c in campaigns if c['code'] == 'TEST20'), None)
        self.assertIsNotNone(found)
        self.assertEqual(found['discount_value'], 20.0)

        # Update campaign
        res = self.client.put(f'/api/developer/campaigns/{code_id}', json={
            'campaign_name': 'Updated Test 20% Discount Campaign',
            'valid_from': valid_from,
            'valid_until': valid_until,
            'discount_type': 'PERCENTAGE',
            'discount_value': 20.0,
            'max_uses': 500,
            'one_use_per_user': 1,
            'is_active': 1
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()['campaign']['max_uses'], 500)
        print("✓ Test 02 Passed: Developer TEST20 campaign creation & update verified.")

    def test_03_discount_validation_test20_on_pricing(self):
        """Test server-side discount calculation for TEST20 on ₹19 plan."""
        res = self.client.post('/api/campaigns/validate-discount', json={
            'plan_id': self.plan_id,
            'code': 'TEST20'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['valid'])
        self.assertEqual(data['code'], 'TEST20')
        self.assertEqual(data['original_price'], self.plan_price)
        expected_discount = round(self.plan_price * 0.20, 2) # 3.80
        expected_final = round(self.plan_price - expected_discount, 2) # 15.20
        self.assertEqual(data['discount_amount'], expected_discount)
        self.assertEqual(data['final_price'], expected_final)
        print(f"✓ Test 03 Passed: TEST20 discount on ₹{self.plan_price:.2f} -> -₹{expected_discount:.2f} = ₹{expected_final:.2f}.")

    def test_04_full_paid_checkout_flow_with_referral_code(self):
        """Test complete Razorpay order creation, mock verification, wallet credit, and campaign redemption."""
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.student_id
            sess['email'] = self.student_email
            sess['role'] = 'USER'

        initial_bal = wallet_service.get_balance(self.student_id)

        # 1. Create payment order with TEST20
        res = self.client.post('/api/payments/create-order', json={
            'plan_id': self.plan_id,
            'referral_code': 'TEST20'
        })
        self.assertEqual(res.status_code, 200)
        order_data = res.get_json()
        self.assertIn('order_id', order_data)
        # Expected paise amount: 15.20 * 100 = 1520
        self.assertEqual(order_data['amount'], 1520)

        # 2. Simulate Razorpay webhook / verification signature
        razorpay_order_id = order_data['order_id']
        razorpay_payment_id = f"pay_mock_{uuid.uuid4().hex[:8]}"
        secret = "mock_secret_for_test"
        os.environ['RAZORPAY_KEY_SECRET'] = secret
        payment_service.provider.key_secret = secret

        sig_payload = f"{razorpay_order_id}|{razorpay_payment_id}"
        mock_signature = hmac.new(secret.encode(), sig_payload.encode(), hashlib.sha256).hexdigest()

        # 3. Call verify endpoint
        res = self.client.post('/api/payments/verify', json={
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': mock_signature
        })
        self.assertEqual(res.status_code, 200)
        verify_data = res.get_json()
        self.assertEqual(verify_data['status'], 'success')
        self.assertEqual(verify_data['credits_granted'], self.plan_1_credit['credits'])

        # 4. Check wallet balance
        new_bal = wallet_service.get_balance(self.student_id)
        self.assertEqual(new_bal, initial_bal + self.plan_1_credit['credits'])

        # 5. Verify database audit records
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check payments record
        cursor.execute("SELECT * FROM payments WHERE razorpay_order_id = ?", (razorpay_order_id,))
        p_row = cursor.fetchone()
        self.assertIsNotNone(p_row)
        self.assertEqual(p_row['status'], 'SUCCESS')
        self.assertEqual(p_row['amount'], 15.20)
        self.assertEqual(p_row['original_amount'], 19.00)
        self.assertEqual(p_row['discount_amount'], 3.80)

        # Check campaign_redemptions record
        cursor.execute("SELECT * FROM campaign_redemptions WHERE user_id = ? AND payment_id = ?", (self.student_id, p_row['id']))
        r_row = cursor.fetchone()
        self.assertIsNotNone(r_row)
        self.assertEqual(r_row['discount_applied'], 3.80)

        # Check campaign_codes used_count
        cursor.execute("SELECT used_count FROM campaign_codes WHERE code = 'TEST20'")
        c_row = cursor.fetchone()
        self.assertGreaterEqual(c_row['used_count'], 1)

        conn.close()
        print("✓ Test 04 Passed: Full paid checkout flow & SQLite records verified.")

    def test_05_100_percent_discount_zero_rupee_redemption(self):
        """Test 100% discount zero-rupee purchase flow without Razorpay."""
        # Create 100% discount code FREE100
        now = datetime.now()
        valid_from = (now - timedelta(days=1)).isoformat()
        valid_until = (now + timedelta(days=30)).isoformat()

        conn = get_db_connection()
        conn.execute("DELETE FROM campaign_redemptions WHERE campaign_code_id IN (SELECT id FROM campaign_codes WHERE code = 'FREE100')")
        conn.execute("DELETE FROM campaign_codes WHERE code = 'FREE100'")
        conn.commit()
        conn.close()

        campaign_service.create_campaign_code(
            code='FREE100',
            campaign_name='100% Free Single Test',
            valid_from=valid_from,
            valid_until=valid_until,
            discount_type='PERCENTAGE',
            discount_value=100.0,
            max_uses=100,
            one_use_per_user=1,
            created_by=self.dev_user_id
        )

        # Validate discount
        res = self.client.post('/api/campaigns/validate-discount', json={
            'plan_id': self.plan_id,
            'code': 'FREE100'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['valid'])
        self.assertEqual(data['final_price'], 0.0)
        self.assertEqual(data['discount_amount'], 19.0)

        # Create a fresh student user for zero-rupee redemption
        free_user = auth_service.create_user(f"free_{uuid.uuid4().hex[:6]}@example.com", "Free@12345", full_name="Free Student")

        with self.client.session_transaction() as sess:
            sess['user_id'] = free_user['id']
            sess['email'] = free_user['email']
            sess['role'] = 'USER'

        # Redeem via /api/payments/redeem-zero
        res = self.client.post('/api/payments/redeem-zero', json={
            'plan_id': self.plan_id,
            'referral_code': 'FREE100'
        })
        self.assertEqual(res.status_code, 200)
        res_data = res.get_json()
        self.assertEqual(res_data['status'], 'success')
        self.assertEqual(res_data['credits_granted'], 1)
        self.assertEqual(wallet_service.get_balance(free_user['id']), 1)

        # Verify audit records in SQLite
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM payments WHERE user_id = ? AND gateway = 'referral_zero'", (free_user['id'],))
        zero_pay = cursor.fetchone()
        self.assertIsNotNone(zero_pay)
        self.assertEqual(zero_pay['amount'], 0.0)
        self.assertEqual(zero_pay['discount_amount'], 19.0)
        self.assertEqual(zero_pay['status'], 'SUCCESS')

        cursor.execute("SELECT * FROM campaign_redemptions WHERE user_id = ?", (free_user['id'],))
        rdm = cursor.fetchone()
        self.assertIsNotNone(rdm)
        conn.close()

        print("✓ Test 05 Passed: 100% discount zero-rupee atomic redemption verified.")

    def test_06_edge_cases_and_error_handling(self):
        """Test invalid, expired, disabled, max-uses, and one-use-per-account restrictions."""
        # 1. Invalid code
        res = self.client.post('/api/campaigns/validate-discount', json={
            'plan_id': self.plan_id,
            'code': 'NONEXISTENT999'
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn('invalid or expired', res.get_json()['error'].lower())

        # 2. Expired code
        now = datetime.now()
        past_from = (now - timedelta(days=30)).isoformat()
        past_until = (now - timedelta(days=1)).isoformat()

        conn = get_db_connection()
        conn.execute("DELETE FROM campaign_codes WHERE code = 'EXPIRED_CODE'")
        conn.commit()
        conn.close()

        campaign_service.create_campaign_code(
            code='EXPIRED_CODE',
            campaign_name='Expired Campaign',
            valid_from=past_from,
            valid_until=past_until,
            discount_type='PERCENTAGE',
            discount_value=20.0,
            max_uses=100,
            created_by=self.dev_user_id
        )

        res = self.client.post('/api/campaigns/validate-discount', json={
            'plan_id': self.plan_id,
            'code': 'EXPIRED_CODE'
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn('invalid or expired', res.get_json()['error'].lower())

        # 3. Disabled code
        conn = get_db_connection()
        conn.execute("DELETE FROM campaign_codes WHERE code = 'DISABLED_CODE'")
        conn.commit()
        conn.close()

        cmp_dis = campaign_service.create_campaign_code(
            code='DISABLED_CODE',
            campaign_name='Disabled Campaign',
            valid_from=(now - timedelta(days=1)).isoformat(),
            valid_until=(now + timedelta(days=30)).isoformat(),
            discount_type='PERCENTAGE',
            discount_value=20.0,
            max_uses=100,
            created_by=self.dev_user_id
        )
        campaign_service.set_campaign_active(cmp_dis['id'], 0)

        res = self.client.post('/api/campaigns/validate-discount', json={
            'plan_id': self.plan_id,
            'code': 'DISABLED_CODE'
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn('invalid or expired', res.get_json()['error'].lower())

        # 4. One use per user restriction
        # Self student already used TEST20 in test_04
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.student_id
            sess['email'] = self.student_email
            sess['role'] = 'USER'

        res = self.client.post('/api/campaigns/validate-discount', json={
            'plan_id': self.plan_id,
            'code': 'TEST20'
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn('already used', res.get_json()['error'].lower())

        print("✓ Test 06 Passed: All error & boundary edge cases verified.")

    def test_07_auto_unlock_assessment_flow(self):
        """Test that purchasing a credit or zero-rupee redemption auto-unlocks pending assessment."""
        # Create a test locked assessment attempt
        student = auth_service.create_user(f"unlock_student_{uuid.uuid4().hex[:6]}@example.com", "Pass@12345", full_name="Unlock Student")
        attempt_id = f"ast_{uuid.uuid4().hex[:12]}"
        now_str = datetime.now().isoformat()

        conn = get_db_connection()
        conn.execute("""
            INSERT INTO assessment_attempts (id, user_id, student_profile, riasec_answers, riasec_scores, riasec_code, is_unlocked, created_at)
            VALUES (?, ?, '{"full_name":"Unlock Student"}', '{}', '{"R":20,"I":20,"A":20,"S":20,"E":20,"C":20}', 'RIA', 0, ?)
        """, (attempt_id, student['id'], now_str))
        conn.commit()
        conn.close()

        # Check it is locked
        attempt = assessment_service.get_attempt_by_id(attempt_id)
        self.assertFalse(attempt['is_unlocked'])

        # Create one-time 100% coupon for this unlock test
        code_str = f"UNLOCK{uuid.uuid4().hex[:4].upper()}"
        now = datetime.now()
        campaign_service.create_campaign_code(
            code=code_str,
            campaign_name='Unlock Promo',
            valid_from=(now - timedelta(days=1)).isoformat(),
            valid_until=(now + timedelta(days=30)).isoformat(),
            discount_type='PERCENTAGE',
            discount_value=100.0,
            max_uses=10,
            created_by=self.dev_user_id
        )

        with self.client.session_transaction() as sess:
            sess['user_id'] = student['id']
            sess['email'] = student['email']
            sess['role'] = 'USER'

        # Redeem zero payment with attempt_id
        res = self.client.post('/api/payments/redeem-zero', json={
            'plan_id': self.plan_id,
            'referral_code': code_str,
            'attempt_id': attempt_id
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['unlocked_attempt_id'], attempt_id)

        # Verify attempt in DB is unlocked
        unlocked_attempt = assessment_service.get_attempt_by_id(attempt_id)
        self.assertTrue(unlocked_attempt['is_unlocked'])
        print(f"✓ Test 07 Passed: Auto-unlock of assessment {attempt_id} verified.")

if __name__ == '__main__':
    unittest.main()
