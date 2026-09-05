"""
Tests for BUG 1: Referral / Campaign Discount Code Validation.
Verifies complete server-side authoritative calculation, error categorization,
and resilience against date formats (ISO 8601 with 'Z', offsets, naive timestamps).
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
from datetime import datetime, timezone, timedelta
from app import app
from database.schema import get_db_connection
from services.auth_service import auth_service
from services.campaign_service import campaign_service, CampaignValidationError
from services.pricing_service import pricing_service


class TestReferralDiscountValidation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = app
        cls.client = cls.app.test_client()
        cls.app.config['TESTING'] = True
        cls.app.config['WTF_CSRF_ENABLED'] = False

        # Ensure we have an active test plan
        cls.plan = pricing_service.get_lowest_active_plan()
        if not cls.plan:
            cls.plan = pricing_service.create_plan(
                name="Test Validation Plan",
                plan_type="CREDIT_PACK",
                price=100.0,
                credits=1,
                currency="INR",
                is_active=1
            )

    def test_01_valid_new_code_with_iso_z_dates(self):
        """Test valid newly created referral code with ISO 8601 'Z' suffix (e.g. SCHOOL21)."""
        code_name = f"SCHOOL21_{uuid.uuid4().hex[:6].upper()}"
        now = datetime.now(timezone.utc)
        valid_from = (now - timedelta(days=1)).strftime('%Y-%m-%dT%H:%M:%S.000Z')
        valid_until = (now + timedelta(days=30)).strftime('%Y-%m-%dT%H:%M:%S.000Z')

        cmp = campaign_service.create_campaign_code(
            code=code_name,
            campaign_name="School 2026 Test Workshop",
            valid_from=valid_from,
            valid_until=valid_until,
            max_uses=100,
            discount_type="PERCENTAGE",
            discount_value=20.0
        )
        self.assertIsNotNone(cmp)

        res = self.client.post('/api/campaigns/validate-discount', json={
            'plan_id': self.plan['id'],
            'code': code_name
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['valid'])
        self.assertEqual(data['status'], 'valid')
        self.assertEqual(data['code'], code_name)
        self.assertEqual(data['discount_type'], 'PERCENTAGE')
        self.assertEqual(data['discount_value'], 20.0)
        self.assertEqual(data['original_price'], float(self.plan['price']))
        expected_disc = round(float(self.plan['price']) * 0.20, 2)
        expected_final = round(float(self.plan['price']) - expected_disc, 2)
        self.assertEqual(data['discount_amount'], expected_disc)
        self.assertEqual(data['final_price'], expected_final)

    def test_02_invalid_code(self):
        """Test non-existent referral code returns invalid_code status."""
        res = self.client.post('/api/campaigns/validate-discount', json={
            'plan_id': self.plan['id'],
            'code': f"NONEXISTENT_{uuid.uuid4().hex[:8]}"
        })
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertFalse(data['valid'])
        self.assertEqual(data['status'], 'invalid_code')
        self.assertIn('invalid or does not exist', data['error'].lower())

    def test_03_expired_code(self):
        """Test code with past valid_until returns expired_code status."""
        code_name = f"EXPIRED_{uuid.uuid4().hex[:6].upper()}"
        now = datetime.now()
        past_from = (now - timedelta(days=30)).isoformat()
        past_until = (now - timedelta(days=1)).isoformat()

        campaign_service.create_campaign_code(
            code=code_name,
            campaign_name="Old Camp",
            valid_from=past_from,
            valid_until=past_until,
            max_uses=100
        )

        res = self.client.post('/api/campaigns/validate-discount', json={
            'plan_id': self.plan['id'],
            'code': code_name
        })
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertFalse(data['valid'])
        self.assertEqual(data['status'], 'expired_code')
        self.assertIn('expired', data['error'].lower())

    def test_04_future_code_not_started(self):
        """Test code with future valid_from returns expired_code/not_started status."""
        code_name = f"FUTURE_{uuid.uuid4().hex[:6].upper()}"
        now = datetime.now()
        future_from = (now + timedelta(days=10)).isoformat()
        future_until = (now + timedelta(days=40)).isoformat()

        campaign_service.create_campaign_code(
            code=code_name,
            campaign_name="Future Camp",
            valid_from=future_from,
            valid_until=future_until,
            max_uses=100
        )

        res = self.client.post('/api/campaigns/validate-discount', json={
            'plan_id': self.plan['id'],
            'code': code_name
        })
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertFalse(data['valid'])
        self.assertEqual(data['status'], 'expired_code')
        self.assertIn('not active yet', data['error'].lower())

    def test_05_inactive_code(self):
        """Test deactivated code returns inactive_code status."""
        code_name = f"INACTIVE_{uuid.uuid4().hex[:6].upper()}"
        now = datetime.now()
        cmp = campaign_service.create_campaign_code(
            code=code_name,
            campaign_name="Deactivated Camp",
            valid_from=(now - timedelta(days=1)).isoformat(),
            valid_until=(now + timedelta(days=10)).isoformat(),
            max_uses=100
        )
        campaign_service.set_campaign_active(cmp['id'], 0)

        res = self.client.post('/api/campaigns/validate-discount', json={
            'plan_id': self.plan['id'],
            'code': code_name
        })
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertFalse(data['valid'])
        self.assertEqual(data['status'], 'inactive_code')
        self.assertIn('deactivated', data['error'].lower())

    def test_06_exhausted_code(self):
        """Test code reaching max_uses returns exhausted_code status."""
        code_name = f"EXHAUST_{uuid.uuid4().hex[:6].upper()}"
        now = datetime.now()
        cmp = campaign_service.create_campaign_code(
            code=code_name,
            campaign_name="Capped Camp",
            valid_from=(now - timedelta(days=1)).isoformat(),
            valid_until=(now + timedelta(days=10)).isoformat(),
            max_uses=1
        )
        # Artificially set used_count to max_uses
        conn = get_db_connection()
        with conn:
            conn.execute("UPDATE campaign_codes SET used_count = 1 WHERE id = ?", (cmp['id'],))
        conn.close()

        res = self.client.post('/api/campaigns/validate-discount', json={
            'plan_id': self.plan['id'],
            'code': code_name
        })
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertFalse(data['valid'])
        self.assertEqual(data['status'], 'exhausted_code')
        self.assertIn('maximum usage limit', data['error'].lower())

    def test_07_already_used_per_user_code(self):
        """Test user attempting to validate code they already redeemed returns already_used status."""
        code_name = f"ONCE_{uuid.uuid4().hex[:6].upper()}"
        now = datetime.now()
        cmp = campaign_service.create_campaign_code(
            code=code_name,
            campaign_name="Single Use Camp",
            valid_from=(now - timedelta(days=1)).isoformat(),
            valid_until=(now + timedelta(days=10)).isoformat(),
            max_uses=100,
            one_use_per_user=1
        )

        test_user = auth_service.create_user(
            email=f"user_{uuid.uuid4().hex[:6]}@example.com",
            password="Password@123",
            full_name="Single Use Student"
        )

        # Record redemption for this user
        campaign_service.record_discount_redemption(
            campaign_code_id=cmp['id'],
            user_id=test_user['id'],
            payment_id="pay_mock_test_123",
            discount_amount=10.0
        )

        # Log in as test_user
        with self.client.session_transaction() as sess:
            sess['user_id'] = test_user['id']
            sess['role'] = 'USER'

        res = self.client.post('/api/campaigns/validate-discount', json={
            'plan_id': self.plan['id'],
            'code': code_name
        })
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertFalse(data['valid'])
        self.assertEqual(data['status'], 'already_used')
        self.assertIn('already used', data['error'].lower())

    def test_08_fixed_discount_type(self):
        """Test fixed rupee discount (e.g. ₹50 off) and capping at original price."""
        code_name = f"FIXED50_{uuid.uuid4().hex[:6].upper()}"
        now = datetime.now()
        campaign_service.create_campaign_code(
            code=code_name,
            campaign_name="Fixed 50 OFF",
            valid_from=(now - timedelta(days=1)).isoformat(),
            valid_until=(now + timedelta(days=10)).isoformat(),
            max_uses=100,
            discount_type="FIXED",
            discount_value=50.0
        )

        res = self.client.post('/api/campaigns/validate-discount', json={
            'plan_id': self.plan['id'],
            'code': code_name
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['valid'])
        self.assertEqual(data['discount_type'], 'FIXED')
        orig_price = float(self.plan['price'])
        expected_disc = min(50.0, orig_price)
        self.assertEqual(data['discount_amount'], expected_disc)
        self.assertEqual(data['final_price'], round(orig_price - expected_disc, 2))

    def test_09_zero_price_100_percent_discount(self):
        """Test 100% discount resulting in zero final price."""
        code_name = f"FREE100_{uuid.uuid4().hex[:6].upper()}"
        now = datetime.now()
        campaign_service.create_campaign_code(
            code=code_name,
            campaign_name="100% Free Access",
            valid_from=(now - timedelta(days=1)).isoformat(),
            valid_until=(now + timedelta(days=10)).isoformat(),
            max_uses=100,
            discount_type="PERCENTAGE",
            discount_value=100.0
        )

        res = self.client.post('/api/campaigns/validate-discount', json={
            'plan_id': self.plan['id'],
            'code': code_name
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['valid'])
        self.assertEqual(data['final_price'], 0.0)
        self.assertEqual(data['discount_amount'], float(self.plan['price']))

    def test_10_plan_not_eligible(self):
        """Test invalid or inactive plan returns plan_not_eligible status."""
        res = self.client.post('/api/campaigns/validate-discount', json={
            'plan_id': 'non_existent_plan_id_999',
            'code': 'SCHOOL20'
        })
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertFalse(data['valid'])
        self.assertEqual(data['status'], 'plan_not_eligible')

    def test_11_case_insensitivity_and_whitespace(self):
        """Test that validation correctly strips whitespace and handles lowercase codes."""
        code_name = f"TRIM_{uuid.uuid4().hex[:6].upper()}"
        now = datetime.now()
        campaign_service.create_campaign_code(
            code=code_name,
            campaign_name="Trim Test",
            valid_from=(now - timedelta(days=1)).isoformat(),
            valid_until=(now + timedelta(days=10)).isoformat(),
            max_uses=100,
            discount_type="PERCENTAGE",
            discount_value=15.0
        )

        res = self.client.post('/api/campaigns/validate-discount', json={
            'plan_id': self.plan['id'],
            'code': f"  {code_name.lower()}  "
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['valid'])
        self.assertEqual(data['code'], code_name)


if __name__ == '__main__':
    unittest.main()
