# services/assessment_service.py - Assessment attempt persistence and paywall access control
import uuid
import json
from datetime import datetime
from typing import Optional, Dict, Any, List
from database.schema import get_db_connection
from services.wallet_service import wallet_service


class AssessmentService:
    """Manages assessment attempt storage, server-side paywall authorization, and credit unlocks."""

    @staticmethod
    def save_assessment_attempt(
        user_id: Optional[str] = None,
        guest_session_id: Optional[str] = None,
        student_profile: Optional[Dict] = None,
        riasec_answers: Optional[List] = None,
        riasec_scores: Optional[Dict] = None,
        riasec_code: Optional[str] = None,
        top_careers: Optional[List] = None
    ) -> Dict[str, Any]:
        """Save completed assessment attempt and generate teaser metrics (locked by default)."""
        attempt_id = f"ast_{uuid.uuid4().hex[:12]}"
        now_str = datetime.now().isoformat()

        top_careers = top_careers or []
        primary_match = top_careers[0] if top_careers else {}
        primary_score = primary_match.get('score', 85.0)
        primary_name = primary_match.get('name', 'Top Career Match')
        optional_paths_count = max(0, len(top_careers) - 1)

        # Teaser payload ONLY contains non-sensitive high-level value information (NO numerical match score)
        teaser_data = {
            'attempt_id': attempt_id,
            'riasec_code': riasec_code or 'RIA',
            'status': 'ready',
            'teaser_headline': "Your Personalized Career Roadmap Is Ready",
            'teaser_subheadline': "Our assessment engine analyzed your responses and identified career directions that align with your personality, interests, and preferences.",
            'career_status': "Multiple career directions identified for you",
            'included_features': [
                "Complete Career Matches",
                "Education Pathways",
                "Skills & Development Guidance",
                "Career & Salary Insights",
                "Personalized AI Guidance"
            ]
        }

        full_result_data = {
            'student_profile': student_profile,
            'riasec_scores': riasec_scores,
            'riasec_code': riasec_code,
            'top_careers': top_careers
        }

        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO assessment_attempts (
                        id, user_id, guest_session_id, student_profile, riasec_answers, riasec_scores, riasec_code,
                        teaser_data, full_result_data, is_unlocked, created_at, completed_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
                """, (
                    attempt_id, user_id, guest_session_id,
                    json.dumps(student_profile) if student_profile else None,
                    json.dumps(riasec_answers) if riasec_answers else None,
                    json.dumps(riasec_scores) if riasec_scores else None,
                    riasec_code,
                    json.dumps(teaser_data),
                    json.dumps(full_result_data),
                    now_str, now_str
                ))

            return {
                'attempt_id': attempt_id,
                'is_unlocked': False,
                'teaser': teaser_data
            }
        finally:
            conn.close()

    @staticmethod
    def claim_guest_assessment(guest_session_id: Optional[str] = None, user_id: Optional[str] = None, attempt_id: Optional[str] = None) -> int:
        """Associate guest assessment attempts with a newly registered/logged-in user account."""
        if not user_id:
            return 0
        if not guest_session_id and not attempt_id:
            return 0

        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                claimed_count = 0
                if attempt_id:
                    cursor.execute("""
                        UPDATE assessment_attempts
                        SET user_id = ?
                        WHERE id = ? AND (user_id IS NULL OR user_id = '' OR user_id = ?)
                    """, (user_id, attempt_id, user_id))
                    claimed_count += cursor.rowcount

                if guest_session_id:
                    cursor.execute("""
                        UPDATE assessment_attempts
                        SET user_id = ?
                        WHERE guest_session_id = ? AND (user_id IS NULL OR user_id = '')
                    """, (user_id, guest_session_id))
                    claimed_count += cursor.rowcount

                return claimed_count
        finally:
            conn.close()

    @staticmethod
    def get_attempt_by_id(attempt_id: str) -> Optional[Dict[str, Any]]:
        """Fetch raw assessment attempt row by ID."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM assessment_attempts WHERE id = ?", (attempt_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return dict(row)
        finally:
            conn.close()

    @staticmethod
    def get_teaser(attempt_id: str) -> Optional[Dict[str, Any]]:
        """Fetch locked teaser information for an assessment attempt (protects full report data)."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, user_id, guest_session_id, teaser_data, full_result_data, is_unlocked, created_at, unlocked_at
                FROM assessment_attempts
                WHERE id = ?
            """, (attempt_id,))
            row = cursor.fetchone()
            if not row:
                return None

            teaser = json.loads(row['teaser_data']) if isinstance(row['teaser_data'], str) else (row['teaser_data'] or {})
            
            # Server-side paywall sanitization: NEVER leak numerical match score or path count when locked
            teaser_sanitized = {
                'attempt_id': row['id'],
                'riasec_code': teaser.get('riasec_code', 'RIA'),
                'status': 'ready',
                'teaser_headline': "Your Personalized Career Roadmap Is Ready",
                'teaser_subheadline': "Our assessment engine analyzed your responses and identified career directions that align with your personality, interests, and preferences.",
                'career_status': "Multiple career directions identified for you",
                'included_features': [
                    "Complete Career Matches",
                    "Education Pathways",
                    "Skills & Development Guidance",
                    "Career & Salary Insights",
                    "Personalized AI Guidance"
                ]
            }

            return {
                'attempt_id': row['id'],
                'user_id': row['user_id'],
                'is_unlocked': bool(row['is_unlocked']),
                'created_at': row['created_at'],
                'unlocked_at': row['unlocked_at'],
                'teaser': teaser_sanitized
            }
        finally:
            conn.close()

    @staticmethod
    def get_assessment_full(user_id: str, attempt_id: str) -> Dict[str, Any]:
        """Fetch full unlocked assessment roadmap. Strictly protects unauthorized or locked attempts."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, user_id, full_result_data, is_unlocked, created_at, unlocked_at
                FROM assessment_attempts
                WHERE id = ?
            """, (attempt_id,))
            attempt = cursor.fetchone()
            if not attempt:
                raise ValueError(f"Assessment attempt '{attempt_id}' not found.")

            if attempt['user_id'] != user_id:
                raise ValueError("Unauthorized. You do not have access to this assessment result.")

            if not attempt['is_unlocked']:
                raise ValueError("Assessment report is locked. Please unlock using 1 assessment credit.")

            full_data = json.loads(attempt['full_result_data']) if isinstance(attempt['full_result_data'], str) else (attempt['full_result_data'] or {})
            return {
                'status': 'success',
                'attempt_id': attempt['id'],
                'is_unlocked': True,
                'created_at': attempt['created_at'],
                'unlocked_at': attempt['unlocked_at'],
                'full_report': full_data
            }
        finally:
            conn.close()

    @staticmethod
    def unlock_assessment(user_id: str, attempt_id: str) -> Dict[str, Any]:
        """Atomically check credit balance, deduct 1 credit, mark assessment as unlocked, and return full report."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, user_id, guest_session_id, full_result_data, is_unlocked
                FROM assessment_attempts
                WHERE id = ?
            """, (attempt_id,))
            attempt = cursor.fetchone()

            if not attempt:
                raise ValueError(f"Assessment attempt '{attempt_id}' not found.")

            # If unassigned guest attempt, link to active user
            if not attempt['user_id']:
                with conn:
                    conn.execute("UPDATE assessment_attempts SET user_id = ? WHERE id = ?", (user_id, attempt_id))
            elif attempt['user_id'] != user_id:
                raise ValueError("Unauthorized attempt to unlock another user's assessment.")

            # If already unlocked, return full report directly with 0 credit deduction!
            if attempt['is_unlocked']:
                full_data = json.loads(attempt['full_result_data']) if isinstance(attempt['full_result_data'], str) else (attempt['full_result_data'] or {})
                return {
                    'status': 'already_unlocked',
                    'message': 'Assessment report is already permanently unlocked.',
                    'attempt_id': attempt_id,
                    'full_report': full_data
                }

            # Atomically deduct 1 credit from wallet
            now_str = datetime.now().isoformat()
            new_balance = wallet_service.deduct_credits(
                user_id=user_id,
                amount=1,
                transaction_type='ASSESSMENT_UNLOCK',
                reference_type='assessment_attempt',
                reference_id=attempt_id,
                description=f"Unlocked Career Roadmap Report ({attempt_id})"
            )

            # Mark attempt as permanently unlocked in SQLite
            with conn:
                conn.execute("""
                    UPDATE assessment_attempts
                    SET is_unlocked = 1, unlocked_at = ?
                    WHERE id = ?
                """, (now_str, attempt_id))

            full_data = json.loads(attempt['full_result_data']) if isinstance(attempt['full_result_data'], str) else (attempt['full_result_data'] or {})
            return {
                'status': 'success',
                'message': 'Career Roadmap unlocked successfully!',
                'attempt_id': attempt_id,
                'credits_remaining': new_balance,
                'full_report': full_data
            }
        finally:
            conn.close()

    @staticmethod
    def get_user_attempts(user_id: str) -> List[Dict[str, Any]]:
        """Fetch all assessment attempts for a user in reverse chronological order."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, user_id, is_unlocked, created_at, unlocked_at, teaser_data, full_result_data
                FROM assessment_attempts
                WHERE user_id = ?
                ORDER BY created_at DESC, rowid DESC
            """, (user_id,))
            rows = cursor.fetchall()
            results = []
            for r in rows:
                t_data = json.loads(r['teaser_data']) if isinstance(r['teaser_data'], str) else (r['teaser_data'] or {})
                career_title = t_data.get('primary_career_title')
                match_score = t_data.get('primary_match_score')
                riasec = t_data.get('riasec_code')

                if not career_title and r['full_result_data']:
                    try:
                        f_data = json.loads(r['full_result_data'])
                        top = f_data.get('top_careers') or []
                        if top:
                            career_title = top[0].get('name')
                            match_score = top[0].get('score')
                        if not riasec:
                            riasec = f_data.get('riasec_code')
                    except Exception:
                        pass

                is_unlocked = bool(r['is_unlocked'])
                results.append({
                    'id': r['id'],
                    'is_unlocked': is_unlocked,
                    'created_at': r['created_at'],
                    'unlocked_at': r['unlocked_at'],
                    'primary_career_title': career_title or 'Career Roadmap Match',
                    # Server-side paywall: protect numerical match score on locked assessments
                    'primary_match_score': (match_score or 85.0) if is_unlocked else None,
                    'riasec_code': riasec or 'RIA'
                })
            return results
        finally:
            conn.close()


assessment_service = AssessmentService()
