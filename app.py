# app.py - Complete Production Flask Application
import sys
import io

# Force stdout/stderr to use UTF-8 encoding on Windows to prevent Unicode/Emoji print crashes
if sys.platform.startswith('win'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from flask import Flask, request, jsonify, session
from flask_cors import CORS
# pyrefly: ignore [missing-import]
from deep_translator import GoogleTranslator
import json
import os
import time
import requests
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ============================================================
# IMPORT CORE MODULES
# ============================================================
from core.config import config
from core.models import Conversation, CareerMatch
from core.translator_cache import translate_career_data, translate_teaser_data, get_cached_translation
from core.exceptions import (
    IntentClassificationError, PersonaGenerationError,
    RetrievalError, LLMError, ValidationError
)
from modules.vector_store import vector_store

# ============================================================
# SETUP FLASK
# ============================================================
app = Flask(__name__)
app.secret_key = config.secret_key
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=config.session_lifetime_hours)
app.config['SESSION_COOKIE_SECURE'] = config.flask_env == 'production'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
# Security: Restrict origins and set payload size limits
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024  # 2MB max payload
allowed_origins = [origin.strip() for origin in config.cors_origins.split(",") if origin.strip()]
CORS(app, supports_credentials=True, origins=allowed_origins)

# ============================================================
# RATE LIMITING (SECURITY GUARD)
# ============================================================
from collections import defaultdict

# Simple in-memory rate limiter: IP address -> list of request timestamps in the last 60 seconds
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 30  # maximum requests per window
ip_request_history = defaultdict(list)

def check_rate_limit(ip_address):
    now = time.time()
    # Clean old requests outside the window
    ip_request_history[ip_address] = [t for t in ip_request_history[ip_address] if now - t < RATE_LIMIT_WINDOW]
    if len(ip_request_history[ip_address]) >= RATE_LIMIT_MAX_REQUESTS:
        return False
    ip_request_history[ip_address].append(now)
    return True

# ============================================================
# INITIALIZE MODULES
# ============================================================
from modules.intent_classifier import intent_classifier
from modules.persona_fusion import persona_fusion
from modules.retrieval_pipeline import retrieval_pipeline
from modules.conversation_memory import conversation_memory
from modules.prompt_builder import prompt_builder
from modules.llm_engine import nova
from modules.response_validator import response_validator

# ============================================================
# IMPORT DATA LOADERS
# ============================================================
from profile_generator import generate_student_profile, display_profile
from career_retrieval_engine import retrieve_careers, clear_career_cache

# ============================================================
# DATA LOADING
# ============================================================

def load_career_database():
    """Load career database from active SQLite database or fallback JSON."""
    try:
        from modules.conversation_memory import conversation_memory
        db_careers = conversation_memory.get_all_careers()
        
        # Load from Data.json to see if we need to seed
        fallback_careers = []
        try:
            with open(config.career_db_path, "r", encoding="utf-8-sig") as file:
                data = json.load(file)
            fallback_careers = data.get("careers", [])
        except Exception as e:
            print(f"[WARNING] Could not read local Data.json: {e}")

        # If SQLite has fewer careers than Data.json (e.g. fresh start or test override), seed SQLite
        if len(db_careers) < len(fallback_careers) and fallback_careers:
            print(f"[INFO] SQLite 'careers' table has {len(db_careers)} records, seeding {len(fallback_careers)} careers from Data.json...")
            conversation_memory.upsert_careers(fallback_careers)
            db_careers = conversation_memory.get_all_careers()
            
        if db_careers:
            print(f"[SUCCESS] Loaded {len(db_careers)} careers from SQLite 'careers' table.")
            return db_careers
            
        return fallback_careers
    except Exception as e:
        print(f"[ERROR] Career Database Error: {e}")
        return []


def load_riasec_questions(lang='en'):
    """Load RIASEC questions from JSON file."""
    lang_map = {'en': 'english', 'hi': 'hindi', 'mr': 'marathi'}
    file_name = f"{lang_map.get(lang, 'english')}.json"
    path = os.path.join(config.base_dir, "questions", file_name)
        
    try:
        with open(path, "r", encoding="utf-8-sig") as f:
            data = json.load(f)
        print(f"[SUCCESS] Loaded RIASEC questions from {path}")
        return data
    except FileNotFoundError:
        print(f"[ERROR] File not found: {path}. Falling back to default.")
        if lang != 'en':
            return load_riasec_questions('en')
        return {}
    except json.JSONDecodeError as e:
        print(f"[ERROR] JSON Error in {path}: {e}")
        return {}
    except Exception as e:
        print(f"[ERROR] RIASEC Questions Error: {e}")
        return {}


# Load data
CAREER_DB = load_career_database()
QUESTIONS_DATA = load_riasec_questions('en')
QUESTIONS_DATA_MR = load_riasec_questions('mr')
QUESTIONS_DATA_HI = load_riasec_questions('hi')


def prepare_questions(q_data):
    """Prepare questions for the frontend."""
    questions = []
    if not q_data:
        return []
    
    for category, question_list in q_data.items():
        if category == "response_scale":
            continue
        if not isinstance(question_list, list):
            continue
        for item in question_list:
            if isinstance(item, dict):
                questions.append({
                    "id": len(questions) + 1,
                    "question": item.get("question", ""),
                    "answers": item.get("answers", []),
                    "icons": item.get("icons", []),
                    "category": category
                })
            else:
                questions.append({
                    "id": len(questions) + 1,
                    "question": str(item),
                    "answers": [],
                    "category": category
                })
    
    print(f"[SUCCESS] Prepared {len(questions)} questions")
    return questions


QUESTIONS = prepare_questions(QUESTIONS_DATA)
QUESTIONS_MR = prepare_questions(QUESTIONS_DATA_MR)
QUESTIONS_HI = prepare_questions(QUESTIONS_DATA_HI)

