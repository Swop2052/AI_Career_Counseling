# core/exceptions.py


class CareerGuidanceError(Exception):
    """Base exception for career guidance system."""
    pass


class IntentClassificationError(CareerGuidanceError):
    """Error during intent classification."""
    pass


class PersonaGenerationError(CareerGuidanceError):
    """Error during persona generation."""
    pass


class RetrievalError(CareerGuidanceError):
    """Error during career retrieval."""
    pass


class RankingError(CareerGuidanceError):
    """Error during career ranking."""
    pass


class LLMError(CareerGuidanceError):
    """Error during LLM interaction."""
    pass


class ValidationError(CareerGuidanceError):
    """Error during response validation."""
    pass


class DataLoadError(CareerGuidanceError):
    """Error loading data."""
    pass


class ConfigurationError(CareerGuidanceError):
    """Error in configuration."""
    pass