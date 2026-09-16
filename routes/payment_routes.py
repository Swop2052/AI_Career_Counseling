# routes/payment_routes.py - Pricing, Campaigns, Razorpay Checkout & Webhooks
from flask import Blueprint, request, jsonify, session
from services.pricing_service import pricing_service
from services.campaign_service import campaign_service, CampaignValidationError
from services.payment_service import payment_service
from services.wallet_service import wallet_service
from core.security import require_auth

payment_bp = Blueprint('payment', __name__)

def sanitize_plan(plan: dict) -> dict:
    if not plan:
        return {}
    return {
        'id': plan.get('id'),
        'name': plan.get('name'),
        'type': plan.get('type'),
        'price': float(plan.get('price', 0.0)),
        'currency': plan.get('currency', 'INR'),
        'credits': int(plan.get('credits', 1)),
        'duration_days': plan.get('duration_days'),
        'is_active': int(plan.get('is_active', 1)),
        'is_recommended': int(plan.get('is_recommended', 0))
    }

@payment_bp.route('/api/plans', methods=['GET'])
@payment_bp.route('/api/pricing-plans', methods=['GET'])
def get_plans():
    """Retrieve all active pricing plans sanitized for public display."""
    try:
        raw_plans = pricing_service.get_active_plans()
        plans = [sanitize_plan(p) for p in raw_plans]
        return jsonify({'plans': plans}), 200
    except Exception as e:
        print(f"[ERROR] get_plans failed: {e}")
        return jsonify({'error': 'Failed to load pricing plans.'}), 500

@payment_bp.route('/api/pricing/lowest-plan', methods=['GET'])
def get_lowest_plan():
    """Retrieve lowest active plan for zero-credit prompt."""
    try:
        lowest = pricing_service.get_lowest_active_plan()
        return jsonify({'lowest_plan': sanitize_plan(lowest)}), 200
    except Exception as e:
        print(f"[ERROR] get_lowest_plan failed: {e}")
        return jsonify({'error': 'Failed to retrieve pricing plan.'}), 500

@payment_bp.route('/api/campaigns/validate-discount', methods=['POST'])
def validate_discount():
    """Validate a referral or campaign coupon code server-side."""
    data = request.json or {}
    plan_id = data.get('plan_id')
    code = data.get('code')
    user_id = session.get('user_id')

    if not plan_id:
        return jsonify({'valid': False, 'status': 'plan_not_eligible', 'error': 'Plan ID is required.'}), 400

    if not code or not str(code).strip():
        return jsonify({'valid': False, 'status': 'invalid_code', 'error': 'Please enter a coupon code.'}), 400

    try:
        res = campaign_service.validate_discount_code(
            user_id=user_id,
            plan_id=plan_id,
            code_str=str(code).strip()
        )
        return jsonify(res), 200
    except CampaignValidationError as cve:
        return jsonify(cve.to_dict()), 400
    except ValueError as ve:
        return jsonify({'valid': False, 'status': 'invalid_code', 'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] validate_discount failed: {e}")
        return jsonify({'valid': False, 'status': 'error', 'error': 'Failed to validate coupon.'}), 500

@payment_bp.route('/api/payments/redeem-zero', methods=['POST'])
@require_auth
def redeem_zero_amount():
    """Fulfill a 100% discount zero-amount redemption without creating a Razorpay order."""
    user_id = session.get('user_id')
    data = request.get_json(silent=True) or {}
    plan_id = data.get('plan_id')
    referral_code = data.get('referral_code') or data.get('campaign_code') or data.get('coupon_code') or data.get('code')
    attempt_id = data.get('attempt_id') or session.get('pending_attempt_id')

    if not plan_id or not referral_code:
        return jsonify({'error': 'Plan ID and coupon code are required.'}), 400

    try:
        res = payment_service.redeem_zero_amount_order(
            user_id=user_id,
            plan_id=plan_id,
            referral_code=referral_code,
            attempt_id=attempt_id
        )
        session.pop('pending_attempt_id', None)
        res['balance'] = wallet_service.get_balance(user_id)
        return jsonify(res), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] redeem_zero_amount failed: {e}")
        return jsonify({'error': 'Failed to redeem zero-amount order.'}), 500

@payment_bp.route('/api/payment/create-order', methods=['POST'])
@payment_bp.route('/api/payments/create-order', methods=['POST'])
@require_auth
def create_order():
    """Create a verified Razorpay order for an active plan, factoring in server-validated discounts."""
    user_id = session.get('user_id')
    data = request.get_json(silent=True) or {}
    plan_id = data.get('plan_id')
    referral_code = data.get('referral_code')
    attempt_id = data.get('attempt_id') or session.get('pending_attempt_id')

    if not plan_id:
        return jsonify({'error': 'Plan ID is required.'}), 400

    try:
        order = payment_service.create_payment_order(
            user_id=user_id,
            plan_id=plan_id,
            referral_code=referral_code,
            attempt_id=attempt_id
        )
        return jsonify(order), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] create_order failed: {e}")
        return jsonify({'error': 'Failed to create payment order.'}), 500

@payment_bp.route('/api/payment/verify', methods=['POST'])
@payment_bp.route('/api/payments/verify', methods=['POST'])
@require_auth
def verify_payment():
    """Verify cryptographic Razorpay HMAC signature and fulfill credits."""
    user_id = session.get('user_id')
    data = request.get_json(silent=True) or {}
    order_id = data.get('razorpay_order_id')
    payment_id = data.get('razorpay_payment_id')
    signature = data.get('razorpay_signature')
    attempt_id = data.get('attempt_id') or session.get('pending_attempt_id')

    if not order_id or not payment_id or not signature:
        return jsonify({'error': 'Missing payment verification data.'}), 400

    try:
        res = payment_service.verify_and_process_payment(
            user_id=user_id,
            razorpay_order_id=order_id,
            razorpay_payment_id=payment_id,
            razorpay_signature=signature,
            attempt_id=attempt_id
        )
        session.pop('pending_attempt_id', None)
        res['balance'] = wallet_service.get_balance(user_id)
        return jsonify(res), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] verify_payment failed: {e}")
        return jsonify({'error': 'Payment verification failed.'}), 400

@payment_bp.route('/api/payments/cancel', methods=['POST'])
@payment_bp.route('/api/payment/cancel', methods=['POST'])
@payment_bp.route('/api/payments/order/<order_id>/cancel', methods=['POST'])
@require_auth
def cancel_payment(order_id=None):
    """Mark a pending payment order as cancelled upon user modal dismissal."""
    user_id = session.get('user_id')
    data = request.get_json(silent=True) or {}
    order_id = order_id or data.get('order_id')
    if not order_id:
        return jsonify({'error': 'order_id is required.'}), 400

    try:
        success = payment_service.mark_payment_cancelled(user_id, order_id)
        return jsonify({'success': success}), 200
    except Exception as e:
        print(f"[ERROR] cancel_payment failed: {e}")
        return jsonify({'error': str(e)}), 400

@payment_bp.route('/api/payments/webhook', methods=['POST'])
def razorpay_webhook():
    """Asynchronous server-to-server Razorpay notification webhook."""
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
