import unittest
import uuid
import json
from datetime import datetime, timedelta
from database.schema import get_db_connection
from services.assessment_service import assessment_service
from services.wallet_service import wallet_service
from services.campaign_service import campaign_service
from services.auth_service import auth_service

class TestFlowAndDeduplication(unittest.TestCase):
    def setUp(self):
        self.test_email = f"test_flow_{uuid.uuid4().hex[:8]}@example.com"
        user = auth_service.create_user(email=self.test_email, password="SecurePass123!", full_name="Flow Student")
        self.user_id = user['id']

    def test_atomic_unlock_transaction(self):
        """Test A: Atomic unlock deducts exactly 1 credit, creates ledger debit, and marks unlocked."""
        wallet_service.add_credits(self.user_id, 1, "TEST_PURCHASE")
        self.assertEqual(wallet_service.get_balance(self.user_id), 1)

        attempt = assessment_service.save_assessment_attempt(
            user_id=self.user_id,
            student_profile={"full_name": "Flow Student"},
            riasec_code="RIA",
            top_careers=[{"name": "Software Engineer", "score": 90.0, "match_score": 90.0}]
        )
        attempt_id = attempt['attempt_id']
        self.assertFalse(attempt['is_unlocked'])

        # Unlock attempt
        res = assessment_service.unlock_assessment(self.user_id, attempt_id)
        self.assertEqual(res['status'], 'success')
        self.assertEqual(res['credits_remaining'], 0)

        # Verify DB state directly
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT balance FROM credit_wallets WHERE user_id = %s", (self.user_id,))
            self.assertEqual(cursor.fetchone()['balance'], 0)

            cursor.execute("SELECT is_unlocked FROM assessment_attempts WHERE id = %s", (attempt_id,))
            self.assertEqual(cursor.fetchone()['is_unlocked'], 1)

            cursor.execute("SELECT type, amount, reference_id FROM credit_transactions WHERE user_id = %s ORDER BY created_at DESC LIMIT 1", (self.user_id,))
            tx = cursor.fetchone()
            self.assertEqual(tx['type'], 'REPORT_UNLOCK')
            self.assertEqual(tx['amount'], -1)
            self.assertEqual(tx['reference_id'], attempt_id)
        finally:
            conn.close()

    def test_unlock_idempotency(self):
        """Test B: Calling unlock on an already unlocked attempt consumes 0 credits."""
        wallet_service.add_credits(self.user_id, 2, "TEST_PURCHASE")
        attempt = assessment_service.save_assessment_attempt(
            user_id=self.user_id,
            student_profile={"full_name": "Flow Student"},
            riasec_code="RIA",
            top_careers=[{"name": "Data Scientist", "score": 92.0, "match_score": 92.0}]
        )
        attempt_id = attempt['attempt_id']

        # First unlock
        res1 = assessment_service.unlock_assessment(self.user_id, attempt_id)
        self.assertEqual(res1['status'], 'success')
        self.assertEqual(wallet_service.get_balance(self.user_id), 1)

        # Second unlock (idempotent double-click)
        res2 = assessment_service.unlock_assessment(self.user_id, attempt_id)
        self.assertEqual(res2['status'], 'already_unlocked')
        # Balance must STILL be 1!
        self.assertEqual(wallet_service.get_balance(self.user_id), 1)

    def test_insufficient_credits_protection(self):
        """Test C: User with 0 credits cannot unlock and attempt stays locked."""
        attempt = assessment_service.save_assessment_attempt(
            user_id=self.user_id,
            student_profile={"full_name": "Flow Student"},
            riasec_code="RIA",
            top_careers=[{"name": "Doctor", "score": 88.0, "match_score": 88.0}]
        )
        attempt_id = attempt['attempt_id']
        self.assertEqual(wallet_service.get_balance(self.user_id), 0)

        with self.assertRaises(ValueError):
            assessment_service.unlock_assessment(self.user_id, attempt_id)

        # Attempt must still be locked
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT is_unlocked FROM assessment_attempts WHERE id = %s", (attempt_id,))
            self.assertEqual(cursor.fetchone()['is_unlocked'], 0)
        finally:
            conn.close()

    def test_submission_debounce_prevention(self):
        """Test D: Submissions within 5s with same RIASEC code reuse existing attempt."""
        att1 = assessment_service.save_assessment_attempt(
            user_id=self.user_id,
            student_profile={"full_name": "Flow Student"},
            riasec_code="SEC",
            top_careers=[{"name": "Counselor", "score": 85.0}]
        )
        # Immediate subsequent submission
        att2 = assessment_service.save_assessment_attempt(
            user_id=self.user_id,
            student_profile={"full_name": "Flow Student"},
            riasec_code="SEC",
            top_careers=[{"name": "Counselor", "score": 85.0}]
        )
        self.assertEqual(att1['attempt_id'], att2['attempt_id'])

    def test_get_user_attempts_clustering(self):
        """Test E: Duplicate attempts in DB are clustered and preserve unlocked state."""
        conn = get_db_connection()
        id1 = f"ast_{uuid.uuid4().hex[:12]}"
        id2 = f"ast_{uuid.uuid4().hex[:12]}"
        now = datetime.now()
        now_str = now.isoformat()
        twin_time_str = (now + timedelta(milliseconds=60)).isoformat()
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO assessment_attempts (id, user_id, riasec_code, is_unlocked, created_at, completed_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (id1, self.user_id, 'IEC', 1, now_str, now_str))
                cursor.execute("""
                    INSERT INTO assessment_attempts (id, user_id, riasec_code, is_unlocked, created_at, completed_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (id2, self.user_id, 'IEC', 0, twin_time_str, twin_time_str))

            attempts = assessment_service.get_user_attempts(self.user_id)
            # Both duplicates should be clustered into exactly ONE record
            iec_attempts = [a for a in attempts if a['riasec_code'] == 'IEC']
            self.assertEqual(len(iec_attempts), 1)
            # The cluster must be unlocked since one of the replicas was unlocked!
            self.assertTrue(iec_attempts[0]['is_unlocked'])
        finally:
            conn.close()

    def test_dynamic_campaign_progress(self):
        """Test F: Campaign progress calculation returns authoritative redemptions and percentage."""
        cmp_code = f"TESTCMP_{uuid.uuid4().hex[:6].upper()}"
        code_obj = campaign_service.create_campaign_code(
            code=cmp_code,
            campaign_name="Test School Workshop",
            valid_from=datetime.now().isoformat(),
            valid_until=(datetime.now() + timedelta(days=7)).isoformat(),
            max_uses=10,
            benefit_type="FREE_CREDIT",
            benefit_value=1
        )
        code_id = code_obj['id']

        # Redeem 3 times with 3 different users
        for i in range(3):
            u_email = f"cmp_user_{uuid.uuid4().hex[:6]}@example.com"
            u_reg = auth_service.create_user(email=u_email, password="Pass1234!", full_name=f"User {i}")
            campaign_service.redeem_code(u_reg['id'], cmp_code)

        all_c = campaign_service.get_all_campaigns()
        target = next((c for c in all_c if c['id'] == code_id), None)
        self.assertIsNotNone(target)
        self.assertEqual(target['redemptions_used'], 3)
        self.assertEqual(target['redemption_limit'], 10)
        self.assertEqual(target['redemption_percentage'], 30.0)

if __name__ == '__main__':
    unittest.main()
