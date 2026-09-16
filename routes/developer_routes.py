# routes/developer_routes.py - Developer & Super-Admin Administration Endpoints
from flask import Blueprint, request, jsonify, session
from services.stats_service import stats_service
from services.auth_service import auth_service
from services.pricing_service import pricing_service
from services.campaign_service import campaign_service
from services.wallet_service import wallet_service
from core.security import require_developer, require_can_manage_developers, require_super_admin
from database.schema import get_db_connection

developer_bp = Blueprint('developer', __name__, url_prefix='/api/developer')

@developer_bp.route('/stats', methods=['GET'])
@require_developer
def get_stats():
    """Retrieve live aggregate analytics (revenue from captured payments only, attempts, credits)."""
    stats = stats_service.get_dashboard_stats()
    user_id = session.get('user_id')
    user = auth_service.get_user_by_id(user_id) if user_id else None

    caller_role = user.get('role', 'DEVELOPER') if user else session.get('role', 'DEVELOPER')
    can_manage = bool(user.get('can_manage_developers', False)) if user else bool(session.get('can_manage_developers', False))
    caller_can_manage = (caller_role == 'SUPER_ADMIN' or can_manage)

    session['role'] = caller_role
    session['can_manage_developers'] = caller_can_manage

    stats['caller_role'] = caller_role
    stats['caller_can_manage'] = caller_can_manage
    return jsonify(stats), 200

@developer_bp.route('/verify-super-admin', methods=['GET'])
@require_super_admin
def verify_super_admin():
    """Authoritative server-side check confirming active SUPER_ADMIN role."""
    user_id = session.get('user_id')
    user = auth_service.get_user_by_id(user_id)
    return jsonify({
        'status': 'success',
        'is_super_admin': True,
        'role': 'SUPER_ADMIN',
        'user': {
            'id': user['id'],
            'email': user['email'],
            'role': 'SUPER_ADMIN',
            'can_manage_developers': True
        }
    }), 200

@developer_bp.route('/plans', methods=['GET', 'POST'])
@require_developer
def manage_plans():
    """List all pricing plans or create a new plan."""
    if request.method == 'GET':
        plans = pricing_service.get_all_plans()
        return jsonify({'plans': plans}), 200

    data = request.json or {}
    try:
        plan = pricing_service.create_plan(
            name=data.get('name', 'New Plan'),
            plan_type=data.get('type', 'CREDIT_PACK'),
            price=float(data.get('price', 19.0)),
            credits=int(data.get('credits', 1)),
            duration_days=data.get('duration_days'),
            currency=data.get('currency', 'INR'),
            is_active=int(data.get('is_active', 1)),
            plan_id=data.get('id')
        )
        return jsonify({'status': 'success', 'plan': plan}), 201
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400

@developer_bp.route('/plans/<plan_id>', methods=['PUT', 'DELETE'])
@require_developer
def update_or_delete_plan(plan_id):
    """Update an existing plan or safely delete/archive it."""
    if request.method == 'DELETE':
        try:
            res = pricing_service.delete_or_archive_plan(plan_id)
            return jsonify({'status': 'success', **res}), 200
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
        return jsonify({'status': 'success', 'plan': plan}), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400

@developer_bp.route('/plans/<plan_id>/toggle', methods=['POST'])
@require_developer
def toggle_plan(plan_id):
    """Toggle active/inactive status of a pricing plan."""
    data = request.json or {}
    if 'is_active' not in data:
        return jsonify({'error': 'is_active field is required.'}), 400
    try:
        is_active = 1 if data.get('is_active') in (1, '1', True, 'true') else 0
        plan = pricing_service.update_plan(plan_id=plan_id, is_active=is_active)
        if not plan:
            return jsonify({'error': 'Pricing plan not found.'}), 404
        return jsonify({'status': 'success', 'plan': plan}), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 404
    except Exception as e:
        print(f"[ERROR] Toggle plan error: {e}")
        return jsonify({'error': 'Failed to toggle pricing plan status.'}), 500

