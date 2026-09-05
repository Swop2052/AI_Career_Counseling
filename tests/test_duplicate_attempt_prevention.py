"""
Tests for Duplicate Assessment Attempt Prevention, History Rendering, and Credit Invariants.
Validates that:
- One assessment session corresponds to ONE assessment_attempt record.
- Rapid/concurrent submissions do not create duplicate database rows.
- Two genuinely separate assessments with identical career results remain independent attempts.
- Re-opening, refreshing, or loading history never creates attempts or deducts credits.
- Unlocking deducts exactly 1 credit once, and subsequent/concurrent unlocks consume 0 credits.
"""
import pytest
import json
import uuid
import time
from app import app
from database.schema import get_db_connection
from services.assessment_service import assessment_service
from services.wallet_service import wallet_service
from services.auth_service import auth_service

SAMPLE_ANSWERS = [
    {"question_id": i + 1, "question": f"Question {i+1}", "category": "Realistic" if i < 7 else ("Investigative" if i < 14 else ("Artistic" if i < 21 else ("Social" if i < 28 else ("Enterprising" if i < 35 else "Conventional")))), "value": 4}
    for i in range(42)
]

SAMPLE_PROFILE = {
    "student_name": "Test Duplication User",
    "age": "20",
    "class": "College",
    "stream": "science"
}

def create_test_user_with_credits(credits=10):
    unique_email = f"test_dupe_{uuid.uuid4().hex[:8]}@skillsense.ai"
    user = auth_service.create_user(
        email=unique_email,
        password="SecurePassword123!",
        full_name="Duplicate Test User"
    )
    user_id = user['id']
    if credits > 0:
        wallet_service.add_credits(user_id, credits, 'TEST_SEED', 'Test seed credits')
    return user_id, unique_email

