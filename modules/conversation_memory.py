# modules/conversation_memory.py - PostgreSQL Database Storage
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json
import os
import uuid
import psycopg2
import psycopg2.extras
from psycopg2.extras import Json, DictCursor

from core.models import Conversation, Message
from core.config import config


class ConversationMemory:
    """
    Manages student test attempts, question logs, and chat histories using PostgreSQL.
    """
    
    def __init__(self):
        self._max_history = config.max_chat_history
        self._init_db()
        self.cleanup_old_sessions()
        
    def _get_connection(self):
        """Get a connection to the PostgreSQL database."""
        try:
            conn = psycopg2.connect(config.database_url)
            psycopg2.extras.register_default_jsonb(conn)
            psycopg2.extras.register_default_json(conn)
            return conn
        except Exception as e:
            print(f"[ERROR] Database connection failed: {e}")
            raise e
        
    def _init_db(self):
        """Initialize PostgreSQL database schema."""
        schema_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "schema.sql")
        if not os.path.exists(schema_path):
            print("[WARNING] database/schema.sql not found. Skipping initialization.")
            return

        with open(schema_path, "r", encoding="utf-8") as f:
            schema_sql = f.read()

        conn = None
        cursor = None
        try:
            conn = self._get_connection()
            with conn:
                with conn.cursor() as cursor:
                    cursor.execute(schema_sql)
            print("[SUCCESS] PostgreSQL database successfully initialized.")
        except Exception as e:
            print(f"[ERROR] Failed to initialize PostgreSQL database: {e}")
            # Don't raise, might just be a connection failure in dev
        finally:
            if conn:
                conn.close()

    def generate_session_id(self) -> str:
        """Generate a new unique session/test ID."""
        return uuid.uuid4().hex

    def get_session(self, test_id: str) -> Conversation:
        """Get or create a test session attempt from PostgreSQL."""
        conn = None
        try:
            conn = self._get_connection()
            with conn:
                with conn.cursor(cursor_factory=DictCursor) as cursor:
                    cursor.execute("""
                        SELECT a.student_profile, a.persona, r.answers, r.scores
                        FROM assessments a
                        LEFT JOIN assessment_riasec r ON a.assessment_id = r.assessment_id
                        WHERE a.assessment_id = %s
                    """, (test_id,))
                    row = cursor.fetchone()
                    
                    context = {}
                    persona = None
                    riasec_answers = []
                    riasec_scores = {}
                    career_matches = []
                    
                    if row:
                        persona = row['persona']
                        riasec_answers = row['answers'] if row['answers'] else []
                        riasec_scores = row['scores'] if row['scores'] else {}
                        
                        # Fetch career matches
                        cursor.execute("""
                            SELECT m.rank, m.match_score, m.match_details, c.career_name, c.career_data
                            FROM assessment_career_matches m
                            JOIN careers c ON m.career_id = c.career_id
                            WHERE m.assessment_id = %s
                            ORDER BY m.rank ASC
                        """, (test_id,))
                        match_rows = cursor.fetchall()
                        for m_row in match_rows:
                            career_matches.append(m_row['match_details'])
                            
                    # Fetch chat history
                    conv = Conversation(
                        session_id=test_id,
                        context=context,
                        persona=persona,
                        career_matches=career_matches,
                        riasec_answers=riasec_answers,
                        riasec_scores=riasec_scores
                    )
                    
                    cursor.execute(
                        "SELECT role, content, created_at, intent FROM messages WHERE assessment_id = %s ORDER BY created_at ASC",
                        (test_id,)
                    )
                    for m_row in cursor.fetchall():
                        msg = Message(
                            role=m_row['role'],
                            content=m_row['content'],
                            timestamp=m_row['created_at'],
                            intent=m_row['intent']
                        )
                        conv.messages.append(msg)
                        if msg.intent:
                            conv.last_intent = msg.intent
                            
                    return conv
        except Exception as e:
            print(f"[ERROR] Could not load session {test_id}: {e}")
            return Conversation(session_id=test_id)
        finally:
            if conn:
                conn.close()

    def _ensure_assessment_exists(self, cursor, test_id: str, email: Optional[str] = None):
        """Helper to create anonymous user, student, and assessment if they don't exist."""
        cursor.execute("SELECT assessment_id FROM assessments WHERE assessment_id = %s", (test_id,))
        if cursor.fetchone():
            return # Already exists
            
        # Create user
        if email:
            user_email = email
            user_fullname = email.split('@')[0].title()
        else:
            user_email = f"anon_{test_id}@skillsense.local"
            user_fullname = 'Anonymous Student'
            
        cursor.execute(
            "INSERT INTO users (email, password_hash) VALUES (%s, 'anon') ON CONFLICT (email) DO NOTHING RETURNING user_id",
            (user_email,)
        )
        user_row = cursor.fetchone()
        if user_row:
            user_id = user_row[0]
        else:
            cursor.execute("SELECT user_id FROM users WHERE email = %s", (anon_email,))
            user_id = cursor.fetchone()[0]
            
        # Create student
        cursor.execute(
            "INSERT INTO students (user_id, fullname) VALUES (%s, %s) ON CONFLICT (user_id) DO NOTHING RETURNING student_id",
            (user_id, user_fullname)
        )
        student_row = cursor.fetchone()
        if student_row:
            student_id = student_row[0]
        else:
            cursor.execute("SELECT student_id FROM students WHERE user_id = %s", (user_id,))
            student_id = cursor.fetchone()[0]
            
        # Create assessment
        cursor.execute(
            "INSERT INTO assessments (assessment_id, student_id) VALUES (%s, %s)",
            (test_id, student_id)
        )

    def save_session(self, test_id: str, student_profile: Dict = None, riasec_answers: List = None,
                     riasec_scores: Dict = None, persona: Dict = None, career_matches: List = None,
                     overall_session: Dict = None):
        """Save a session attempt to the PostgreSQL database."""
        conn = None
        try:
            conn = self._get_connection()
            with conn:
                with conn.cursor() as cursor:
                    self._ensure_assessment_exists(cursor, test_id)
                    
                    # Update assessments table
                    if student_profile is not None or persona is not None:
                        cursor.execute("""
                            UPDATE assessments 
                            SET student_profile = COALESCE(%s, student_profile),
                                persona = COALESCE(%s, persona),
                                updated_at = CURRENT_TIMESTAMP
                            WHERE assessment_id = %s
                        """, (Json(student_profile) if student_profile else None,
                                Json(persona) if persona else None, test_id))
                                
                    # Update assessment_riasec table
                    if riasec_answers is not None or riasec_scores is not None:
                        cursor.execute("""
                            INSERT INTO assessment_riasec (assessment_id, answers, scores)
                            VALUES (%s, COALESCE(%s, '{}'::jsonb), COALESCE(%s, '{}'::jsonb))
                            ON CONFLICT (assessment_id) DO UPDATE 
                            SET answers = COALESCE(EXCLUDED.answers, assessment_riasec.answers),
                                scores = COALESCE(EXCLUDED.scores, assessment_riasec.scores),
                                calculated_at = CURRENT_TIMESTAMP
                        """, (test_id, 
                                Json(riasec_answers) if riasec_answers else None,
                                Json(riasec_scores) if riasec_scores else None))
                                
                    # Update assessment_career_matches
                    if career_matches is not None:
                        # Clear old matches
                        cursor.execute("DELETE FROM assessment_career_matches WHERE assessment_id = %s", (test_id,))
                        
                        seen_careers = set()
                        rank = 1
                        for match in career_matches:
                            career_name = match.get("career_name", "")
                            if not career_name or career_name in seen_careers:
                                continue
                            seen_careers.add(career_name)
                            
                            career_data = match.get("career_data", {})
                            match_score = match.get("match_score", 0.0)
                            
                            # Upsert career
                            cursor.execute("""
                                INSERT INTO careers (career_name, career_data) 
                                VALUES (%s, %s)
                                ON CONFLICT (career_name) DO UPDATE 
                                SET career_data = EXCLUDED.career_data
                                RETURNING career_id
                            """, (career_name, Json(career_data)))
                            career_id = cursor.fetchone()[0]
                            
                            # Insert match
                            cursor.execute("""
                                INSERT INTO assessment_career_matches (assessment_id, career_id, rank, match_score, match_details)
                                VALUES (%s, %s, %s, %s, %s)
                            """, (test_id, career_id, rank, match_score, Json(match)))
                            rank += 1
                            
        except Exception as e:
            print(f"[ERROR] Failed to save session {test_id}: {e}")
        finally:
            if conn:
                conn.close()

    def save_message(self, test_id: str, role: str, content: str, intent: Optional[str] = None, email: Optional[str] = None):
        """Save a single message to the chat history."""
        conn = None
        try:
            conn = self._get_connection()
            with conn:
                with conn.cursor() as cursor:
                    self._ensure_assessment_exists(cursor, test_id, email)
                    cursor.execute(
                        "INSERT INTO messages (assessment_id, role, content, intent) VALUES (%s, %s, %s, %s)",
                        (test_id, role, content, intent)
                    )
        except Exception as e:
            print(f"[ERROR] Failed to save message for {test_id}: {e}")
        finally:
            if conn:
                conn.close()

    def get_chat_history(self, test_id: str) -> List[Message]:
        """Retrieve chat history for a session."""
        sess = self.get_session(test_id)
        return sess.messages

    def clear_history(self, test_id: str):
        """Clear all chat messages for a session."""
        conn = None
        try:
            conn = self._get_connection()
            with conn:
                with conn.cursor() as cursor:
                    cursor.execute("DELETE FROM messages WHERE assessment_id = %s", (test_id,))
        except Exception as e:
            print(f"[ERROR] Failed to clear history for {test_id}: {e}")
        finally:
            if conn:
                conn.close()

    def save_feedback(self, test_id: str, feedback_data: Dict):
        """Save user feedback."""
        conn = None
        try:
            conn = self._get_connection()
            with conn:
                with conn.cursor() as cursor:
                    self._ensure_assessment_exists(cursor, test_id)
                    
                    liked = feedback_data.get('liked_result')
                    category = feedback_data.get('feedback_category')
                    comment = feedback_data.get('comment')
                    career_id = None # We would need to look up career_id by name if provided
                    
                    cursor.execute("""
                        INSERT INTO student_feedback (assessment_id, career_id, liked_result, feedback_category, comment)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (test_id, career_id, liked, category, comment))
        except Exception as e:
            print(f"[ERROR] Failed to save feedback: {e}")
        finally:
            if conn:
                conn.close()
                
    def save_contact_message(self, name: str, email: str, company: str, subject: str, message: str):
        """Save a contact form message."""
        conn = None
        try:
            conn = self._get_connection()
            with conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO contact_messages (fullname, email, company, subject, message)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (name, email, company, subject, message))
        except Exception as e:
            print(f"[ERROR] Failed to save contact message: {e}")
        finally:
            if conn:
                conn.close()
                
    def cleanup_old_sessions(self):
        """Clean up old uncompleted assessments."""
        conn = None
        try:
            conn = self._get_connection()
            with conn:
                with conn.cursor() as cursor:
                    retention_hours = getattr(config, 'db_retention_hours', 24)
                    cursor.execute(
                        "DELETE FROM assessments WHERE assessment_status = 'draft' AND created_at < NOW() - INTERVAL '%s hours'",
                        (retention_hours,)
                    )
        except Exception as e:
            print(f"[ERROR] Failed to cleanup old sessions: {e}")
        finally:
            if conn:
                conn.close()



    def get_all_careers(self) -> List[Dict]:
        conn = None
        try:
            conn = self._get_connection()
            with conn:
                with conn.cursor(cursor_factory=DictCursor) as cursor:
                    cursor.execute("SELECT career_name, career_data FROM careers")
                    return [{"career_name": r[0], **r[1]} for r in cursor.fetchall()]
        except Exception:
            return []
        finally:
            if conn: conn.close()

    def upsert_careers(self, careers: List[Dict]):
        conn = None
        try:
            conn = self._get_connection()
            with conn:
                with conn.cursor() as cursor:
                    for career in careers:
                        c_name = career.get("career_name")
                        cursor.execute(
                            "INSERT INTO careers (career_name, career_data) VALUES (%s, %s) "
                            "ON CONFLICT (career_name) DO UPDATE SET career_data = EXCLUDED.career_data",
                            (c_name, Json(career))
                        )
        except Exception:
            pass
        finally:
            if conn: conn.close()

    def set_persona(self, session_id: str, persona: Dict):
        self.save_session(session_id, persona=persona)
        
    def save_relational_profile(self, session_id: str, student_info: Dict):
        self.save_session(session_id, student_profile=student_info)
        
    def set_riasec_data(self, session_id: str, answers: List, scores: Dict):
        self.save_session(session_id, riasec_answers=answers, riasec_scores=scores)
        
    def set_career_matches(self, session_id: str, matches: List):
        self.save_session(session_id, career_matches=matches)
        
    def set_overall_session(self, session_id: str, overall: Dict):
        self.save_session(session_id, overall_session=overall)
        
    def get_career_detail(self, career_name: str) -> Optional[Dict]:
        conn = None
        try:
            conn = self._get_connection()
            with conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT career_data FROM careers WHERE career_name = %s", (career_name,))
                    row = cursor.fetchone()
                    return row[0] if row else None
        except Exception:
            return None
        finally:
            if conn: conn.close()

    def get_persona(self, session_id: str) -> Dict:
        sess = self.get_session(session_id)
        return sess.persona if sess.persona else {}
        
    def get_career_matches(self, session_id: str) -> List[Dict]:
        sess = self.get_session(session_id)
        return sess.career_matches if sess.career_matches else []
        
    def get_last_intent(self, session_id: str) -> Optional[str]:
        sess = self.get_session(session_id)
        return sess.last_intent
        
    def add_message(self, test_id: str, role: str, content: str, intent: Optional[str] = None, email: Optional[str] = None):
        """Add a message to the conversation history."""
        self.save_message(test_id, role, content, intent, email)
        
    def get_user_message_count(self, test_id: str, email: Optional[str] = None) -> int:
        """Get the total number of user messages to enforce rate limits."""
        conn = None
        try:
            conn = self._get_connection()
            with conn:
                with conn.cursor() as cursor:
                    if email:
                        cursor.execute("""
                            SELECT count(*) FROM messages m 
                            JOIN assessments a ON m.assessment_id = a.assessment_id 
                            JOIN students s ON a.student_id = s.student_id 
                            JOIN users u ON s.user_id = u.user_id 
                            WHERE u.email = %s 
                            AND m.role = 'user'
                            AND m.created_at >= NOW() - INTERVAL '1 hour'
                        """, (email,))
                        return cursor.fetchone()[0]
                    else:
                        cursor.execute("""
                            SELECT count(*) FROM messages 
                            WHERE assessment_id = %s AND role = 'user'
                        """, (test_id,))
                        return cursor.fetchone()[0]
        except Exception as e:
            print(f"[ERROR] Failed to get message count: {e}")
            return 0
        finally:
            if conn:
                conn.close()
        
    def get_history_for_prompt(self, session_id: str, limit: int = 5) -> str:
        msgs = self.get_chat_history(session_id)
        if not msgs:
            return ""
        
        formatted_msgs = []
        for m in msgs[-limit:]:
            role_name = "User" if m.role == "user" else "Assistant"
            formatted_msgs.append(f"{role_name}: {m.content}")
            
        return "\n".join(formatted_msgs)
        
    def add_contact_message(self, name: str, email: str, company: str, subject: str, message: str):
        self.save_contact_message(name, email, company, subject, message)
        
    def add_feedback(self, session_id: str, feedback_data: Dict):
        self.save_feedback(session_id, feedback_data)
# Singleton instance
conversation_memory = ConversationMemory()
