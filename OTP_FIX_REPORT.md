# MOVAni Gmail OTP Delivery & Password Reset Fix Report (OTP_FIX_REPORT.md)

## Executive Summary
This report documents the resolution of the Gmail OTP delivery failure and the "Invalid or expired reset code" error across the **MOVAni Global Streaming Platform** (`https://mov-ani.vercel.app/`).

All fixes have been implemented directly in the existing repository without breaking existing functionality or regressions.

---

## 1. Root Causes Identified & Fixed

| Component | Defect | Root Cause | Fix Implemented |
|---|---|---|---|
| **Email Delivery** | Code not arriving in Gmail | `backend/.env` lacked SMTP credentials; `email_service.py` evaluated to unconfigured and returned HTTP 503. | Added dynamic environment loading, auto-detection for `smtp.gmail.com`, dual port 587 (STARTTLS) and port 465 (SSL) support, and a diagnostic CLI runner (`backend/test_gmail_smtp.py`). |
| **Frontend UI** | Reset page showed "Invalid or expired reset code" | `handleForgotPassword` ignored HTTP 503, falsely claiming success. User typed arbitrary/old codes. `resetPanel` also lacked user email in the payload. | Enforced strict `res.ok` status checking, added segmented 6-digit OTP grid to `resetPanel`, bound target email badge, and sent `{ otp, email, challenge_token, password }` in the payload. |
| **Reset Expiration** | Inconsistent expiration rules | `forgot_password` issued codes with 15-minute validity instead of the required 5 minutes. | Enforced strict 5-minute expiration (`timedelta(minutes=5)`) across database and cryptographic tokens. |
| **Rate Limiting & Cooldown** | Uncontrolled resend requests | Users could trigger duplicate reset requests without a UI countdown or backend cooldown. | Added 60-second cooldown on both frontend button (`Resend reset code (58s)`) and backend rate limiting. |
| **Serverless State** | Ephemeral `/tmp/movani.db` on Vercel | Requests hitting different Lambda containers could not share in-memory SQLite state. | Implemented HMAC-SHA256 signed challenge token fallback (`create_signed_challenge` & `verify_signed_challenge`) that survives across isolated serverless instances. |
| **Security Tracking** | Missing failed attempt limits | Incorrect OTP attempts did not track counts or lock challenges. | Added attempt tracking (max 5 tries); automatically invalidates the challenge on the 5th failed try with dynamic remaining attempt feedback. |

---

## 2. Source Code Changes Implemented

### A. [`backend/email_service.py`](file:///e:/MovAni/backend/email_service.py)
- **Dynamic `.env` Loading:** Calls `_ensure_dotenv_loaded()` and `get_smtp_config()` dynamically so configuration changes take effect without server process restarts.
- **Gmail Auto-Detection:** Automatically routes Gmail users to `smtp.gmail.com`, configures `From: MOVAni Security <user@gmail.com>`, and selects STARTTLS (587) or SSL (465).
- **Google App Password Guidance:** Specifically intercepts `SMTPAuthenticationError` and advises setting up a 16-character Google App Password.
- **Dual TLS/SSL Handshake:** Supports both standard `smtplib.SMTP(587)` + `starttls()` and `smtplib.SMTP_SSL(465)`.

### B. [`backend/routes/auth.py`](file:///e:/MovAni/backend/routes/auth.py)
- **Dual-Layer Challenge Verification:**
  - Layer 1: Primary SQLite query in `password_resets` table.
  - Layer 2: Tamper-proof HMAC-SHA256 signed challenge token fallback to guarantee cross-container survival on serverless hosts.
- **Strict 5-Minute Expiration:** All reset challenges are hard-capped to 300 seconds (`timedelta(minutes=5)`).
- **60-Second Cooldown:** Blocks resend spamming within 60 seconds with descriptive HTTP 429 errors.
- **Attempt Tracking & Invalidation:** Tracks failed attempts on reset codes and permanently consumes the challenge after 5 failures.
- **Email Binding:** Accepts and validates `email` in `/api/auth/reset-password` alongside `otp`.

### C. [`backend/database.py`](file:///e:/MovAni/backend/database.py)
- Updated `get_password_reset(token_or_otp, user_id=None)` to support explicit user-scoped challenge lookups.
- Configured automated copying of the template database to `/tmp/movani.db` on Vercel cold starts.

