# core/models.py - Enhanced data models
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum


class Intent(str, Enum):
    """User intent types."""
    GREETING = "greeting"
    GENERAL_CHAT = "general_chat"
    CAREER_RECOMMENDATION = "career_recommendation"
    CAREER_COMPARISON = "career_comparison"
    JOB_INFORMATION = "job_information"
    SKILL_GUIDANCE = "skill_guidance"
    COLLEGE_GUIDANCE = "college_guidance"
    SALARY_QUERY = "salary_query"
    STUDY_GUIDANCE = "study_guidance"
    PROFILE_QUESTION = "profile_question"
    FOLLOW_UP = "follow_up"
    OFF_TOPIC = "off_topic"


@dataclass
class Message:
    """Chat message model."""
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime = field(default_factory=datetime.now)
    intent: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return {
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
            "intent": self.intent
        }


@dataclass
class Conversation:
    """Conversation model with memory."""
    session_id: str
    messages: List[Message] = field(default_factory=list)
    context: Dict[str, Any] = field(default_factory=dict)
    last_intent: Optional[str] = None
    persona: Optional[Dict] = None
    career_matches: List[Dict] = field(default_factory=list)
    
    def add_message(self, role: str, content: str, intent: Optional[str] = None) -> Message:
        msg = Message(role=role, content=content, intent=intent)
        self.messages.append(msg)
        if intent:
            self.last_intent = intent
        return msg
    
    def get_recent_messages(self, limit: int = 10) -> List[Message]:
        return self.messages[-limit:]
    
    def get_history_for_prompt(self, limit: int = 8) -> str:
        recent = self.messages[-limit:]
        history = []
        for msg in recent:
            if msg.role == 'user':
                history.append(f"User: {msg.content}")
            else:
                history.append(f"Nova: {msg.content}")
        return "\n".join(history)
    
    def to_dict(self) -> Dict:
        return {
            "session_id": self.session_id,
            "messages": [m.to_dict() for m in self.messages],
            "context": self.context,
            "last_intent": self.last_intent,
            "persona": self.persona
        }


@dataclass
class CareerMatch:
    """Career match result with explainable scores."""
    career_name: str
    career_data: Dict
    match_score: float
    profile_match: float
    riasec_match: float
    subject_match: float
    interest_match: float
    goal_match: float
    skill_match: float
    location_match: float
    confidence: float
    reason: str
    strengths: List[str]
    improvement_areas: List[str]
    score_breakdown: Dict[str, float]
    
    def to_dict(self) -> Dict:
        return {
            "career_name": self.career_name,
            "match_score": round(self.match_score, 1),
            "profile_match": round(self.profile_match, 1),
            "riasec_match": round(self.riasec_match, 1),
            "subject_match": round(self.subject_match, 1),
            "interest_match": round(self.interest_match, 1),
            "goal_match": round(self.goal_match, 1),
            "skill_match": round(self.skill_match, 1),
            "location_match": round(self.location_match, 1),
            "confidence": round(self.confidence, 1),
            "reason": self.reason,
            "strengths": self.strengths[:5],
            "improvement_areas": self.improvement_areas[:3],
            "career_data": self.career_data
        }


@dataclass
class ClassificationResult:
    """Intent classification result."""
    intent: str
    confidence: float
    is_career_related: bool
    extracted_entities: Dict[str, Any] = field(default_factory=dict)
    requires_retrieval: bool = False
    should_use_career_data: bool = False


@dataclass
class Persona:
    """Student persona model."""
    student_info: Dict
    academic_profile: Dict
    interests: Dict
    riasec_profile: Dict
    preferences: Dict
    summary: str
    
    def to_dict(self) -> Dict:
        return {
            "student_info": self.student_info,
            "academic_profile": self.academic_profile,
            "interests": self.interests,
            "riasec_profile": self.riasec_profile,
            "preferences": self.preferences,
            "summary": self.summary
        }
    
    def to_prompt_context(self) -> str:
        """Convert persona to prompt-friendly format."""
        lines = []
        
        # Student Info
        lines.append("=== STUDENT PROFILE ===")
        lines.append(f"Name: {self.student_info.get('name', 'Student')}")
        lines.append(f"Age: {self.student_info.get('age', 'Not specified')}")
        lines.append(f"Class: {self.student_info.get('class', 'Not specified')}")
        lines.append(f"Stream: {self.student_info.get('stream', 'Not specified')}")
        
        # Academic
        if self.academic_profile.get('subjects'):
            lines.append(f"Favorite Subjects: {', '.join(self.academic_profile['subjects'])}")
        if self.academic_profile.get('weak_subjects'):
            lines.append(f"Subjects Finding Challenging: {', '.join(self.academic_profile['weak_subjects'])}")
        if self.academic_profile.get('strengths'):
            lines.append(f"Strengths: {', '.join(self.academic_profile['strengths'])}")
        
        # Interests
        if self.interests.get('hobbies'):
            lines.append(f"Hobbies: {', '.join(self.interests['hobbies'])}")
        if self.interests.get('interests'):
            lines.append(f"Interests: {', '.join(self.interests['interests'])}")
        if self.interests.get('career_aspirations'):
            lines.append(f"Career Aspirations: {', '.join(self.interests['career_aspirations'])}")
        
        # RIASEC
        lines.append("\n=== PSYCHOMETRIC PROFILE ===")
        lines.append(f"RIASEC Code: {self.riasec_profile.get('code', '')}")
        lines.append(f"Primary Type: {self.riasec_profile.get('primary', '')}")
        lines.append(f"Secondary Type: {self.riasec_profile.get('secondary', '')}")
        lines.append(f"Tertiary Type: {self.riasec_profile.get('tertiary', '')}")
        if self.riasec_profile.get('traits'):
            lines.append(f"Personality Traits: {', '.join(self.riasec_profile['traits'])}")
        
        # Preferences
        lines.append("\n=== PREFERENCES ===")
        lines.append(f"Learning Mode: {self.preferences.get('learning_mode', 'Not specified')}")
        lines.append(f"Budget Preference: {self.preferences.get('budget_preference', 'Not specified')}")
        lines.append(f"Location Preference: {self.preferences.get('location_preference', 'Not specified')}")
        lines.append(f"Work Style: {self.preferences.get('work_style', 'Not specified')}")
        
        return "\n".join(lines)