@developer_bp.route('/credits/adjust', methods=['POST'])
@require_developer
def adjust_credits():
    """Manual credit grant or deduction with mandatory audit reason."""
    data = request.json or {}
    email = data.get('email')
    amount = data.get('amount')
    description = data.get('description')

    if not email or amount is None or not description:
        return jsonify({'error': 'Email, amount, and description reason are required.'}), 400

    try:
        amount = int(amount)
        if amount == 0:
            return jsonify({'error': 'Adjustment amount cannot be zero.'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Amount must be an integer.'}), 400

    # Locate user
    conn = get_db_connection()
    target_user_id = None
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(%s))", (email.strip(),))
        row = cursor.fetchone()
        if row:
            target_user_id = row['id']
    finally:
        conn.close()

    if not target_user_id:
        return jsonify({'error': f'No account found with email {email}.'}), 404

    actor_id = session.get('user_id', 'unknown')
    actor_email = session.get('user_email', 'unknown')

    try:
        if amount > 0:
            new_bal = wallet_service.add_credits(
                user_id=target_user_id,
                amount=amount,
                transaction_type='MANUAL_GRANT',
                reference_type='DEVELOPER_OVERRIDE',
                reference_id=actor_id,
                description=f"Manual grant by {actor_email}: {description.strip()}"
            )
        else:
            new_bal = wallet_service.deduct_credits(
                user_id=target_user_id,
                amount=abs(amount),
                transaction_type='MANUAL_DEDUCTION',
                reference_type='DEVELOPER_OVERRIDE',
                reference_id=actor_id,
                description=f"Manual deduction by {actor_email}: {description.strip()}"
            )

        auth_service.write_audit_log(
            actor_id=actor_id,
            actor_email=actor_email,
            action='CREDIT_ADJUSTMENT',
            target_email=email.strip(),
            target_id=target_user_id,
            details=f"Adjustment: {amount:+d} credits. Reason: {description.strip()}. New balance: {new_bal}"
        )

        return jsonify({'status': 'success', 'new_balance': new_bal, 'message': f'Successfully updated balance to {new_bal}.'}), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Credit adjustment failed: {e}")
        return jsonify({'error': 'Failed to adjust credits.'}), 500

@developer_bp.route('/campaigns', methods=['GET', 'POST'])
@require_developer
def manage_campaigns():
    """List or create campaign/referral codes."""
    if request.method == 'GET':
        campaigns = campaign_service.get_all_campaigns()
        return jsonify({'campaigns': campaigns}), 200

    data = request.json or {}
    try:
        raw_max = data.get('max_uses')
        max_uses_val = int(raw_max) if (raw_max is not None and str(raw_max).strip()) else 300
        one_use_val = data.get('one_use_per_user', data.get('one_per_account', 1))

        code_obj = campaign_service.create_campaign_code(
            code=data.get('code', ''),
            campaign_name=data.get('campaign_name', ''),
            discount_type=data.get('discount_type', 'PERCENTAGE'),
            discount_value=float(data.get('discount_value', 20.0)),
            valid_from=data.get('valid_from'),
            valid_until=data.get('valid_until'),
            max_uses=max_uses_val,
            one_use_per_user=int(one_use_val),
            created_by=session.get('user_id')
        )
        return jsonify({'status': 'success', 'campaign': code_obj}), 201
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] Create campaign error: {e}")
        return jsonify({'error': str(e)}), 400

@developer_bp.route('/campaigns/<code_id>/toggle', methods=['POST'])
@require_developer
def toggle_campaign(code_id):
    """Toggle campaign active status."""
    data = request.json or {}
    if 'is_active' not in data:
        return jsonify({'error': 'is_active field is required.'}), 400
    try:
        is_active = 1 if data.get('is_active') in (1, '1', True, 'true') else 0
        campaign = campaign_service.update_campaign(code_id=code_id, is_active=is_active)
        if not campaign:
            return jsonify({'error': 'Campaign not found.'}), 404
        return jsonify({'status': 'success', 'campaign': campaign}), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 404

@developer_bp.route('/campaigns/<code_id>/redemptions', methods=['GET'])
@require_developer
def campaign_redemptions(code_id):
    """View redemption history for a specific campaign code."""
    try:
        redemptions = campaign_service.get_code_redemptions(code_id)
        return jsonify({'redemptions': redemptions}), 200
    except Exception as e:
        print(f"[ERROR] campaign_redemptions failed: {e}")
        return jsonify({'error': 'Failed to load redemptions.'}), 500

@developer_bp.route('/users', methods=['GET'])
@require_developer
def list_users():
    """List registered users with assessment summary."""
    try:
        users = auth_service.list_all_users()
        return jsonify({'users': users}), 200
    except Exception as e:
        print(f"[ERROR] list_users failed: {e}")
        return jsonify({'error': 'Failed to retrieve users.'}), 500