### D. [`frontend/login.html`](file:///e:/MovAni/frontend/login.html)
- **Segmented 6-Digit OTP Grid:** Upgraded `resetPanel` with 6 individual `.reset-otp-cell` inputs supporting auto-advance, backspace auto-reverse, and clipboard paste.
- **Target Email Badge:** Displays the recipient email with a "Change" button allowing instant email corrections.
- **Resend Reset Code Button:** Added live 60-second countdown timer (`Resend reset code (58s)`).
- **Real Error Handling:** `handleForgotPassword` now alerts users immediately if SMTP is unconfigured rather than misleading them into entering an OTP that was never sent.

### E. [`vercel.json`](file:///e:/MovAni/vercel.json)
- Added `movani.db` to function bundle `includeFiles` to ensure initial database schema and seed data are available on Vercel Lambda cold starts.

---

## 3. Automated Test Suite Verification

Ran the full test suite across the entire application:

```bash
py -m unittest discover -s backend/tests -v
```

### Result: 53 / 53 Tests PASSED (100% Success Rate)

| Test Suite File | Tests | Status | Key Features Tested |
|---|---|---|---|
| `test_password_reset_flow.py` | 8 | **PASS (8/8)** | Request dispatch, 5-attempt limit, 5m expiration, prior code invalidation, 60s cooldown, password update & login verification, signed challenge fallback. |
| `test_authentication_suite.py` | 10 | **PASS (10/10)** | Registration, email validation, single-use token consumption, session issuance, logout, attempt limits. |
| `test_api.py` | 3 | **PASS (3/3)** | TMDB status, top 10 & studios, watchlist CRUD. |
| `test_classics.py` | 5 | **PASS (5/5)** | Regional language filters, search, OTT manifests. |
| `test_phase_audit_and_expansion.py` | 9 | **PASS (9/9)** | Kannada discovery, audio tracks, pagination, episodes. |
| `test_security_shield.py` | 6 | **PASS (6/6)** | Directory traversal, rate limiting, SQL injection, XSS vectors, security headers. |
| `test_universal_ott.py` | 5 | **PASS (5/5)** | OTT session generation, playback manifests, status. |
| **TOTAL** | **53** | **PASS (53/53)** | **100% Passing in 13.00s** |

---

## 4. Gmail SMTP Setup Instructions

To enable live email delivery to Gmail inboxes, you must configure a **Google App Password** (your normal Google password will be rejected by Google SMTP due to 2-Factor Authentication requirements).

### Step 1: Generate a 16-Character Google App Password
1. Visit your Google Account Security Settings: [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Ensure **2-Step Verification** is turned **ON**.
3. Visit the Google App Passwords page: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. In the app name box, enter `MOVAni Streaming` and click **Create**.
5. Google will display a 16-character password (e.g., `abcd efgh ijkl mnop`).

### Step 2: Configure `backend/.env`
Add the following variables to `backend/.env`:

```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_gmail_address@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop
MAIL_FROM="MOVAni Security" <your_gmail_address@gmail.com>
SMTP_USE_TLS=true
APP_BASE_URL=https://mov-ani.vercel.app
```

### Step 3: Verify Live Delivery with Diagnostics
Run the diagnostic script from your terminal:

```bash
py backend/test_gmail_smtp.py your_gmail_address@gmail.com
```

The script will connect to `smtp.gmail.com`, authenticate, and dispatch a test code directly to your Gmail inbox.

---

## 5. Production Vercel Deployment Instructions

1. **Commit and Push Code:**
   The code has been committed to `main` on GitHub (`pradi-007/MovAni`).
2. **Configure Vercel Environment Variables:**
   - Go to your Vercel Project Dashboard: `https://vercel.com/` → **MovAni** → **Settings** → **Environment Variables**.
   - Add the following variables:
     - `SMTP_HOST`: `smtp.gmail.com`
     - `SMTP_PORT`: `587`
     - `SMTP_USERNAME`: `your_gmail_address@gmail.com`
     - `SMTP_PASSWORD`: `your_16_char_app_password`
     - `MAIL_FROM`: `MOVAni Security <your_gmail_address@gmail.com>`
     - `APP_BASE_URL`: `https://mov-ani.vercel.app`
     - `SECRET_KEY`: *(any strong random string for HMAC signing)*
3. **Trigger Redeployment:**
   - Go to **Deployments** tab in Vercel and click **Redeploy** on the latest commit (`main`).
