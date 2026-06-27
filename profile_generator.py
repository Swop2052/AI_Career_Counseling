# profile_generator.py - Production ready (FIXED)
from trait_definitions import TRAITS  # Fixed import

RIASEC_CODES = ["R", "I", "A", "S", "E", "C"]

def generate_student_profile(scores, student_info=None):
    """
    Generate a comprehensive student profile from RIASEC scores and student info
    """
    # Normalize incoming scores so profile generation never fails.
    normalized_scores = {code: 0 for code in RIASEC_CODES}
    if isinstance(scores, dict):
        for code in RIASEC_CODES:
            value = scores.get(code, 0)
            try:
                normalized_scores[code] = max(0, float(value))
            except (TypeError, ValueError):
                normalized_scores[code] = 0

    # Sort scores to determine primary, secondary, tertiary interests
    sorted_scores = sorted(
        normalized_scores.items(),
        key=lambda item: item[1],
        reverse=True
    )
    
    primary_code = sorted_scores[0][0]
    secondary_code = sorted_scores[1][0]
    tertiary_code = sorted_scores[2][0]
    
    # Initialize student_info if not provided
    if student_info is None:
        student_info = {}
    
    # Parse helper
    def parse_list(value):
        if value is None:
            return []
        if isinstance(value, list):
            return [item.strip() for item in value if item and str(item).strip()]
        if isinstance(value, str):
            return [item.strip() for item in value.split(',') if item.strip()]
        return []
    
    # Build profile
    profile = {
        # Student Information
        "student_name": student_info.get('name', ''),
        "age": student_info.get('age', ''),
        "class": student_info.get('class', ''),
        "stream": student_info.get('education', ''),
        "subjects": parse_list(student_info.get('subjects', '')),
        "weak_subjects": parse_list(student_info.get('weak_subjects', '')),
        "hobbies": parse_list(student_info.get('hobbies', '')),
        "interests": parse_list(student_info.get('interests', '')),
        "strengths": parse_list(student_info.get('strengths', '')),
        "career_aspirations": parse_list(student_info.get('career_aspirations', '')),
        
        # Career Preferences
        "preferred_work_style": student_info.get('work_style', 'hybrid'),
        "learning_mode": student_info.get('learning_mode', 'offline'),
        "budget_preference": student_info.get('budget', 'moderate'),
        "location_preference": student_info.get('location', 'india'),
        
        # RIASEC Profile
        "riasec_code": primary_code + secondary_code + tertiary_code,
        "primary": TRAITS[primary_code]["name"],
        "secondary": TRAITS[secondary_code]["name"],
        "tertiary": TRAITS[tertiary_code]["name"],
        "primary_code": primary_code,
        "secondary_code": secondary_code,
        "tertiary_code": tertiary_code,
        "traits": [],
        "score_percentages": {},
        
        # Raw data
        "raw_scores": normalized_scores,
        "student_info": student_info
    }
    
    # Add traits (avoid duplicates)
    seen = set()
    for code in [primary_code, secondary_code, tertiary_code]:
        for trait in TRAITS[code]["traits"]:
            if trait not in seen:
                seen.add(trait)
                profile["traits"].append(trait)
    
    # Calculate percentages
    total_score = sum(normalized_scores.values())
    if total_score > 0:
        profile["score_percentages"] = {
            code: round((score / total_score) * 100, 1)
            for code, score in normalized_scores.items()
        }
    else:
        profile["score_percentages"] = {code: 0 for code in normalized_scores.keys()}
    
    return profile

def display_profile(profile):
    """Display profile information in console for debugging"""
    print("\n" + "=" * 60)
    print("COMPREHENSIVE STUDENT PROFILE")
    print("=" * 60)
    
    print(f"\nStudent: {profile.get('student_name', 'N/A')}")
    print(f"Age: {profile.get('age', 'N/A')}")
    print(f"Class: {profile.get('class', 'N/A')}")
    print(f"Stream: {profile.get('stream', 'N/A')}")
    
    print(f"\nRIASEC Code: {profile.get('riasec_code', 'N/A')}")
    print(f"Primary: {profile.get('primary', 'N/A')}")
    print(f"Secondary: {profile.get('secondary', 'N/A')}")
    print(f"Tertiary: {profile.get('tertiary', 'N/A')}")
    
    print("\nTraits:")
    for trait in profile.get('traits', []):
        print(f"  - {trait}")
    
    print("=" * 60)