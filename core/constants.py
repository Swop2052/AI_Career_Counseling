# core/constants.py - Enhanced constants
from typing import Dict, List, Tuple

# RIASEC Codes and Labels
RIASEC_CODES = ["R", "I", "A", "S", "E", "C"]
RIASEC_LABELS = {
    "R": "Realistic",
    "I": "Investigative",
    "A": "Artistic",
    "S": "Social",
    "E": "Enterprising",
    "C": "Conventional"
}

# RIASEC Keywords for Matching
RIASEC_KEYWORDS = {
    "R": ["engineer", "technician", "mechanic", "operator", "construction", "manufacturing",
          "electrician", "fitter", "welder", "plumber", "carpenter", "farmer", "pilot",
          "driver", "maintenance", "repair", "assembly", "machine", "physical", "hands-on",
          "agriculture", "laboratory", "production", "building", "civil", "mechanical"],
    "I": ["scientist", "researcher", "analyst", "investigator", "data", "software", "developer",
          "programmer", "biotech", "pharmaceutical", "medical", "laboratory", "research",
          "mathematician", "physicist", "chemist", "biologist", "statistician", "forensic",
          "genetics", "microbiology", "biochemistry", "neuroscience", "epidemiology"],
    "A": ["designer", "artist", "writer", "creator", "fashion", "interior", "graphic",
          "animator", "photographer", "musician", "actor", "dancer", "creative", "content",
          "illustrator", "sculptor", "poet", "novelist", "screenwriter", "director"],
    "S": ["teacher", "counselor", "trainer", "social", "nurse", "doctor", "therapist",
          "psychologist", "social worker", "educator", "instructor", "caregiver", "helper",
          "physician", "dentist", "veterinarian", "speech", "occupational", "physical"],
    "E": ["manager", "entrepreneur", "sales", "business", "marketing", "executive",
          "director", "leader", "financial", "consultant", "administrator", "banker",
          "investor", "broker", "strategist", "operations", "human resources"],
    "C": ["accountant", "administrator", "auditor", "clerk", "secretary", "office",
          "assistant", "finance", "banking", "compliance", "data entry", "records",
          "bookkeeper", "treasurer", "controller", "tax", "payroll", "procurement"]
}

# Subject Categories
SUBJECT_KEYWORDS = {
    'biology': ['biology', 'zoology', 'botany', 'biotechnology', 'genetics', 'ecology'],
    'chemistry': ['chemistry', 'organic', 'inorganic', 'analytical', 'physical'],
    'physics': ['physics', 'mechanics', 'thermodynamics', 'quantum', 'optics', 'acoustics'],
    'mathematics': ['math', 'mathematics', 'statistics', 'calculus', 'algebra', 'geometry'],
    'computer': ['computer', 'programming', 'software', 'coding', 'it', 'data science'],
    'engineering': ['engineering', 'mechanical', 'civil', 'electrical', 'electronics', 'computer science'],
    'medical': ['medical', 'medicine', 'anatomy', 'physiology', 'pathology', 'pharmacology'],
    'commerce': ['commerce', 'accounting', 'finance', 'economics', 'business', 'management'],
    'arts': ['art', 'design', 'drawing', 'painting', 'sculpture', 'visual arts'],
    'language': ['english', 'literature', 'language', 'writing', 'linguistics'],
    'history': ['history', 'archaeology', 'ancient', 'medieval', 'modern history'],
    'psychology': ['psychology', 'human behavior', 'mind', 'counseling', 'psychiatry'],
    'law': ['law', 'legal', 'constitution', 'criminal', 'civil law'],
    'economics': ['economics', 'macro', 'micro', 'finance', 'market'],
    'political': ['political', 'government', 'public policy', 'international relations']
}

# Flatten subject keywords
FLAT_SUBJECT_KEYWORDS = {}
for category, keywords in SUBJECT_KEYWORDS.items():
    for keyword in keywords:
        FLAT_SUBJECT_KEYWORDS[keyword] = category

