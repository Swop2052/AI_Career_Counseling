import io
import json
import os
import sys
import unittest
import uuid

# Add project root to sys.path
project_root = r"E:\projects\AI_Career_Counseling"
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from app import app
from database.migrations import get_db_connection
from services.auth_service import auth_service
from services.assessment_service import assessment_service


class TestSkillSenseRouteAndApiSecurity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        cls.client = app.test_client()

        # Create or fetch test users in database
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            # Student A
            cls.student_a_email = f"student_a_{uuid.uuid4().hex[:6]}@example.com"
            user_a = auth_service.create_user(
                email=cls.student_a_email,
                password="Password@123",
                full_name="Student A",
                role="USER"
            )
            cls.student_a_id = user_a['id']

            # Student B
            cls.student_b_email = f"student_b_{uuid.uuid4().hex[:6]}@example.com"
            user_b = auth_service.create_user(
                email=cls.student_b_email,
                password="Password@123",
                full_name="Student B",
                role="USER"
            )
            cls.student_b_id = user_b['id']

            # Developer (without developer management)
            cls.dev_email = f"dev_{uuid.uuid4().hex[:6]}@example.com"
            dev = auth_service.create_user(
                email=cls.dev_email,
                password="Password@123",
                full_name="Dev User",
                role="DEVELOPER"
            )
            cls.dev_id = dev['id']

            # Super Admin
            cursor.execute("SELECT id, email FROM users WHERE role = 'SUPER_ADMIN' AND is_active = 1 LIMIT 1")
            super_row = cursor.fetchone()
            if super_row:
                cls.super_admin_id = super_row['id']
                cls.super_admin_email = super_row['email']
            else:
                cls.super_admin_email = f"super_{uuid.uuid4().hex[:6]}@skillsense.ai"
                s_admin = auth_service.create_user(
                    email=cls.super_admin_email,
                    password="Password@123",
                    full_name="Super Admin",
                    role="SUPER_ADMIN"
                )
                cls.super_admin_id = s_admin['id']

            # Create assessment attempt for Student A
            attempt_a = assessment_service.save_assessment_attempt(
                user_id=cls.student_a_id,
                guest_session_id=None,
                student_profile={"education_level": "Grade 11", "city": "Mumbai"},
                riasec_answers=[],
                riasec_scores={"R": 10, "I": 12, "A": 8, "S": 14, "E": 9, "C": 11},
                riasec_code="SIR",
                top_careers=[{"name": "Data Scientist", "score": 92.0}]
            )
            cls.attempt_a_id = attempt_a['attempt_id']

            # Create assessment attempt for Student B
            attempt_b = assessment_service.save_assessment_attempt(
                user_id=cls.student_b_id,
                guest_session_id=None,
                student_profile={"education_level": "Grade 12", "city": "Pune"},
                riasec_answers=[],
                riasec_scores={"R": 8, "I": 15, "A": 12, "S": 6, "E": 5, "C": 10},
                riasec_code="IAS",
                top_careers=[{"name": "Research Analyst", "score": 90.0}]
            )
            cls.attempt_b_id = attempt_b['attempt_id']

        finally:
            conn.close()

    def setUp(self):
        self.client = app.test_client()

    # =========================================================================
    # 1. PUBLIC ROUTES CLASSIFICATION
    # =========================================================================
    def test_01_public_routes_accessible_without_auth(self):
        """Verify public marketing, pricing, and auth pages respond with HTTP 200 without session."""
        public_paths = ['/', '/pricing', '/how-it-works', '/login', '/signup', '/take-test']
        for path in public_paths:
            res = self.client.get(path)
            self.assertEqual(res.status_code, 200, f"Public path {path} failed with {res.status_code}")

    # =========================================================================
    # 2. AUTHENTICATED PAGES & REDIRECTION
    # =========================================================================
    def test_02_protected_pages_redirect_unauthenticated_users(self):
        """Verify protected user/developer pages redirect unauthenticated visitors to login."""
        res_account = self.client.get('/account')
        self.assertEqual(res_account.status_code, 302)
        self.assertIn('/login', res_account.headers.get('Location', ''))

        res_dev = self.client.get('/developer')
        self.assertEqual(res_dev.status_code, 302)
        self.assertIn('/login', res_dev.headers.get('Location', ''))

    # =========================================================================
    # 3. DEVELOPER DASHBOARD ACCESS FOR NORMAL USERS (BRANDED 403)
    # =========================================================================
    def test_03_student_access_to_developer_page_returns_branded_403(self):
        """Verify a logged-in student accessing /developer receives HTTP 403 with branded template."""
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.student_a_id
            sess['role'] = 'USER'
            sess['user_email'] = self.student_a_email

        res = self.client.get('/developer')
        self.assertEqual(res.status_code, 403)
        html = res.get_data(as_text=True)
        self.assertIn("Nice Try, Won't Work Here Buddy!!", html)
        self.assertIn("Access Restricted", html)
        self.assertIn("Go Back", html)

    # =========================================================================
    # 4. DEVELOPER API AUTHORIZATION ENFORCEMENT
    # =========================================================================
    def test_04_unauthenticated_api_developer_stats_returns_401(self):
        """Verify unauthenticated API requests to developer endpoints return HTTP 401."""
        res = self.client.get('/api/developer/stats')
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertIn('Authentication required', data.get('error', ''))

    def test_05_student_access_to_developer_apis_returns_403(self):
        """Verify authenticated student calling developer APIs receives HTTP 403 Access Denied."""
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.student_a_id
            sess['role'] = 'USER'
            sess['user_email'] = self.student_a_email

        endpoints = [
            ('/api/developer/stats', 'GET'),
            ('/api/developer/users', 'GET'),
            ('/api/developer/plans', 'GET'),
            ('/api/developer/campaigns', 'GET'),
            ('/api/developer/audit-log', 'GET'),
            ('/api/developer/accounts', 'GET'),
        ]
        for ep, method in endpoints:
            if method == 'GET':
                res = self.client.get(ep)
            else:
                res = self.client.post(ep, json={})
            self.assertEqual(res.status_code, 403, f"Endpoint {ep} should return 403 for student")
            data = res.get_json()
            self.assertIn('Access denied', data.get('error', ''))
            # Ensure no role leaks
            self.assertNotIn('Developer privileges required', data.get('error', ''))

    def test_06_developer_cannot_manage_developer_accounts_without_permission(self):
        """Verify a DEVELOPER without can_manage_developers cannot invite other developers."""
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.dev_id
            sess['role'] = 'DEVELOPER'
            sess['can_manage_developers'] = False

        res = self.client.post('/api/developer/accounts/invite', json={
            'email': 'new_dev@example.com',
            'full_name': 'New Dev',
            'role': 'DEVELOPER'
        })
        self.assertEqual(res.status_code, 403)
        data = res.get_json()
        self.assertIn('Access denied', data.get('error', ''))

    def test_07_super_admin_has_full_developer_access(self):
        """Verify SUPER_ADMIN can access developer stats and accounts."""
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.super_admin_id
            sess['role'] = 'SUPER_ADMIN'
            sess['can_manage_developers'] = True

        res_stats = self.client.get('/api/developer/stats')
        self.assertEqual(res_stats.status_code, 200)

        res_accs = self.client.get('/api/developer/accounts')
        self.assertEqual(res_accs.status_code, 200)
        data = res_accs.get_json()
        self.assertTrue(data.get('caller_can_manage'))

    # =========================================================================
    # 5. STUDENT RESOURCE OWNERSHIP & IDOR PROTECTION
    # =========================================================================
    def test_08_student_cannot_access_other_students_teaser(self):
        """Verify User A cannot inspect User B's assessment teaser (IDOR)."""
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.student_a_id
            sess['role'] = 'USER'

        # Attempt to access Attempt B
        res = self.client.get(f'/api/assessment/{self.attempt_b_id}/teaser')
        self.assertEqual(res.status_code, 403)
        data = res.get_json()
        self.assertIn('Access denied', data.get('error', ''))

        # But User A CAN access their own Attempt A
        res_own = self.client.get(f'/api/assessment/{self.attempt_a_id}/teaser')
        self.assertEqual(res_own.status_code, 200)
        self.assertEqual(res_own.get_json().get('attempt_id'), self.attempt_a_id)

    def test_09_student_cannot_access_other_students_full_report(self):
        """Verify User A cannot fetch User B's full assessment report."""
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.student_a_id
            sess['role'] = 'USER'

        res = self.client.get(f'/api/assessment/{self.attempt_b_id}/full')
        self.assertEqual(res.status_code, 403)
        data = res.get_json()
        self.assertIn('Access denied', data.get('error', ''))

    def test_10_student_cannot_unlock_other_students_assessment(self):
        """Verify User A cannot unlock User B's assessment."""
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.student_a_id
            sess['role'] = 'USER'

        res = self.client.post(f'/api/assessment/{self.attempt_b_id}/unlock')
        self.assertEqual(res.status_code, 403)
        data = res.get_json()
        self.assertIn('Access denied', data.get('error', ''))

    # =========================================================================
    # 6. SENSITIVE FILE PROBES & DIRECTORY ENUMERATION BLOCKING
    # =========================================================================
    def test_11_sensitive_files_blocked_with_404(self):
        """Verify direct HTTP requests for .env, .git, .db, .py, and probe paths return 404."""
        blocked_paths = [
            '/.env',
            '/.git/HEAD',
            '/.git/config',
            '/data/career_guide.db',
            '/career_guide_backup.db',
            '/app.py',
            '/static/../.env',
            '/admin',
            '/phpmyadmin',
            '/debug',
            '/test'
        ]
        for path in blocked_paths:
            res = self.client.get(path)
            self.assertEqual(res.status_code, 404, f"Path '{path}' was not blocked with 404 (got {res.status_code})")
            body = res.get_data(as_text=True)
            self.assertNotIn("SECRET_KEY", body)
            self.assertNotIn("ANTHROPIC_API_KEY", body)
            self.assertNotIn("SQLite format", body)

    # =========================================================================
    # 7. DUAL-MODE ERROR PAGES (HTML VS JSON)
    # =========================================================================
    def test_12_nonexistent_page_returns_branded_404_html(self):
        """Verify navigating to a non-existent browser page returns branded 404 HTML."""
        res = self.client.get('/some-random-missing-page', headers={'Accept': 'text/html'})
        self.assertEqual(res.status_code, 404)
        html = res.get_data(as_text=True)
        self.assertIn("Page Not Found", html)
        self.assertIn("Looking for Something?", html)

    def test_13_nonexistent_api_returns_clean_404_json(self):
        """Verify calling a non-existent API endpoint returns clean JSON 404 without stack trace."""
        res = self.client.get('/api/missing-endpoint', headers={'Accept': 'application/json'})
        self.assertEqual(res.status_code, 404)
        data = res.get_json()
        self.assertIn('Resource not found.', data.get('error', ''))

    # =========================================================================
    # 8. MALICIOUS FILE UPLOAD PROTECTION
    # =========================================================================
    def test_14_upload_image_rejects_non_image_extensions(self):
        """Verify /api/upload-image rejects .php, .html, .py, and arbitrary executables."""
        malicious_files = [
            ('shell.php', b'<?php echo "pwned"; ?>'),
            ('xss.html', b'<script>alert(1)</script>'),
            ('script.py', b'import os; os.system("calc")'),
            ('empty.png', b'')
        ]
        for fname, fcontent in malicious_files:
            data = {'file': (io.BytesIO(fcontent), fname)}
            res = self.client.post('/api/upload-image', data=data, content_type='multipart/form-data')
            self.assertEqual(res.status_code, 400, f"Uploading {fname} should return 400")
            json_res = res.get_json()
            self.assertEqual(json_res.get('status'), 'error')

    def test_15_upload_image_accepts_valid_image(self):
        """Verify /api/upload-image accepts a valid .png image and stores securely."""
        valid_png_bytes = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82'
        data = {'file': (io.BytesIO(valid_png_bytes), 'avatar.png')}
        res = self.client.post('/api/upload-image', data=data, content_type='multipart/form-data')
        self.assertEqual(res.status_code, 200)
        json_res = res.get_json()
        self.assertEqual(json_res.get('status'), 'success')
        self.assertIn('/static/uploads/career_card_', json_res.get('data', {}).get('url', ''))

    # =========================================================================
    # 9. SECURITY HEADERS VERIFICATION
    # =========================================================================
    def test_16_security_headers_present_on_responses(self):
        """Verify X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and CSP are present."""
        res = self.client.get('/')
        self.assertEqual(res.headers.get('X-Content-Type-Options'), 'nosniff')
        self.assertEqual(res.headers.get('X-Frame-Options'), 'SAMEORIGIN')
        self.assertEqual(res.headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin')
        
        csp = res.headers.get('Content-Security-Policy', '')
        self.assertIn("default-src 'self'", csp)
        self.assertIn("https://checkout.razorpay.com", csp)
        self.assertIn("https://api.razorpay.com", csp)
        self.assertIn("https://fonts.googleapis.com", csp)

    # =========================================================================
    # 10. ASSESSMENT & PAYMENT PRESERVATION (ABSOLUTE NO-TOUCH)
    # =========================================================================
    def test_17_assessment_questions_and_pricing_plans_remain_intact(self):
        """Verify 42 RIASEC questions and live pricing plans remain 100% operational."""
        # 1. Questions API
        res_q = self.client.get('/api/questions')
        self.assertEqual(res_q.status_code, 200)
        q_data = res_q.get_json()
        questions = q_data.get('questions', [])
        self.assertEqual(len(questions), 42, "RIASEC questions count must remain exactly 42")

        # 2. Pricing Plans API
        res_p = self.client.get('/api/pricing-plans')
        self.assertEqual(res_p.status_code, 200)
        p_data = res_p.get_json()
        plans = p_data.get('plans', [])
        self.assertGreater(len(plans), 0, "Active pricing plans must be returned")


if __name__ == '__main__':
    unittest.main()
