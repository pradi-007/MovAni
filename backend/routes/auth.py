#!/usr/bin/env python3
"""
MOVAni Authentication & Security Routes
Provides production-grade authentication with:
- Werkzeug PBKDF2/Scrypt password hashing
- Real transactional email verification & OTP
- Single-use expiring tokens
- In-memory rate limiting against brute-force & enumeration
- Persistent session management
"""

import re
import secrets
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from flask import Blueprint, jsonify, request, redirect, make_response
from werkzeug.security import generate_password_hash, check_password_hash
from backend.database import (
    create_user,
    get_user_by_email,
    get_user_by_id,
    set_user_verified,
    update_user_password,
    create_email_verification,
    get_email_verification,
    mark_email_verification_used,
    create_password_reset,
    get_password_reset,
    mark_password_reset_used,
    create_session,
    get_session,
    revoke_session,
    revoke_all_user_sessions
)
from backend.email_service import send_verification_email, send_password_reset_email

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

# Rate limiting store: key -> list of timestamps
_RATE_LIMITS: Dict[str, list] = {}


def check_rate_limit(key: str, max_requests: int = 5, window_seconds: int = 300) -> bool:
    """Returns True if within rate limit, False if exceeded."""
    now = time.time()
    timestamps = _RATE_LIMITS.get(key, [])
    # Filter timestamps within window
    timestamps = [t for t in timestamps if now - t < window_seconds]
    if len(timestamps) >= max_requests:
        _RATE_LIMITS[key] = timestamps
        return False
    timestamps.append(now)
    _RATE_LIMITS[key] = timestamps
    return True


def get_request_token() -> Optional[str]:
    """Extract session token from Authorization header or cookie."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:].strip()
    return request.cookies.get("movani_session")


# ================= REGISTER =================

@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user account with secure password hashing and verification email."""
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    confirm = data.get("confirm_password") or ""

    ip = request.remote_addr or "127.0.0.1"
    if not check_rate_limit(f"reg_ip_{ip}", max_requests=10, window_seconds=600):
        return jsonify({"error": "Too many registration attempts. Please try again later."}), 429

    # Validation
    if not name:
        return jsonify({"error": "Full name is required."}), 400
    if not email or not EMAIL_REGEX.match(email):
        return jsonify({"error": "Please enter a valid email address."}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters long."}), 400
    if password != confirm:
        return jsonify({"error": "Passwords do not match."}), 400

    # Check if user already exists
    existing = get_user_by_email(email)
    if existing:
        return jsonify({"error": "An account with this email address already exists."}), 409

    # Hash password securely
    password_hash = generate_password_hash(password, method="scrypt" if hasattr(secrets, "scrypt") else "pbkdf2:sha256:100000")
    user_id = create_user(name=name, email=email, password_hash=password_hash)

    # Generate single-use verification token and 6-digit OTP
    verif_token = secrets.token_urlsafe(32)
    otp = f"{secrets.randbelow(900000) + 100000}"
    expires_at = (datetime.now() + timedelta(hours=24)).isoformat()
    create_email_verification(user_id=user_id, token=verif_token, otp=otp, expires_at=expires_at)

    # Send verification email
    email_res = send_verification_email(to_email=email, user_name=name, token=verif_token, otp=otp)

    response_data = {
        "status": "success",
        "message": "Account created successfully! Please verify your email to activate your account.",
        "user_id": user_id,
        "email": email,
        "verification_required": True
    }
    if email_res.get("dev_otp"):
        response_data["dev_otp"] = email_res["dev_otp"]
        response_data["dev_token"] = email_res["dev_token"]

    return jsonify(response_data), 201


# ================= EMAIL VERIFICATION =================

@auth_bp.route("/verify", methods=["GET", "POST"])
def verify_email():
    """Verify email via token query param (GET) or JSON token/OTP (POST)."""
    token = ""
    otp = ""
    email = ""

    if request.method == "GET":
        token = request.args.get("token", "").strip()
    else:
        data = request.get_json(silent=True) or {}
        token = (data.get("token") or "").strip()
        otp = (data.get("otp") or "").strip()
        email = (data.get("email") or "").strip().lower()

    lookup_val = token or otp
    if not lookup_val:
        return jsonify({"error": "Verification token or code is required."}), 400

    user_id = None
    if email:
        user_obj = get_user_by_email(email)
        if user_obj:
            user_id = user_obj["id"]

    verif = get_email_verification(lookup_val, user_id=user_id)
    if not verif:
        if request.method == "GET":
            return redirect("/login?error=invalid_token")
        return jsonify({"error": "Invalid or expired verification token."}), 400

    # Check expiration
    expires_at = datetime.fromisoformat(verif["expires_at"])
    if datetime.now() > expires_at:
        if request.method == "GET":
            return redirect("/login?error=token_expired")
        return jsonify({"error": "Verification token has expired. Please request a new one."}), 400

    # Mark user verified
    set_user_verified(verif["user_id"])
    mark_email_verification_used(verif["id"])

    # Create authenticated session
    session_token = secrets.token_urlsafe(32)
    session_expires = (datetime.now() + timedelta(days=30)).isoformat()
    create_session(
        user_id=verif["user_id"],
        session_token=session_token,
        expires_at=session_expires,
        ip_address=request.remote_addr or "",
        user_agent=request.headers.get("User-Agent", "")[:250]
    )

    user = get_user_by_id(verif["user_id"])

    if request.method == "GET":
        resp = make_response(redirect("/?verified=1"))
        resp.set_cookie("movani_session", session_token, max_age=30*86400, httponly=True, samesite="Lax")
        return resp

    resp = make_response(jsonify({
        "status": "success",
        "message": "Email verified successfully! You are now logged in.",
        "session_token": session_token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "is_verified": True
        }
    }))
    resp.set_cookie("movani_session", session_token, max_age=30*86400, httponly=True, samesite="Lax")
    return resp


