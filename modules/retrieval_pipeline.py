# modules/retrieval_pipeline.py - Production Retrieval Pipeline
from typing import List, Dict, Any, Set
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
            # Scan and score all careers in the database to find the absolute best matches
            ranked_careers = self._rerank_careers(persona, career_database)
            
            # Filter by threshold and take top N
            final_careers = self._filter_and_select(
                ranked_careers, self.final_count
            )
            
            # Convert to CareerMatch objects
            return self._to_career_matches(persona, final_careers)
            
        except Exception as e:
            raise RetrievalError(f"Retrieval pipeline failed: {str(e)}")
    
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