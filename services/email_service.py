# services/email_service.py - SMTP Email Provider for Password Reset & System Notifications
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from core.config import config

class EmailService:
    def __init__(self):
        self.smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.environ.get('SMTP_PORT', 587))
        self.smtp_secure = os.environ.get('SMTP_SECURE', 'false').lower() in ['true', '1', 'yes']
        self.smtp_user = os.environ.get('SMTP_USER', '')
        self.smtp_password = os.environ.get('SMTP_PASSWORD', '')
        self.smtp_from = os.environ.get('SMTP_FROM', self.smtp_user or 'noreply@skillsense.ai')

    def send_password_reset_otp(self, recipient_email: str, otp_code: str, expires_in_minutes: int = 10) -> bool:
        """Send password reset OTP email via SMTP."""
        subject = "SkillSense — Password Reset Code"
        
        # HTML Email Template with SkillSense Branding
        html_body = f"""
        <!DOCTYPE html>
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
        </html>
        """

        text_body = f"SkillSense Password Reset Code: {otp_code}\nThis code expires in {expires_in_minutes} minutes.\nIf you did not request this code, ignore this email."

        if not self.smtp_user or not self.smtp_password:
            # Fallback for development logging when SMTP credentials are not configured in local .env
            print(f"[INFO] [MOCK EMAIL] OTP for {recipient_email}: {otp_code} (Expires in {expires_in_minutes} mins)")
            return True

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.smtp_from
            msg["To"] = recipient_email
            msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            if self.smtp_secure:
                server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, timeout=10)
            else:
                server = smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10)
                server.starttls()

            server.login(self.smtp_user, self.smtp_password)
            server.sendmail(self.smtp_from, [recipient_email], msg.as_string())
            server.quit()
            print(f"[SUCCESS] Sent password reset OTP email to {recipient_email}")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to send SMTP email to {recipient_email}: {e}")
            return False

    def send_developer_invitation(self, recipient_email: str, full_name: str,
                                   setup_url: str, expires_hours: int = 24) -> bool:
        """Send developer account invitation email with a secure one-time setup link."""
        subject = "You've been invited to SkillSense — Complete your account setup"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4fbf7; margin: 0; padding: 20px; color: #1c1c1e; }}
                .card {{ max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 40px 32px; border: 1px solid rgba(0, 168, 107, 0.15); box-shadow: 0 4px 20px rgba(0,0,0,0.04); }}
                .brand {{ font-size: 1.5rem; font-weight: 800; color: #00A86B; margin-bottom: 28px; text-align: center; letter-spacing: -0.02em; }}
                .badge {{ display: inline-block; background: #f0fdf4; color: #00A86B; border: 1px solid #bbf7d0; border-radius: 999px; padding: 4px 14px; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px; }}
                .title {{ font-size: 1.4rem; font-weight: 800; color: #0f172a; margin-bottom: 12px; line-height: 1.3; }}
                .body-text {{ font-size: 0.95rem; color: #52525b; line-height: 1.7; margin-bottom: 24px; }}
                .info-box {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px; }}
                .info-row {{ display: flex; gap: 12px; align-items: baseline; margin-bottom: 6px; font-size: 0.9rem; }}
                .info-label {{ color: #71717a; font-weight: 600; min-width: 100px; }}
                .info-value {{ color: #0f172a; font-weight: 700; }}
                .cta-btn {{ display: block; width: 100%; max-width: 300px; margin: 0 auto 24px; padding: 16px 28px; background: linear-gradient(135deg, #00A86B 0%, #00c47d 100%); color: #ffffff !important; text-align: center; font-size: 1rem; font-weight: 800; border-radius: 14px; text-decoration: none; letter-spacing: -0.01em; box-shadow: 0 4px 14px rgba(0, 168, 107, 0.3); }}
                .expiry-note {{ font-size: 0.84rem; color: #71717a; text-align: center; margin-bottom: 28px; }}
                .divider {{ border: none; border-top: 1px solid #f1f5f9; margin: 24px 0; }}
                .footer {{ font-size: 0.8rem; color: #94a3b8; text-align: center; line-height: 1.6; }}
                .url-fallback {{ word-break: break-all; font-size: 0.78rem; color: #94a3b8; text-align: center; margin-top: 12px; }}
            </style>
        </head>
        <body>
            <div class="card">
                <div class="brand">SkillSense</div>
                <div style="text-align:center">
                    <span class="badge">Developer Account</span>
                </div>
                <div class="title">Welcome, {full_name}!</div>
                <p class="body-text">
                    Your SkillSense Developer account has been created by an administrator.
                    Click the button below to complete your account setup by creating a secure password.
                </p>
                <div class="info-box">
                    <div class="info-row">
                        <span class="info-label">Login Email</span>
                        <span class="info-value">{recipient_email}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Role</span>
                        <span class="info-value">Developer</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Access</span>
                        <span class="info-value">Developer Dashboard</span>
                    </div>
                </div>
                <a href="{setup_url}" class="cta-btn">Set Up My Account →</a>
                <p class="expiry-note">
                    This setup link expires in <strong>{expires_hours} hours</strong> and can only be used once.<br>
                    If you did not expect this invitation, you can safely ignore this email.
                </p>
                <hr class="divider">
                <div class="footer">
                    SkillSense Career Counseling Platform<br>
                    If the button above doesn't work, copy and paste this link into your browser:
                </div>
                <div class="url-fallback">{setup_url}</div>
            </div>
        </body>
        </html>
        """

        text_body = (
            f"SkillSense Developer Account Invitation\n\n"
            f"Hello {full_name},\n\n"
            f"Your SkillSense Developer account has been created.\n"
            f"Login Email: {recipient_email}\n\n"
            f"Complete your account setup by visiting this link:\n{setup_url}\n\n"
            f"This link expires in {expires_hours} hours and can only be used once.\n\n"
            f"If you did not expect this invitation, you can safely ignore this email.\n\n"
            f"SkillSense Career Counseling Platform"
        )

        if not self.smtp_user or not self.smtp_password:
            print(f"[INFO] [MOCK EMAIL] Developer invitation for {recipient_email}: {setup_url}")
            return True

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.smtp_from
            msg["To"] = recipient_email
            msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            if self.smtp_secure:
                server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, timeout=10)
            else:
                server = smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10)
                server.starttls()

            server.login(self.smtp_user, self.smtp_password)
            server.sendmail(self.smtp_from, [recipient_email], msg.as_string())
            server.quit()
            print(f"[SUCCESS] Sent developer invitation email to {recipient_email}")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to send invitation email to {recipient_email}: {e}")
            return False

email_service = EmailService()
