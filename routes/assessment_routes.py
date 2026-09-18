# routes/assessment_routes.py - Assessment Attempts, Claiming, History & Unlocking
from flask import Blueprint, request, jsonify, session
from services.assessment_service import assessment_service
from services.wallet_service import wallet_service
from core.security import require_auth
from core.translator_cache import translate_teaser_data, translate_career_data

assessment_bp = Blueprint('assessment', __name__)

@assessment_bp.route('/api/account/summary', methods=['GET'])
@require_auth
def account_summary():
    """Return user's de-duplicated assessment history and credit balance."""
    user_id = session.get('user_id')
    try:
        attempts = assessment_service.get_user_attempts(user_id)
        balance = wallet_service.get_balance(user_id)
        from services.pricing_service import pricing_service
        lowest_plan = pricing_service.get_lowest_active_plan()
        return jsonify({
            'status': 'success',
            'attempts': attempts,
            'wallet': {'balance': balance},
            'lowest_plan': lowest_plan
        }), 200
    except Exception as e:
        print(f"[ERROR] account_summary failed: {e}")
        return jsonify({'error': str(e)}), 500

@assessment_bp.route('/api/assessment/<attempt_id>/claim', methods=['POST'])
@require_auth
def claim_assessment(attempt_id):
    """Explicitly associate a completed guest assessment attempt with the authenticated user."""
    user_id = session.get('user_id')
    try:
        claimed_count = assessment_service.claim_guest_assessment(
            guest_session_id=session.get('session_id'),
            user_id=user_id,
            attempt_id=attempt_id
        )
        return jsonify({
            'status': 'success',
            'claimed': bool(claimed_count and claimed_count > 0),
            'attempt_id': attempt_id
        }), 200
    except Exception as e:
        print(f"[ERROR] claim_assessment failed: {e}")
        return jsonify({'error': str(e)}), 500

@assessment_bp.route('/api/assessment/<attempt_id>/status', methods=['GET'])
def get_assessment_status(attempt_id):
    """Authoritative status check for an assessment attempt."""
    user_id = session.get('user_id')
    try:
        attempt = assessment_service.get_attempt_by_id(attempt_id)
        if not attempt:
            return jsonify({'error': 'Assessment attempt not found.', 'exists': False}), 404
            
        owner_id = attempt.get('user_id')
        # If user is authenticated and the attempt is unclaimed, securely claim it for this user
        if user_id and (not owner_id or str(owner_id).strip() == ''):
            assessment_service.claim_guest_assessment(attempt_id=attempt_id, user_id=user_id)
            owner_id = user_id

        is_owner = bool(user_id and owner_id and str(user_id).strip() == str(owner_id).strip())
        is_guest_unclaimed = bool(not owner_id)
        is_unlocked = bool(attempt.get('is_unlocked'))
        
        return jsonify({
            'status': 'success',
            'attempt_id': attempt.get('id'),
            'exists': True,
            'is_unlocked': is_unlocked,
            'is_owner': is_owner,
            'is_guest_unclaimed': is_guest_unclaimed,
            'created_at': attempt.get('created_at').isoformat() if hasattr(attempt.get('created_at'), 'isoformat') else str(attempt.get('created_at') or ''),
            'completed_at': attempt.get('completed_at').isoformat() if hasattr(attempt.get('completed_at'), 'isoformat') else str(attempt.get('completed_at') or ''),
            'unlocked_at': attempt.get('unlocked_at').isoformat() if hasattr(attempt.get('unlocked_at'), 'isoformat') else str(attempt.get('unlocked_at') or '')
        }), 200
    except Exception as e:
        print(f"[ERROR] get_assessment_status failed: {e}")
        return jsonify({'error': str(e), 'exists': False}), 500

@assessment_bp.route('/api/assessment/<attempt_id>/teaser', methods=['GET'])
def get_assessment_teaser(attempt_id):
    """Retrieve public/teaser report data for an assessment attempt."""
    try:
        lang = request.args.get('lang', 'en')
        teaser = assessment_service.get_teaser(attempt_id)
        if not teaser:
            return jsonify({'error': 'Assessment attempt not found.'}), 404
            
        owner_id = teaser.get('user_id')
        if owner_id:
            curr_user = session.get('user_id')
            if not curr_user:
                return jsonify({'error': 'Authentication required to view this assessment.'}), 401
            elif str(curr_user) != str(owner_id) and session.get('role') != 'SUPER_ADMIN':
                return jsonify({'error': 'Forbidden: You do not own this assessment.'}), 403

        if lang != 'en':
            teaser = translate_teaser_data(teaser, lang)
            
        return jsonify(teaser), 200
    except Exception as e:
        print(f"[ERROR] get_assessment_teaser failed: {e}")
        return jsonify({'error': str(e)}), 400

@assessment_bp.route('/api/assessment/<attempt_id>/full', methods=['GET'])
@require_auth
def get_assessment_full(attempt_id):
    """Retrieve full unlocked assessment report. Enforces server-side unlock verification and IDOR ownership check."""
    user_id = session.get('user_id')
    is_admin = session.get('role') == 'SUPER_ADMIN'
    try:
        lang = request.args.get('lang', 'en')
        data = assessment_service.get_assessment_full(user_id, attempt_id, is_admin=is_admin)
        if not data:
            return jsonify({'error': 'Assessment not found or not unlocked.'}), 404
            
        if lang != 'en' and 'full_result_data' in data:
            if 'career_matches' in data['full_result_data']:
                matches = data['full_result_data']['career_matches']
                data['full_result_data']['career_matches'] = [translate_career_data(m, lang) for m in matches]
                
        return jsonify(data), 200
    except ValueError as ve:
        msg = str(ve)
        if "not found" in msg.lower():
            return jsonify({'error': msg}), 404
        if "unauthorized" in msg.lower() or "forbidden" in msg.lower():
            return jsonify({'error': msg}), 403
        return jsonify({'error': msg, 'is_locked': True}), 400
    except Exception as e:
        print(f"[ERROR] get_assessment_full failed: {e}")
        return jsonify({'error': 'Failed to retrieve assessment report.'}), 500

@assessment_bp.route('/api/assessment/<attempt_id>/unlock', methods=['POST'])
@require_auth
def unlock_assessment(attempt_id):
    """
    Atomically deduct 1 credit to unlock the specified assessment attempt permanently.
    If already unlocked, returns success immediately without deducting credit.
    """
    user_id = session.get('user_id')
    try:
        res = assessment_service.unlock_assessment(user_id, attempt_id)
        # Update session with new balance
        res['balance'] = wallet_service.get_balance(user_id)
        return jsonify(res), 200
    except ValueError as ve:
        msg = str(ve)
        if "not found" in msg.lower():
            return jsonify({'error': msg}), 404
        if "insufficient" in msg.lower():
            return jsonify({'error': msg, 'insufficient_credits': True}), 402
        if "unauthorized" in msg.lower() or "forbidden" in msg.lower():
            return jsonify({'error': msg}), 403
        return jsonify({'error': msg}), 400
    except Exception as e:
        print(f"[ERROR] unlock_assessment failed: {e}")
        return jsonify({'error': 'Failed to unlock assessment report.'}), 500

@assessment_bp.route('/api/session/clear-pending', methods=['POST'])
def clear_pending_attempt():
    """Clear any pending guest assessment ID from the session."""
    session.pop('pending_attempt_id', None)
    return jsonify({'status': 'success'}), 200
