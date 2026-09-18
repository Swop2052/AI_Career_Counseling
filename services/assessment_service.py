# services/assessment_service.py - Assessment attempt persistence and paywall access control
import uuid
import json
from datetime import datetime, timedelta
from urllib.parse import unquote
from typing import Optional, Dict, Any, List
from database.schema import get_db_connection
from services.wallet_service import wallet_service


class AssessmentService:
    @staticmethod
    def _normalize_report_careers(full_data: dict) -> dict:
        """Ensure every career object in top_careers has match_score, score, and complete normalized data."""
        if not isinstance(full_data, dict):
            return {}
        try:
            from modules.career_normalizer import normalize_career_record, CAREER_DB
        except ImportError:
            normalize_career_record = lambda x: x or {}
            CAREER_DB = []

        top_careers = full_data.get('top_careers') or []
        normalized_careers = []
        for c in top_careers:
            if not isinstance(c, dict):
                continue
            c_copy = dict(c)
            val = c_copy.get('match_score') if c_copy.get('match_score') is not None else c_copy.get('score', 85.0)
            try:
                f_score = round(float(val), 1)
            except (ValueError, TypeError):
                f_score = 85.0
            c_copy['match_score'] = f_score
            c_copy['score'] = f_score
            c_name = c_copy.get('name') or c_copy.get('career_name') or 'Career Match'
            c_copy['name'] = c_name
            c_copy['career_name'] = c_name

            c_data = c_copy.get('data') or c_copy.get('career_data') or {}
            if (not c_data or not isinstance(c_data, dict) or len(c_data) < 3) and CAREER_DB and c_name:
                c_clean = c_name.strip().lower()
                for db_c in CAREER_DB:
                    db_name = (db_c.get('career_name') or '').strip().lower()
                    if db_name == c_clean or c_clean in db_name or db_name in c_clean:
                        c_data = db_c.get('career_data') or db_c
                        break
            c_copy['data'] = normalize_career_record(c_data) if c_data else {}
            normalized_careers.append(c_copy)

        full_data['top_careers'] = normalized_careers
        return full_data

    """Manages assessment attempt storage, server-side paywall authorization, and credit unlocks."""

    @staticmethod
    def _clean_id(raw_id: Any) -> str:
        """Strip whitespace, URL percent-encoding, and surrounding quotes from an attempt ID."""
        if not raw_id:
            return ""
        cleaned = unquote(str(raw_id)).strip().strip("'\"")
        return cleaned

    @staticmethod
    def _bridge_test_to_attempt(cursor, conn, t_row) -> Optional[Dict[str, Any]]:
        """Bridge a legacy record from 'tests' table into 'assessment_attempts' format."""
        if not t_row:
            return None

        test_id = str(t_row['test_id']).strip()
        fullname = t_row['fullname'] or ''
        email = t_row['email'] or ''

        # Match existing registered user if possible
        user_id = None
        if email:
            cursor.execute("SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(%s))", (email,))
            u = cursor.fetchone()
            if u:
                user_id = u['id']
        if not user_id and fullname:
            cursor.execute("""
                SELECT u.id FROM users u
                JOIN user_profiles p ON p.user_id = u.id
                WHERE LOWER(TRIM(p.full_name)) = LOWER(TRIM(%s))
                ORDER BY u.created_at ASC
            """, (fullname,))
            u = cursor.fetchone()
            if u:
                user_id = u['id']

        student_profile = t_row['student_profile']
        riasec_answers = t_row['riasec_answers']
        riasec_scores = t_row['riasec_scores']
        riasec_code = t_row['riasec_code'] or 'RIA'
        created_at = t_row['created_at'] or datetime.now().isoformat()

        # Build full_result_data and top_careers
        matches_raw = t_row['career_matches']
        matches = json.loads(matches_raw) if isinstance(matches_raw, str) else (matches_raw or [])
        top_careers = []
        try:
            from modules.career_normalizer import normalize_career_record
        except ImportError:
            normalize_career_record = lambda x: x or {}

        for m in (matches or [])[:6]:
            c_name = m.get('career_name') or m.get('name') or 'Career Match'
            c_score = m.get('match_score') or m.get('score') or 85.0
            c_data = m.get('career_data') or m.get('data') or {}
            top_careers.append({
                'name': c_name,
                'career_name': c_name,
                'score': round(float(c_score), 1),
                'match_score': round(float(c_score), 1),
                'riasec_score': round(float(m.get('riasec_match') or 80.0), 1),
                'personality_score': round(float(m.get('profile_match') or 14.0), 1),
                'subject_score': round(float(m.get('subject_match') or 100.0), 1),
                'interest_score': round(float(m.get('interest_match') or 75.0), 1),
                'data': normalize_career_record(c_data) if c_data else {},
                'reason': m.get('reason') or f"Aligns well with your RIASEC profile ({riasec_code})",
                'strengths': m.get('strengths')[:3] if m.get('strengths') else [],
                'improvement_areas': m.get('improvement_areas')[:2] if m.get('improvement_areas') else []
            })

        profile_dict = json.loads(student_profile) if isinstance(student_profile, str) else (student_profile or {})
        scores_dict = json.loads(riasec_scores) if isinstance(riasec_scores, str) else (riasec_scores or {})
        full_result = {
            'top_careers': top_careers,
            'student_profile': profile_dict,
            'riasec_scores': scores_dict,
            'riasec_code': riasec_code
        }

        teaser = {
            'primary_career_title': top_careers[0]['name'] if top_careers else 'Personalized Career Roadmap',
            'primary_match_score': top_careers[0]['score'] if top_careers else 85.0,
            'riasec_code': riasec_code,
            'teaser_headline': "Your Personalized Career Roadmap Is Ready",
            'teaser_subheadline': "Our assessment engine analyzed your responses and identified career directions that align with your personality, interests, and preferences."
        }

        # Persist into assessment_attempts so future lookups find it instantly
        try:
            cursor.execute("""
                INSERT INTO assessment_attempts (
                    id, user_id, guest_session_id, student_profile, riasec_answers, riasec_scores, riasec_code,
                    teaser_data, full_result_data, is_unlocked, created_at, completed_at, unlocked_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 1, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    user_id = EXCLUDED.user_id,
                    guest_session_id = EXCLUDED.guest_session_id,
                    student_profile = EXCLUDED.student_profile,
                    riasec_answers = EXCLUDED.riasec_answers,
                    riasec_scores = EXCLUDED.riasec_scores,
                    riasec_code = EXCLUDED.riasec_code,
                    teaser_data = EXCLUDED.teaser_data,
                    full_result_data = EXCLUDED.full_result_data,
                    is_unlocked = EXCLUDED.is_unlocked,
                    completed_at = EXCLUDED.completed_at,
                    unlocked_at = EXCLUDED.unlocked_at
            """, (
                test_id, user_id, None,
                json.dumps(profile_dict) if isinstance(profile_dict, dict) else student_profile,
                riasec_answers if isinstance(riasec_answers, str) else json.dumps(riasec_answers or []),
                json.dumps(scores_dict) if isinstance(scores_dict, dict) else riasec_scores,
                riasec_code, json.dumps(teaser), json.dumps(full_result),
                created_at, created_at, created_at
            ))
            if conn:
                conn.commit()
        except Exception as e:
            print(f"[WARN] Failed to insert bridged test into assessment_attempts: {e}")

        cursor.execute("SELECT * FROM assessment_attempts WHERE id = %s", (test_id,))
        fresh = cursor.fetchone()
        return dict(fresh) if fresh else None

    @staticmethod
    def _fetch_attempt_record(cursor, conn, attempt_id: str) -> Optional[Dict[str, Any]]:
        """Find assessment attempt by id, with/without ast_ prefix, by numeric rowid, or fallback to tests table."""
        clean_id = AssessmentService._clean_id(attempt_id)
        if not clean_id:
            return None

        no_prefix = clean_id[4:] if clean_id.lower().startswith('ast_') else clean_id
        with_prefix = clean_id if clean_id.lower().startswith('ast_') else f"ast_{clean_id}"

        # 1. Search assessment_attempts table
        cursor.execute("""
            SELECT id, user_id, guest_session_id, student_profile, riasec_answers, riasec_scores, riasec_code,
                   teaser_data, full_result_data, is_unlocked, created_at, completed_at, unlocked_at
            FROM assessment_attempts
            WHERE LOWER(TRIM(id)) = LOWER(TRIM(%s))
               OR LOWER(TRIM(id)) = LOWER(TRIM(%s))
               OR LOWER(TRIM(id)) = LOWER(TRIM(%s))
        """, (clean_id, with_prefix, no_prefix))
        row = cursor.fetchone()
        if row:
            return dict(row)

        return None

    @staticmethod
    def save_assessment_attempt(
        user_id: Optional[str] = None,
        guest_session_id: Optional[str] = None,
        student_profile: Optional[Dict] = None,
        riasec_answers: Optional[List] = None,
        riasec_scores: Optional[Dict] = None,
        riasec_code: Optional[str] = None,
        top_careers: Optional[List] = None,
        submission_token: Optional[str] = None
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
            'submission_token': submission_token,
            'included_features': [
                "Complete Career Matches",
                "Education Pathways",
                "Skills & Development Guidance",
                "Career & Salary Insights",
                "Personalized AI Guidance"
            ]
        }

        full_result_data = {
            'student_profile': student_profile or {},
            'riasec_scores': riasec_scores or {},
            'riasec_code': riasec_code or 'RIA',
            'top_careers': top_careers
        }

        # Attempts are ALWAYS locked by default
        is_unlocked = 0

        conn = get_db_connection()
        try:
            # Idempotency & Debounce Guard:
            cursor = conn.cursor()
            existing = None
            if submission_token:
                window_start = (datetime.now() - timedelta(minutes=5)).isoformat()
                cursor.execute("""
                    SELECT id, is_unlocked, teaser_data, full_result_data, created_at, unlocked_at
                    FROM assessment_attempts
                    WHERE (user_id = %s OR guest_session_id = %s)
                      AND completed_at >= %s
                      AND teaser_data::text LIKE %s
                    ORDER BY completed_at DESC LIMIT 1
                """, (user_id or '', guest_session_id or '', window_start, f'%"submission_token": "{submission_token}"%'))
                existing = cursor.fetchone()

            # Secondary debounce guard: check if user/guest submitted identical RIASEC code within last 5 seconds
            if not existing and (user_id or guest_session_id) and riasec_code:
                debounce_window = (datetime.now() - timedelta(seconds=5)).isoformat()
                cursor.execute("""
                    SELECT id, is_unlocked, teaser_data, full_result_data, created_at, unlocked_at
                    FROM assessment_attempts
                    WHERE (user_id = %s OR guest_session_id = %s)
                      AND completed_at >= %s
                      AND riasec_code = %s
                    ORDER BY completed_at DESC LIMIT 1
                """, (user_id or '', guest_session_id or '', debounce_window, riasec_code))
                existing = cursor.fetchone()

            if existing:
                print(f"[INFO] Idempotent submission: reusing existing attempt '{existing['id']}'")
                t_data = json.loads(existing['teaser_data']) if isinstance(existing['teaser_data'], str) else (existing['teaser_data'] or {})
                full_rep = json.loads(existing['full_result_data']) if existing['is_unlocked'] and existing['full_result_data'] else None
                return {
                    'attempt_id': existing['id'],
                    'is_unlocked': bool(existing['is_unlocked']),
                    'teaser': t_data,
                    'created_at': existing['created_at'],
                    'unlocked_at': existing['unlocked_at'],
                    'full_report': full_rep
                }

            with conn:
                conn.execute("""
                    INSERT INTO assessment_attempts (
                        id, user_id, guest_session_id, student_profile, riasec_answers,
                        riasec_scores, riasec_code, teaser_data, full_result_data,
                        is_unlocked, created_at, completed_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    attempt_id,
                    user_id,
                    guest_session_id,
                    json.dumps(student_profile or {}),
                    json.dumps(riasec_answers or []),
                    json.dumps(riasec_scores or {}),
                    riasec_code,
                    json.dumps(teaser_data),
                    json.dumps(full_result_data),
                    is_unlocked,
                    now_str,
                    now_str
                ))

            return {
                'attempt_id': attempt_id,
                'is_unlocked': bool(is_unlocked),
                'teaser': teaser_data,
                'created_at': now_str
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

        clean_attempt = AssessmentService._clean_id(attempt_id) if attempt_id else None

        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                claimed_count = 0
                if clean_attempt:
                    cursor.execute("""
                        SELECT id, user_id FROM assessment_attempts
                        WHERE LOWER(TRIM(id)) = LOWER(TRIM(%s))
                    """, (clean_attempt,))
                    row = cursor.fetchone()
                    if row:
                        curr_owner = row.get('user_id') if isinstance(row, dict) else row[1]
                        if not curr_owner or str(curr_owner).strip() == '' or str(curr_owner).strip() == str(user_id).strip():
                            cursor.execute("""
                                UPDATE assessment_attempts
                                SET user_id = %s
                                WHERE LOWER(TRIM(id)) = LOWER(TRIM(%s))
                            """, (user_id, clean_attempt))
                            claimed_count += 1

                if guest_session_id:
                    cursor.execute("""
                        UPDATE assessment_attempts
                        SET user_id = %s
                        WHERE guest_session_id = %s AND (user_id IS NULL OR user_id = '')
                    """, (user_id, guest_session_id))
                    if cursor.rowcount and cursor.rowcount > 0:
                        claimed_count += cursor.rowcount

                return claimed_count
        finally:
            conn.close()

    @staticmethod
    def get_attempt_by_id(attempt_id: str) -> Optional[Dict[str, Any]]:
        """Fetch raw assessment attempt row by ID with fallback support."""
        clean_id = AssessmentService._clean_id(attempt_id)
        if not clean_id:
            return None

        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            return AssessmentService._fetch_attempt_record(cursor, conn, clean_id)
        finally:
            conn.close()

    @staticmethod
    def _reconstruct_full_report(attempt_row: Dict[str, Any]) -> Dict[str, Any]:
        """Dynamically reconstitute full career roadmap report for legacy or sparse attempts."""
        p_raw = attempt_row.get('student_profile')
        s_raw = attempt_row.get('riasec_scores')
        code = attempt_row.get('riasec_code') or 'RIA'

        profile = json.loads(p_raw) if isinstance(p_raw, str) else (p_raw or {})
        scores = json.loads(s_raw) if isinstance(s_raw, str) else (s_raw or {'R': 15, 'I': 15, 'A': 15, 'S': 15, 'E': 15, 'C': 15})

        student_info = profile.get('student_info', profile) if isinstance(profile, dict) else {}

        try:
            from profile_generator import generate_student_profile
            from modules.persona_fusion import persona_fusion
            from modules.retrieval_pipeline import retrieval_pipeline
            from app import CAREER_DB, normalize_career_record

            gen_profile = generate_student_profile(scores, student_info)
            persona = persona_fusion.generate_persona(gen_profile, student_info)
            persona_dict = persona.to_dict() if hasattr(persona, 'to_dict') else persona

            career_matches = retrieval_pipeline.retrieve(persona_dict, CAREER_DB)
            top_careers = []
            for match in career_matches[:6]:
                top_careers.append({
                    'name': match.career_name,
                    'career_name': match.career_name,
                    'score': round(match.match_score, 1),
                    'match_score': round(match.match_score, 1),
                    'riasec_score': round(match.riasec_match, 1),
                    'personality_score': round(match.profile_match, 1),
                    'subject_score': round(match.subject_match, 1),
                    'interest_score': round(match.interest_match, 1),
                    'data': normalize_career_record(match.career_data),
                    'reason': match.reason,
                    'strengths': match.strengths[:3] if hasattr(match, 'strengths') and match.strengths else [],
                    'improvement_areas': match.improvement_areas[:2] if hasattr(match, 'improvement_areas') and match.improvement_areas else []
                })

            return {
                'student_profile': gen_profile,
                'riasec_scores': scores,
                'riasec_code': code,
                'top_careers': top_careers
            }
        except Exception as e:
            print(f"[WARN] AssessmentService could not reconstruct full report: {e}")
            return {
                'student_profile': profile,
                'riasec_scores': scores,
                'riasec_code': code,
                'top_careers': []
            }

    @staticmethod
    def get_teaser(attempt_id: str) -> Optional[Dict[str, Any]]:
        """Fetch locked teaser information for an assessment attempt (protects full report data)."""
        clean_id = AssessmentService._clean_id(attempt_id)
        if not clean_id:
            return None

        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            row = AssessmentService._fetch_attempt_record(cursor, conn, clean_id)
            if not row:
                return None

            teaser = json.loads(row['teaser_data']) if isinstance(row['teaser_data'], str) else (row['teaser_data'] or {})
            if not isinstance(teaser, dict):
                teaser = {}

            # Server-side paywall sanitization: NEVER leak numerical match score when locked
            is_unlocked = bool(row['is_unlocked'])
            teaser_sanitized = {
                'attempt_id': row['id'],
                'riasec_code': teaser.get('riasec_code', 'RIA') if isinstance(teaser, dict) else 'RIA',
                'status': 'ready',
                'teaser_headline': "Your Personalized Career Roadmap Is Ready",
                'teaser_subheadline': "Our assessment engine analyzed your responses and identified career directions that align with your personality, interests, and preferences.",
                'career_status': "Multiple career directions identified for you",
                'primary_career_title': teaser.get('primary_career_title') or 'Personalized Career Roadmap',
                'included_features': [
                    "Complete Career Matches",
                    "Education Pathways",
                    "Skills & Development Guidance",
                    "Career & Salary Insights",
                    "Personalized AI Guidance"
                ]
            }

            if is_unlocked and teaser.get('primary_match_score'):
                teaser_sanitized['primary_match_score'] = teaser.get('primary_match_score')

            return {
                'attempt_id': row['id'],
                'user_id': row['user_id'],
                'is_unlocked': is_unlocked,
                'created_at': row['created_at'],
                'unlocked_at': row['unlocked_at'],
                'teaser': teaser_sanitized
            }
        finally:
            conn.close()

    @staticmethod
    def get_assessment_full(user_id: str, attempt_id: str, is_admin: bool = False) -> Dict[str, Any]:
        """Fetch full unlocked assessment roadmap. Strictly protects unauthorized or locked attempts."""
        clean_id = AssessmentService._clean_id(attempt_id)
        if not clean_id:
            raise ValueError("Assessment attempt ID is required.")

        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            attempt = AssessmentService._fetch_attempt_record(cursor, conn, clean_id)
            if not attempt:
                raise ValueError(f"Assessment attempt '{clean_id}' not found.")

            # Auto-claim unowned attempt if current student is authenticated
            attempt_owner = attempt['user_id']
            if not attempt_owner and user_id:
                with conn:
                    conn.execute("UPDATE assessment_attempts SET user_id = %s WHERE id = %s", (user_id, attempt['id']))
                attempt_owner = user_id

            if not is_admin and attempt_owner and str(attempt_owner).strip() != str(user_id).strip():
                raise ValueError("Unauthorized. You do not have access to this assessment result.")

            if not attempt['is_unlocked']:
                raise ValueError("Assessment report is locked. Please unlock using 1 assessment credit.")

            full_data = json.loads(attempt['full_result_data']) if isinstance(attempt['full_result_data'], str) else (attempt['full_result_data'] or {})

            # Reconstitute report if missing or sparse (< 3 careers)
            top_careers = full_data.get('top_careers') or []
            if not full_data or len(top_careers) < 3:
                reconstituted = AssessmentService._reconstruct_full_report(dict(attempt))
                if reconstituted and len(reconstituted.get('top_careers') or []) >= 3:
                    full_data = reconstituted
                    with conn:
                        conn.execute("UPDATE assessment_attempts SET full_result_data = %s WHERE id = %s", (json.dumps(full_data), attempt['id']))

            full_data = AssessmentService._normalize_report_careers(full_data)

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
        """Atomically check credit balance, deduct 1 credit, mark assessment as unlocked, and return full report.
        Single transaction, strict row locking, idempotency guarantee, and rollback on any failure."""
        clean_id = AssessmentService._clean_id(attempt_id)
        if not clean_id:
            raise ValueError("Assessment attempt ID is required.")

        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                # 1. Fetch & lock attempt record
                cursor.execute("""
                    SELECT id, user_id, is_unlocked, created_at, unlocked_at, full_result_data,
                           riasec_answers, riasec_code, teaser_data
                    FROM assessment_attempts
                    WHERE id = %s
                    FOR UPDATE
                """, (clean_id,))
                attempt = cursor.fetchone()
                if not attempt:
                    cursor.execute("""
                        SELECT id, user_id, is_unlocked, created_at, unlocked_at, full_result_data,
                               riasec_answers, riasec_code, teaser_data
                        FROM assessment_attempts
                        WHERE id = %s OR id = %s
                        FOR UPDATE
                    """, (f"ast_{clean_id}", clean_id.replace("ast_", "")))
                    attempt = cursor.fetchone()

                if not attempt:
                    raise ValueError(f"Assessment attempt '{clean_id}' not found.")

                attempt = dict(attempt)

                # Link guest attempt if unowned
                if not attempt['user_id']:
                    cursor.execute("UPDATE assessment_attempts SET user_id = %s WHERE id = %s", (user_id, attempt['id']))
                    attempt['user_id'] = user_id
                elif str(attempt['user_id']).strip() != str(user_id).strip():
                    raise ValueError("Unauthorized attempt to unlock another user's assessment.")

                # Fetch current wallet balance with row lock
                cursor.execute("SELECT id, balance FROM credit_wallets WHERE user_id = %s FOR UPDATE", (user_id,))
                w_row = cursor.fetchone()
                current_bal = w_row['balance'] if w_row else 0

                # If already unlocked, return full report directly with 0 credit deduction (Idempotent!)
                if attempt['is_unlocked']:
                    full_data = json.loads(attempt['full_result_data']) if isinstance(attempt['full_result_data'], str) else (attempt['full_result_data'] or {})
                    if not full_data or not full_data.get('top_careers'):
                        full_data = AssessmentService._reconstruct_full_report(dict(attempt))
                        cursor.execute("UPDATE assessment_attempts SET full_result_data = %s WHERE id = %s", (json.dumps(full_data), attempt['id']))
                    normalized_report = AssessmentService._normalize_report_careers(full_data)
                    return {
                        'status': 'already_unlocked',
                        'message': 'Assessment report is already permanently unlocked.',
                        'attempt_id': attempt['id'],
                        'credits_remaining': current_bal,
                        'full_report': normalized_report
                    }

                # Pre-validate report data BEFORE deducting credit:
                full_data = json.loads(attempt['full_result_data']) if isinstance(attempt['full_result_data'], str) else (attempt['full_result_data'] or {})
                if not full_data or not full_data.get('top_careers'):
                    reconstituted = AssessmentService._reconstruct_full_report(dict(attempt))
                    if reconstituted and reconstituted.get('top_careers'):
                        full_data = reconstituted
                    else:
                        raise ValueError("Cannot unlock this assessment because assessment responses are incomplete. No credits have been deducted.")

                # Duplicate attempt detection: check if a twin attempt was already unlocked
                if attempt.get('riasec_answers'):
                    ans_str = attempt['riasec_answers']
                    try:
                        ans_list = json.loads(ans_str) if isinstance(ans_str, str) else ans_str
                    except Exception:
                        ans_list = []
                    if isinstance(ans_list, list) and len(ans_list) >= 10:
                        cursor.execute("""
                            SELECT id, full_result_data, unlocked_at, created_at, riasec_answers FROM assessment_attempts
                            WHERE user_id = %s AND riasec_code = %s AND is_unlocked = 1
                        """, (user_id, attempt['riasec_code']))
                        candidates = cursor.fetchall()
                        for cand in candidates:
                            cand_ans = cand['riasec_answers']
                            if isinstance(cand_ans, str):
                                try:
                                    cand_ans = json.loads(cand_ans)
                                except Exception:
                                    pass
                            if cand_ans == ans_list:
                                twin_full = cand['full_result_data'] if isinstance(cand['full_result_data'], dict) else (json.loads(cand['full_result_data']) if cand['full_result_data'] else None)
                                twin_full_db = json.dumps(cand['full_result_data']) if isinstance(cand['full_result_data'], dict) else cand['full_result_data']
                                cursor.execute("""
                                    UPDATE assessment_attempts
                                    SET is_unlocked = 1, unlocked_at = COALESCE(%s, %s), full_result_data = COALESCE(%s, full_result_data)
                                    WHERE id = %s
                                """, (cand['unlocked_at'], datetime.now(), twin_full_db, attempt['id']))
                                return {
                                    'status': 'already_unlocked',
                                    'message': 'Assessment report is already permanently unlocked.',
                                    'attempt_id': attempt['id'],
                                    'credits_remaining': current_bal,
                                    'full_report': twin_full or AssessmentService._reconstruct_full_report(dict(attempt))
                                }

                # Verify wallet balance >= 1
                if current_bal < 1:
                    raise ValueError("Insufficient assessment credits. Please purchase a credit pack to unlock.")

                now_str = datetime.now().isoformat()
                new_balance = current_bal - 1

                # Deduct exactly 1 credit atomically
                cursor.execute("""
                    UPDATE credit_wallets
                    SET balance = %s, updated_at = %s
                    WHERE user_id = %s
                """, (new_balance, now_str, user_id))

                # Insert credit ledger debit entry (REPORT_UNLOCK, -1)
                tx_id = f"tx_{uuid.uuid4().hex[:12]}"
                cursor.execute("""
                    INSERT INTO credit_transactions (
                        id, user_id, type, amount, balance_after,
                        reference_type, reference_id, description, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (tx_id, user_id, 'REPORT_UNLOCK', -1, new_balance, 'assessment_attempt', attempt['id'], f"Unlocked Career Roadmap Report ({attempt['id']})", now_str))

                # Mark attempt as permanently unlocked
                cursor.execute("""
                    UPDATE assessment_attempts
                    SET is_unlocked = 1, unlocked_at = %s, full_result_data = %s
                    WHERE id = %s
                """, (now_str, json.dumps(full_data), attempt['id']))

                normalized_report = AssessmentService._normalize_report_careers(full_data)
                return {
                    'status': 'success',
                    'message': 'Career Roadmap unlocked successfully!',
                    'attempt_id': attempt['id'],
                    'credits_remaining': new_balance,
                    'full_report': normalized_report
                }
        finally:
            conn.close()

    @staticmethod
    def get_user_attempts(user_id: str) -> List[Dict[str, Any]]:
        """Fetch all assessment attempts for a user in reverse chronological order with legacy bridge support."""
        clean_user_id = str(user_id or '').strip()
        if not clean_user_id:
            return []

        conn = get_db_connection()
        try:
            cursor = conn.cursor()

            # Query all attempts for user
            cursor.execute("""
                SELECT id, user_id, is_unlocked, created_at, unlocked_at, teaser_data, full_result_data,
                       guest_session_id, student_profile, riasec_answers, riasec_scores, riasec_code, completed_at
                FROM assessment_attempts
                WHERE LOWER(TRIM(user_id)) = LOWER(TRIM(%s))
                ORDER BY created_at DESC
            """, (clean_user_id,))
            rows = cursor.fetchall()

            # Server-side grouping/deduplication for accidental duplicate attempts
            deduped_rows = []
            seen_ids = set()
            seen_clusters = []
            for r in rows:
                if r['id'] in seen_ids:
                    continue
                seen_ids.add(r['id'])

                r_ans = r['riasec_answers']
                ans_list = []
                if r_ans:
                    try:
                        ans_list = json.loads(r_ans) if isinstance(r_ans, str) else r_ans
                    except Exception:
                        ans_list = []

                matched_cluster = None
                # 1. Match by submission_token if present in teaser_data
                r_teaser = json.loads(r['teaser_data']) if isinstance(r['teaser_data'], str) else (r['teaser_data'] or {})
                r_tok = r_teaser.get('submission_token')
                if r_tok:
                    for cl in seen_clusters:
                        cl_teaser = json.loads(cl.get('teaser_data') or '{}') if isinstance(cl.get('teaser_data'), str) else (cl.get('teaser_data') or {})
                        if cl_teaser.get('submission_token') == r_tok:
                            matched_cluster = cl
                            break

                # 2. Match by answers or scores + same RIASEC code + created within 10 seconds
                if not matched_cluster:
                    r_scores = r.get('riasec_scores')
                    if isinstance(r_scores, str):
                        try:
                            r_scores = json.loads(r_scores)
                        except Exception:
                            r_scores = None

                    for cl in seen_clusters:
                        if cl.get('riasec_code') == r.get('riasec_code'):
                            try:
                                t1_raw = cl['created_at']
                                t2_raw = r['created_at']
                                t1 = t1_raw if isinstance(t1_raw, datetime) else datetime.fromisoformat(str(t1_raw).replace('Z', '+00:00'))
                                t2 = t2_raw if isinstance(t2_raw, datetime) else datetime.fromisoformat(str(t2_raw).replace('Z', '+00:00'))
                                if t1.tzinfo is None and t2.tzinfo is not None:
                                    t1 = t1.replace(tzinfo=t2.tzinfo)
                                elif t2.tzinfo is None and t1.tzinfo is not None:
                                    t2 = t2.replace(tzinfo=t1.tzinfo)

                                if abs((t1 - t2).total_seconds()) <= 10:
                                    cl_ans = cl.get('riasec_answers')
                                    cl_ans_parsed = json.loads(cl_ans) if isinstance(cl_ans, str) else cl_ans
                                    cl_scores = cl.get('riasec_scores')
                                    cl_scores_parsed = json.loads(cl_scores) if isinstance(cl_scores, str) else cl_scores

                                    if (cl_ans_parsed and ans_list and cl_ans_parsed == ans_list) or \
                                       (cl_scores_parsed and r_scores and cl_scores_parsed == r_scores) or \
                                       (abs((t1 - t2).total_seconds()) <= 2):
                                        matched_cluster = cl
                                        break
                            except Exception:
                                pass

                if matched_cluster:
                    # Merge unlock status into cluster so unlocked status is never lost
                    if r['is_unlocked']:
                        matched_cluster['is_unlocked'] = 1
                        matched_cluster['unlocked_at'] = r['unlocked_at'] or matched_cluster['unlocked_at']
                        if r['full_result_data']:
                            matched_cluster['full_result_data'] = r['full_result_data']
                else:
                    item_dict = dict(r)
                    seen_clusters.append(item_dict)
                    deduped_rows.append(item_dict)

            results = []
            for r in deduped_rows:
                t_data = json.loads(r['teaser_data']) if isinstance(r['teaser_data'], str) else (r['teaser_data'] or {})
                career_title = t_data.get('primary_career_title') if isinstance(t_data, dict) else None
                match_score = t_data.get('primary_match_score') if isinstance(t_data, dict) else None
                riasec = (t_data.get('riasec_code') if isinstance(t_data, dict) else None) or r['riasec_code']

                if not career_title and r['full_result_data']:
                    try:
                        f_data = r['full_result_data'] if isinstance(r['full_result_data'], dict) else json.loads(r['full_result_data'])
                        top = f_data.get('top_careers') or []
                        if top:
                            career_title = top[0].get('name') or top[0].get('career_name')
                            match_score = top[0].get('score') or top[0].get('fit_score')
                        if not riasec:
                            riasec = f_data.get('riasec_code')
                    except Exception:
                        pass

                is_unlocked = bool(r['is_unlocked'])
                results.append({
                    'id': r['id'],
                    'is_unlocked': is_unlocked,
                    'created_at': r['created_at'].isoformat() if hasattr(r['created_at'], 'isoformat') else str(r['created_at'] or ''),
                    'completed_at': r['completed_at'].isoformat() if hasattr(r['completed_at'], 'isoformat') else str(r['completed_at'] or r['created_at'] or ''),
                    'unlocked_at': r['unlocked_at'].isoformat() if hasattr(r['unlocked_at'], 'isoformat') else (str(r['unlocked_at']) if r['unlocked_at'] else None),
                    'primary_career_title': career_title or 'Career Roadmap Match',
                    # Server-side paywall: protect numerical match score on locked assessments
                    'primary_match_score': (match_score or 85.0) if is_unlocked else None,
                    'riasec_code': riasec or 'RIA'
                })
            return results
        finally:
            conn.close()


assessment_service = AssessmentService()