@auth_bp.route("/resend-verification", methods=["POST"])
def resend_verification():
    """Resend email verification token with strict 60-second rate limiting."""
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    if not email:
        return jsonify({"error": "Email is required."}), 400

    if not check_rate_limit(f"resend_{email}", max_requests=1, window_seconds=60):
        return jsonify({"error": "Please wait at least 60 seconds before requesting another verification email."}), 429

    user = get_user_by_email(email)
    if not user:
        # Don't leak account existence
        return jsonify({"status": "success", "message": "If an account exists, a new verification email has been sent."})

    if user["is_verified"]:
        return jsonify({"status": "already_verified", "message": "This account is already verified. You can log in."}), 200

    verif_token = secrets.token_urlsafe(32)
    otp = f"{secrets.randbelow(900000) + 100000}"
    expires_at = (datetime.now() + timedelta(hours=24)).isoformat()
    create_email_verification(user_id=user["id"], token=verif_token, otp=otp, expires_at=expires_at)

    email_res = send_verification_email(to_email=email, user_name=user["name"], token=verif_token, otp=otp)

    res_body = {"status": "success", "message": "Verification code sent to your email."}
    if email_res.get("dev_otp"):
        res_body["dev_otp"] = email_res["dev_otp"]
        res_body["dev_token"] = email_res["dev_token"]

    return jsonify(res_body)


# ================= LOGIN =================

