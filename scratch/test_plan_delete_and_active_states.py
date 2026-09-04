# scratch/test_plan_delete_and_active_states.py
import sys
import os
import unittest
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from database.schema import get_db_connection
from services.pricing_service import pricing_service


class PlanDeleteAndActiveStateTest(unittest.TestCase):

    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM users WHERE email = 'admin@skillsense.ai'")
            row = cursor.fetchone()
            if row:
                self.test_user_id = row['id']
            else:
                self.test_user_id = 'usr_dev_admin_test'
                cursor.execute("""
                    INSERT INTO users (id, email, password_hash, role)
                    VALUES (?, ?, ?, ?)
                """, (self.test_user_id, 'admin@skillsense.ai', 'hashed', 'DEVELOPER'))
                conn.commit()
        finally:
            conn.close()

        # Developer Session
        with self.app.session_transaction() as sess:
            sess['user_id'] = self.test_user_id
            sess['email'] = 'admin@skillsense.ai'
            sess['role'] = 'DEVELOPER'
            sess['full_name'] = 'Developer Admin'

    def test_01_unused_plan_hard_delete(self):
        """Create a new unused plan and verify DELETE hard removes it from database."""
        # 1. Create plan
        res_create = self.app.post('/api/developer/plans', json={
            'name': 'Temporary Promo Plan',
            'price': 9.99,
            'credits': 1,
            'type': 'CREDIT_PACK',
            'is_active': 1
        })
        self.assertEqual(res_create.status_code, 200)
        plan_id = res_create.get_json()['plan']['id']

        # 2. Verify plan is visible in /api/pricing-plans
        res_plans = self.app.get('/api/pricing-plans')
        self.assertEqual(res_plans.status_code, 200)
        active_ids = [p['id'] for p in res_plans.get_json()['plans']]
        self.assertIn(plan_id, active_ids)

        # 3. Delete plan
        res_del = self.app.delete(f'/api/developer/plans/{plan_id}')
        self.assertEqual(res_del.status_code, 200)
        data_del = res_del.get_json()
        self.assertEqual(data_del['action'], 'DELETED')

        # 4. Verify plan is deleted from DB completely
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM pricing_plans WHERE id = ?", (plan_id,))
            self.assertEqual(cursor.fetchone()[0], 0)
        finally:
            conn.close()

        # 5. Verify plan no longer appears on student pricing
        res_after = self.app.get('/api/pricing-plans')
        after_ids = [p['id'] for p in res_after.get_json()['plans']]
        self.assertNotIn(plan_id, after_ids)
        print("✓ Test 01 Passed: Unused plan successfully hard-deleted and removed from student pricing.")

    def test_02_used_plan_safe_archival_protection(self):
        """Verify that a plan with historical payment records is safely archived instead of hard-deleted."""
        # 1. Create plan
        res_create = self.app.post('/api/developer/plans', json={
            'name': 'Used Historical Plan',
            'price': 49.0,
            'credits': 3,
            'type': 'CREDIT_PACK',
            'is_active': 1
        })
        self.assertEqual(res_create.status_code, 200)
        plan_id = res_create.get_json()['plan']['id']

        # 2. Simulate historical payment referencing this plan
        import uuid
        pay_id = f"pay_hist_{uuid.uuid4().hex[:8]}"
        order_id = f"order_hist_{uuid.uuid4().hex[:8]}"
        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO payments (id, user_id, plan_id, amount, original_amount, discount_amount, currency, gateway, razorpay_order_id, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (pay_id, self.test_user_id, plan_id, 49.0, 49.0, 0.0, 'INR', 'razorpay', order_id, 'SUCCESS'))
        finally:
            conn.close()

        # 3. Attempt deletion via DELETE endpoint
        res_del = self.app.delete(f'/api/developer/plans/{plan_id}')
        self.assertEqual(res_del.status_code, 200)
        data_del = res_del.get_json()
        self.assertEqual(data_del['action'], 'ARCHIVED')

        # 4. Verify plan is NOT deleted from DB, but marked is_active = 0
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT is_active FROM pricing_plans WHERE id = ?", (plan_id,))
            row = cursor.fetchone()
            self.assertIsNotNone(row)
            self.assertEqual(row['is_active'], 0)

            # Verify historical payment record is untouched
            cursor.execute("SELECT COUNT(*) FROM payments WHERE plan_id = ?", (plan_id,))
            self.assertEqual(cursor.fetchone()[0], 1)
        finally:
            conn.close()

        # 5. Verify plan is no longer shown on active student pricing page
        res_after = self.app.get('/api/pricing-plans')
        active_ids = [p['id'] for p in res_after.get_json()['plans']]
        self.assertNotIn(plan_id, active_ids)
        print("✓ Test 02 Passed: Used plan with historical payments safely archived and removed from active pricing.")


if __name__ == '__main__':
    unittest.main()
