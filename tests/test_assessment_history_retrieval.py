# tests/test_assessment_history_retrieval.py - Complete verification of Assessment History flow and zero-credit invariants
import unittest
import json
import uuid
from datetime import datetime
from database.schema import get_db_connection
from services.assessment_service import assessment_service
from services.wallet_service import wallet_service
from app import app


class TestAssessmentHistoryRetrieval(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.client = self.app.test_client()

        self.uid = f"usr_{uuid.uuid4().hex[:12]}"
        self.email = f"hist_student_{uuid.uuid4().hex[:6]}@example.com"

        self.other_uid = f"usr_{uuid.uuid4().hex[:12]}"
        self.other_email = f"other_student_{uuid.uuid4().hex[:6]}@example.com"

        self.admin_uid = f"usr_{uuid.uuid4().hex[:12]}"
        self.admin_email = f"admin_{uuid.uuid4().hex[:6]}@example.com"

        conn = get_db_connection()
        with conn:
            conn.execute("""
                INSERT INTO users (id, email, password_hash, role, is_active)
                VALUES (?, ?, 'dummy_hash', 'USER', 1)
            """, (self.uid, self.email))
            conn.execute("""
                INSERT INTO user_profiles (id, user_id, full_name, education_level)
                VALUES (?, ?, 'History Test Student', 'Grade 12')
            """, (f"prof_{self.uid}", self.uid))

            conn.execute("""
                INSERT INTO users (id, email, password_hash, role, is_active)
                VALUES (?, ?, 'dummy_hash', 'USER', 1)
            """, (self.other_uid, self.other_email))
            conn.execute("""
                INSERT INTO user_profiles (id, user_id, full_name, education_level)
                VALUES (?, ?, 'Other Test Student', 'Grade 11')
            """, (f"prof_{self.other_uid}", self.other_uid))

            conn.execute("""
                INSERT INTO users (id, email, password_hash, role, is_active)
                VALUES (?, ?, 'dummy_hash', 'DEVELOPER', 1)
            """, (self.admin_uid, self.admin_email))
        conn.close()

        # Allocate 3 initial credits to self.uid
        wallet_service.add_credits(self.uid, 3, 'INITIAL_GRANT', 'test', self.uid, "Initial test credits")

    def tearDown(self):
        conn = get_db_connection()
        with conn:
            conn.execute("DELETE FROM credit_transactions WHERE user_id IN (?, ?, ?)", (self.uid, self.other_uid, self.admin_uid))
            conn.execute("DELETE FROM credit_wallets WHERE user_id IN (?, ?, ?)", (self.uid, self.other_uid, self.admin_uid))
            conn.execute("DELETE FROM assessment_attempts WHERE user_id IN (?, ?, ?)", (self.uid, self.other_uid, self.admin_uid))
            conn.execute("DELETE FROM user_profiles WHERE user_id IN (?, ?, ?)", (self.uid, self.other_uid, self.admin_uid))
            conn.execute("DELETE FROM users WHERE id IN (?, ?, ?)", (self.uid, self.other_uid, self.admin_uid))
        conn.close()

    def login_as(self, user_id, email, role='USER'):
        with self.client.session_transaction() as sess:
            sess['user_id'] = user_id
            sess['user_email'] = email
            sess['role'] = role

    def logout(self):
        with self.client.session_transaction() as sess:
            sess.clear()

    def test_case_01_open_latest_assessment_from_history(self):
        """Case 1: Open latest assessment from history."""
        att_old = assessment_service.save_assessment_attempt(
            user_id=self.uid,
            student_profile={'name': 'History Test Student', 'education_level': 'Grade 12'},
            riasec_scores={'R': 15, 'I': 20, 'A': 10, 'S': 10, 'E': 10, 'C': 10},
            riasec_code='IRS',
            top_careers=[{'name': 'Biotechnologist', 'score': 88.0, 'data': {}}]
        )
        att_new = assessment_service.save_assessment_attempt(
            user_id=self.uid,
            student_profile={'name': 'History Test Student', 'education_level': 'Grade 12'},
            riasec_scores={'R': 25, 'I': 28, 'A': 15, 'S': 12, 'E': 10, 'C': 8},
            riasec_code='RIE',
            top_careers=[{'name': 'Data Scientist', 'score': 95.0, 'data': {}}]
        )

        self.login_as(self.uid, self.email)

        res = self.client.get('/api/account/summary')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        attempts = data.get('attempts', [])
        self.assertTrue(len(attempts) >= 2)
        self.assertEqual(attempts[0]['id'], att_new['attempt_id'])

        t_res = self.client.get(f"/api/assessment/{att_new['attempt_id']}/teaser")
        self.assertEqual(t_res.status_code, 200)
        t_data = t_res.get_json()
        self.assertEqual(t_data['attempt_id'], att_new['attempt_id'])

    def test_case_02_open_older_assessment(self):
        """Case 2: Open an older assessment."""
        att_old = assessment_service.save_assessment_attempt(
            user_id=self.uid,
            student_profile={'name': 'History Test Student'},
            riasec_scores={'R': 18, 'I': 19, 'A': 10, 'S': 10, 'E': 10, 'C': 10},
            riasec_code='IRS',
            top_careers=[{'name': 'Civil Engineer', 'score': 82.0, 'data': {}}]
        )
        att_new = assessment_service.save_assessment_attempt(
            user_id=self.uid,
            student_profile={'name': 'History Test Student'},
            riasec_scores={'R': 22, 'I': 24, 'A': 10, 'S': 10, 'E': 10, 'C': 10},
            riasec_code='RIE',
            top_careers=[{'name': 'Robotics Engineer', 'score': 91.0, 'data': {}}]
        )

        self.login_as(self.uid, self.email)

        t_res = self.client.get(f"/api/assessment/{att_old['attempt_id']}/teaser")
        self.assertEqual(t_res.status_code, 200)
        t_data = t_res.get_json()
        self.assertEqual(t_data['attempt_id'], att_old['attempt_id'])
        self.assertEqual(t_data['teaser']['riasec_code'], 'IRS')

    def test_case_03_open_several_different_previous_assessments_one_after_another(self):
        """Case 3: Open several different previous assessments sequentially."""
        created_ids = []
        for i in range(4):
            att = assessment_service.save_assessment_attempt(
                user_id=self.uid,
                student_profile={'name': f'History Student {i}'},
                riasec_scores={'R': 10 + i, 'I': 15, 'A': 10, 'S': 10, 'E': 10, 'C': 10},
                riasec_code='RIA',
                top_careers=[{'name': f'Career Option {i}', 'score': 80.0 + i, 'data': {}}]
            )
            created_ids.append(att['attempt_id'])

        self.login_as(self.uid, self.email)

        for aid in created_ids:
            res = self.client.get(f"/api/assessment/{aid}/teaser")
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data['attempt_id'], aid)

    def test_case_04_open_unlocked_historical_assessment(self):
        """Case 4: Open an unlocked historical assessment."""
        att = assessment_service.save_assessment_attempt(
            user_id=self.uid,
            student_profile={'name': 'Unlocked Student'},
            riasec_scores={'R': 20, 'I': 20, 'A': 20, 'S': 10, 'E': 10, 'C': 10},
            riasec_code='RIA',
            top_careers=[{'name': 'Software Engineer', 'score': 92.0, 'data': {}}]
        )
        aid = att['attempt_id']

        conn = get_db_connection()
        with conn:
            conn.execute("UPDATE assessment_attempts SET is_unlocked = 1 WHERE id = ?", (aid,))
        conn.close()

        self.login_as(self.uid, self.email)

        t_res = self.client.get(f"/api/assessment/{aid}/teaser")
        self.assertEqual(t_res.status_code, 200)
        self.assertTrue(t_res.get_json()['is_unlocked'])

        f_res = self.client.get(f"/api/assessment/{aid}/full")
        self.assertEqual(f_res.status_code, 200)
        f_data = f_res.get_json()
        self.assertEqual(f_data['attempt_id'], aid)
        self.assertTrue(len(f_data['full_report']['top_careers']) > 0)

    def test_case_05_open_locked_historical_assessment(self):
        """Case 5: Open a locked historical assessment."""
        att = assessment_service.save_assessment_attempt(
            user_id=self.uid,
            student_profile={'name': 'Locked Student'},
            riasec_scores={'R': 15, 'I': 15, 'A': 15, 'S': 15, 'E': 15, 'C': 15},
            riasec_code='RIA',
            top_careers=[{'name': 'Architect', 'score': 85.0, 'data': {}}]
        )
        aid = att['attempt_id']

        self.login_as(self.uid, self.email)

        t_res = self.client.get(f"/api/assessment/{aid}/teaser")
        self.assertEqual(t_res.status_code, 200)
        t_data = t_res.get_json()
        self.assertFalse(t_data['is_unlocked'])
        self.assertNotIn('primary_match_score', t_data['teaser'])

        f_res = self.client.get(f"/api/assessment/{aid}/full")
        self.assertEqual(f_res.status_code, 400)
        self.assertIn("locked", f_res.get_json()['error'].lower())

    def test_case_06_open_assessment_after_refreshing_page(self):
        """Case 6: Open an assessment after refreshing the page (URL param persistence)."""
        att = assessment_service.save_assessment_attempt(
            user_id=self.uid,
            student_profile={'name': 'Refresh Student'},
            riasec_scores={'R': 22, 'I': 22, 'A': 22, 'S': 10, 'E': 10, 'C': 10},
            riasec_code='RIA',
            top_careers=[{'name': 'Physicist', 'score': 90.0, 'data': {}}]
        )
        aid = att['attempt_id']

        self.login_as(self.uid, self.email)

        r1 = self.client.get(f"/take-test?attempt_id={aid}")
        self.assertEqual(r1.status_code, 200)
        t1 = self.client.get(f"/api/assessment/{aid}/teaser")
        self.assertEqual(t1.status_code, 200)

        r2 = self.client.get(f"/take-test?attempt_id={aid}")
        self.assertEqual(r2.status_code, 200)
        t2 = self.client.get(f"/api/assessment/{aid}/teaser")
        self.assertEqual(t2.status_code, 200)
        self.assertEqual(t2.get_json()['attempt_id'], aid)

    def test_case_07_open_assessment_after_logout_login(self):
        """Case 7: Open an assessment after logout/login."""
        att = assessment_service.save_assessment_attempt(
            user_id=self.uid,
            student_profile={'name': 'Session Student'},
            riasec_scores={'R': 18, 'I': 18, 'A': 18, 'S': 18, 'E': 18, 'C': 18},
            riasec_code='RIA',
            top_careers=[{'name': 'Statistician', 'score': 88.0, 'data': {}}]
        )
        aid = att['attempt_id']

        self.logout()
        res_unauth = self.client.get(f"/api/assessment/{aid}/teaser")
        self.assertEqual(res_unauth.status_code, 401)

        self.login_as(self.uid, self.email)
        res_auth = self.client.get(f"/api/assessment/{aid}/teaser")
        self.assertEqual(res_auth.status_code, 200)
        self.assertEqual(res_auth.get_json()['attempt_id'], aid)

    def test_case_08_attempt_to_open_another_users_attempt_id(self):
        """Case 8: Attempt to open another user's attempt_id (403 IDOR blocked)."""
        att_other = assessment_service.save_assessment_attempt(
            user_id=self.other_uid,
            student_profile={'name': 'Other User Attempt'},
            riasec_scores={'R': 15, 'I': 15, 'A': 15, 'S': 15, 'E': 15, 'C': 15},
            riasec_code='RIA',
            top_careers=[{'name': 'Doctor', 'score': 96.0, 'data': {}}]
        )
        other_aid = att_other['attempt_id']

        self.login_as(self.uid, self.email, role='USER')

        t_res = self.client.get(f"/api/assessment/{other_aid}/teaser")
        self.assertEqual(t_res.status_code, 403)

        f_res = self.client.get(f"/api/assessment/{other_aid}/full")
        self.assertEqual(f_res.status_code, 403)

    def test_case_09_use_invalid_or_nonexistent_attempt_id(self):
        """Case 9: Use an invalid/nonexistent attempt_id (404 not found)."""
        self.login_as(self.uid, self.email)

        t_res = self.client.get("/api/assessment/ast_completely_bogus_id_99999/teaser")
        self.assertEqual(t_res.status_code, 404)

        f_res = self.client.get("/api/assessment/ast_completely_bogus_id_99999/full")
        self.assertEqual(f_res.status_code, 404)

    def test_case_10_verify_no_credits_deducted_in_cases_8_and_9(self):
        """Case 10: Verify no credits are deducted in cases 8 and 9."""
        self.login_as(self.uid, self.email)
        balance_before = wallet_service.get_balance(self.uid)
        self.assertEqual(balance_before, 3)

        att_other = assessment_service.save_assessment_attempt(
            user_id=self.other_uid,
            student_profile={'name': 'Other'},
            riasec_scores={'R': 10, 'I': 10, 'A': 10, 'S': 10, 'E': 10, 'C': 10},
            riasec_code='RIA',
            top_careers=[{'name': 'Teacher', 'score': 80.0, 'data': {}}]
        )
        self.client.get(f"/api/assessment/{att_other['attempt_id']}/teaser")
        self.client.get(f"/api/assessment/{att_other['attempt_id']}/full")
        self.client.post(f"/api/assessment/{att_other['attempt_id']}/unlock")

        self.client.get("/api/assessment/ast_nonexistent_xyz/teaser")
        self.client.get("/api/assessment/ast_nonexistent_xyz/full")
        self.client.post("/api/assessment/ast_nonexistent_xyz/unlock")

        balance_after = wallet_service.get_balance(self.uid)
        self.assertEqual(balance_after, balance_before, "Credits must be 100% untouched during unauthorized or nonexistent lookups!")

    def test_case_11_verify_no_credit_deducted_merely_by_opening_history_or_viewing_teaser(self):
        """Case 11: Verify no credit is deducted merely by opening history or viewing the teaser."""
        att = assessment_service.save_assessment_attempt(
            user_id=self.uid,
            student_profile={'name': 'History Viewer'},
            riasec_scores={'R': 15, 'I': 15, 'A': 15, 'S': 15, 'E': 15, 'C': 15},
            riasec_code='RIA',
            top_careers=[{'name': 'Pharmacist', 'score': 89.0, 'data': {}}]
        )
        aid = att['attempt_id']

        self.login_as(self.uid, self.email)
        balance_before = wallet_service.get_balance(self.uid)

        self.client.get('/account')
        self.client.get('/api/account/summary')

        for _ in range(5):
            self.client.get(f"/api/assessment/{aid}/teaser")

        self.client.get(f"/take-test?attempt_id={aid}")

        balance_after = wallet_service.get_balance(self.uid)
        self.assertEqual(balance_after, balance_before, "Merely viewing history or teasers must NEVER deduct credits!")

    def test_case_12_verify_valid_unlock_deducts_exactly_1_credit_only_once(self):
        """Case 12: Verify valid unlock deducts exactly 1 credit only once."""
        att = assessment_service.save_assessment_attempt(
            user_id=self.uid,
            student_profile={'name': 'Unlock Target'},
            riasec_scores={'R': 20, 'I': 20, 'A': 20, 'S': 15, 'E': 15, 'C': 15},
            riasec_code='RIA',
            top_careers=[{'name': 'Software Developer', 'score': 95.0, 'data': {}}]
        )
        aid = att['attempt_id']

        self.login_as(self.uid, self.email)
        balance_before = wallet_service.get_balance(self.uid)
        self.assertEqual(balance_before, 3)

        unlock_res = self.client.post(f"/api/assessment/{aid}/unlock")
        self.assertEqual(unlock_res.status_code, 200)
        u_data = unlock_res.get_json()
        self.assertEqual(u_data['status'], 'success')
        self.assertEqual(u_data['credits_remaining'], 2)

        balance_after = wallet_service.get_balance(self.uid)
        self.assertEqual(balance_after, 2, "Exactly 1 credit must be deducted on first unlock!")

    def test_case_13_verify_opening_an_already_unlocked_report_deducts_0_credits(self):
        """Case 13: Verify opening an already unlocked report deducts 0 credits."""
        att = assessment_service.save_assessment_attempt(
            user_id=self.uid,
            student_profile={'name': 'Already Unlocked Target'},
            riasec_scores={'R': 20, 'I': 20, 'A': 20, 'S': 15, 'E': 15, 'C': 15},
            riasec_code='RIA',
            top_careers=[{'name': 'Data Analyst', 'score': 91.0, 'data': {}}]
        )
        aid = att['attempt_id']

        self.login_as(self.uid, self.email)

        self.client.post(f"/api/assessment/{aid}/unlock")
        balance_unlocked = wallet_service.get_balance(self.uid)
        self.assertEqual(balance_unlocked, 2)

        for _ in range(3):
            f_res = self.client.get(f"/api/assessment/{aid}/full")
            self.assertEqual(f_res.status_code, 200)

            re_unlock = self.client.post(f"/api/assessment/{aid}/unlock")
            self.assertEqual(re_unlock.status_code, 200)
            self.assertEqual(re_unlock.get_json()['status'], 'already_unlocked')

        balance_final = wallet_service.get_balance(self.uid)
        self.assertEqual(balance_final, balance_unlocked, "Viewing or re-unlocking an unlocked report must deduct 0 credits!")

    def test_case_14_verify_selected_historical_assessment_always_matches_clicked_history_card(self):
        """Case 14: Verify the selected historical assessment always matches the clicked history card."""
        att_a = assessment_service.save_assessment_attempt(
            user_id=self.uid,
            student_profile={'name': 'Card A'},
            riasec_scores={'R': 30, 'I': 10, 'A': 10, 'S': 10, 'E': 10, 'C': 10},
            riasec_code='R',
            top_careers=[{'name': 'Mechanical Engineer', 'score': 90.0, 'data': {}}]
        )
        att_b = assessment_service.save_assessment_attempt(
            user_id=self.uid,
            student_profile={'name': 'Card B'},
            riasec_scores={'R': 10, 'I': 30, 'A': 10, 'S': 10, 'E': 10, 'C': 10},
            riasec_code='I',
            top_careers=[{'name': 'Biologist', 'score': 92.0, 'data': {}}]
        )

        self.login_as(self.uid, self.email)

        summary_res = self.client.get('/api/account/summary')
        attempts = summary_res.get_json().get('attempts', [])
        ids_in_history = [a['id'] for a in attempts]
        self.assertIn(att_a['attempt_id'], ids_in_history)
        self.assertIn(att_b['attempt_id'], ids_in_history)

        res_a = self.client.get(f"/api/assessment/{att_a['attempt_id']}/teaser")
        self.assertEqual(res_a.get_json()['attempt_id'], att_a['attempt_id'])
        self.assertEqual(res_a.get_json()['teaser']['riasec_code'], 'R')

        res_b = self.client.get(f"/api/assessment/{att_b['attempt_id']}/teaser")
        self.assertEqual(res_b.get_json()['attempt_id'], att_b['attempt_id'])
        self.assertEqual(res_b.get_json()['teaser']['riasec_code'], 'I')

    def test_case_15_legacy_tests_table_lookup_and_bridge(self):
        """Case 15: Legacy 'tests' table entries are dynamically bridged to assessment_attempts."""
        legacy_test_id = str(uuid.uuid4())
        conn = get_db_connection()
        with conn:
            conn.execute("""
                INSERT INTO tests (test_id, fullname, email, student_profile, riasec_scores, riasec_code, career_matches, created_at)
                VALUES (?, 'History Test Student', ?, '{"name": "History Test Student"}', '{"R": 20, "I": 20}', 'RI',
                        '[{"career_name": "Legacy Engineer", "match_score": 88.0, "career_data": {}}]', '2026-08-15 12:00:00')
            """, (legacy_test_id, self.email))
        conn.close()

        self.login_as(self.uid, self.email)

        t_res = self.client.get(f"/api/assessment/{legacy_test_id}/teaser")
        self.assertEqual(t_res.status_code, 200)
        t_data = t_res.get_json()
        self.assertEqual(t_data['attempt_id'], legacy_test_id)

        summary_res = self.client.get('/api/account/summary')
        attempts = summary_res.get_json().get('attempts', [])
        self.assertTrue(any(a['id'] == legacy_test_id for a in attempts))

    def test_case_16_id_formatting_tolerance(self):
        """Case 16: Robust tolerance for whitespace, quotes, numeric rowid, and with/without ast_ prefix."""
        att = assessment_service.save_assessment_attempt(
            user_id=self.uid,
            student_profile={'name': 'Format Test'},
            riasec_scores={'R': 15, 'I': 15, 'A': 15, 'S': 15, 'E': 15, 'C': 15},
            riasec_code='RIA',
            top_careers=[{'name': 'Chemist', 'score': 87.0, 'data': {}}]
        )
        aid = att['attempt_id']
        no_prefix = aid.replace('ast_', '')

        self.login_as(self.uid, self.email)

        r1 = self.client.get(f"/api/assessment/{aid}%20/teaser")
        self.assertEqual(r1.status_code, 200)

        r2 = self.client.get(f"/api/assessment/{no_prefix}/teaser")
        self.assertEqual(r2.status_code, 200)

        r3 = self.client.get(f"/api/assessment/%22{aid}%22/teaser")
        self.assertEqual(r3.status_code, 200)


if __name__ == '__main__':
    unittest.main()
