# modules/conversation_memory.py - Enhanced Conversation Memory
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json
import hashlib
from core.models import Conversation, Message
from core.config import config


class ConversationMemory:
    """
    Manages conversation memory with session management.
    Provides context-aware history for natural conversations.
    """
    
    def __init__(self):
        self._sessions: Dict[str, Conversation] = {}
        self._max_history = config.max_chat_history
        
    def get_session(self, session_id: str) -> Conversation:
        """Get or create a conversation session."""
        if session_id not in self._sessions:
            self._sessions[session_id] = Conversation(session_id=session_id)
        return self._sessions[session_id]
    
    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        intent: Optional[str] = None
    ) -> Message:
        """Add a message to the conversation."""
        conv = self.get_session(session_id)
        msg = conv.add_message(role, content, intent)
        
        # Trim history if too long
        if len(conv.messages) > self._max_history * 2:
            conv.messages = conv.messages[-self._max_history:]
        
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
    
    def set_persona(self, session_id: str, persona: Dict):
        """Set the student persona for a session."""
        conv = self.get_session(session_id)
        conv.persona = persona
    
    def get_persona(self, session_id: str) -> Optional[Dict]:
        """Get the student persona for a session."""
        conv = self.get_session(session_id)
        return conv.persona
    
    def set_career_matches(self, session_id: str, matches: List[Dict]):
        """Set career matches for a session."""
        conv = self.get_session(session_id)
        conv.career_matches = matches
    
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
        """Clear a conversation session."""
        if session_id in self._sessions:
            del self._sessions[session_id]
    
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


# Singleton instance
conversation_memory = ConversationMemory()