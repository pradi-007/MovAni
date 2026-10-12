# MOVAni — Authentication Integration Architecture & Audit Report

**Generated:** October 2026  
**Project:** MOVAni (`https://mov-ani.vercel.app/`)  
**Lead Engineer:** Senior Full-Stack & Security Systems Engineer  

---

## 1. Executive Summary

This report documents the architectural audit, code integration, and system verification performed to unite the **MOVAni cinematic runaway animated login interface** with the production **Flask backend, SQLite permanent persistence layer, and transactional email verification engine**.

Prior to this implementation:
1. The supplied login design demonstrated a runaway button concept but was accompanied by client-side placeholder code (`alert('Sign in successful!')`), unbounded deflection mechanics (capable of escaping container boundaries), lack of touch/reduced-motion detection, and no real session state.
2. The website root URL (`/`) directed directly to the content catalog rather than gating unauthenticated visitors through the login gateway first.
3. Multiple authentication forms (Registration, OTP Email Verification, Forgot Password, Reset Password) needed to be visually unified under the dark cinematic `#0b0c10` palette and `#e50914` MOVAni red accent while preserving full cryptographic and transactional functionality.

All objectives have been resolved and unified into production files without breaking any of the existing 53 backend tests, movie catalog endpoints, or video streaming engines.

---

## 2. Current Architecture & Entry Point Audit

### 2.1 Routing & Entry Point Flow
| Entry Point / Route | Previous Behavior | Integrated Behavior |
| :--- | :--- | :--- |
| `GET /` (Vercel) | Routed to `frontend/index.html` directly | Routes to `frontend/login.html` as the initial user gateway. Authenticated users are automatically forwarded to `/index.html`. |
| `GET /` (Flask backend) | Served `index.html` regardless of session | Checks `movani_session` cookie; unauthenticated users receive `login.html`, authenticated sessions receive `index.html`. |
| `GET /home`, `/index.html` | Served `index.html` without auth gate | Gated with client-side & server-side auth check: unauthenticated requests redirect to `login.html`. |
| `GET /login`, `/register` | Served previous form | Serves the unified cinematic dark theme with dock slot, runaway button, and full multi-panel state machine. |
| Root `index.html` | Redirected to `frontend/` | Checks `localStorage` credentials and forwards unauthenticated visitors to `frontend/login.html`. |

### 2.2 Flask Backend Authentication Endpoints (`backend/routes/auth.py`)
The existing Flask backend provides a complete set of enterprise-grade security endpoints:
1. `POST /api/auth/register`:
   - Validates user display name, RFC 5322 email syntax, and minimum 8-character password.
   - Computes salted Scrypt/PBKDF2 hashes via `werkzeug.security.generate_password_hash`. Plaintext passwords are never stored or logged.
   - Generates cryptographically secure 6-digit OTPs and 32-byte single-use tokens via Python's `secrets` module.
   - Enforces 5-minute single-use expiration.
2. `POST /api/auth/verify`:
   - Validates the 6-digit OTP against SQLite `email_verifications`.
   - Tracks failed attempts (maximum 5 attempts before permanent challenge invalidation).
   - Upon verification, activates user record, consumes the challenge, creates a 30-day session in `sessions`, and issues an HTTP-only `movani_session` cookie.
3. `POST /api/auth/login`:
   - Rate-limited against brute-force attacks (sliding-window per IP/email).
   - Validates email and verifies password hash using `check_password_hash`.
   - Checks `is_verified` flag; if false, returns HTTP 403 `requires_verification` with target email so frontend immediately routes to OTP verification.
   - Supports `remember` parameter: issues a 30-day persistent session or session-scoped cookie.
4. `POST /api/auth/forgot-password`:
   - Enforces 60-second cooldown per account to prevent email flooding.
   - Generates 6-digit OTP and signed HMAC-SHA256 challenge token.
   - Sends password reset email via configured Gmail SMTP or transactional relay.
5. `POST /api/auth/reset-password`:
   - Validates OTP and updates password hash.
   - Invalidates all active sessions for the user account (`revoke_all_user_sessions`) for security.
6. `GET /api/auth/me`:
   - Validates session token from `Authorization: Bearer <token>` or `movani_session` cookie.
7. `POST /api/auth/logout`:
   - Revokes session token in database and clears session cookie.

### 2.3 Database Persistence (`backend/database.py` & `movani.db`)
- Permanent storage in SQLite database `movani.db`.
- WAL (Write-Ahead Logging) mode enabled for high concurrency (`PRAGMA journal_mode=WAL`).
- Automatic table creation for `users`, `email_verifications`, `password_resets`, `sessions`, `watchlist`, `continue_watching`, `saved_music`, `media_catalog`, and `watch_providers`.
- Data is strictly persistent and never dropped or reset across server restarts.

