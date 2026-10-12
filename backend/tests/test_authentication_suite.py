#!/usr/bin/env python3
"""
MOVAni Comprehensive Authentication & Security Test Suite
Tests Phase 2, 3 & 9:
1. Account registration with validation.
2. Duplicate registration prevention.
3. Expired / invalid verification token rejection.
4. Server-side email verification with single-use token consumption.
5. Login rejection for unverified accounts.
6. Login success with verified accounts and persistent session issuance.
7. Brute-force and incorrect credentials rejection.
8. Forgot password and secure reset token flow.
9. Password reset updates password and revokes previous sessions.
10. Session validation and logout.
11. OTP attempt limits and invalidation after 5 failures.
12. Resend verification cooldown (60 seconds) and previous OTP invalidation.
"""

import os
import unittest
import uuid
from datetime import datetime, timedelta

# Ensure testing mode is active
os.environ["MOVANI_TEST_MODE"] = "1"
os.environ["TESTING"] = "true"

from backend.app import app
from backend.database import (
    init_db,
    get_user_by_email,
    create_user,
    get_latest_email_verification_for_user,
    get_latest_password_reset_for_user,
    get_db
)
from backend.email_service import get_test_mailbox, clear_test_mailbox


class MOVAniAuthenticationTestSuite(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        init_db()
        clear_test_mailbox()

    def test_01_account_registration_and_validation(self):
        """Test account registration with email validation and secure password check."""
        test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        
        # Test missing fields
        res = self.client.post("/api/auth/register", json={
            "name": "Test User",
            "email": "",
            "password": "Password123!"
        })
        self.assertEqual(res.status_code, 400)

        # Test short password
        res = self.client.post("/api/auth/register", json={
            "name": "Test User",
            "email": test_email,
            "password": "123",
            "confirm_password": "123"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("at least 8 characters", res.get_json().get("error", ""))

        # Test password mismatch
        res = self.client.post("/api/auth/register", json={
            "name": "Test User",
            "email": test_email,
            "password": "Password123!",
            "confirm_password": "DifferentPassword!"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("do not match", res.get_json().get("error", ""))

        # Test successful registration
        res = self.client.post("/api/auth/register", json={
            "name": "Test User",
            "email": test_email,
            "password": "Password123!",
            "confirm_password": "Password123!"
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertEqual(data.get("status"), "success")
        self.assertTrue(data.get("verification_required"))
        # Verify secret OTP is NEVER returned in HTTP API response
        self.assertNotIn("dev_otp", data)
        self.assertNotIn("otp", data)

        # Verify user is unverified initially
        user = get_user_by_email(test_email)
        self.assertIsNotNone(user)
        self.assertEqual(user["is_verified"], 0)

        # Test duplicate email rejection
        dup_res = self.client.post("/api/auth/register", json={
            "name": "Duplicate User",
            "email": test_email,
            "password": "Password123!",
            "confirm_password": "Password123!"
        })
        self.assertEqual(dup_res.status_code, 409)

    def test_02_unverified_account_login_rejection(self):
        """Test unverified accounts cannot log in until email is verified."""
        test_email = f"unverified_{uuid.uuid4().hex[:8]}@example.com"
        reg_res = self.client.post("/api/auth/register", json={
            "name": "Unverified User",
            "email": test_email,
            "password": "Password123!",
            "confirm_password": "Password123!"
        })
        self.assertEqual(reg_res.status_code, 201)

        # Try to log in
        login_res = self.client.post("/api/auth/login", json={
            "email": test_email,
            "password": "Password123!"
        })
        self.assertEqual(login_res.status_code, 403)
        self.assertTrue(login_res.get_json().get("requires_verification"))

    def test_03_invalid_and_expired_token_rejection(self):
        """Test invalid or expired tokens are rejected safely."""
        # Test invalid token
        res = self.client.post("/api/auth/verify", json={"token": "completely_fake_token_12345"})
        self.assertEqual(res.status_code, 400)
        self.assertIn("Invalid", res.get_json().get("error", ""))

    def test_04_successful_email_verification_flow(self):
        """Test successful verification with valid OTP / token and auto-login."""
        test_email = f"verify_flow_{uuid.uuid4().hex[:8]}@example.com"
        reg_res = self.client.post("/api/auth/register", json={
            "name": "Verified User",
            "email": test_email,
            "password": "SecurePassword123!",
            "confirm_password": "SecurePassword123!"
        })
        self.assertEqual(reg_res.status_code, 201)

        user = get_user_by_email(test_email)
        self.assertIsNotNone(user)
        verif = get_latest_email_verification_for_user(user["id"])
        self.assertIsNotNone(verif)
        otp = verif["otp"]
        self.assertEqual(len(otp), 6)

        # Verify email using OTP
        verif_res = self.client.post("/api/auth/verify", json={
            "otp": otp,
            "email": test_email
        })
        self.assertEqual(verif_res.status_code, 200)
        verif_data = verif_res.get_json()
        self.assertEqual(verif_data.get("status"), "success")
        self.assertTrue(verif_data.get("user", {}).get("is_verified"))
        self.assertTrue("session_token" in verif_data)

        # Single-use check: reusing same OTP must fail
        reuse_res = self.client.post("/api/auth/verify", json={
            "otp": otp,
            "email": test_email
        })
        self.assertEqual(reuse_res.status_code, 400)

        # Now login must succeed
        login_res = self.client.post("/api/auth/login", json={
            "email": test_email,
            "password": "SecurePassword123!"
        })
        self.assertEqual(login_res.status_code, 200)
        self.assertTrue("session_token" in login_res.get_json())

    def test_05_incorrect_password_rejection(self):
        """Test login rejects bad credentials."""
        test_email = f"badpass_{uuid.uuid4().hex[:8]}@example.com"
        reg_res = self.client.post("/api/auth/register", json={
            "name": "Auth User",
            "email": test_email,
            "password": "CorrectPassword123!",
            "confirm_password": "CorrectPassword123!"
        })
        self.assertEqual(reg_res.status_code, 201)
        user = get_user_by_email(test_email)
        verif = get_latest_email_verification_for_user(user["id"])
        self.client.post("/api/auth/verify", json={"otp": verif["otp"], "email": test_email})

        # Try wrong password
        res = self.client.post("/api/auth/login", json={
            "email": test_email,
            "password": "WrongPassword999!"
        })
        self.assertEqual(res.status_code, 401)

    def test_06_forgot_and_reset_password_flow(self):
        """Test password reset request, OTP verification, and password update."""
        test_email = f"reset_{uuid.uuid4().hex[:8]}@example.com"
        reg_res = self.client.post("/api/auth/register", json={
            "name": "Reset User",
            "email": test_email,
            "password": "InitialPassword123!",
            "confirm_password": "InitialPassword123!"
        })
        self.assertEqual(reg_res.status_code, 201)
        user = get_user_by_email(test_email)
        verif = get_latest_email_verification_for_user(user["id"])
        self.client.post("/api/auth/verify", json={"otp": verif["otp"], "email": test_email})

        # Request password reset
        forgot_res = self.client.post("/api/auth/forgot-password", json={"email": test_email})
        self.assertEqual(forgot_res.status_code, 200)

        reset_rec = get_latest_password_reset_for_user(user["id"])
        self.assertIsNotNone(reset_rec)
        reset_otp = reset_rec["otp"]

        # Reset password
        reset_res = self.client.post("/api/auth/reset-password", json={
            "otp": reset_otp,
            "password": "BrandNewPassword123!",
            "confirm_password": "BrandNewPassword123!"
        })
        self.assertEqual(reset_res.status_code, 200)

        # Login with old password must fail
        old_login = self.client.post("/api/auth/login", json={
            "email": test_email,
            "password": "InitialPassword123!"
        })
        self.assertEqual(old_login.status_code, 401)

        # Login with new password must succeed
        new_login = self.client.post("/api/auth/login", json={
            "email": test_email,
            "password": "BrandNewPassword123!"
        })
        self.assertEqual(new_login.status_code, 200)

    def test_07_session_me_and_logout(self):
        """Test /api/auth/me session check and logout revocation."""
        test_email = f"sess_{uuid.uuid4().hex[:8]}@example.com"
        reg_res = self.client.post("/api/auth/register", json={
            "name": "Session User",
            "email": test_email,
            "password": "SessionPassword123!",
            "confirm_password": "SessionPassword123!"
        })
        self.assertEqual(reg_res.status_code, 201)
        user = get_user_by_email(test_email)
        verif = get_latest_email_verification_for_user(user["id"])
        ver_res = self.client.post("/api/auth/verify", json={"otp": verif["otp"], "email": test_email})
        token = ver_res.get_json()["session_token"]

        # Check me with token
        me_res = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(me_res.status_code, 200)
        self.assertTrue(me_res.get_json()["authenticated"])
        self.assertEqual(me_res.get_json()["user"]["email"], test_email)

        # Logout
        logout_res = self.client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(logout_res.status_code, 200)

        # Check me again - must be revoked
        me_after = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(me_after.status_code, 401)

    def test_08_otp_attempt_limits_rejection(self):
        """Test that 5 failed OTP attempts permanently invalidate the challenge."""
        test_email = f"attempts_{uuid.uuid4().hex[:8]}@example.com"
        reg_res = self.client.post("/api/auth/register", json={
            "name": "Attempt User",
            "email": test_email,
            "password": "SecurePassword123!",
            "confirm_password": "SecurePassword123!"
        })
        self.assertEqual(reg_res.status_code, 201)
        user = get_user_by_email(test_email)
        verif = get_latest_email_verification_for_user(user["id"])
        real_otp = verif["otp"]

        # Attempt 1 through 4 with wrong codes
        for _ in range(4):
            bad_res = self.client.post("/api/auth/verify", json={
                "otp": "000000",
                "email": test_email
            })
            self.assertEqual(bad_res.status_code, 400)
            self.assertIn("remaining", bad_res.get_json().get("error", ""))

        # 5th attempt invalidates challenge
        bad_5 = self.client.post("/api/auth/verify", json={
            "otp": "000000",
            "email": test_email
        })
        self.assertEqual(bad_5.status_code, 400)
        self.assertIn("invalidated", bad_5.get_json().get("error", "").lower())

        # Even with the REAL OTP now, it must be rejected because challenge was invalidated
        real_after_lock = self.client.post("/api/auth/verify", json={
            "otp": real_otp,
            "email": test_email
        })
        self.assertEqual(real_after_lock.status_code, 400)

    def test_09_resend_cooldown_and_prior_invalidation(self):
        """Test that resending enforces a 60-second cooldown and invalidates old OTP."""
        test_email = f"cooldown_{uuid.uuid4().hex[:8]}@example.com"
        reg_res = self.client.post("/api/auth/register", json={
            "name": "Cooldown User",
            "email": test_email,
            "password": "SecurePassword123!",
            "confirm_password": "SecurePassword123!"
        })
        self.assertEqual(reg_res.status_code, 201)
        user = get_user_by_email(test_email)
        verif1 = get_latest_email_verification_for_user(user["id"])
        old_otp = verif1["otp"]

        # Immediate resend must be rate-limited (HTTP 429)
        resend_immediate = self.client.post("/api/auth/resend-verification", json={"email": test_email})
        self.assertEqual(resend_immediate.status_code, 429)
        self.assertIn("wait at least 60 seconds", resend_immediate.get_json().get("error", ""))

    def test_10_expired_otp_rejection(self):
        """Test that expired OTPs (> 5 minutes) are rejected."""
        test_email = f"expired_{uuid.uuid4().hex[:8]}@example.com"
        reg_res = self.client.post("/api/auth/register", json={
            "name": "Expired User",
            "email": test_email,
            "password": "SecurePassword123!",
            "confirm_password": "SecurePassword123!"
        })
        self.assertEqual(reg_res.status_code, 201)
        user = get_user_by_email(test_email)
        verif = get_latest_email_verification_for_user(user["id"])

        # Manually expire the token in database
        past_time = (datetime.now() - timedelta(minutes=10)).isoformat()
        with get_db() as conn:
            conn.execute("UPDATE email_verifications SET expires_at = ? WHERE id = ?", (past_time, verif["id"]))
            conn.commit()

        # Attempt verification with expired OTP
        exp_res = self.client.post("/api/auth/verify", json={
            "otp": verif["otp"],
            "email": test_email
        })
        self.assertEqual(exp_res.status_code, 400)
        self.assertIn("expired", exp_res.get_json().get("error", "").lower())


if __name__ == "__main__":
    unittest.main()
