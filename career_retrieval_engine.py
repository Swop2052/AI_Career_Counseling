    # career_retrieval_engine.py - Production ready
import json
import re
from collections import Counter

# ============================================================
# RIASEC KEYWORDS FOR MATCHING
# ============================================================

RIASEC_KEYWORDS = {
    "R": ["engineer", "technician", "mechanic", "operator", "construction", "manufacturing", 
          "electrician", "fitter", "welder", "plumber", "carpenter", "farmer", "pilot", 
          "driver", "maintenance", "repair", "assembly", "machine", "physical", "hands-on"],
    "I": ["scientist", "researcher", "analyst", "investigator", "data", "software", "developer",
          "programmer", "biotech", "pharmaceutical", "medical", "laboratory", "research", 
          "mathematician", "physicist", "chemist", "biologist", "statistician"],
    "A": ["designer", "artist", "writer", "creator", "fashion", "interior", "graphic", 
          "animator", "photographer", "musician", "actor", "dancer", "creative", "content"],
    "S": ["teacher", "counselor", "trainer", "social", "nurse", "doctor", "therapist", 
          "psychologist", "social worker", "educator", "instructor", "caregiver", "helper"],
    "E": ["manager", "entrepreneur", "sales", "business", "marketing", "executive", 
          "director", "leader", "financial", "consultant", "administrator"],
    "C": ["accountant", "administrator", "auditor", "clerk", "secretary", "office", 
          "assistant", "finance", "banking", "compliance", "data entry", "records"]
}

# ============================================================
# SUBJECT KEYWORDS
# ============================================================

SUBJECT_KEYWORDS = {
    'biology': ['biology', 'zoology', 'botany', 'biotechnology', 'genetics'],
    'chemistry': ['chemistry', 'organic', 'inorganic', 'analytical'],
    'physics': ['physics', 'mechanics', 'thermodynamics', 'quantum'],
    'mathematics': ['math', 'mathematics', 'statistics', 'calculus', 'algebra'],
    'computer': ['computer', 'programming', 'software', 'coding', 'it'],
    'engineering': ['engineering', 'mechanical', 'civil', 'electrical', 'electronics'],
    'medical': ['medical', 'medicine', 'anatomy', 'physiology', 'pathology'],
    'commerce': ['commerce', 'accounting', 'finance', 'economics', 'business'],
    'arts': ['art', 'design', 'drawing', 'painting', 'sculpture'],
    'language': ['english', 'literature', 'language', 'writing'],
    'history': ['history', 'archaeology', 'ancient', 'medieval'],
    'psychology': ['psychology', 'human behavior', 'mind', 'counseling']
}

FLAT_SUBJECT_KEYWORDS = {}
for category, keywords in SUBJECT_KEYWORDS.items():
    for keyword in keywords:
        FLAT_SUBJECT_KEYWORDS[keyword] = category

# ============================================================
# CORE FUNCTIONS
# ============================================================

def load_career_database(file_path):
    """Load career database from JSON file"""
    try:
        with open(file_path, "r", encoding="utf-8-sig") as file:
            data = json.load(file)
        return data.get("careers", [])
    except Exception as e:
        print(f"Career Database Error: {e}")
        return []

def extract_career_text(career):
    """Extract all meaningful text from a career for matching."""
    if not isinstance(career, dict):
        return ""

    text_parts = []

    def collect_text(value):
        if value is None:
            return
        if isinstance(value, str):
            text = value.strip()
            if text:
                text_parts.append(text.lower())
        elif isinstance(value, (int, float, bool)):
            text_parts.append(str(value).lower())
        elif isinstance(value, list):
            for item in value:
                collect_text(item)
        elif isinstance(value, dict):
            for key, item in value.items():
                collect_text(key)
                collect_text(item)

    collect_text(career)
    return " ".join(text_parts[:2000])

def normalize_tokens(value):
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

    # Keep order stable while removing duplicates.
    return list(dict.fromkeys(tokens))

