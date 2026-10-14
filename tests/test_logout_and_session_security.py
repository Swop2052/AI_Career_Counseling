import json
import os
import sys
import unittest
import uuid
import werkzeug

# Werkzeug 3.0+ compatibility
if not hasattr(werkzeug, '__version__'):
    try:
        import importlib.metadata
        werkzeug.__version__ = importlib.metadata.version('werkzeug')
    except Exception:
        werkzeug.__version__ = '3.0.0'

# Ensure project root is in path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from app import app
from database.schema import get_db_connection
from services.auth_service import auth_service
from services.assessment_service import assessment_service
from services.wallet_service import wallet_service


class TestLogoutAndSessionSecurity(unittest.TestCase):
    """
    Comprehensive regression and security test suite covering:
    - Logout and server-side session invalidation
    - Cookie deletion and anti-cache headers
    - Post-logout protected API rejection
    - Invalidated session reuse prevention
    - Role-Based Access Control (RBAC) enforcement
    - IDOR attempt protection and locked report shielding
    - Atomic credit deductions & idempotent unlocking
    - Sensitive path and dotfile blocking
    - Deactivated user revocation
    """

    @classmethod
    def setUpClass(cls):
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        cls.client = app.test_client()

        # Seed Test User A
        cls.user_a_email = f"user_a_{uuid.uuid4().hex[:6]}@example.com"
        cls.password = "StrongPassword@123"
        cls.user_a = auth_service.create_user(
            email=cls.user_a_email,
            password=cls.password,
            full_name="User A",
            role="USER"
        )
        cls.user_a_id = cls.user_a['id']

        # Seed Test User B
        cls.user_b_email = f"user_b_{uuid.uuid4().hex[:6]}@example.com"
        cls.user_b = auth_service.create_user(
            email=cls.user_b_email,
            password=cls.password,
            full_name="User B",
            role="USER"
        )
        cls.user_b_id = cls.user_b['id']

        # Seed Developer User
        cls.dev_email = f"dev_{uuid.uuid4().hex[:6]}@example.com"
        cls.dev_user = auth_service.create_user(
            email=cls.dev_email,
            password=cls.password,
            full_name="Developer",
            role="DEVELOPER"
        )
        cls.dev_id = cls.dev_user['id']

        # Seed Super Admin User
        cls.admin_email = f"admin_{uuid.uuid4().hex[:6]}@example.com"
        cls.admin_user = auth_service.create_user(
            email=cls.admin_email,
            password=cls.password,
            full_name="Super Admin",
            role="SUPER_ADMIN"
        )
        cls.admin_id = cls.admin_user['id']

        # Create sample assessment for User B (to test IDOR against User A)
        sample_scores = {"R": 20, "I": 20, "A": 15, "S": 15, "E": 10, "C": 10}
        top_careers = [
            {"career_name": "Software Engineer", "score": 90.0, "name": "Software Engineer"}
        ]
        attempt_b = assessment_service.save_assessment_attempt(
            user_id=cls.user_b_id,
            student_profile={"full_name": "User B"},
            riasec_answers=[4] * 42,
            riasec_scores=sample_scores,
            riasec_code="RIA",
            top_careers=top_careers
        )
        cls.attempt_b_id = attempt_b['attempt_id']

    # -------------------------------------------------------------------------
    # 1. LOGOUT & SERVER-SIDE SESSION INVALIDATION
    # -------------------------------------------------------------------------
    def test_01_logout_invalidates_session_and_sets_anticache_headers(self):
        """Verify logout clears session, deletes cookie, and sends strict anti-cache headers."""
        client = app.test_client()

        # Step 1: Log in
        login_res = client.post('/api/auth/login', json={
            'email': self.user_a_email,
            'password': self.password
        })
        self.assertEqual(login_res.status_code, 200)

        # Verify authenticated
        me_res = client.get('/api/auth/me')
        self.assertEqual(me_res.status_code, 200)
        self.assertTrue(me_res.get_json().get('authenticated'))

        # Step 2: Log out
        logout_res = client.post('/api/auth/logout')
        self.assertEqual(logout_res.status_code, 200)
        
        # Verify strict anti-cache headers on logout
        cache_control = logout_res.headers.get('Cache-Control', '')
        self.assertIn('no-store', cache_control)
        self.assertIn('no-cache', cache_control)
        self.assertIn('must-revalidate', cache_control)

        # Step 3: Verify subsequent call to /me is unauthenticated
        post_me = client.get('/api/auth/me')
        self.assertEqual(post_me.status_code, 200)
        self.assertFalse(post_me.get_json().get('authenticated'))
        self.assertIsNone(post_me.get_json().get('user'))

    def test_02_post_logout_protected_apis_return_401(self):
        """Verify that after logout, calling protected APIs is rejected with 401."""
        client = app.test_client()

        # Log in
        client.post('/api/auth/login', json={
            'email': self.user_a_email,
            'password': self.password
        })

        # Log out
        client.post('/api/auth/logout')

        # Attempt to access protected profile / account summary
        summary_res = client.get('/api/account/summary')
        self.assertEqual(summary_res.status_code, 401)
        data = summary_res.get_json()
        self.assertIn('Authentication required', data.get('error', ''))

    def test_03_direct_unauthenticated_api_access_rejected_with_401(self):
        """Verify fresh unauthenticated client cannot access protected APIs directly."""
        fresh_client = app.test_client()

        endpoints = [
            ('/api/account/summary', 'GET'),
            ('/api/developer/stats', 'GET'),
            ('/api/developer/accounts', 'GET'),
            (f'/api/assessment/{self.attempt_b_id}/full', 'GET'),
            (f'/api/assessment/{self.attempt_b_id}/unlock', 'POST'),
        ]

        for ep, method in endpoints:
            if method == 'GET':
                res = fresh_client.get(ep)
            else:
                res = fresh_client.post(ep, json={})
            self.assertEqual(res.status_code, 401, f"Expected 401 for unauthenticated {method} {ep}")

    # -------------------------------------------------------------------------
    # 2. ROLE-BASED ACCESS CONTROL (RBAC) ENFORCEMENT
    # -------------------------------------------------------------------------
    def test_04_user_cannot_access_developer_or_admin_endpoints(self):
        """Verify normal USER role is forbidden from developer and admin APIs."""
        client = app.test_client()
        client.post('/api/auth/login', json={
            'email': self.user_a_email,
            'password': self.password
        })

        dev_endpoints = [
            '/api/developer/stats',
            '/api/developer/users',
            '/api/developer/plans',
            '/api/developer/campaigns',
            '/api/developer/accounts',
        ]
        for ep in dev_endpoints:
            res = client.get(ep)
            self.assertEqual(res.status_code, 403, f"Student should get 403 on {ep}")

    def test_05_developer_cannot_access_super_admin_endpoints(self):
        """Verify DEVELOPER role cannot access super admin actions without permission."""
        client = app.test_client()
        client.post('/api/auth/login', json={
            'email': self.dev_email,
            'password': self.password
        })

        # Attempt to invite developer without can_manage_developers flag
        res = client.post('/api/developer/accounts/invite', json={
            'email': 'unauthorized_invite@example.com',
            'full_name': 'Unauthorized',
            'role': 'DEVELOPER'
        })
        self.assertEqual(res.status_code, 403)

    # -------------------------------------------------------------------------
    # 3. IDOR & LOCKED REPORT PROTECTION
    # -------------------------------------------------------------------------
    def test_06_user_cannot_access_other_users_report(self):
        """Verify User A cannot access User B's assessment report (IDOR defense)."""
        client = app.test_client()
        client.post('/api/auth/login', json={
            'email': self.user_a_email,
            'password': self.password
        })

        # User A tries to view User B's report
        res = client.get(f'/api/assessment/{self.attempt_b_id}/full')
        self.assertEqual(res.status_code, 403)

        # User A tries to view User B's teaser
        teaser_res = client.get(f'/api/assessment/{self.attempt_b_id}/teaser')
        self.assertEqual(teaser_res.status_code, 403)

    def test_07_locked_assessment_rejects_full_report_access(self):
        """Verify locked assessment does not expose full report without unlock."""
        client = app.test_client()
        client.post('/api/auth/login', json={
            'email': self.user_b_email,
            'password': self.password
        })

        # User B attempts to access full report before unlocking
        res = client.get(f'/api/assessment/{self.attempt_b_id}/full')
        self.assertIn(res.status_code, (400, 402))
        data = res.get_json()
        self.assertTrue(data.get('is_locked') or 'locked' in data.get('error', '').lower())

    def test_08_unlock_insufficient_credits_returns_402(self):
        """Verify unlocking without sufficient credits fails with 402."""
        client = app.test_client()
        client.post('/api/auth/login', json={
            'email': self.user_b_email,
            'password': self.password
        })

        # Ensure User B balance is 0
        bal = wallet_service.get_balance(self.user_b_id)
        if bal > 0:
            wallet_service.deduct_credit(self.user_b_id, bal, 'test_reset', 'test')

        res = client.post(f'/api/assessment/{self.attempt_b_id}/unlock')
        self.assertEqual(res.status_code, 402)
        data = res.get_json()
        self.assertTrue(data.get('insufficient_credits'))

    def test_09_atomic_unlock_deducts_exactly_one_credit_and_is_idempotent(self):
        """Verify report unlock deducts exactly 1 credit atomically and repeat calls are free."""
        client = app.test_client()
        client.post('/api/auth/login', json={
            'email': self.user_b_email,
            'password': self.password
        })

        # Add 2 credits to User B
        wallet_service.add_credits(self.user_b_id, 2, 'test_seed', 'test', 'test')
        bal_before = wallet_service.get_balance(self.user_b_id)

        # First unlock -> success, balance - 1
        res1 = client.post(f'/api/assessment/{self.attempt_b_id}/unlock')
        self.assertEqual(res1.status_code, 200)
        bal_after1 = wallet_service.get_balance(self.user_b_id)
        self.assertEqual(bal_after1, bal_before - 1)

        # Second unlock -> idempotent, 0 additional deduction
        res2 = client.post(f'/api/assessment/{self.attempt_b_id}/unlock')
        self.assertEqual(res2.status_code, 200)
        bal_after2 = wallet_service.get_balance(self.user_b_id)
        self.assertEqual(bal_after2, bal_after1)
        self.assertEqual(res2.get_json().get('status'), 'already_unlocked')

    # -------------------------------------------------------------------------
    # 4. SENSITIVE PATH PROBE DEFENSE
    # -------------------------------------------------------------------------
    def test_10_sensitive_files_and_dotfiles_blocked_with_404(self):
        """Verify requests for .env, .git, database files, and probe paths return 404."""
        client = app.test_client()
        probes = [
            '/.env',
            '/.git/HEAD',
            '/.git/config',
            '/data/career_guide.db',
            '/app.py',
            '/phpmyadmin',
            '/admin'
        ]
        for p in probes:
            res = client.get(p)
            self.assertEqual(res.status_code, 404, f"Sensitive path {p} must return 404")

    # -------------------------------------------------------------------------
    # 5. DEACTIVATED USER SESSION REVOCATION
    # -------------------------------------------------------------------------
    def test_11_deactivated_account_session_revoked_on_next_request(self):
        """Verify that deactivating a user immediately revokes access upon next verification."""
        client = app.test_client()
        client.post('/api/auth/login', json={
            'email': self.user_a_email,
            'password': self.password
        })

        # Deactivate user in database
        conn = get_db_connection()
        try:
            with conn:
                conn.execute("UPDATE users SET is_active = 0 WHERE id = %s", (self.user_a_id,))
        finally:
            conn.close()

        # Next request to /me must immediately return authenticated: False and clear session
        res = client.get('/api/auth/me')
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.get_json().get('authenticated'))

        # Reactivate user for future test cleanliness
        conn = get_db_connection()
        try:
            with conn:
                conn.execute("UPDATE users SET is_active = 1 WHERE id = %s", (self.user_a_id,))
        finally:
            conn.close()


if __name__ == '__main__':
    unittest.main()
