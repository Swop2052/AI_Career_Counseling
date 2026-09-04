# app.py - Complete Production Flask Application
import sys
import io

# Force stdout/stderr to use UTF-8 encoding on Windows to prevent Unicode/Emoji print crashes
if sys.platform.startswith('win'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import werkzeug
if not hasattr(werkzeug, '__version__'):
    try:
        import importlib.metadata
        werkzeug.__version__ = importlib.metadata.version('werkzeug')
    except Exception:
        werkzeug.__version__ = '3.0.0'

from flask import Flask, render_template, request, jsonify, session, redirect, abort
from flask_cors import CORS
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
from core.exceptions import (
    IntentClassificationError, PersonaGenerationError,
    RetrievalError, LLMError, ValidationError
)
from modules.vector_store import vector_store

# ============================================================
# IMPORT MONETIZATION SERVICES & RUN MIGRATIONS
# ============================================================
from database.migrations import run_migrations
from services.auth_service import auth_service
from services.wallet_service import wallet_service
from services.payment_service import payment_service
from services.pricing_service import pricing_service
from services.campaign_service import campaign_service
from services.assessment_service import assessment_service
from services.stats_service import stats_service
from services.email_service import email_service

# Initialize SQLite schema and pending migrations on server startup
run_migrations()

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

# Register Flask CLI commands (flask create-super-admin, etc.)
from cli_commands import register_cli_commands
register_cli_commands(app)

# ============================================================
# RATE LIMITING (SECURITY GUARD)
# ============================================================
from collections import defaultdict

# ============================================================
# RATE LIMITING & SECURITY GUARDS
# ============================================================
from collections import defaultdict
import re

# Keyed rate limiter: key (e.g. 'ip' or 'action:ip') -> list of timestamps
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 30  # default maximum requests per window
ip_request_history = defaultdict(list)

def check_rate_limit(key, max_requests=RATE_LIMIT_MAX_REQUESTS, window_seconds=RATE_LIMIT_WINDOW):
    """In-memory rate limiter per key. Returns True if request is within allowed quota."""
    now = time.time()
    ip_request_history[key] = [t for t in ip_request_history[key] if now - t < window_seconds]
    if len(ip_request_history[key]) >= max_requests:
        return False
    ip_request_history[key].append(now)
    return True

# Blocked path & sensitive file patterns (probes, database dumps, environment files, source code)
BLOCKED_PATH_PATTERNS = [
    re.compile(r'/\.', re.IGNORECASE),                               # Dotfiles (.env, .git, .gitignore, etc.)
    re.compile(r'\.(?:db|sqlite\d*|log|py|sql|bak|backup|swp|pem|key|env|ini|cfg|toml)$', re.IGNORECASE),
    re.compile(r'^/(?:admin|phpmyadmin|wp-admin|wp-login|debug|test|dev|config|database|logs|server-status)(?:/|$)', re.IGNORECASE)
]

@app.before_request
def security_request_filter():
    """Block unauthorized probe paths, dotfiles, sensitive extensions, and path traversal."""
    raw_path = request.path
    
    # 1. Block directory traversal attempts
    if '..' in raw_path or '%2e' in raw_path.lower():
        abort(404)
        
    # 2. Check blocked patterns (skip static allowed files)
    lower_path = raw_path.lower()
    for pattern in BLOCKED_PATH_PATTERNS:
        if pattern.search(lower_path):
            print(f"[SECURITY ALERT] Blocked probe to '{raw_path}' from IP: {request.remote_addr}")
            abort(404)

@app.after_request
def add_security_headers(response):
    """Add defensive security headers without breaking Razorpay or frontend assets."""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
    
    # Razorpay Checkout and external CDN compatible Content-Security-Policy
    csp_directives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https: blob:",
        "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
        "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com"
    ]
    response.headers['Content-Security-Policy'] = "; ".join(csp_directives)
    
    if request.is_secure:
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
    return response

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
    # Strip any large legacy keys while preserving active authentication and assessment state
    preserved_keys = ['session_id', 'guest_session_id', 'pending_attempt_id', 'has_taken_test', 'user_id', 'email', 'role', 'full_name']
    for key in list(session.keys()):
        if key not in preserved_keys:
            session.pop(key, None)
    return session['session_id']


def require_developer(f):
    """Allow active DEVELOPER or SUPER_ADMIN roles directly verified against database."""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Authentication required. Please log in.'}), 401
        
        user = auth_service.get_user_by_id(user_id)
        if not user or not user.get('is_active', 1):
            return jsonify({'error': 'Access denied.'}), 403
        
        db_role = user.get('role')
        if db_role not in ('DEVELOPER', 'SUPER_ADMIN'):
            return jsonify({'error': 'Access denied.'}), 403
            
        session['role'] = db_role
        return f(*args, **kwargs)
    return decorated_function


def require_super_admin(f):
    """Restrict to active SUPER_ADMIN role directly verified against database."""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Authentication required. Please log in.'}), 401
            
        user = auth_service.get_user_by_id(user_id)
        if not user or not user.get('is_active', 1):
            return jsonify({'error': 'Access denied.'}), 403
            
        db_role = user.get('role')
        if db_role != 'SUPER_ADMIN':
            return jsonify({'error': 'Access denied.'}), 403
            
        session['role'] = db_role
        return f(*args, **kwargs)
    return decorated_function


def require_can_manage_developers(f):
    """Allow active SUPER_ADMIN, or DEVELOPER with can_manage_developers permission directly verified against database."""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Authentication required. Please log in.'}), 401
        
        user = auth_service.get_user_by_id(user_id)
        if not user or not user.get('is_active', 1):
            return jsonify({'error': 'Access denied.'}), 403
            
        role = user.get('role')
        can_manage = bool(user.get('can_manage_developers', False))

        if role not in ('DEVELOPER', 'SUPER_ADMIN'):
            return jsonify({'error': 'Access denied.'}), 403
        if role == 'SUPER_ADMIN':
            session['role'] = 'SUPER_ADMIN'
            session['can_manage_developers'] = True
            return f(*args, **kwargs)
        if not can_manage:
            return jsonify({'error': 'Access denied.'}), 403
            
        session['role'] = role
        session['can_manage_developers'] = can_manage
        return f(*args, **kwargs)
    return decorated_function