UI_TRANSLATIONS_EN = {
    "brand-title": "🚀 SkillSense",
    "nav-how": "How it works",
    "nav-test": "Take Test",
    "nav-counselor": "AI Counselor",
    "nav-contact": "Contact",
    "nav-start": "Start Career Test",
    "contact-eyebrow": "Let's Connect",
    "contact-title": "Let's <span class=\"grad\">Connect</span>",
    "contact-lead": "Whether you are a student exploring your path, a school administrator looking to bring SkillSense to your campus, or have questions about our platform, we are here to help.",
    "contact-info-title": "Contact Information",
    "contact-email-label": "Email Us",
    "contact-email-sub": "Direct lines to our departments",
    "contact-hq-label": "Headquarters",
    "contact-phone-label": "Call Us",
    "contact-form-title": "Send a Message",
    "contact-form-sub": "Secure transmission through our encrypted routing system.",
    "contact-name-placeholder": "Full Name",
    "contact-email-placeholder": "Email Address",
    "contact-company-placeholder": "Company (Optional)",
    "contact-subject-placeholder": "Subject",
    "contact-msg-placeholder": "Your Message",
    "contact-btn-text": "✈️ Send Message",
    "hero-eyebrow": "PERSONALITY · AI INSIGHTS · CAREER ROADMAPS",
    "hero-title": "Find a career path<br><span class=\"12\">that matches who you are.</span>",
    "hero-sub": "An intelligent career companion that understands your interests, strengths, and goals to create a personalized roadmap for your future.",
    "hero-start": "Start Career Test →",
    "hero-chat": "Chat with AI",
    "num-1": "6",
    "num-2": "500+",
    "num-3": "24/7",
    "step-num-1": "01",
    "step-num-2": "02",
    "step-num-3": "03",
    "step-num-4": "04",
    "stat-1": "Personality Dimensions",
    "stat-2": "Career Paths",
    "stat-3": "AI Guidance",
    "scale-1": "Not me",
    "scale-2": "A little",
    "scale-3": "Maybe",
    "scale-4": "Yes",
    "scale-5": "So me!",
    "toast-switching": "Switching language...",
    "toast-lang-updated": "Language updated!",
    "contact-sending": "⏳ Sending...",
    "contact-success": "📩 Message sent successfully! We will get in touch soon.",
    "contact-error": "Connection error!",
    "quiz-question-count": "Question {index} of {total}",
    "feedback-title": "Feedback Required",
    "feedback-sub": "To download the guide for <b>{careerName}</b>, please let us know if this career matches your interests:",
    "feedback-yes": "👍 Yes, it matches!",
    "feedback-no": "👎 No, it doesn't match",
    "feedback-saving": "Saving feedback...",
    "modal-subtitle": "Interactive Career Guide & Pathway Report",
    "modal-overview": "Career Overview",
    "modal-personality": "Personality Alignment",
    "modal-pathway": "Educational Pathway",
    "modal-exams": "Entrance Exams",
    "modal-fees": "Estimated Course Fee",
    "modal-income": "Expected Monthly Income",
    "modal-financial": "Financial Aid",
    "modal-scholarships": "Scholarships",
    "modal-loans": "Educational Loans",
    "modal-study": "Where will you study?",
    "modal-gov": "Government Institutes",
    "modal-priv": "Private Institutes",
    "modal-dist": "Distance Learning",
    "modal-growth": "Expected Growth Trajectory",
    "modal-work": "Where you'll work",
    "modal-near": "Near You",
    "modal-filtered": "Filtered out based on your college type preferences",
    "modal-no-institutes": "No institutes listed",
    "modal-not-available": "Information not available",
    "modal-none": "None listed",
    "sec-journey-eyebrow": "The journey",
    "sec-journey-title": "Four steps to your <span class=\"grad\">career match</span>",
    "step-1-title": "Build your profile",
    "step-1-desc": "Tell us your name, age, class, interests and hobbies — your AI assistant guides you through.",
    "step-2-title": "Play the career test",
    "step-2-desc": "Quick cards, XP, coins and streaks. It feels like a game, not an exam.",
    "step-3-title": "AI reads your strengths",
    "step-3-desc": "Your answers become a personalized personality and interest profile in seconds.",
    "step-4-title": "Get your roadmap",
    "step-4-desc": "Matched careers, colleges, scholarships and a step-by-step path forward.",
    "sec-quiz-eyebrow": "CAREER DISCOVERY ASSESSMENT",
    "sec-quiz-title": "Discover the path <span class=\"grad\">that fits you.</span>",
    "sec-quiz-lead": "Tell us about yourself and answer a few questions to understand your interests, strengths, and career preferences.",
    "form-heading": "Tell us about yourself",
    "label-name": "Full Name *",
    "placeholder-name": "Enter your full name",
    "label-age": "Age *",
    "placeholder-age": "Enter your age",
    "label-class": "Class/Year *",
    "option-select-class": "Select your class",
    "label-stream": "Education Stream/Field",
    "placeholder-stream": "e.g., Science, Commerce, Arts, Engineering",
    "heading-learning-profile": "Your Learning Profile",
    "label-subjects": "Subjects you enjoy learning",
    "placeholder-subjects": "e.g., Mathematics, Physics, English, Biology, History",
    "label-weak-subjects": "Subjects You Find Challenging",
    "placeholder-weak-subjects": "e.g., Chemistry, Statistics, Economics",
    "heading-outside-academics": "What inspires you outside academics?",
    "label-interests": "Your Interests",
    "placeholder-interests": "e.g., Technology, Research, Art, Sports, Social Work",
    "label-hobbies": "Your Hobbies",
    "placeholder-hobbies": "e.g., Reading, Gaming, Painting, Coding, Gardening",
    "label-strengths": "Your natural strengths",
    "placeholder-strengths": "e.g., Problem-solving, Communication, Leadership, Creativity",
    "label-aspirations": "Career Aspirations (if any)",
    "placeholder-aspirations": "e.g., Engineer, Doctor, Scientist, Entrepreneur",
    "heading-preferences": "Career Ambitions & Preferences",
    "label-learning-mode": "Preferred Learning Mode",
    "label-budget": "Budget Preference",
    "label-location": "Location Preference",
    "label-student-location": "Preferred Study Location",
    "placeholder-student-location": "e.g., Tamil Nadu, Maharashtra, Delhi",
    "label-college-range": "Preferred College Type/Range",
    "option-college-1": "1st Year College",
    "option-college-2": "2nd Year College",
    "option-college-3": "3rd Year College",
    "option-college-4": "4th Year College",
    "option-graduate": "Graduate",
    "option-post-graduate": "Post Graduate",
    "option-learning-offline": "Offline (Classroom/Lab)",
    "option-learning-distance": "Distance/Online Learning",
    "option-learning-hybrid": "Hybrid (Mix)",
    "option-budget-moderate": "Moderate Budget",
    "option-budget-sensitive": "Budget Sensitive",
    "option-budget-no-constraint": "No Budget Constraint",
    "option-location-india": "India Wide",
    "option-location-local": "Local Opportunities",
    "option-location-international": "International Career",
    "option-range-all": "All Colleges (Govt & Private)",
    "option-range-govt": "Government Colleges Only",
    "option-range-private": "Private Colleges Only",
    "option-range-distance": "Distance Learning Only",
    "btn-submit-profile": "Continue to Career Test →",
    "scale-not-me": "Not me",
    "scale-little": "A little",
    "scale-maybe": "Maybe",
    "scale-yes": "Yes",
    "scale-so-me": "So me!",
    "btn-back": "← Back",
    "btn-next": "Next →",
    "btn-submit-test": "Submit Test →",
    "sec-counselor-eyebrow": "Nova AI Counselor",
    "sec-counselor-title": "Have questions? <span class=\"grad\">Ask VERA.</span>",
    "sec-counselor-sub": "Ask anything about your matches, course fees, colleges, entrance exams, or alternate paths.",
    "placeholder-chat": "Ask Nova about your career matches, colleges, entrance exams...",
    "btn-send": "Send",
    "chat-disclaimer": "Disclaimer: VERA is an AI assistant. Guidance is for informational purposes only. Consult professional counselors for critical career decisions.",
    "modal-close": "Close",
    "title-overview": "Career Overview",
    "title-why-matches": "Why It Matches Student Profile",
    "title-traits": "Personality Traits Alignment",
    "title-pathway": "Educational Pathway",
    "title-fees": "Course Fees",
    "title-income": "Expected Income",
    "title-scholarships": "Scholarships",
    "title-loans": "Loans",
    "title-study": "Where Will You Study?",
    "title-gov": "Government",
    "title-priv": "Private",
    "title-dist": "Distance Learning",
    "title-work": "Where Will You Work?",
    "title-growth": "Expected Growth Path",
    "title-skills": "Skill Development Plan",
    "title-example": "Example From The Field",
    "title-exams": "Entrance Exams"
}

