# core/education.py - Authoritative Class/Year options and validation
from typing import Optional, List, Dict, Any

# Supported Canonical Options by Group
CLASS_YEAR_GROUPS: List[Dict[str, Any]] = [
    {
        "group": "School",
        "options": [
            "7th",
            "8th",
            "9th",
            "10th",
            "11th",
            "12th"
        ]
    },
    {
        "group": "Undergraduate",
        "options": [
            "Undergraduate — 1st Year",
            "Undergraduate — 2nd Year",
            "Undergraduate — 3rd Year",
            "Undergraduate — 4th Year"
        ]
    },
    {
        "group": "Postgraduate",
        "options": [
            "Postgraduate — 1st Year",
            "Postgraduate — 2nd Year"
        ]
    },
    {
        "group": "Other",
        "options": [
            "Diploma",
            "Other"
        ]
    }
]

# Flat list of all supported canonical options
SUPPORTED_CLASS_YEAR_OPTIONS: List[str] = [
    # School
    "7th",
    "8th",
    "9th",
    "10th",
    "11th",
    "12th",
    # Undergraduate
    "Undergraduate — 1st Year",
    "Undergraduate — 2nd Year",
    "Undergraduate — 3rd Year",
    "Undergraduate — 4th Year",
    # Postgraduate
    "Postgraduate — 1st Year",
    "Postgraduate — 2nd Year",
    # Other
    "Diploma",
    "Other"
]

# Case-insensitive alias mapping for backward compatibility and normalization
CLASS_YEAR_ALIASES: Dict[str, str] = {
    # School
    "7": "7th",
    "7th": "7th",
    "class 7": "7th",
    "class 7th": "7th",
    "grade 7": "7th",
    "8": "8th",
    "8th": "8th",
    "class 8": "8th",
    "class 8th": "8th",
    "grade 8": "8th",
    "9": "9th",
    "9th": "9th",
    "class 9": "9th",
    "class 9th": "9th",
    "grade 9": "9th",
    "10": "10th",
    "10th": "10th",
    "class 10": "10th",
    "class 10th": "10th",
    "grade 10": "10th",
    "11": "11th",
    "11th": "11th",
    "class 11": "11th",
    "class 11th": "11th",
    "grade 11": "11th",
    "12": "12th",
    "12th": "12th",
    "class 12": "12th",
    "class 12th": "12th",
    "grade 12": "12th",
    # Undergraduate aliases
    "1st year college": "Undergraduate — 1st Year",
    "2nd year college": "Undergraduate — 2nd Year",
    "3rd year college": "Undergraduate — 3rd Year",
    "4th year college": "Undergraduate — 4th Year",
    "undergraduate - 1st year": "Undergraduate — 1st Year",
    "undergraduate - 2nd year": "Undergraduate — 2nd Year",
    "undergraduate - 3rd year": "Undergraduate — 3rd Year",
    "undergraduate - 4th year": "Undergraduate — 4th Year",
    "undergraduate — 1st year": "Undergraduate — 1st Year",
    "undergraduate — 2nd year": "Undergraduate — 2nd Year",
    "undergraduate — 3rd year": "Undergraduate — 3rd Year",
    "undergraduate — 4th year": "Undergraduate — 4th Year",
    "ug 1st year": "Undergraduate — 1st Year",
    "ug 2nd year": "Undergraduate — 2nd Year",
    "ug 3rd year": "Undergraduate — 3rd Year",
    "ug 4th year": "Undergraduate — 4th Year",
    # Postgraduate aliases
    "postgraduate - 1st year": "Postgraduate — 1st Year",
    "postgraduate - 2nd year": "Postgraduate — 2nd Year",
    "postgraduate — 1st year": "Postgraduate — 1st Year",
    "postgraduate — 2nd year": "Postgraduate — 2nd Year",
    "pg 1st year": "Postgraduate — 1st Year",
    "pg 2nd year": "Postgraduate — 2nd Year",
    # Other aliases
    "diploma": "Diploma",
    "polytechnic": "Diploma",
    "other": "Other"
}


def normalize_class_year(val: Optional[str]) -> Optional[str]:
    """
    Validate and normalize class/year string against the authoritative supported set.
    Returns the canonical string if valid, or None if invalid/unsupported.
    """
    if not val:
        return None
    cleaned = str(val).strip()
    if not cleaned:
        return None

    # Exact canonical match
    if cleaned in SUPPORTED_CLASS_YEAR_OPTIONS:
        return cleaned

    # Case-insensitive alias match
    normalized = CLASS_YEAR_ALIASES.get(cleaned.lower())
    if normalized:
        return normalized

    return None


def is_valid_class_year(val: Optional[str]) -> bool:
    """Check if class/year value is valid."""
    return normalize_class_year(val) is not None