def require_auth(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Authentication required. Please log in.'}), 401
        return f(*args, **kwargs)
    return decorated_function


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
    """Render the main page."""
    return render_template('home.html')

@app.route('/how-it-works')
def how_it_works():
    """Render the How it works page."""
    return render_template('how.html')

@app.route('/take-test')
def take_test():
    """Render the Take Test page."""
    from flask import make_response
    response = make_response(render_template('test.html'))
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

@app.route('/api/questions', methods=['GET'])
def api_get_questions():
    """Return RIASEC assessment questions."""
    return jsonify({
        'questions': QUESTIONS,
        'total': len(QUESTIONS),
        'scale': QUESTIONS_DATA.get('response_scale', {})
    })

@app.route('/ai-counselor')
def ai_counselor():
    """Render the AI Counselor page."""
    return render_template('counselor.html')

# Disable HTML caching so the latest UI changes are always served
@app.after_request
def add_header(response):
    if 'text/html' in response.headers.get('Content-Type', ''):
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
    return response

@app.route('/contact')
def contact():
    """Render the Contact page."""
    return render_template('contact.html')

@app.route('/login')
def login_page():
    """Render Login page (redirects to /account if already logged in)."""
    if session.get('user_id'):
        next_url = request.args.get('next') or '/account'
        return redirect(next_url)
    return render_template('login.html')

@app.route('/signup')
def signup_page():
    """Render Sign Up page (redirects to /account if already logged in)."""
    if session.get('user_id'):
        next_url = request.args.get('next') or '/account'
        return redirect(next_url)
    return render_template('signup.html')

@app.route('/logout')
def logout():
    """Sign out user and clear session cleanly."""
    session.clear()
    return redirect('/')

@app.route('/account')
def account_page():
    """Render User Account Dashboard page (protected route)."""
    if not session.get('user_id'):
        return redirect('/login?next=/account')
    return render_template('account.html')

@app.route('/pricing')
def pricing_page():
    """Render Pricing & Credit Plans page."""
    return render_template('pricing.html')

@app.route('/developer')
def developer_page():
    """Render Developer & Admin Dashboard page (DEVELOPER and SUPER_ADMIN)."""
    user_id = session.get('user_id')
    if not user_id:
        return redirect('/login?next=/developer')
        
    user = auth_service.get_user_by_id(user_id)
    if not user or not user.get('is_active', 1) or user.get('role') not in ('DEVELOPER', 'SUPER_ADMIN'):
        print(f"[SECURITY ALERT] Unauthorized access attempt to /developer by user {user_id}")
        abort(403)
        
    session['role'] = user.get('role')
    return render_template('developer.html')


@app.route('/setup-account')
def setup_account_page():
    """Render invitation acceptance / account setup page."""
    token = request.args.get('token', '')
    if not token:
        return redirect('/login')
    return render_template('setup_account.html', token=token)

# ============================================================
# AUTHENTICATION API ENDPOINTS
# ============================================================

@app.route('/api/auth/signup', methods=['POST'])
def api_signup():
    ip_addr = request.headers.get('X-Forwarded-For', request.remote_addr)
    if not check_rate_limit(f"signup:{ip_addr}", max_requests=10, window_seconds=60):
        return jsonify({'error': 'Too many signup attempts. Please wait a minute before trying again.'}), 429

    try:
        data = request.json or {}
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name') or 'Student'
        phone = data.get('phone')
        education_level = data.get('education_level')
        attempt_id = data.get('attempt_id') or session.get('pending_attempt_id')

        user = auth_service.create_user(
            email=email,
            password=password,
            full_name=full_name,
            phone=phone,
            education_level=education_level
        )

        session.permanent = True
        session['user_id'] = user['id']
        session['email'] = user['email']
        session['user_email'] = user['email']
        session['role'] = user['role']
        session['full_name'] = user['full_name']

        # Link any pending guest assessment attempts to newly created account
        guest_sess_id = session.get('guest_session_id') or session.get('session_id')
        claimed_count = assessment_service.claim_guest_assessment(
            guest_session_id=guest_sess_id,
            user_id=user['id'],
            attempt_id=attempt_id
        )
        print(f"[INFO] Claimed {claimed_count} guest assessment(s) for user {user['id']} (attempt: {attempt_id})")

        # Planned Flow: After signup with pending assessment, redirect to account page
        # Account page handles credit check + auto-unlock or purchase prompt
        if attempt_id:
            session['pending_attempt_id'] = attempt_id
            redirect_target = '/account'
        else:
            redirect_target = data.get('next') or '/account'

        return jsonify({'status': 'success', 'user': user, 'redirect': redirect_target, 'attempt_id': attempt_id})
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Signup Error: {e}")
        return jsonify({'error': 'Failed to create account.'}), 500


@app.route('/api/auth/login', methods=['POST'])
def api_login():
    ip_addr = request.headers.get('X-Forwarded-For', request.remote_addr)
    if not check_rate_limit(f"login:{ip_addr}", max_requests=10, window_seconds=60):
        return jsonify({'error': 'Too many login attempts. Please wait a minute before trying again.'}), 429

    try:
        data = request.json or {}
        email = data.get('email')
        password = data.get('password')
        attempt_id = data.get('attempt_id') or session.get('pending_attempt_id')

        user = auth_service.authenticate_user(email, password)
        if not user:
            return jsonify({'error': 'Invalid email or password.'}), 401

        session.permanent = True
        session['user_id'] = user['id']
        session['email'] = user['email']
        session['user_email'] = user['email']
        session['role'] = user['role']
        session['full_name'] = user['full_name']

        # Link any pending guest assessment attempts to logged-in account
        guest_sess_id = session.get('guest_session_id') or session.get('session_id')
        claimed_count = assessment_service.claim_guest_assessment(
            guest_session_id=guest_sess_id,
            user_id=user['id'],
            attempt_id=attempt_id
        )
        print(f"[INFO] Claimed {claimed_count} guest assessment(s) for user {user['id']} (attempt: {attempt_id})")

        if user['role'] in ('DEVELOPER', 'SUPER_ADMIN'):
            # Store can_manage_developers permission in session
            session['can_manage_developers'] = user.get('can_manage_developers', False)
            redirect_target = data.get('next') or '/developer'
        elif attempt_id:
            session['pending_attempt_id'] = attempt_id
            redirect_target = '/account'
        else:
            redirect_target = data.get('next') or '/account'

        return jsonify({'status': 'success', 'user': user, 'redirect': redirect_target, 'attempt_id': attempt_id})
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Login Error: {e}")
        return jsonify({'error': 'Authentication error.'}), 500


@app.route('/api/auth/me', methods=['GET'])
def api_me():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'authenticated': False}), 200

    user = auth_service.get_user_by_id(user_id)
    if not user:
        session.clear()
        return jsonify({'authenticated': False}), 200

    return jsonify({
        'authenticated': True,
        'user': {
            'id': user['id'],
            'email': user['email'],
            'role': user['role'],
            'full_name': user['full_name'],
            'balance': user['balance']
        }
    })