# Dynamic translation of UI at startup
def translate_ui_to(lang_code):
    translated_ui = {}
    print(f"[INFO] Translating static UI to {lang_code}...")
    try:
        from deep_translator import GoogleTranslator
        translator = GoogleTranslator(source='en', target=lang_code)
        ui_keys = list(UI_TRANSLATIONS_EN.keys())
        ui_vals = [UI_TRANSLATIONS_EN[k] for k in ui_keys]
        batch_ui_str = "\n".join(ui_vals)
        translated_batch_ui = translator.translate(batch_ui_str)
        translated_ui_vals = [t.strip() for t in translated_batch_ui.split('\n') if t.strip()]
        
        if len(translated_ui_vals) == len(ui_keys):
            for i, k in enumerate(ui_keys):
                translated_ui[k] = translated_ui_vals[i]
        else:
            raise ValueError("Mismatch")
    except Exception:
        print(f"[WARNING] UI translation failed. Fallback to English.")
        translated_ui = UI_TRANSLATIONS_EN.copy()
    
    return translated_ui

UI_MR = translate_ui_to('mr')
UI_HI = translate_ui_to('hi')
SCALE_MR = QUESTIONS_DATA_MR.get('response_scale', {}) if QUESTIONS_DATA_MR else {}
SCALE_HI = QUESTIONS_DATA_HI.get('response_scale', {}) if QUESTIONS_DATA_HI else {}

@app.route('/api/ui-translations', methods=['GET'])
def get_ui_translations():
    """Get Static UI translations for the requested language."""
    lang = request.args.get('lang', 'en')
    
    if lang == 'mr':
        return jsonify(UI_MR)
    elif lang == 'hi':
        return jsonify(UI_HI)
    else:
        return jsonify(UI_TRANSLATIONS_EN)

@app.route('/api/config', methods=['GET'])
def get_config():
    """Get dynamic UI configuration including category info and feedback messages."""
    return jsonify({
        "CATEGORY_ORDER": [
            "Realistic", "Investigative", "Artistic", "Social", "Enterprising", "Conventional"
        ],
        "CATEGORY_INFO": {
            "Realistic": {
                "color": "#062E27", "tint": "#CFEDED", "emoji": "/images/icons/hammer.png",
                "title": "Realistic (R)", "desc": "Practical, hands-on, and action-oriented problem solvers.",
                "videoSrc": "/RIASEC_Realistic_R_Career_Th.mp4"
            },
            "Investigative": {
                "color": "#062E27", "tint": "#CFEDED", "emoji": "/images/icons/search.png",
                "title": "Investigative (I)", "desc": "Analytical, intellectual, and scientific thinkers.",
                "videoSrc": "/RIASEC_Investigative_I_.mp4"
            },
            "Artistic": {
                "color": "#062E27", "tint": "#CFEDED", "emoji": "/images/icons/color-palette.png",
                "title": "Artistic (A)", "desc": "Creative, expressive, and original creators.",
                "videoSrc": "/RIASEC_Artistic_A_Video.mp4"
            },
            "Social": {
                "color": "#062E27", "tint": "#CFEDED", "emoji": "/images/icons/team.png",
                "title": "Social (S)", "desc": "Empathetic, helpful, and community-driven leaders.",
                "videoSrc": "/RIASEC_Social_S_Informativ.mp4"
            },
            "Enterprising": {
                "color": "#062E27", "tint": "#CFEDED", "emoji": "/images/icons/target.png",
                "title": "Enterprising (E)", "desc": "Ambitious, persuasive, and visionary leaders.",
                "videoSrc": "/RIASEC_Enterprising_E_Vide.mp4"
            },
            "Conventional": {
                "color": "#062E27", "tint": "#CFEDED", "emoji": "/images/icons/bar-chart.png",
                "title": "Conventional (C)", "desc": "Organized, detail-oriented, and systematic experts.",
                "videoSrc": "/RIASEC_Conventional_C_.mp4"
            }
        },
        "FEEDBACK_BY_RANK": {
            "5": ["That's so you!", "Spot on match!", "Big yes energy!", "Strong fit noted!"],
            "4": ["Nice, that fits!", "Good match!", "Solid pick!", "Leaning your way!"],
            "3": ["Fair enough!", "Right in the middle!", "Noted, staying neutral.", "Balanced answer!"],
            "2": ["Got it, noted.", "Not really your thing.", "Understood.", "Tracked that."],
            "1": ["Clear signal there.", "Definitely not you.", "Good to know!", "Noted, thanks."]
        },
        "MASCOT_MESSAGES": [
            "You're on a roll!", "Keep going, you're doing great!", "Nice pace — stay with it!",
            "Look at you go!", "Great focus so far!", "Halfway warrior energy!"
        ],
        "TOAST_HOLD_MS": 1250,
        "MASCOT_HOLD_MS": 2600
    })

