#!/usr/bin/env python3
"""
MOVAni Transactional Email Service
Handles secure verification emails, password resets, and one-time passcodes (OTP).
Supports standard SMTP (Gmail App Passwords, SendGrid, Mailgun, Amazon SES)
with development mode logging when SMTP credentials are not configured in environment.
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "MOVAni Security <noreply@movani.io>")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")

APP_BASE_URL = os.getenv("APP_BASE_URL", "http://127.0.0.1:5000").rstrip("/")


def is_smtp_configured() -> bool:
    """Check if SMTP credentials are provided in the environment."""
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD)


def send_verification_email(to_email: str, user_name: str, token: str, otp: str) -> Dict[str, Any]:
    """
    Send an email verification message containing a single-use verification link and 6-digit OTP.
    """
    verify_url = f"{APP_BASE_URL}/api/auth/verify?token={token}"
    subject = "Verify your MOVAni Account"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0e14; color: #e2e8f0; margin: 0; padding: 24px; }}
        .card {{ max-width: 540px; margin: 0 auto; background: #121721; border: 1px solid #1e293b; border-radius: 16px; padding: 36px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }}
        .logo {{ font-size: 24px; font-weight: 800; color: #14b8a6; letter-spacing: -0.5px; margin-bottom: 24px; display: flex; align-items: center; gap: 8px; }}
        .title {{ font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }}
        .text {{ font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }}
        .btn {{ display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: #ffffff; font-weight: 600; font-size: 14px; padding: 14px 28px; text-decoration: none; border-radius: 10px; margin-bottom: 24px; box-shadow: 0 4px 14px rgba(20, 184, 166, 0.4); }}
        .otp-box {{ background: #1a2233; border: 1px dashed #334155; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px; }}
        .otp-code {{ font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #38bdf8; font-family: monospace; }}
        .footer {{ font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 16px; margin-top: 24px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">MOVAni</div>
        <div class="title">Welcome to MOVAni, {user_name}!</div>
        <p class="text">Thank you for creating your MOVAni account. To activate your full access to 4K streams, regional audio, and custom watchlists, please verify your email address.</p>
        <div style="text-align: center;">
          <a href="{verify_url}" class="btn">Verify Email Address</a>
        </div>
        <div class="otp-box">
          <div style="font-size: 12px; color: #94a3b8; margin-bottom: 6px;">Or enter this 6-digit verification code:</div>
          <div class="otp-code">{otp}</div>
        </div>
        <p class="text" style="font-size: 12px;">This verification link will expire in 24 hours. If you did not sign up for MOVAni, you can safely ignore this email.</p>
        <div class="footer">
          &copy; 2026 MOVAni Global Streaming Inc. Security & Verification Center.
        </div>
      </div>
    </body>
    </html>
    """

    if is_smtp_configured():
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = SMTP_FROM
            msg["To"] = to_email
            msg.attach(MIMEText(f"Verify your MOVAni account using code: {otp} or link: {verify_url}", "plain"))
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
                if SMTP_USE_TLS:
                    server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)

            return {
                "sent": True,
                "mode": "smtp",
                "message": f"Verification email sent to {to_email}"
            }
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send verification email via SMTP: {e}")
            return {
                "sent": False,
                "mode": "smtp_error",
                "error": str(e),
                "token": token,
                "otp": otp
            }
    else:
        # Development / Local mode logging
        print(f"[EMAIL DEV MODE] To: {to_email} | OTP: {otp} | Verification Token: {token}")
        return {
            "sent": True,
            "mode": "dev_console",
            "message": f"Development mode: verification email logged to server console for {to_email}",
            "dev_otp": otp,
            "dev_token": token
        }


def send_password_reset_email(to_email: str, user_name: str, token: str, otp: str) -> Dict[str, Any]:
    """
    Send a secure password reset email containing a reset link and 6-digit OTP.
    """
    reset_url = f"{APP_BASE_URL}/login?action=reset&token={token}"
    subject = "Reset your MOVAni Password"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0e14; color: #e2e8f0; margin: 0; padding: 24px; }}
        .card {{ max-width: 540px; margin: 0 auto; background: #121721; border: 1px solid #1e293b; border-radius: 16px; padding: 36px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }}
        .logo {{ font-size: 24px; font-weight: 800; color: #14b8a6; letter-spacing: -0.5px; margin-bottom: 24px; }}
        .title {{ font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }}
        .text {{ font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }}
        .btn {{ display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: #ffffff; font-weight: 600; font-size: 14px; padding: 14px 28px; text-decoration: none; border-radius: 10px; margin-bottom: 24px; }}
        .otp-box {{ background: #1a2233; border: 1px dashed #334155; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px; }}
        .otp-code {{ font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #f43f5e; font-family: monospace; }}
        .footer {{ font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 16px; margin-top: 24px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">MOVAni</div>
        <div class="title">Password Reset Request</div>
        <p class="text">Hello {user_name}, we received a request to reset your MOVAni password. Click the button below to choose a new password or enter the 6-digit code on the reset page.</p>
        <div style="text-align: center;">
          <a href="{reset_url}" class="btn">Reset Password</a>
        </div>
        <div class="otp-box">
          <div style="font-size: 12px; color: #94a3b8; margin-bottom: 6px;">Reset Code:</div>
          <div class="otp-code">{otp}</div>
        </div>
        <p class="text" style="font-size: 12px;">This request expires in 1 hour. If you did not request a password reset, please secure your account immediately.</p>
        <div class="footer">
          &copy; 2026 MOVAni Global Streaming Inc. Security Center.
        </div>
      </div>
    </body>
    </html>
    """

    if is_smtp_configured():
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = SMTP_FROM
            msg["To"] = to_email
            msg.attach(MIMEText(f"Reset your MOVAni password using code: {otp} or link: {reset_url}", "plain"))
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
                if SMTP_USE_TLS:
                    server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)

            return {"sent": True, "mode": "smtp", "message": f"Password reset email sent to {to_email}"}
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send password reset email: {e}")
            return {"sent": False, "mode": "smtp_error", "error": str(e), "token": token, "otp": otp}
    else:
        print(f"[EMAIL DEV MODE RESET] To: {to_email} | Reset OTP: {otp} | Token: {token}")
        return {
            "sent": True,
            "mode": "dev_console",
            "message": f"Development mode: password reset logged for {to_email}",
            "dev_otp": otp,
            "dev_token": token
        }
