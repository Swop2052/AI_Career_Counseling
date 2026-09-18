# routes/auth_routes.py - Modular Authentication & Account Endpoints
import os
from flask import Blueprint, request, jsonify, session
from services.auth_service import auth_service
from services.assessment_service import assessment_service
from services.wallet_service import wallet_service
from core.avatar import resolve_avatar_url, normalize_avatar_key
from core.security import require_auth

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def sanitize_user(user: dict) -> dict:
    """Strip sensitive fields before sending user data to client."""
    if not user:
        return {}
    avatar_key = normalize_avatar_key(user.get('avatar') or user.get('profilePhoto'))
    avatar_url = resolve_avatar_url(avatar_key)
    
    # Handle age safely
    raw_age = user.get('age')
    clean_age = None
    if raw_age is not None and str(raw_age).strip() != '':
        try:
            clean_age = int(raw_age)
        except (ValueError, TypeError):
            clean_age = None

    return {
        'id': user.get('id'),
        'email': user.get('email'),
        'role': user.get('role', 'USER'),
        'is_active': user.get('is_active', 1),
        'can_manage_developers': bool(user.get('can_manage_developers', False) or user.get('role') == 'SUPER_ADMIN'),
        'name': user.get('full_name') or user.get('name') or user.get('email', '').split('@')[0],
        'full_name': user.get('full_name') or user.get('name') or '',
        'phone': user.get('phone', ''),
        'education_level': user.get('education_level', ''),
        'class_year': user.get('class_year') or user.get('education_level', ''),
        'age': clean_age,
        'enjoy_subjects': user.get('enjoy_subjects', ''),
        'challenging_subjects': user.get('challenging_subjects', ''),
        'avatar': avatar_key,
        'avatar_url': avatar_url,
        'profilePhoto': avatar_url
    }

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """Register a new student account and automatically claim pending guest assessment."""
    data = request.json or {}
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name') or data.get('name')
    phone = data.get('phone')
    education_level = data.get('education_level')
    attempt_id = data.get('attempt_id') or session.get('pending_attempt_id')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400
        
    try:
        # Check if attempt has student_profile with avatar and profile fields
        avatar = data.get('avatar') or data.get('profilePhoto')
        age = data.get('age')
        class_year = data.get('class_year') or education_level
        enjoy_subjects = data.get('enjoy_subjects')
        challenging_subjects = data.get('challenging_subjects')
        
        if attempt_id:
            try:
                attempt = assessment_service.get_attempt_by_id(attempt_id)
                if attempt and attempt.get('student_profile'):
                    sp = attempt['student_profile']
                    if isinstance(sp, str):
                        try:
                            import json
                            sp = json.loads(sp)
                        except Exception:
                            sp = {}
                    if not isinstance(sp, dict):
                        sp = {}
                    if not avatar and (sp.get('avatar') or sp.get('profilePhoto')):
                        avatar = sp.get('avatar') or sp.get('profilePhoto')
                    if not age and sp.get('age'):
                        age = sp.get('age')
                    if not class_year and (sp.get('class') or sp.get('classYear') or sp.get('education_level')):
                        class_year = sp.get('class') or sp.get('classYear') or sp.get('education_level')
                    if not enjoy_subjects and (sp.get('subjects') or sp.get('enjoySubjects')):
                        enjoy_subjects = sp.get('subjects') or sp.get('enjoySubjects')
                    if not challenging_subjects and (sp.get('weak_subjects') or sp.get('challengingSubjects')):
                        challenging_subjects = sp.get('weak_subjects') or sp.get('challengingSubjects')
                    if not full_name and (sp.get('name') or sp.get('fullName')):
                        cand_name = sp.get('name') or sp.get('fullName')
                        if cand_name and cand_name.lower() not in ('guest', 'guest student'):
                            full_name = cand_name
            except Exception as e:
                print(f"[WARNING] Could not parse student profile from attempt {attempt_id}: {e}")

        user = auth_service.create_user(
            email=email,
            password=password,
            full_name=full_name or 'Student',
            phone=phone,
            education_level=class_year or education_level,
            avatar=avatar,
            age=age,
            class_year=class_year,
            enjoy_subjects=enjoy_subjects,
            challenging_subjects=challenging_subjects
        )
        
        session.permanent = True
        session['user_id'] = user['id']
        session['role'] = user.get('role', 'USER')
        session['user_email'] = user.get('email', '')
        session['can_manage_developers'] = bool(user.get('can_manage_developers', False))
        
        claimed = False
        if attempt_id:
            try:
                claimed_count = assessment_service.claim_guest_assessment(attempt_id=attempt_id, user_id=user['id'])
                claimed = bool(claimed_count and claimed_count > 0)
                session.pop('pending_attempt_id', None)
            except Exception as ce:
                print(f"[WARNING] Failed to claim guest attempt {attempt_id}: {ce}")
                
        sanitized = sanitize_user(user)
        sanitized['balance'] = wallet_service.get_balance(user['id'])
        
        return jsonify({
            'status': 'success',
            'user': sanitized,
            'claimed_attempt_id': attempt_id if claimed else None
        }), 201
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Signup failure: {e}")
        return jsonify({'error': 'An error occurred during account creation.'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user with email and password, and link any pending guest assessment."""
    data = request.json or {}
    email = data.get('email')
    password = data.get('password')
    attempt_id = data.get('attempt_id') or session.get('pending_attempt_id')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400
        
    try:
        user = getattr(auth_service, "authenticate_user", auth_service.authenticate)(email, password)
        if not user:
            return jsonify({'error': 'Invalid email or password.'}), 401
            
        if not user.get('is_active', 1):
            return jsonify({'error': 'Your account has been deactivated. Please contact support.'}), 403
            
        session.permanent = True
        session['user_id'] = user['id']
        session['role'] = user.get('role', 'USER')
        session['user_email'] = user.get('email', '')
        session['can_manage_developers'] = bool(user.get('can_manage_developers', False) or user.get('role') == 'SUPER_ADMIN')
        
        claimed = False
        if attempt_id:
            try:
                claimed_count = assessment_service.claim_guest_assessment(attempt_id=attempt_id, user_id=user['id'])
                claimed = bool(claimed_count and claimed_count > 0)
                session.pop('pending_attempt_id', None)
            except Exception as ce:
                print(f"[WARNING] Failed to claim guest attempt {attempt_id} on login: {ce}")
                
        sanitized = sanitize_user(user)
        sanitized['balance'] = wallet_service.get_balance(user['id'])
        
        return jsonify({
            'status': 'success',
            'user': sanitized,
            'claimed_attempt_id': attempt_id if claimed else None
        }), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Login failure: {e}")
        return jsonify({'error': 'An error occurred during login.'}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Clear Flask session cookie and server session dictionary."""
    session.clear()
    return jsonify({'status': 'success', 'message': 'Logged out successfully.'}), 200

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """Return the authenticated user profile and live wallet balance."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'authenticated': False, 'user': None}), 200
        
    try:
        user = auth_service.get_user_by_id(user_id)
        if not user or not user.get('is_active', 1):
            session.clear()
            return jsonify({'authenticated': False, 'user': None}), 200
            
        sanitized = sanitize_user(user)
        sanitized['balance'] = wallet_service.get_balance(user_id)
        
        # Keep session synchronized
        session['role'] = user.get('role', 'USER')
        session['can_manage_developers'] = sanitized['can_manage_developers']
        
        return jsonify({'authenticated': True, 'user': sanitized}), 200
    except Exception as e:
        print(f"[ERROR] /me failed: {e}")
        return jsonify({'authenticated': False, 'user': None}), 500

@auth_bp.route('/profile', methods=['PUT', 'POST'])
@require_auth
def update_profile():
    """Update student profile details and avatar in PostgreSQL with authoritative validation."""
    user_id = session.get('user_id')
    data = request.json or {}
    try:
        validated = auth_service.validate_profile_data(data, require_all_mandatory=False)
        update_payload = {**data, **validated}
        user = auth_service.update_user_profile(user_id, update_payload)
        sanitized = sanitize_user(user)
        sanitized['balance'] = wallet_service.get_balance(user_id)
        return jsonify({
            'status': 'success',
            'message': 'Profile updated successfully.',
            'user': sanitized
        }), 200
    except ValueError as ve:
        if isinstance(ve.args[0], dict):
            return jsonify({'error': 'Validation failed.', 'details': ve.args[0]}), 400
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] update_profile failed: {e}")
        return jsonify({'error': 'An error occurred while updating profile.'}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Generate and email time-limited 6-digit OTP verification code."""
    data = request.json or {}
    email = (data.get('email') or '').strip()
    if not email:
        return jsonify({'error': 'Email address is required.'}), 400
        
    try:
        auth_service.request_password_reset(email)
        return jsonify({
            'status': 'success',
            'message': 'If this email is registered, password reset instructions have been sent.'
        }), 200
    except ValueError as ve:
        err_msg = str(ve)
        if 'Too many' in err_msg:
            return jsonify({'error': err_msg}), 429
        if "couldn't send" in err_msg.lower() or "failed to deliver" in err_msg.lower():
            return jsonify({'error': 'Failed to send verification code. Please check your email configuration or try again later.'}), 500
        return jsonify({'error': err_msg}), 400
    except Exception as e:
        print(f"[ERROR] Forgot password request error: {e}")
        return jsonify({'error': 'An unexpected error occurred while sending verification code.'}), 500

@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    """Verify 6-digit OTP code and issue a secure single-use reset token."""
    data = request.json or {}
    email = (data.get('email') or '').strip()
    otp = (data.get('otp') or data.get('otp_code') or '').strip()

    if not email or not otp:
        return jsonify({'error': 'Email and verification code are required.'}), 400

    try:
        reset_token = auth_service.verify_otp(email=email, otp_code=otp)
        return jsonify({
            'status': 'success',
            'reset_token': reset_token,
            'message': 'Verification code confirmed. You may now set a new password.'
        }), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Verify OTP error: {e}")
        return jsonify({'error': 'Failed to verify code. Please try again.'}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Validate reset token and update user password."""
    data = request.json or {}
    email = (data.get('email') or '').strip()
    token = (data.get('reset_token') or data.get('token') or '').strip()
    new_password = data.get('password') or data.get('new_password')
    
    if not token or not new_password:
        return jsonify({'error': 'Token and new password are required.'}), 400
        
    try:
        auth_service.reset_password(email=email, token=token, new_password=new_password)
        return jsonify({'status': 'success', 'message': 'Password has been updated successfully. You can now log in.'}), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Reset password error: {e}")
        return jsonify({'error': 'Failed to reset password.'}), 500

@auth_bp.route('/setup-account', methods=['POST'])
def setup_invited_account():
    """Set password and full name for newly invited developers."""
    data = request.json or {}
    token = data.get('token')
    password = data.get('password')
    full_name = data.get('full_name')
    
    if not token or not password:
        return jsonify({'error': 'Token and password are required.'}), 400
        
    try:
        user = auth_service.setup_invited_account(token=token.strip(), password=password, full_name=full_name)
        session.permanent = True
        session['user_id'] = user['id']
        session['role'] = user.get('role', 'DEVELOPER')
        session['user_email'] = user.get('email', '')
        
        sanitized = sanitize_user(user)
        return jsonify({'status': 'success', 'user': sanitized}), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Setup invited account error: {e}")
        return jsonify({'error': 'Failed to setup developer account.'}), 500
