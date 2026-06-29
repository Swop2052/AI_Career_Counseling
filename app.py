# app.py - Complete Production Flask Application
from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
import json
import os
import time
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ============================================================
# IMPORT CORE MODULES
# ============================================================
from core.config import config
from core.models import Conversation, CareerMatch
from core.exceptions import (
    IntentClassificationError, PersonaGenerationError,
    RetrievalError, LLMError, ValidationError
)

# ============================================================
# SETUP FLASK
# ============================================================
app = Flask(__name__)
app.secret_key = config.secret_key
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=config.session_lifetime_hours)
app.config['SESSION_COOKIE_SECURE'] = config.flask_env == 'production'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
CORS(app, supports_credentials=True)

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
    """Load career database from JSON file."""
    try:
        with open(config.career_db_path, "r", encoding="utf-8-sig") as file:
            data = json.load(file)
        careers = data.get("careers", [])
        print(f"[SUCCESS] Loaded {len(careers)} careers from {config.career_db_path}")
        return careers
    except FileNotFoundError:
        print(f"[ERROR] File not found: {config.career_db_path}")
        return []
    except json.JSONDecodeError as e:
        print(f"[ERROR] JSON Error in {config.career_db_path}: {e}")
        return []
    except Exception as e:
        print(f"[ERROR] Career Database Error: {e}")
        return []


def load_riasec_questions():
    """Load RIASEC questions from JSON file."""
    try:
        with open(config.riasec_questions_path, "r", encoding="utf-8-sig") as f:
            data = json.load(f)
        print(f"[SUCCESS] Loaded RIASEC questions from {config.riasec_questions_path}")
        return data
    except FileNotFoundError:
        print(f"[ERROR] File not found: {config.riasec_questions_path}")
        return {}
    except json.JSONDecodeError as e:
        print(f"[ERROR] JSON Error in {config.riasec_questions_path}: {e}")
        return {}
    except Exception as e:
        print(f"[ERROR] RIASEC Questions Error: {e}")
        return {}


# Load data
CAREER_DB = load_career_database()
QUESTIONS_DATA = load_riasec_questions()


def prepare_questions():
    """Prepare questions for the frontend."""
    questions = []
    if not QUESTIONS_DATA:
        return []
    
    for category, question_list in QUESTIONS_DATA.items():
        if category == "response_scale":
            continue
        if not isinstance(question_list, list):
            continue
        for question in question_list:
            questions.append({
                "id": len(questions) + 1,
                "question": question,
                "category": category
            })
    
    print(f"[SUCCESS] Prepared {len(questions)} questions")
    return questions


QUESTIONS = prepare_questions()

# ============================================================
# SESSION HELPERS
# ============================================================

def get_session_id():
    """Get or create a session ID."""
    if 'session_id' not in session:
        session['session_id'] = conversation_memory.generate_session_id()
    # Strip any large legacy keys to prevent session cookie size warnings
    for key in list(session.keys()):
        if key not in ['session_id', 'has_taken_test']:
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
# FLASK ROUTES
# ============================================================

@app.route('/')
def index():
    """Render the main page and clear previous session to start clean."""
    try:
        if 'session_id' in session:
            conversation_memory.clear_session(session['session_id'])
        session.clear()
        conversation_memory.cleanup_old_sessions()
    except Exception as e:
        print(f"[WARNING] Error cleaning up database on index load: {e}")
    return render_template('index.html')


@app.route('/api/questions', methods=['GET'])
def get_questions():
    """Get RIASEC questions."""
    try:
        return jsonify({
            'questions': QUESTIONS,
            'total': len(QUESTIONS),
            'response_scale': QUESTIONS_DATA.get('response_scale', {})
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
        
        print("[INFO] Running career retrieval pipeline...")
        career_matches = retrieval_pipeline.retrieve(persona_dict, CAREER_DB)
        
        top_careers = []
        for match in career_matches[:6]:
            top_careers.append({
                'name': match.career_name,
                'score': round(match.match_score, 1),
                'riasec_score': round(match.riasec_match, 1),
                'personality_score': round(match.profile_match, 1),
                'subject_score': round(match.subject_match, 1),
                'interest_score': round(match.interest_match, 1),
                'data': normalize_career_record(match.career_data),
                'reason': match.reason,
                'strengths': match.strengths[:3],
                'improvement_areas': match.improvement_areas[:2]
            })
        
        # Store in conversation memory (database)
        conversation_memory.set_career_matches(session_id, [m.to_dict() for m in career_matches])
        
        response_data = {
            'profile': profile,
            'scores': scores,
            'top_careers': top_careers
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
        
        for career in CAREER_DB:
            if career.get('career_name') == career_name:
                return jsonify({'career': normalize_career_record(career)})
        
        return jsonify({'error': 'Career not found'}), 404
        
    except Exception as e:
        print(f"[ERROR] Error in career_detail: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat messages with Nova."""
    try:
        start_time = time.time()
        
        data = request.json
        message = data.get('message', '').strip()
        
        if not message:
            return jsonify({
                'response': "Please ask me a question! I'm here to help with your career journey."
            })
        
        conv = get_or_create_conversation()
        session_id = get_session_id()
        
        # Get persona from SQLite database memory or create default
        persona = conversation_memory.get_persona(session_id)
        if not persona:
            persona = {
                'student_info': {'name': 'Student'},
                'riasec_profile': {},
                'academic_profile': {},
                'interests': {},
                'preferences': {}
            }
        
        # Check SQLite database for career matches
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
        conversation_memory.add_message(session_id, 'user', message, classification.intent)
        
        # Get career matches if available and needed
        career_matches_data = []
        should_use_career_data = classification.should_use_career_data
        
        if classification.requires_retrieval or should_use_career_data:
            # Try to get career matches from database memory
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
        
        # Generate response
        raw_response = nova.generate_response(prompt)
        
        # Validate response
        student_name = persona.get('student_info', {}).get('name', 'Student')
        validated_response = response_validator.validate(
            raw_response, career_matches_data, student_name
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
    """Clear the current session."""
    try:
        session_id = get_session_id()
        conversation_memory.clear_session(session_id)
        session.clear()
        return jsonify({'status': 'success'})
    except Exception as e:
        print(f"[ERROR] Error in clear_session: {e}")
        return jsonify({'error': str(e)}), 500


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
# MAIN
# ============================================================

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("[STARTUP] AI CAREER GUIDE SERVER STARTING... (Production Ready)")
    print("=" * 60)
    print(f"[INFO] Loaded {len(CAREER_DB)} careers")
    print(f"[INFO] Loaded {len(QUESTIONS)} questions")
    print(f"[INFO] Nova Engine: {'Ready' if nova._client else 'Fallback Mode'}")
    print(f"[INFO] Ranking Weights: {retrieval_pipeline._to_career_matches.__code__.co_filename if hasattr(retrieval_pipeline, '_to_career_matches') else 'Configured'}")
    print("[INFO] Server running at http://localhost:5000")
    print("=" * 60 + "\n")
    
    app.run(
        debug=config.debug,
        host='0.0.0.0',
        port=5000,
        threaded=True
    )