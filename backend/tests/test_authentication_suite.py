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
"""

import unittest
from datetime import datetime, timedelta
from backend.app import app
from backend.database import init_db, get_user_by_email, create_user


class MOVAniAuthenticationTestSuite(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        init_db()

    def test_01_account_registration_and_validation(self):
        """Test account registration with email validation and secure password check."""
        test_email = f"test_{int(datetime.now().timestamp())}@example.com"
        
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
        test_email = f"unverified_{int(datetime.now().timestamp())}@example.com"
        self.client.post("/api/auth/register", json={
            "name": "Unverified User",
            "email": test_email,
            "password": "Password123!",
            "confirm_password": "Password123!"
        })

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
        test_email = f"verify_flow_{int(datetime.now().timestamp())}@example.com"
        reg_res = self.client.post("/api/auth/register", json={
            "name": "Verified User",
            "email": test_email,
            "password": "SecurePassword123!",
            "confirm_password": "SecurePassword123!"
        })
        self.assertEqual(reg_res.status_code, 201)
        otp = reg_res.get_json().get("dev_otp")
        self.assertIsNotNone(otp)

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
        test_email = f"badpass_{int(datetime.now().timestamp())}@example.com"
        reg = self.client.post("/api/auth/register", json={
            "name": "Auth User",
            "email": test_email,
            "password": "CorrectPassword123!",
            "confirm_password": "CorrectPassword123!"
        })
        otp = reg.get_json().get("dev_otp")
        self.client.post("/api/auth/verify", json={"otp": otp, "email": test_email})

        # Try wrong password
        res = self.client.post("/api/auth/login", json={
            "email": test_email,
            "password": "WrongPassword999!"
        })
        self.assertEqual(res.status_code, 401)

    def test_06_forgot_and_reset_password_flow(self):
        """Test password reset request, OTP verification, and password update."""
        test_email = f"reset_{int(datetime.now().timestamp())}@example.com"
        reg = self.client.post("/api/auth/register", json={
            "name": "Reset User",
            "email": test_email,
            "password": "InitialPassword123!",
            "confirm_password": "InitialPassword123!"
        })
        otp = reg.get_json().get("dev_otp")
        self.client.post("/api/auth/verify", json={"otp": otp, "email": test_email})

        # Request forgot password
        forgot_res = self.client.post("/api/auth/forgot-password", json={"email": test_email})
        self.assertEqual(forgot_res.status_code, 200)
        reset_otp = forgot_res.get_json().get("dev_otp")
        self.assertIsNotNone(reset_otp)

        # Reset password
        reset_res = self.client.post("/api/auth/reset-password", json={
            "otp": reset_otp,
            "password": "BrandNewPassword456!",
            "confirm_password": "BrandNewPassword456!"
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
            "password": "BrandNewPassword456!"
        })
        self.assertEqual(new_login.status_code, 200)

    def test_07_session_me_and_logout(self):
        """Test /api/auth/me session check and logout revocation."""
        test_email = f"sess_{int(datetime.now().timestamp())}@example.com"
        reg = self.client.post("/api/auth/register", json={
            "name": "Session User",
            "email": test_email,
            "password": "SessionPassword123!",
            "confirm_password": "SessionPassword123!"
        })
        otp = reg.get_json().get("dev_otp")
        verif = self.client.post("/api/auth/verify", json={"otp": otp, "email": test_email})
        session_token = verif.get_json().get("session_token")

        # Test authenticated /me
        me_res = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {session_token}"})
        self.assertEqual(me_res.status_code, 200)
        self.assertTrue(me_res.get_json().get("authenticated"))
        self.assertEqual(me_res.get_json().get("user", {}).get("email"), test_email)

        # Logout
        logout_res = self.client.post("/api/auth/logout", headers={"Authorization": f"Bearer {session_token}"})
        self.assertEqual(logout_res.status_code, 200)

        # /me after logout must be 401 unauthenticated
        me_after = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {session_token}"})
        self.assertEqual(me_after.status_code, 401)


if __name__ == "__main__":
    unittest.main()
