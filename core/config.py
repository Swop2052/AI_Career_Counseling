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
    razorpay_key_id: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_mockkey")
    razorpay_key_secret: str = os.getenv("RAZORPAY_KEY_SECRET", "rzp_test_mocksecret")
    
    # Flask
    flask_env: str = os.getenv("FLASK_ENV", "development")
    secret_key: str = os.getenv("SECRET_KEY", "")
    cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    
    def __post_init__(self):
        if not self.secret_key:
            if self.flask_env == "production":
                raise ValueError("SECRET_KEY environment variable is missing in production!")
            else:
                self.secret_key = os.urandom(24).hex()
                
    debug: bool = flask_env == "development"
    
    # Session
    session_lifetime_hours: int = int(os.getenv("SESSION_LIFETIME_HOURS", 1))
    
    # Ranking Weights - Psychometric 5-Factor Model
    weight_riasec_match: float = 0.50
    weight_mind_aptitude: float = 0.20
    weight_soul_values: float = 0.10
    weight_body_work_style: float = 0.10
    weight_academic_interest: float = 0.10
    
    # Retrieval
    use_llm_retrieval: bool = os.getenv("USE_LLM_RETRIEVAL", "true").lower() == "true"
    top_careers_per_pipeline: int = 6
    final_career_count: int = 6
    min_confidence_threshold: float = 15.0
    max_careers_in_prompt: int = 6
    
    # LLM - Production model
    llm_model: str = os.getenv("LLM_MODEL", "claude-haiku-4-5-20251001")
    llm_max_tokens: int = int(os.getenv("LLM_MAX_TOKENS", 1200))
    llm_temperature: float = float(os.getenv("LLM_TEMPERATURE", 0.3))
    llm_top_p: float = float(os.getenv("LLM_TOP_P", 0.9))
    
    # Data Paths
    base_dir: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    career_db_path: str = os.path.join(base_dir, "Data.json")
    riasec_questions_path: str = os.path.join(base_dir, "questions", "english.json")

    db_path: str = os.path.join(base_dir, "data", "career_guide.db")
    db_name: str = os.getenv("DB_NAME", "skillsense")
    db_port: str = os.getenv("DB_PORT", "5432")
    db_host: str = os.getenv("DB_HOST", "localhost")
    db_user: str = os.getenv("DB_USER", "postgres")
    db_password: str = os.getenv("DB_PASSWORD", "postgres")

    @property
    def database_url(self) -> str:
        env_url = os.getenv("DATABASE_URL")
        if env_url:
            return env_url
        import urllib.parse
        encoded_pwd = urllib.parse.quote_plus(self.db_password)
        host = "127.0.0.1" if self.db_host in ("localhost", "127.0.0.1") else self.db_host
        return f"postgresql://{self.db_user}:{encoded_pwd}@{host}:{self.db_port}/{self.db_name}?connect_timeout=5"
    db_retention_hours: int = int(os.getenv("DB_RETENTION_HOURS", 24))
    
    # Conversation
    max_chat_history: int = 12
    max_history_for_prompt: int = 4
    
    # Fallback
    enable_fallback: bool = True
    
    @classmethod
    def get_instance(cls) -> "Config":
        """Get singleton instance."""
        if not hasattr(cls, "_instance"):
            cls._instance = cls()
        return cls._instance


config = Config.get_instance()