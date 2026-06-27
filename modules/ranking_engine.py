# modules/ranking_engine.py - Weighted Ranking Engine
from typing import Dict, List, Any, Optional, Tuple
from core.config import config
from core.constants import RIASEC_KEYWORDS, FLAT_SUBJECT_KEYWORDS
from core.models import CareerMatch
from core.utils import normalize_tokens, extract_text_from_career, get_career_name
from core.exceptions import RankingError


class RankingEngine:
    """
    Weighted ranking engine for career matching with explainable scores.
    Computes independent scores and produces final confidence.
    """
    
    def __init__(self):
        self.weights = {
            "profile_match": config.weight_profile_match,
            "riasec_match": config.weight_riasec_match,
            "subject_match": config.weight_subject_match,
            "interest_match": config.weight_interest_match,
            "goal_match": config.weight_goal_match,
            "skill_match": config.weight_skill_match,
            "location_match": config.weight_location_match
        }
        
        # Validate weights sum to 1
        total = sum(self.weights.values())
        if abs(total - 1.0) > 0.01:
            print(f"⚠️ Warning: Weights sum to {total}, normalizing...")
            for key in self.weights:
                self.weights[key] = self.weights[key] / total
    
    def compute_scores(self, persona: Dict, career: Dict) -> Dict:
        """
        Compute all match scores for a career.
        
        Returns:
            Dict with all individual scores and final match score
        """
        career_text = extract_text_from_career(career)
        
        # Compute individual scores (0-100)
        profile_score = self._compute_profile_match(persona, career_text)
        riasec_score = self._compute_riasec_match(persona, career_text)
        subject_score = self._compute_subject_match(persona, career_text)
        interest_score = self._compute_interest_match(persona, career_text)
        goal_score = self._compute_goal_match(persona, career_text)
        skill_score = self._compute_skill_match(persona, career_text)
        location_score = self._compute_location_match(persona, career)
        
        # Apply preference bonuses and penalties
        preference_bonus = self._compute_preference_bonus(persona, career)
        weak_subject_penalty = self._compute_weak_subject_penalty(persona, career_text)
        
        # Calculate weighted total
        total = (
            profile_score * self.weights["profile_match"] +
            riasec_score * self.weights["riasec_match"] +
            subject_score * self.weights["subject_match"] +
            interest_score * self.weights["interest_match"] +
            goal_score * self.weights["goal_match"] +
            skill_score * self.weights["skill_match"] +
            location_score * self.weights["location_match"]
        )
        
        # Apply bonus and penalty
        total = total + (preference_bonus * 0.05) - (weak_subject_penalty * 0.12)
        total = max(0, min(100, total))
        
        return {
            "match_score": round(total, 2),
            "profile_match": round(profile_score, 2),
            "riasec_match": round(riasec_score, 2),
            "subject_match": round(subject_score, 2),
            "interest_match": round(interest_score, 2),
            "goal_match": round(goal_score, 2),
            "skill_match": round(skill_score, 2),
            "location_match": round(location_score, 2),
            "preference_bonus": round(preference_bonus, 2),
            "weak_subject_penalty": round(weak_subject_penalty, 2),
            "score_breakdown": {
                "profile": profile_score,
                "riasec": riasec_score,
                "subject": subject_score,
                "interest": interest_score,
                "goal": goal_score,
                "skill": skill_score,
                "location": location_score
            }
        }
    
    def create_career_match(self, persona: Dict, career: Dict, scores: Dict) -> CareerMatch:
        """Create a CareerMatch object with explanation."""
        career_name = get_career_name(career)
        reason, strengths, improvements = self._generate_explanation(persona, career, scores)
        
        return CareerMatch(
            career_name=career_name,
            career_data=career,
            match_score=scores["match_score"],
            profile_match=scores["profile_match"],
            riasec_match=scores["riasec_match"],
            subject_match=scores["subject_match"],
            interest_match=scores["interest_match"],
            goal_match=scores["goal_match"],
            skill_match=scores["skill_match"],
            location_match=scores["location_match"],
            confidence=scores["match_score"] / 100,
            reason=reason,
            strengths=strengths,
            improvement_areas=improvements,
            score_breakdown=scores["score_breakdown"]
        )
    
    def _compute_profile_match(self, persona: Dict, career_text: str) -> float:
        """Compute overall profile match score (0-100)."""
        scores = []
        
        # Trait match
        riasec_profile = persona.get("riasec_profile", {})
        traits = riasec_profile.get("traits", [])
        if traits:
            trait_tokens = normalize_tokens(traits)
            trait_matches = sum(1 for token in trait_tokens if len(token) > 2 and token in career_text)
            trait_score = (trait_matches / len(trait_tokens)) * 100 if trait_tokens else 0
            scores.append(trait_score * 0.4)
        
        # Strength match
        academic = persona.get("academic_profile", {})
        strengths = academic.get("strengths", [])
        if strengths:
            strength_tokens = normalize_tokens(strengths)
            strength_matches = sum(1 for token in strength_tokens if len(token) > 2 and token in career_text)
            strength_score = (strength_matches / len(strength_tokens)) * 100 if strength_tokens else 0
            scores.append(strength_score * 0.3)
        
        # Hobby match
        interests_data = persona.get("interests", {})
        hobbies = interests_data.get("hobbies", [])
        if hobbies:
            hobby_tokens = normalize_tokens(hobbies)
            hobby_matches = sum(1 for token in hobby_tokens if len(token) > 2 and token in career_text)
            hobby_score = (hobby_matches / len(hobby_tokens)) * 100 if hobby_tokens else 0
            scores.append(hobby_score * 0.3)
        
        return sum(scores) if scores else 0
    
    def _compute_riasec_match(self, persona: Dict, career_text: str) -> float:
        """Compute RIASEC match score (0-100)."""
        riasec_profile = persona.get("riasec_profile", {})
        code = riasec_profile.get("code", "")
        if not code or len(code) < 1:
            return 0
        
        code_chars = code[:3] if len(code) >= 3 else code
        
        # Weighted scoring for top 3 codes
        code_weights = {}
        for i, c in enumerate(code_chars):
            if i == 0:
                code_weights[c] = 50
            elif i == 1:
                code_weights[c] = 30
            elif i == 2:
                code_weights[c] = 20
            else:
                code_weights[c] = 10
        
        total_weight = sum(code_weights.values())
        if total_weight == 0:
            return 0
        
        matched_weight = 0
        for code_char, weight in code_weights.items():
            keywords = RIASEC_KEYWORDS.get(code_char, [])
            for keyword in keywords:
                if keyword in career_text:
                    matched_weight += weight
                    break
        
        return (matched_weight / total_weight) * 100
    
    def _compute_subject_match(self, persona: Dict, career_text: str) -> float:
        """Compute subject match score (0-100)."""
        academic = persona.get("academic_profile", {})
        subjects = academic.get("subjects", [])
        if not subjects:
            return 0
        
        matched = 0
        for subject in subjects:
            subject_lower = subject.lower()
            if subject_lower in career_text:
                matched += 1
                continue
            
            # Check subject category
            for keyword, category in FLAT_SUBJECT_KEYWORDS.items():
                if subject_lower in keyword or keyword in subject_lower:
                    if keyword in career_text:
                        matched += 0.5
                        break
        
        return (matched / len(subjects)) * 100
    
    def _compute_interest_match(self, persona: Dict, career_text: str) -> float:
        """Compute interest match score (0-100)."""
        interests_data = persona.get("interests", {})
        interests = interests_data.get("interests", [])
        hobbies = interests_data.get("hobbies", [])
        
        all_interests = interests + hobbies
        if not all_interests:
            return 0
        
        tokens = normalize_tokens(all_interests)
        matched = sum(1 for token in tokens if len(token) > 2 and token in career_text)
        
        return (matched / len(tokens)) * 100 if tokens else 0
    
    def _compute_goal_match(self, persona: Dict, career_text: str) -> float:
        """Compute career goal/aspiration match score (0-100)."""
        interests_data = persona.get("interests", {})
        aspirations = interests_data.get("career_aspirations", [])
        if not aspirations:
            return 0
        
        tokens = normalize_tokens(aspirations)
        matched = sum(1 for token in tokens if len(token) > 2 and token in career_text)
        
        return (matched / len(tokens)) * 100 if tokens else 0
    
    def _compute_skill_match(self, persona: Dict, career_text: str) -> float:
        """Compute skill match score (0-100)."""
        academic = persona.get("academic_profile", {})
        skills = academic.get("skills", [])
        strengths = academic.get("strengths", [])
        all_skills = skills + strengths
        
        if not all_skills:
            return 0
        
        tokens = normalize_tokens(all_skills)
        matched = sum(1 for token in tokens if len(token) > 2 and token in career_text)
        
        return (matched / len(tokens)) * 100 if tokens else 0
    
    def _compute_location_match(self, persona: Dict, career: Dict) -> float:
        """Compute location preference match score (0-100)."""
        preferences = persona.get("preferences", {})
        location = preferences.get("location_preference", "india")
        
        career_text = extract_text_from_career(career)
        
        location_keywords = {
            "india": ["india", "indian", "cbse", "state board", "national"],
            "local": ["local", "regional", "state", "district", "city"],
            "international": ["international", "global", "abroad", "overseas", "foreign"]
        }
        
        keywords = location_keywords.get(location, [])
        if not keywords:
            return 50
        
        matches = sum(1 for keyword in keywords if keyword in career_text)
        return 100 if matches > 0 else 0
    
    def _compute_preference_bonus(self, persona: Dict, career: Dict) -> float:
        """Compute preference bonus (0-100)."""
        preferences = persona.get("preferences", {})
        checks = 0
        score = 0
        
        learning_mode = preferences.get("learning_mode", "").lower().strip()
        budget = preferences.get("budget_preference", "").lower().strip()
        
        career_text = extract_text_from_career(career)
        
        # Learning mode bonus
        if learning_mode:
            checks += 1
            if learning_mode == "distance":
                if any(k in career_text for k in ["online", "distance", "remote", "correspondence"]):
                    score += 1
            elif learning_mode == "offline":
                if any(k in career_text for k in ["lab", "campus", "field", "hands-on", "clinical"]):
                    score += 1
            elif learning_mode == "hybrid":
                online = any(k in career_text for k in ["online", "distance", "remote"])
                offline = any(k in career_text for k in ["lab", "campus", "hands-on", "field"])
                if online and offline:
                    score += 1
        
        # Budget bonus
        if budget:
            checks += 1
            if budget == "budget_sensitive":
                if "scholarship" in career_text or "government" in career_text:
                    score += 1
            elif budget in ["moderate", "no_constraint"]:
                score += 1
        
        return (score / checks) * 100 if checks > 0 else 0
    
    def _compute_weak_subject_penalty(self, persona: Dict, career_text: str) -> float:
        """Compute penalty for careers tied to weak subjects (0-100)."""
        academic = persona.get("academic_profile", {})
        weak_subjects = academic.get("weak_subjects", [])
        if not weak_subjects:
            return 0
        
        hits = 0
        for subject in weak_subjects:
            if len(subject) > 2 and subject.lower() in career_text:
                hits += 1
        
        return (hits / len(weak_subjects)) * 100 if weak_subjects else 0
    
    def _generate_explanation(self, persona: Dict, career: Dict, scores: Dict) -> Tuple[str, List[str], List[str]]:
        """Generate explanation for career recommendation."""
        career_name = get_career_name(career)
        riasec = persona.get("riasec_profile", {})
        
        reason_parts = []
        
        # RIASEC match
        if scores["riasec_match"] > 60:
            code = riasec.get("code", "")
            primary = riasec.get("primary", "")
            reason_parts.append(f"Your {primary} personality type (RIASEC: {code}) aligns well with this career")
        
        # Subject match
        if scores["subject_match"] > 50:
            reason_parts.append("Your favorite subjects are relevant to this field")
        
        # Interest match
        if scores["interest_match"] > 50:
            reason_parts.append("This career matches your stated interests")
        
        # Goal match
        if scores["goal_match"] > 50:
            reason_parts.append("This aligns with your career aspirations")
        
        # Profile match
        if scores["profile_match"] > 50:
            reason_parts.append("Your personality traits and strengths are well-suited for this career")
        
        if not reason_parts:
            reason_parts.append("This career shows potential based on your overall profile")
        
        reason = " ".join(reason_parts)
        
        # Generate strengths
        strengths = []
        academic = persona.get("academic_profile", {})
        traits = riasec.get("traits", [])
        
        trait_strength_map = {
            "Analytical": "Strong analytical thinking",
            "Research Oriented": "Research aptitude",
            "Curious": "Natural curiosity and learning ability",
            "Practical": "Practical, hands-on approach",
            "Hands-on": "Tactical, hands-on skills",
            "Mechanical": "Mechanical aptitude",
            "Creative": "Creativity and innovation",
            "Innovative": "Innovative thinking",
            "Expressive": "Strong expression skills",
            "Helpful": "Desire to help others",
            "Empathetic": "Empathy and understanding",
            "Collaborative": "Strong collaboration skills",
            "Leadership": "Leadership ability",
            "Persuasive": "Persuasion skills",
            "Goal Oriented": "Goal-driven mindset",
            "Organized": "Organizational skills",
            "Detail Oriented": "Attention to detail",
            "Structured": "Systematic approach"
        }
        
        for trait in traits[:3]:
            if trait in trait_strength_map:
                strengths.append(trait_strength_map[trait])
        
        subjects = academic.get("subjects", [])
        if subjects:
            strengths.append(f"Strong foundation in {', '.join(subjects[:2])}")
        
        if len(strengths) < 2:
            strengths.append("Relevant personality traits for this career")
        
        # Generate improvement areas
        improvements = []
        weak_subjects = academic.get("weak_subjects", [])
        if weak_subjects:
            improvements.append(f"Strengthen {', '.join(weak_subjects[:2])}")
        
        if scores["riasec_match"] < 40:
            improvements.append("Consider developing more RIASEC-aligned skills")
        
        if scores["skill_match"] < 30:
            improvements.append("Develop relevant technical skills through courses")
        
        if len(improvements) < 1:
            improvements.append("Gain practical experience through internships or projects")
        
        return reason, strengths[:4], improvements[:3]


# Singleton instance
ranking_engine = RankingEngine()