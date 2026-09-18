import unittest
import uuid
import json
from app import app
from database.schema import get_db_connection, init_db
from services.auth_service import AuthService, auth_service
from services.wallet_service import wallet_service
from services.assessment_service import assessment_service
from core.avatar import AVATAR_REGISTRY, normalize_avatar_key, resolve_avatar_url

class TestE2EAvatarAndProfileFlow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def setUp(self):
        self.app = app
        self.client = app.test_client()
        self.app.config['TESTING'] = True

    def test_flow_a_guest_to_signup_to_persisted_avatar(self):
        """
        Flow A:
        1. Guest enters mandatory details and selects avatar_04
        2. Guest submits assessment answers -> attempt saved with student_profile containing avatar
        3. Guest signs up -> attempt claimed -> user profile in PostgreSQL receives avatar_04 and profile data
        4. User /api/auth/me receives avatar_04 and resolved URL
        """
        # 1. Guest submits answers with valid mandatory profile and avatar_04
        student_info = {
            'fullName': 'Priya Patel',
            'age': '17',
            'classYear': 'Class 12',
            'stream': 'Science',
            'enjoySubjects': 'Physics, Mathematics',
            'challengingSubjects': 'Chemistry, Biology',
            'avatar': 'avatar_04'
        }
        submit_res = self.client.post('/api/submit-answers', json={
            'answers': [{'category': 'Realistic', 'value': 4}] * 42,
            'student_info': student_info
        })
        self.assertEqual(submit_res.status_code, 200)
        attempt_data = submit_res.get_json()
        attempt_id = attempt_data['attempt_id']
        self.assertTrue(attempt_id.startswith('ast_'))

        # 2. Check that attempt student_profile recorded avatar_04
        attempt = assessment_service.get_attempt_by_id(attempt_id)
        self.assertIsNotNone(attempt)
        sp = attempt.get('student_profile') or {}
        if isinstance(sp, str):
            sp = json.loads(sp)
        self.assertEqual(sp.get('avatar'), 'avatar_04')

        # 3. Guest creates an account linking this attempt_id
        email = f"priya_{uuid.uuid4().hex[:8]}@example.com"
        pwd = "SecurePassword123!"
        signup_res = self.client.post('/api/auth/signup', json={
            'email': email,
            'password': pwd,
            'full_name': 'Priya Patel',
            'attempt_id': attempt_id
        })
        self.assertEqual(signup_res.status_code, 201)
        signup_user = signup_res.get_json()['user']

        # User profile should have inherited avatar_04, age, class_year from attempt
        self.assertEqual(signup_user['avatar'], 'avatar_04')
        self.assertEqual(signup_user['avatar_url'], '/avatars/fa_02.png')
        self.assertEqual(signup_user['age'], 17)
        self.assertEqual(signup_user['class_year'], 'Class 12')

        # 4. Canonical /api/auth/me test
        me_res = self.client.get('/api/auth/me')
        self.assertEqual(me_res.status_code, 200)
        me_data = me_res.get_json()
        self.assertTrue(me_data['authenticated'])
        self.assertEqual(me_data['user']['avatar'], 'avatar_04')
        self.assertEqual(me_data['user']['avatar_url'], '/avatars/fa_02.png')

        # 5. Assessment was claimed by this new user
        claimed_attempt = assessment_service.get_attempt_by_id(attempt_id)
        self.assertEqual(claimed_attempt['user_id'], signup_user['id'])

    def test_flow_f_avatar_update_persists_across_sessions(self):
        """
        Flow F:
        1. Existing user logs in
        2. Updates avatar to avatar_07 via PUT /api/auth/profile
        3. Response receives canonical avatar_07
        4. User logs out
        5. User logs in again -> /api/auth/me returns avatar_07 from PostgreSQL
        """
        email = f"user_{uuid.uuid4().hex[:8]}@example.com"
        pwd = "Password123!"
        user = auth_service.create_user(
            email=email,
            password=pwd,
            full_name="Rohit Sharma",
            avatar="avatar_01",
            age=18,
            class_year="1st Year College"
        )
        uid = user['id']

        # Login
        login_res = self.client.post('/api/auth/login', json={'email': email, 'password': pwd})
        self.assertEqual(login_res.status_code, 200)
        self.assertEqual(login_res.get_json()['user']['avatar'], 'avatar_01')

        # Update avatar to avatar_07
        update_res = self.client.put('/api/auth/profile', json={
            'fullName': 'Rohit Sharma',
            'avatar': 'avatar_07'
        })
        self.assertEqual(update_res.status_code, 200)
        updated_user = update_res.get_json()['user']
        self.assertEqual(updated_user['avatar'], 'avatar_07')
        self.assertEqual(updated_user['avatar_url'], '/avatars/Ma_04.png')

        # Verify directly in PostgreSQL / SQLite DB
        db_user = auth_service.get_user_by_id(uid)
        self.assertEqual(db_user['avatar'], 'avatar_07')

        # Logout
        self.client.post('/api/auth/logout')

        # Re-login
        relogin_res = self.client.post('/api/auth/login', json={'email': email, 'password': pwd})
        self.assertEqual(relogin_res.status_code, 200)
        self.assertEqual(relogin_res.get_json()['user']['avatar'], 'avatar_07')
        self.assertEqual(relogin_res.get_json()['user']['avatar_url'], '/avatars/Ma_04.png')

    def test_backend_validation_cannot_be_bypassed(self):
        """
        Ensure user cannot bypass mandatory fields by crafting direct API requests.
        """
        email = f"bypass_{uuid.uuid4().hex[:8]}@example.com"
        pwd = "Password123!"
        user = auth_service.create_user(email=email, password=pwd, full_name="Valid Student")
        self.client.post('/api/auth/login', json={'email': email, 'password': pwd})

        # 1. Attempt to set negative age via API
        bad_age_res = self.client.put('/api/auth/profile', json={'age': -4})
        self.assertEqual(bad_age_res.status_code, 400)
        age_err = str(bad_age_res.get_json().get('details', {}) or bad_age_res.get_json().get('error', ''))
        self.assertIn('Age must be between 10 and 60', age_err)

        # 2. Attempt to inject arbitrary external image URL
        bad_avatar_res = self.client.put('/api/auth/profile', json={'avatar': 'https://evil.com/hack.jpg'})
        self.assertEqual(bad_avatar_res.status_code, 400)
        avatar_err = str(bad_avatar_res.get_json().get('details', {}) or bad_avatar_res.get_json().get('error', ''))
        self.assertIn('Invalid avatar', avatar_err)

        # 3. Attempt to submit assessment answers with missing mandatory fields
        bad_submit_res = self.client.post('/api/submit-answers', json={
            'answers': [1] * 42,
            'student_info': {
                'fullName': 'Guest Student',  # Placeholder rejected!
                'age': -4,                    # Negative age rejected!
                'classYear': ''
            }
        })
        self.assertEqual(bad_submit_res.status_code, 400)
        res_json = bad_submit_res.get_json()
        err_msg = str(res_json.get('error', '')) + str(res_json.get('details', ''))
        self.assertTrue('Validation error' in err_msg or 'details' in res_json)

if __name__ == '__main__':
    unittest.main()
