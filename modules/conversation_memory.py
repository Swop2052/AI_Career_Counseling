# modules/conversation_memory.py - Pure SQLite Simplified Database Storage
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json
import os
import uuid
import sqlite3

from core.models import Conversation, Message
from core.config import config


class ConversationMemory:
    """
    Manages student test attempts, question logs, and chat histories using SQLite.
    """
    
    def __init__(self):
        self._max_history = config.max_chat_history
        self._init_db()
        self.cleanup_old_sessions()
        
    def _get_connection(self):
        """Get a connection to the SQLite database with high concurrency WAL mode."""
        db_dir = os.path.dirname(config.db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)
        conn = sqlite3.connect(config.db_path, timeout=30.0)
        try:
            conn.execute("PRAGMA journal_mode=WAL;")
            conn.execute("PRAGMA synchronous=NORMAL;")
        except Exception:
            pass
        return conn
        
    def _init_db(self):
        """Initialize SQLite simplified database schema."""
        conn = None
        cursor = None
        try:
            conn = self._get_connection()
            with conn:
                cursor = conn.cursor()
                # 1. Clean migration: Drop old relational tables if they exist to keep the database tidy
                old_tables = [
                    "profile_career_aspirations", "profile_strengths", "profile_hobbies",
                    "profile_interests", "profile_challenging_subjects", "profile_favorite_subjects",
                    "student_profiles", "career_sessions", "users",
                    "budget_master", "career_master", "class_master", "college_type_master",
                    "education_stream_master", "hobby_master", "interest_master", "learning_mode_master",
                    "location_preference_master", "strength_master", "subject_master", "messages"
                ]
                for table in old_tables:
                    cursor.execute(f"DROP TABLE IF EXISTS {table};")
                
                # 2. Create the unified Tests Attempts table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS tests (
                        test_id TEXT PRIMARY KEY,
                        fullname TEXT,
                        email TEXT,
                        phone TEXT,
                        student_profile TEXT,
                        riasec_answers TEXT,
                        riasec_scores TEXT,
                        riasec_code TEXT,
                        persona TEXT,
                        career_matches TEXT,
                        overall_session TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # 3. Create messages chat log table linked directly to tests
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS messages (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        test_id TEXT NOT NULL,
                        role TEXT,
                        content TEXT,
                        timestamp TEXT,
                        intent TEXT,
                        FOREIGN KEY(test_id) REFERENCES tests(test_id) ON DELETE CASCADE
                    )
                """)
                
                # 4. Create semantic careers registry table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS careers (
                        career_name TEXT PRIMARY KEY,
                        riasec_tags TEXT,
                        description TEXT,
                        career_data TEXT
                    )
                """)
                
                # 5. Create student feedback table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS student_feedback (
                        feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        student_id TEXT NOT NULL,
                        assessment_id TEXT NOT NULL,
                        career_id TEXT,
                        liked_result INTEGER,
                        feedback_category TEXT,
                        comment TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY(student_id) REFERENCES tests(test_id) ON DELETE CASCADE
                    )
                """)
                
                # 6. Create contact messages table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS contact_messages (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        fullname TEXT NOT NULL,
                        email TEXT NOT NULL,
                        company TEXT,
                        subject TEXT NOT NULL,
                        message TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
            print("[SUCCESS] SQLite simplified database successfully initialized.")
        except Exception as e:
            print(f"[ERROR] Failed to initialize SQLite database: {e}")
            raise e
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def get_session(self, test_id: str) -> Conversation:
        """Get or create a test session attempt from SQLite."""
        conn = self._get_connection()
        cursor = None
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT student_profile, riasec_answers, riasec_scores, persona, career_matches, overall_session FROM tests WHERE test_id = ?",
                    (test_id,)
                )
                row = cursor.fetchone()
                
                if row:
                    profile_json, riasec_answers_json, riasec_scores_json, persona_json, career_matches_json, overall_session_json = row
                    
                    context = {}
                    persona = json.loads(persona_json) if isinstance(persona_json, str) else (persona_json or None)
                    career_matches = json.loads(career_matches_json) if isinstance(career_matches_json, str) else (career_matches_json or [])
                    riasec_answers = json.loads(riasec_answers_json) if isinstance(riasec_answers_json, str) else (riasec_answers_json or [])
                    riasec_scores = json.loads(riasec_scores_json) if isinstance(riasec_scores_json, str) else (riasec_scores_json or {})
                    overall_session = json.loads(overall_session_json) if isinstance(overall_session_json, str) else (overall_session_json or None)
                    
                    # Load context from overall snapshot if present
                    if overall_session and 'context' in overall_session:
                        context = overall_session['context']
                    
                    # Fetch messages
                    cursor.execute(
                        "SELECT role, content, timestamp, intent FROM messages WHERE test_id = ? ORDER BY id ASC",
                        (test_id,)
                    )
                    msg_rows = cursor.fetchall()
                    messages = []
                    for role, content, timestamp_str, intent in msg_rows:
                        try:
                            timestamp = datetime.fromisoformat(timestamp_str)
                        except Exception:
                            timestamp = datetime.now()
                        messages.append(Message(role=role, content=content, timestamp=timestamp, intent=intent))
                    
                    return Conversation(
                        session_id=test_id,
                        messages=messages,
                        context=context,
                        last_intent=None,
                        persona=persona,
                        career_matches=career_matches,
                        riasec_answers=riasec_answers,
                        riasec_scores=riasec_scores,
                        overall_session=overall_session
                    )
                else:
                    # Create a new test session record
                    cursor.execute(
                        "INSERT INTO tests (test_id, fullname) VALUES (?, ?)",
                        (test_id, "Guest Student")
                    )
                    return Conversation(session_id=test_id)
        finally:
            if cursor:
                cursor.close()
            conn.close()
    
    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        intent: Optional[str] = None
    ) -> Message:
        """Add a message to the conversation and persist to SQLite."""
        conv = self.get_session(session_id)
        msg = conv.add_message(role, content, intent)
        
        # Trim history in database if too long
        if len(conv.messages) > self._max_history * 2:
            conv.messages = conv.messages[-self._max_history:]
            conn = self._get_connection()
            cursor = None
            try:
                with conn:
                    cursor = conn.cursor()
                    cursor.execute(
                        "SELECT id FROM messages WHERE test_id = ? ORDER BY id DESC LIMIT ?",
                        (session_id, self._max_history)
                    )
                    ids_to_keep = [r[0] for r in cursor.fetchall()]
                    if ids_to_keep:
                        pl = ",".join("?" for _ in ids_to_keep)
                        params = [session_id] + ids_to_keep
                        cursor.execute(
                            f"DELETE FROM messages WHERE test_id = ? AND id NOT IN ({pl})",
                            params
                        )
            except Exception as e:
                print(f"[WARNING] Failed to trim message history: {e}")
            finally:
                if cursor:
                    cursor.close()
                if conn:
                    conn.close()
                    
        # Persist new message
        conn = self._get_connection()
        cursor = None
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO messages (test_id, role, content, timestamp, intent) VALUES (?, ?, ?, ?, ?)",
                    (session_id, role, content, msg.timestamp.isoformat(), intent)
                )
                cursor.execute(
                    "UPDATE tests SET updated_at = CURRENT_TIMESTAMP WHERE test_id = ?",
                    (session_id,)
                )
        finally:
            if cursor:
                cursor.close()
            conn.close()
            
        return msg
    
    def get_history(self, session_id: str, limit: int = 10) -> List[Message]:
        """Get recent conversation history."""
        conv = self.get_session(session_id)
        return conv.get_recent_messages(limit)
    
    def get_history_for_prompt(self, session_id: str, limit: int = 8) -> str:
        """Get formatted history for prompt."""
        conv = self.get_session(session_id)
        return conv.get_history_for_prompt(limit)
    
    def get_context(self, session_id: str) -> Dict:
        """Get conversation context."""
        conv = self.get_session(session_id)
        return conv.context
    
    def update_context(self, session_id: str, key: str, value: Any):
        """Update conversation context."""
        conv = self.get_session(session_id)
        conv.context[key] = value
        
        # Save context directly inside the overall_session snapshot structure
        conn = self._get_connection()
        cursor = None
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute("SELECT overall_session FROM tests WHERE test_id = ?", (session_id,))
                row = cursor.fetchone()
                overall = {}
                if row and row[0]:
                    overall = json.loads(row[0]) if isinstance(row[0], str) else row[0]
                if not isinstance(overall, dict):
                    overall = {}
                if 'context' not in overall:
                    overall['context'] = {}
                overall['context'][key] = value
                
                cursor.execute(
                    "UPDATE tests SET overall_session = ?, updated_at = CURRENT_TIMESTAMP WHERE test_id = ?",
                    (json.dumps(overall), session_id)
                )
        finally:
            if cursor:
                cursor.close()
            conn.close()
    
    def set_persona(self, session_id: str, persona: Dict):
        """Set the student persona for a session."""
        self.get_session(session_id)
        conn = self._get_connection()
        cursor = None
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute(
                    "UPDATE tests SET persona = ?, updated_at = CURRENT_TIMESTAMP WHERE test_id = ?",
                    (json.dumps(persona) if persona else None, session_id)
                )
        finally:
            if cursor:
                cursor.close()
            conn.close()
    
    def get_persona(self, session_id: str) -> Optional[Dict]:
        """Get the student persona for a session."""
        conv = self.get_session(session_id)
        return conv.persona
    
    def set_career_matches(self, session_id: str, matches: List[Dict]):
        """Set career matches for a session."""
        self.get_session(session_id)
        conn = self._get_connection()
        cursor = None
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute(
                    "UPDATE tests SET career_matches = ?, updated_at = CURRENT_TIMESTAMP WHERE test_id = ?",
                    (json.dumps(matches) if matches else json.dumps([]), session_id)
                )
        finally:
            if cursor:
                cursor.close()
            conn.close()
    
    def get_career_matches(self, session_id: str) -> List[Dict]:
        """Get career matches for a session."""
        conv = self.get_session(session_id)
        return conv.career_matches
        
    def set_riasec_data(self, session_id: str, answers: List[Dict], scores: Dict):
        """Store the raw RIASEC test answers and final scores in the database."""
        self.get_session(session_id)
        conn = self._get_connection()
        cursor = None
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute(
                    "UPDATE tests SET riasec_answers = ?, riasec_scores = ?, updated_at = CURRENT_TIMESTAMP WHERE test_id = ?",
                    (json.dumps(answers), json.dumps(scores), session_id)
                )
        finally:
            if cursor:
                cursor.close()
            conn.close()

    def get_riasec_answers(self, session_id: str) -> List[Dict]:
        """Get raw RIASEC test answers for a session."""
        conv = self.get_session(session_id)
        return conv.riasec_answers

    def get_riasec_scores(self, session_id: str) -> Dict:
        """Get RIASEC test category scores for a session."""
        conv = self.get_session(session_id)
        return conv.riasec_scores
    
    def get_last_intent(self, session_id: str) -> Optional[str]:
        """Get the last intent from a session."""
        conv = self.get_session(session_id)
        return conv.last_intent
    
    def is_career_related_conversation(self, session_id: str) -> bool:
        """Check if the conversation is career-related."""
        conv = self.get_session(session_id)
        if not conv.messages:
            return False
        
        recent = conv.get_recent_messages(5)
        career_keywords = ['career', 'job', 'profession', 'occupation', 'work']
        for msg in recent:
            if msg.role == 'user':
                if any(kw in msg.content.lower() for kw in career_keywords):
                    return True
        return False
    
    def clear_session(self, session_id: str):
        """Clear a conversation session from SQLite database."""
        conn = self._get_connection()
        cursor = None
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM messages WHERE test_id = ?", (session_id,))
                cursor.execute("DELETE FROM tests WHERE test_id = ?", (session_id,))
        finally:
            if cursor:
                cursor.close()
            conn.close()
    
    def generate_session_id(self, user_id: str = None) -> str:
        """Generate a unique session UUID."""
        return str(uuid.uuid4())
    
    def get_conversation_summary(self, session_id: str) -> str:
        """Get a summary of the conversation."""
        conv = self.get_session(session_id)
        if not conv.messages:
            return "No conversation yet."
        
        user_messages = [m for m in conv.messages if m.role == 'user']
        if not user_messages:
            return "User hasn't asked any questions yet."
        
        topics = []
        for msg in user_messages[-5:]:
            content = msg.content[:50]
            topics.append(f"User asked: {content}")
        return "\n".join(topics)

    def cleanup_old_sessions(self):
        """Preserve all historical student session data in SQLite permanently (No-op)."""
        pass

    def upsert_careers(self, careers_list: List[Dict[str, Any]]):
        """Seed or update the careers database inside SQLite."""
        conn = self._get_connection()
        cursor = None
        try:
            with conn:
                cursor = conn.cursor()
                for career in careers_list:
                    name = career.get("career_name", "")
                    if not name:
                        continue
                    riasec_tags = career.get("riasec_tags", [])
                    desc = career.get("description", "")
                    
                    cursor.execute("""
                        INSERT OR REPLACE INTO careers (career_name, riasec_tags, description, career_data)
                        VALUES (?, ?, ?, ?)
                    """, (name, json.dumps(riasec_tags), desc, json.dumps(career)))
            print(f"[SUCCESS] Seeded/Updated {len(careers_list)} careers in SQLite.")
        except Exception as e:
            print(f"[ERROR] Failed to seed careers in SQLite: {e}")
        finally:
            if cursor:
                cursor.close()
            conn.close()

    def get_all_careers(self) -> List[Dict[str, Any]]:
        """Retrieve all career records from SQLite database."""
        conn = self._get_connection()
        cursor = None
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute("SELECT career_data FROM careers ORDER BY career_name ASC")
                rows = cursor.fetchall()
                careers = []
                for row in rows:
                    data_json = row[0]
                    data = json.loads(data_json) if isinstance(data_json, str) else (data_json or {})
                    if data:
                        careers.append(data)
                return careers
        except Exception as e:
            print(f"[WARNING] Failed to load careers from SQLite: {e}")
            return []
        finally:
            if cursor:
                cursor.close()
            conn.close()

    def get_career_detail(self, career_name: str) -> Optional[Dict[str, Any]]:
        """Retrieve a single career details record by its primary key name from SQLite."""
        conn = self._get_connection()
        cursor = None
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute("SELECT career_data FROM careers WHERE career_name = ?", (career_name,))
                row = cursor.fetchone()
                if row:
                    data_json = row[0]
                    return json.loads(data_json) if isinstance(data_json, str) else (data_json or {})
                return None
        except Exception as e:
            print(f"[WARNING] Failed to fetch career detail '{career_name}' from SQLite: {e}")
            return None
        finally:
            if cursor:
                cursor.close()
            conn.close()

    def save_relational_profile(self, session_id: str, student_info: Dict):
        """Save the student profile info directly to the student_profile JSON column."""
        self.get_session(session_id)  # Self-healing: ensure user and session exist first before profile insertion
        conn = self._get_connection()
        cursor = None
        try:
            with conn:
                cursor = conn.cursor()
                name = student_info.get("name") or student_info.get("fullname") or "Student"
                email = student_info.get("email")
                phone = student_info.get("phone")
                
                # Sanitize fields
                name = str(name).strip()
                if email:
                    email = str(email).strip() or None
                if phone:
                    phone = str(phone).strip() or None
                    
                cursor.execute("""
                    UPDATE tests SET 
                        fullname = ?, 
                        email = ?, 
                        phone = ?, 
                        student_profile = ?, 
                        updated_at = CURRENT_TIMESTAMP 
                    WHERE test_id = ?
                """, (name, email, phone, json.dumps(student_info), session_id))
            print(f"[SUCCESS] Raw profile details saved successfully for session {session_id}.")
        except Exception as e:
            print(f"[ERROR] Failed to save student profile: {e}")
            import traceback
            traceback.print_exc()
            raise e
        finally:
            if cursor:
                cursor.close()
            conn.close()

    def set_overall_session(self, session_id: str, overall_data: Dict):
        """Store the complete snapshot of the assessment session in a single JSON column."""
        self.get_session(session_id)
        conn = self._get_connection()
        cursor = None
        try:
            with conn:
                cursor = conn.cursor()
                riasec_code = overall_data.get("riasec_code", "")
                cursor.execute(
                    "UPDATE tests SET overall_session = ?, riasec_code = ?, updated_at = CURRENT_TIMESTAMP WHERE test_id = ?",
                    (json.dumps(overall_data), riasec_code, session_id)
                )
            print(f"[SUCCESS] Overall session JSON snapshot saved for session {session_id}.")
        except Exception as e:
            print(f"[ERROR] Failed to save overall session snapshot: {e}")
        finally:
            if cursor:
                cursor.close()
            conn.close()

    def add_contact_message(self, fullname: str, email: str, company: Optional[str], subject: str, message: str):
        """Save contact form message to database."""
        conn = self._get_connection()
        cursor = None
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO contact_messages (fullname, email, company, subject, message)
                    VALUES (?, ?, ?, ?, ?)
                """, (fullname, email, company, subject, message))
            print(f"[SUCCESS] Contact form message saved for {fullname}.")
        except Exception as e:
            print(f"[ERROR] Failed to save contact message: {e}")
            raise e
        finally:
            if cursor:
                cursor.close()
            conn.close()

    def add_feedback(self, student_id: str, assessment_id: str, career_id: str, liked_result: int, feedback_category: str, comment: str):
        """Save student guide download feedback to student_feedback table."""
        self.get_session(student_id)  # Self-healing: guarantee student record exists in tests table
        conn = self._get_connection()
        cursor = None
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO student_feedback (student_id, assessment_id, career_id, liked_result, feedback_category, comment)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (student_id, assessment_id, career_id, liked_result, feedback_category, comment))
            print(f"[SUCCESS] Student feedback saved for session {student_id} and career {career_id}.")
        except Exception as e:
            print(f"[ERROR] Failed to save student feedback: {e}")
            raise e
        finally:
            if cursor:
                cursor.close()
            conn.close()


# Singleton instance
conversation_memory = ConversationMemory()