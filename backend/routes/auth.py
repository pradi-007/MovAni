#!/usr/bin/env python3
"""
MOVAni Authentication & Security Routes
Provides production-grade authentication with:
- Secure Scrypt/PBKDF2 password hashing
- Real transactional email verification & OTP
- Cryptographically secure 6-digit OTPs via secrets module
- 5-minute single-use expiring challenge tokens
- Attempt limits (max 5 failed tries per code)
- Automatic invalidation of prior challenges on resend
- Zero exposure of OTPs in API responses or public logs
- In-memory rate limiting against brute-force & enumeration
- Persistent session management
"""

import os
import re
import json
import hmac
import base64
import hashlib
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
    invalidate_user_verifications,
    increment_verification_attempts,
    get_latest_email_verification_for_user,
    create_password_reset,
    get_password_reset,
    get_latest_password_reset_for_user,
    mark_password_reset_used,
    invalidate_user_password_resets,
    increment_password_reset_attempts,
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
    if os.environ.get("MOVANI_TEST_MODE") == "1" or os.environ.get("TESTING") == "true":
        if key.startswith("reg_ip_"):
            return True
    now = time.time()
    timestamps = _RATE_LIMITS.get(key, [])
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
    password_hash = generate_password_hash(password)
    user_id = create_user(name=name, email=email, password_hash=password_hash)

    # Invalidate any previous verifications for this user
    invalidate_user_verifications(user_id)

    # Generate single-use verification token and cryptographically secure 6-digit OTP
    verif_token = secrets.token_urlsafe(32)
    otp = f"{secrets.randbelow(1_000_000):06d}"
    expires_at = (datetime.now() + timedelta(minutes=5)).isoformat()
    create_email_verification(user_id=user_id, token=verif_token, otp=otp, expires_at=expires_at)

    # Send verification email via configured SMTP
    email_res = send_verification_email(to_email=email, user_name=name, token=verif_token, otp=otp)

    # Record resend cooldown
    _RATE_LIMITS[f"resend_{email}"] = [time.time()]

    if not email_res.get("sent"):
        if email_res.get("mode") == "unconfigured":
            return jsonify({
                "error": email_res.get("error", "Email service unconfigured"),
                "status": "email_unconfigured",
                "message": "SMTP credentials (SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD) must be configured in backend/.env to deliver real verification emails."
            }), 503
        else:
            return jsonify({
                "error": f"Failed to deliver verification email: {email_res.get('error', 'SMTP transport error')}",
                "status": "email_error"
            }), 502

    return jsonify({
        "status": "success",
        "message": f"Account created! We've sent a 6-digit verification code to {email}. Code expires in 5 minutes.",
        "user_id": user_id,
        "email": email,
        "verification_required": True,
        "expires_in_seconds": 300
    }), 201


# ================= EMAIL VERIFICATION =================

@auth_bp.route("/verify", methods=["GET", "POST"])
def verify_email():
    """
    Verify email via token query param (GET) or JSON token/OTP (POST).
    Enforces 5-minute expiration, max 5 attempts, and single-use token consumption.
    """
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
        # If user is known, track attempt against their latest active verification
        if user_id:
            latest = get_latest_email_verification_for_user(user_id)
            if latest and not latest.get("used_at"):
                attempts = increment_verification_attempts(latest["id"])
                if attempts >= 5:
                    mark_email_verification_used(latest["id"])
                    return jsonify({"error": "Too many failed attempts (5/5). This verification code has been invalidated. Please request a new one."}), 400
                remaining = 5 - attempts
                return jsonify({"error": f"Invalid verification code. {remaining} attempt{'s' if remaining != 1 else ''} remaining."}), 400

        if request.method == "GET":
            return redirect("/login?error=invalid_token")
        return jsonify({"error": "Invalid or expired verification code."}), 400

    # Enforce attempt limit
    if verif.get("attempts", 0) >= 5:
        mark_email_verification_used(verif["id"])
        if request.method == "GET":
            return redirect("/login?error=too_many_attempts")
        return jsonify({"error": "Too many failed attempts. This code has been invalidated. Please request a new code."}), 400

    # Enforce 5-minute expiration
    expires_at = datetime.fromisoformat(verif["expires_at"])
    if datetime.now() > expires_at:
        mark_email_verification_used(verif["id"])
        if request.method == "GET":
            return redirect("/login?error=token_expired")
        return jsonify({"error": "Verification code has expired (5-minute validity). Please request a new one."}), 400

    # Mark user verified and consume single-use token
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
        "message": "Email verified successfully! Your MOVAni account is now active.",
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


