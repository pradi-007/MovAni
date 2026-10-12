#!/usr/bin/env python3
"""
Unit tests for Universal Master OTT module and API endpoints.
"""

import unittest
from backend.app import app
from backend.universal_ott import (
    generate_ott_session,
    get_universal_playback_manifest,
    get_master_ott_status
)


class TestUniversalOttModule(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_generate_ott_session(self):
        session = generate_ott_session(user_id="tester@movani.io")
        self.assertEqual(session["status"], "success")
        self.assertIn("session_token", session)
        self.assertTrue(session["features"]["ad_free"])

    def test_get_playback_manifest(self):
        manifest = get_universal_playback_manifest(content_id="84958", season=1, episode=1, audio_lang="hi")
        self.assertEqual(manifest["status"], "available")
        self.assertTrue(manifest["content_available"])
        self.assertTrue(manifest["ad_free"])
        self.assertEqual(manifest["ads_blocked"], 100)
        self.assertIn("playback_url", manifest)
        self.assertGreaterEqual(len(manifest["audio_tracks"]), 1)
        self.assertTrue(len(manifest["subtitles"]) >= 2)

    def test_ott_session_api_endpoint(self):
        res = self.client.get("/api/ott/session")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertIn("session_token", data)

    def test_ott_playback_api_endpoint(self):
        res = self.client.get("/api/ott/playback/cm-reze?season=1&episode=2&audio=ja")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "available")
        self.assertTrue(data["content_available"])
        self.assertTrue(data["ad_free"])
        self.assertIn("playback_url", data)

    def test_ott_status_endpoint(self):
        res = self.client.get("/api/ott/status")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "operational")
        self.assertIn("Netflix", data["all_platforms"])


if __name__ == "__main__":
    unittest.main()