# ============================================================
# ERROR HANDLERS
# ============================================================

def get_session_id():
    """Get or create a session ID."""
    if 'session_id' not in session:
        session['session_id'] = conversation_memory.generate_session_id()
    # Strip any large legacy keys to prevent session cookie size warnings
    for key in list(session.keys()):
        if key not in ['session_id', 'has_taken_test', 'user_id', 'role', 'name', 'email']:
            session.pop(key, None)
    return session['session_id']


def get_or_create_conversation():
    """Get or create a conversation for the current session."""
    session_id = get_session_id()
    return conversation_memory.get_session(session_id)

# ============================================================
# NORMALIZE CAREER RECORD
# ============================================================

def has_content(value):
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


def normalize_career_value(value):
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


def normalize_career_record(career):
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
        'skill_development_plan': ['skill_development_plan', 'skills_required', 'skills'],
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

    for target, sources in aliases.items():
        if target in normalized and has_content(normalized[target]):
            continue

        for source in sources:
            if source in normalized and has_content(normalized[source]):
                normalized[target] = normalized[source]
                break

    # Standardize where_will_you_study nested fields
    if 'where_will_you_study' in normalized and isinstance(normalized['where_will_you_study'], dict):
        study_data = normalized['where_will_you_study']
        if 'government_institutes' not in study_data and 'government' in study_data:
            study_data['government_institutes'] = study_data['government']
        if 'private_institutes' not in study_data and 'private' in study_data:
            study_data['private_institutes'] = study_data['private']
        if 'distance_learning' not in study_data and 'distance_learning' in study_data:
            study_data['distance_learning'] = study_data['distance_learning']

    # Standardize where_will_you_work nested fields
    if 'where_will_you_work' in normalized and isinstance(normalized['where_will_you_work'], dict):
        work_data = normalized['where_will_you_work']
        if 'places_of_work' not in work_data and 'places' in work_data:
            work_data['places_of_work'] = work_data['places']
        if 'work_environment' not in work_data and 'environment' in work_data:
            work_data['work_environment'] = work_data['environment']

    # Standardize expected_income nested salary keys to ensure frontend/prompt consistency
    if 'expected_income' in normalized and isinstance(normalized['expected_income'], dict):
        inc = normalized['expected_income']
        if 'minimum_monthly_salary' not in inc:
            for k in ['minimum_monthly_salary_inr', 'minimum_salary', 'min_salary']:
                if k in inc:
                    val = inc[k]
                    inc['minimum_monthly_salary'] = f"INR {val}" if isinstance(val, (int, float)) else str(val)
                    break
        if 'maximum_monthly_salary' not in inc:
            for k in ['maximum_monthly_salary_inr', 'maximum_salary', 'max_salary']:
                if k in inc:
                    val = inc[k]
                    inc['maximum_monthly_salary'] = f"INR {val}" if isinstance(val, (int, float)) else str(val)
                    break

    return {key: value for key, value in normalized.items() if has_content(value)}

# ============================================================
# FLASK ROUTES (API ONLY)
# ============================================================


