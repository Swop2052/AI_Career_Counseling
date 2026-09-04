"""
Automated Test Suite: Locked Result Teaser & Paywall Enhancement
Verifies that:
1. When assessment is locked, teaser payload does NOT contain numerical match percentage or path count.
2. GET /api/assessment/<attempt_id>/teaser strictly enforces server-side paywall (strips match percentages).
3. Historical records with legacy teaser_data in SQLite are sanitized server-side on retrieval.
4. GET /api/account/summary protects locked assessment match scores (returns None for locked, numeric for unlocked).
5. Unlocked assessment exposes full roadmap with complete match percentages and ranking intact.
6. Assessment scoring engine, 42 questions, and RIASEC calculations remain completely frozen.
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
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from database.schema import get_db_connection
from services.auth_service import auth_service
from services.assessment_service import assessment_service
from services.wallet_service import wallet_service


class TestLockedTeaserPaywall(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False

    def create_test_student(self, prefix="teaser_stud"):
        unique_suffix = uuid.uuid4().hex[:8]
        email = f"{prefix}_{unique_suffix}@example.com"
        name = f"Student {unique_suffix}"
        password = "Password123!"

        user = auth_service.create_user(email, password, name)
        user_id = user['id']

        # Ensure 2 credits in wallet for unlock testing
        current_bal = wallet_service.get_balance(user_id)
        if current_bal < 2:
            wallet_service.add_credits(user_id, 2 - current_bal, "test_seed", "test", "seed")

        return user_id, email, password

    def create_assessment(self, user_id):
        sample_profile = {"name": "Test Student", "education_level": "Undergraduate", "stream": "Science"}
        sample_scores = {"R": 18, "I": 24, "A": 15, "S": 20, "E": 14, "C": 12}
        top_careers = [
            {"career_name": "Data Scientist", "score": 92.4, "name": "Data Scientist", "data": {"expected_income": "12 LPA"}},
            {"career_name": "Software Engineer", "score": 88.1, "name": "Software Engineer", "data": {"expected_income": "10 LPA"}}
        ]

        attempt = assessment_service.save_assessment_attempt(
            user_id=user_id,
            student_profile=sample_profile,
            riasec_answers=[4]*42,
            riasec_scores=sample_scores,
            riasec_code="IRS",
            top_careers=top_careers
        )
        return attempt['attempt_id'], attempt

    def login_client(self, email, password):
        login_res = self.client.post('/api/auth/login', 
            data=json.dumps({'email': email, 'password': password}),
            content_type='application/json'
        )
        self.assertEqual(login_res.status_code, 200)

    # -------------------------------------------------------------
    # 1. Teaser payload from save_assessment_attempt has NO numerical score
    # -------------------------------------------------------------
    def test_save_assessment_teaser_has_no_numerical_score(self):
        user_id, email, password = self.create_test_student("save_tsr")
        attempt_id, attempt_res = self.create_assessment(user_id)

        teaser = attempt_res.get('teaser', {})
        self.assertNotIn('primary_match_score', teaser, "primary_match_score must NOT be in locked teaser!")
        self.assertNotIn('high_potential_paths_count', teaser, "numerical path count must NOT be in locked teaser!")
        self.assertNotIn('% match', teaser.get('teaser_headline', '').lower(), "Headline must not contain '% match'!")
        self.assertNotIn(' paths', teaser.get('teaser_headline', '').lower(), "Headline must not contain ' paths'!")
        self.assertEqual(teaser.get('teaser_headline'), "Your Personalized Career Roadmap Is Ready")
        self.assertIn("Complete Career Matches", teaser.get('included_features', []))

    # -------------------------------------------------------------
    # 2. GET /api/assessment/<id>/teaser does NOT leak match score over wire
    # -------------------------------------------------------------
    def test_get_teaser_api_paywall_protection(self):
        user_id, email, password = self.create_test_student("api_tsr")
        attempt_id, _ = self.create_assessment(user_id)
        self.login_client(email, password)

        res = self.client.get(f'/api/assessment/{attempt_id}/teaser')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()

        self.assertFalse(data.get('is_unlocked'))
        teaser = data.get('teaser', {})

        # Verify server-side sanitization: NO numerical match score
        self.assertNotIn('primary_match_score', teaser, "API must not expose primary_match_score while locked!")
        self.assertNotIn('high_potential_paths_count', teaser, "API must not expose high_potential_paths_count while locked!")
        
        # Verify value-focused copy
        self.assertEqual(teaser.get('teaser_headline'), "Your Personalized Career Roadmap Is Ready")
        self.assertIn("Complete Career Matches", teaser.get('included_features', []))
        self.assertIn("Education Pathways", teaser.get('included_features', []))
        self.assertIn("Skills & Development Guidance", teaser.get('included_features', []))
        self.assertIn("Career & Salary Insights", teaser.get('included_features', []))
        self.assertIn("Personalized AI Guidance", teaser.get('included_features', []))

    # -------------------------------------------------------------
    # 3. Server-side sanitization on legacy historical records
    # -------------------------------------------------------------
    def test_legacy_historical_record_sanitization(self):
        user_id, email, password = self.create_test_student("legacy_tsr")
        attempt_id = f"ast_legacy_{uuid.uuid4().hex[:8]}"
        self.login_client(email, password)

        # Seed an attempt with legacy teaser_data that had 51% Match and 6 Paths stored in SQLite
        legacy_teaser = {
            'attempt_id': attempt_id,
            'primary_match_score': 51.2,
            'primary_career_title': 'Legacy Job',
            'high_potential_paths_count': 5,
            'teaser_headline': 'Our engine found 1 career path with a 51% match, and 5 high-potential optional paths.'
        }
        conn = get_db_connection()
        try:
            with conn:
                conn.execute("""
                    INSERT INTO assessment_attempts (id, user_id, teaser_data, full_result_data, is_unlocked, created_at)
                    VALUES (?, ?, ?, '{}', 0, '2026-08-01T10:00:00')
                """, (attempt_id, user_id, json.dumps(legacy_teaser)))
        finally:
            conn.close()

        # Retrieve via get_teaser API
        res = self.client.get(f'/api/assessment/{attempt_id}/teaser')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()

        teaser = data.get('teaser', {})
        self.assertNotIn('primary_match_score', teaser, "Legacy primary_match_score must be stripped!")
        self.assertNotIn('51%', teaser.get('teaser_headline', ''), "Legacy headline with 51% must be sanitized!")
        self.assertEqual(teaser.get('teaser_headline'), "Your Personalized Career Roadmap Is Ready")

    # -------------------------------------------------------------
    # 4. Account Summary API hides score when locked, reveals when unlocked
    # -------------------------------------------------------------
    def test_account_summary_score_visibility_by_unlock_state(self):
        user_id, email, password = self.create_test_student("acc_tsr")
        attempt_id, _ = self.create_assessment(user_id)
        self.login_client(email, password)

        # While locked: primary_match_score must be None
        acc_res1 = self.client.get('/api/account/summary')
        self.assertEqual(acc_res1.status_code, 200)
        acc_data1 = acc_res1.get_json()
        target_att1 = [a for a in acc_data1['attempts'] if a['id'] == attempt_id][0]
        self.assertFalse(target_att1['is_unlocked'])
        self.assertIsNone(target_att1['primary_match_score'], "Locked attempt in account summary must NOT expose match score!")

        # Explicitly unlock assessment
        unlock_res = self.client.post(f'/api/assessment/{attempt_id}/unlock')
        self.assertEqual(unlock_res.status_code, 200)

        # After unlocking: primary_match_score must be returned
        acc_res2 = self.client.get('/api/account/summary')
        self.assertEqual(acc_res2.status_code, 200)
        acc_data2 = acc_res2.get_json()
        target_att2 = [a for a in acc_data2['attempts'] if a['id'] == attempt_id][0]
        self.assertTrue(target_att2['is_unlocked'])
        self.assertIsNotNone(target_att2['primary_match_score'], "Unlocked attempt in account summary must expose match score!")
        self.assertGreater(target_att2['primary_match_score'], 0)

    # -------------------------------------------------------------
    # 5. Unlocked assessment full report remains 100% intact
    # -------------------------------------------------------------
    def test_full_unlocked_report_remains_intact(self):
        user_id, email, password = self.create_test_student("full_tsr")
        attempt_id, _ = self.create_assessment(user_id)
        self.login_client(email, password)

        # Unlock
        self.client.post(f'/api/assessment/{attempt_id}/unlock')

        # Fetch full report
        full_res = self.client.get(f'/api/assessment/{attempt_id}/full')
        self.assertEqual(full_res.status_code, 200)
        full_data = full_res.get_json()

        report = full_data.get('full_report', {})
        self.assertIn('student_profile', report)
        self.assertIn('riasec_scores', report)
        self.assertIn('top_careers', report)
        top_careers = report['top_careers']
        self.assertGreater(len(top_careers), 0)
        # Verify match score exists in full report
        self.assertIn('score', top_careers[0])
        self.assertEqual(top_careers[0]['score'], 92.4)

    # -------------------------------------------------------------
    # 6. RIASEC assessment engine 42 questions & categories frozen
    # -------------------------------------------------------------
    def test_assessment_engine_frozen(self):
        from app import QUESTIONS
        self.assertEqual(len(QUESTIONS), 42, "Assessment questions count must remain exactly 42!")
        categories = set(q['category'] for q in QUESTIONS)
        self.assertEqual(categories, {"Realistic", "Investigative", "Artistic", "Social", "Enterprising", "Conventional"})


if __name__ == '__main__':
    unittest.main()