@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate user with email and password, check verification status, and issue session."""
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    ip = request.remote_addr or "127.0.0.1"
    # Brute force protection: max 5 login attempts per 5 minutes per IP/email
    if not check_rate_limit(f"login_{ip}_{email}", max_requests=5, window_seconds=300):
        return jsonify({"error": "Too many failed login attempts. Please try again in 5 minutes."}), 429

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    user = get_user_by_email(email)
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid email address or password."}), 401

    # Check verification status
    if not user["is_verified"]:
        return jsonify({
            "error": "Account email is not verified yet. Please check your inbox or resend verification code.",
            "requires_verification": True,
            "email": email
        }), 403

    # Generate persistent session token
    session_token = secrets.token_urlsafe(32)
    session_expires = (datetime.now() + timedelta(days=30)).isoformat()
    create_session(
        user_id=user["id"],
        session_token=session_token,
        expires_at=session_expires,
        ip_address=ip,
        user_agent=request.headers.get("User-Agent", "")[:250]
    )

    resp = make_response(jsonify({
        "status": "success",
        "message": f"Welcome back, {user['name']}!",
        "session_token": session_token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "is_verified": bool(user["is_verified"])
        }
    }))
    resp.set_cookie("movani_session", session_token, max_age=30*86400, httponly=True, samesite="Lax")
    return resp


# ================= FORGOT & RESET PASSWORD =================

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    """Request password reset link and OTP."""
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    if not email:
        return jsonify({"error": "Email is required."}), 400

    if not check_rate_limit(f"forgot_{email}", max_requests=3, window_seconds=300):
        return jsonify({"error": "Too many requests. Please wait a few minutes."}), 429

    user = get_user_by_email(email)
    if user:
        reset_token = secrets.token_urlsafe(32)
        otp = f"{secrets.randbelow(900000) + 100000}"
        expires_at = (datetime.now() + timedelta(hours=1)).isoformat()
        create_password_reset(user_id=user["id"], token=reset_token, otp=otp, expires_at=expires_at)
        email_res = send_password_reset_email(to_email=email, user_name=user["name"], token=reset_token, otp=otp)
        res_body = {"status": "success", "message": "If that email is registered, password reset instructions have been sent."}
        if email_res.get("dev_otp"):
            res_body["dev_otp"] = email_res["dev_otp"]
            res_body["dev_token"] = email_res["dev_token"]
        return jsonify(res_body)

    return jsonify({"status": "success", "message": "If that email is registered, password reset instructions have been sent."})


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """Reset password using verified reset token or OTP."""
    data = request.get_json(silent=True) or {}
    token = (data.get("token") or "").strip()
    otp = (data.get("otp") or "").strip()
    new_password = data.get("password") or ""
    confirm_password = data.get("confirm_password") or ""

    lookup_val = token or otp
    if not lookup_val:
        return jsonify({"error": "Password reset token or code is required."}), 400

    if len(new_password) < 8:
        return jsonify({"error": "Password must be at least 8 characters long."}), 400

    if new_password != confirm_password:
        return jsonify({"error": "Passwords do not match."}), 400

    reset_rec = get_password_reset(lookup_val)
    if not reset_rec:
        return jsonify({"error": "Invalid or expired reset token."}), 400

    expires_at = datetime.fromisoformat(reset_rec["expires_at"])
    if datetime.now() > expires_at:
        return jsonify({"error": "Reset code has expired. Please request a new one."}), 400

    # Hash new password and update
    new_hash = generate_password_hash(new_password, method="scrypt" if hasattr(secrets, "scrypt") else "pbkdf2:sha256:100000")
    update_user_password(user_id=reset_rec["user_id"], new_password_hash=new_hash)
    mark_password_reset_used(reset_rec["id"])

    # Revoke all existing sessions for security
    revoke_all_user_sessions(reset_rec["user_id"])

    return jsonify({"status": "success", "message": "Password reset successfully! Please log in with your new password."})


# ================= LOGOUT & CURRENT USER =================

@auth_bp.route("/logout", methods=["POST"])
def logout():
    """Revoke active session and clear cookie."""
    token = get_request_token()
    if token:
        revoke_session(token)
    resp = make_response(jsonify({"status": "success", "message": "Logged out successfully."}))
    resp.set_cookie("movani_session", "", expires=0)
    return resp


@auth_bp.route("/me", methods=["GET"])
def get_current_user():
    """Retrieve current authenticated user session."""
    token = get_request_token()
    if not token:
        return jsonify({"authenticated": False}), 401

    session_data = get_session(token)
    if not session_data:
        resp = make_response(jsonify({"authenticated": False}), 401)
        resp.set_cookie("movani_session", "", expires=0)
        return resp

    # Check expiration
    expires_at = datetime.fromisoformat(session_data["expires_at"])
    if datetime.now() > expires_at:
        revoke_session(token)
        resp = make_response(jsonify({"authenticated": False, "error": "Session expired"}), 401)
        resp.set_cookie("movani_session", "", expires=0)
        return resp

    return jsonify({
        "authenticated": True,
        "user": {
            "id": session_data["user_id"],
            "name": session_data["name"],
            "email": session_data["email"],
            "is_verified": bool(session_data["is_verified"])
        }
    })
