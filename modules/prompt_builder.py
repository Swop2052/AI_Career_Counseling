# modules/prompt_builder.py - Dynamic Prompt Builder
from typing import Dict, List, Optional, Any
from core.models import Conversation, CareerMatch, Intent
from core.config import config
from core.utils import get_career_name


class PromptBuilder:
    """
    Dynamic prompt builder that generates context-aware prompts.
    Uses persona, conversation history, and career data for context.
    """
    
    def __init__(self):
        self._max_careers_in_prompt = config.max_careers_in_prompt
    
    def build_prompt(
        self,
        persona: Dict,
        career_matches: List[CareerMatch],
        user_message: str,
        intent: str,
        conversation_history: str,
        previous_response: Optional[str] = None,
        should_use_career_data: bool = True
    ) -> str:
        """
        Build a dynamic prompt for the LLM.
        
        Args:
            persona: Student persona
            career_matches: List of career matches
            user_message: Current user message
            intent: Classified intent
            conversation_history: Recent conversation history
            previous_response: Previous assistant response
            should_use_career_data: Whether to include career data in prompt
            
        Returns:
            Complete prompt for the LLM
        """
        # Build each section
        persona_section = self._build_persona_section(persona)
        intent_section = self._build_intent_section(intent, user_message)
        
        # Only include career data if the intent requires it
        if should_use_career_data and career_matches:
            careers_section = self._build_careers_section(career_matches)
        else:
            careers_section = ""
        
        history_section = self._build_history_section(conversation_history, previous_response)
        instruction_section = self._build_instruction_section(intent, should_use_career_data)
        question_section = self._build_question_section(user_message)
        
        # Combine sections
        prompt_parts = [
            persona_section,
            intent_section,
            careers_section,
            history_section,
            instruction_section,
            question_section
        ]
        
        # Filter out empty sections
        prompt_parts = [p for p in prompt_parts if p.strip()]
        
        return "\n\n".join(prompt_parts)
    
    def _build_persona_section(self, persona: Dict) -> str:
        """Build the persona section of the prompt."""
        if not persona:
            return "=== STUDENT PERSONA ===\nNo profile information available."
        
        lines = ["=== STUDENT PERSONA ==="]
        
        # Student info
        student_info = persona.get("student_info", {})
        if student_info.get("name"):
            lines.append(f"Name: {student_info['name']}")
        if student_info.get("age"):
            lines.append(f"Age: {student_info['age']}")
        if student_info.get("class"):
            lines.append(f"Class: {student_info['class']}")
        if student_info.get("stream"):
            lines.append(f"Stream: {student_info['stream']}")
        
        # Academic
        academic = persona.get("academic_profile", {})
        if academic.get("subjects"):
            lines.append(f"Favorite Subjects: {', '.join(academic['subjects'][:5])}")
        if academic.get("weak_subjects"):
            lines.append(f"Subjects Finding Challenging: {', '.join(academic['weak_subjects'][:5])}")
        if academic.get("strengths"):
            lines.append(f"Strengths: {', '.join(academic['strengths'][:5])}")
        
        # Interests
        interests = persona.get("interests", {})
        if interests.get("interests"):
            lines.append(f"Interests: {', '.join(interests['interests'][:5])}")
        if interests.get("hobbies"):
            lines.append(f"Hobbies: {', '.join(interests['hobbies'][:5])}")
        if interests.get("career_aspirations"):
            lines.append(f"Career Aspirations: {', '.join(interests['career_aspirations'][:3])}")
        
        # RIASEC
        riasec = persona.get("riasec_profile", {})
        if riasec.get("code"):
            lines.append(f"RIASEC Code: {riasec['code']} ({riasec.get('primary', '')}, {riasec.get('secondary', '')}, {riasec.get('tertiary', '')})")
        if riasec.get("traits"):
            lines.append(f"Personality Traits: {', '.join(riasec['traits'][:6])}")
        
        # Preferences
        preferences = persona.get("preferences", {})
        if preferences.get("learning_mode"):
            lines.append(f"Learning Mode: {preferences['learning_mode']}")
        if preferences.get("budget_preference"):
            lines.append(f"Budget: {preferences['budget_preference']}")
        if preferences.get("location_preference"):
            lines.append(f"Location: {preferences['location_preference']}")
        
        return "\n".join(lines)
    
    def _build_intent_section(self, intent: str, user_message: str) -> str:
        """Build the intent section of the prompt."""
        lines = ["=== INTENT ==="]
        
        # Map intent to description
        intent_descriptions = {
            "greeting": "The user is greeting you. Respond warmly and ask how you can help.",
            "general_chat": "The user is having a general conversation. Be helpful and engaging.",
            "career_recommendation": "The user wants career recommendations. Provide personalized suggestions.",
            "career_comparison": "The user wants to compare careers. Highlight differences and similarities.",
            "job_information": "The user wants information about a specific job/career.",
            "skill_guidance": "The user wants guidance on skills needed for a career.",
            "college_guidance": "The user wants guidance on colleges/institutions.",
            "salary_query": "The user is asking about salary/income.",
            "study_guidance": "The user wants guidance on what to study.",
            "profile_question": "The user is asking about their profile/assessment.",
            "follow_up": "The user is asking a follow-up question.",
            "off_topic": "The user is asking about something unrelated to careers."
        }
        
        intent_desc = intent_descriptions.get(intent, "The user is asking a general question.")
        lines.append(f"Intent: {intent}")
        lines.append(f"Description: {intent_desc}")
        lines.append(f"User Message: {user_message}")
        
        return "\n".join(lines)
    
    def _normalize_career_for_prompt(self, career: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize career keys so they match standard key names in the prompt."""
        if not isinstance(career, dict):
            return {}
            
        normalized = {}
        for k, v in career.items():
            normalized[k] = v
            
        aliases = {
            'career_name': ['career_name', 'name', 'career'],
            'description': ['description', 'overview', 'summary', 'about'],
            'personality_traits': ['personality_traits', 'traits', 'personality'],
            'educational_pathway': ['educational_pathway', 'education_pathway', 'pathway', 'academic_pathway'],
            'entrance_exams': ['entrance_exams', 'exam_requirements', 'entrance_tests'],
            'course_fee': ['course_fee', 'fees', 'tuition_fee'],
            'expected_income': ['expected_income', 'salary', 'income'],
            'scholarships': ['scholarships', 'financial_aid'],
            'loans': ['loans', 'education_loans'],
            'where_will_you_study': ['where_will_you_study', 'institutes', 'institutions', 'study_institutes'],
            'where_will_you_work': ['where_will_you_work', 'work_places', 'work_locations', 'work_environment'],
            'growth_path': ['growth_path', 'expected_growth_path', 'career_growth_path', 'career_progression'],
            'related_careers': ['related_careers', 'related_fields', 'adjacent_careers'],
            'differently_abled_opportunities': ['differently_abled_opportunities', 'accessible_opportunities'],
            'entrepreneurship': ['entrepreneurship', 'entrepreneurial_opportunities'],
            'ai_insights': ['ai_insights', 'insights', 'future_insights'],
            'success_story': ['success_story', 'example_from_field', 'career_story'],
        }
        
        # Custom merge for where_will_you_work to prevent data loss
        if 'where_will_you_work' not in normalized:
            places = normalized.get('places_of_work') or normalized.get('work_places')
            env = normalized.get('work_environment') or normalized.get('environment')
            diff_abled = normalized.get('differently_abled_opportunities')
            
            if places or env or diff_abled is not None:
                normalized['where_will_you_work'] = {}
                if places:
                    normalized['where_will_you_work']['places_of_work'] = places
                if env:
                    if isinstance(env, dict):
                        normalized['where_will_you_work']['work_environment'] = env
                    else:
                        normalized['where_will_you_work']['work_environment'] = {'description': str(env)}
                if diff_abled is not None:
                    normalized['where_will_you_work']['differently_abled_opportunities'] = diff_abled

        for target, sources in aliases.items():
            if target in normalized and normalized[target]:
                continue

            for source in sources:
                if source in normalized and normalized[source]:
                    normalized[target] = normalized[source]
                    break

        # Standardize expected_income nested salary keys to ensure prompt consistency
        if 'expected_income' in normalized and isinstance(normalized['expected_income'], dict):
            inc = normalized['expected_income']
            if 'minimum_monthly_salary' not in inc:
                for k in ['minimum_monthly_salary_inr', 'minimum_salary', 'min_salary']:
                    if k in inc:
                        val = inc[k]
                        inc['minimum_monthly_salary'] = f"INR {val}" if isinstance(val, (int, float)) else str(val)
                        break
            if 'maximum_monthly_salary' not in inc:
                for k in ['maximum_monthly_salary_inr', 'maximum_salary', 'max_salary']:
                    if k in inc:
                        val = inc[k]
                        inc['maximum_monthly_salary'] = f"INR {val}" if isinstance(val, (int, float)) else str(val)
                        break

        return normalized

    def _build_careers_section(self, career_matches: List[CareerMatch]) -> str:
        """Build the careers section of the prompt."""
        if not career_matches:
            return "=== AVAILABLE CAREERS ===\nNo career matches available."
        
        lines = ["=== AVAILABLE CAREERS ==="]
        lines.append("IMPORTANT: You can ONLY discuss the careers listed below.")
        lines.append("NEVER suggest careers not in this list.")
        lines.append("")
        
        # Career reference table
        lines.append("CAREER REFERENCE TABLE:")
        lines.append("| # | Career Name | Match Score |")
        lines.append("|---|-------------|-------------|")
        
        for i, match in enumerate(career_matches[:self._max_careers_in_prompt], 1):
            lines.append(f"| {i} | {match.career_name} | {match.match_score:.0f}% |")
        
        lines.append("")
        
        # Detailed career data
        import json
        exclude_keys = {
            'pages', 'source_page', 'source_pages', 'ranking_information', 
            'reference_ranking_website', 'source', 'emoji'
        }
        
        for i, match in enumerate(career_matches[:self._max_careers_in_prompt], 1):
            raw_career = match.career_data
            career = self._normalize_career_for_prompt(raw_career)
            
            lines.append(f"--- Career {i}: {match.career_name} ---")
            lines.append(f"Overall Match: {match.match_score:.1f}%")
            lines.append(f"RIASEC Match: {match.riasec_match:.1f}%")
            lines.append(f"Subject Match: {match.subject_match:.1f}%")
            lines.append(f"Interest Match: {match.interest_match:.1f}%")
            lines.append(f"Reason: {match.reason}")
            
            # Serialize the clean career data to indented JSON so the LLM gets full access to all fields (colleges, pathways, scholarships, loans, etc.)
            clean_career = {k: v for k, v in career.items() if k not in exclude_keys and k != 'career_name'}
            career_json = json.dumps(clean_career, indent=2, ensure_ascii=False)
            lines.append("Career Details:")
            lines.append(career_json)
            lines.append("")
        
        return "\n".join(lines)
    
    def _build_history_section(self, history: str, previous_response: Optional[str]) -> str:
        """Build the history section of the prompt."""
        if not history and not previous_response:
            return ""
        
        lines = ["=== CONVERSATION HISTORY ==="]
        
        if history:
            lines.append(history)
        
        if previous_response:
            lines.append(f"Your previous response: {previous_response[:300]}...")
        
        return "\n".join(lines)
    
    def _build_instruction_section(self, intent: str, should_use_career_data: bool) -> str:
        """Build the instruction section of the prompt."""
        lines = ["=== INSTRUCTIONS ==="]
        
        # Base instructions
        lines.append("You are VERA, an AI Career Companion with expertise in psychometric assessment and career guidance.")
        lines.append("")
        lines.append("Core Rules:")
        lines.append("1. Have a natural, conversational, and empathetic tone")
        lines.append("2. Use the student's name when possible")
        lines.append("3. Provide specific, actionable advice")
        lines.append("4. Use emojis occasionally for a friendly tone (😊, 🚀, 🎯)")
        lines.append("5. Keep responses concise and easy to understand")
        lines.append("6. Ask clarifying questions when needed")
        lines.append("7. NEVER hallucinate salaries, colleges, exams, or facts")
        
        if should_use_career_data:
            lines.append("8. ONLY discuss careers from the AVAILABLE CAREERS list")
            lines.append("9. NEVER create or suggest careers not in the list")
            lines.append("10. Use the specific match scores and trait information provided")
            lines.append("11. If information is not available in the career data, say: 'I don't have that information in my career database'")
        else:
            lines.append("8. Focus on the student's profile and general career guidance")
            lines.append("9. Avoid making specific career recommendations without data")
        
        lines.append("")
        
        # Intent-specific instructions
        intent_instructions = {
            "greeting": "The user is greeting you. Respond warmly, introduce yourself, and ask how you can help with their career journey.",
            "general_chat": "Have a natural conversation. If the user seems interested in careers, gently guide them toward career exploration.",
            "career_recommendation": "Provide personalized career recommendations using the available data. Explain why each career matches their profile.",
            "career_comparison": "Compare the careers the user is interested in. Highlight differences in education, skills, salary, and work environment.",
            "job_information": "Provide detailed information about the specific career. Include education, skills, salary, growth path, and work environment.",
            "skill_guidance": "Advise on skills needed for the career. Suggest how the student can develop these skills.",
            "college_guidance": "Guide on colleges/institutions for the career. Mention entrance exams and admission requirements.",
            "salary_query": "Provide salary information from the career data. If not available, clearly state that.",
            "study_guidance": "Guide on what to study for the career. Include educational pathway and subject recommendations.",
            "profile_question": "Discuss the student's profile. Explain their RIASEC code and what it means for their career choices.",
            "follow_up": "Build on the previous conversation. Provide additional information or clarification.",
            "off_topic": "Politely redirect to career-related topics. Offer to help with career guidance."
        }
        
        instruction = intent_instructions.get(intent, "Provide a helpful, accurate response based on the available data.")
        lines.append(f"Focus: {instruction}")
        
        return "\n".join(lines)
    
    def _build_question_section(self, user_message: str) -> str:
        """Build the question section of the prompt."""
        return f"=== STUDENT'S QUESTION ===\n{user_message}\n\nPlease provide a helpful, accurate response."


# Singleton instance
prompt_builder = PromptBuilder()