def calculate_riasec_score(profile, career_text):
    """Calculate RIASEC match score (0-100)"""
    riasec_code = profile.get("riasec_code", "")
    if not riasec_code or len(riasec_code) < 3:
        return 0
    
    code_weights = {}
    for i, code in enumerate(riasec_code[:3]):
        if i == 0:
            code_weights[code] = 50
        elif i == 1:
            code_weights[code] = 30
        elif i == 2:
            code_weights[code] = 20
    
    total_weight = sum(code_weights.values())
    if total_weight == 0:
        return 0
    
    matched_weight = 0
    for code, weight in code_weights.items():
        keywords = RIASEC_KEYWORDS.get(code, [])
        for keyword in keywords:
            if keyword in career_text:
                matched_weight += weight
                break
    
    return (matched_weight / total_weight) * 100

def calculate_interest_score(profile, career_text):
    """Calculate interest match score (0-100)"""
    interests = normalize_tokens(profile.get('interests', []))
    if not interests:
        return 0
    
    matched = 0
    for interest in interests:
        interest_lower = interest.lower()
        if len(interest_lower) > 2 and interest_lower in career_text:
            matched += 1
    
    return (matched / max(len(interests), 1)) * 100

def calculate_subject_score(profile, career_text):
    """Calculate subject match score (0-100)"""
    subjects = normalize_tokens(profile.get('subjects', []))
    if not subjects:
        return 0
    
    matched_score = 0
    total_possible = len(subjects) * 20
    
    for subject in subjects:
        subject_lower = subject.lower()
        if subject_lower in career_text:
            matched_score += 20
            continue
        
        matched = False
        for keyword, category in FLAT_SUBJECT_KEYWORDS.items():
            if subject_lower in keyword or keyword in subject_lower:
                if keyword in career_text:
                    matched_score += 20
                    matched = True
                    break
    
    return min((matched_score / max(total_possible, 1)) * 100, 100)

def calculate_hobby_score(profile, career_text):
    """Calculate hobby match score (0-100)"""
    hobbies = normalize_tokens(profile.get('hobbies', []))
    if not hobbies:
        return 0
    
    matched = 0
    for hobby in hobbies:
        hobby_lower = hobby.lower()
        if len(hobby_lower) > 2 and hobby_lower in career_text:
            matched += 1
    
    return (matched / max(len(hobbies), 1)) * 100

def calculate_strength_score(profile, career_text):
    """Calculate strength/ability relevance score (0-100)."""
    strengths = normalize_tokens(profile.get('strengths', []))
    if not strengths:
        return 0

    matched = 0
    for strength in strengths:
        if len(strength) > 2 and strength in career_text:
            matched += 1

    return (matched / max(len(strengths), 1)) * 100

def calculate_aspiration_score(profile, career_text):
    """Calculate declared aspiration alignment (0-100)."""
    aspirations = normalize_tokens(profile.get('career_aspirations', []))
    if not aspirations:
        return 0

    matched = 0
    for aspiration in aspirations:
        if len(aspiration) > 2 and aspiration in career_text:
            matched += 1

    return (matched / max(len(aspirations), 1)) * 100

def calculate_weak_subject_penalty(profile, career_text):
    """Penalty for careers strongly tied to student's weak areas (0-100)."""
    weak_subjects = normalize_tokens(profile.get('weak_subjects', []))
    if not weak_subjects:
        return 0

    hits = 0
    for subject in weak_subjects:
        if len(subject) > 2 and subject in career_text:
            hits += 1

    return (hits / max(len(weak_subjects), 1)) * 100

def calculate_preference_bonus(profile, career):
    """Preference fit bonus (0-100) using learning/budget/location choices."""
    checks = 0
    score = 0

    learning_mode = str(profile.get('learning_mode', '')).lower().strip()
    budget = str(profile.get('budget_preference', '')).lower().strip()
    location = str(profile.get('location_preference', '')).lower().strip()

    career_text = extract_career_text(career)
    institutes = career.get('where_will_you_study', {}) if isinstance(career.get('where_will_you_study', {}), dict) else {}

    if learning_mode:
        checks += 1
        if learning_mode == 'distance':
            if any(k in career_text for k in ['online', 'distance', 'remote', 'correspondence']):
                score += 1
        elif learning_mode == 'offline':
            if any(k in career_text for k in ['lab', 'campus', 'field', 'hands-on', 'clinical']):
                score += 1
        elif learning_mode == 'hybrid':
            online_hit = any(k in career_text for k in ['online', 'distance', 'remote'])
            offline_hit = any(k in career_text for k in ['lab', 'campus', 'hands-on', 'field'])
            if online_hit and offline_hit:
                score += 1

    if budget:
        checks += 1
        gov_count = len(institutes.get('government_institutes', [])) if isinstance(institutes, dict) else 0
        scholarship_text = 'scholarship' in career_text
        if budget == 'budget_sensitive' and (gov_count > 0 or scholarship_text):
            score += 1
        elif budget in ['moderate', 'no_constraint']:
            score += 1

    if location:
        checks += 1
        if location == 'india' and any(k in career_text for k in ['india', 'indian', 'state board', 'cbse']):
            score += 1
        elif location == 'local' and any(k in career_text for k in ['local', 'regional', 'state', 'district']):
            score += 1
        elif location == 'international' and any(k in career_text for k in ['international', 'global', 'abroad', 'overseas']):
            score += 1

    if checks == 0:
        return 0

    return (score / checks) * 100

