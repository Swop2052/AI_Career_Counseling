import unittest
import uuid
import json
from app import app
from database.schema import get_db_connection, init_db
from services.auth_service import AuthService, auth_service
from services.wallet_service import wallet_service
from core.avatar import AVATAR_REGISTRY, normalize_avatar_key, resolve_avatar_url, is_valid_avatar

class TestMandatoryProfileAndAvatar(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def setUp(self):
        self.app = app
        self.client = app.test_client()
        self.app.config['TESTING'] = True

    def test_avatar_registry_and_normalization(self):
        """Test canonical avatar registry mappings and rejection of untrusted URLs."""
        # Valid keys
        self.assertEqual(normalize_avatar_key('avatar_01'), 'avatar_01')
        self.assertEqual(normalize_avatar_key('avatar_10'), 'avatar_10')
        
        # Valid asset paths
        self.assertEqual(normalize_avatar_key('/avatars/Ma_01.png'), 'avatar_01')
        self.assertEqual(normalize_avatar_key('/avatars/fa_01.png'), 'avatar_02')
        self.assertEqual(normalize_avatar_key('avatars/Ma_06.png'), 'avatar_10')
        
        # URL resolving
        self.assertEqual(resolve_avatar_url('avatar_01'), '/avatars/Ma_01.png')
        self.assertEqual(resolve_avatar_url('/avatars/fa_01.png'), '/avatars/fa_01.png')
        
        # Rejection of untrusted / malicious / arbitrary inputs
        self.assertIsNone(normalize_avatar_key('https://malicious-site.com/avatar.jpg'))
        self.assertIsNone(normalize_avatar_key('data:image/png;base64,...'))
        self.assertIsNone(normalize_avatar_key('unknown_avatar'))
        self.assertFalse(is_valid_avatar('https://malicious-site.com/avatar.jpg'))

    def test_profile_validation_mandatory_fields(self):
        """Test that missing mandatory fields or invalid ages like -4 are authoritatively rejected."""
        valid_payload = {
            'fullName': 'Aarav Sharma',
            'age': '16',
            'classYear': '10th',
            'enjoySubjects': 'Mathematics, Physics',
            'challengingSubjects': 'History, Chemistry',
            'avatar': 'avatar_02'
        }
        
        # Valid profile passes
        validated = AuthService.validate_profile_data(valid_payload, require_all_mandatory=True)
        self.assertEqual(validated['full_name'], 'Aarav Sharma')
        self.assertEqual(validated['age'], 16)
        self.assertEqual(validated['class_year'], '10th')
        self.assertEqual(validated['avatar'], 'avatar_02')

        # Negative age like -4 MUST be rejected
        with self.assertRaises(ValueError) as ctx:
            AuthService.validate_profile_data({**valid_payload, 'age': '-4'}, require_all_mandatory=True)
        self.assertIn('age', ctx.exception.args[0])

        # Zero or impossible age MUST be rejected
        with self.assertRaises(ValueError) as ctx:
            AuthService.validate_profile_data({**valid_payload, 'age': '0'}, require_all_mandatory=True)
        self.assertIn('age', ctx.exception.args[0])

        with self.assertRaises(ValueError) as ctx:
            AuthService.validate_profile_data({**valid_payload, 'age': '85'}, require_all_mandatory=True)
        self.assertIn('age', ctx.exception.args[0])

        # Missing name MUST be rejected
        with self.assertRaises(ValueError) as ctx:
            AuthService.validate_profile_data({**valid_payload, 'fullName': ''}, require_all_mandatory=True)
        self.assertIn('fullName', ctx.exception.args[0])

        # Placeholder 'Guest Student' MUST be rejected as a student name
        with self.assertRaises(ValueError) as ctx:
            AuthService.validate_profile_data({**valid_payload, 'fullName': 'Guest Student'}, require_all_mandatory=True)
        self.assertIn('fullName', ctx.exception.args[0])

        # Missing enjoy subjects MUST be rejected
        with self.assertRaises(ValueError) as ctx:
            AuthService.validate_profile_data({**valid_payload, 'enjoySubjects': ''}, require_all_mandatory=True)
        self.assertIn('enjoySubjects', ctx.exception.args[0])

        # Missing challenging subjects MUST be rejected
        with self.assertRaises(ValueError) as ctx:
            AuthService.validate_profile_data({**valid_payload, 'challengingSubjects': ''}, require_all_mandatory=True)
        self.assertIn('challengingSubjects', ctx.exception.args[0])

        # Missing class/year MUST be rejected
        with self.assertRaises(ValueError) as ctx:
            AuthService.validate_profile_data({**valid_payload, 'classYear': ''}, require_all_mandatory=True)
        self.assertIn('classYear', ctx.exception.args[0])

    def test_database_avatar_and_profile_persistence(self):
        """Verify avatar and mandatory profile fields are persisted in PostgreSQL user_profiles."""
        unique_email = f"profile_test_{uuid.uuid4().hex[:8]}@example.com"
        user = auth_service.create_user(
            email=unique_email,
            password="SecurePassword123!",
            full_name="Priya Patel",
            avatar="avatar_04",
            age=17,
            class_year="Class 12",
            enjoy_subjects="Biology, Chemistry",
            challenging_subjects="Mathematics"
        )
        user_id = user['id']
        
        # Verify persistence from database
        fetched = auth_service.get_user_by_id(user_id)
        self.assertEqual(fetched['full_name'], 'Priya Patel')
        self.assertEqual(fetched['avatar'], 'avatar_04')
        self.assertEqual(fetched['age'], 17)
        self.assertEqual(fetched['class_year'], 'Class 12')
        self.assertEqual(fetched['enjoy_subjects'], 'Biology, Chemistry')
        self.assertEqual(fetched['challenging_subjects'], 'Mathematics')

        # Test updating avatar to avatar_07 and profile details
        auth_service.update_user_profile(user_id, {
            'avatar': 'avatar_07',
            'age': 18,
            'class_year': '1st Year College'
        })
        
        updated = auth_service.get_user_by_id(user_id)
        self.assertEqual(updated['avatar'], 'avatar_07')
        self.assertEqual(updated['age'], 18)
        self.assertEqual(updated['class_year'], '1st Year College')

    def test_api_auth_profile_endpoint(self):
        """Verify PUT /api/auth/profile updates profile and enforces validation."""
        unique_email = f"api_prof_{uuid.uuid4().hex[:8]}@example.com"
        pwd = "SecurePassword123!"
        user = auth_service.create_user(email=unique_email, password=pwd, full_name="API User")
        
        # Login
        self.client.post('/api/auth/login', json={'email': unique_email, 'password': pwd})
        
        # 1. Invalid age -4 returns 400
        res_bad = self.client.put('/api/auth/profile', json={'age': -4})
        self.assertEqual(res_bad.status_code, 400)
        self.assertIn('details', res_bad.get_json())
        
        # 2. Valid update succeeds
        res_good = self.client.put('/api/auth/profile', json={
            'fullName': 'Updated Name',
            'age': 19,
            'classYear': '2nd Year College',
            'enjoySubjects': 'Computer Science',
            'challengingSubjects': 'Statistics',
            'avatar': 'avatar_03'
        })
        self.assertEqual(res_good.status_code, 200)
        user_data = res_good.get_json()['user']
        self.assertEqual(user_data['name'], 'Updated Name')
        self.assertEqual(user_data['avatar'], 'avatar_03')
        self.assertEqual(user_data['avatar_url'], '/avatars/MA_02.png')
        self.assertEqual(user_data['profilePhoto'], '/avatars/MA_02.png')
        self.assertEqual(user_data['age'], 19)

    def test_api_submit_answers_validation(self):
        """Verify POST /api/submit-answers rejects missing or invalid profile data."""
        sample_answers = [{"question_id": i + 1, "category": "Realistic", "value": 4} for i in range(42)]
        
        # Missing age / invalid age -4 rejected with 400
        res_neg_age = self.client.post('/api/submit-answers', json={
            'answers': sample_answers,
            'student_info': {
                'fullName': 'Test Student',
                'age': -4,
                'classYear': 'Class 10',
                'enjoySubjects': 'Math',
                'challengingSubjects': 'Physics'
            }
        })
        self.assertEqual(res_neg_age.status_code, 400)
        self.assertIn('error', res_neg_age.get_json())

        # Missing subjects rejected with 400
        res_no_subj = self.client.post('/api/submit-answers', json={
            'answers': sample_answers,
            'student_info': {
                'fullName': 'Test Student',
                'age': 15,
                'classYear': 'Class 10'
            }
        })
        self.assertEqual(res_no_subj.status_code, 400)

if __name__ == '__main__':
    unittest.main()
