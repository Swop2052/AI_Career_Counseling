# modules/ranking_engine.py - Weighted Ranking Engine
from typing import Dict, List, Any, Optional, Tuple
import json
from core.config import config
from core.constants import RIASEC_KEYWORDS, FLAT_SUBJECT_KEYWORDS
from core.models import CareerMatch
from core.utils import normalize_tokens, extract_text_from_career, get_career_name
from core.exceptions import RankingError


class RankingEngine:
    """
    Advanced Psychometric Ranking Engine using 5-Factor Model and Dot Product.
    """
    
    def __init__(self):
        # 5-Factor Psychometric Weights
        self.weights = {
            "riasec_match": config.weight_riasec_match,
            "mind_aptitude": config.weight_mind_aptitude,
            "soul_values": config.weight_soul_values,
            "body_work_style": config.weight_body_work_style,
            "academic_interest": config.weight_academic_interest
        }
        
        # Validate weights sum to 1
        total = sum(self.weights.values())
        if abs(total - 1.0) > 0.01:
            print(f"[WARNING] Warning: Weights sum to {total}, normalizing...")
            for key in self.weights:
                self.weights[key] = self.weights[key] / total

        # Load RIASEC Questions to dynamically calculate max scores
        try:
            with open(config.riasec_questions_path, 'r', encoding='utf-8') as f:
                self.riasec_questions = json.load(f)
        except Exception:
            self.riasec_questions = {}
            
        self.trait_keys = {
            "R": "Realistic",
            "I": "Investigative",
            "A": "Artistic",
            "S": "Social",
            "E": "Enterprising",
            "C": "Conventional"
        }
    
    def compute_scores(self, persona: Dict, career: Dict) -> Dict:
        """
        Compute all match scores for a career.
        
        Returns:
            Dict with all individual scores and final match score
        """
        career_text = extract_text_from_career(career)
        
        # 1. RIASEC Match (Dot Product)
        riasec_score = self._compute_dot_product_riasec(persona, career)
        
        # 2. Mind / Aptitude (Traits & Skills)
        mind_aptitude = self._compute_mind_aptitude(persona, career_text)
        
        # 3. Soul / Values (Goals)
        soul_values = self._compute_soul_values(persona, career_text)
        
        # 4. Body / Work Style (Interests)
        body_work_style = self._compute_body_work_style(persona, career_text)
        
        # 5. Academic Interest (Subjects)
        academic_interest = self._compute_academic_interest(persona, career_text)
        
        # Calculate weighted total
        total = (
            riasec_score * self.weights["riasec_match"] +
            mind_aptitude * self.weights["mind_aptitude"] +
            soul_values * self.weights["soul_values"] +
            body_work_style * self.weights["body_work_style"] +
            academic_interest * self.weights["academic_interest"]
        )
        
        # Optional: Keep penalty if needed, but remove preference bonus since 5-factor model represents total.
        # We'll just enforce bounds.
        total = max(0, min(100, total))
        
        return {
            "match_score": round(total, 2),
            "riasec_match": round(riasec_score, 2),
            "mind_aptitude": round(mind_aptitude, 2),
            "soul_values": round(soul_values, 2),
            "body_work_style": round(body_work_style, 2),
            "academic_interest": round(academic_interest, 2),
            "score_breakdown": {
                "riasec": riasec_score,
                "mind_aptitude": mind_aptitude,
                "soul_values": soul_values,
                "body_work_style": body_work_style,
                "academic_interest": academic_interest
            }
        }
    
    def create_career_match(self, persona: Dict, career: Dict, scores: Dict) -> CareerMatch:
        """Create a CareerMatch object with explanation."""
        career_name = get_career_name(career)
        reason, strengths, improvements = self._generate_explanation(persona, career, scores)
        
        # We map the old 7 fields to the new 5 to satisfy CareerMatch dataclass requirements 
        # (until we fully refactor models.py, we safely duplicate fields)
        return CareerMatch(
            career_name=career_name,
            career_data=career,
            match_score=scores["match_score"],
            profile_match=scores["mind_aptitude"],     # Mapped
            riasec_match=scores["riasec_match"],
            subject_match=scores["academic_interest"], # Mapped
            interest_match=scores["body_work_style"],  # Mapped
            goal_match=scores["soul_values"],          # Mapped
            skill_match=scores["mind_aptitude"],       # Mapped
            location_match=50.0,                       # Deprecated
            confidence=scores["match_score"] / 100,
            reason=reason,
            strengths=strengths,
            improvement_areas=improvements,
            score_breakdown=scores["score_breakdown"]
        )
    
    def _compute_dot_product_riasec(self, persona: Dict, career: Dict) -> float:
        """
        Compute RIASEC match score (0-100) using dot product.
        (Student % * Career Weight)
        """
        riasec_profile = persona.get("riasec_profile", {})
        raw_scores = riasec_profile.get("scores", {}) # e.g. {"R": 28, "I": 21}
        
        if not raw_scores:
            return 0.0
            
        student_percentages = {}
        for code, full_name in self.trait_keys.items():
            raw = raw_scores.get(code, 0)
            # Find max questions to calculate percentage dynamically
            questions_list = self.riasec_questions.get(full_name, [])
            max_score = max(len(questions_list) * 5, 35) # Fallback to 35 if not found
            percentage = (raw / max_score) * 100
            student_percentages[code] = min(100.0, percentage)
            
        # Extract or synthesize career weights
        career_weights = {}
        if "riasec_weights" in career:
            career_weights = career["riasec_weights"]
        else:
            # Synthetic fallback based on tags
            tags = career.get("riasec_tags", [])
            # Map full names to letters if needed
            valid_tags = []
            for tag in tags:
                if tag in self.trait_keys:
                    valid_tags.append(tag)
                else:
                    # Reverse lookup
                    for k, v in self.trait_keys.items():
                        if v.lower() == tag.lower():
                            valid_tags.append(k)
            
            if not valid_tags:
                # If completely empty, generic fallback
                career_weights = {"R": 0.16, "I": 0.16, "A": 0.16, "S": 0.17, "E": 0.17, "C": 0.18}
            else:
                career_weights = {"R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0}
                if len(valid_tags) == 1:
                    career_weights[valid_tags[0]] = 1.0
                elif len(valid_tags) == 2:
                    career_weights[valid_tags[0]] = 0.60
                    career_weights[valid_tags[1]] = 0.40
                elif len(valid_tags) >= 3:
                    career_weights[valid_tags[0]] = 0.50
                    career_weights[valid_tags[1]] = 0.30
                    career_weights[valid_tags[2]] = 0.20
                    
        # Dot Product
        final_score = 0.0
        for code in ["R", "I", "A", "S", "E", "C"]:
            st_pct = student_percentages.get(code, 0.0)
            cw = float(career_weights.get(code, 0.0))
            final_score += (st_pct * cw)
            
        return min(100.0, final_score)

    def _compute_mind_aptitude(self, persona: Dict, career_text: str) -> float:
        """Compute Mind/Aptitude score (Traits + Strengths + Skills) (0-100)."""
        scores = []
        riasec_profile = persona.get("riasec_profile", {})
        academic = persona.get("academic_profile", {})
        
        traits = riasec_profile.get("traits", [])
        if traits:
            trait_tokens = normalize_tokens(traits)
            matches = sum(1 for token in trait_tokens if len(token) > 2 and token in career_text)
            scores.append((matches / len(trait_tokens)) * 100)
            
        strengths = academic.get("strengths", [])
        if strengths:
            str_tokens = normalize_tokens(strengths)
            matches = sum(1 for token in str_tokens if len(token) > 2 and token in career_text)
            scores.append((matches / len(str_tokens)) * 100)
            
        skills = academic.get("skills", [])
        if skills:
            skill_tokens = normalize_tokens(skills)
            matches = sum(1 for token in skill_tokens if len(token) > 2 and token in career_text)
            scores.append((matches / len(skill_tokens)) * 100)
            
        return sum(scores) / len(scores) if scores else 0.0

    def _compute_soul_values(self, persona: Dict, career_text: str) -> float:
        """Compute Soul/Values score (Goals/Aspirations) (0-100)."""
        interests_data = persona.get("interests", {})
        aspirations = interests_data.get("career_aspirations", [])
        if not aspirations:
            return 50.0 # Neutral baseline
            
        tokens = normalize_tokens(aspirations)
        matched = sum(1 for token in tokens if len(token) > 2 and token in career_text)
        return (matched / len(tokens)) * 100 if tokens else 50.0

    def _compute_body_work_style(self, persona: Dict, career_text: str) -> float:
        """Compute Body/Work Style score (Hobbies/Interests) (0-100)."""
        interests_data = persona.get("interests", {})
        interests = interests_data.get("interests", [])
        hobbies = interests_data.get("hobbies", [])
        all_interests = interests + hobbies
        
        if not all_interests:
            return 50.0 # Neutral baseline
            
        tokens = normalize_tokens(all_interests)
        matched = sum(1 for token in tokens if len(token) > 2 and token in career_text)
        return (matched / len(tokens)) * 100 if tokens else 50.0

    def _compute_academic_interest(self, persona: Dict, career_text: str) -> float:
        """Compute Academic Interest score (Subjects) (0-100)."""
        academic = persona.get("academic_profile", {})
        subjects = academic.get("subjects", [])
        if not subjects:
            return 50.0 # Neutral baseline
            
        matched = 0
        for subject in subjects:
            subject_lower = subject.lower()
            if subject_lower in career_text:
                matched += 1
                continue
            for keyword, category in FLAT_SUBJECT_KEYWORDS.items():
                if subject_lower in keyword or keyword in subject_lower:
                    if keyword in career_text:
                        matched += 0.5
                        break
                        
        return (matched / len(subjects)) * 100

    
    def _generate_explanation(self, persona: Dict, career: Dict, scores: Dict) -> Tuple[str, List[str], List[str]]:
        """Generate explanation for career recommendation."""
        career_name = get_career_name(career)
        riasec = persona.get("riasec_profile", {})
        
        reason_parts = []
        
        if scores["riasec_match"] > 60:
            primary = riasec.get("primary", "")
            reason_parts.append(f"Your {primary} personality type aligns exceptionally well with this career's core requirements.")
        
        if scores["mind_aptitude"] > 50:
            reason_parts.append("Your cognitive traits and skills are well-suited for this field.")
            
        if not reason_parts:
            reason_parts.append("This career is a strong match based on your overall profile, preferences, strengths, and career values.")
        
        reason = " ".join(reason_parts)
        
        # Generate strengths
        strengths = []
        traits = riasec.get("traits", [])
        if traits:
            strengths.append(f"Strong traits: {', '.join(traits[:2])}")
        
        if scores["academic_interest"] > 50:
            strengths.append("Solid academic alignment")
            
        if len(strengths) < 2:
            strengths.append("High overall compatibility")
            strengths.append("Aligned with career values")
        
        # Generate improvements
        improvements = []
        if scores["mind_aptitude"] < 40:
            improvements.append("Develop targeted industry skills")
            
        if scores["academic_interest"] < 40:
            improvements.append("Focus on relevant academic subjects")
            
        if len(improvements) == 0:
            improvements.append("Gain practical experience")
            
        return reason, strengths[:4], improvements[:3]


# Singleton instance
ranking_engine = RankingEngine()
