# core/utils.py
import re
import json
from typing import List, Dict, Any, Optional, Union
from core.constants import FLAT_SUBJECT_KEYWORDS


def normalize_text(text: str) -> str:
    """Normalize text for matching."""
    if not text:
        return ""
    return re.sub(r"[^a-z0-9\s]", " ", str(text).lower()).strip()


def normalize_tokens(value: Any) -> List[str]:
    """Convert free-text/list input into normalized searchable tokens."""
    if value is None:
        return []
    
    if isinstance(value, list):
        raw = " ".join([str(item) for item in value if item is not None])
    else:
        raw = str(value)
    
    raw = raw.replace("/", " ").replace("-", " ").replace("&", " ")
    parts = [p.strip().lower() for p in re.split(r"[,;]", raw) if p.strip()]
    
    tokens = []
    for part in parts:
        tokens.append(part)
        words = [w for w in re.split(r"\s+", part) if len(w) > 2]
        tokens.extend(words)
    
    # Keep order stable while removing duplicates
    return list(dict.fromkeys(tokens))


def stringify_list(values: Any) -> List[str]:
    """Convert various input types to list of strings."""
    if not values:
        return []
    if isinstance(values, str):
        values = [values]
    result = []
    for value in values:
        if value is None:
            continue
        if isinstance(value, (dict, list)):
            result.append(json.dumps(value, ensure_ascii=False))
        else:
            text = str(value).strip()
            if text:
                result.append(text)
    return result


def extract_text_from_career(career: Dict) -> str:
    """Extract all text from a career for matching."""
    text_parts = []
    
    name = career.get("career_name", "")
    if name:
        text_parts.append(name.lower())
    
    desc = career.get("description", "")
    if desc:
        text_parts.append(desc.lower()[:500])
    
    traits = career.get("personality_traits", [])
    if traits and isinstance(traits, list):
        text_parts.extend([t.lower() for t in traits if isinstance(t, str)])
    
    ai_data = career.get("ai_insights", {})
    if ai_data and isinstance(ai_data, dict):
        future = ai_data.get("future_scope", "")
        if future:
            text_parts.append(future.lower()[:200])
        tech = ai_data.get("emerging_technologies", [])
        if tech and isinstance(tech, list):
            text_parts.extend([t.lower() for t in tech[:3] if isinstance(t, str)])
    
    return " ".join(text_parts)


def get_career_name(career: Dict) -> str:
    """Extract career name from career data."""
    if not isinstance(career, dict):
        return ""
    
    if isinstance(career.get("career_name"), str) and career.get("career_name", "").strip():
        return career["career_name"].strip()
    
    career_data = career.get("career_data", {})
    if isinstance(career_data, dict):
        name = career_data.get("career_name", "")
        if isinstance(name, str) and name.strip():
            return name.strip()
    
    return ""


def get_career_display_name(career: Dict) -> str:
    """Get display name for a career entry."""
    if isinstance(career, dict):
        if isinstance(career.get("career_data"), dict):
            return career["career_data"].get("career_name", "")
        return career.get("career_name", "")
    return ""


def find_subject_category(subject: str) -> Optional[str]:
    """Find the category of a subject."""
    subject_lower = subject.lower()
    for keyword, category in FLAT_SUBJECT_KEYWORDS.items():
        if subject_lower in keyword or keyword in subject_lower:
            return category
    return None


def safe_get(data: Dict, key: str, default: Any = None) -> Any:
    """Safely get a value from a dictionary."""
    if not isinstance(data, dict):
        return default
    return data.get(key, default)


def safe_get_nested(data: Dict, keys: List[str], default: Any = None) -> Any:
    """Safely get a nested value from a dictionary."""
    for key in keys:
        if not isinstance(data, dict):
            return default
        data = data.get(key)
        if data is None:
            return default
    return data