@app.route('/api/session/clear-pending', methods=['POST'])
def api_clear_pending():
    """Clear the pending_attempt_id from session after successful unlock or navigation."""
    session.pop('pending_attempt_id', None)
    return jsonify({'status': 'success'})


@app.route('/api/auth/forgot-password', methods=['POST'])
def api_forgot_password():
    ip_addr = request.headers.get('X-Forwarded-For', request.remote_addr)
    if not check_rate_limit(f"forgot:{ip_addr}", max_requests=5, window_seconds=60):
        return jsonify({'error': 'Too many password reset attempts. Please wait a moment before trying again.'}), 429

    data = request.get_json(silent=True) or {}
    email = (data.get('email') or data.get('identifier') or '').strip().lower()
    if not email:
        return jsonify({'error': 'Please enter a valid email address.'}), 400

    try:
        auth_service.create_password_reset_otp(email)
        return jsonify({
            'status': 'success',
            'message': 'If an account exists for this email, a 6-digit verification code has been sent.'
        })
    except ValueError as ve:
        print(f"[INFO] Forgot password validation notice: {ve}")
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Forgot password server error: {e}")
        return jsonify({'error': 'Failed to send verification code. Please check your email and try again.'}), 500


@app.route('/api/auth/verify-otp', methods=['POST'])
def api_verify_otp():
    ip_addr = request.headers.get('X-Forwarded-For', request.remote_addr)
    if not check_rate_limit(f"otp:{ip_addr}", max_requests=10, window_seconds=60):
        return jsonify({'error': 'Too many verification attempts. Please wait a moment before trying again.'}), 429

    data = request.get_json(silent=True) or {}
    email = (data.get('email') or data.get('identifier') or '').strip().lower()
    otp_code = str(data.get('otp_code') or data.get('otp') or data.get('code') or '')
    new_password = data.get('new_password') or data.get('password') or ''

    if not email or not otp_code or not new_password:
        return jsonify({'error': 'Email, 6-digit verification code, and new password are required.'}), 400

    try:
        auth_service.verify_otp_and_reset_password(email, otp_code, new_password)
        return jsonify({
            'status': 'success',
            'message': 'Your password has been reset successfully! Please sign in with your new password.'
        })
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Verify OTP server error: {e}")
        return jsonify({'error': 'Failed to verify code or reset password.'}), 500


@app.route('/api/profile/update', methods=['POST'])
@require_auth
def api_profile_update():
    user_id = session.get('user_id')
    data = request.json or {}
    try:
        updated_user = auth_service.update_user_profile(user_id, data)
        # Update session full_name
        session['full_name'] = updated_user.get('full_name', 'Student')
        completeness = auth_service.get_profile_completeness(updated_user)
        return jsonify({
            'status': 'success',
            'user': updated_user,
            'completeness': completeness
        })
    except Exception as e:
        print(f"[ERROR] Profile update failed: {e}")
        return jsonify({'error': 'Failed to update profile details.'}), 500

# ============================================================
# ACCOUNT & ASSESSMENT ACCESS CONTROL API ENDPOINTS
# ============================================================

@app.route('/api/account/summary', methods=['GET'])
@require_auth
def api_account_summary():
    user_id = session.get('user_id')
    user = auth_service.get_user_by_id(user_id)
    balance = wallet_service.get_balance(user_id)
    attempts = assessment_service.get_user_attempts(user_id)
    txs = wallet_service.get_transaction_history(user_id)

    lowest_plan = pricing_service.get_lowest_active_plan()
    return jsonify({
        'user': user,
        'wallet': {'balance': balance},
        'attempts': attempts,
        'transactions': txs,
        'lowest_plan': lowest_plan
    })


@app.route('/api/assessment/<attempt_id>/teaser', methods=['GET'])
def api_assessment_teaser(attempt_id):
    """Fetch teaser details with strict object ownership / IDOR protection."""
    teaser_info = assessment_service.get_teaser(attempt_id)
    if not teaser_info:
        return jsonify({'error': 'Assessment attempt not found.'}), 404

    attempt_owner_id = teaser_info.get('user_id')
    current_user_id = session.get('user_id')

    # If the attempt belongs to a registered student, strictly enforce user ownership
    if attempt_owner_id:
        if not current_user_id:
            return jsonify({'error': 'Authentication required to view this assessment.'}), 401
        if current_user_id != attempt_owner_id:
            print(f"[SECURITY ALERT] IDOR attempt: user '{current_user_id}' requested teaser of attempt '{attempt_id}' owned by '{attempt_owner_id}'")
            return jsonify({'error': 'Access denied.'}), 403
    else:
        # Guest assessment: enforce guest session ownership
        guest_session_id = session.get('guest_session_id') or session.get('session_id')
        pending_attempt = session.get('pending_attempt_id')
        if pending_attempt != attempt_id and not current_user_id:
            conn = get_db_connection()
            try:
                row = conn.execute("SELECT guest_session_id FROM assessment_attempts WHERE id = ?", (attempt_id,)).fetchone()
                if row and row['guest_session_id'] and row['guest_session_id'] != guest_session_id:
                    return jsonify({'error': 'Access denied.'}), 403
            finally:
                conn.close()

    return jsonify(teaser_info)


