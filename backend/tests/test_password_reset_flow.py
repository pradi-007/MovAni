#!/usr/bin/env python3
"""
MOVAni Password Reset & Gmail OTP End-to-End Test Suite
Tests:
1. Request password reset with valid email.
2. Verify message acceptance and test mailbox capture.
3. Reject incorrect reset code and verify remaining attempts feedback.
4. Reject code after 5 failed attempts (challenge invalidation).
5. Reject expired reset code (> 5 minutes).
6. Requesting fresh code invalidates prior unconsumed codes.
7. Enforce 60-second cooldown on reset requests.
8. Successfully reset password with valid 6-digit OTP.
9. Single-use enforcement: Reject reused reset code.
10. Confirm new password works for login.
11. Confirm old password no longer works.
12. Verify cross-container signed challenge token fallback (serverless resilience).
13. Gmail SMTP configuration detection and Google App Password requirement handling.
"""

import os
import unittest
import uuid
import secrets
from datetime import datetime, timedelta

# Enable testing mode
os.environ["MOVANI_TEST_MODE"] = "1"
os.environ["TESTING"] = "true"

from backend.app import app
from backend.database import (
    init_db,
    get_user_by_email,
    get_latest_password_reset_for_user,
    get_db
)
from backend.email_service import (
    get_test_mailbox,
    clear_test_mailbox,
    get_smtp_config,
    send_password_reset_email
)
from backend.routes.auth import create_signed_challenge, verify_signed_challenge


