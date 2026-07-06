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
        student_name: str = "Student",
        all_valid_careers: Optional[List[str]] = None
    ) -> str:
        """
        Validate and sanitize the LLM response.
        
        Args:
            response: The LLM response to validate
            career_matches: List of valid career matches
            student_name: The student's name
            all_valid_careers: List of all valid careers in the database
            
        Returns:
            Validated response
        """
        if not response:
            return self._generate_fallback_response(student_name, career_matches)
        
        # Get valid career names (merge student's matches + all database careers if available)
        valid_careers = [match.career_name for match in career_matches]
        if all_valid_careers:
            # Combine them, keeping student matches first for closest match fallback
            valid_careers.extend([c for c in all_valid_careers if c not in valid_careers])
            
        valid_careers_lower = [c.lower() for c in valid_careers]
        valid_careers_set = set(valid_careers_lower)
        
        # Extract career mentions
        mentioned = self._extract_career_mentions(response)
        
        # Check for invalid mentions
        invalid_mentions = []
        for mention in mentioned:
            mention_lower = mention.lower()
            
            # Check if mention matches any valid career in database
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
        """Sanitize response by replacing close matches or preserving general text."""
        sanitized = response
        
        has_real_invalid = False
        for invalid in invalid_mentions:
            replacement = self._find_closest_match(invalid, valid_careers)
            
            if replacement:
                # Replace with closest match
                pattern = re.compile(re.escape(invalid), re.IGNORECASE)
                sanitized = pattern.sub(replacement, sanitized)
                print(f"[INFO] Replaced '{invalid}' with '{replacement}'")
                has_real_invalid = True
            else:
                # If there's no high-similarity career match, we assume it's general bold text or guidance.
                # Do NOT replace or delete it! Just leave it in the response.
                print(f"[INFO] Preserving general bold/list mention: '{invalid}'")
        
        # Add a note ONLY if actual invalid career mentions were replaced
        if has_real_invalid:
            sanitized += (
                f"\n\nℹ️ Based on your profile, I'm focusing on careers that match "
                f"your specific personality traits. Your top matched careers are "
                f"available in the results above."
            )
        
        return sanitized
    
    def _find_closest_match(self, invalid_name: str, valid_careers: List[str]) -> Optional[str]:
        """Find the closest valid career name match using strong word overlap thresholds."""
        if not valid_careers:
            return None
        
        invalid_lower = invalid_name.lower().strip()
        
        # If it's a general instruction placeholder or standard action phrase, ignore it
        ignore_words = {
            'career', 'job', 'tell', 'me', 'about', 'skills', 'need', 'pay', 'pay?', 'exams', 
            'what', 'match', 'how', 'choose', 'right', 'counselor', 'journey', 'check', 'salary', 
            'information', 'details', 'guidance', 'study', 'become', 'learn', 'required'
        }
        
        # Remove punctuation for better word extraction
        cleaned_invalid = re.sub(r'[^\w\s]', '', invalid_lower)
        invalid_words = {w for w in cleaned_invalid.split() if w not in ignore_words and len(w) > 3}
        if not invalid_words:
            return None
            
        best_match = None
        best_score = 0.0
        
        for valid in valid_careers:
            valid_lower = valid.lower()
            
            # Check for exact match
            if invalid_lower == valid_lower:
                return valid
            
            # Check for substring match (only if invalid name is reasonably long to prevent false substring hits on short words)
            if len(invalid_lower) > 5 and (invalid_lower in valid_lower or valid_lower in invalid_lower):
                return valid
            
            # Word overlap
            cleaned_valid = re.sub(r'[^\w\s]', '', valid_lower)
            valid_words = set(cleaned_valid.split())
            common = invalid_words.intersection(valid_words)
            
            # Filter common words
            filtered_common = {w for w in common if w not in ignore_words and len(w) > 3}
            score = float(len(filtered_common))
            
            # Partial word checks (only for words of length > 3 to avoid matching initials like 's', 'v', etc.)
            remaining_invalid = {w for w in invalid_words - filtered_common if len(w) > 3}
            remaining_valid = {w for w in valid_words - filtered_common if len(w) > 3}
            for iw in remaining_invalid:
                for vw in remaining_valid:
                    if iw in vw or vw in iw:
                        score += 0.5
            
            if score > best_score:
                best_score = score
                best_match = valid
        
        # Only suggest a replacement if the keyword matching score is significant (e.g. >= 1.5)
        # This prevents converting general bold phrases like "**Mathematics**" or "**Physics**" to careers,
        # but allows correcting slightly misspelled inputs like "**Sofware Developer**" -> "Software Developer".
        return best_match if best_score >= 1.5 else None
    
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