# MOVAni Gmail OTP Delivery & Password Reset Root Cause Analysis (OTP_ROOT_CAUSE.md)

## Executive Summary
This document provides the definitive diagnosis and root cause analysis for the password reset and email OTP failures in the **MOVAni** streaming platform (`https://mov-ani.vercel.app/`).

### Reported Symptoms
1. The password-reset code is **not arriving in Gmail**.
2. The reset page displays **"Invalid or expired reset code."**
3. Frontend and backend exhibit inconsistencies across API request formats, database records, and OTP validation logic.

---

## Complete Request Flow Trace & Failure Points

```
[User Action: Forgot Password]
       │
       ▼
1. Submit Email (/api/auth/forgot-password)
       │
       ▼
2. Check User in SQLite (get_user_by_email)
       │
       ├── FAILURE POINT A: Invalidation before delivery confirmation
       │   `invalidate_user_password_resets(user_id)` was called BEFORE verifying SMTP dispatch!
       │   Any prior valid OTP was immediately wiped out, even if SMTP failed!
       │
       ▼
3. Generate 6-Digit Code (secrets.randbelow)
       │
       ▼
4. Send Email via Transactional Service (send_password_reset_email)
       │
       ├── FAILURE POINT B: PRIMARY ROOT CAUSE FOR GMAIL DELIVERY FAILURE
       │   `backend/.env` contained ONLY `TMDB_ACCESS_TOKEN`.
       │   `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, and `SMTP_PASSWORD` were missing.
       │   `is_smtp_configured()` evaluated to `False`.
       │   `send_password_reset_email` returned `mode: "unconfigured"`, HTTP 503.
       │   NO EMAIL WAS EVER TRANSMITTED TO GMAIL.
       │
       ├── FAILURE POINT C: Static Environment Variable Capture
       │   `backend/email_service.py` read `SMTP_HOST` at module import time without calling `load_dotenv()`.
       │   Any dynamic `.env` updates were ignored unless explicitly reloaded.
       │
       ├── FAILURE POINT D: Incompatible Gmail SMTPS (Port 465) Handling
       │   `email_service.py` only initialized `smtplib.SMTP` with `starttls()`.
       │   If configured on Port 465 (Gmail SSL), the connection hangs indefinitely.
       │
       ▼
5. Backend Response to Frontend
       │
       ├── FAILURE POINT E: Frontend Ignored 503 Delivery Failure
       │   `handleForgotPassword` in `frontend/login.html` did not inspect `res.ok` or `res.status`.
       │   Even when receiving HTTP 503 ("Email service unconfigured"), it falsely displayed:
       │   "If registered, a password reset code has been sent to your email."
       │   And immediately transitioned the UI to the Reset Password panel.
       │   User believed an email was on the way when it had actually failed.
       │
       ▼
6. User Enters Code on Reset Page
       │
       ├── FAILURE POINT F: Missing User/Email Binding in Payload
       │   `handleResetPassword` sent `{ otp, password, confirm_password }` WITHOUT `email`!
       │   Backend could not scope the query to the specific user's challenge.
       │
       ▼
7. Validate Reset Code (/api/auth/reset-password)
       │
       ├── FAILURE POINT G: PRIMARY ROOT CAUSE FOR "Invalid or expired reset code"
       │   Because the email was never delivered, the user had to guess or enter an old code.
       │   1. If user entered an old code: it was invalidated in Step 2 (`used_at IS NOT NULL`).
       │   2. If user entered a guessed code: no matching record existed in `password_resets`.
       │   3. In Vercel serverless environments: Container A wrote to `/tmp/movani.db`,
       │      while Container B had an isolated, empty `/tmp/movani.db` instance.
       │   `get_password_reset(lookup_val)` returned `None`.
       │   Backend responded: `{"error": "Invalid or expired reset code."}`, HTTP 400.
