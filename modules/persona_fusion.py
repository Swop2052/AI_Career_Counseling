# modules/persona_fusion.py - Enhanced Persona Fusion Engine
from typing import Dict, List, Any, Optional
from core.constants import RIASEC_LABELS
from core.models import Persona
from core.exceptions import PersonaGenerationError
from core.utils import normalize_tokens, stringify_list
from trait_definitions import TRAITS


class PersonaFusionEngine:
    """
    Generates a unified student persona by fusing all available data.
    This becomes the single source of truth for downstream processing.
    """
    
    def __init__(self):
        self._trait_definitions = TRAITS
    
    def generate_persona(self, profile: Dict, student_info: Dict = None) -> Persona:
        """
        Generate a comprehensive student persona from all available data.
        
        Args:
            profile: RIASEC profile with scores and traits
            student_info: Student-provided information
            
        Returns:
            Persona: Unified student persona
        """
        try:
            student_info = student_info or {}
            
            # Build persona components
            persona = Persona(
                student_info=self._build_student_info(student_info),
                academic_profile=self._build_academic_profile(student_info),
                interests=self._build_interests(student_info),
                riasec_profile=self._build_riasec_profile(profile),
                preferences=self._build_preferences(student_info),
                summary=""
            )
            
            # Generate summary
            persona.summary = self._generate_summary(persona)
            
            return persona
            
        except Exception as e:
            raise PersonaGenerationError(f"Failed to generate persona: {str(e)}")
    
    def _build_student_info(self, info: Dict) -> Dict:
        """Build student information section."""
        return {
            "name": info.get("name", "Student"),
            "age": info.get("age", "Not specified"),
            "class": info.get("class", "Not specified"),
            "stream": info.get("education", info.get("stream", "Not specified"))
        }
    
    def _build_academic_profile(self, info: Dict) -> Dict:
        """Build academic profile section."""
        return {
            "subjects": self._parse_list(info.get("subjects", [])),
            "weak_subjects": self._parse_list(info.get("weak_subjects", [])),
            "strengths": self._parse_list(info.get("strengths", [])),
            "skills": self._parse_list(info.get("skills", []))
        }
    
    def _build_interests(self, info: Dict) -> Dict:
        """Build interests section."""
        return {
            "hobbies": self._parse_list(info.get("hobbies", [])),
            "interests": self._parse_list(info.get("interests", [])),
            "career_aspirations": self._parse_list(info.get("career_aspirations", []))
        }
    
    def _build_riasec_profile(self, profile: Dict) -> Dict:
        """Build RIASEC profile section."""
        scores = profile.get("raw_scores", {})
        code = profile.get("riasec_code", "")
        
        # Sort scores
        sorted_scores = sorted(
            [(k, v) for k, v in scores.items() if isinstance(v, (int, float))],
            key=lambda x: x[1],
            reverse=True
        )
        
        primary = sorted_scores[0][0] if len(sorted_scores) > 0 else "R"
        secondary = sorted_scores[1][0] if len(sorted_scores) > 1 else "I"
        tertiary = sorted_scores[2][0] if len(sorted_scores) > 2 else "A"
        
        # Collect unique traits
        traits = []
        for code_char in code[:3]:
            if code_char in self._trait_definitions:
                traits.extend(self._trait_definitions[code_char].get("traits", []))
        
        # Remove duplicates while preserving order
        seen = set()
        unique_traits = []
        for trait in traits:
            if trait not in seen:
                seen.add(trait)
                unique_traits.append(trait)
        
        return {
            "code": code,
            "primary": RIASEC_LABELS.get(primary, primary),
            "secondary": RIASEC_LABELS.get(secondary, secondary),
            "tertiary": RIASEC_LABELS.get(tertiary, tertiary),
            "primary_code": primary,
            "secondary_code": secondary,
            "tertiary_code": tertiary,
            "traits": unique_traits[:8],
            "scores": {k: round(float(v), 2) for k, v in scores.items()}
        }
    
    def _build_preferences(self, info: Dict) -> Dict:
        """Build preferences section."""
        return {
            "learning_mode": info.get("learning_mode", "offline"),
            "budget_preference": info.get("budget", "moderate"),
            "location_preference": info.get("location", "india"),
            "work_style": info.get("work_style", "hybrid")
        }
    
    def _parse_list(self, value: Any) -> List[str]:
        """Parse various input types into a list of strings."""
        if value is None:
            return []
        if isinstance(value, list):
            return [str(item).strip() for item in value if item and str(item).strip()]
        if isinstance(value, str):
            return [item.strip() for item in value.split(',') if item.strip()]
        return []
    
    def _generate_summary(self, persona: Persona) -> str:
        """Generate a human-readable summary of the persona."""
        parts = []
        
        name = persona.student_info.get("name", "Student")
        parts.append(f"{name} is a {persona.student_info.get('class', '')} student")
        
        if persona.student_info.get("stream"):
            parts.append(f"studying {persona.student_info['stream']}")
        
        riasec = persona.riasec_profile
        if riasec.get("code"):
            parts.append(f"with a RIASEC code of {riasec['code']}")
        
        if riasec.get("traits"):
            trait_text = ", ".join(riasec["traits"][:4])
            parts.append(f"Key traits: {trait_text}")
        
        interests = persona.interests.get("interests", [])
        if interests:
            interest_text = ", ".join(interests[:3])
            parts.append(f"Interested in {interest_text}")
        
        aspirations = persona.interests.get("career_aspirations", [])
        if aspirations:
            aspiration_text = ", ".join(aspirations[:2])
            parts.append(f"Aspires to be a {aspiration_text}")
        
        return ". ".join(parts)


# Singleton instance
persona_fusion = PersonaFusionEngine()