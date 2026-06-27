# modules/intent_classifier.py
import re
from typing import Dict, Any, List, Tuple
from core.constants import (
    INTENTS, GREETING_PATTERNS, OFF_TOPIC_PATTERNS
)
from core.models import Intent, ClassificationResult
from core.exceptions import IntentClassificationError


class IntentClassifier:
    """Classifies user intent based on message content."""
    
    def __init__(self):
        self._greeting_patterns = [re.compile(p, re.IGNORECASE) for p in GREETING_PATTERNS]
        self._off_topic_patterns = [re.compile(p, re.IGNORECASE) for p in OFF_TOPIC_PATTERNS]
        
        # Career-related keywords
        self._career_keywords = [
            'career', 'job', 'profession', 'occupation', 'work', 'field',
            'path', 'future', 'dream', 'goal', 'aspire', 'ambition'
        ]
        
        # Skill-related keywords
        self._skill_keywords = [
            'skill', 'learn', 'training', 'course', 'certification',
            'ability', 'proficiency', 'expertise', 'competency'
        ]
        
        # College-related keywords
        self._college_keywords = [
            'college', 'university', 'school', 'institute', 'campus',
            'admission', 'apply', 'entrance', 'exam', 'degree'
        ]
        
        # Salary-related keywords
        self._salary_keywords = [
            'salary', 'pay', 'income', 'wage', 'earn', 'money',
            'compensation', 'package', 'remuneration', 'financial'
        ]
        
        # Comparison keywords
        self._comparison_keywords = [
            'compare', 'versus', 'vs', 'difference', 'between',
            'better', 'worse', 'similar', 'different'
        ]
        
        # Study-related keywords
        self._study_keywords = [
            'study', 'education', 'learn', 'training', 'curriculum',
            'syllabus', 'subject', 'course', 'class', 'lecture'
        ]
        
        # Profile-related keywords
        self._profile_keywords = [
            'profile', 'assessment', 'result', 'report', 'analysis',
            'score', 'riasec', 'personality', 'trait', 'strength'
        ]
    
    def classify(self, message: str, context: Dict = None) -> ClassificationResult:
        """
        Classify the intent of a user message.
        
        Args:
            message: The user's message
            context: Optional conversation context
            
        Returns:
            ClassificationResult with intent, confidence, and extracted entities
        """
        if not message or not message.strip():
            return ClassificationResult(
                intent=Intent.GENERAL_CHAT,
                confidence=0.5,
                is_career_related=False,
                requires_retrieval=False
            )
        
        message_lower = message.lower().strip()
        context = context or {}
        
        # Check for greeting
        if self._is_greeting(message_lower):
            return ClassificationResult(
                intent=Intent.GREETING,
                confidence=0.95,
                is_career_related=False,
                requires_retrieval=False
            )
        
        # Check for off-topic
        if self._is_off_topic(message_lower):
            return ClassificationResult(
                intent=Intent.OFF_TOPIC,
                confidence=0.8,
                is_career_related=False,
                requires_retrieval=False
            )
        
        # Check for follow-up (if we have context)
        if context.get('last_intent') and self._is_follow_up(message_lower):
            return ClassificationResult(
                intent=Intent.FOLLOW_UP,
                confidence=0.7,
                is_career_related=True,
                requires_retrieval=context.get('requires_retrieval', False),
                extracted_entities={'previous_intent': context.get('last_intent')}
            )
        
        # Extract entities first
        entities = self._extract_entities(message_lower)
        
        # Check for career comparison
        if self._is_comparison(message_lower, entities):
            return ClassificationResult(
                intent=Intent.CAREER_COMPARISON,
                confidence=0.85,
                is_career_related=True,
                requires_retrieval=True,
                extracted_entities=entities
            )
        
        # Check for career recommendation
        if self._is_recommendation_request(message_lower):
            return ClassificationResult(
                intent=Intent.CAREER_RECOMMENDATION,
                confidence=0.9,
                is_career_related=True,
                requires_retrieval=True,
                extracted_entities=entities
            )
        
        # Check for skill guidance
        if self._is_skill_request(message_lower):
            return ClassificationResult(
                intent=Intent.SKILL_GUIDANCE,
                confidence=0.85,
                is_career_related=True,
                requires_retrieval=True,
                extracted_entities=entities
            )
        
        # Check for college guidance
        if self._is_college_request(message_lower):
            return ClassificationResult(
                intent=Intent.COLLEGE_GUIDANCE,
                confidence=0.85,
                is_career_related=True,
                requires_retrieval=True,
                extracted_entities=entities
            )
        
        # Check for salary query
        if self._is_salary_request(message_lower):
            return ClassificationResult(
                intent=Intent.SALARY_QUERY,
                confidence=0.85,
                is_career_related=True,
                requires_retrieval=True,
                extracted_entities=entities
            )
        
        # Check for study guidance
        if self._is_study_request(message_lower):
            return ClassificationResult(
                intent=Intent.STUDY_GUIDANCE,
                confidence=0.8,
                is_career_related=True,
                requires_retrieval=True,
                extracted_entities=entities
            )
        
        # Check for job information
        if self._is_job_request(message_lower):
            return ClassificationResult(
                intent=Intent.JOB_INFORMATION,
                confidence=0.8,
                is_career_related=True,
                requires_retrieval=True,
                extracted_entities=entities
            )
        
        # Check for profile question
        if self._is_profile_question(message_lower):
            return ClassificationResult(
                intent=Intent.PROFILE_QUESTION,
                confidence=0.8,
                is_career_related=False,
                requires_retrieval=False,
                extracted_entities=entities
            )
        
        # Default: general chat
        return ClassificationResult(
            intent=Intent.GENERAL_CHAT,
            confidence=0.6,
            is_career_related=self._contains_career_mention(message_lower),
            requires_retrieval=self._contains_career_mention(message_lower),
            extracted_entities=entities
        )
    
    def _is_greeting(self, message: str) -> bool:
        """Check if message is a greeting."""
        for pattern in self._greeting_patterns:
            if pattern.match(message):
                return True
        return False
    
    def _is_off_topic(self, message: str) -> bool:
        """Check if message is off-topic."""
        for pattern in self._off_topic_patterns:
            if pattern.search(message):
                return True
        return False
    
    def _is_follow_up(self, message: str) -> bool:
        """Check if message is a follow-up question."""
        follow_up_patterns = [
            r'(what about|how about|and what|and how|also|additionally|furthermore)',
            r'(tell me more|more about|explain further|elaborate)',
            r'(why|how|when|where|who|which|what)[\s\?]'
        ]
        for pattern in follow_up_patterns:
            if re.search(pattern, message, re.IGNORECASE):
                return True
        return False
    
    def _is_recommendation_request(self, message: str) -> bool:
        """Check if message is requesting career recommendations."""
        patterns = [
            r'(recommend|suggest|suggestion|recommendation)',
            r'(what career|which career|career option|career path)',
            r'(what should I|which should I)',
            r'(find career|discover career|explore career)',
            r'(best career|ideal career|perfect career|right career)',
            r'(help me find|help me choose)'
        ]
        for pattern in patterns:
            if re.search(pattern, message, re.IGNORECASE):
                return True
        return self._contains_career_mention(message) and '?' in message
    
    def _is_comparison(self, message: str, entities: Dict) -> bool:
        """Check if message is comparing careers."""
        if not entities.get('career_names') or len(entities['career_names']) < 2:
            return False
        
        for pattern in self._comparison_keywords:
            if pattern in message:
                return True
        return False
    
    def _is_skill_request(self, message: str) -> bool:
        """Check if message is requesting skill guidance."""
        skill_indicators = [
            r'(what skill|which skill|skill needed|skill required|skills for|skill development)',
            r'(how to learn|what to learn|learn skills|develop skill|improve skill)'
        ]
        for pattern in skill_indicators:
            if re.search(pattern, message, re.IGNORECASE):
                return True
        
        for keyword in self._skill_keywords:
            if keyword in message:
                return True
        return False
    
    def _is_college_request(self, message: str) -> bool:
        """Check if message is requesting college guidance."""
        college_indicators = [
            r'(what college|which college|best college|top college|college for)',
            r'(college admission|college entrance|university admission)'
        ]
        for pattern in college_indicators:
            if re.search(pattern, message, re.IGNORECASE):
                return True
        
        for keyword in self._college_keywords:
            if keyword in message:
                return True
        return False
    
    def _is_salary_request(self, message: str) -> bool:
        """Check if message is requesting salary information."""
        salary_indicators = [
            r'(how much|what is the salary|salary for|earn as|pay for)',
            r'(salary range|salary package|compensation|income)'
        ]
        for pattern in salary_indicators:
            if re.search(pattern, message, re.IGNORECASE):
                return True
        
        for keyword in self._salary_keywords:
            if keyword in message:
                return True
        return False
    
    def _is_study_request(self, message: str) -> bool:
        """Check if message is requesting study guidance."""
        study_indicators = [
            r'(what to study|which subject|study pathway|educational path)',
            r'(course for|degree for|education for|study for)'
        ]
        for pattern in study_indicators:
            if re.search(pattern, message, re.IGNORECASE):
                return True
        
        for keyword in self._study_keywords:
            if keyword in message:
                return True
        return False
    
    def _is_job_request(self, message: str) -> bool:
        """Check if message is requesting job information."""
        job_indicators = [
            r'(what do.*do|job role|job description|job profile|work as)',
            r'(responsibilities|duties|tasks|daily work|typical day)'
        ]
        for pattern in job_indicators:
            if re.search(pattern, message, re.IGNORECASE):
                return True
        return False
    
    def _is_profile_question(self, message: str) -> bool:
        """Check if message is asking about profile/assessment."""
        profile_indicators = [
            r'(my profile|my assessment|my result|my score|my report)',
            r'(what.*my|how.*my|tell me about my)',
            r'(riasec|personality|trait)'
        ]
        for pattern in profile_indicators:
            if re.search(pattern, message, re.IGNORECASE):
                return True
        
        for keyword in self._profile_keywords:
            if keyword in message:
                return True
        return False
    
    def _contains_career_mention(self, message: str) -> bool:
        """Check if message contains career-related terms."""
        for keyword in self._career_keywords:
            if keyword in message:
                return True
        return False
    
    def _extract_entities(self, message: str) -> Dict:
        """Extract entities like career names from message."""
        entities = {
            'career_names': [],
            'skills': [],
            'subjects': [],
            'location': None
        }
        
        # Extract potential career names (words that might be careers)
        # This is a simple extraction - in production, use NER
        words = message.split()
        for word in words:
            if len(word) > 3 and word not in ['what', 'which', 'career', 'job', 'skill', 'about']:
                entities['career_names'].append(word.lower())
        
        # Extract skills mentioned
        skill_indicators = ['skill', 'learn', 'training', 'course']
        for indicator in skill_indicators:
            if indicator in message:
                parts = message.split(indicator)
                if len(parts) > 1:
                    potential_skills = parts[1].strip().split(' ')
                    entities['skills'].extend([p for p in potential_skills[:2] if len(p) > 2])
        
        return entities


# Singleton instance
intent_classifier = IntentClassifier()