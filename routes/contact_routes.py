# routes/contact_routes.py - Contact Form Submission Endpoint
import re
from flask import Blueprint, request, jsonify
from services.email_service import email_service

contact_bp = Blueprint('contact', __name__, url_prefix='/api')

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')

@contact_bp.route('/contact', methods=['POST'])
def submit_contact_form():
    """
    Handle contact form submissions.
    Validates name, email, and message server-side,
    sanitizes inputs, checks spam honeypot, and dispatches via SMTP.
    """
    data = request.get_json(silent=True) or request.form.to_dict() or {}

    # Honeypot spam check (if 'website' or 'bot_field' is filled, silently ignore bot)
    if data.get('website') or data.get('bot_field'):
        return jsonify({
            'status': 'success',
            'message': 'Your message has been sent successfully!'
        }), 200

    name = str(data.get('name', '')).strip()
    email = str(data.get('email', '')).strip()
    message = str(data.get('message', '')).strip()
    phone = str(data.get('phone', '')).strip()
    subject = str(data.get('subject', '')).strip()

    # Validation: Name
    if not name:
        return jsonify({
            'status': 'error',
            'message': 'Name is required.'
        }), 400
    if len(name) < 2 or len(name) > 100:
        return jsonify({
            'status': 'error',
            'message': 'Name must be between 2 and 100 characters.'
        }), 400

    # Validation: Email
    if not email:
        return jsonify({
            'status': 'error',
            'message': 'Email is required.'
        }), 400
    if len(email) > 255 or not EMAIL_REGEX.match(email):
        return jsonify({
            'status': 'error',
            'message': 'Please provide a valid email address.'
        }), 400

    # Validation: Message
    if not message:
        return jsonify({
            'status': 'error',
            'message': 'Message is required.'
        }), 400
    if len(message) < 5:
        return jsonify({
            'status': 'error',
            'message': 'Message must be at least 5 characters long.'
        }), 400
    if len(message) > 5000:
        return jsonify({
            'status': 'error',
            'message': 'Message must not exceed 5000 characters.'
        }), 400

    # Optional field limits
    if phone and len(phone) > 30:
        phone = phone[:30]
    if subject and len(subject) > 200:
        subject = subject[:200]

    # Dispatch via Email Service
    success = email_service.send_contact_email(
        name=name,
        email=email,
        message=message,
        phone=phone,
        subject_line=subject
    )

    if not success:
        return jsonify({
            'status': 'error',
            'message': 'Failed to send your message due to an email delivery error. Please try again later.'
        }), 500

    return jsonify({
        'status': 'success',
        'message': 'Thank you! Your message has been sent successfully.'
    }), 200