@app.route('/api/assessment/<attempt_id>/full', methods=['GET'])
@require_auth
def api_assessment_full(attempt_id):
    user_id = session.get('user_id')
    try:
        res = assessment_service.get_assessment_full(user_id, attempt_id)
        return jsonify(res)
    except ValueError as ve:
        err_msg = str(ve)
        if 'unauthorized' in err_msg.lower() or 'access' in err_msg.lower():
            return jsonify({'error': 'Access denied.'}), 403
        return jsonify({'error': err_msg}), 400
    except Exception as e:
        print(f"[ERROR] Full assessment report fetch error: {e}")
        return jsonify({'error': 'Failed to retrieve assessment report.'}), 500


@app.route('/api/assessment/<attempt_id>/unlock', methods=['POST'])
@require_auth
def api_unlock_assessment(attempt_id):
    user_id = session.get('user_id')
    try:
        res = assessment_service.unlock_assessment(user_id, attempt_id)
        session.pop('pending_attempt_id', None)
        return jsonify(res)
    except ValueError as ve:
        err_str = str(ve)
        if 'unauthorized' in err_str.lower() or 'another user' in err_str.lower():
            return jsonify({'error': 'Access denied.'}), 403
        status_code = 402 if "Insufficient" in err_str else 400
        return jsonify({'error': err_str}), status_code
    except Exception as e:
        print(f"[ERROR] Unlock error: {e}")
        return jsonify({'error': 'Failed to unlock assessment.'}), 500

# ============================================================
# PRICING & PAYMENT API ENDPOINTS
# ============================================================

@app.route('/api/pricing-plans', methods=['GET'])
def api_pricing_plans():
    plans = pricing_service.get_active_plans()
    lowest_plan = pricing_service.get_lowest_active_plan()
    return jsonify({
        'plans': plans,
        'lowest_plan': lowest_plan
    })

@app.route('/api/pricing/lowest-plan', methods=['GET'])
def api_lowest_pricing_plan():
    lowest_plan = pricing_service.get_lowest_active_plan()
    return jsonify({'lowest_plan': lowest_plan})


@app.route('/api/campaigns/validate-discount', methods=['POST'])
def api_validate_discount():
    data = request.json or {}
    plan_id = data.get('plan_id')
    code = data.get('code')
    user_id = session.get('user_id')

    if not plan_id or not code:
        return jsonify({'error': 'Plan ID and referral code are required.'}), 400

    try:
        res = campaign_service.validate_discount_code(user_id=user_id, plan_id=plan_id, code_str=code)
        return jsonify(res)
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Validate discount error: {e}")
        return jsonify({'error': 'Failed to validate referral code.'}), 500


@app.route('/api/payments/create-order', methods=['POST'])
@require_auth
def api_create_payment_order():
    user_id = session.get('user_id')
    data = request.json or {}
    plan_id = data.get('plan_id')
    referral_code = data.get('referral_code')
    attempt_id = data.get('attempt_id') or session.get('pending_attempt_id')

    if not plan_id:
        return jsonify({'error': 'Plan ID is required.'}), 400

    try:
        res = payment_service.create_payment_order(
            user_id=user_id,
            plan_id=plan_id,
            referral_code=referral_code,
            attempt_id=attempt_id
        )
        user = auth_service.get_user_by_id(user_id)
        res['user_name'] = user['full_name'] if user else ''
        res['user_email'] = user['email'] if user else ''
        return jsonify(res)
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Create payment order error: {e}")
        return jsonify({'error': 'Failed to create payment order.'}), 500


@app.route('/api/payments/verify', methods=['POST'])
@require_auth
def api_verify_payment():
    user_id = session.get('user_id')
    data = request.json or {}
    order_id = data.get('razorpay_order_id')
    payment_id = data.get('razorpay_payment_id')
    signature = data.get('razorpay_signature')
    attempt_id = data.get('attempt_id') or session.get('pending_attempt_id')

    if not order_id or not payment_id or not signature:
        return jsonify({'error': 'Missing payment verification parameters.'}), 400

    try:
        res = payment_service.verify_and_process_payment(
            user_id=user_id,
            razorpay_order_id=order_id,
            razorpay_payment_id=payment_id,
            razorpay_signature=signature,
            attempt_id=attempt_id
        )
        if attempt_id:
            session['pending_attempt_id'] = attempt_id
        return jsonify(res)
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Verify payment error: {e}")
        return jsonify({'error': 'Payment verification failed.'}), 500


@app.route('/api/payments/webhook', methods=['POST'])
def api_payments_webhook():
    """Handle server-to-server asynchronous notifications from Razorpay."""
    raw_body = request.get_data()
    sig = request.headers.get('X-Razorpay-Signature', '')
    try:
        res = payment_service.handle_webhook_event(raw_body, sig)
        return jsonify(res), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Webhook processing error: {e}")
        return jsonify({'error': 'Webhook processing failed.'}), 500


@app.route('/api/payments/redeem-zero', methods=['POST'])
@require_auth
def api_redeem_zero_payment():
    user_id = session.get('user_id')
    data = request.json or {}
    plan_id = data.get('plan_id')
    referral_code = data.get('referral_code')
    attempt_id = data.get('attempt_id') or session.get('pending_attempt_id')

    if not plan_id or not referral_code:
        return jsonify({'error': 'Plan ID and referral code are required.'}), 400

    try:
        res = payment_service.redeem_zero_amount_order(
            user_id=user_id,
            plan_id=plan_id,
            referral_code=referral_code,
            attempt_id=attempt_id
        )
        session.pop('pending_attempt_id', None)
        return jsonify(res)
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Redeem zero payment error: {e}")
        return jsonify({'error': 'Failed to redeem 100% discount plan.'}), 500

# ============================================================
# CAMPAIGN CODE API ENDPOINTS
# ============================================================