@app.route('/api/questions', methods=['GET'])
def get_questions():
    """Get RIASEC questions."""
    lang = request.args.get('lang', 'en')
    
    if lang == 'mr':
        q_list = QUESTIONS_MR
        scale = SCALE_MR
    elif lang == 'hi':
        q_list = QUESTIONS_HI
        scale = SCALE_HI
    else:
        q_list = QUESTIONS
        scale = QUESTIONS_DATA.get('response_scale', {})
        
    try:
        return jsonify({
            'questions': q_list,
            'total': len(q_list),
            'response_scale': scale
        })
    except Exception as e:
        print(f"[ERROR] Error in get_questions: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/submit-answers', methods=['POST'])
def submit_answers():
    """Submit RIASEC answers and get career matches."""
    try:
        start_time = time.time()
        
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        answers = data.get('answers', [])
        student_info = data.get('student_info', {})
        language = data.get('language', 'en')
        
        print(f"[INFO] Processing {len(answers)} answers for {student_info.get('name', 'Student')}")
        
        scores = {"R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0}
        category_map = {
            "Realistic": "R",
            "Investigative": "I",
            "Artistic": "A",
            "Social": "S",
            "Enterprising": "E",
            "Conventional": "C"
        }
        
        for answer in answers:
            category = answer.get('category')
            if category in category_map:
                scores[category_map[category]] += answer.get('value', 0)
        
        print(f"[INFO] RIASEC Scores: {scores}")
        
        profile = generate_student_profile(scores, student_info)
        display_profile(profile)
        
        persona = persona_fusion.generate_persona(profile, student_info)
        persona_dict = persona.to_dict() if hasattr(persona, 'to_dict') else persona
        
        session.permanent = True
        session['has_taken_test'] = True
        
        session_id = get_session_id()
        conversation_memory.set_persona(session_id, persona_dict)
        conversation_memory.save_relational_profile(session_id, student_info)
        
        # Parse and seed detailed question-by-question quiz answers to database
        scale_mapping = {
            5: "Exactly Like Me",
            4: "Mostly Like Me",
            3: "Sometimes Like Me",
            2: "Rarely Like Me",
            1: "Not Like Me At All"
        }
        detailed_answers = []
        for ans in answers:
            q_id = ans.get('question_id')
            val = ans.get('value', 0)
            category = ans.get('category', '')
            q_text = "Unknown question text"
            if q_id and 1 <= q_id <= len(QUESTIONS):
                q_text = QUESTIONS[q_id - 1].get('question', '')
            detailed_answers.append({
                'question_id': q_id,
                'question': q_text,
                'category': category,
                'value': val,
                'response_text': scale_mapping.get(val, "Not Like Me At All")
            })
        conversation_memory.set_riasec_data(session_id, detailed_answers, scores)
        
        print("[INFO] Running career retrieval pipeline...")
        career_matches = retrieval_pipeline.retrieve(persona_dict, CAREER_DB)
        
        top_careers = []
        for match in career_matches[:6]:
            top_careers.append({
                'name': match.career_name,
                'match_score': round(match.match_score, 1),
                'riasec_score': round(match.riasec_match, 1),
                'personality_score': round(match.profile_match, 1),
                'subject_score': round(match.subject_match, 1),
                'interest_score': round(match.interest_match, 1),
                'data': normalize_career_record(match.career_data),
                'reason': match.reason,
                'strengths': match.strengths[:3],
                'improvement_areas': match.improvement_areas[:2]
            })
            
        if language != 'en':
            for c in top_careers:
                # Only bulk translate the static base data
                translated_data = translate_career_data({'data': c['data'], 'name': c['name']}, language)
                if 'data' in translated_data:
                    c['data'] = translated_data['data']
                
                # Use fast string translation for dynamic parts
                c['name'] = get_cached_translation(c['name'], language)
                c['reason'] = get_cached_translation(c['reason'], language)
                c['strengths'] = [get_cached_translation(s, language) for s in c['strengths']]
                c['improvement_areas'] = [get_cached_translation(i, language) for i in c['improvement_areas']]
        # Store in conversation memory (database)
        conversation_memory.set_career_matches(session_id, [m.to_dict() for m in career_matches])
        
        # Calculate final RIASEC code
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        riasec_code = "".join([code for code, score in sorted_scores if score > 0][:3])
        
        # Save unified overall session snapshot
        overall_snapshot = {
            'student_info': student_info,
            'riasec_answers': detailed_answers,
            'riasec_scores': scores,
            'riasec_code': riasec_code,
            'persona': persona_dict,
            'career_matches': top_careers
        }
        conversation_memory.set_overall_session(session_id, overall_snapshot)
        
        attempt_id = None
        try:
            submission_token = data.get('submission_token')
            save_res = assessment_service.save_assessment_attempt(
                user_id=session.get('user_id'),
                guest_session_id=session_id,
                student_profile=student_info,
                riasec_answers=detailed_answers,
                riasec_scores=scores,
                riasec_code=riasec_code,
                top_careers=top_careers,
                submission_token=submission_token
            )
            attempt_id = save_res['attempt_id']
        except Exception as e:
            print(f"[ERROR] Failed to save assessment attempt: {e}")
            import traceback
            traceback.print_exc()
        
        response_data = {
            'profile': profile,
            'scores': scores,
            'top_careers': top_careers,
            'attempt_id': attempt_id
        }
        
        elapsed_time = time.time() - start_time
        print(f"[SUCCESS] Returning {len(top_careers)} top careers (took {elapsed_time:.2f}s)")
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"[ERROR] Error in submit_answers: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/career-detail', methods=['POST'])
def career_detail():
    """Get detailed information about a specific career."""
    try:
        data = request.json
        career_name = data.get('career_name')
        language = data.get('language', 'en')
        
        # Check SQLite database first
        from modules.conversation_memory import conversation_memory
        target_record = conversation_memory.get_career_detail(career_name)
        
        if not target_record:
            print(f"[DEBUG] /api/career-detail called for career: '{career_name}'")
            # Fallback to local in-memory scan
            search_name = str(career_name).strip().lower()
            for career in CAREER_DB:
                db_name = str(career.get('career_name', '')).strip().lower()
                if db_name == search_name:
                    print(f"[DEBUG] Found career in CAREER_DB: '{career_name}'")
                    target_record = career
                    break
        
        if not target_record:
            print(f"[DEBUG] Career NOT FOUND in CAREER_DB: '{career_name}'")
            return jsonify({'error': 'Career not found'}), 404
            
        normalized = normalize_career_record(target_record)
        
        if "skill_development_plan" not in normalized or not normalized["skill_development_plan"]:
            print(f"[INFO] Dynamically generating Skill Development Plan for {career_name}...")
            try:
                # Give instruction to LLM to write in target language
                lang_instruction = f" Write it strictly in {language} language." if language != 'en' else ""
                prompt = f"Create a concise 'Skill Development Plan' for the career of {career_name}. List the key technical and soft skills required, and provide 3 practical steps a student can take to start building these skills right now. Format clearly using bullet points.{lang_instruction}"
                normalized['skill_development_plan'] = nova.generate_response(prompt)
            except Exception as e:
                print(f"[ERROR] LLM generation failed for skill plan: {e}")
                normalized['skill_development_plan'] = "Information currently unavailable."
                
        if language != 'en':
            # Remove skill_development_plan from normalized before translating to keep hash constant
            skill_plan = normalized.pop('skill_development_plan', None)
            
            translated_normalized = translate_career_data({'data': normalized, 'name': career_name}, language)
            if 'data' in translated_normalized:
                normalized = translated_normalized['data']
                
            # Reattach skill_development_plan
            if skill_plan:
                normalized['skill_development_plan'] = skill_plan
            elif 'skill_development_plan' in target_record:
                pass
                
        return jsonify({'career': normalized})
        
    except Exception as e:
        print(f"[ERROR] Error in career_detail: {e}")
        return jsonify({'error': str(e)}), 500


def find_mentioned_careers(message: str, career_db: list) -> list:
    """Find careers from the database mentioned in the user message."""
    mentioned = []
    msg_lower = message.lower()
    
    # Sort careers by name length descending to match longer names first
    sorted_db = sorted(career_db, key=lambda x: len(x.get('career_name', '')), reverse=True)
    
    for career in sorted_db:
        name = career.get('career_name', '')
        if not name or len(name) < 4:
            continue
            
        name_lower = name.lower()
        
        # Word boundary or substring check to be resilient to student typing patterns
        if name_lower in msg_lower:
            mentioned.append(career)
            # Limit to 3 additional context careers to prevent prompt bloat
            if len(mentioned) >= 3:
                break
                
    return mentioned


@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat messages with Nova."""
    # Production Security: Rate limiting check (max 30 requests/min per IP)
    ip_addr = request.headers.get('X-Forwarded-For', request.remote_addr)
    if not check_rate_limit(ip_addr):
        return jsonify({
            'response': "You are sending messages too quickly. Please wait a moment before trying again."
        }), 429

    try:
        start_time = time.time()
        
        data = request.json
        message = data.get('message', '').strip()
        language = data.get('language', 'en').strip()
        email = data.get('email')
        
        # Production Security: Input length validation (1500 chars)
        if len(message) > 1500:
            return jsonify({
                'response': "Your message is a bit too long. Please keep it under 1500 characters so I can help you better!"
            })
            
        if not message:
            return jsonify({
                'response': "Please ask me a question! I'm here to help with your career journey."
            })
        
        conv = get_or_create_conversation()
        session_id = get_session_id()
        
        # Cost Optimization: Apply User Rate Limits before LLM processing
        message_count = conversation_memory.get_user_message_count(session_id, email)
        if not email:
            return jsonify({
                'error': 'login_required',
                'response': "First login to connect with your AI Career Counselor!"
            }), 401
            
        if message_count >= 20:
            return jsonify({
                'response': "You have reached your limit of 20 messages per hour. Please wait a bit before continuing our conversation! Don't worry, your chat history is automatically saved."
            })
        
        # Get persona from SQLite session store or create default
        persona = conversation_memory.get_persona(session_id)
        if not persona:
            persona = {
                'student_info': {'name': 'Student'},
                'riasec_profile': {},
                'academic_profile': {},
                'interests': {},
                'preferences': {}
            }
        
        # Check SQLite session store for career matches
        career_matches = conversation_memory.get_career_matches(session_id)
        has_taken_test = session.get('has_taken_test', False) or (persona is not None and persona.get('riasec_profile') != {})
        
        # Build context for intent classification
        context = {
            'last_intent': conversation_memory.get_last_intent(session_id),
            'requires_retrieval': bool(has_taken_test),
            'is_career_related': bool(career_matches),
            'should_use_career_data': bool(career_matches)
        }
        
        # Classify intent
        classification = intent_classifier.classify(message, context)
        
        print(f"[INFO] Intent: {classification.intent} (confidence: {classification.confidence:.2f})")
        print(f"   Career related: {classification.is_career_related}")
        print(f"   Requires retrieval: {classification.requires_retrieval}")
        print(f"   Should use career data: {classification.should_use_career_data}")
        
        # Add user message to memory
        conversation_memory.add_message(session_id, 'user', message, classification.intent, email=email)
        
        # Get career matches if available and needed
        career_matches_data = []
        should_use_career_data = classification.should_use_career_data
        
        # 1. Fetch student's top matching careers from memory
        stored_matches = conversation_memory.get_career_matches(session_id)
        if stored_matches:
            for match_data in stored_matches[:6]:
                # Handle both dict and CareerMatch object
                if isinstance(match_data, dict):
                    career_matches_data.append(CareerMatch(
                        career_name=match_data.get('career_name', ''),
                        career_data=match_data.get('career_data', {}),
                        match_score=match_data.get('match_score', 0),
                        profile_match=match_data.get('profile_match', 0),
                        riasec_match=match_data.get('riasec_match', 0),
                        subject_match=match_data.get('subject_match', 0),
                        interest_match=match_data.get('interest_match', 0),
                        goal_match=match_data.get('goal_match', 0),
                        skill_match=match_data.get('skill_match', 0),
                        location_match=match_data.get('location_match', 0),
                        confidence=match_data.get('confidence', 0),
                        reason=match_data.get('reason', ''),
                        strengths=match_data.get('strengths', []),
                        improvement_areas=match_data.get('improvement_areas', []),
                        score_breakdown=match_data.get('score_breakdown', {})
                    ))
                else:
                    # Already a CareerMatch object
                    career_matches_data.append(match_data)
        
        # 2. Check user message for other mentioned database careers to pull contextual details dynamically
        mentioned_db_careers = find_mentioned_careers(message, CAREER_DB)
        for career in mentioned_db_careers:
            name = career.get('career_name', '')
            if name and not any(m.career_name.lower() == name.lower() for m in career_matches_data):
                career_matches_data.append(CareerMatch(
                    career_name=name,
                    career_data=career,
                    match_score=100.0,
                    profile_match=100.0,
                    riasec_match=100.0,
                    subject_match=100.0,
                    interest_match=100.0,
                    goal_match=100.0,
                    skill_match=100.0,
                    location_match=100.0,
                    confidence=1.0,
                    reason="Explicit query by user",
                    strengths=[],
                    improvement_areas=[],
                    score_breakdown={}
                ))
                # Enable career data retrieval in prompt builder
                should_use_career_data = True
        
        # Get conversation history
        history = conversation_memory.get_history_for_prompt(session_id, limit=config.max_history_for_prompt)
        previous_response = conv.messages[-1].content if conv.messages and conv.messages[-1].role == 'assistant' else None
        
        # Build prompt
        prompt = prompt_builder.build_prompt(
            persona=persona,
            career_matches=career_matches_data,
            user_message=message,
            intent=classification.intent,
            conversation_history=history,
            previous_response=previous_response,
            should_use_career_data=should_use_career_data
        )
        
        prompt += "\n\n[CRITICAL INSTRUCTION] You MUST keep your answer extremely concise, strictly within 3 to 4 lines maximum. Answer ethically, professionally, and straight to the point."
        
        # Inject language instruction if not english
        if language == 'hi':
            prompt += "\n\n[CRITICAL INSTRUCTION] You MUST respond in Hindi (हिंदी). Translate all career facts, titles, and details into natural, simple Hindi language so a high school student can understand it easily. Keep the tone helpful, warm, and counseling-oriented."
        elif language == 'mr':
            prompt += "\n\n[CRITICAL INSTRUCTION] You MUST respond in Marathi (मराठी). Translate all career facts, titles, and details into natural, simple Marathi language so a high school student can understand it easily. Keep the tone helpful, warm, and counseling-oriented."

        # Generate response
        raw_response = nova.generate_response(prompt, intent=classification.intent)
        
        # Validate response
        student_name = persona.get('student_info', {}).get('name', 'Student')
        all_careers_list = [c.get('career_name') for c in CAREER_DB if c.get('career_name')]
        validated_response = response_validator.validate(
            raw_response, career_matches_data, student_name, all_valid_careers=all_careers_list
        )
        
        # Add assistant response to memory
        conversation_memory.add_message(
            session_id, 'assistant', validated_response, classification.intent
        )
        
        elapsed_time = time.time() - start_time
        print(f"[CHAT] Chat response generated in {elapsed_time:.2f}s")
        
        return jsonify({'response': validated_response})
        
    except Exception as e:
        print(f"[ERROR] Error in chat: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'response': "I'm sorry, I encountered an error. Please try again."
        }), 500


# ============================================================
# ACCOUNT ROUTES
# ============================================================
from services.wallet_service import wallet_service
from services.pricing_service import pricing_service

@app.route('/api/account/summary', methods=['GET'])
def account_summary():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    try:
        attempts = assessment_service.get_user_attempts(user_id)
        wallet = wallet_service.get_balance(user_id)
        lowest_plan = pricing_service.get_lowest_active_plan()
        return jsonify({
            'status': 'success',
            'attempts': attempts,
            'wallet': {'balance': wallet},
            'lowest_plan': lowest_plan
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================
# ASSESSMENT ROUTES
# ============================================================

@app.route('/api/assessment/<attempt_id>/teaser', methods=['GET'])
def assessment_teaser(attempt_id):
    try:
        lang = request.args.get('lang', 'en')
        teaser = assessment_service.get_teaser(attempt_id)
        if not teaser:
            return jsonify({'error': 'Not found'}), 404
            
        owner_id = teaser.get('user_id')
        if owner_id:
            curr_user = session.get('user_id')
            if not curr_user:
                return jsonify({'error': 'Unauthorized'}), 401
            if str(curr_user) != str(owner_id) and session.get('role') != 'SUPER_ADMIN':
                return jsonify({'error': 'Forbidden'}), 403

        if lang != 'en':
            teaser = translate_teaser_data(teaser, lang)
            
        return jsonify(teaser)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/assessment/<attempt_id>/full', methods=['GET'])
def assessment_full(attempt_id):
    user_id = session.get('user_id')
    try:
        lang = request.args.get('lang', 'en')
        data = assessment_service.get_assessment_full(user_id, attempt_id)
        if not data:
            return jsonify({'error': 'Not found'}), 404
            
        if lang != 'en' and 'full_result_data' in data:
            if 'career_matches' in data['full_result_data']:
                matches = data['full_result_data']['career_matches']
                data['full_result_data']['career_matches'] = [translate_career_data(m, lang) for m in matches]
                
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 403

@app.route('/api/assessment/<attempt_id>/unlock', methods=['POST'])
def assessment_unlock(attempt_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    try:
        res = assessment_service.unlock_assessment(user_id, attempt_id)
        return jsonify(res)
    except ValueError as e:
        msg = str(e)
        if "not found" in msg.lower():
            return jsonify({'error': msg}), 404
        if "unauthorized" in msg.lower():
            return jsonify({'error': msg}), 403
        return jsonify({'error': msg}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# ============================================================
# AUTH ROUTES
# ============================================================
from services.auth_service import AuthService
from services.assessment_service import AssessmentService

auth_service = AuthService()
assessment_service = AssessmentService()

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json or {}
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    phone = data.get('phone')
    education_level = data.get('education_level')
    attempt_id = data.get('attempt_id')
    
    try:
        user = auth_service.create_user(email, password, full_name, phone, education_level)
        session['user_id'] = user['id']
        session['role'] = user['role']
        
        redirect_url = '/account'
        if attempt_id:
            try:
                assessment_service.claim_guest_assessment(attempt_id=attempt_id, user_id=user['id'])
                redirect_url = f'/pricing?attempt_id={attempt_id}'
            except Exception as e:
                print(f"[WARNING] Failed to claim attempt {attempt_id}: {e}")
                
        return jsonify({'status': 'success', 'user': user, 'redirect': redirect_url})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json or {}
    email = data.get('email')
    password = data.get('password')
    attempt_id = data.get('attempt_id')
    
    try:
        user = auth_service.authenticate_user(email, password)
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
            
        session['user_id'] = user['id']
        session['role'] = user['role']
        
        redirect_url = '/account'
        if attempt_id:
            try:
                assessment_service.claim_guest_assessment(attempt_id=attempt_id, user_id=user['id'])
                redirect_url = f'/pricing?attempt_id={attempt_id}'
            except Exception as e:
                print(f"[WARNING] Failed to claim attempt {attempt_id}: {e}")
                
        return jsonify({'status': 'success', 'user': user, 'redirect': redirect_url})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'status': 'success'})

@app.route('/api/auth/me', methods=['GET'])
def get_me():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    return jsonify({'user': {'id': session['user_id'], 'role': session.get('role', 'USER')}})

@app.route('/api/all-careers', methods=['GET'])
def all_careers():
    """Get all careers."""
    try:
        return jsonify({
            'careers': [normalize_career_record(career) for career in CAREER_DB]
        })
    except Exception as e:
        print(f"[ERROR] Error in all_careers: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/clear-session', methods=['POST'])
def clear_session():
    """Clear the current session cookie to start a fresh attempt without deleting old records."""
    try:
        session.clear()
        return jsonify({'status': 'success'})
    except Exception as e:
        print(f"[ERROR] Error in clear_session: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/contact', methods=['POST'])
def save_contact():
    """Receive and save a contact form submission."""
    if not check_rate_limit(request.remote_addr):
        return jsonify({'error': 'Too many requests. Please try again later.'}), 429
    try:
        data = request.get_json() or {}
        fullname = data.get('fullname') or data.get('name')
        email = data.get('email')
        company = data.get('company')
        subject = data.get('subject')
        message = data.get('message')
        
        if not fullname or not email or not subject or not message:
            return jsonify({'error': 'Required fields are missing.'}), 400
            
        conversation_memory.add_contact_message(
            # pyrefly: ignore [unexpected-keyword]
            fullname=str(fullname).strip(),
            email=str(email).strip(),
            company=str(company).strip() if company else None,
            subject=str(subject).strip(),
            message=str(message).strip()
        )
        return jsonify({'status': 'success', 'message': 'Contact form saved successfully.'})
    except Exception as e:
        print(f"[ERROR] Error in save_contact: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/feedback', methods=['POST'])
def save_feedback():
    """Receive and save student guide feedback."""
    try:
        data = request.get_json() or {}
        liked_result = data.get('liked_result')
        feedback_category = data.get('feedback_category') or 'career_match'
        comment = data.get('comment') or ''
        career_id = data.get('career_id')
        
        # Retrieve session_id
        session_id = session.get('session_id')
        if not session_id:
            return jsonify({'error': 'No active session found.'}), 400
            
        if liked_result is None or not career_id:
            return jsonify({'error': 'Required feedback parameters are missing.'}), 400
            
        # liked_result should be saved as integer (1 for True, 0 for False)
        liked_val = 1 if liked_result else 0
        
        conversation_memory.add_feedback(
            session_id,
            {
                'career_id': str(career_id).strip(),
                'liked_result': liked_val,
                'feedback_category': str(feedback_category).strip(),
                'comment': str(comment).strip()
            }
        )
        return jsonify({'status': 'success', 'message': 'Feedback saved successfully.'})
    except Exception as e:
        print(f"[ERROR] Error in save_feedback: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# PAYMENT ROUTES
# ============================================================

from services.payment_service import payment_service

@app.route('/api/payments/create-order', methods=['POST'])
def create_payment_order():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json or {}
    plan_id = data.get('plan_id')
    referral_code = data.get('referral_code')
    attempt_id = data.get('attempt_id')
    
    if not plan_id:
        return jsonify({'error': 'plan_id is required'}), 400
        
    try:
        res = payment_service.create_payment_order(
            user_id=session['user_id'],
            plan_id=plan_id,
            referral_code=referral_code,
            attempt_id=attempt_id
        )
        return jsonify(res)
    except Exception as e:
        print(f"[ERROR] create_payment_order: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/api/payments/verify', methods=['POST'])
def verify_payment():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    data = request.json or {}
    order_id = data.get('razorpay_order_id')
    payment_id = data.get('razorpay_payment_id')
    signature = data.get('razorpay_signature')
    attempt_id = data.get('attempt_id')
    
    if not order_id or not payment_id or not signature:
        return jsonify({'error': 'Missing verification data'}), 400
        
    try:
        res = payment_service.verify_and_process_payment(
            user_id=session['user_id'],
            razorpay_order_id=order_id,
            razorpay_payment_id=payment_id,
            razorpay_signature=signature,
            attempt_id=attempt_id
        )
        return jsonify(res)
    except Exception as e:
        print(f"[ERROR] verify_payment: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/api/payments/cancel', methods=['POST'])
def cancel_payment():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    data = request.json or {}
    order_id = data.get('order_id')
    if not order_id:
        return jsonify({'error': 'order_id is required'}), 400
        
    try:
        success = payment_service.mark_payment_cancelled(session['user_id'], order_id)
        return jsonify({'success': success})
    except Exception as e:
        print(f"[ERROR] cancel_payment: {e}")
        return jsonify({'error': str(e)}), 400


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    print(f"[ERROR] Internal server error: {error}")
    return jsonify({'error': 'Internal server error'}), 500


# ============================================================
# IMAGE UPLOAD (PERMANENT HOSTING)
# ============================================================
@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({'status': 'error', 'message': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'status': 'error', 'message': 'No selected file'}), 400
        
    allowed_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.webp'}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        return jsonify({'status': 'error', 'message': 'Invalid file type'}), 400
        
    try:
        # Instead of third-party APIs that block VPS IPs, host it locally.
        # Ensure data/uploads directory exists
        upload_folder = os.path.join(app.root_path, 'data', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        
        # Generate a unique secure filename
        import uuid
        ext = os.path.splitext(file.filename)[1] or '.png'
        unique_filename = f"career_card_{uuid.uuid4().hex}{ext}"
        
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        
        # Generate the absolute public URL for the image
        file_url = request.host_url.rstrip('/') + f"/api/uploads/{unique_filename}"
        
        return jsonify({'status': 'success', 'data': {'url': file_url}})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/uploads/<path:filename>')
def serve_upload(filename):
    """Serve uploaded images from the local data directory."""
    from flask import send_from_directory
    upload_folder = os.path.join(app.root_path, 'data', 'uploads')
    return send_from_directory(upload_folder, filename)

# ============================================================
# DEVELOPER / ADMIN DASHBOARD ROUTES
# ============================================================
from services.stats_service import stats_service
from services.auth_service import auth_service

def require_developer():
    """Helper to enforce developer role"""
    user_id = session.get('user_id')
    role = session.get('role')
    if not user_id:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
    
    # Super admins are always allowed, otherwise check for developer flag
    if role == 'SUPER_ADMIN':
        return None
        
    user = auth_service.get_user_by_id(user_id)
    if not user or user.get('role') not in ('DEVELOPER', 'SUPER_ADMIN') or not user.get('is_active'):
        return jsonify({'status': 'error', 'message': 'Forbidden'}), 403
    return None

@app.route('/api/developer/stats', methods=['GET'])
def dev_stats():
    err = require_developer()
    if err: return err
    return jsonify(stats_service.get_dashboard_stats())

@app.route('/api/developer/users', methods=['GET'])
def dev_users():
    err = require_developer()
    if err: return err
    return jsonify({'users': auth_service.list_all_users()})

@app.route('/api/developer/plans', methods=['GET'])
def dev_plans():
    err = require_developer()
    if err: return err
    return jsonify({'status': 'success', 'data': []})

@app.route('/api/developer/campaigns', methods=['GET'])
def dev_campaigns():
    err = require_developer()
    if err: return err
    return jsonify({'status': 'success', 'data': []})

@app.route('/api/developer/audit-log', methods=['GET'])
def dev_audit():
    err = require_developer()
    if err: return err
    return jsonify({'status': 'success', 'data': []})

@app.route('/api/developer/accounts', methods=['GET'])
def dev_accounts():
    err = require_developer()
    if err: return err
    return jsonify({'status': 'success', 'data': []})

@app.route('/api/developer/accounts/invite', methods=['POST'])
def dev_accounts_invite():
    err = require_developer()
    if err: return err
    return jsonify({'status': 'success', 'message': 'Invited'})

# ============================================================
# MAIN
# ============================================================

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("[STARTUP] SkillSense SERVER STARTING... (Production Ready)")
    print("=" * 60)
    print(f"[INFO] Loaded {len(CAREER_DB)} careers")
    print(f"[INFO] Loaded {len(QUESTIONS)} questions")
    print(f"[INFO] Nova Engine: {'Ready' if nova._client else 'Fallback Mode'}")
    print(f"[INFO] Ranking Weights: {retrieval_pipeline._to_career_matches.__code__.co_filename if hasattr(retrieval_pipeline, '_to_career_matches') else 'Configured'}")
    print("[INFO] Server running at http://localhost:5000")
    print("=" * 60 + "\n")
    
    print("[INFO] Starting Waitress Production WSGI Server...")
    from waitress import serve
    serve(app, host='0.0.0.0', port=5000, threads=6)