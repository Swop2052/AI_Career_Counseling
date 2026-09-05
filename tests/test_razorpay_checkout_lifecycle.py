"""
Tests for BUG 2: Razorpay Checkout Lifecycle & Cancellation Resilience.
Verifies:
1. Pay -> cancel -> Pay again (stale CREATED order cancelled, fresh order generated).
2. Multi-cancel cycle: Pay -> cancel -> Pay -> cancel -> Pay.
3. Successful payment after cancellation verifies signature, marks SUCCESS, grants credits ONCE.
4. Failed payment status does not grant credits or unlock.
5. Replay protection: Duplicate verify calls on the same order do NOT grant duplicate credits.
6. Cancelled payment does NOT grant credits or unlock assessments.
7. Modal close/cancel API endpoint (/api/payments/cancel) cleans up in-flight state safely.
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
from unittest.mock import patch, MagicMock
from app import app
from database.schema import get_db_connection
from services.auth_service import auth_service
from services.pricing_service import pricing_service
from services.payment_service import payment_service
from services.wallet_service import wallet_service


class TestRazorpayCheckoutLifecycle(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = app
        cls.client = cls.app.test_client()
        cls.app.config['TESTING'] = True
        cls.app.config['WTF_CSRF_ENABLED'] = False

        # Ensure active pricing plan
        cls.plan = pricing_service.get_lowest_active_plan()
        if not cls.plan:
            cls.plan = pricing_service.create_plan(
                name="Razorpay Test Plan",
                plan_type="CREDIT_PACK",
                price=199.0,
                credits=2,
                currency="INR",
                is_active=1
            )

    def setUp(self):
        # Create a fresh unique test user for each test
        self.user = auth_service.create_user(
            email=f"rzp_{uuid.uuid4().hex[:8]}@example.com",
            password="Password@123",
            full_name="Razorpay Lifecycle Tester"
        )
        self.user_id = self.user['id']

    def _login(self):
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.user_id
            sess['role'] = 'USER'

    def test_01_pay_cancel_pay_again(self):
        """Test Pay -> Cancel -> Pay again creates fresh order and marks previous cancelled."""
        self._login()

        # Step 1: Click Pay (create order 1)
        res1 = self.client.post('/api/payments/create-order', json={
            'plan_id': self.plan['id']
        })
        self.assertEqual(res1.status_code, 200)
        data1 = res1.get_json()
        order_id_1 = data1['order_id']
        self.assertTrue(bool(order_id_1))

        # Verify order 1 is in CREATED status
        conn = get_db_connection()
        p1 = conn.execute("SELECT * FROM payments WHERE razorpay_order_id = ?", (order_id_1,)).fetchone()
        conn.close()
        self.assertEqual(p1['status'], 'CREATED')

        # Step 2: User cancels/closes Razorpay Checkout modal
        res_cancel = self.client.post('/api/payments/cancel', json={
            'order_id': order_id_1
        })
        self.assertEqual(res_cancel.status_code, 200)
        cancel_data = res_cancel.get_json()
        self.assertTrue(cancel_data['success'])

        # Verify order 1 status is now CANCELLED
        conn = get_db_connection()
        p1_cancelled = conn.execute("SELECT * FROM payments WHERE razorpay_order_id = ?", (order_id_1,)).fetchone()
        conn.close()
        self.assertEqual(p1_cancelled['status'], 'CANCELLED')

        # Invariant: Cancellation must NOT grant any credits
        balance = wallet_service.get_balance(self.user_id)
        self.assertEqual(balance, 0)

        # Step 3: User clicks Pay again without page refresh
        res2 = self.client.post('/api/payments/create-order', json={
            'plan_id': self.plan['id']
        })
        self.assertEqual(res2.status_code, 200)
        data2 = res2.get_json()
        order_id_2 = data2['order_id']
        self.assertTrue(bool(order_id_2))
        self.assertNotEqual(order_id_1, order_id_2)

        # Verify order 2 is CREATED
        conn = get_db_connection()
        p2 = conn.execute("SELECT * FROM payments WHERE razorpay_order_id = ?", (order_id_2,)).fetchone()
        conn.close()
        self.assertEqual(p2['status'], 'CREATED')

    def test_02_multi_cancel_cycle_pay_cancel_pay_cancel_pay(self):
        """Test Pay -> Cancel -> Pay -> Cancel -> Pay multi-cancel lifecycle."""
        self._login()

        order_ids = []
        for i in range(1, 4):
            # Create order
            res = self.client.post('/api/payments/create-order', json={
                'plan_id': self.plan['id']
            })
            self.assertEqual(res.status_code, 200)
            order_id = res.get_json()['order_id']
            order_ids.append(order_id)

            if i < 3:
                # Cancel the first two
                c_res = self.client.post('/api/payments/cancel', json={'order_id': order_id})
                self.assertEqual(c_res.status_code, 200)

        self.assertEqual(len(order_ids), 3)
        # Check database statuses
        conn = get_db_connection()
        s1 = conn.execute("SELECT status FROM payments WHERE razorpay_order_id = ?", (order_ids[0],)).fetchone()['status']
        s2 = conn.execute("SELECT status FROM payments WHERE razorpay_order_id = ?", (order_ids[1],)).fetchone()['status']
        s3 = conn.execute("SELECT status FROM payments WHERE razorpay_order_id = ?", (order_ids[2],)).fetchone()['status']
        conn.close()

        self.assertEqual(s1, 'CANCELLED')
        self.assertEqual(s2, 'CANCELLED')
        self.assertEqual(s3, 'CREATED')

        # Balance remains 0
        balance = wallet_service.get_balance(self.user_id)
        self.assertEqual(balance, 0)

    def test_03_successful_payment_after_cancel(self):
        """Test that after a cancellation, a subsequent payment succeeds and credits are awarded."""
        self._login()

        # 1st attempt: Cancelled
        res_abort = self.client.post('/api/payments/create-order', json={'plan_id': self.plan['id']})
        abort_order_id = res_abort.get_json()['order_id']
        self.client.post('/api/payments/cancel', json={'order_id': abort_order_id})

        # 2nd attempt: Success
        res_ok = self.client.post('/api/payments/create-order', json={'plan_id': self.plan['id']})
        self.assertEqual(res_ok.status_code, 200)
        success_order_id = res_ok.get_json()['order_id']

        payment_id = f"pay_test_{uuid.uuid4().hex[:8]}"
        signature = "test_signature_valid"

        verify_res = self.client.post('/api/payments/verify', json={
            'razorpay_order_id': success_order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        })
        self.assertEqual(verify_res.status_code, 200)
        vdata = verify_res.get_json()
        self.assertEqual(vdata['status'], 'success')

        # Verify credits granted
        balance = wallet_service.get_balance(self.user_id)
        self.assertEqual(balance, self.plan['credits'])

        # Verify payment record status in DB
        conn = get_db_connection()
        pay_row = conn.execute("SELECT * FROM payments WHERE razorpay_order_id = ?", (success_order_id,)).fetchone()
        conn.close()
        self.assertEqual(pay_row['status'], 'SUCCESS')
        self.assertEqual(pay_row['razorpay_payment_id'], payment_id)

    def test_04_replay_protection(self):
        """Test replay protection: calling verify multiple times for the same order does NOT double credits."""
        self._login()

        res = self.client.post('/api/payments/create-order', json={'plan_id': self.plan['id']})
        order_id = res.get_json()['order_id']

        payment_id = f"pay_test_{uuid.uuid4().hex[:8]}"
        signature = "test_signature_valid"

        # First verification
        res1 = self.client.post('/api/payments/verify', json={
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        })
        self.assertEqual(res1.status_code, 200)

        bal1 = wallet_service.get_balance(self.user_id)
        self.assertEqual(bal1, self.plan['credits'])

        # Second verification (replay attempt)
        res2 = self.client.post('/api/payments/verify', json={
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        })
        self.assertEqual(res2.status_code, 200)
        vdata2 = res2.get_json()
        self.assertEqual(vdata2.get('status'), 'already_processed')

        bal2 = wallet_service.get_balance(self.user_id)
        self.assertEqual(bal2, self.plan['credits'], "Replay must NOT grant duplicate credits")

    def test_05_failed_signature_verification(self):
        """Test that invalid signature marks payment FAILED and does not award credits."""
        self._login()

        res = self.client.post('/api/payments/create-order', json={'plan_id': self.plan['id']})
        order_id = res.get_json()['order_id']

        fail_pay_id = f"pay_fail_{uuid.uuid4().hex[:8]}"

        verify_res = self.client.post('/api/payments/verify', json={
            'razorpay_order_id': order_id,
            'razorpay_payment_id': fail_pay_id,
            'razorpay_signature': "invalid_random_signature_value"
        })
        self.assertEqual(verify_res.status_code, 400)

        # Balance remains 0
        bal = wallet_service.get_balance(self.user_id)
        self.assertEqual(bal, 0)

        # Payment status in DB should be FAILED
        conn = get_db_connection()
        row = conn.execute("SELECT status FROM payments WHERE razorpay_order_id = ?", (order_id,)).fetchone()
        conn.close()
        self.assertEqual(row['status'], 'FAILED')

    def test_06_cancel_missing_order_or_unauthorized(self):
        """Test cancel endpoint validation with missing order_id or invalid order."""
        self._login()

        # Missing order_id
        res = self.client.post('/api/payments/cancel', json={})
        self.assertEqual(res.status_code, 400)

        # Non-existent order_id
        res2 = self.client.post('/api/payments/cancel', json={'order_id': 'order_non_existent'})
        self.assertEqual(res2.status_code, 200)
        self.assertFalse(res2.get_json()['success'])


if __name__ == '__main__':
    unittest.main()