@app.route('/api/campaigns/redeem', methods=['POST'])
@require_auth
def api_redeem_campaign():
    user_id = session.get('user_id')
    data = request.json or {}
    code = data.get('code')
    if not code:
        return jsonify({'error': 'Campaign code is required.'}), 400

    try:
        res = campaign_service.redeem_code(user_id, code)
        return jsonify(res)
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Redeem campaign error: {e}")
        return jsonify({'error': 'Failed to redeem campaign code.'}), 500

# ============================================================
# DEVELOPER DASHBOARD API ENDPOINTS
# ============================================================

@app.route('/api/developer/stats', methods=['GET'])
@require_developer
def api_developer_stats():
    stats = stats_service.get_dashboard_stats()
    user_id = session.get('user_id')
    user = auth_service.get_user_by_id(user_id) if user_id else None

    if user:
        caller_role = user.get('role', session.get('role', 'DEVELOPER'))
        can_manage = bool(user.get('can_manage_developers', False))
    else:
        caller_role = session.get('role', 'DEVELOPER')
        can_manage = bool(session.get('can_manage_developers', False))

    caller_can_manage = (caller_role == 'SUPER_ADMIN' or can_manage)
    session['role'] = caller_role
    session['can_manage_developers'] = caller_can_manage

    stats['caller_role'] = caller_role
    stats['caller_can_manage'] = caller_can_manage
    return jsonify(stats)


@app.route('/api/developer/plans', methods=['GET', 'POST'])
@require_developer
def api_developer_plans():
    if request.method == 'GET':
        plans = pricing_service.get_all_plans()
        return jsonify({'plans': plans})

    data = request.json or {}
    try:
        plan = pricing_service.create_plan(
            name=data.get('name', 'New Plan'),
            plan_type=data.get('type', 'CREDIT_PACK'),
            price=float(data.get('price', 19.0)),
            credits=int(data.get('credits', 1)),
            duration_days=data.get('duration_days'),
            currency=data.get('currency', 'INR'),
            is_active=int(data.get('is_active', 1))
        )
        return jsonify({'status': 'success', 'plan': plan})
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400


@app.route('/api/developer/plans/<plan_id>', methods=['PUT', 'DELETE'])
@require_developer
def api_developer_update_or_delete_plan(plan_id):
    if request.method == 'DELETE':
        try:
            res = pricing_service.delete_or_archive_plan(plan_id)
            return jsonify({'status': 'success', **res})
        except ValueError as ve:
            return jsonify({'error': str(ve)}), 404
        except Exception as e:
            print(f"[ERROR] Delete plan failed: {e}")
            return jsonify({'error': 'Failed to delete pricing plan.'}), 500

    data = request.json or {}
    try:
        plan = pricing_service.update_plan(
            plan_id=plan_id,
            name=data.get('name'),
            price=data.get('price'),
            credits=data.get('credits'),
            duration_days=data.get('duration_days'),
            is_active=data.get('is_active')
        )
        return jsonify({'status': 'success', 'plan': plan})
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400


@app.route('/api/developer/plans/<plan_id>/toggle', methods=['POST'])
@require_developer
def api_developer_toggle_plan(plan_id):
    data = request.json or {}
    if 'is_active' not in data:
        return jsonify({'error': 'is_active field is required.'}), 400
    try:
        is_active = 1 if data.get('is_active') in (1, '1', True, 'true') else 0
        plan = pricing_service.update_plan(plan_id=plan_id, is_active=is_active)
        if not plan:
            return jsonify({'error': 'Pricing plan not found.'}), 404
        return jsonify({'status': 'success', 'plan': plan})
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 404
    except Exception as e:
        print(f"[ERROR] Toggle plan error: {e}")
        return jsonify({'error': 'Failed to toggle pricing plan status.'}), 500


@app.route('/api/developer/credits/adjust', methods=['POST'])
@require_developer
def api_developer_adjust_credits():
    data = request.json or {}
    email = data.get('email')
    amount = data.get('amount')
    description = data.get('description')

    if not email or amount is None or not description:
        return jsonify({'error': 'Email, amount, and description reason are required.'}), 400

    target_user = auth_service.get_user_by_email(email) if hasattr(auth_service, 'get_user_by_email') else None
    if not target_user:
        # Search by email in users table
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM users WHERE email = ?", (email.strip().lower(),))
            row = cursor.fetchone()
            if row:
                target_user = {'id': row['id']}
        finally:
            conn.close()

    if not target_user:
        return jsonify({'error': f"User with email '{email}' not found."}), 404

    try:
        amt = int(amount)
        if amt > 0:
            new_bal = wallet_service.add_credits(
                user_id=target_user['id'],
                amount=amt,
                transaction_type='ADMIN_ADJUSTMENT',
                reference_type='admin',
                reference_id=session.get('user_id'),
                description=f"[Developer Adjustment] {description}"
            )
        else:
            new_bal = wallet_service.deduct_credits(
                user_id=target_user['id'],
                amount=abs(amt),
                transaction_type='ADMIN_ADJUSTMENT',
                reference_type='admin',
                reference_id=session.get('user_id'),
                description=f"[Developer Adjustment] {description}"
            )

        return jsonify({'status': 'success', 'message': f"Adjusted {amt} credits for {email}. New balance: {new_bal}."})
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400


@app.route('/api/developer/campaigns', methods=['GET', 'POST'])
@require_developer
def api_developer_campaigns():
    if request.method == 'GET':
        campaigns = campaign_service.get_all_campaigns()
        return jsonify({'campaigns': campaigns})

    data = request.json or {}
    try:
        d_type = data.get('discount_type') or data.get('benefit_type') or 'PERCENTAGE'
        d_val = float(data.get('discount_value') if data.get('discount_value') is not None else (data.get('benefit_value') or 20.0))
        cmp = campaign_service.create_campaign_code(
            code=data.get('code', ''),
            campaign_name=data.get('campaign_name', ''),
            valid_from=data.get('valid_from', ''),
            valid_until=data.get('valid_until', ''),
            max_uses=int(data.get('max_uses', 300)),
            discount_type=d_type,
            discount_value=d_val,
            benefit_type=d_type,
            benefit_value=d_val,
            one_use_per_user=int(data.get('one_use_per_user', 1)),
            created_by=session.get('user_id')
        )
        return jsonify({'status': 'success', 'campaign': cmp})
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400