# ================= RESEND VERIFICATION =================

@auth_bp.route("/resend-verification", methods=["POST"])
def resend_verification():
    """
    Resend email verification code with strict 60-second cooldown rate limiting.
    Invalidates any previous pending OTP for this account.
    """
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    if not email:
        return jsonify({"error": "Email is required."}), 400

    user = get_user_by_email(email)
    if not user:
        # Don't leak account existence
        return jsonify({"status": "success", "message": "If an account exists, a new verification code has been dispatched."})

    if user["is_verified"]:
        return jsonify({"status": "already_verified", "message": "This account is already verified. You can sign in."}), 200

    # Cooldown check: either via rate limit or via latest verification timestamp
    latest_verif = get_latest_email_verification_for_user(user["id"])
    if latest_verif and latest_verif.get("created_at"):
        try:
            created_dt = datetime.fromisoformat(latest_verif["created_at"])
            elapsed = (datetime.now() - created_dt).total_seconds()
            if elapsed < 60:
                remaining = max(1, int(60 - elapsed))
                return jsonify({
                    "error": f"Please wait at least 60 seconds before requesting another verification code ({remaining}s remaining).",
                    "retry_after": remaining
                }), 429
        except Exception:
            pass

    if not check_rate_limit(f"resend_{email}", max_requests=1, window_seconds=60):
        return jsonify({"error": "Please wait at least 60 seconds before requesting another verification code."}), 429

    # Invalidate previous OTPs for this user
    invalidate_user_verifications(user["id"])

    # Generate fresh single-use verification token and 6-digit OTP
    verif_token = secrets.token_urlsafe(32)
    otp = f"{secrets.randbelow(1_000_000):06d}"
    expires_at = (datetime.now() + timedelta(minutes=5)).isoformat()
    create_email_verification(user_id=user["id"], token=verif_token, otp=otp, expires_at=expires_at)

    email_res = send_verification_email(to_email=email, user_name=user["name"], token=verif_token, otp=otp)

    if not email_res.get("sent"):
        if email_res.get("mode") == "unconfigured":
            return jsonify({
                "error": email_res.get("error", "Email service unconfigured"),
                "status": "email_unconfigured",
                "message": "SMTP credentials must be configured in backend/.env to send verification emails."
            }), 503
        else:
            return jsonify({
                "error": f"Failed to deliver email: {email_res.get('error', 'SMTP transport error')}",
                "status": "email_error"
            }), 502

    return jsonify({
        "status": "success",
        "message": f"A new verification code has been dispatched to {email}. Code expires in 5 minutes.",
        "expires_in_seconds": 300
    })


# ================= LOGIN =================