class TestDuplicateAttemptPrevention:
    
    def test_single_submission_creates_one_attempt(self):
        user_id, _ = create_test_user_with_credits(5)
        res = assessment_service.save_assessment_attempt(
            user_id=user_id,
            student_profile=SAMPLE_PROFILE,
            riasec_answers=SAMPLE_ANSWERS,
            riasec_scores={"R": 28, "I": 28, "A": 28, "S": 28, "E": 28, "C": 28},
            riasec_code="RIA",
            top_careers=[{"name": "Data Scientist", "score": 90.0}]
        )
        assert res['attempt_id'].startswith('ast_')

        # Verify only 1 attempt in database for this user
        attempts = assessment_service.get_user_attempts(user_id)
        assert len(attempts) == 1
        assert attempts[0]['id'] == res['attempt_id']

    def test_concurrent_or_rapid_submissions_return_same_attempt(self):
        user_id, _ = create_test_user_with_credits(5)
        
        # Simulate 3 rapid submissions of the exact same answers with same submission_token
        res1 = assessment_service.save_assessment_attempt(
            user_id=user_id,
            student_profile=SAMPLE_PROFILE,
            riasec_answers=SAMPLE_ANSWERS,
            riasec_scores={"R": 28, "I": 28, "A": 28, "S": 28, "E": 28, "C": 28},
            riasec_code="RIA",
            top_careers=[{"name": "Financial Engineer", "score": 85.0}],
            submission_token="sub_test_rapid_001"
        )
        res2 = assessment_service.save_assessment_attempt(
            user_id=user_id,
            student_profile=SAMPLE_PROFILE,
            riasec_answers=SAMPLE_ANSWERS,
            riasec_scores={"R": 28, "I": 28, "A": 28, "S": 28, "E": 28, "C": 28},
            riasec_code="RIA",
            top_careers=[{"name": "Financial Engineer", "score": 85.0}],
            submission_token="sub_test_rapid_001"
        )
        res3 = assessment_service.save_assessment_attempt(
            user_id=user_id,
            student_profile=SAMPLE_PROFILE,
            riasec_answers=SAMPLE_ANSWERS,
            riasec_scores={"R": 28, "I": 28, "A": 28, "S": 28, "E": 28, "C": 28},
            riasec_code="RIA",
            top_careers=[{"name": "Financial Engineer", "score": 85.0}],
            submission_token="sub_test_rapid_001"
        )

        # All three must return the EXACT same canonical attempt_id!
        assert res1['attempt_id'] == res2['attempt_id'] == res3['attempt_id']

        # And in database, exactly 1 row exists
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT count(*) FROM assessment_attempts WHERE user_id = ?", (user_id,))
        count = c.fetchone()[0]
        conn.close()
        assert count == 1

    def test_api_submit_answers_idempotency(self):
        user_id, email = create_test_user_with_credits(5)
        client = app.test_client()

        with client.session_transaction() as sess:
            sess['user_id'] = user_id
            sess['role'] = 'student'

        # Submit answers via API
        resp1 = client.post('/api/submit-answers', json={
            'answers': SAMPLE_ANSWERS,
            'student_info': SAMPLE_PROFILE,
            'submission_token': 'sub_test_token_123'
        })
        assert resp1.status_code == 200
        data1 = resp1.get_json()
        attempt_id_1 = data1['attempt_id']

        # Duplicate submit answers immediately
        resp2 = client.post('/api/submit-answers', json={
            'answers': SAMPLE_ANSWERS,
            'student_info': SAMPLE_PROFILE,
            'submission_token': 'sub_test_token_123'
        })
        assert resp2.status_code == 200
        data2 = resp2.get_json()
        attempt_id_2 = data2['attempt_id']

        # Must return the same attempt ID
        assert attempt_id_1 == attempt_id_2

        # History must contain only 1 attempt
        attempts = assessment_service.get_user_attempts(user_id)
        assert len(attempts) == 1

    def test_genuinely_new_assessment_creates_separate_attempt(self):
        user_id, _ = create_test_user_with_credits(5)
        
        # First test
        res1 = assessment_service.save_assessment_attempt(
            user_id=user_id,
            student_profile=SAMPLE_PROFILE,
            riasec_answers=SAMPLE_ANSWERS,
            riasec_scores={"R": 28, "I": 28, "A": 28, "S": 28, "E": 28, "C": 28},
            riasec_code="RIA",
            top_careers=[{"name": "Actuary", "score": 90.0}]
        )

        # Genuinely different test (different answers)
        diff_answers = [dict(a, value=1 if a['value'] == 4 else 5) for a in SAMPLE_ANSWERS]
        res2 = assessment_service.save_assessment_attempt(
            user_id=user_id,
            student_profile=SAMPLE_PROFILE,
            riasec_answers=diff_answers,
            riasec_scores={"R": 35, "I": 10, "A": 10, "S": 10, "E": 10, "C": 10},
            riasec_code="REC",
            top_careers=[{"name": "Mechanical Engineer", "score": 88.0}]
        )

        assert res1['attempt_id'] != res2['attempt_id']
        attempts = assessment_service.get_user_attempts(user_id)
        assert len(attempts) == 2
        titles = {a['primary_career_title'] for a in attempts}
        assert "Actuary" in titles
        assert "Mechanical Engineer" in titles

    def test_two_genuine_assessments_with_same_results_remain_separate(self):
        user_id, _ = create_test_user_with_credits(5)
        past_test_id = f'ast_past_test_{uuid.uuid4().hex[:8]}'

        # First test created manually in database with past timestamp
        conn = get_db_connection()
        with conn:
            conn.execute("""
                INSERT INTO assessment_attempts (
                    id, user_id, student_profile, riasec_answers, riasec_scores, riasec_code,
                    teaser_data, full_result_data, is_unlocked, created_at, completed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                past_test_id,
                user_id,
                json.dumps(SAMPLE_PROFILE),
                json.dumps(SAMPLE_ANSWERS),
                json.dumps({"E": 32, "C": 32, "R": 28}),
                "ECR",
                json.dumps({"primary_career_title": "Financial Engineer", "primary_match_score": 42.5}),
                json.dumps({"top_careers": [{"name": "Financial Engineer", "score": 42.5}]}),
                1,
                "2026-09-01T10:00:00",
                "2026-09-01T10:00:00"
            ))
        conn.close()

        # User legitimately completes a new test days later that also produces Financial Engineer
        res_new = assessment_service.save_assessment_attempt(
            user_id=user_id,
            student_profile=SAMPLE_PROFILE,
            riasec_answers=SAMPLE_ANSWERS,
            riasec_scores={"E": 32, "C": 32, "R": 28},
            riasec_code="ECR",
            top_careers=[{"name": "Financial Engineer", "score": 42.5}]
        )

        assert res_new['attempt_id'] != past_test_id
        attempts = assessment_service.get_user_attempts(user_id)
        assert len(attempts) == 2
        # Both distinct attempts must be returned
        attempt_ids = [a['id'] for a in attempts]
        assert past_test_id in attempt_ids
        assert res_new['attempt_id'] in attempt_ids

    def test_account_summary_does_not_create_attempts(self):
        user_id, email = create_test_user_with_credits(5)
        client = app.test_client()

        with client.session_transaction() as sess:
            sess['user_id'] = user_id
            sess['role'] = 'student'

        # Call /api/account/summary multiple times
        for _ in range(5):
            res = client.get('/api/account/summary')
            assert res.status_code == 200

        attempts = assessment_service.get_user_attempts(user_id)
        assert len(attempts) == 0

    def test_unlock_deducts_exactly_one_credit_once(self):
        user_id, _ = create_test_user_with_credits(5)
        initial_balance = wallet_service.get_balance(user_id)
        assert initial_balance == 5

        res = assessment_service.save_assessment_attempt(
            user_id=user_id,
            student_profile=SAMPLE_PROFILE,
            riasec_answers=SAMPLE_ANSWERS,
            riasec_scores={"R": 28, "I": 28, "A": 28, "S": 28, "E": 28, "C": 28},
            riasec_code="RIA",
            top_careers=[{"name": "Biomedical Engineer", "score": 88.0}]
        )
        attempt_id = res['attempt_id']

        # Unlock once
        unlock_res = assessment_service.unlock_assessment(user_id, attempt_id)
        assert unlock_res['status'] == 'success'
        assert wallet_service.get_balance(user_id) == 4

        # Unlock again (idempotent: 0 credits deducted)
        unlock_res2 = assessment_service.unlock_assessment(user_id, attempt_id)
        assert unlock_res2['status'] == 'already_unlocked'
        assert wallet_service.get_balance(user_id) == 4

    def test_unlock_on_duplicate_cluster_deducts_zero_if_already_unlocked(self):
        user_id, _ = create_test_user_with_credits(5)
        cluster_unlocked_id = f'ast_cluster_u_{uuid.uuid4().hex[:8]}'
        cluster_locked_id = f'ast_cluster_l_{uuid.uuid4().hex[:8]}'
        
        # Manually create two duplicate attempts in database (as occurred before the bug fix)
        conn = get_db_connection()
        with conn:
            conn.execute("""
                INSERT INTO assessment_attempts (
                    id, user_id, student_profile, riasec_answers, riasec_scores, riasec_code,
                    teaser_data, full_result_data, is_unlocked, created_at, completed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, '2026-09-05T18:47:08.200', '2026-09-05T18:47:08.200')
            """, (
                cluster_unlocked_id,
                user_id,
                json.dumps(SAMPLE_PROFILE),
                json.dumps(SAMPLE_ANSWERS),
                json.dumps({"R": 28}),
                "ECR",
                json.dumps({"primary_career_title": "Financial Engineer"}),
                json.dumps({"top_careers": [{"name": "Financial Engineer", "score": 42.5}]})
            ))
            conn.execute("""
                INSERT INTO assessment_attempts (
                    id, user_id, student_profile, riasec_answers, riasec_scores, riasec_code,
                    teaser_data, full_result_data, is_unlocked, created_at, completed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, '2026-09-05T18:47:08.300', '2026-09-05T18:47:08.300')
            """, (
                cluster_locked_id,
                user_id,
                json.dumps(SAMPLE_PROFILE),
                json.dumps(SAMPLE_ANSWERS),
                json.dumps({"R": 28}),
                "ECR",
                json.dumps({"primary_career_title": "Financial Engineer"}),
                json.dumps({"top_careers": [{"name": "Financial Engineer", "score": 42.5}]})
            ))
        conn.close()

        bal_before = wallet_service.get_balance(user_id)

        # Attempt to unlock the second (locked) attempt
        res = assessment_service.unlock_assessment(user_id, cluster_locked_id)
        assert res['status'] == 'already_unlocked'
        
        # ZERO credits consumed!
        bal_after = wallet_service.get_balance(user_id)
        assert bal_after == bal_before

    def test_reopening_unlocked_assessment_deducts_zero_credits(self):
        user_id, email = create_test_user_with_credits(5)
        client = app.test_client()

        with client.session_transaction() as sess:
            sess['user_id'] = user_id
            sess['role'] = 'student'

        res = assessment_service.save_assessment_attempt(
            user_id=user_id,
            student_profile=SAMPLE_PROFILE,
            riasec_answers=SAMPLE_ANSWERS,
            riasec_scores={"R": 28},
            riasec_code="RIA",
            top_careers=[{"name": "Robotics Engineer", "score": 92.0}]
        )
        attempt_id = res['attempt_id']
        assessment_service.unlock_assessment(user_id, attempt_id)
        bal_after_unlock = wallet_service.get_balance(user_id)

        # Open full report multiple times
        for _ in range(3):
            full_res = client.get(f'/api/assessment/{attempt_id}/full')
            assert full_res.status_code == 200

        assert wallet_service.get_balance(user_id) == bal_after_unlock

    def test_invalid_attempt_id_zero_credits(self):
        user_id, _ = create_test_user_with_credits(5)
        client = app.test_client()

        with client.session_transaction() as sess:
            sess['user_id'] = user_id
            sess['role'] = 'student'

        bal_before = wallet_service.get_balance(user_id)
        res = client.post('/api/assessment/ast_nonexistent_9999/unlock')
        assert res.status_code == 404
        assert wallet_service.get_balance(user_id) == bal_before

    def test_idor_attempt_id_zero_credits(self):
        owner_id, _ = create_test_user_with_credits(5)
        attacker_id, _ = create_test_user_with_credits(5)

        res = assessment_service.save_assessment_attempt(
            user_id=owner_id,
            student_profile=SAMPLE_PROFILE,
            riasec_answers=SAMPLE_ANSWERS,
            riasec_scores={"R": 28},
            riasec_code="RIA",
            top_careers=[{"name": "Cybersecurity Analyst", "score": 95.0}]
        )
        attempt_id = res['attempt_id']

        client = app.test_client()
        with client.session_transaction() as sess:
            sess['user_id'] = attacker_id
            sess['role'] = 'student'

        bal_before = wallet_service.get_balance(attacker_id)
        unlock_res = client.post(f'/api/assessment/{attempt_id}/unlock')
        assert unlock_res.status_code == 403
        assert wallet_service.get_balance(attacker_id) == bal_before