@developer_bp.route('/users/<target_id>/status', methods=['POST'])
@require_can_manage_developers
def set_user_status(target_id):
    """Set student or user active/inactive status via toggle with audit log."""
    data = request.json or {}
    is_active = 1 if data.get('is_active') in (1, '1', True, 'true') else 0

    caller_user = auth_service.get_user_by_id(session.get('user_id'))
    if not caller_user:
        return jsonify({'error': 'Authentication required.'}), 401

    if target_id == caller_user['id'] and not is_active:
        return jsonify({'error': 'You cannot deactivate your own logged-in account.'}), 400

    target = auth_service.get_user_by_id(target_id)
    if not target:
        return jsonify({'error': 'User account not found.'}), 404

    if target['role'] == 'SUPER_ADMIN' and caller_user.get('role') != 'SUPER_ADMIN':
        return jsonify({'error': 'Only Super Admins can modify Super Admin accounts.'}), 403

    try:
        res = auth_service.set_user_status(
            target_id=target_id,
            is_active=is_active,
            actor_id=caller_user['id'],
            actor_email=caller_user['email']
        )
        status_label = 'Active' if is_active else 'Disabled'
        return jsonify({'status': 'success', 'message': f'User account status updated to {status_label}.', 'user': res}), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] set_user_status failed: {e}")
        return jsonify({'error': 'Failed to update user status.'}), 500

@developer_bp.route('/accounts', methods=['GET'])
@require_can_manage_developers
def list_accounts():
    """List developers and super admins with permissions."""
    try:
        accounts = auth_service.list_developers()
        return jsonify({'accounts': accounts}), 200
    except Exception as e:
        print(f"[ERROR] list_accounts failed: {e}")
        return jsonify({'error': 'Failed to retrieve developer accounts.'}), 500

@developer_bp.route('/accounts/invite', methods=['POST'])
@require_can_manage_developers
def invite_developer():
    """Issue a secure tokenized email invitation to a new developer or super admin."""
    data = request.json or {}
    email = (data.get('email') or '').strip().lower()
    full_name = (data.get('full_name') or '').strip()
    role = (data.get('role') or 'DEVELOPER').strip().upper()
    can_manage = int(data.get('can_manage_developers', 0))

    if not email or not full_name:
        return jsonify({'error': 'Email and full name are required.'}), 400

    # Role validation against explicit allowlist
    ALLOWED_ROLES = {'DEVELOPER', 'SUPER_ADMIN'}
    if role not in ALLOWED_ROLES:
        return jsonify({'error': f'Invalid role. Allowed roles are: {", ".join(sorted(ALLOWED_ROLES))}'}), 400

    caller_user = auth_service.get_user_by_id(session.get('user_id'))
    if not caller_user:
        return jsonify({'error': 'Authentication required.'}), 401

    caller_role = caller_user.get('role')

    # Security: Only verified Super Admins can invite/create another Super Admin
    if role == 'SUPER_ADMIN' and caller_role != 'SUPER_ADMIN':
        return jsonify({'error': 'Only Super Admins can invite or create Super Admin accounts.'}), 403

    # Security: Developers cannot grant can_manage_developers
    if caller_role != 'SUPER_ADMIN' and can_manage:
        return jsonify({'error': 'Only Super Admins can grant management permissions.'}), 403

    try:
        invitation = auth_service.invite_developer(
            email=email,
            full_name=full_name,
            role=role,
            actor_id=caller_user['id'],
            actor_email=caller_user['email'],
            can_manage_developers=can_manage,
            app_base_url=request.host_url
        )
        return jsonify({'status': 'success', 'message': f'Invitation successfully sent to {email}.', 'invitation': invitation}), 201
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] invite_developer failed: {e}")
        return jsonify({'error': 'Failed to send invitation.'}), 500

