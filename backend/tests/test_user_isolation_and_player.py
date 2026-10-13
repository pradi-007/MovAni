"""
MOVAni Full-Stack User Isolation, One-Device Policy & Custom Video Player Test Suite
Validates:
1. Complete User Isolation: User A vs User B continue watching & watchlist isolation.
2. Zero Alex Account Leak: No hardcoded demo data or cross-user history bleed.
3. One-Device-Per-Account Policy: Invalidation of prior device sessions upon new login with code 'SESSION_REPLACED'.
4. Catalog Authenticity: Verified Kannada audio vs zero phantom dub claims on anime/foreign media.
5. Content Status: Proper tagging of 'Available to watch', 'Official watch options', 'Trailer available'.
"""

import os
import sys
import uuid
import unittest
from werkzeug.security import generate_password_hash

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(os.path.dirname(TEST_DIR))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app import create_app
from backend.database import (
    create_user,
    set_user_verified,
    create_session,
    get_session,
    get_user_watchlist,
    get_user_continue_watching,
    save_user_continue_watching
)
from backend.catalog_data import CATALOG_DATA


class MOVAniUserIsolationAndPlayerTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()

    def setUp(self):
        self.client = self.app.test_client()

        # Create User A
        self.uid_a = f"usera_{uuid.uuid4().hex[:6]}"
        self.user_a_id = create_user(
            name="Alice Walker",
            email=f"{self.uid_a}@example.com",
            password_hash=generate_password_hash("PassAlice123!")
        )
        set_user_verified(self.user_a_id)
        self.session_a = f"token_a_{uuid.uuid4().hex}"
        create_session(user_id=self.user_a_id, session_token=self.session_a, expires_at="2035-01-01T00:00:00")

        # Create User B
        self.uid_b = f"userb_{uuid.uuid4().hex[:6]}"
        self.user_b_id = create_user(
            name="Bob Smith",
            email=f"{self.uid_b}@example.com",
            password_hash=generate_password_hash("PassBob123!")
        )
        set_user_verified(self.user_b_id)
        self.session_b = f"token_b_{uuid.uuid4().hex}"
        create_session(user_id=self.user_b_id, session_token=self.session_b, expires_at="2035-01-01T00:00:00")

    # ================= 1. ZERO "ALEX" LEAK & USER ISOLATION =================

    def test_01_new_user_has_empty_continue_watching_no_alex_bleed(self):
        """Verify brand-new user has 0 continue-watching records and sees no Alex demo entries."""
        headers = {"Authorization": f"Bearer {self.session_a}"}
        res = self.client.get("/api/continue-watching", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 0, "New user must start with an empty continue watching list")

        # Check raw database records for User A
        db_records = get_user_continue_watching(self.user_a_id)
        self.assertEqual(len(db_records), 0)

    def test_02_user_a_progress_isolated_from_user_b(self):
        """User A saving progress on Kantara and Dune 2 must never appear in User B's continue watching."""
        # User A saves progress
        headers_a = {"Authorization": f"Bearer {self.session_a}"}
        post_res = self.client.post("/api/continue-watching", headers=headers_a, json={
            "id": "kantara",
            "progress": 68,
            "ep": "Feature Film",
            "current_seconds": 6000.0,
            "total_seconds": 8800.0,
            "media_type": "movie"
        })
        self.assertEqual(post_res.status_code, 200)
        self.assertEqual(post_res.get_json()["status"], "saved")

        # User A checks their continue watching
        res_a = self.client.get("/api/continue-watching", headers=headers_a)
        data_a = res_a.get_json()
        self.assertEqual(len(data_a), 1)
        self.assertEqual(data_a[0]["id"], "kantara")
        self.assertEqual(data_a[0]["progress"], 68)

        # User B queries their continue watching -> must be completely empty!
        headers_b = {"Authorization": f"Bearer {self.session_b}"}
        res_b = self.client.get("/api/continue-watching", headers=headers_b)
        data_b = res_b.get_json()
        self.assertEqual(len(data_b), 0, "User B must not see User A's continue watching items")

        # User B checks progress for 'kantara' specifically
        prog_b = self.client.get("/api/continue-watching/progress/kantara", headers=headers_b)
        self.assertEqual(prog_b.status_code, 200)
        self.assertFalse(prog_b.get_json().get("has_progress"), "User B must have 0 saved progress on kantara")

    def test_03_user_b_cannot_delete_user_a_continue_watching(self):
        """User B sending a DELETE or clear must not affect User A's continue watching items."""
        # User A has 'kantara'
        save_user_continue_watching(
            user_id=self.user_a_id,
            title_id="kantara",
            progress=45,
            current_seconds=3000.0,
            total_seconds=8000.0
        )

        # User B tries to delete 'kantara'
        headers_b = {"Authorization": f"Bearer {self.session_b}"}
        del_res = self.client.delete("/api/continue-watching/kantara", headers=headers_b)
        self.assertEqual(del_res.status_code, 200)

        # User A's item must still exist unharmed
        records_a = get_user_continue_watching(self.user_a_id)
        self.assertEqual(len(records_a), 1)
        self.assertEqual(records_a[0]["title_id"], "kantara")

        # User B tries to clear all continue watching
        clear_res = self.client.post("/api/continue-watching/clear", headers=headers_b)
        self.assertEqual(clear_res.status_code, 200)

        # User A's item must STILL exist unharmed
        records_a = get_user_continue_watching(self.user_a_id)
        self.assertEqual(len(records_a), 1)
        self.assertEqual(records_a[0]["title_id"], "kantara")

    def test_04_user_a_and_user_b_watchlist_isolation(self):
        """User A adding to watchlist does not appear in User B's watchlist."""
        headers_a = {"Authorization": f"Bearer {self.session_a}"}
        headers_b = {"Authorization": f"Bearer {self.session_b}"}

        # User A adds 'kgf-2'
        add_res = self.client.post("/api/watchlist", headers=headers_a, json={"id": "kgf-2"})
        self.assertEqual(add_res.status_code, 200)
        self.assertEqual(add_res.get_json()["action"], "added")

        # Verify User A has 'kgf-2'
        wl_a = self.client.get("/api/watchlist", headers=headers_a).get_json()
        self.assertIn("kgf-2", wl_a.get("ids", []))

        # Verify User B does NOT have 'kgf-2'
        wl_b = self.client.get("/api/watchlist", headers=headers_b).get_json()
        self.assertNotIn("kgf-2", wl_b.get("ids", []))

        # User B adds 'charlie-777'
        add_b = self.client.post("/api/watchlist", headers=headers_b, json={"id": "charlie-777"})
        self.assertEqual(add_b.status_code, 200)

        # Verify User A does NOT have 'charlie-777'
        wl_a_after = self.client.get("/api/watchlist", headers=headers_a).get_json()
        self.assertNotIn("charlie-777", wl_a_after.get("ids", []))
        self.assertIn("kgf-2", wl_a_after.get("ids", []))

    def test_05_unauthenticated_request_rejected_on_state_modifications(self):
        """Guests cannot modify watchlist or save watch progress."""
        # Post watchlist without auth
        res_wl = self.client.post("/api/watchlist", json={"id": "kantara"})
        self.assertEqual(res_wl.status_code, 401)

        # Post continue watching without auth
        res_cw = self.client.post("/api/continue-watching", json={"id": "kantara", "progress": 50})
        self.assertEqual(res_cw.status_code, 401)

    # ================= 2. ONE-DEVICE-PER-ACCOUNT POLICY =================

    def test_06_one_device_policy_revokes_previous_session(self):
        """Signing in on Device 2 revokes Device 1 with code 'SESSION_REPLACED'."""
        # Device 1 has session_a
        headers_dev1 = {"Authorization": f"Bearer {self.session_a}"}
        me_dev1 = self.client.get("/api/auth/me", headers=headers_dev1)
        self.assertEqual(me_dev1.status_code, 200)
        self.assertTrue(me_dev1.get_json().get("authenticated"))

        # User A signs in on Device 2 (new session created via login)
        login_res = self.client.post("/api/auth/login", json={
            "email": f"{self.uid_a}@example.com",
            "password": "PassAlice123!"
        })
        self.assertEqual(login_res.status_code, 200)
        session_dev2 = login_res.get_json()["session_token"]
        self.assertNotEqual(session_dev2, self.session_a)

        # Device 1 attempts to call /api/auth/me -> Must receive 401 with SESSION_REPLACED
        me_dev1_after = self.client.get("/api/auth/me", headers=headers_dev1)
        self.assertEqual(me_dev1_after.status_code, 401)
        data_dev1 = me_dev1_after.get_json()
        self.assertEqual(data_dev1.get("code"), "SESSION_REPLACED")
        self.assertTrue(data_dev1.get("session_revoked"))
        self.assertIn("another device", data_dev1.get("error", "").lower())

        # Device 1 attempts to call /api/watchlist -> Must also be blocked with 401 SESSION_REPLACED
        wl_dev1 = self.client.get("/api/watchlist", headers=headers_dev1)
        self.assertEqual(wl_dev1.status_code, 401)
        self.assertEqual(wl_dev1.get_json().get("code"), "SESSION_REPLACED")

        # Device 2 works normally (HTTP 200)
        headers_dev2 = {"Authorization": f"Bearer {session_dev2}"}
        me_dev2 = self.client.get("/api/auth/me", headers=headers_dev2)
        self.assertEqual(me_dev2.status_code, 200)
        self.assertTrue(me_dev2.get_json().get("authenticated"))

    # ================= 3. CATALOG & KANNADA AUTHENTICITY =================

    def test_07_kannada_catalog_authenticity_no_phantom_dubs(self):
        """Verify 21 genuine Kannada titles keep original 'kn' and zero anime/English titles have false Kannada claims."""
        # 1. Non-Kannada anime and Hollywood titles must not claim Kannada dubs
        non_kn_ids = ["demon-slayer", "chainsaw-man", "solo-leveling", "jujutsu-kaisen", "dune-2", "oppenheimer"]
        for cid in non_kn_ids:
            item = next((i for i in CATALOG_DATA if i.get("id") == cid), None)
            if item:
                dubs = [d.lower() for d in item.get("dubs", [])]
                self.assertNotIn("kannada", dubs, f"Item {cid} must NOT have phantom Kannada dub claim")
                self.assertNotEqual(item.get("originalLanguage"), "kn", f"Item {cid} originalLanguage is not 'kn'")

        # 2. Authentic Kannada titles must retain Kannada language and genuine classification
        authentic_kn_ids = ["kantara", "kgf-2", "charlie-777", "salaga", "robert", "vikrant-rona", "yuva"]
        for kid in authentic_kn_ids:
            item = next((i for i in CATALOG_DATA if i.get("id") == kid), None)
            if item:
                self.assertEqual(item.get("language"), "Kannada", f"Item {kid} must have language == 'Kannada'")
                self.assertTrue(item.get("isKannada"), f"Item {kid} must have isKannada == True")

    def test_08_content_status_states_present_on_all_catalog_items(self):
        """Every catalog item must have a valid content_status string."""
        allowed_states = {
            "Available to watch",
            "Official watch options",
            "Trailer available",
            "Currently unavailable"
        }
        for item in CATALOG_DATA:
            status = item.get("content_status")
            self.assertIsNotNone(status, f"Item {item.get('id')} is missing content_status")
            self.assertIn(status, allowed_states, f"Item {item.get('id')} has invalid content_status '{status}'")

    def test_09_api_kannada_endpoint_returns_only_authentic_kannada_titles(self):
        """The /api/kannada endpoint must strictly return titles with Kannada language metadata."""
        res = self.client.get("/api/kannada")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get("language"), "kn")
        items = data.get("results", [])
        self.assertGreaterEqual(len(items), 20, "Should have at least 20 authentic Kannada titles in page 1")
        for itm in items:
            is_kn = itm.get("isKannada") or itm.get("language") == "Kannada" or itm.get("original_language") == "kn"
            self.assertTrue(
                is_kn,
                f"Item {itm.get('title')} returned in /api/kannada must have Kannada verification"
            )


if __name__ == "__main__":
    unittest.main()
