# modules/retrieval_pipeline.py - Production Retrieval Pipeline
from typing import List, Dict, Any, Set
import json
import re
from core.config import config
from core.models import CareerMatch
from core.utils import get_career_name, extract_text_from_career
from modules.ranking_engine import ranking_engine
from core.exceptions import RetrievalError


class RetrievalPipeline:
    """
    Career retrieval pipeline with multi-strategy retrieval and reranking.
    
    Strategy:
    1. Profile-based retrieval: Top careers by profile match
    2. RIASEC-based retrieval: Top careers by RIASEC match
    3. Merge and deduplicate
    4. Rerank using weighted scoring
    5. Return top N careers
    """
    
    def __init__(self):
        self.top_per_pipeline = config.top_careers_per_pipeline
        self.final_count = config.final_career_count
        self.min_threshold = config.min_confidence_threshold
    
    def retrieve(
        self,
        persona: Dict,
        career_database: List[Dict],
        user_message: str = None
    ) -> List[CareerMatch]:
        """
        Retrieve and rank careers by scoring the entire career database.
        
        Args:
            persona: Student persona
            career_database: List of all careers
            user_message: Optional user message for context
            
        Returns:
            List of CareerMatch objects, ranked by relevance
        """
        if not career_database:
            return []
        
        try:
            # 1. Attempt LLM-based career selection
            llm_selected_careers = self._retrieve_via_llm(persona, career_database)
            
            if llm_selected_careers:
                print(f"🔮 LLM successfully retrieved {len(llm_selected_careers)} matching careers!")
                # Compute scores for the selected careers
                scored_llm_careers = []
                for career in llm_selected_careers:
                    scores = ranking_engine.compute_scores(persona, career)
                    scored_llm_careers.append({
                        "career": career,
                        "scores": scores,
                        "total_score": scores["match_score"]
                    })
                # Sort the list by match score descending so that the highest matches show first
                scored_llm_careers.sort(key=lambda x: x["total_score"], reverse=True)
                return self._to_career_matches(persona, scored_llm_careers)
            
            # 2. Fallback to heuristic ranking if LLM fails or returns empty
            print("⚠️ LLM retrieval returned empty or failed. Falling back to heuristic ranking...")
            ranked_careers = self._rerank_careers(persona, career_database)
            final_careers = self._filter_and_select(ranked_careers, self.final_count)
            return self._to_career_matches(persona, final_careers)
            
        except Exception as e:
            try:
                print(f"⚠️ Retrieval exception: {e}. Attempting heuristic fallback...")
                ranked_careers = self._rerank_careers(persona, career_database)
                final_careers = self._filter_and_select(ranked_careers, self.final_count)
                return self._to_career_matches(persona, final_careers)
            except Exception as inner_e:
                raise RetrievalError(f"Retrieval pipeline failed: {str(inner_e)}")

    def _retrieve_via_llm(self, persona: Dict, career_database: List[Dict]) -> List[Dict]:
        """Use Anthropic LLM (Claude) to retrieve the top 6 careers matching the student persona."""
        from modules.llm_engine import nova
        
        # Extract all career names
        all_names = [c.get('career_name') for c in career_database if c.get('career_name')]
        if not all_names:
            return []
            
        # Build prompt for LLM
        prompt = self._build_llm_retrieval_prompt(persona, all_names)
        
        # System instructions specifically for clean selection
        system_prompt = (
            "You are a Career Retrieval Engine. Your task is to select exactly 6 careers "
            "matching the student's profile: 3 based on their personal/academic profile and preferences, "
            "and 3 based on their RIASEC psychometric test results. You must return ONLY a raw JSON object "
            "with keys 'profile_matches' and 'riasec_matches', containing lists of exact career names. "
            "Do not include markdown codeblocks, explanations, or any other text."
        )
        
        try:
            response_text = nova.generate_response(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.1
            )
            
            # Clean response text from potential markdown wrappers
            clean_text = response_text.strip()
            if clean_text.startswith("```"):
                # Remove starting and ending markdown blocks
                clean_text = re.sub(r"^```(?:json)?\n", "", clean_text)
                clean_text = re.sub(r"\n```$", "", clean_text)
                clean_text = clean_text.strip()
                
            try:
                data = json.loads(clean_text)
                profile_names = data.get("profile_matches", [])
                riasec_names = data.get("riasec_matches", [])
                
                # Resolve names to careers
                def resolve_names(names):
                    resolved = []
                    for name in names:
                        name_lower = str(name).strip().lower()
                        matched = False
                        
                        # Try exact match first
                        for career in career_database:
                            c_name = career.get('career_name', '')
                            if c_name.strip().lower() == name_lower:
                                if career not in resolved:
                                    resolved.append(career)
                                matched = True
                                break
                                
                        if not matched:
                            # Try substring/partial match
                            for career in career_database:
                                c_name = career.get('career_name', '')
                                if name_lower in c_name.lower() or c_name.lower() in name_lower:
                                    if career not in resolved:
                                        resolved.append(career)
                                    break
                    return resolved

                resolved_profile = resolve_names(profile_names)[:3]
                resolved_riasec = resolve_names(riasec_names)[:3]
                
                # Merge the lists, ensuring unique careers
                final_list = []
                for c in resolved_profile:
                    if c not in final_list:
                        final_list.append(c)
                for c in resolved_riasec:
                    if c not in final_list:
                        final_list.append(c)
                        
                if len(final_list) > 0:
                    return final_list[:self.final_count]
            except Exception as parse_err:
                print(f"⚠️ Failed to parse LLM career retrieval response: {parse_err}")
                print(f"Raw Response: {response_text}")
                
        except Exception as llm_err:
            print(f"❌ LLM career retrieval invocation failed: {llm_err}")
            
        return []

    def _build_llm_retrieval_prompt(self, persona: Dict, all_career_names: List[str]) -> str:
        """Build prompt for 50/50 LLM career retrieval."""
        student_info = persona.get("student_info", {})
        academic = persona.get("academic_profile", {})
        interests = persona.get("interests", {})
        riasec = persona.get("riasec_profile", {})
        preferences = persona.get("preferences", {})
        
        # Build student profile context
        lines = ["=== STUDENT PERSONAL & ACADEMIC PROFILE ==="]
        lines.append(f"Name: {student_info.get('name', 'Student')}")
        lines.append(f"Age: {student_info.get('age', 'Not specified')}")
        lines.append(f"Class: {student_info.get('class', 'Not specified')}")
        lines.append(f"Stream: {student_info.get('stream', 'Not specified')}")
        
        if academic.get('subjects'):
            lines.append(f"Favorite Subjects: {', '.join(academic['subjects'])}")
        if academic.get('weak_subjects'):
            lines.append(f"Challenging Subjects: {', '.join(academic['weak_subjects'])}")
        if academic.get('strengths'):
            lines.append(f"Natural Strengths: {', '.join(academic['strengths'])}")
        if academic.get('skills'):
            lines.append(f"Skills: {', '.join(academic['skills'])}")
            
        if interests.get('interests'):
            lines.append(f"Interests: {', '.join(interests['interests'])}")
        if interests.get('hobbies'):
            lines.append(f"Hobbies: {', '.join(interests['hobbies'])}")
        if interests.get('career_aspirations'):
            lines.append(f"Career Aspirations: {', '.join(interests['career_aspirations'])}")
            
        lines.append("\n=== STUDENT PREFERENCES & LOCATION ===")
        lines.append(f"State/City Location: {preferences.get('student_location', 'Not specified')}")
        lines.append(f"Preferred College Type/Range: {preferences.get('college_range', 'Not specified')}")
        lines.append(f"Preferred Location Scope: {preferences.get('location_preference', 'Not specified')}")
        lines.append(f"Budget Preference: {preferences.get('budget_preference', 'Not specified')}")
        lines.append(f"Learning Mode: {preferences.get('learning_mode', 'Not specified')}")
        
        lines.append("\n=== STUDENT RIASEC PSYCHOMETRIC TEST PROFILE ===")
        lines.append(f"RIASEC Code: {riasec.get('code', '')}")
        lines.append(f"Primary Type: {riasec.get('primary', '')}")
        lines.append(f"Secondary Type: {riasec.get('secondary', '')}")
        lines.append(f"Tertiary Type: {riasec.get('tertiary', '')}")
        if riasec.get('traits'):
            lines.append(f"Personality Traits: {', '.join(riasec['traits'])}")
            
        lines.append("\n=== AVAILABLE CAREERS IN DATABASE ===")
        lines.append(", ".join(sorted(all_career_names)))
        
        lines.append("\n=== INSTRUCTION ===")
        lines.append(
            "Based on the data above, select exactly 6 careers from the list of available careers in the database. "
            "You must select exactly:\n"
            "1. Three (3) careers that match the student's personal/academic profile, natural strengths, hobbies, interests, location and budget preferences best.\n"
            "2. Three (3) careers that match the student's RIASEC test profile and personality traits best.\n\n"
            "Return ONLY a raw JSON object containing these two lists, matching this exact structure:\n"
            "{\n"
            "  \"profile_matches\": [\"Career 1\", \"Career 2\", \"Career 3\"],\n"
            "  \"riasec_matches\": [\"Career 4\", \"Career 5\", \"Career 6\"]\n"
            "}\n"
            "Do not include any codeblocks (like ```json), introduction, or other text."
        )
        
        return "\n".join(lines)
    
    def _retrieve_by_profile(
        self,
        persona: Dict,
        careers: List[Dict]
    ) -> List[Dict]:
        """Retrieve careers by profile match."""
        scored_careers = []
        
        for career in careers:
            career_text = extract_text_from_career(career)
            profile_score = ranking_engine._compute_profile_match(persona, career_text)
            
            if profile_score > 10:  # Minimum threshold
                scored_careers.append({
                    "career": career,
                    "score": profile_score,
                    "type": "profile"
                })
        
        scored_careers.sort(key=lambda x: x["score"], reverse=True)
        return [item["career"] for item in scored_careers[:self.top_per_pipeline]]
    
    def _retrieve_by_riasec(
        self,
        persona: Dict,
        careers: List[Dict]
    ) -> List[Dict]:
        """Retrieve careers by RIASEC match."""
        riasec_profile = persona.get("riasec_profile", {})
        riasec_code = riasec_profile.get("code", "")
        
        if not riasec_code:
            return []
        
        scored_careers = []
        
        for career in careers:
            career_text = extract_text_from_career(career)
            riasec_score = ranking_engine._compute_riasec_match(persona, career_text)
            
            if riasec_score > 10:  # Minimum threshold
                scored_careers.append({
                    "career": career,
                    "score": riasec_score,
                    "type": "riasec"
                })
        
        scored_careers.sort(key=lambda x: x["score"], reverse=True)
        return [item["career"] for item in scored_careers[:self.top_per_pipeline]]
    
    def _merge_and_deduplicate(
        self,
        list1: List[Dict],
        list2: List[Dict]
    ) -> List[Dict]:
        """Merge two career lists and remove duplicates."""
        seen_names: Set[str] = set()
        merged = []
        
        for career in list1 + list2:
            name = get_career_name(career)
            if name and name not in seen_names:
                seen_names.add(name)
                merged.append(career)
        
        return merged
    
    def _rerank_careers(
        self,
        persona: Dict,
        careers: List[Dict]
    ) -> List[Dict]:
        """Rerank careers using weighted scoring."""
        ranked = []
        
        for career in careers:
            scores = ranking_engine.compute_scores(persona, career)
            ranked.append({
                "career": career,
                "scores": scores,
                "total_score": scores["match_score"]
            })
        
        ranked.sort(key=lambda x: x["total_score"], reverse=True)
        return ranked
    
    def _filter_and_select(
        self,
        ranked: List[Dict],
        top_n: int
    ) -> List[Dict]:
        """Filter by threshold and select top N."""
        selected = []
        
        # First pass: include careers above threshold
        for item in ranked:
            if item["total_score"] >= self.min_threshold:
                selected.append(item)
                if len(selected) >= top_n:
                    break
        
        # Second pass: if not enough, include more regardless of threshold
        if len(selected) < top_n:
            for item in ranked:
                if item not in selected:
                    selected.append(item)
                    if len(selected) >= top_n:
                        break
        
        return selected
    
    def _to_career_matches(
        self,
        persona: Dict,
        ranked_careers: List[Dict]
    ) -> List[CareerMatch]:
        """Convert ranked careers to CareerMatch objects."""
        matches = []
        
        for item in ranked_careers:
            career = item["career"]
            scores = item["scores"]
            
            match = ranking_engine.create_career_match(persona, career, scores)
            matches.append(match)
        
        return matches


# Singleton instance
retrieval_pipeline = RetrievalPipeline()