@app.route('/api/developer/campaigns/<code_id>/toggle', methods=['POST'])
@require_developer
def api_developer_toggle_campaign(code_id):
    data = request.json or {}
    if 'is_active' not in data:
        return jsonify({'error': 'is_active field is required.'}), 400
    try:
        is_active = 1 if data.get('is_active') in (1, '1', True, 'true') else 0
        cmp = campaign_service.set_campaign_active(code_id, is_active)
        if not cmp:
            return jsonify({'error': 'Campaign not found.'}), 404
        return jsonify({'status': 'success', 'campaign': cmp})
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 404
    except Exception as e:
        print(f"[ERROR] Toggle campaign error: {e}")
        return jsonify({'error': 'Failed to toggle campaign status.'}), 500


@app.route('/api/developer/campaigns/<code_id>', methods=['PUT'])
@require_developer
def api_developer_update_campaign(code_id):
    data = request.json or {}
    try:
        d_type = data.get('discount_type') or data.get('benefit_type') or 'PERCENTAGE'
        d_val = float(data.get('discount_value') if data.get('discount_value') is not None else (data.get('benefit_value') or 20.0))
        cmp = campaign_service.update_campaign_code(
            code_id=code_id,
            campaign_name=data.get('campaign_name', ''),
            valid_from=data.get('valid_from', ''),
            valid_until=data.get('valid_until', ''),
            max_uses=int(data.get('max_uses', 300)),
            discount_type=d_type,
            discount_value=d_val,
            one_use_per_user=int(data.get('one_use_per_user', 1)),
            is_active=int(data.get('is_active', 1))
        )
        return jsonify({'status': 'success', 'campaign': cmp})
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to update campaign code.'}), 500


@app.route('/api/developer/campaigns/<code_id>/redemptions', methods=['GET'])
@require_developer
def api_developer_campaign_redemptions(code_id):
    try:
        redemptions = campaign_service.get_code_redemptions(code_id)
        campaign = campaign_service.get_campaign_by_id(code_id)
        return jsonify({
            'status': 'success',
            'campaign': campaign,
            'redemptions': redemptions,
            'total': len(redemptions)
        })
    except Exception as e:
        return jsonify({'error': 'Failed to fetch campaign redemptions.'}), 500


@app.route('/api/developer/users', methods=['GET'])
@require_developer
def api_developer_users():
    users = auth_service.list_all_users()
    return jsonify({'users': users})


# ============================================================
# DEVELOPER ACCOUNTS MANAGEMENT API
# ============================================================

@app.route('/api/developer/accounts', methods=['GET'])
@require_can_manage_developers
def api_developer_accounts():
    """List all DEVELOPER and SUPER_ADMIN accounts."""
    try:
        accounts = auth_service.list_developer_accounts()
        # Expose which actions the caller can perform
        caller_role = session.get('role')
        caller_can_manage = (
            caller_role == 'SUPER_ADMIN' or
            session.get('can_manage_developers', False)
        )
        return jsonify({
            'accounts': accounts,
            'caller_can_manage': caller_can_manage,
            'caller_role': caller_role,
            'current_user_id': session.get('user_id')
        })
    except Exception as e:
        print(f"[ERROR] List developer accounts: {e}")
        return jsonify({'error': 'Failed to load developer accounts.'}), 500


@app.route('/api/developer/accounts/invite', methods=['POST'])
@require_can_manage_developers
def api_developer_invite():
    """Invite a new developer/super-admin. Sends a one-time setup email."""
    data = request.json or {}
    email = (data.get('email') or '').strip().lower()
    full_name = (data.get('full_name') or '').strip()
    role = (data.get('role') or 'DEVELOPER').upper()

    if not email or not full_name:
        return jsonify({'error': 'Email and full name are required.'}), 400
    if role not in ('DEVELOPER', 'SUPER_ADMIN'):
        return jsonify({'error': 'Invalid role. Must be DEVELOPER or SUPER_ADMIN.'}), 400

    # Only SUPER_ADMIN can create another SUPER_ADMIN
    if role == 'SUPER_ADMIN' and session.get('role') != 'SUPER_ADMIN':
        return jsonify({'error': 'Only SUPER_ADMIN can invite another SUPER_ADMIN.'}), 403

    try:
        actor_id = session.get('user_id')
        actor_email = session.get('user_email', '')
        result = auth_service.invite_developer(
            email=email,
            full_name=full_name,
            role=role,
            actor_id=actor_id,
            actor_email=actor_email
        )

        # Build setup URL
        base_url = request.host_url.rstrip('/')
        setup_url = f"{base_url}/setup-account?token={result['raw_token']}"

        # Send invitation email
        email_service.send_developer_invitation(
            recipient_email=result['email'],
            full_name=full_name,
            setup_url=setup_url,
            expires_hours=24
        )

        return jsonify({
            'status': 'success',
            'message': f"Invitation sent to {result['email']}. The setup link expires in 24 hours."
        })
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Invite developer: {e}")
        return jsonify({'error': 'Failed to send invitation.'}), 500


@app.route('/api/developer/accounts/<target_id>/status', methods=['POST'])
@require_can_manage_developers
def api_developer_set_status(target_id):
    """Set developer active/inactive status via dropdown."""
    data = request.json or {}
    is_active = 1 if data.get('is_active') in (1, '1', True, 'true') else 0
    caller_id = session.get('user_id')
    if target_id == caller_id and not is_active:
        return jsonify({'error': 'You cannot deactivate your own logged-in account.'}), 400
    try:
        auth_service.set_developer_status(
            target_id=target_id,
            is_active=is_active,
            actor_id=caller_id,
            actor_email=session.get('user_email', '')
        )
        return jsonify({'status': 'success', 'message': f"Status updated to {'Active' if is_active else 'Inactive'}."})
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Set developer status: {e}")
        return jsonify({'error': 'Failed to update account status.'}), 500