def calculate_weighted_career_score(profile, career, career_text):
    """Calculate weighted career match score"""
    scores = {}
    
    scores['riasec'] = calculate_riasec_score(profile, career_text) * 0.40
    scores['interest'] = calculate_interest_score(profile, career_text) * 0.18
    scores['subject'] = calculate_subject_score(profile, career_text) * 0.14
    scores['hobby'] = calculate_hobby_score(profile, career_text) * 0.08
    scores['strength'] = calculate_strength_score(profile, career_text) * 0.08
    scores['aspiration'] = calculate_aspiration_score(profile, career_text) * 0.12

    preference_bonus = calculate_preference_bonus(profile, career) * 0.05
    weak_subject_penalty = calculate_weak_subject_penalty(profile, career_text) * 0.12

    total_score = sum(scores.values()) + preference_bonus - weak_subject_penalty
    total_score = max(0, min(100, total_score))
    
    return {
        'match_score': round(total_score, 2),
        'riasec_score': round(scores['riasec'] / 0.40, 2) if scores['riasec'] > 0 else 0,
        'interest_score': round(scores['interest'] / 0.18, 2) if scores['interest'] > 0 else 0,
        'subject_score': round(scores['subject'] / 0.14, 2) if scores['subject'] > 0 else 0,
        'hobby_score': round(scores['hobby'] / 0.08, 2) if scores['hobby'] > 0 else 0,
        'strength_score': round(scores['strength'] / 0.08, 2) if scores['strength'] > 0 else 0,
        'aspiration_score': round(scores['aspiration'] / 0.12, 2) if scores['aspiration'] > 0 else 0,
        'preference_bonus': round(preference_bonus, 2),
        'weak_subject_penalty': round(weak_subject_penalty, 2),
        'score_breakdown': scores
    }

def retrieve_careers(profile, careers, top_n=15):
    """Retrieve and rank careers using weighted scoring"""
    if not careers:
        return []
    
    results = []
    min_score_threshold = 15
    
    print(f"\n🔍 Retrieving careers with psychometric scoring...")
    print(f"📊 Processing {len(careers)} careers...")
    
    for career in careers:
        career_name = career.get('career_name', '')
        if not career_name:
            continue
        
        career_text = extract_career_text(career)
        
        try:
            score_result = calculate_weighted_career_score(profile, career, career_text)
            
            if score_result['match_score'] >= min_score_threshold:
                results.append({
                    'career_name': career_name,
                    'match_score': score_result['match_score'],
                    'riasec_score': score_result['riasec_score'],
                    'interest_score': score_result['interest_score'],
                    'subject_score': score_result['subject_score'],
                    'hobby_score': score_result['hobby_score'],
                    'strength_score': score_result['strength_score'],
                    'aspiration_score': score_result['aspiration_score'],
                    'preference_bonus': score_result['preference_bonus'],
                    'weak_subject_penalty': score_result['weak_subject_penalty'],
                    'score_breakdown': score_result['score_breakdown'],
                    'career_data': career
                })
        except Exception as e:
            print(f"⚠️ Error processing {career_name}: {e}")
            continue
    
    results.sort(key=lambda x: x['match_score'], reverse=True)
    
    print(f"\n✅ Found {len(results)} matching careers")
    
    if results:
        print("\n📊 Top Matches:")
        for i, r in enumerate(results[:5], 1):
            print(f"  {i}. {r['career_name']}: {r['match_score']}%")
    
    return results[:top_n]

def clear_career_cache():
    """Clear the career text cache"""
    pass  # Placeholder for cache clearing