# Intent Types
INTENTS = {
    "GREETING": "greeting",
    "GENERAL_CHAT": "general_chat",
    "CAREER_RECOMMENDATION": "career_recommendation",
    "CAREER_COMPARISON": "career_comparison",
    "JOB_INFORMATION": "job_information",
    "SKILL_GUIDANCE": "skill_guidance",
    "COLLEGE_GUIDANCE": "college_guidance",
    "SALARY_QUERY": "salary_query",
    "STUDY_GUIDANCE": "study_guidance",
    "PROFILE_QUESTION": "profile_question",
    "FOLLOW_UP": "follow_up",
    "OFF_TOPIC": "off_topic"
}

# Greeting Patterns
GREETING_PATTERNS = [
    r'^(hi|hello|hey|greetings|good morning|good afternoon|good evening|sup|what\'s up|howdy|namaste|hola)',
    r'^(hi|hello|hey|greetings|good morning|good afternoon|good evening|sup|what\'s up|howdy|namaste|hola)\s',
    r'^hey there',
    r'^yo',
    r'^what\'s good',
    r'^how\'s it going',
    r'^nice to meet you'
]

# Off-topic patterns
OFF_TOPIC_PATTERNS = [
    r'(weather|rain|sunny|cloudy|temperature|climate)',
    r'(sports|cricket|football|cricket match|world cup|basketball|tennis)',
    r'(movie|film|cinema|actor|actress|hollywood|bollywood|netflix)',
    r'(politics|election|prime minister|government|parliament)',
    r'(music|song|album|artist|band|concert|spotify)',
    r'(gaming|game|play|playstation|xbox|nintendo|fortnite)',
    r'(food|restaurant|cooking|recipe|cuisine|pizza|burger)',
    r'(travel|holiday|vacation|beach|mountain|trip|tourist)',
    r'(technology|tech|gadget|phone|laptop|computer|apple|samsung)',
    r'(fashion|clothing|dress|style|trend|shopping)'
]

# Intent keywords for classification
INTENT_KEYWORDS = {
    "career_recommendation": [
        "recommend", "suggest", "career", "job", "profession", "what should i",
        "which career", "best career", "right career", "ideal career",
        "career path", "career option", "future career", "choose career",
        "help me find", "find career", "discover career"
    ],
    "career_comparison": [
        "compare", "versus", "vs", "difference", "between", "better",
        "worse", "similar", "different", "which is better", "difference between"
    ],
    "job_information": [
        "what do", "job role", "job description", "job profile", "work as",
        "responsibilities", "duties", "tasks", "daily work", "typical day",
        "tell me about", "what is", "explain", "describe"
    ],
    "skill_guidance": [
        "skill", "learn", "training", "course", "certification", "ability",
        "proficiency", "expertise", "competency", "how to", "what to learn"
    ],
    "college_guidance": [
        "college", "university", "school", "institute", "campus", "admission",
        "apply", "entrance", "exam", "degree", "which college", "best college"
    ],
    "salary_query": [
        "salary", "pay", "income", "wage", "earn", "money", "compensation",
        "package", "remuneration", "financial", "how much"
    ],
    "study_guidance": [
        "study", "education", "learn", "training", "curriculum", "syllabus",
        "subject", "course", "class", "lecture", "what to study"
    ],
    "profile_question": [
        "profile", "assessment", "result", "report", "analysis", "score",
        "riasec", "personality", "trait", "strength", "my profile"
    ]
}

# Fallback responses
FALLBACK_RESPONSES = {
    "greeting": "👋 Hello! I'm Nova, your AI Career Counselor. How can I help you explore careers today?",
    "general_chat": "I'm here to help with career guidance. What would you like to know about?",
    "off_topic": "I specialize in career guidance. Let's focus on finding the right career path for you!",
    "default": "I'm not sure I understand. Could you rephrase your question about careers?"
}