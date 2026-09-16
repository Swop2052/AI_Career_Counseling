# tests/test_super_admin_user_management.py
"""
Test Suite for Super Admin User Management & Role Authorization.

Verifies:
1. Super Admin can invite/create Developer and another Super Admin.
2. Server-side role validation against explicit allowlist ({'DEVELOPER', 'SUPER_ADMIN'}).
3. Unauthenticated, regular USER, and Developer access controls.
4. Developers cannot create Super Admins or grant elevated privileges.
5. Invitation resending, token invalidation, and prevention of resend on active accounts.
6. Invitation setup / password establishment and single-use enforcement.
7. Deactivation and reactivation behaviors including self-deactivation prevention.
8. Comprehensive audit logging for all account actions.
"""

import unittest
import uuid
from datetime import datetime, timedelta
from app import app
from database.schema import get_db_connection
from services.auth_service import auth_service
from werkzeug.security import check_password_hash


class TestSuperAdminUserManagement(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.uid = uuid.uuid4().hex[:8]

        # 1. Super Admin Account
        self.super_admin_email = f"sa_{self.uid}@skillsense.test"
        self.super_admin_pwd = "SuperSecurePassword123!"
        self.super_admin = auth_service.create_user(
            email=self.super_admin_email,
            password=self.super_admin_pwd,
            full_name=f"Super Admin {self.uid}",
            role='SUPER_ADMIN'
        )
        # Ensure role and permissions in DB
        conn = get_db_connection()
        with conn:
            conn.execute("UPDATE users SET role = 'SUPER_ADMIN', can_manage_developers = 1 WHERE id = %s",
                         (self.super_admin['id'],))
        conn.close()

        # 2. Developer Account WITH can_manage_developers permission
        self.dev_manager_email = f"dev_mgr_{self.uid}@skillsense.test"
        self.dev_manager_pwd = "DevManagerPass123!"
        self.dev_manager = auth_service.create_user(
            email=self.dev_manager_email,
            password=self.dev_manager_pwd,
            full_name=f"Dev Manager {self.uid}",
            role='DEVELOPER'
        )
        conn = get_db_connection()
        with conn:
            conn.execute("UPDATE users SET role = 'DEVELOPER', can_manage_developers = 1 WHERE id = %s",
                         (self.dev_manager['id'],))
        conn.close()

        # 3. Regular Developer WITHOUT can_manage_developers
        self.regular_dev_email = f"reg_dev_{self.uid}@skillsense.test"
        self.regular_dev_pwd = "RegularDevPass123!"
        self.regular_dev = auth_service.create_user(
            email=self.regular_dev_email,
            password=self.regular_dev_pwd,
            full_name=f"Regular Dev {self.uid}",
            role='DEVELOPER'
        )
        conn = get_db_connection()
        with conn:
            conn.execute("UPDATE users SET role = 'DEVELOPER', can_manage_developers = 0 WHERE id = %s",
                         (self.regular_dev['id'],))
        conn.close()

        # 4. Standard Student/User
        self.student_email = f"student_{self.uid}@skillsense.test"
        self.student_pwd = "StudentPass123!"
        self.student = auth_service.create_user(
            email=self.student_email,
            password=self.student_pwd,
            full_name=f"Student {self.uid}",
            role='USER'
        )

    def tearDown(self):
        # Clean up created test accounts
        conn = get_db_connection()
        try:
            with conn:
                conn.execute("DELETE FROM developer_invitations WHERE email LIKE %s", (f"%{self.uid}%",))
                conn.execute("DELETE FROM password_resets WHERE email LIKE %s", (f"%{self.uid}%",))
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
    # 1. Super Admin Creating Developer & Super Admin
    # -------------------------------------------------------------
    def test_01_super_admin_can_invite_developer(self):
        """Super Admin can successfully invite a Developer."""
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.super_admin['id']
            sess['role'] = 'SUPER_ADMIN'
            sess['can_manage_developers'] = 1

        new_dev_email = f"invited_dev_{self.uid}@skillsense.test"
        res = self.client.post('/api/developer/accounts/invite', json={
            'email': new_dev_email,
            'full_name': 'New Invited Developer',
            'role': 'DEVELOPER',
            'can_manage_developers': 0
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertEqual(data.get('status'), 'success')

        # Verify DB: account exists, inactive, invitation pending
        target = auth_service.get_user_by_email(new_dev_email)
        self.assertIsNotNone(target)
        self.assertEqual(target['role'], 'DEVELOPER')
        self.assertEqual(target['is_active'], 0)

        # Check audit log
        logs = auth_service.get_audit_log(limit=10)
        found = any(l['action'] == 'INVITED_USER' and l['target_email'] == new_dev_email for l in logs)
        self.assertTrue(found, "INVITED_USER audit log entry must be present.")

    def test_02_super_admin_can_invite_super_admin(self):
        """Super Admin can successfully invite another Super Admin."""
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.super_admin['id']
            sess['role'] = 'SUPER_ADMIN'
            sess['can_manage_developers'] = 1

        new_sa_email = f"invited_sa_{self.uid}@skillsense.test"
        res = self.client.post('/api/developer/accounts/invite', json={
            'email': new_sa_email,
            'full_name': 'New Super Admin',
            'role': 'SUPER_ADMIN'
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertEqual(data.get('status'), 'success')

        target = auth_service.get_user_by_email(new_sa_email)
        self.assertIsNotNone(target)
        self.assertEqual(target['role'], 'SUPER_ADMIN')
        self.assertEqual(target['can_manage_developers'], 1)
        self.assertEqual(target['is_active'], 0)

    # -------------------------------------------------------------
    # 2. Authorization & Privilege Escalation Prevention
    # -------------------------------------------------------------
    def test_03_developer_cannot_invite_super_admin(self):
        """Developer (even with can_manage_developers) cannot invite/create Super Admin."""
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.dev_manager['id']
            sess['role'] = 'DEVELOPER'
            sess['can_manage_developers'] = 1

        attack_sa_email = f"escalated_sa_{self.uid}@skillsense.test"
        res = self.client.post('/api/developer/accounts/invite', json={
            'email': attack_sa_email,
            'full_name': 'Escalated Admin',
            'role': 'SUPER_ADMIN'
        })
        self.assertEqual(res.status_code, 403)
        # Verify account was not created
        self.assertIsNone(auth_service.get_user_by_email(attack_sa_email))

    def test_04_regular_developer_without_manage_perm_is_denied(self):
        """Developer without can_manage_developers permission is denied access (403)."""
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.regular_dev['id']
            sess['role'] = 'DEVELOPER'
            sess['can_manage_developers'] = 0

        res = self.client.post('/api/developer/accounts/invite', json={
            'email': f"unauth_dev_{self.uid}@skillsense.test",
            'full_name': 'Unauthorized Invite',
            'role': 'DEVELOPER'
        })
        self.assertEqual(res.status_code, 403)

    def test_05_unauthenticated_and_students_are_denied(self):
        """Unauthenticated requests and student requests are strictly denied."""
        # Unauthenticated
        res = self.client.post('/api/developer/accounts/invite', json={
            'email': f"visitor_dev_{self.uid}@skillsense.test",
            'full_name': 'Visitor',
            'role': 'DEVELOPER'
        })
        self.assertEqual(res.status_code, 401)

        # Student user
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.student['id']
            sess['role'] = 'USER'
        res = self.client.post('/api/developer/accounts/invite', json={
            'email': f"student_dev_{self.uid}@skillsense.test",
            'full_name': 'Student Promo',
            'role': 'DEVELOPER'
        })
        self.assertEqual(res.status_code, 403)

    def test_06_unauthorized_roles_are_rejected(self):
        """Invalid or forged roles (e.g. GOD_MODE, ROOT) are rejected with 400."""
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.super_admin['id']
            sess['role'] = 'SUPER_ADMIN'
            sess['can_manage_developers'] = 1

        res = self.client.post('/api/developer/accounts/invite', json={
            'email': f"bogus_role_{self.uid}@skillsense.test",
            'full_name': 'Bogus Role',
            'role': 'GOD_MODE'
        })
        self.assertEqual(res.status_code, 400)

    # -------------------------------------------------------------
    # 3. Invitation Resending & Status Tracking
    # -------------------------------------------------------------
    def test_07_resend_invitation_flow(self):
        """Super Admin can resend invitation for pending account; previous token cancelled."""
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.super_admin['id']
            sess['role'] = 'SUPER_ADMIN'
            sess['can_manage_developers'] = 1

        invite_email = f"resend_target_{self.uid}@skillsense.test"
        # First invite
        self.client.post('/api/developer/accounts/invite', json={
            'email': invite_email,
            'full_name': 'Resend Target',
            'role': 'DEVELOPER'
        })

        # Resend invite
        res = self.client.post('/api/developer/accounts/resend-invite', json={
            'email': invite_email
        })
        self.assertEqual(res.status_code, 200)

        # Verify DB: old invitation cancelled, exactly 1 active PENDING invitation
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT status, count(*) as count FROM developer_invitations WHERE email = %s GROUP BY status", (invite_email,))
        status_counts = {r['status']: int(r['count']) for r in cur.fetchall()}
        conn.close()

        self.assertEqual(status_counts.get('CANCELLED'), 1)
        self.assertEqual(status_counts.get('PENDING'), 1)

    def test_08_cannot_resend_for_active_account(self):
        """Resend invitation is rejected if the account is already active."""
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.super_admin['id']
            sess['role'] = 'SUPER_ADMIN'
            sess['can_manage_developers'] = 1

        res = self.client.post('/api/developer/accounts/resend-invite', json={
            'email': self.super_admin_email
        })
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertIn("already active", data.get('error', '').lower())

    # -------------------------------------------------------------
    # 4. Invitation Acceptance & Password Setup
    # -------------------------------------------------------------
    def test_09_accept_invitation_activates_user_and_logs_in(self):
        """Invited user sets password via setup-account, activates account, single-use enforced."""
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.super_admin['id']
            sess['role'] = 'SUPER_ADMIN'
            sess['can_manage_developers'] = 1

        target_email = f"activate_test_{self.uid}@skillsense.test"
        invite_res = self.client.post('/api/developer/accounts/invite', json={
            'email': target_email,
            'full_name': 'Pending Activator',
            'role': 'DEVELOPER'
        })
        self.assertEqual(invite_res.status_code, 201)
        raw_token = invite_res.get_json()['invitation']['raw_token']

        # Accept invitation via /api/auth/setup-account
        new_password = "NewlyCreatedPass123!"
        accept_res = self.client.post('/api/auth/setup-account', json={
            'token': raw_token,
            'password': new_password,
            'full_name': 'Active Developer'
        })
        self.assertEqual(accept_res.status_code, 200)

        # Verify DB: account is active, password authenticates successfully
        user = auth_service.authenticate_user(target_email, new_password)
        self.assertIsNotNone(user)
        self.assertEqual(user['role'], 'DEVELOPER')
        self.assertEqual(user['is_active'], 1)

        # Verify replay prevention: token cannot be reused
        replay_res = self.client.post('/api/auth/setup-account', json={
            'token': raw_token,
            'password': "AnotherPassword123!"
        })
        self.assertEqual(replay_res.status_code, 400)

    # -------------------------------------------------------------
    # 5. Account Status Management (Deactivate / Reactivate)
    # -------------------------------------------------------------
    def test_10_super_admin_can_toggle_developer_status(self):
        """Super Admin can disable and re-enable a developer account; self-deactivation blocked."""
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.super_admin['id']
            sess['role'] = 'SUPER_ADMIN'
            sess['can_manage_developers'] = 1

        # Deactivate regular developer
        res = self.client.post(f'/api/developer/accounts/{self.regular_dev["id"]}/status', json={
            'is_active': 0
        })
        self.assertEqual(res.status_code, 200)

        target = auth_service.get_user_by_id(self.regular_dev['id'])
        self.assertEqual(target['is_active'], 0)

        # Reactivate regular developer
        res = self.client.post(f'/api/developer/accounts/{self.regular_dev["id"]}/status', json={
            'is_active': 1
        })
        self.assertEqual(res.status_code, 200)
        target = auth_service.get_user_by_id(self.regular_dev['id'])
        self.assertEqual(target['is_active'], 1)

        # Self-deactivation prevention
        res = self.client.post(f'/api/developer/accounts/{self.super_admin["id"]}/status', json={
            'is_active': 0
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("cannot deactivate your own", res.get_json().get('error', '').lower())


if __name__ == '__main__':
    unittest.main()
