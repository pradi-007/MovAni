# MOVAni Authentication & Login Architecture Audit (LOGIN_AUDIT.md)

## Executive Summary
This document provides a comprehensive technical audit of the authentication, registration, session management, and verification subsystems in the **MOVAni** streaming codebase (`https://mov-ani.vercel.app/`), identifying root causes across the frontend UI, JavaScript state handlers, Flask backend routes, SQLite database schema, and email delivery services.

---

## 1. Frontend Audit (`frontend/login.html`, `frontend/js/auth.js`)

| Component | Status | Diagnosed Defect | Impact |
|---|---|---|---|
| **Submit Button Interaction** | Incomplete | Traditional linear button lacked the dimensional "dock" socket and elastic tether band design requested from the reference. | Fails to match the premium 3D aesthetic of the reference visual. |
| **OTP Entry Experience** | Defective | Lacked 6 individual auto-advancing input boxes with clipboard paste handling; no "Change Email" link to correct typos. | Poor mobile/desktop UX; unable to fix mistyped email without restarting flow. |
| **Resend Cooldown** | Missing | The "Resend email" button had no client-side countdown timer (e.g. 60s cooldown disablement with live seconds countdown). | Users could spam clicks, triggering unhandled 429 rate limit exceptions. |
| **Secret Exposure** | Critical Vulnerability | Frontend JavaScript checked `if (data.dev_otp) document.getElementById('otpInput').value = data.dev_otp;`. | The OTP was exposed in network payloads and auto-injected into the DOM, violating zero-knowledge verification principles. |
| **Password Visibility Toggles** | Incomplete | Confirm password input lacked an eye icon toggle button (only the primary password input had one). | Users could not verify typed confirmation passwords on mobile devices. |
| **Accessibility & Focus** | Needs Hardening | Lacked explicit ARIA live regions for status banners; keyboard focus outlines were missing on tab navigation. | Inaccessible to screen readers and keyboard-only users. |
| **Reduced Motion** | Partial | Mousemove 3D card tilt was active on desktop, but lacked a check for `@media (prefers-reduced-motion: reduce)`. | Could cause vestibular discomfort for users requesting reduced motion. |

---

## 2. Backend API Audit (`backend/routes/auth.py`, `backend/email_service.py`)

| Endpoint / Subsystem | Status | Diagnosed Defect | Security & Functional Impact |
|---|---|---|---|
| **OTP Expiration Window** | Critical Bug | `expires_at = (datetime.now() + timedelta(hours=24)).isoformat()` allowed OTPs to remain valid for 24 hours instead of the mandatory 5 minutes. | High replay attack surface; violates industry security standards (OWASP). |
| **Brute-Force Attempt Limits** | Missing | No per-challenge attempt tracking. An attacker could attempt brute-forcing the 6-digit code without challenge invalidation. | Vulnerable to offline or online code enumeration. |
| **Previous OTP Invalidation** | Defective | Requesting a new OTP via `/api/auth/resend-verification` did not invalidate prior unconsumed tokens for that user. | Multiple concurrent codes remained active simultaneously. |
| **Server Log Leakage** | Security Defect | `backend/email_service.py` logged plaintext OTPs to `stdout`: `print(f"[EMAIL DEV MODE] To: {to_email} \| OTP: {otp}")`. | Sensitive authentication tokens leaked into persistent terminal logs and task outputs. |
| **API Response Leakage** | Security Defect | `response_data["dev_otp"] = email_res["dev_otp"]` returned the OTP directly in HTTP 201 responses. | Any network proxy, browser extension, or inspector could capture the code. |
| **Email Delivery Simulation** | Misleading | When SMTP credentials were missing in `.env`, the service returned simulated success (`sent: True`) rather than reporting a configuration error. | Users in production would see "Check your email" even when no email could ever be dispatched. |

---

## 3. Database Schema Audit (`backend/database.py`)

| Table | Status | Diagnosed Defect | Recommendation |
|---|---|---|---|
| **`email_verifications`** | Needs Upgrade | Lacked `attempts` and `max_attempts` columns to track failed verification tries. | Add `attempts INTEGER DEFAULT 0` column and index on `user_id`. |
| **`password_resets`** | Needs Upgrade | Lacked `attempts` column for tracking failed reset code attempts. | Add `attempts INTEGER DEFAULT 0` column. |
| **`users`** | Sound | Secure scrypt/PBKDF2 password hashes and verification boolean are present and indexed. | Retain schema with WAL mode optimization. |

---

## 4. Remediation Plan

1. **Phase 2 & 4 (Frontend Redesign)**:
   - Re-architect `frontend/login.html` into a luxury matte obsidian/teal glassmorphism card with subtle 3D perspective and interactive magnetic dock socket.
   - Implement segmented 6-digit OTP input grid with auto-focus, backspace jumping, and paste extraction.
   - Add dynamic 60s cooldown timer for Resend Code and "Change Email" action.
   - Enforce full keyboard navigation, accessible focus rings, and `@media (prefers-reduced-motion)`.
2. **Phase 3 & 5 (Backend Security & Real OTP Flow)**:
   - Enforce 5-minute expiration (`timedelta(minutes=5)`) on all OTPs.
   - Enforce max 5 attempts per OTP challenge; permanently invalidate challenge upon 5th failure.
   - Automatically invalidate all prior OTPs for a user when a new code is issued.
   - Remove all OTP exposures from JSON API responses and server console logs.
   - Real transactional SMTP email delivery with clear configuration error handling when credentials are missing.
3. **Phase 6 & 7 (System Verification & Tests)**:
   - Add automated test cases covering registration, validation, attempt limits, expiration, cooldowns, invalidation, and session issuance.
   - Validate zero console errors and 100% test pass rate.
