# routes/auth_routes.py - Modular Authentication & Account Endpoints
import os
from flask import Blueprint, request, jsonify, session
from services.auth_service import auth_service
from services.assessment_service import assessment_service
from services.wallet_service import wallet_service

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def sanitize_user(user: dict) -> dict:
    """Strip sensitive fields before sending user data to client."""
    if not user:
        return {}
    return {
        'id': user.get('id'),
        'email': user.get('email'),
        'role': user.get('role', 'USER'),
        'is_active': user.get('is_active', 1),
        'can_manage_developers': bool(user.get('can_manage_developers', False) or user.get('role') == 'SUPER_ADMIN'),
        'name': user.get('full_name') or user.get('name') or user.get('email', '').split('@')[0],
        'phone': user.get('phone', ''),
        'education_level': user.get('education_level', '')
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
        user = auth_service.create_user(
            email=email,
            password=password,
            full_name=full_name,
            phone=phone,
            education_level=education_level
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