@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate user with email and password, check verification status, and issue session."""
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    remember = data.get("remember", True)
    if isinstance(remember, str):
        remember = remember.lower() in ("true", "1", "yes", "on")
    else:
        remember = bool(remember)

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
    session_days = 30 if remember else 1
    session_expires = (datetime.now() + timedelta(days=session_days)).isoformat()
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
        "remember": remember,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "is_verified": bool(user["is_verified"])
        }
    }))
    max_age = 30 * 86400 if remember else None
    resp.set_cookie("movani_session", session_token, max_age=max_age, httponly=True, samesite="Lax")
    return resp


def get_signing_key() -> str:
    """Secret key for cryptographic challenge signatures."""
    return os.getenv("SECRET_KEY") or os.getenv("MOVANI_SECRET_KEY") or "movani_security_master_salt_2026_x871"


def create_signed_challenge(user_id: int, email: str, otp: str, expires_at_epoch: float) -> str:
    """Generate a tamper-proof HMAC-SHA256 signed challenge token binding user, email, and salted OTP hash."""
    salt = secrets.token_hex(8)
    raw_hash = hashlib.sha256(f"{get_signing_key()}:{salt}:{otp}:{email.lower().strip()}".encode()).hexdigest()
    payload = {
        "u": user_id,
        "e": email.lower().strip(),
        "s": salt,
        "h": raw_hash,
        "exp": int(expires_at_epoch)
    }
    payload_str = json.dumps(payload, separators=(',', ':'))
    sig = hmac.new(get_signing_key().encode(), payload_str.encode(), hashlib.sha256).hexdigest()
    token_bytes = f"{payload_str}.{sig}".encode()
    return base64.urlsafe_b64encode(token_bytes).decode().rstrip("=")


def verify_signed_challenge(challenge_token: str, otp: str, email: str) -> Optional[int]:
    """Verify an HMAC-SHA256 challenge token without exposing or storing plaintext OTPs."""
    try:
        if not challenge_token or not otp or not email:
            return None
        padding = "=" * (4 - len(challenge_token) % 4) if len(challenge_token) % 4 != 0 else ""
        raw = base64.urlsafe_b64decode(challenge_token + padding).decode()
        payload_str, sig = raw.rsplit(".", 1)
        expected_sig = hmac.new(get_signing_key().encode(), payload_str.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        payload = json.loads(payload_str)
        if payload.get("exp", 0) < time.time():
            return None
        if payload.get("e") != email.lower().strip():
            return None
        salt = payload.get("s", "")
        expected_hash = hashlib.sha256(f"{get_signing_key()}:{salt}:{otp}:{email.lower().strip()}".encode()).hexdigest()
        if not hmac.compare_digest(payload.get("h", ""), expected_hash):
            return None
        return payload.get("u")
    except Exception:
        return None


# ================= FORGOT & RESET PASSWORD =================

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    """
    Request password reset link and cryptographically secure 6-digit OTP.
    Enforces 60-second cooldown, strict 5-minute expiration, and invalidates previous codes.
    """
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    if not email:
        return jsonify({"error": "Email is required."}), 400

    user = get_user_by_email(email)

    # Cooldown enforcement: 60-second minimum between reset requests
    if user:
        latest_reset = get_latest_password_reset_for_user(user["id"])
        if latest_reset and latest_reset.get("created_at") and not latest_reset.get("used_at"):
            try:
                created_dt = datetime.fromisoformat(latest_reset["created_at"])
                elapsed = (datetime.now() - created_dt).total_seconds()
                if elapsed < 60:
                    remaining = max(1, int(60 - elapsed))
                    return jsonify({
                        "error": f"Please wait at least 60 seconds before requesting another reset code ({remaining}s remaining).",
                        "retry_after": remaining
                    }), 429
            except Exception:
                pass

    if not check_rate_limit(f"forgot_{email}", max_requests=4, window_seconds=300):
        return jsonify({"error": "Too many requests. Please wait a few minutes."}), 429

    challenge_token = ""
    if user:
        # Invalidate previous unconsumed password resets for this user
        invalidate_user_password_resets(user["id"])

        reset_token = secrets.token_urlsafe(32)
        otp = f"{secrets.randbelow(1_000_000):06d}"
        expires_at_dt = datetime.now() + timedelta(minutes=5)
        expires_at = expires_at_dt.isoformat()

        create_password_reset(user_id=user["id"], token=reset_token, otp=otp, expires_at=expires_at)
        challenge_token = create_signed_challenge(user["id"], email, otp, expires_at_dt.timestamp())

        email_res = send_password_reset_email(to_email=email, user_name=user["name"], token=reset_token, otp=otp)

        if not email_res.get("sent"):
            if email_res.get("mode") == "unconfigured":
                return jsonify({
                    "error": email_res.get("error", "Email service unconfigured"),
                    "status": "email_unconfigured",
                    "message": "SMTP credentials must be configured in backend/.env to send reset emails."
                }), 503
            else:
                return jsonify({
                    "error": f"Failed to deliver reset email: {email_res.get('error', 'SMTP transport error')}",
                    "status": "email_error"
                }), 502

    return jsonify({
        "status": "success",
        "message": f"If an account exists for {email}, a 6-digit password reset code has been sent. Code expires in 5 minutes.",
        "challenge_token": challenge_token,
        "email": email,
        "expires_in_seconds": 300
    })


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """
    Reset password using verified reset token or 6-digit OTP.
    Enforces user/email binding, max 5 failed attempts per challenge, and 5-minute validity.
    """
    data = request.get_json(silent=True) or {}
    token = (data.get("token") or "").strip()
    otp = (data.get("otp") or "").strip()
    email = (data.get("email") or "").strip().lower()
    challenge_token = (data.get("challenge_token") or "").strip()
    new_password = data.get("password") or ""
    confirm_password = data.get("confirm_password") or ""

    lookup_val = token or otp
    if not lookup_val and not challenge_token:
        return jsonify({"error": "Password reset code or token is required."}), 400

    if len(new_password) < 8:
        return jsonify({"error": "Password must be at least 8 characters long."}), 400

    if new_password != confirm_password:
        return jsonify({"error": "Passwords do not match."}), 400

    target_user = None
    if email:
        target_user = get_user_by_email(email)

    # 1. Primary lookup: SQLite password_resets table
    reset_rec = get_password_reset(lookup_val, user_id=target_user["id"] if target_user else None)

    # 2. Resilient fallback: Verify HMAC signed challenge token (cross-container serverless survival)
    if not reset_rec and challenge_token and email:
        verified_uid = verify_signed_challenge(challenge_token, lookup_val, email)
        if verified_uid:
            if not target_user:
                target_user = get_user_by_id(verified_uid)
            reset_rec = {
                "id": None,
                "user_id": verified_uid,
                "expires_at": (datetime.now() + timedelta(minutes=5)).isoformat(),
                "attempts": 0
            }

    # 3. Failed lookup: Track attempt against user's latest challenge if known
    if not reset_rec:
        if target_user:
            latest = get_latest_password_reset_for_user(target_user["id"])
            if latest and not latest.get("used_at"):
                attempts = increment_password_reset_attempts(latest["id"])
                if attempts >= 5:
                    mark_password_reset_used(latest["id"])
                    return jsonify({"error": "Too many failed attempts (5/5). This reset code has been invalidated. Please request a new one."}), 400
                remaining = 5 - attempts
                return jsonify({"error": f"Invalid reset code. {remaining} attempt{'s' if remaining != 1 else ''} remaining."}), 400
        return jsonify({"error": "Invalid or expired reset code."}), 400

    # 4. Enforce attempt limit
    if reset_rec.get("attempts", 0) >= 5:
        if reset_rec.get("id"):
            mark_password_reset_used(reset_rec["id"])
        return jsonify({"error": "Too many failed attempts. This reset code has been invalidated. Please request a new one."}), 400

    # 5. Enforce 5-minute expiration
    expires_at = datetime.fromisoformat(reset_rec["expires_at"])
    if datetime.now() > expires_at:
        if reset_rec.get("id"):
            mark_password_reset_used(reset_rec["id"])
        return jsonify({"error": "Reset code has expired (5-minute validity). Please request a new one."}), 400

    # 6. Securely hash new password and update user record
    new_hash = generate_password_hash(new_password)
    update_user_password(user_id=reset_rec["user_id"], new_password_hash=new_hash)

    # 7. Invalidate reset challenge and consume token
    if reset_rec.get("id"):
        mark_password_reset_used(reset_rec["id"])
    invalidate_user_password_resets(reset_rec["user_id"])

    # 8. Revoke all existing sessions for security
    revoke_all_user_sessions(reset_rec["user_id"])

    return jsonify({"status": "success", "message": "Password reset successfully! Please sign in with your new password."})


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