@app.route('/api/developer/accounts/<target_id>', methods=['DELETE'])
@require_super_admin
def api_developer_delete(target_id):
    """Delete a developer or super admin account. SUPER_ADMIN only."""
    caller_id = session.get('user_id')
    if target_id == caller_id:
        return jsonify({'error': 'You cannot delete your own logged-in account.'}), 400
    try:
        auth_service.delete_developer(
            target_id=target_id,
            actor_id=caller_id,
            actor_email=session.get('user_email', '')
        )
        return jsonify({
            'status': 'success',
            'message': 'Developer account deleted successfully. Associated pricing models and referral codes remain active.'
        })
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Delete developer: {e}")
        return jsonify({'error': 'Failed to delete account.'}), 500


@app.route('/api/developer/accounts/<target_id>/disable', methods=['POST'])
@require_can_manage_developers
def api_developer_disable(target_id):
    """Disable a developer account."""
    caller_id = session.get('user_id')
    if target_id == caller_id:
        return jsonify({'error': 'You cannot disable your own account.'}), 400
    try:
        auth_service.disable_developer(
            target_id=target_id,
            actor_id=caller_id,
            actor_email=session.get('user_email', '')
        )
        return jsonify({'status': 'success', 'message': 'Account disabled.'})
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Disable developer: {e}")
        return jsonify({'error': 'Failed to disable account.'}), 500


@app.route('/api/developer/accounts/<target_id>/reactivate', methods=['POST'])
@require_can_manage_developers
def api_developer_reactivate(target_id):
    """Reactivate a disabled developer account."""
    try:
        auth_service.reactivate_developer(
            target_id=target_id,
            actor_id=session.get('user_id'),
            actor_email=session.get('user_email', '')
        )
        return jsonify({'status': 'success', 'message': 'Account reactivated.'})
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Reactivate developer: {e}")
        return jsonify({'error': 'Failed to reactivate account.'}), 500


@app.route('/api/developer/accounts/<target_id>/resend-invitation', methods=['POST'])
@require_can_manage_developers
def api_developer_resend_invitation(target_id):
    """Resend invitation to a pending (inactive) developer account."""
    from database.schema import get_db_connection
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT email, is_active FROM users WHERE id = ?", (target_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'Account not found.'}), 404
    finally:
        conn.close()

    try:
        result = auth_service.resend_invitation(
            target_email=user['email'],
            actor_id=session.get('user_id'),
            actor_email=session.get('user_email', '')
        )
        base_url = request.host_url.rstrip('/')
        setup_url = f"{base_url}/setup-account?token={result['raw_token']}"

        from database.schema import get_db_connection as get_conn
        conn2 = get_conn()
        try:
            cursor2 = conn2.cursor()
            cursor2.execute("SELECT full_name FROM user_profiles WHERE user_id = ?", (target_id,))
            profile = cursor2.fetchone()
            full_name = profile['full_name'] if profile else user['email']
        finally:
            conn2.close()

        email_service.send_developer_invitation(
            recipient_email=result['email'],
            full_name=full_name,
            setup_url=setup_url,
            expires_hours=24
        )

        return jsonify({'status': 'success', 'message': f"Invitation resent to {result['email']}."})
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Resend invitation: {e}")
        return jsonify({'error': 'Failed to resend invitation.'}), 500


@app.route('/api/developer/accounts/<target_id>/permissions', methods=['POST'])
@require_super_admin
def api_developer_set_permission(target_id):
    """Grant or revoke CAN_MANAGE_DEVELOPERS permission. SUPER_ADMIN only."""
    data = request.json or {}
    grant = bool(data.get('can_manage_developers', False))
    try:
        auth_service.set_can_manage_developers(
            target_id=target_id,
            grant=grant,
            actor_id=session.get('user_id'),
            actor_email=session.get('user_email', '')
        )
        action = 'granted' if grant else 'revoked'
        return jsonify({'status': 'success', 'message': f"Developer management permission {action}."})
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Set permission: {e}")
        return jsonify({'error': 'Failed to update permission.'}), 500


@app.route('/api/developer/audit-log', methods=['GET'])
@require_developer
def api_developer_audit_log():
    """Fetch recent developer management audit log."""
    try:
        limit = min(int(request.args.get('limit', 100)), 500)
        logs = auth_service.get_audit_log(limit=limit)
        return jsonify({'logs': logs, 'count': len(logs)})
    except Exception as e:
        print(f"[ERROR] Audit log: {e}")
        return jsonify({'error': 'Failed to load audit log.'}), 500


# ============================================================
# INVITATION ACCEPTANCE API
# ============================================================

@app.route('/api/auth/setup-account', methods=['POST'])
def api_setup_account():
    """Accept a developer invitation: validate token, set password, activate account."""
    data = request.json or {}
    token = (data.get('token') or '').strip()
    password = data.get('password') or ''
    confirm = data.get('confirm_password') or ''

    if not token:
        return jsonify({'error': 'Missing invitation token.'}), 400
    if not password:
        return jsonify({'error': 'Password is required.'}), 400
    if password != confirm:
        return jsonify({'error': 'Passwords do not match.'}), 400

    try:
        result = auth_service.accept_invitation(
            raw_token=token,
            new_password=password
        )
        return jsonify({
            'status': 'success',
            'message': 'Account activated! You can now log in.',
            'email': result['email']
        })
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Accept invitation: {e}")
        return jsonify({'error': 'Failed to activate account. Please request a new invitation.'}), 500


