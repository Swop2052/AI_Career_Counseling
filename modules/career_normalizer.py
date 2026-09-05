# modules/career_normalizer.py - Normalization utilities for career records
import json
from typing import Any, Dict


def has_content(value: Any) -> bool:
    """Return True when a value contains meaningful data."""
    if value is None:
        return False
    if isinstance(value, bool):
        return True
    if isinstance(value, (int, float)):
        return True
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (list, tuple, set)):
        return len(value) > 0
    if isinstance(value, dict):
        return bool(value)
    return True


def normalize_career_value(value: Any) -> Any:
    """Recursively normalize career values while preserving meaningful nested content."""
    if value is None:
        return None

    if isinstance(value, dict):
        normalized = {}
        for key, item in value.items():
            normalized_item = normalize_career_value(item)
            if has_content(normalized_item):
                normalized[key] = normalized_item
        return normalized

    if isinstance(value, list):
        normalized_items = []
        for item in value:
            normalized_item = normalize_career_value(item)
            if has_content(normalized_item):
                normalized_items.append(normalized_item)
        return normalized_items

    if isinstance(value, str):
        return value.strip()

    return value


def normalize_career_record(career: Any) -> Dict[str, Any]:
    """Normalize career data for frontend display while preserving all present JSON fields."""
    if not isinstance(career, dict):
        return {}

    normalized = {}
    for key, value in career.items():
        if key in ['pages', 'source_page', 'source_pages', 'ranking_information', 'reference_ranking_website']:
            continue
        normalized[key] = normalize_career_value(value)

    aliases = {
        'career_name': ['career_name', 'name', 'career'],
        'description': ['description', 'overview', 'summary', 'about'],
        'personality_traits': ['personality_traits', 'traits', 'personality'],
        'educational_pathway': ['educational_pathway', 'education_pathway', 'pathway', 'academic_pathway'],
        'entrance_exams': ['entrance_exams', 'exam_requirements', 'entrance_tests'],
        'course_fee': ['course_fee', 'fees', 'tuition_fee'],
        'expected_income': ['expected_income', 'salary', 'income'],
        'scholarships': ['scholarships', 'financial_aid'],
        'loans': ['loans', 'education_loans'],
        'where_will_you_study': ['where_will_you_study', 'institutes', 'institutions', 'study_institutes'],
        'where_will_you_work': ['where_will_you_work', 'work_places', 'work_locations', 'work_environment'],
        'growth_path': ['growth_path', 'expected_growth_path', 'career_growth_path', 'career_progression'],
        'related_careers': ['related_careers', 'related_fields', 'adjacent_careers'],
        'differently_abled_opportunities': ['differently_abled_opportunities', 'accessible_opportunities'],
        'entrepreneurship': ['entrepreneurship', 'entrepreneurial_opportunities'],
        'ai_insights': ['ai_insights', 'insights', 'future_insights'],
        'success_story': ['success_story', 'example_from_field', 'career_story'],
    }

    # Custom merge for where_will_you_work to prevent data loss
    if 'where_will_you_work' not in normalized:
        places = normalized.get('places_of_work') or normalized.get('work_places')
        env = normalized.get('work_environment') or normalized.get('environment')
        diff_abled = normalized.get('differently_abled_opportunities')
        
        if places or env or diff_abled is not None:
            normalized['where_will_you_work'] = {}
            if places:
                normalized['where_will_you_work']['places_of_work'] = places
            if env:
                if isinstance(env, dict):
                    normalized['where_will_you_work']['work_environment'] = env
                else:
                    normalized['where_will_you_work']['work_environment'] = {'description': str(env)}
            if diff_abled is not None:
                normalized['where_will_you_work']['differently_abled_opportunities'] = diff_abled

    for target_key, candidate_keys in aliases.items():
        if target_key in normalized and has_content(normalized[target_key]):
            continue
        for candidate in candidate_keys:
            if candidate in normalized and has_content(normalized[candidate]):
                normalized[target_key] = normalized[candidate]
                break

    # Canonical aliases for template compatibility
    if 'career_name' in normalized and 'name' not in normalized:
        normalized['name'] = normalized['career_name']
    elif 'name' in normalized and 'career_name' not in normalized:
        normalized['career_name'] = normalized['name']

    return normalized
