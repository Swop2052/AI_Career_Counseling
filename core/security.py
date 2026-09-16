# core/security.py - Authentication and role-based authorization decorators
from functools import wraps
from flask import session, jsonify
from services.auth_service import auth_service

def require_auth(f):
    """Require user to be logged in with a valid session."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Authentication required. Please log in.'}), 401
        return f(*args, **kwargs)
    return decorated_function

def require_developer(f):
    """Allow active DEVELOPER or SUPER_ADMIN roles directly verified against the database."""
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
        session['can_manage_developers'] = bool(user.get('can_manage_developers', False) or db_role == 'SUPER_ADMIN')
        return f(*args, **kwargs)
    return decorated_function

def require_super_admin(f):
    """Restrict to active SUPER_ADMIN role directly verified against the database."""
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
            return jsonify({'error': 'Access denied. Super Admin role required.'}), 403
            
        return f(*args, **kwargs)
    return decorated_function

def require_can_manage_developers(f):
    """Allow active SUPER_ADMIN, or DEVELOPER with can_manage_developers permission."""
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
        
        if role != 'SUPER_ADMIN' and not (role == 'DEVELOPER' and can_manage):
            return jsonify({'error': 'Permission denied. Developer management access required.'}), 403
            
        return f(*args, **kwargs)
    return decorated_function