@app.route('/questions', methods=['GET'])
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
        
        # Save assessment attempt in database and generate teaser
        user_id = session.get('user_id')
        guest_sess_id = session_id if not user_id else None
        if guest_sess_id:
            session['guest_session_id'] = guest_sess_id
        
        saved_attempt = assessment_service.save_assessment_attempt(
            user_id=user_id,
            guest_session_id=guest_sess_id,
            student_profile=profile,
            riasec_answers=detailed_answers,
            riasec_scores=scores,
            riasec_code=riasec_code,
            top_careers=top_careers
        )
        session['pending_attempt_id'] = saved_attempt['attempt_id']

        is_unlocked = saved_attempt['is_unlocked']

        if is_unlocked:
            response_data = {
                'attempt_id': saved_attempt['attempt_id'],
                'is_unlocked': True,
                'profile': profile,
                'scores': scores,
                'top_careers': top_careers
            }
        else:
            # Paywall enforcement: Return ONLY high-level teaser metrics! Full roadmap stays protected server-side.
            response_data = {
                'attempt_id': saved_attempt['attempt_id'],
                'is_unlocked': False,
                'profile': profile,
                'scores': scores,
                'teaser': saved_attempt['teaser']
            }
        
        elapsed_time = time.time() - start_time
        print(f"[SUCCESS] Assessment saved (attempt: {saved_attempt['attempt_id']}, unlocked: {is_unlocked}, took {elapsed_time:.2f}s)")
        
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
        
        # Check SQLite database first
        from modules.conversation_memory import conversation_memory
        career_record = conversation_memory.get_career_detail(career_name)
        if career_record:
            return jsonify({'career': normalize_career_record(career_record)})
        
        # Fallback to local in-memory scan
        for career in CAREER_DB:
            if career.get('career_name') == career_name:
                return jsonify({'career': normalize_career_record(career)})
        
        return jsonify({'error': 'Career not found'}), 404
        
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
        conversation_memory.add_message(session_id, 'user', message, classification.intent)
        
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
        
        # Inject language instruction if not english
        if language == 'hi':
            prompt += "\n\n[CRITICAL INSTRUCTION] You MUST respond in Hindi (à¤¹à¤¿à¤‚à¤¦à¥€). Translate all career facts, titles, and details into natural, simple Hindi language so a high school student can understand it easily. Keep the tone helpful, warm, and counseling-oriented."
        elif language == 'mr':
            prompt += "\n\n[CRITICAL INSTRUCTION] You MUST respond in Marathi (à¤®à¤°à¤¾à¤ à¥€). Translate all career facts, titles, and details into natural, simple Marathi language so a high school student can understand it easily. Keep the tone helpful, warm, and counseling-oriented."

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
    """Clear quiz attempt variables to start a fresh attempt without deleting user credentials."""
    try:
        user_id = session.get('user_id')
        email = session.get('email')
        role = session.get('role')
        full_name = session.get('full_name')

        session.clear()

        if user_id:
            session.permanent = True
            session['user_id'] = user_id
            session['email'] = email
            session['role'] = role
            session['full_name'] = full_name

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
            student_id=session_id,
            assessment_id=session_id,
            career_id=str(career_id).strip(),
            liked_result=liked_val,
            feedback_category=str(feedback_category).strip(),
            comment=str(comment).strip()
        )
        return jsonify({'status': 'success', 'message': 'Feedback saved successfully.'})
    except Exception as e:
        print(f"[ERROR] Error in save_feedback: {e}")
        return jsonify({'error': str(e)}), 500


def is_api_request():
    """Determine whether the current request is an API call requiring JSON response."""
    if request.path.startswith('/api/'):
        return True
    if request.is_json:
        return True
    accept = request.headers.get('Accept', '')
    if 'application/json' in accept and 'text/html' not in accept:
        return True
    return False


@app.errorhandler(403)
def forbidden(error):
    """Handle 403 Forbidden errors with branded SkillSense template or clean JSON."""
    if is_api_request():
        return jsonify({'error': 'Access denied.'}), 403
    return render_template('errors/403.html'), 403


@app.errorhandler(404)
def not_found(error):
    """Handle 404 Not Found errors with branded SkillSense template or clean JSON."""
    if is_api_request():
        return jsonify({'error': 'Resource not found.'}), 404
    return render_template('errors/404.html'), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors with server-side detailed logging and safe public response."""
    print(f"[CRITICAL ERROR] Internal server error on {request.method} {request.path}: {error}")
    import traceback
    traceback.print_exc()
    if is_api_request():
        return jsonify({'error': 'An unexpected error occurred. Please try again later.'}), 500
    return render_template('errors/500.html'), 500


# ============================================================
# IMAGE UPLOAD (PERMANENT HOSTING WITH SECURITY VALIDATION)
# ============================================================
ALLOWED_IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp', '.gif'}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB limit

@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    # Rate limit image uploads (15 per minute per IP)
    ip_addr = request.headers.get('X-Forwarded-For', request.remote_addr)
    if not check_rate_limit(f"upload:{ip_addr}", max_requests=15, window_seconds=60):
        return jsonify({'status': 'error', 'message': 'Too many upload requests. Please wait a moment.'}), 429

    if 'file' not in request.files:
        return jsonify({'status': 'error', 'message': 'No file part'}), 400
    
    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({'status': 'error', 'message': 'No selected file'}), 400
        
    try:
        raw_filename = file.filename or ''
        ext = os.path.splitext(raw_filename)[1].lower()
        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            return jsonify({
                'status': 'error',
                'message': 'Invalid file format. Only standard image files (.png, .jpg, .jpeg, .webp, .gif) are permitted.'
            }), 400

        # Validate file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        if file_size > MAX_IMAGE_SIZE_BYTES:
            return jsonify({
                'status': 'error',
                'message': 'File size exceeds maximum allowed limit (5 MB).'
            }), 400
        if file_size == 0:
            return jsonify({'status': 'error', 'message': 'Uploaded file is empty.'}), 400

        # Ensure static/uploads directory exists
        upload_folder = os.path.join(app.root_path, 'static', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        
        # Generate a unique secure filename
        import uuid
        unique_filename = f"career_card_{uuid.uuid4().hex}{ext}"
        
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        
        # Generate the absolute public URL for the image
        file_url = request.host_url.rstrip('/') + f"/static/uploads/{unique_filename}"
        
        return jsonify({'status': 'success', 'data': {'url': file_url}})
    except Exception as e:
        print(f"[ERROR] Error in upload_image: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': 'Failed to process image upload.'}), 500

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
    
    try:
        from waitress import serve
        print("[INFO] Starting Waitress Production WSGI Server...")
        serve(app, host='0.0.0.0', port=5000, threads=6)
    except ImportError:
        print("[INFO] Waitress package not found in current Python environment. Starting Flask server...")
        app.run(host='0.0.0.0', port=5000, debug=config.debug)