@developer_bp.route('/accounts/resend-invite', methods=['POST'])
@require_can_manage_developers
def resend_developer_invitation():
    """Resend an account setup invitation email with a fresh expiring token."""
    data = request.json or {}
    email = (data.get('email') or '').strip().lower()
    if not email:
        return jsonify({'error': 'Email address is required.'}), 400

    caller_user = auth_service.get_user_by_id(session.get('user_id'))
    if not caller_user:
        return jsonify({'error': 'Authentication required.'}), 401

    # Verify target user existence and permissions
    target = auth_service.get_user_by_email(email)
    if not target:
        return jsonify({'error': f"No account found for '{email}'."}), 404

    if target.get('role') == 'SUPER_ADMIN' and caller_user.get('role') != 'SUPER_ADMIN':
        return jsonify({'error': 'Only Super Admins can resend invitations for Super Admin accounts.'}), 403

    try:
        res = auth_service.resend_account_invitation(
            email=email,
            actor_id=caller_user['id'],
            actor_email=caller_user['email'],
            app_base_url=request.host_url
        )
        return jsonify({
            'status': 'success',
            'message': f"Invitation successfully resent to {email}."
        }), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] resend_developer_invitation error: {e}")
        return jsonify({'error': 'Failed to resend invitation.'}), 500

@developer_bp.route('/accounts/<target_id>/status', methods=['POST'])
@require_can_manage_developers
def set_developer_status(target_id):
    """Set developer active/inactive status via toggle."""
    data = request.json or {}
    is_active = 1 if data.get('is_active') in (1, '1', True, 'true') else 0
    
    caller_user = auth_service.get_user_by_id(session.get('user_id'))
    if not caller_user:
        return jsonify({'error': 'Authentication required.'}), 401

    if target_id == caller_user['id'] and not is_active:
        return jsonify({'error': 'You cannot deactivate your own logged-in account.'}), 400

    target = auth_service.get_user_by_id(target_id)
    if not target:
        return jsonify({'error': 'Account not found.'}), 404

    if target['role'] == 'SUPER_ADMIN' and caller_user.get('role') != 'SUPER_ADMIN':
        return jsonify({'error': 'Only Super Admins can modify Super Admin accounts.'}), 403

    try:
        auth_service.set_developer_status(
            target_id=target_id,
            is_active=is_active,
            actor_id=caller_user['id'],
            actor_email=caller_user['email']
        )
        return jsonify({'status': 'success', 'message': f'Account status updated to {"Active" if is_active else "Disabled"}.'}), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] set_developer_status failed: {e}")
        return jsonify({'error': 'Failed to update account status.'}), 500

@developer_bp.route('/accounts/<target_id>', methods=['DELETE'])
@require_can_manage_developers
def delete_developer(target_id):
    """Delete a developer or super admin account."""
    caller_user = auth_service.get_user_by_id(session.get('user_id'))
    if not caller_user:
        return jsonify({'error': 'Authentication required.'}), 401

    if target_id == caller_user['id']:
        return jsonify({'error': 'You cannot delete your own logged-in account.'}), 400

    target = auth_service.get_user_by_id(target_id)
    if not target:
        return jsonify({'error': 'Account not found.'}), 404

    if target['role'] == 'SUPER_ADMIN' and caller_user.get('role') != 'SUPER_ADMIN':
        return jsonify({'error': 'Only Super Admins can delete Super Admin accounts.'}), 403

    try:
        auth_service.delete_developer(
            target_id=target_id,
            actor_id=caller_user['id'],
            actor_email=caller_user['email']
        )
        return jsonify({'status': 'success', 'message': f'Account {target["email"]} deleted successfully.'}), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] delete_developer failed: {e}")
        return jsonify({'error': 'Failed to delete account.'}), 500

@developer_bp.route('/accounts/<target_id>/permissions', methods=['POST'])
@require_super_admin
def update_developer_permissions(target_id):
    """Set can_manage_developers permission (Super Admin only)."""
    data = request.json or {}
    can_manage = 1 if data.get('can_manage_developers') in (1, '1', True, 'true') else 0

    try:
        auth_service.update_developer_permissions(
            target_id=target_id,
            can_manage_developers=can_manage,
            actor_id=session.get('user_id'),
            actor_email=session.get('user_email', '')
        )
        return jsonify({'status': 'success', 'message': 'Permissions updated successfully.'}), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"[ERROR] update_developer_permissions failed: {e}")
        return jsonify({'error': 'Failed to update permissions.'}), 500

@developer_bp.route('/audit-log', methods=['GET'])
@require_developer
def get_audit_log():
    """Retrieve chronological audit trail of all administrative and financial actions."""
    try:
        limit = int(request.args.get('limit', 100))
        logs = auth_service.get_audit_logs(limit=limit)
        return jsonify({'logs': logs}), 200
    except Exception as e:
        print(f"[ERROR] get_audit_log failed: {e}")
        return jsonify({'error': 'Failed to load audit logs.'}), 500
