# modules/response_validator.py - Response Validator
import re
from typing import List, Dict, Optional, Set
from core.models import CareerMatch
from core.utils import get_career_name


class ResponseValidator:
    """
    Validates LLM responses to ensure they only contain valid career data.
    Prevents hallucination by checking against the career database.
    """
    
    def __init__(self):
        self._career_pattern = r'\*\*([^*]+)\*\*'
        self._list_pattern = r'(?m)^\s*(?:\d+\.|[-*])\s+([^\n:]{3,80})\s*$'
    
    def validate(
        self,
        response: str,
        career_matches: List[CareerMatch],
        student_name: str = "Student"
    ) -> str:
        """
        Validate and sanitize the LLM response.
        
        Args:
            response: The LLM response to validate
            career_matches: List of valid career matches
            student_name: The student's name
            
        Returns:
            Validated response
        """
        if not response:
            return self._generate_fallback_response(student_name, career_matches)
        
        if not career_matches:
            # If there are no career matches, we don't perform strict career-filtering
            # to allow general chat, greetings, and queries before taking the test.
            return response
        
        # Get valid career names
        valid_careers = [match.career_name for match in career_matches]
        valid_careers_lower = [c.lower() for c in valid_careers]
        valid_careers_set = set(valid_careers_lower)
        
        # Extract career mentions
        mentioned = self._extract_career_mentions(response)
        
        # Check for invalid mentions
        invalid_mentions = []
        for mention in mentioned:
            mention_lower = mention.lower()
            
            # Check if mention matches any valid career
            is_valid = False
            for valid in valid_careers_lower:
                if mention_lower == valid or mention_lower in valid or valid in mention_lower:
                    is_valid = True
                    break
            
            if not is_valid:
                invalid_mentions.append(mention)
        
        if invalid_mentions:
            print(f"[WARNING] LLM mentioned invalid careers: {invalid_mentions}")
            return self._sanitize_response(
                response, invalid_mentions, valid_careers, student_name
            )
        
        return response
    
    def _extract_career_mentions(self, text: str) -> List[str]:
        """Extract career names mentioned in the text."""
        mentions = []
        
        # Check bold text: **Career Name**
        bold_matches = re.findall(self._career_pattern, text)
        for match in bold_matches:
            mention = match.strip()
            if len(mention) > 3:
                mentions.append(mention)
        
        # Check list format
        list_matches = re.findall(self._list_pattern, text)
        for match in list_matches:
            mention = match.strip()
            if len(mention) > 3:
                mentions.append(mention)
        
        return mentions
    
    def _sanitize_response(
        self,
        response: str,
        invalid_mentions: List[str],
        valid_careers: List[str],
        student_name: str
    ) -> str:
        """Sanitize response by replacing or removing invalid mentions."""
        sanitized = response
        
        for invalid in invalid_mentions:
            replacement = self._find_closest_match(invalid, valid_careers)
            
            if replacement:
                # Replace with closest match
                pattern = re.compile(re.escape(invalid), re.IGNORECASE)
                sanitized = pattern.sub(replacement, sanitized)
                print(f"[INFO] Replaced '{invalid}' with '{replacement}'")
            else:
                # Remove the invalid mention
                sanitized = re.sub(
                    rf'\*\*\s*{re.escape(invalid)}\s*\*\*', '', sanitized,
                    flags=re.IGNORECASE
                )
                sanitized = re.sub(
                    rf'(?m)^\s*(?:\d+\.|[-*])\s*{re.escape(invalid)}\s*$', '',
                    sanitized, flags=re.IGNORECASE
                )
                print(f"[WARNING] Removed invalid career: {invalid}")
        
        # Add a note if careers were filtered
        if invalid_mentions:
            sanitized += (
                f"\n\nℹ️ Based on your profile, I'm focusing on careers that match "
                f"your specific personality traits. Your top matched careers are "
                f"available in the results above."
            )
        
        return sanitized
    
    def _find_closest_match(self, invalid_name: str, valid_careers: List[str]) -> Optional[str]:
        """Find the closest valid career name match."""
        if not valid_careers:
            return None
        
        invalid_lower = invalid_name.lower()
        invalid_words = set(invalid_lower.split())
        
        best_match = None
        best_score = 0
        
        for valid in valid_careers:
            valid_lower = valid.lower()
            
            # Check for exact match
            if invalid_lower == valid_lower:
                return valid
            
            # Check for substring match
            if invalid_lower in valid_lower or valid_lower in invalid_lower:
                return valid
            
            # Word overlap
            valid_words = set(valid_lower.split())
            common = invalid_words.intersection(valid_words)
            score = len(common)
            
            # Check for partial word matches
            for iw in invalid_words:
                for vw in valid_words:
                    if len(iw) > 3 and len(vw) > 3:
                        if iw in vw or vw in iw:
                            score += 1
            
            if score > best_score:
                best_score = score
                best_match = valid
        
        return best_match if best_score >= 1 else None
    
    def _generate_fallback_response(self, student_name: str, career_matches: List[CareerMatch]) -> str:
        """Generate a fallback response."""
        if not career_matches:
            return self._generate_no_careers_response(student_name)
        
        top_careers = career_matches[:3]
        response = f"""🎯 Hi {student_name}! Based on your profile, I've found some great career matches for you.

### Your Top Career Matches:
"""
        for i, match in enumerate(top_careers, 1):
            response += f"\n**{i}. {match.career_name}** - {match.match_score:.0f}% match"
        
        response += """
### Next Steps:
1. **Explore each career** by clicking on the career cards above
2. **Review the educational pathway** and entrance exams
3. **Check the expected income** and growth opportunities
4. **Ask me specific questions** about any career you're interested in

I'm here to help you make an informed decision about your future! [STARTUP]"""
        
        return response
    
    def _generate_no_careers_response(self, student_name: str) -> str:
        """Generate a response when no valid careers are found."""
        return f"""
💭 Hi {student_name}! I've analyzed your profile, but I couldn't find specific career matches in the database.

### What you can do:
1. **Review your profile** - make sure your interests, subjects, and preferences are correctly entered
2. **Retake the RIASEC assessment** - your answers help determine your career matches
3. **Explore the careers** that do appear in your results
4. **Ask me questions** about any career you're interested in

If you're not sure where to start, try asking me about careers related to your favorite subjects or hobbies! [STARTUP]
"""


# Singleton instance
response_validator = ResponseValidator()