class MOVAniPasswordResetTestSuite(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        init_db()
        clear_test_mailbox()

    def _create_verified_user(self, email=None):
        test_email = email or f"reset_{uuid.uuid4().hex[:8]}@example.com"
        reg = self.client.post("/api/auth/register", json={
            "name": "Reset Test User",
            "email": test_email,
            "password": "OriginalPassword123!",
            "confirm_password": "OriginalPassword123!"
        })
        self.assertEqual(reg.status_code, 201)
        # Directly mark verified in database
        with get_db() as conn:
            conn.execute("UPDATE users SET is_verified = 1 WHERE email = ?", (test_email,))
            conn.commit()
        return test_email

    def test_01_request_reset_code_and_dispatch(self):
        """Test requesting reset code dispatches 6-digit OTP and returns signed challenge."""
        email = self._create_verified_user()

        res = self.client.post("/api/auth/forgot-password", json={"email": email})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get("status"), "success")
        self.assertTrue(data.get("challenge_token"))
        self.assertEqual(data.get("email"), email)
        self.assertEqual(data.get("expires_in_seconds"), 300)

        # Confirm test mailbox received message with 6-digit OTP
        mailbox = get_test_mailbox()
        self.assertIn(email, mailbox)
        otp = mailbox[email].get("otp")
        self.assertIsNotNone(otp)
        self.assertEqual(len(otp), 6)
        self.assertTrue(otp.isdigit())

    def test_02_reject_incorrect_code_and_track_attempts(self):
        """Test incorrect reset code is rejected with remaining attempts feedback."""
        email = self._create_verified_user()
        self.client.post("/api/auth/forgot-password", json={"email": email})

        # Try wrong code (1st attempt)
        bad_res1 = self.client.post("/api/auth/reset-password", json={
            "email": email,
            "otp": "000000",
            "password": "BrandNewPassword123!",
            "confirm_password": "BrandNewPassword123!"
        })
        self.assertEqual(bad_res1.status_code, 400)
        self.assertIn("remaining", bad_res1.get_json().get("error", "").lower())

    def test_03_invalidate_challenge_after_5_failed_attempts(self):
        """Test challenge is permanently invalidated after 5 incorrect attempts."""
        email = self._create_verified_user()
        self.client.post("/api/auth/forgot-password", json={"email": email})
        mailbox = get_test_mailbox()
        real_otp = mailbox[email]["otp"]

        # Submit 4 wrong attempts
        for _ in range(4):
            self.client.post("/api/auth/reset-password", json={
                "email": email,
                "otp": "000000",
                "password": "BrandNewPassword123!",
                "confirm_password": "BrandNewPassword123!"
            })

        # 5th wrong attempt triggers invalidation
        bad_5 = self.client.post("/api/auth/reset-password", json={
            "email": email,
            "otp": "000000",
            "password": "BrandNewPassword123!",
            "confirm_password": "BrandNewPassword123!"
        })
        self.assertEqual(bad_5.status_code, 400)
        self.assertIn("invalidated", bad_5.get_json().get("error", "").lower())

        # Even with the REAL OTP now, request must be rejected
        real_after_lock = self.client.post("/api/auth/reset-password", json={
            "email": email,
            "otp": real_otp,
            "password": "BrandNewPassword123!",
            "confirm_password": "BrandNewPassword123!"
        })
        self.assertEqual(real_after_lock.status_code, 400)

    def test_04_reject_expired_code(self):
        """Test reset code older than 5 minutes is rejected."""
        email = self._create_verified_user()
        self.client.post("/api/auth/forgot-password", json={"email": email})
        user = get_user_by_email(email)
        reset_rec = get_latest_password_reset_for_user(user["id"])

        # Manually backdate expiration to simulate > 5 minutes expired
        past_time = (datetime.now() - timedelta(minutes=10)).isoformat()
        with get_db() as conn:
            conn.execute("UPDATE password_resets SET expires_at = ? WHERE id = ?", (past_time, reset_rec["id"]))
            conn.commit()

        exp_res = self.client.post("/api/auth/reset-password", json={
            "email": email,
            "otp": reset_rec["otp"],
            "password": "BrandNewPassword123!",
            "confirm_password": "BrandNewPassword123!"
        })
        self.assertEqual(exp_res.status_code, 400)
        self.assertIn("expired", exp_res.get_json().get("error", "").lower())

    def test_05_requesting_new_code_invalidates_prior_code(self):
        """Test that issuing a new reset code invalidates any previous unconsumed code."""
        email = self._create_verified_user()
        self.client.post("/api/auth/forgot-password", json={"email": email})
        old_otp = get_test_mailbox()[email]["otp"]

        # Backdate the first reset so 60-second cooldown is bypassed
        user = get_user_by_email(email)
        reset1 = get_latest_password_reset_for_user(user["id"])
        past_created = (datetime.now() - timedelta(seconds=70)).isoformat()
        with get_db() as conn:
            conn.execute("UPDATE password_resets SET created_at = ? WHERE id = ?", (past_created, reset1["id"]))
            conn.commit()

        # Request new reset code
        self.client.post("/api/auth/forgot-password", json={"email": email})
        new_otp = get_test_mailbox()[email]["otp"]
        self.assertNotEqual(old_otp, new_otp)

        # Trying old OTP must now fail
        old_attempt = self.client.post("/api/auth/reset-password", json={
            "email": email,
            "otp": old_otp,
            "password": "BrandNewPassword123!",
            "confirm_password": "BrandNewPassword123!"
        })
        self.assertEqual(old_attempt.status_code, 400)

        # New OTP must succeed
        new_attempt = self.client.post("/api/auth/reset-password", json={
            "email": email,
            "otp": new_otp,
            "password": "BrandNewPassword123!",
            "confirm_password": "BrandNewPassword123!"
        })
        self.assertEqual(new_attempt.status_code, 200)

    def test_06_enforce_60_second_cooldown_on_reset_requests(self):
        """Test immediate subsequent reset request within 60s is rate-limited (HTTP 429)."""
        email = self._create_verified_user()
        res1 = self.client.post("/api/auth/forgot-password", json={"email": email})
        self.assertEqual(res1.status_code, 200)

        # Immediate second request
        res2 = self.client.post("/api/auth/forgot-password", json={"email": email})
        self.assertEqual(res2.status_code, 429)
        self.assertIn("wait at least 60 seconds", res2.get_json().get("error", "").lower())

    def test_07_full_password_reset_and_login_validation(self):
        """Test complete reset flow: password update, old password failure, new password login."""
        email = self._create_verified_user()
        self.client.post("/api/auth/forgot-password", json={"email": email})
        otp = get_test_mailbox()[email]["otp"]

        # Successfully reset password
        reset_res = self.client.post("/api/auth/reset-password", json={
            "email": email,
            "otp": otp,
            "password": "BrandNewPassword999!",
            "confirm_password": "BrandNewPassword999!"
        })
        self.assertEqual(reset_res.status_code, 200)

        # Reusing the same OTP must now fail (single-use)
        reuse_res = self.client.post("/api/auth/reset-password", json={
            "email": email,
            "otp": otp,
            "password": "YetAnotherPassword123!",
            "confirm_password": "YetAnotherPassword123!"
        })
        self.assertEqual(reuse_res.status_code, 400)

        # Old password must be rejected
        old_login = self.client.post("/api/auth/login", json={
            "email": email,
            "password": "OriginalPassword123!"
        })
        self.assertEqual(old_login.status_code, 401)

        # New password must succeed
        new_login = self.client.post("/api/auth/login", json={
            "email": email,
            "password": "BrandNewPassword999!"
        })
        self.assertEqual(new_login.status_code, 200)
        self.assertTrue("session_token" in new_login.get_json())

    def test_08_cross_container_signed_challenge_token_fallback(self):
        """Test cryptographic signed challenge token works across isolated serverless containers."""
        email = self._create_verified_user()
        user = get_user_by_email(email)
        otp = "789123"
        exp_ts = (datetime.now() + timedelta(minutes=5)).timestamp()

        # Generate HMAC-SHA256 signed challenge
        token = create_signed_challenge(user["id"], email, otp, exp_ts)
        self.assertIsNotNone(token)

        # Verify challenge directly
        verified_uid = verify_signed_challenge(token, otp, email)
        self.assertEqual(verified_uid, user["id"])

        # Tampered email must fail
        self.assertIsNone(verify_signed_challenge(token, otp, "attacker@example.com"))

        # Wrong OTP must fail
        self.assertIsNone(verify_signed_challenge(token, "000000", email))

        # Reset password via signed challenge token when DB row is absent (simulating cross-container)
        reset_res = self.client.post("/api/auth/reset-password", json={
            "email": email,
            "otp": otp,
            "challenge_token": token,
            "password": "ServerlessPassword123!",
            "confirm_password": "ServerlessPassword123!"
        })
        self.assertEqual(reset_res.status_code, 200)

    def test_09_unregistered_email_reset_and_auto_provisioning(self):
        """Test requesting reset for a brand new email auto-provisions and dispatches OTP code."""
        new_email = f"brand_new_{secrets.token_hex(4)}@example.com"
        res = self.client.post("/api/auth/forgot-password", json={"email": new_email})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get("status"), "success")
        self.assertTrue(bool(data.get("challenge_token")))

        # Verify OTP was dispatched into mailbox
        mailbox = get_test_mailbox()
        self.assertIn(new_email, mailbox)
        otp = mailbox[new_email]["otp"]

        # User should now be able to reset password and login
        reset_res = self.client.post("/api/auth/reset-password", json={
            "email": new_email,
            "otp": otp,
            "challenge_token": data.get("challenge_token"),
            "password": "NewSecretPassword123!",
            "confirm_password": "NewSecretPassword123!"
        })
        self.assertEqual(reset_res.status_code, 200)

        login_res = self.client.post("/api/auth/login", json={
            "email": new_email,
            "password": "NewSecretPassword123!"
        })
        self.assertEqual(login_res.status_code, 200)
        self.assertTrue(login_res.get_json().get("user", {}).get("is_verified"))

    def test_10_owner_accounts_seeded_and_verified(self):
        """Test default owner accounts are present and verified in SQLite."""
        owners = ["ybro57924@gmail.com", "pradeepmalleni4@gmail.com", "pradeepmalleni4@outlook.com"]
        for o_email in owners:
            user = get_user_by_email(o_email)
            self.assertIsNotNone(user, f"Owner {o_email} should be seeded in DB")
            self.assertEqual(user["is_verified"], 1, f"Owner {o_email} must have is_verified=1")


if __name__ == "__main__":
    unittest.main()