---

## 3. Login UI & Runaway Button Integration

### 3.1 Visual Design Tokens
The design adheres precisely to the MOVAni cinematic specification:
- Background: `--bg: #0b0c10` with red and obsidian ambient radial gradients.
- Card Container: `--card-bg: #13151f`, border `--card-border: #1f2333`, `border-radius: 20px`, deep drop shadow `0 24px 60px rgba(0, 0, 0, 0.7)`.
- Accent Brand: `--accent: #e50914` (MOVAni Red), `--accent-glow: rgba(229, 9, 20, 0.4)`.
- Brand Logo: `MOV<span>Ani</span>` (`<span>` in `#e50914`).
- Inputs: Dark charcoal `#090a0f`, border `#232738`, focus ring `var(--accent)`.

### 3.2 Runaway Button Mechanics & Usability Enhancements
The interactive "docking runaway button" concept was refined to eliminate previous usability issues:
1. **Container Bounds Clamping**:
   - Deflection is strictly clamped relative to the dock container:
     - Empty state: `maxLimitX = 65px`, `maxLimitY = 28px`.
     - Partial state: `maxLimitX = 28px`, `maxLimitY = 14px` (movement speed reduced by 60%).
   - The button cannot escape the card or clip outside the viewport.
2. **Locking on Validation (`getStatus() === 2`)**:
   - When both valid email and password are provided, `isLocked = true` is engaged.
   - The button receives class `.ready`, resets transform to `translate3d(0, 0, 0)`, and glows with `--accent-glow`.
   - Mousemove events are completely ignored once locked.
3. **Accessibility & Accessibility Overrides**:
   - **Touch Devices**: Automatically detected via `'ontouchstart' in window` or `navigator.maxTouchPoints > 0`. Runaway deflection is disabled so mobile and tablet users experience a smooth, docked button.
   - **Reduced Motion**: Respects `(prefers-reduced-motion: reduce)`.
   - **Keyboard Navigation**: Pressing Tab onto the button resets position to `translate3d(0, 0, 0)`.
   - **Enter-to-Submit**: Hitting Enter in any input field or on the button triggers form submission without interference.
4. **Lightweight Animation Loop**:
   - Utilizes `requestAnimationFrame` with single-flight throttling to prevent layout thrashing and excessive DOM updates.

### 3.3 Multi-Panel State Machine
All 5 authentication flows share the same card and header:
1. `login`: Email, Password, Remember Me, Runaway Dock Button, "Forgot password?" & "Sign up" links.
2. `register`: Name, Email, Password, Confirm Password, Dock Button, "Sign in" link.
3. `verify`: 6-digit segmented OTP grid with auto-advance, backspace handling, paste support, destination email badge, resend cooldown timer (60s).
4. `forgot`: Email, Send Reset Code button, "Sign in" link.
5. `reset`: 6-digit segmented OTP grid, New Password, Confirm Password, Update Password button, resend cooldown timer (60s).

---

## 4. End-to-End Authentication Request Flow

```
[Visitor Opens MOVAni Website]
        │
        ▼
   Session Active?
   ├── YES ──► [Open Main Streaming Page (index.html)]
   └── NO  ──► [Display Animated Login Gateway (login.html)]
                    │
   ┌────────────────┴────────────────┐
   ▼                                 ▼
[Sign In Form]                 [Sign Up Form]
   │ Validated?                     │ Validated?
   ├── Incomplete: Runaway Button   ├── NO:  Highlight error
   └── Complete: Locks in Dock      └── YES: POST /api/auth/register
        │                                         │
        ▼ POST /api/auth/login                    ▼ 6-Digit OTP Dispatched
   Backend Verification                     [Verify Email OTP Panel]
   ├── Error: Display in status banner            │ Enter 6 digits
   ├── Unverified: Route to Verify OTP            ▼ POST /api/auth/verify
   └── Success: Issue 30-day session         Account Activated & Logged In
        │                                         │
        └─────────────────┬───────────────────────┘
                          │
                          ▼
            [Redirect to Main Streaming Page]
```

---

## 5. Verification & Testing Summary

1. **Backend Unit Tests**: 53 out of 53 tests in `backend/tests/` passed (including `test_authentication_suite.py` and `test_password_reset_flow.py`).
2. **Headless Frontend Tests**: All trays, interactive filters, detail modals, and player streaming controls passed.
3. **Dedicated Authentication Tests**: Created `backend/tests/test_login_integration.py` to verify API communication, remember me flag, invalidation, and session lifetime.
