# core/config.py - Production-ready configuration
import os
from dataclasses import dataclass, field
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Config:
    """Application configuration - Production Ready."""
    
    # API Keys
    anthropic_api_key: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
    
    # Flask
    secret_key: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    flask_env: str = os.getenv("FLASK_ENV", "development")
    debug: bool = flask_env == "development"
    
    # Session
    session_lifetime_hours: int = int(os.getenv("SESSION_LIFETIME_HOURS", 2))
    
    # Ranking Weights - Configurable
    weight_profile_match: float = 0.25
    weight_riasec_match: float = 0.25
    weight_subject_match: float = 0.15
    weight_interest_match: float = 0.15
    weight_goal_match: float = 0.10
    weight_skill_match: float = 0.05
    weight_location_match: float = 0.05
    
    # Retrieval
    top_careers_per_pipeline: int = 6
    final_career_count: int = 6
    min_confidence_threshold: float = 15.0
    max_careers_in_prompt: int = 6
    
    # LLM - Production model
    llm_model: str = os.getenv("LLM_MODEL", "claude-sonnet-4-6")
    llm_max_tokens: int = int(os.getenv("LLM_MAX_TOKENS", 1200))
    llm_temperature: float = float(os.getenv("LLM_TEMPERATURE", 0.3))
    llm_top_p: float = float(os.getenv("LLM_TOP_P", 0.9))
    
    # Data Paths
    base_dir: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    career_db_path: str = os.path.join(base_dir, "Data.json")
    riasec_questions_path: str = os.path.join(base_dir, "riasec_questions.json")
    
    # Conversation
    max_chat_history: int = 12
    max_history_for_prompt: int = 8
    
    # Fallback
    enable_fallback: bool = True
    
    @classmethod
    def get_instance(cls) -> "Config":
        """Get singleton instance."""
        if not hasattr(cls, "_instance"):
            cls._instance = cls()
        return cls._instance


config = Config.get_instance()