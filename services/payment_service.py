# services/payment_service.py - Modular payment provider and transaction verification service
import uuid
import hmac
import hashlib
from datetime import datetime
from typing import Optional, Dict, Any, List
from core.config import config
from database.schema import get_db_connection
from services.pricing_service import pricing_service
from services.wallet_service import wallet_service


class BasePaymentProvider:
    """Abstract base class for payment gateway providers (Razorpay, Stripe, etc.)."""
    def create_order(self, amount_in_subunits: int, currency: str, receipt: str, notes: Dict) -> Dict[str, Any]:
        raise NotImplementedError

    def verify_signature(self, params: Dict[str, str]) -> bool:
        raise NotImplementedError


class RazorpayProvider(BasePaymentProvider):
    """Razorpay Payment Gateway Provider implementation."""

    def __init__(self):
        self.key_id = config.razorpay_key_id
        self.key_secret = config.razorpay_key_secret

    def create_order(self, amount_in_subunits: int, currency: str, receipt: str, notes: Dict) -> Dict[str, Any]:
        """Create a Razorpay order via REST API or SDK."""
        # Gated test fallback for local offline development only
        if config.flask_env == "development" and self.key_id.startswith("rzp_test_512345"):
            order_id = f"order_rzp_{uuid.uuid4().hex[:14]}"
            return {
                'order_id': order_id,
                'amount': amount_in_subunits,
                'currency': currency,
                'key_id': self.key_id
            }

        try:
            import razorpay
            client = razorpay.Client(auth=(self.key_id, self.key_secret))
            data = {
                "amount": amount_in_subunits,
                "currency": currency,
                "receipt": receipt,
                "payment_capture": 1,
                "notes": notes
            }
            order = client.order.create(data=data)
            return {
                'order_id': order['id'],
                'amount': order['amount'],
                'currency': order['currency'],
                'key_id': self.key_id
            }
        except Exception as e:
            # Only allow dummy simulated order in development mode
            if config.flask_env == "development":
                order_id = f"order_rzp_{uuid.uuid4().hex[:14]}"
                return {
                    'order_id': order_id,
                    'amount': amount_in_subunits,
                    'currency': currency,
                    'key_id': self.key_id
                }
            raise ValueError(f"Razorpay order creation failed: {e}")

    def verify_signature(self, params: Dict[str, str]) -> bool:
        """Verify Razorpay payment signature using HMAC-SHA256."""
        order_id = params.get('razorpay_order_id', '')
        payment_id = params.get('razorpay_payment_id', '')
        signature = params.get('razorpay_signature', '')

        if not order_id or not payment_id or not signature:
            return False

        # In development mode only, allow mock testing signatures
        if config.flask_env == "development":
            if signature.startswith("simulated_test_sig") or signature == "test_signature_valid" or self.key_id.startswith("rzp_test_512345"):
                return True

        try:
            import razorpay
            client = razorpay.Client(auth=(self.key_id, self.key_secret))
            client.utility.verify_payment_signature({
                'razorpay_order_id': order_id,
                'razorpay_payment_id': payment_id,
                'razorpay_signature': signature
            })
            return True
        except Exception:
            # Manual HMAC-SHA256 verification
            msg = f"{order_id}|{payment_id}"
            generated_signature = hmac.new(
                self.key_secret.encode('utf-8'),
                msg.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(generated_signature, signature)

    def fetch_payment_status(self, payment_id: str, expected_amount: int) -> Dict[str, Any]:
        """Fetch payment from Razorpay API, verify status is captured/authorized, and capture if needed."""
        if config.flask_env == "development":
            if self.key_id.startswith("rzp_test_512345") or payment_id.startswith("pay_test_") or payment_id.startswith("pay_audit_"):
                return {'status': 'captured', 'captured': True, 'amount': expected_amount}

        try:
            import razorpay
            client = razorpay.Client(auth=(self.key_id, self.key_secret))
            payment = client.payment.fetch(payment_id)
            status = payment.get('status')
            if status == 'captured':
                return {'status': 'captured', 'captured': True, 'amount': payment.get('amount')}
            elif status == 'authorized':
                captured = client.payment.capture(payment_id, expected_amount)
                return {'status': captured.get('status'), 'captured': True, 'amount': captured.get('amount')}
            else:
                return {'status': status, 'captured': False, 'amount': payment.get('amount'), 'error': payment.get('error_description')}
        except Exception as e:
            if config.flask_env == "development" and self.key_id.startswith("rzp_test_"):
                return {'status': 'captured', 'captured': True, 'amount': expected_amount}
            raise ValueError(f"Unable to verify payment capture with Razorpay: {e}")


class PaymentService:
    """High-level payment manager mediating between provider abstraction and credit wallet service."""

    def __init__(self, provider: Optional[BasePaymentProvider] = None):
        self.provider = provider or RazorpayProvider()

    def create_payment_order(
        self,
        user_id: str,
        plan_id: str,
        referral_code: Optional[str] = None,
        attempt_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a payment order with server-calculated price and optional referral discount."""
        from services.campaign_service import campaign_service
        plan = pricing_service.get_plan_by_id(plan_id)
        if not plan or not plan['is_active']:
            raise ValueError("The selected pricing plan is inactive or unavailable.")

        original_price = float(plan['price'])
        discount_amount = 0.0
        campaign_code_id = None
        campaign_name = None
        discount_type = None
        discount_value = 0.0

        if referral_code and referral_code.strip():
            disc_res = campaign_service.validate_discount_code(
                user_id=user_id,
                plan_id=plan_id,
                code_str=referral_code
            )
            original_price = disc_res['original_price']
            discount_amount = disc_res['discount_amount']
            final_price = disc_res['final_price']
            campaign_code_id = disc_res['campaign_id']
            campaign_name = disc_res['campaign_name']
            discount_type = disc_res['discount_type']
            discount_value = disc_res['discount_value']
        else:
            final_price = original_price

        # Exact subunit integer calculation for Razorpay (e.g. 15.20 -> 1520 paise)
        amount_subunits = int(round(final_price * 100))
        receipt_id = f"rcpt_{uuid.uuid4().hex[:10]}"

        notes = {
            'user_id': user_id,
            'plan_id': plan_id,
            'credits': plan['credits'],
            'attempt_id': attempt_id or '',
            'campaign_code_id': campaign_code_id or ''
        }

        order_res = self.provider.create_order(
            amount_in_subunits=amount_subunits,
            currency=plan['currency'],
            receipt=receipt_id,
            notes=notes
        )

        payment_id = f"pay_{uuid.uuid4().hex[:12]}"
        now_str = datetime.now().isoformat()

        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO payments (
                        id, user_id, plan_id, amount, original_amount, discount_amount, campaign_code_id,
                        currency, gateway, razorpay_order_id, status, created_at, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'razorpay', ?, 'CREATED', ?, ?)
                """, (
                    payment_id, user_id, plan_id, final_price, original_price, discount_amount, campaign_code_id,
                    plan['currency'], order_res['order_id'], now_str, now_str
                ))

            return {
                'payment_id': payment_id,
                'order_id': order_res['order_id'],
                'amount': amount_subunits,  # sent in paise for Razorpay checkout.js
                'display_amount': final_price,
                'original_price': original_price,
                'discount_amount': discount_amount,
                'campaign_name': campaign_name,
                'discount_type': discount_type,
                'discount_value': discount_value,
                'currency': plan['currency'],
                'key_id': order_res['key_id'],
                'plan': plan,
                'attempt_id': attempt_id
            }
        finally:
            conn.close()

    def verify_and_process_payment(
        self,
        user_id: str,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str,
        attempt_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Verify Razorpay payment signature, grant credits idempotently, record redemption, and auto-unlock assessment if specified."""
        from services.campaign_service import campaign_service
        from services.assessment_service import assessment_service

        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT p.id, p.user_id, p.plan_id, p.amount, p.original_amount, p.discount_amount,
                       p.campaign_code_id, p.status, p.razorpay_payment_id,
                       pl.credits, pl.name as plan_name
                FROM payments p
                JOIN pricing_plans pl ON p.plan_id = pl.id
                WHERE p.razorpay_order_id = ?
            """, (razorpay_order_id,))
            payment_row = cursor.fetchone()

            if not payment_row:
                raise ValueError("No matching payment record found for this order ID.")

            if payment_row['user_id'] != user_id:
                raise ValueError("Unauthorized payment verification attempt.")

            # Idempotency check: if already processed, handle smoothly
            if payment_row['status'] == 'SUCCESS':
                balance = wallet_service.get_balance(user_id)
                return {
                    'status': 'already_processed',
                    'message': 'Payment was already verified and credits granted.',
                    'credits_granted': payment_row['credits'],
                    'new_balance': balance,
                    'pending_attempt_id': attempt_id
                }

            # Verify signature with provider
            sig_params = {
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            }

            if not self.provider.verify_signature(sig_params):
                with conn:
                    conn.execute("""
                        UPDATE payments SET status = 'FAILED', razorpay_payment_id = ?, razorpay_signature = ?, updated_at = ?
                        WHERE id = ?
                    """, (razorpay_payment_id, razorpay_signature, datetime.now().isoformat(), payment_row['id']))
                raise ValueError("Invalid Razorpay payment signature verification failed.")

            # Verify actual payment state and capture with Razorpay
            expected_subunits = int(round(payment_row['amount'] * 100))
            pay_check = self.provider.fetch_payment_status(razorpay_payment_id, expected_subunits)
            if not pay_check.get('captured'):
                err_msg = pay_check.get('error') or f"Payment not captured. Status: {pay_check.get('status')}"
                with conn:
                    conn.execute("""
                        UPDATE payments SET status = 'FAILED', razorpay_payment_id = ?, razorpay_signature = ?, updated_at = ?
                        WHERE id = ?
                    """, (razorpay_payment_id, razorpay_signature, datetime.now().isoformat(), payment_row['id']))
                raise ValueError(f"Payment capture verification failed: {err_msg}")

            # Mark payment as SUCCESS atomically to prevent double-crediting race conditions (V5)
            now_str = datetime.now().isoformat()
            with conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE payments
                    SET status = 'SUCCESS', razorpay_payment_id = ?, razorpay_signature = ?, updated_at = ?
                    WHERE id = ? AND status = 'CREATED'
                """, (razorpay_payment_id, razorpay_signature, now_str, payment_row['id']))

                if cursor.rowcount == 0:
                    # Payment was already processed by another concurrent request
                    cursor.execute("SELECT status FROM payments WHERE id = ?", (payment_row['id'],))
                    current_p = cursor.fetchone()
                    if current_p and current_p['status'] == 'SUCCESS':
                        balance = wallet_service.get_balance(user_id)
                        return {
                            'status': 'already_processed',
                            'message': 'Payment was already verified and credits granted.',
                            'credits_granted': payment_row['credits'],
                            'new_balance': balance,
                            'pending_attempt_id': attempt_id
                        }
                    raise ValueError("Payment processing could not be completed.")

            # Grant credits atomically (Discounts reduce price, not credits granted!)
            credits_to_grant = payment_row['credits']
            new_balance = wallet_service.add_credits(
                user_id=user_id,
                amount=credits_to_grant,
                transaction_type='PURCHASE',
                reference_type='payment',
                reference_id=payment_row['id'],
                description=f"Purchased {credits_to_grant} assessment credits ({payment_row['plan_name']})"
            )

            # Record referral campaign redemption if used
            if payment_row['campaign_code_id']:
                try:
                    campaign_service.record_discount_redemption(
                        campaign_code_id=payment_row['campaign_code_id'],
                        user_id=user_id,
                        payment_id=payment_row['id'],
                        discount_amount=payment_row['discount_amount'] or 0.0
                    )
                except Exception as e:
                    print(f"[WARNING] Failed recording campaign redemption: {e}")

            # Explicit Unlock Policy: Credit purchase ONLY adds credits to wallet.
            # Do NOT automatically spend credits or unlock assessments without explicit user confirmation.
            return {
                'status': 'success',
                'message': f"Successfully credited {credits_to_grant} credits to your wallet!",
                'credits_granted': credits_to_grant,
                'new_balance': new_balance,
                'pending_attempt_id': attempt_id,
                'plan_name': payment_row['plan_name']
            }
        finally:
            conn.close()

    def redeem_zero_amount_order(
        self,
        user_id: str,
        plan_id: str,
        referral_code: str,
        attempt_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process a 100% discount zero-rupee purchase atomically without Razorpay."""
        from services.campaign_service import campaign_service
        from services.assessment_service import assessment_service

        if not referral_code:
            raise ValueError("Referral code is required for zero-rupee redemption.")

        disc_res = campaign_service.validate_discount_code(
            user_id=user_id,
            plan_id=plan_id,
            code_str=referral_code
        )

        if disc_res['final_price'] != 0.0:
            raise ValueError(f"This plan requires a payable amount of ₹{disc_res['final_price']:.2f}.")

        plan = pricing_service.get_plan_by_id(plan_id)
        if not plan or not plan['is_active']:
            raise ValueError("The selected pricing plan is unavailable.")

        payment_id = f"pay_{uuid.uuid4().hex[:12]}"
        free_order_id = f"free_ord_{uuid.uuid4().hex[:12]}"
        free_payment_id = f"free_pay_{uuid.uuid4().hex[:12]}"
        now_str = datetime.now().isoformat()
        campaign_code_id = disc_res['campaign_id']
        credits_to_grant = plan['credits']

        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                # Create zero-amount payment record
                cursor.execute("""
                    INSERT INTO payments (
                        id, user_id, plan_id, amount, original_amount, discount_amount, campaign_code_id,
                        currency, gateway, razorpay_order_id, razorpay_payment_id, status, created_at, updated_at
                    )
                    VALUES (?, ?, ?, 0.0, ?, ?, ?, ?, 'referral_zero', ?, ?, 'SUCCESS', ?, ?)
                """, (
                    payment_id, user_id, plan_id, disc_res['original_price'], disc_res['discount_amount'],
                    campaign_code_id, plan['currency'], free_order_id, free_payment_id, now_str, now_str
                ))

                # Increment campaign usage atomically with max_uses check (V17)
                cursor.execute("""
                    UPDATE campaign_codes
                    SET used_count = used_count + 1, updated_at = ?
                    WHERE id = ? AND used_count < max_uses AND is_active = 1
                """, (now_str, campaign_code_id))
                if cursor.rowcount == 0:
                    raise ValueError("This referral code has reached its maximum usage limit or is inactive.")

                # Record redemption
                redemption_id = f"rdm_{uuid.uuid4().hex[:12]}"
                cursor.execute("""
                    INSERT INTO campaign_redemptions (id, campaign_code_id, user_id, benefit_granted, discount_applied, payment_id, redeemed_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    redemption_id, campaign_code_id, user_id,
                    f"100% Discount on {plan['name']} ({credits_to_grant} Credits)",
                    disc_res['discount_amount'], payment_id, now_str
                ))

            # Add credits to wallet
            new_balance = wallet_service.add_credits(
                user_id=user_id,
                amount=credits_to_grant,
                transaction_type='PURCHASE',
                reference_type='referral_discount',
                reference_id=payment_id,
                description=f"Redeemed 100% discount '{disc_res['code']}' for {plan['name']} ({credits_to_grant} credits)"
            )

            # Explicit Unlock Policy: 100% discount redemption ONLY adds credits to wallet.
            # Do NOT automatically spend credits or unlock assessments without explicit user confirmation.
            return {
                'status': 'success',
                'message': f"100% discount redeemed! Granted {credits_to_grant} credit(s).",
                'credits_granted': credits_to_grant,
                'new_balance': new_balance,
                'pending_attempt_id': attempt_id,
                'plan_name': plan['name']
            }
        finally:
            conn.close()

    def get_user_payments(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch payment history for a user."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT p.id, p.amount, p.currency, p.gateway, p.status, p.created_at,
                       pl.name as plan_name, pl.credits
                FROM payments p
                JOIN pricing_plans pl ON p.plan_id = pl.id
                WHERE p.user_id = ?
                ORDER BY p.created_at DESC
            """, (user_id,))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()

    def get_all_payments(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch all payments for developer dashboard."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT p.id, p.user_id, p.amount, p.currency, p.gateway, p.status, p.created_at, p.razorpay_payment_id,
                       pl.name as plan_name, u.email, prof.full_name
                FROM payments p
                JOIN pricing_plans pl ON p.plan_id = pl.id
                JOIN users u ON p.user_id = u.id
                LEFT JOIN user_profiles prof ON u.id = prof.user_id
                ORDER BY p.created_at DESC
                LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()

    def handle_webhook_event(self, raw_body: bytes, signature: str) -> Dict[str, Any]:
        """Process Razorpay server-side webhook events idempotently."""
        import json
        import os
        webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET") or config.razorpay_key_secret

        if not signature:
            raise ValueError("Missing Razorpay webhook signature header.")

        # HMAC verification
        generated_sig = hmac.new(
            webhook_secret.encode('utf-8'),
            raw_body,
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(generated_sig, signature):
            if config.flask_env == "development" and signature == "test_webhook_signature":
                pass
            else:
                raise ValueError("Invalid webhook signature verification failed.")

        event_data = json.loads(raw_body.decode('utf-8'))
        event_type = event_data.get('event')
        payload = event_data.get('payload', {})

        if event_type in ('order.paid', 'payment.captured'):
            payment_entity = payload.get('payment', {}).get('entity', {})
            order_id = payment_entity.get('order_id')
            payment_id = payment_entity.get('id')
            notes = payment_entity.get('notes', {})
            attempt_id = notes.get('attempt_id') or None
            user_id = notes.get('user_id')

            if not order_id or not payment_id:
                return {'status': 'ignored', 'reason': 'Missing order_id or payment_id'}

            conn = get_db_connection()
            try:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT p.id, p.user_id, p.plan_id, p.amount, p.campaign_code_id, p.status,
                           pl.credits, pl.name as plan_name
                    FROM payments p
                    JOIN pricing_plans pl ON p.plan_id = pl.id
                    WHERE p.razorpay_order_id = ?
                """, (order_id,))
                p_row = cursor.fetchone()

                if not p_row:
                    return {'status': 'ignored', 'reason': 'Order not found'}

                if p_row['status'] == 'SUCCESS':
                    return {'status': 'already_processed'}

                target_user_id = p_row['user_id'] or user_id
                now_str = datetime.now().isoformat()
                with conn:
                    cursor = conn.cursor()
                    cursor.execute("""
                        UPDATE payments SET status = 'SUCCESS', razorpay_payment_id = ?, updated_at = ?
                        WHERE id = ? AND status = 'CREATED'
                    """, (payment_id, now_str, p_row['id']))
                    if cursor.rowcount == 0:
                        return {'status': 'already_processed'}

                credits_to_grant = p_row['credits']
                wallet_service.add_credits(
                    user_id=target_user_id,
                    amount=credits_to_grant,
                    transaction_type='PURCHASE',
                    reference_type='payment',
                    reference_id=p_row['id'],
                    description=f"Purchased {credits_to_grant} assessment credits ({p_row['plan_name']})"
                )

                if p_row['campaign_code_id']:
                    try:
                        from services.campaign_service import campaign_service
                        campaign_service.record_discount_redemption(
                            campaign_code_id=p_row['campaign_code_id'],
                            user_id=target_user_id,
                            payment_id=p_row['id'],
                            discount_amount=0.0
                        )
                    except Exception:
                        pass

                # Webhook strictly fulfills purchased credits into the student's wallet.
                # Unlocking assessments requires explicit student confirmation.

                return {'status': 'success', 'credits_granted': credits_to_grant}
            finally:
                conn.close()

        elif event_type == 'payment.failed':
            payment_entity = payload.get('payment', {}).get('entity', {})
            order_id = payment_entity.get('order_id')
            payment_id = payment_entity.get('id')
            if order_id:
                conn = get_db_connection()
                try:
                    with conn:
                        conn.execute("""
                            UPDATE payments SET status = 'FAILED', razorpay_payment_id = ?, updated_at = ?
                            WHERE razorpay_order_id = ? AND status = 'CREATED'
                        """, (payment_id, datetime.now().isoformat(), order_id))
                finally:
                    conn.close()
            return {'status': 'recorded_failure'}

        return {'status': 'ignored', 'event': event_type}


payment_service = PaymentService()
