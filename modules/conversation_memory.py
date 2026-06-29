# modules/conversation_memory.py - Enhanced Conversation Memory with SQLite and Space Optimization
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json
import hashlib
import sqlite3
import os
from core.models import Conversation, Message
from core.config import config


class ConversationMemory:
    """
    Manages conversation memory with SQLite database storage.
    Provides context-aware history for natural conversations without memory bloat.
    """
    
    def __init__(self):
        self._max_history = config.max_chat_history
        self._db_path = config.db_path
        self._init_db()
        self.cleanup_old_sessions()
        
    def _init_db(self):
        """Initialize the SQLite database structure with full auto_vacuum enabled."""
        db_dir = os.path.dirname(self._db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
        # Enable auto_vacuum before tables are created so SQLite automatically reclaims deleted space
        with sqlite3.connect(self._db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("PRAGMA auto_vacuum = FULL;")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    session_id TEXT PRIMARY KEY,
                    context TEXT,
                    last_intent TEXT,
                    persona TEXT,
                    career_matches TEXT,
                    updated_at TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT,
                    role TEXT,
                    content TEXT,
                    timestamp TEXT,
                    intent TEXT
                )
            """)
            conn.commit()

    def get_session(self, session_id: str) -> Conversation:
        """Get or create a conversation session from SQLite."""
        with sqlite3.connect(self._db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT context, last_intent, persona, career_matches FROM sessions WHERE session_id = ?",
                (session_id,)
            )
            row = cursor.fetchone()
            
            if row:
                context_json, last_intent, persona_json, career_matches_json = row
                context = json.loads(context_json) if context_json else {}
                persona = json.loads(persona_json) if persona_json else None
                career_matches = json.loads(career_matches_json) if career_matches_json else []
                
                # Fetch messages
                cursor.execute(
                    "SELECT role, content, timestamp, intent FROM messages WHERE session_id = ? ORDER BY id ASC",
                    (session_id,)
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
                    session_id=session_id,
                    messages=messages,
                    context=context,
                    last_intent=last_intent,
                    persona=persona,
                    career_matches=career_matches
                )
            else:
                # Create a new session
                now_str = datetime.now().isoformat()
                cursor.execute(
                    "INSERT INTO sessions (session_id, context, last_intent, persona, career_matches, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                    (session_id, json.dumps({}), None, None, json.dumps([]), now_str)
                )
                conn.commit()
                return Conversation(session_id=session_id)
    
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
            with sqlite3.connect(self._db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT id FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT ?",
                    (session_id, self._max_history)
                )
                ids_to_keep = [r[0] for r in cursor.fetchall()]
                if ids_to_keep:
                    placeholders = ",".join("?" for _ in ids_to_keep)
                    cursor.execute(
                        f"DELETE FROM messages WHERE session_id = ? AND id NOT IN ({placeholders})",
                        (session_id, *ids_to_keep)
                    )
                    conn.commit()
                    
        # Persist new message to SQLite
        with sqlite3.connect(self._db_path) as conn:
            cursor = conn.cursor()
            now_str = datetime.now().isoformat()
            cursor.execute(
                "INSERT INTO messages (session_id, role, content, timestamp, intent) VALUES (?, ?, ?, ?, ?)",
                (session_id, role, content, msg.timestamp.isoformat(), intent)
            )
            cursor.execute(
                "UPDATE sessions SET last_intent = ?, updated_at = ? WHERE session_id = ?",
                (intent or conv.last_intent, now_str, session_id)
            )
            conn.commit()
            
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
        with sqlite3.connect(self._db_path) as conn:
            cursor = conn.cursor()
            now_str = datetime.now().isoformat()
            cursor.execute(
                "UPDATE sessions SET context = ?, updated_at = ? WHERE session_id = ?",
                (json.dumps(conv.context), now_str, session_id)
            )
            conn.commit()
    
    def set_persona(self, session_id: str, persona: Dict):
        """Set the student persona for a session."""
        with sqlite3.connect(self._db_path) as conn:
            cursor = conn.cursor()
            now_str = datetime.now().isoformat()
            cursor.execute(
                "UPDATE sessions SET persona = ?, updated_at = ? WHERE session_id = ?",
                (json.dumps(persona) if persona else None, now_str, session_id)
            )
            conn.commit()
    
    def get_persona(self, session_id: str) -> Optional[Dict]:
        """Get the student persona for a session."""
        conv = self.get_session(session_id)
        return conv.persona
    
    def set_career_matches(self, session_id: str, matches: List[Dict]):
        """Set career matches for a session."""
        with sqlite3.connect(self._db_path) as conn:
            cursor = conn.cursor()
            now_str = datetime.now().isoformat()
            cursor.execute(
                "UPDATE sessions SET career_matches = ?, updated_at = ? WHERE session_id = ?",
                (json.dumps(matches) if matches else json.dumps([]), now_str, session_id)
            )
            conn.commit()
    
    def get_career_matches(self, session_id: str) -> List[Dict]:
        """Get career matches for a session."""
        conv = self.get_session(session_id)
        return conv.career_matches
    
    def get_last_intent(self, session_id: str) -> Optional[str]:
        """Get the last intent from a session."""
        conv = self.get_session(session_id)
        return conv.last_intent
    
    def is_career_related_conversation(self, session_id: str) -> bool:
        """Check if the conversation is career-related."""
        conv = self.get_session(session_id)
        if not conv.messages:
            return False
        
        # Check recent messages
        recent = conv.get_recent_messages(5)
        career_keywords = ['career', 'job', 'profession', 'occupation', 'work']
        for msg in recent:
            if msg.role == 'user':
                if any(kw in msg.content.lower() for kw in career_keywords):
                    return True
        
        return False
    
    def clear_session(self, session_id: str):
        """Clear a conversation session and aggressively release OS disk space."""
        with sqlite3.connect(self._db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
            cursor.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))
            conn.commit()
            
            # Explicitly run VACUUM to reclaim disk space immediately
            try:
                conn.execute("VACUUM")
            except Exception as e:
                print(f"[WARNING] Database VACUUM skipped: {e}")
    
    def generate_session_id(self, user_id: str = None) -> str:
        """Generate a unique session ID."""
        timestamp = datetime.now().isoformat()
        if user_id:
            base = f"{user_id}:{timestamp}"
        else:
            base = timestamp
        return hashlib.sha256(base.encode()).hexdigest()[:16]
    
    def get_conversation_summary(self, session_id: str) -> str:
        """Get a summary of the conversation."""
        conv = self.get_session(session_id)
        if not conv.messages:
            return "No conversation yet."
        
        # Get user messages
        user_messages = [m for m in conv.messages if m.role == 'user']
        if not user_messages:
            return "User hasn't asked any questions yet."
        
        # Extract key topics
        topics = []
        for msg in user_messages[-5:]:
            content = msg.content[:50]
            topics.append(f"User asked: {content}")
        
        return "\n".join(topics)

    def cleanup_old_sessions(self):
        """Delete sessions that are older than the configured db_retention_hours and vacuum database."""
        try:
            retention_hours = getattr(config, 'db_retention_hours', 24)
            cutoff_time = datetime.now() - timedelta(hours=retention_hours)
            cutoff_str = cutoff_time.isoformat()
            
            with sqlite3.connect(self._db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT session_id FROM sessions WHERE updated_at < ?", (cutoff_str,))
                session_ids = [row[0] for row in cursor.fetchall()]
                
                if session_ids:
                    print(f"[INFO] Database cleanup: Wiping {len(session_ids)} expired sessions older than {retention_hours} hours...")
                    placeholders = ",".join("?" for _ in session_ids)
                    cursor.execute(f"DELETE FROM messages WHERE session_id IN ({placeholders})", session_ids)
                    cursor.execute(f"DELETE FROM sessions WHERE session_id IN ({placeholders})", session_ids)
                    conn.commit()
                    
                    # Run VACUUM to physically shrink database size on VPS disk
                    try:
                        conn.execute("VACUUM")
                    except Exception as vacuum_err:
                        print(f"[WARNING] Database VACUUM during cleanup skipped: {vacuum_err}")
        except Exception as e:
            print(f"[WARNING] Error cleaning up database: {e}")


# Singleton instance
conversation_memory = ConversationMemory()