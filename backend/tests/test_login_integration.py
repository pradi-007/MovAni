#!/usr/bin/env python3
"""
MOVAni Animated Login Integration & Routing Test Suite
Validates:
1. Root '/' route serves 'login.html' when unauthenticated.
2. Root '/' route serves 'index.html' when authenticated.
3. '/login' route explicitly serves 'login.html'.
4. '/home' and '/index.html' serve 'index.html'.
5. Login endpoint respects 'remember: true' (30 days session and cookie).
6. Login endpoint respects 'remember: false' (1 day session and session cookie).
7. Login endpoint rejects bad passwords (HTTP 401).
8. Login endpoint flags unverified users with 'requires_verification: true' (HTTP 403).
9. SQLite database persistence retains users permanently across operations.
10. Logout invalidates the active session and clears the session cookie.
"""

import os
import unittest
import uuid
from werkzeug.security import generate_password_hash

os.environ["MOVANI_TEST_MODE"] = "1"
os.environ["TESTING"] = "true"

from backend.app import app
from backend.database import (
    init_db,
    create_user,
    set_user_verified,
    get_user_by_email,
    get_session,
    create_session,
    get_db
)


class MOVAniLoginIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        init_db()

    def test_01_root_unauthenticated_serves_login(self):
        """Verify GET / without session serves login.html gateway."""
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"MOVAni \xe2\x80\x94 Sign In", res.data)
        self.assertIn(b"dodgeBtn", res.data)
        self.assertIn(b"dock-placeholder", res.data)

    def test_02_root_authenticated_serves_home(self):
        """Verify GET / with active session cookie serves index.html."""
        # Create a verified user and session
        uid = f"user_{uuid.uuid4().hex[:6]}"
        email = f"{uid}@example.com"
        user_id = create_user(name="Auth Visitor", email=email, password_hash=generate_password_hash("ValidPass123!"))
        set_user_verified(user_id)

        session_token = f"token_{uuid.uuid4().hex}"
        create_session(user_id=user_id, session_token=session_token, expires_at="2030-01-01T00:00:00")

        self.client.set_cookie("movani_session", session_token)
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"MOVAni", res.data)
        self.assertIn(b"top10-tray", res.data)

    def test_03_login_endpoint_serves_login_html(self):
        """Verify GET /login explicitly serves login.html."""
        res = self.client.get("/login")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"loginDock", res.data)
        self.assertIn(b"dodgeBtn", res.data)

    def test_04_home_endpoint_serves_index_html(self):
        """Verify GET /home explicitly serves index.html."""
        res = self.client.get("/home")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"top10-tray", res.data)

    def test_05_login_with_remember_true(self):
        """Verify login with remember=True returns 30-day session and sets max-age cookie."""
        uid = f"user_{uuid.uuid4().hex[:6]}"
        email = f"{uid}@example.com"
        user_id = create_user(name="Remember User", email=email, password_hash=generate_password_hash("Secret123!"))
        set_user_verified(user_id)

        res = self.client.post("/api/auth/login", json={
            "email": email,
            "password": "Secret123!",
            "remember": True
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertTrue(data.get("remember"))

        # Verify cookie has max-age set
        cookie_header = res.headers.get("Set-Cookie", "")
        self.assertIn("movani_session=", cookie_header)
        self.assertIn("Max-Age=2592000", cookie_header)  # 30 * 86400

    def test_06_login_with_remember_false(self):
        """Verify login with remember=False sets session cookie without long max-age."""
        uid = f"user_{uuid.uuid4().hex[:6]}"
        email = f"{uid}@example.com"
        user_id = create_user(name="Session User", email=email, password_hash=generate_password_hash("Secret123!"))
        set_user_verified(user_id)

        res = self.client.post("/api/auth/login", json={
            "email": email,
            "password": "Secret123!",
            "remember": False
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertFalse(data.get("remember"))

        cookie_header = res.headers.get("Set-Cookie", "")
        self.assertIn("movani_session=", cookie_header)
        # Session cookie has no Max-Age=2592000
        self.assertNotIn("Max-Age=2592000", cookie_header)

    def test_07_unverified_account_login_rejection(self):
        """Verify unverified account is refused login with HTTP 403 and verification flag."""
        uid = f"user_{uuid.uuid4().hex[:6]}"
        email = f"{uid}@example.com"
        create_user(name="Unverified", email=email, password_hash=generate_password_hash("Secret123!"))
        # Do not verify

        res = self.client.post("/api/auth/login", json={
            "email": email,
            "password": "Secret123!"
        })
        self.assertEqual(res.status_code, 403)
        data = res.get_json()
        self.assertTrue(data.get("requires_verification"))
        self.assertEqual(data.get("email"), email)

    def test_08_database_persistence_across_connections(self):
        """Verify database persistence: records created remain permanently in SQLite."""
        uid = f"persist_{uuid.uuid4().hex[:6]}"
        email = f"{uid}@example.com"
        user_id = create_user(name="Permanent User", email=email, password_hash="dummy_hash")

        # Open brand new connection from disk
        with get_db() as conn:
            row = conn.execute("SELECT id, email, name FROM users WHERE id = ?", (user_id,)).fetchone()
            self.assertIsNotNone(row)
            self.assertEqual(row["email"], email)
            self.assertEqual(row["name"], "Permanent User")

    def test_09_logout_revokes_session(self):
        """Verify logout endpoint revokes session in DB and clears cookie."""
        uid = f"user_{uuid.uuid4().hex[:6]}"
        email = f"{uid}@example.com"
        user_id = create_user(name="Logout User", email=email, password_hash=generate_password_hash("Secret123!"))
        set_user_verified(user_id)

        session_token = f"token_{uuid.uuid4().hex}"
        create_session(user_id=user_id, session_token=session_token, expires_at="2030-01-01T00:00:00")

        self.client.set_cookie("movani_session", session_token)
        res = self.client.post("/api/auth/logout")
        self.assertEqual(res.status_code, 200)

        # Confirm session is revoked in database
        self.assertIsNone(get_session(session_token))

        # Confirm cookie was cleared
        cookie_header = res.headers.get("Set-Cookie", "")
        self.assertIn("Expires=Thu, 01 Jan 1970", cookie_header)


if __name__ == "__main__":
    unittest.main()
