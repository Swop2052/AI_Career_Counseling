# services/email_service.py - SMTP Email Provider for Password Reset & System Notifications
import smtplib
import os
import html
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from core.config import config


class EmailService:
    def __init__(self):
        pass

    def _get_config(self):
        """Dynamically fetch SMTP settings so changes to .env take effect immediately."""
        try:
            load_dotenv(override=True)
        except Exception:
            pass

        smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com').strip()
        try:
            smtp_port = int(os.environ.get('SMTP_PORT', 587))
        except (ValueError, TypeError):
            smtp_port = 587
        smtp_secure = os.environ.get('SMTP_SECURE', 'false').lower() in ['true', '1', 'yes']
        smtp_user = os.environ.get('SMTP_USER', '').strip()
        raw_pwd = os.environ.get('SMTP_PASSWORD', '').strip()

        # Strip surrounding quotes if present in .env
        if (raw_pwd.startswith('"') and raw_pwd.endswith('"')) or (raw_pwd.startswith("'") and raw_pwd.endswith("'")):
            raw_pwd = raw_pwd[1:-1].strip()

        # Google App Passwords are 16 chars, often formatted with 3 spaces: "xxxx xxxx xxxx xxxx"
        clean_pwd = raw_pwd.replace(' ', '') if ('gmail' in smtp_host.lower() and len(raw_pwd.replace(' ', '')) == 16) else raw_pwd
        smtp_from = os.environ.get('SMTP_FROM', smtp_user or 'noreply@skillsense.ai').strip()

        return smtp_host, smtp_port, smtp_secure, smtp_user, clean_pwd, raw_pwd, smtp_from

    def _login_server(self, server, smtp_user, clean_pwd, raw_pwd):
        """Attempt authentication with clean password, falling back to raw password if needed."""
        try:
            server.login(smtp_user, clean_pwd)
        except smtplib.SMTPAuthenticationError:
            if clean_pwd != raw_pwd:
                server.login(smtp_user, raw_pwd)
            else:
                raise

    def send_password_reset_otp(self, recipient_email: str, otp_code: str, expires_in_minutes: int = 10) -> bool:
        """Send password reset OTP email via SMTP."""
        smtp_host, smtp_port, smtp_secure, smtp_user, clean_pwd, raw_pwd, smtp_from = self._get_config()

        subject = "SkillSense — Password Reset Code"

        html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4fbf7; margin: 0; padding: 20px; color: #1c1c1e; }}
        .card {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 36px 28px; border: 1px solid rgba(0, 168, 107, 0.15); box-shadow: 0 4px 20px rgba(0,0,0,0.04); }}
        .brand {{ font-size: 1.5rem; font-weight: 800; color: #00A86B; margin-bottom: 24px; text-align: center; }}
        .otp-box {{ background: #f4fbf7; border: 2px dashed #00A86B; border-radius: 16px; padding: 18px; text-align: center; font-size: 2.2rem; font-weight: 800; letter-spacing: 6px; color: #00A86B; margin: 24px 0; }}
        .footer {{ font-size: 0.8rem; color: #71717a; text-align: center; margin-top: 28px; line-height: 1.5; }}
    </style>
</head>
<body>
    <div class="card">
        <div class="brand">SkillSense</div>
        <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 12px; text-align: center;">Password Reset Request</h2>
        <p style="font-size: 0.95rem; color: #52525b; line-height: 1.6; text-align: center;">
            You requested a password reset for your SkillSense account. Use the code below to verify your identity:
        </p>
        <div class="otp-box">{otp_code}</div>
        <p style="font-size: 0.85rem; color: #71717a; text-align: center;">
            This verification code will expire in <strong>{expires_in_minutes} minutes</strong>.
        </p>
        <div class="footer">
            If you did not request a password reset, you can safely ignore this email.<br>
            SkillSense Career Counseling Platform
        </div>
    </div>
</body>
</html>"""

        text_body = f"SkillSense Password Reset Code: {otp_code}\nThis code expires in {expires_in_minutes} minutes.\nIf you did not request this code, ignore this email."

        if not smtp_user or not clean_pwd:
            print(f"[INFO] [MOCK EMAIL] OTP for {recipient_email}: {otp_code} (Expires in {expires_in_minutes} mins)")
            return True

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = smtp_from
            msg["To"] = recipient_email
            msg.attach(MIMEText(text_body, "plain", "utf-8"))
            msg.attach(MIMEText(html_body, "html", "utf-8"))

            if smtp_secure:
                server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=12)
            else:
                server = smtplib.SMTP(smtp_host, smtp_port, timeout=12)
                server.starttls()

            self._login_server(server, smtp_user, clean_pwd, raw_pwd)
            server.sendmail(smtp_from, [recipient_email], msg.as_string())
            server.quit()
            print(f"[SUCCESS] Sent password reset OTP email to {recipient_email}")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to send SMTP email to {recipient_email}: {e}")
            return False

    def send_invitation_email(self, recipient_email: str, full_name: str,
                              setup_url: str, role: str = 'DEVELOPER',
                              expires_hours: int = 24) -> bool:
        """Send role-tailored account invitation email with a secure one-time setup link."""
        smtp_host, smtp_port, smtp_secure, smtp_user, clean_pwd, raw_pwd, smtp_from = self._get_config()

        is_super = (role == 'SUPER_ADMIN')
        role_label = 'Super Admin' if is_super else 'Developer'
        access_label = 'Super Admin Console' if is_super else 'Developer Console'
        badge_bg = '#faf5ff' if is_super else '#f0fdf4'
        badge_color = '#7c3aed' if is_super else '#00A86B'
        badge_border = '#e9d5ff' if is_super else '#bbf7d0'
        btn_gradient = 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' if is_super else 'linear-gradient(135deg, #00A86B 0%, #00c47d 100%)'
        btn_shadow = 'rgba(124, 58, 237, 0.3)' if is_super else 'rgba(0, 168, 107, 0.3)'

        subject = f"You've been invited to SkillSense as {role_label} — Complete your account setup"

        html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4fbf7; margin: 0; padding: 24px; color: #1c1c1e; }}
        .card {{ max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 40px 32px; border: 1px solid rgba(0, 168, 107, 0.15); box-shadow: 0 10px 30px rgba(0,0,0,0.05); }}
        .brand {{ font-size: 1.6rem; font-weight: 800; color: #00A86B; margin-bottom: 24px; text-align: center; letter-spacing: -0.02em; }}
        .brand span {{ color: #04302E; }}
        .badge {{ display: inline-block; background: {badge_bg}; color: {badge_color}; border: 1px solid {badge_border}; border-radius: 999px; padding: 5px 16px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px; }}
        .title {{ font-size: 1.45rem; font-weight: 800; color: #0f172a; margin-bottom: 12px; line-height: 1.3; }}
        .body-text {{ font-size: 0.95rem; color: #52525b; line-height: 1.7; margin-bottom: 24px; }}
        .info-box {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 22px; margin-bottom: 28px; }}
        .info-row {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.92rem; }}
        .info-row:last-child {{ margin-bottom: 0; }}
        .info-label {{ color: #71717a; font-weight: 600; }}
        .info-value {{ color: #0f172a; font-weight: 700; }}
        .cta-btn {{ display: block; width: 100%; max-width: 320px; margin: 0 auto 24px; padding: 16px 28px; background: {btn_gradient}; color: #ffffff !important; text-align: center; font-size: 1rem; font-weight: 800; border-radius: 14px; text-decoration: none; letter-spacing: -0.01em; box-shadow: 0 4px 14px {btn_shadow}; }}
        .expiry-note {{ font-size: 0.84rem; color: #71717a; text-align: center; margin-bottom: 24px; line-height: 1.5; }}
        .divider {{ border: none; border-top: 1px solid #f1f5f9; margin: 24px 0; }}
        .footer {{ font-size: 0.8rem; color: #94a3b8; text-align: center; line-height: 1.6; }}
        .url-fallback {{ word-break: break-all; font-size: 0.78rem; color: #94a3b8; text-align: center; margin-top: 12px; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; }}
    </style>
</head>
<body>
    <div class="card">
        <div class="brand">SkillSense<span>.</span></div>
        <div style="text-align:center">
            <span class="badge">{role_label} Invitation</span>
        </div>
        <div class="title">Welcome, {full_name}!</div>
        <p class="body-text">
            You have been invited to join the SkillSense administration team as a <strong>{role_label}</strong>.
            Please click the button below to set up your password and access your dashboard.
        </p>
        <div class="info-box">
            <div class="info-row">
                <span class="info-label">Email Address</span>
                <span class="info-value">{recipient_email}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Assigned Role</span>
                <span class="info-value">{role_label}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Access Level</span>
                <span class="info-value">{access_label}</span>
            </div>
        </div>
        <a href="{setup_url}" class="cta-btn">Set Up Account & Password &rarr;</a>
        <p class="expiry-note">
            This invitation link is one-time use and expires in <strong>{expires_hours} hours</strong>.<br>
            If you did not expect this invitation, you can safely ignore this email.
        </p>
        <hr class="divider">
        <div class="footer">
            SkillSense Career Counseling Platform<br>
            If the button above does not work, copy and paste this link into your browser:
            <div class="url-fallback">{setup_url}</div>
        </div>
    </div>
</body>
</html>"""

        text_body = (
            f"SkillSense Account Invitation\n\n"
            f"Hello {full_name},\n\n"
            f"You have been invited to join SkillSense as a {role_label}.\n"
            f"Login Email: {recipient_email}\n"
            f"Assigned Role: {role_label}\n"
            f"Access: {access_label}\n\n"
            f"Complete your account setup by opening this link:\n{setup_url}\n\n"
            f"This link expires in {expires_hours} hours and can only be used once.\n\n"
            f"SkillSense Career Counseling Platform"
        )

        if not smtp_user or not clean_pwd:
            print(f"[INFO] [MOCK EMAIL] Invitation for {recipient_email} ({role_label}): {setup_url}")
            return True

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = smtp_from
            msg["To"] = recipient_email
            msg.attach(MIMEText(text_body, "plain", "utf-8"))
            msg.attach(MIMEText(html_body, "html", "utf-8"))

            if smtp_secure:
                server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=12)
            else:
                server = smtplib.SMTP(smtp_host, smtp_port, timeout=12)
                server.starttls()

            self._login_server(server, smtp_user, clean_pwd, raw_pwd)
            server.sendmail(smtp_from, [recipient_email], msg.as_string())
            server.quit()
            print(f"[SUCCESS] Sent {role_label} invitation email to {recipient_email}")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to send invitation email to {recipient_email}: {e}")
            return False

    def send_developer_invitation(self, recipient_email: str, full_name: str,
                                   setup_url: str, expires_hours: int = 24) -> bool:
        """Backward-compatible wrapper for send_invitation_email."""
        return self.send_invitation_email(
            recipient_email=recipient_email,
            full_name=full_name,
            setup_url=setup_url,
            role='DEVELOPER',
            expires_hours=expires_hours
        )

    def send_contact_email(self, name: str, email: str, message: str,
                           phone: str = '', subject_line: str = '',
                           recipient_email: str = None) -> bool:
        """Send contact form submission to support/admin via SMTP."""
        smtp_host, smtp_port, smtp_secure, smtp_user, clean_pwd, raw_pwd, smtp_from = self._get_config()

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
        target_email = (
            recipient_email
            or os.environ.get('CONTACT_RECEIVER_EMAIL')
            or os.environ.get('SUPPORT_EMAIL')
            or smtp_from
            or smtp_user
        )

        subject = f"[SkillSense Contact] New message from {name}"
        if subject_line and subject_line.strip():
            subject = f"[SkillSense Contact] {subject_line.strip()} — from {name}"

        safe_name = html.escape(name or '')
        safe_email = html.escape(email or '')
        safe_phone = html.escape(phone or 'N/A')
        safe_subject = html.escape(subject_line or 'N/A')
        safe_message = html.escape(message or '').replace('\n', '<br>')

        phone_row = f'<div class="info-row"><span class="info-label">Phone:</span><span class="info-value">{safe_phone}</span></div>' if phone else ''
        subject_row = f'<div class="info-row"><span class="info-label">Subject:</span><span class="info-value">{safe_subject}</span></div>' if subject_line else ''

        html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4fbf7; margin: 0; padding: 24px; color: #1c1c1e; }}
        .card {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 36px 30px; border: 1px solid rgba(0, 168, 107, 0.15); box-shadow: 0 10px 30px rgba(0,0,0,0.05); }}
        .brand {{ font-size: 1.5rem; font-weight: 800; color: #09A3A3; margin-bottom: 20px; text-align: center; letter-spacing: -0.02em; }}
        .brand span {{ color: #04302E; }}
        .badge {{ display: inline-block; background: #f0fdf4; color: #078686; border: 1px solid #bbf7d0; border-radius: 999px; padding: 5px 16px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }}
        .title {{ font-size: 1.35rem; font-weight: 800; color: #0f172a; margin-bottom: 16px; line-height: 1.3; }}
        .info-box {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 22px; margin-bottom: 24px; }}
        .info-row {{ display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; font-size: 0.92rem; }}
        .info-row:last-child {{ margin-bottom: 0; }}
        .info-label {{ color: #71717a; font-weight: 600; min-width: 90px; }}
        .info-value {{ color: #0f172a; font-weight: 700; word-break: break-all; text-align: right; }}
        .message-box {{ background: #ffffff; border: 1px solid #cbd5e1; border-left: 4px solid #09A3A3; border-radius: 12px; padding: 18px 20px; font-size: 0.95rem; color: #1e293b; line-height: 1.6; margin-bottom: 24px; white-space: pre-wrap; }}
        .footer {{ font-size: 0.8rem; color: #94a3b8; text-align: center; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 18px; }}
    </style>
</head>
<body>
    <div class="card">
        <div class="brand">SkillSense<span>.</span></div>
        <div style="text-align:center">
            <span class="badge">Contact Form Submission</span>
        </div>
        <div class="title">New Message from {safe_name}</div>
        <div class="info-box">
            <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value">{safe_name}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value"><a href="mailto:{safe_email}" style="color:#078686; text-decoration:none;">{safe_email}</a></span>
            </div>
            {phone_row}
            {subject_row}
            <div class="info-row">
                <span class="info-label">Submitted At:</span>
                <span class="info-value">{timestamp}</span>
            </div>
        </div>
        <div style="font-size:0.85rem; font-weight:700; color:#475569; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.04em;">Message:</div>
        <div class="message-box">{safe_message}</div>
        <div class="footer">
            This message was submitted through the SkillSense Contact Form.<br>
            You can reply directly to this email to contact {safe_name}.
        </div>
    </div>
</body>
</html>"""

        phone_text = f"Phone:\n{phone}\n\n" if phone else ""
        subject_text = f"Subject:\n{subject_line}\n\n" if subject_line else ""

        text_body = (
            "New Contact Form Submission\n"
            "--------------------------------\n\n"
            f"Name:\n{name}\n\n"
            f"Email:\n{email}\n\n"
            f"{phone_text}"
            f"{subject_text}"
            f"Message:\n{message}\n\n"
            f"Submitted At:\n{timestamp}\n\n"
            "--------------------------------\n"
            "This message was submitted through the SkillSense Contact Form."
        )

        if not smtp_user or not clean_pwd:
            print(f"[INFO] [MOCK EMAIL] Contact form from {name} <{email}> to {target_email}:\n{text_body}")
            return True

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = smtp_from
            msg["To"] = target_email
            msg["Reply-To"] = email
            msg.attach(MIMEText(text_body, "plain", "utf-8"))
            msg.attach(MIMEText(html_body, "html", "utf-8"))

            if smtp_secure:
                server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=12)
            else:
                server = smtplib.SMTP(smtp_host, smtp_port, timeout=12)
                server.starttls()

            self._login_server(server, smtp_user, clean_pwd, raw_pwd)
            server.sendmail(smtp_from, [target_email], msg.as_string())
            server.quit()
            print(f"[SUCCESS] Sent contact form email from {email} to {target_email}")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to send contact form email: {e}")
            return False


email_service = EmailService()
