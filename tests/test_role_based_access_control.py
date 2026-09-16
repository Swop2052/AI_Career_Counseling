# tests/test_role_based_access_control.py
"""
Test Suite: Role-Based Access Control and Super Admin Security Hardening.

Verifies:
1. Super Admin login -> dropdown/me returns role 'SUPER_ADMIN' -> can access verify-super-admin,
   can list accounts, can invite Developers and Super Admins.
2. Developer login -> me returns role 'DEVELOPER' -> developer stats & plans accessible ->
   Super Admin-only endpoints (/verify-super-admin, /accounts, /accounts/invite for SA) strictly return 403.
3. Ordinary User login -> all /api/developer/* endpoints return 403.
4. Unauthenticated access -> returns 401.
5. Role switching / clean logout in same client -> no stale role or permission leakage.
"""

import unittest
import uuid
from app import app
from database.schema import get_db_connection
from services.auth_service import auth_service


class TestRoleBasedAccessControl(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.uid = uuid.uuid4().hex[:8]

        # 1. Super Admin user
        self.sa_email = f"sa_{self.uid}@skillsense.test"
        self.sa_pwd = "SuperAdminPassword123!"
        self.super_admin = auth_service.create_user(
            email=self.sa_email,
            password=self.sa_pwd,
            full_name=f"Super Admin {self.uid}",
            role='SUPER_ADMIN'
        )
        conn = get_db_connection()
        with conn:
            conn.execute("UPDATE users SET role = 'SUPER_ADMIN', can_manage_developers = 1 WHERE id = %s",
                         (self.super_admin['id'],))
        conn.close()

        # 2. Standard Developer user (can_manage_developers = 0)
        self.dev_email = f"dev_{self.uid}@skillsense.test"
        self.dev_pwd = "DevPassword123!"
        self.developer = auth_service.create_user(
            email=self.dev_email,
            password=self.dev_pwd,
            full_name=f"Developer {self.uid}",
            role='DEVELOPER'
        )
        conn = get_db_connection()
        with conn:
            conn.execute("UPDATE users SET role = 'DEVELOPER', can_manage_developers = 0 WHERE id = %s",
                         (self.developer['id'],))
        conn.close()

        # 3. Regular Student / User
        self.student_email = f"student_{self.uid}@skillsense.test"
        self.student_pwd = "StudentPassword123!"
        self.student = auth_service.create_user(
            email=self.student_email,
            password=self.student_pwd,
            full_name=f"Student {self.uid}",
            role='USER'
        )

    def tearDown(self):
        conn = get_db_connection()
        try:
            with conn:
                conn.execute("DELETE FROM developer_invitations WHERE email LIKE %s", (f"%{self.uid}%",))
                conn.execute("DELETE FROM audit_log WHERE actor_email LIKE %s OR target_email LIKE %s",
                             (f"%{self.uid}%", f"%{self.uid}%"))
                conn.execute("DELETE FROM credit_wallets WHERE user_id IN (SELECT id FROM users WHERE email LIKE %s)",
                             (f"%{self.uid}%",))
                conn.execute("DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE %s)",
                             (f"%{self.uid}%",))
                conn.execute("DELETE FROM users WHERE email LIKE %s", (f"%{self.uid}%",))
        finally:
            conn.close()

    # -------------------------------------------------------------
    # Scenario 1: Super Admin Complete Authorization Flow
    # -------------------------------------------------------------
    def test_01_super_admin_full_access(self):
        """Super Admin logs in -> /api/auth/me has role SUPER_ADMIN -> can verify SA -> can manage accounts."""
        # Login
        login_res = self.client.post('/api/auth/login', json={
            'email': self.sa_email,
            'password': self.sa_pwd
        })
        self.assertEqual(login_res.status_code, 200)
        login_data = login_res.get_json()
        self.assertEqual(login_data['user']['role'], 'SUPER_ADMIN')

        # /api/auth/me
        me_res = self.client.get('/api/auth/me')
        self.assertEqual(me_res.status_code, 200)
        me_data = me_res.get_json()
        self.assertTrue(me_data['authenticated'])
        self.assertEqual(me_data['user']['role'], 'SUPER_ADMIN')

        # /api/developer/verify-super-admin
        v_res = self.client.get('/api/developer/verify-super-admin')
        self.assertEqual(v_res.status_code, 200)
        v_data = v_res.get_json()
        self.assertTrue(v_data.get('is_super_admin'))
        self.assertEqual(v_data.get('role'), 'SUPER_ADMIN')

        # /api/developer/accounts
        acc_res = self.client.get('/api/developer/accounts')
        self.assertEqual(acc_res.status_code, 200)
        acc_data = acc_res.get_json()
        self.assertIn('accounts', acc_data)

        # Invite Developer
        inv_dev_email = f"new_dev_{self.uid}@skillsense.test"
        inv_res = self.client.post('/api/developer/accounts/invite', json={
            'email': inv_dev_email,
            'full_name': 'New Dev by SA',
            'role': 'DEVELOPER',
            'can_manage_developers': 0
        })
        self.assertEqual(inv_res.status_code, 201)

        # Invite Super Admin
        inv_sa_email = f"new_sa_{self.uid}@skillsense.test"
        inv_sa_res = self.client.post('/api/developer/accounts/invite', json={
            'email': inv_sa_email,
            'full_name': 'New SA by SA',
            'role': 'SUPER_ADMIN'
        })
        self.assertEqual(inv_sa_res.status_code, 201)

    # -------------------------------------------------------------
    # Scenario 2: Developer Access Restriction & Super Admin Protection
    # -------------------------------------------------------------
    def test_02_developer_restricted_from_super_admin(self):
        """Developer logs in -> has Developer console access -> Super Admin endpoints return 403."""
        login_res = self.client.post('/api/auth/login', json={
            'email': self.dev_email,
            'password': self.dev_pwd
        })
        self.assertEqual(login_res.status_code, 200)
        login_data = login_res.get_json()
        self.assertEqual(login_data['user']['role'], 'DEVELOPER')

        # Developer can access developer stats and plans
        stats_res = self.client.get('/api/developer/stats')
        self.assertEqual(stats_res.status_code, 200)

        plans_res = self.client.get('/api/developer/plans')
        self.assertEqual(plans_res.status_code, 200)

        # Developer CANNOT verify as Super Admin (direct Super Admin URL/API guard)
        v_res = self.client.get('/api/developer/verify-super-admin')
        self.assertEqual(v_res.status_code, 403)
        self.assertIn('Super Admin role required', v_res.get_json().get('error', ''))

        # Developer without management permission CANNOT list accounts
        acc_res = self.client.get('/api/developer/accounts')
        self.assertEqual(acc_res.status_code, 403)

        # Developer CANNOT invite a Super Admin
        inv_res = self.client.post('/api/developer/accounts/invite', json={
            'email': f"hacked_sa_{self.uid}@skillsense.test",
            'full_name': 'Hacked SA',
            'role': 'SUPER_ADMIN'
        })
        self.assertEqual(inv_res.status_code, 403)

        # Developer CANNOT update permissions
        perm_res = self.client.post(f'/api/developer/accounts/{self.developer["id"]}/permissions', json={
            'can_manage_developers': 1
        })
        self.assertEqual(perm_res.status_code, 403)

    # -------------------------------------------------------------
    # Scenario 3: Ordinary User Has Zero Administrative Access
    # -------------------------------------------------------------
    def test_03_ordinary_user_denied_all_admin_endpoints(self):
        """Ordinary Student user logs in -> all /api/developer/* endpoints return 403."""
        login_res = self.client.post('/api/auth/login', json={
            'email': self.student_email,
            'password': self.student_pwd
        })
        self.assertEqual(login_res.status_code, 200)
        self.assertEqual(login_res.get_json()['user']['role'], 'USER')

        endpoints = [
            ('/api/developer/verify-super-admin', 'GET'),
            ('/api/developer/stats', 'GET'),
            ('/api/developer/plans', 'GET'),
            ('/api/developer/accounts', 'GET'),
            ('/api/developer/audit-log', 'GET'),
            ('/api/developer/users', 'GET')
        ]
        for url, method in endpoints:
            if method == 'GET':
                r = self.client.get(url)
            else:
                r = self.client.post(url, json={})
            self.assertEqual(r.status_code, 403, f"Endpoint {url} should return 403 for ordinary USER")

    # -------------------------------------------------------------
    # Scenario 4: Unauthenticated Requests Denied
    # -------------------------------------------------------------
    def test_04_unauthenticated_requests_denied(self):
        """Unauthenticated calls return 401."""
        endpoints = [
            '/api/developer/verify-super-admin',
            '/api/developer/stats',
            '/api/developer/plans',
            '/api/developer/accounts'
        ]
        for url in endpoints:
            r = self.client.get(url)
            self.assertEqual(r.status_code, 401, f"Endpoint {url} should return 401 when not logged in")

    # -------------------------------------------------------------
    # Scenario 5: Role Switching in Same Client / Browser
    # -------------------------------------------------------------
    def test_05_role_switching_session_isolation(self):
        """Switching roles via logout/login cleanly changes session privileges without leakage."""
        # 1. Login as Super Admin
        self.client.post('/api/auth/login', json={'email': self.sa_email, 'password': self.sa_pwd})
        self.assertEqual(self.client.get('/api/developer/verify-super-admin').status_code, 200)

        # 2. Logout
        logout_res = self.client.post('/api/auth/logout')
        self.assertEqual(logout_res.status_code, 200)
        self.assertEqual(self.client.get('/api/developer/verify-super-admin').status_code, 401)

        # 3. Login as Developer in same client
        self.client.post('/api/auth/login', json={'email': self.dev_email, 'password': self.dev_pwd})
        # Verify Developer is denied Super Admin
        self.assertEqual(self.client.get('/api/developer/verify-super-admin').status_code, 403)
        # Verify Developer CAN access developer stats
        self.assertEqual(self.client.get('/api/developer/stats').status_code, 200)

        # 4. Logout and login as Student in same client
        self.client.post('/api/auth/logout')
        self.client.post('/api/auth/login', json={'email': self.student_email, 'password': self.student_pwd})
        # Student denied both developer stats and super admin
        self.assertEqual(self.client.get('/api/developer/verify-super-admin').status_code, 403)
        self.assertEqual(self.client.get('/api/developer/stats').status_code, 403)