```

---

## Evidence & Technical Diagnoses

### 1. Delivery Failure Evidence
- **File:** `backend/.env`
  - Current contents: `TMDB_ACCESS_TOKEN=eyJhbGci...`
  - Missing keys: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `MAIL_FROM`.
- **File:** `backend/email_service.py` (lines 30-33, 220-224)
  ```python
  def is_smtp_configured() -> bool:
      return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD)
  ```
  Returns `False`. Execution entered `else:` branch:
  ```python
  return {
      "sent": False,
      "mode": "unconfigured",
      "error": "Transactional email service is not configured..."
  }
  ```
  Result: `/api/auth/forgot-password` returned HTTP 503.

### 2. Frontend Blindness Evidence
- **File:** `frontend/login.html` (lines 1093-1104)
  ```javascript
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  showStatusBanner("If registered, a password reset code has been sent to your email.", "success");
  State.pendingEmail = email;
  setTimeout(() => switchPanel('reset'), 1000);
  ```
  Notice: No `if (res.ok)` or `if (res.status === 200)` check. Any error was masked as a success.

### 3. "Invalid or Expired Reset Code" Evidence
- When the user arrived at the Reset panel without having received an email:
  Any entered code failed lookup in `password_resets`:
  ```python
  cursor.execute(
      "SELECT * FROM password_resets WHERE (token = ? OR otp = ?) AND used_at IS NULL ORDER BY created_at DESC LIMIT 1",
      (token_or_otp, token_or_otp)
  )
  ```
  Returning `None` triggered lines 438-439 in `backend/routes/auth.py`:
  ```python
  reset_rec = get_password_reset(lookup_val)
  if not reset_rec:
      return jsonify({"error": "Invalid or expired reset code."}), 400
  ```
  Which rendered the exact text: **"Invalid or expired reset code."**

### 4. Vercel Stateless Ephemeral Storage Defect
- On Vercel, `DB_PATH = "/tmp/movani.db"`.
- AWS Lambda / Vercel execution environments are ephemeral and not shared between instances.
- A request to `/api/auth/forgot-password` on instance 1 writes the reset code to instance 1's `/tmp/movani.db`.
- A subsequent request to `/api/auth/reset-password` on instance 2 cannot find the record in instance 2's `/tmp/movani.db`.

---

## Action Plan for Remediation

1. **Email Service Hardening (`backend/email_service.py`):**
   - Dynamically load environment variables and support `.env` reloading.
   - Support both Gmail TLS (Port 587 with `starttls()`) and Gmail SSL (Port 465 with `smtplib.SMTP_SSL`).
   - Automatically normalize Gmail sender identity (`From: MOVAni <user@gmail.com>`).
   - Catch specific Gmail authentication errors (`535 5.7.8`, `534 5.7.9`) and output explicit instructions for Google App Passwords.
2. **OTP Generation & Verification Hardening (`backend/routes/auth.py`, `backend/database.py`):**
   - Enforce strict 5-minute expiration (`timedelta(minutes=5)`).
   - Require and validate `email` in `/api/auth/reset-password` alongside `otp` for precise user scoping.
   - Track failed attempts on reset codes (max 5 tries before challenge invalidation).
   - Only invalidate prior codes AFTER verifying that the current code was successfully dispatched.
   - Dual-layer challenge verification: Database lookup + Cryptographically signed challenge token (HMAC-SHA256) to survive cross-container serverless routing on Vercel.
3. **Frontend Redesign & Error Handling (`frontend/login.html`):**
   - Check `res.ok` on `forgot-password` before transitioning to the Reset panel.
   - Display explicit error notifications when SMTP is unconfigured or failed.
   - Implement segmented 6-digit OTP cells with paste support on the Reset panel.
   - Send `email` alongside `otp`, `password`, and `confirm_password`.
   - Add a "Resend reset code" button with live 60-second cooldown on the Reset panel.
4. **Configuration & Test Suite:**
   - Add automated test cases covering end-to-end reset flow, Gmail delivery validation, 5-minute expiration, and attempt limits.
   - Document the exact Gmail App Password setup steps for live inbox testing.
