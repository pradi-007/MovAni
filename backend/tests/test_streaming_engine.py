"""
Unit & Integration Test Suite for MOVAni Streaming Engine & Open Film Library
Tests the 7 provider source adapters, digital rights evaluation, authentic Kannada audio validation,
SSRF security protection, source health diagnostics, and large-scale catalog search & pagination.
"""

import unittest
import json
from backend.app import app
from backend.streaming.registry import streaming_registry
from backend.streaming.rights import RightsEngine
from backend.streaming.health import SSRFSecurityGuard, SourceHealthMonitor
from backend.streaming.resolver import StreamResolver
from backend.database import get_open_media_item, get_open_media_stats, get_open_media_catalog


class MOVAniStreamingEngineTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = app.test_client()

    # ================= 1. PROVIDER REGISTRY & 7 SLOTS =================

    def test_01_all_seven_provider_slots_configured(self):
        """Verify that all 7 provider slots are uniquely registered and configured."""
        slots = streaming_registry.get_all_slots_info()
        self.assertEqual(len(slots), 7, "Registry must maintain exactly 7 configurable slots.")
        
        slot_numbers = [s["slot_number"] for s in slots]
        self.assertEqual(sorted(slot_numbers), [1, 2, 3, 4, 5, 6, 7], "Slot numbers must run 1 to 7.")
        
        # Verify slot names
        slot_names = [s["adapter_name"] for s in slots]
        self.assertIn("kannada_heritage", slot_names)
        self.assertIn("blender_open", slot_names)
        self.assertIn("archive_org", slot_names)
        self.assertIn("wikimedia_commons", slot_names)
        self.assertIn("cinema_showcase", slot_names)
        self.assertIn("licensed_partner", slot_names)
        self.assertIn("official_watch", slot_names)

    def test_02_api_sources_endpoint_returns_seven_slots(self):
        """GET /api/streaming/sources returns the 7 slots."""
        res = self.client.get("/api/streaming/sources")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("total_slots"), 7)
        self.assertEqual(len(data.get("slots", [])), 7)

    # ================= 2. RIGHTS VERIFICATION & KANNADA AUTHENTICITY =================

    def test_03_kannada_audio_verification_separates_original_from_dub(self):
        """Verifies that original Kannada audio and dubbed tracks are strictly distinguished."""
        # Original Kannada item
        kn_orig = {
            "title": "Sati Sulochana",
            "language": "kn",
            "is_original_kannada": 1,
            "verified_audio_tracks": ["Kannada"]
        }
        info_orig = RightsEngine.verify_kannada_content(kn_orig)
        self.assertTrue(info_orig["is_original_kannada"])
        self.assertFalse(info_orig["is_kannada_dubbed"])
        self.assertTrue(info_orig["has_kannada_audio"])
        self.assertIn("Kannada (Original Stereo)", info_orig["verified_audio_tracks"])

        # Dubbed item (English original with verified Kannada audio)
        kn_dub = {
            "title": "Interstellar",
            "language": "en",
            "is_original_kannada": 0,
            "verified_audio_tracks": ["English", "Kannada"]
        }
        info_dub = RightsEngine.verify_kannada_content(kn_dub)
        self.assertFalse(info_dub["is_original_kannada"])
        self.assertTrue(info_dub["is_kannada_dubbed"])
        self.assertTrue(info_dub["has_kannada_audio"])
        self.assertIn("Kannada (Official Dub)", info_dub["verified_audio_tracks"])

        # Non-Kannada item
        non_kn = {
            "title": "Dune",
            "language": "en",
            "verified_audio_tracks": ["English"]
        }
        info_non = RightsEngine.verify_kannada_content(non_kn)
        self.assertFalse(info_non["has_kannada_audio"])

    def test_04_public_domain_rights_evaluation(self):
        """Indian films >60 years old and pre-1929 films are verified as Public Domain."""
        # 1934 Indian Film
        res_status, notes, perm = RightsEngine.evaluate_media_rights({
            "title": "Sati Sulochana",
            "release_year": 1934,
            "country": "IN",
            "media_url": "https://example.com/stream.mp4"
        })
        self.assertEqual(res_status.value, "playable")
        self.assertIn("Indian Copyright Act", notes)

        # 1927 Worldwide Film
        res_status2, notes2, _ = RightsEngine.evaluate_media_rights({
            "title": "Metropolis",
            "release_year": 1927,
            "country": "DE",
            "media_url": "https://example.com/stream.mp4"
        })
        self.assertEqual(res_status2.value, "playable")
        self.assertIn("Worldwide Public Domain", notes2)

    # ================= 3. SSRF SECURITY PROTECTION =================

    def test_05_ssrf_guard_blocks_private_networks_and_metadata(self):
        """Verifies SSRF guard blocks localhost, RFC 1918 private IPs, and cloud metadata endpoints."""
        blocked_urls = [
            "http://127.0.0.1:8080/admin",
            "http://localhost:5000/secret",
            "http://169.254.169.254/latest/meta-data/",
            "http://10.0.0.5/internal",
            "http://192.168.1.1/router",
            "http://172.16.0.10/database",
            "ftp://example.com/file.mp4",
            "file:///etc/passwd"
        ]
        for url in blocked_urls:
            is_safe, reason = SSRFSecurityGuard.is_safe_url(url)
            self.assertFalse(is_safe, f"URL '{url}' must be blocked by SSRF Security Guard.")

        # Valid public video URL
        is_safe_pub, _ = SSRFSecurityGuard.is_safe_url("https://commondatastorage.googleapis.com/sample.mp4")
        self.assertTrue(is_safe_pub)

    # ================= 4. SOURCE HEALTH MONITOR =================

    def test_06_source_health_endpoints(self):
        """GET /api/streaming/source/<id>/health and /api/streaming/health/all."""
        res = self.client.get("/api/streaming/source/blender_open/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("is_healthy"))
        self.assertEqual(data.get("source_id"), "blender_open")

        # Health for all slots
        res_all = self.client.get("/api/streaming/health/all")
        self.assertEqual(res_all.status_code, 200)
        self.assertEqual(res_all.get_json().get("total_slots"), 7)

    # ================= 5. STREAM RESOLUTION & MULTI-SOURCE SWITCHING =================

    def test_07_resolve_blender_open_movie(self):
        """Resolves Sintel to direct 1080p MP4 stream with Creative Commons license info."""
        res = self.client.post("/api/streaming/title/sintel/resolve", json={"slot_number": 2})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["source_id"], "blender_open")
        self.assertEqual(data["slot_number"], 2)
        self.assertTrue(data["is_playable"])
        self.assertTrue(data["stream_url"].startswith("http"))
        self.assertIn("CC BY", data["license_info"]["license_id"])

    def test_08_resolve_kannada_heritage_film(self):
        """Resolves Sati Sulochana (1934) to public domain Kannada stream in Slot 1."""
        res = self.client.post("/api/streaming/title/sati-sulochana-1934/resolve", json={"slot_number": 1})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["slot_number"], 1)
        self.assertEqual(data["source_id"], "kannada_heritage")
        self.assertIn("Kannada", data["audio_language"])

    def test_09_get_title_sources_lists_all_matching_slots(self):
        """GET /api/streaming/title/<id>/sources returns available slots."""
        res = self.client.get("/api/streaming/title/sintel/sources")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(len(data["sources"]), 2)

    # ================= 6. OPEN FILM LIBRARY CATALOG & SEARCH =================

    def test_10_open_library_catalog_pagination_and_facets(self):
        """GET /api/open-library/catalog supports language and faceted filtering."""
        # 1. Total catalog
        res = self.client.get("/api/open-library/catalog?limit=5")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(data["total_records"], 10)
        self.assertEqual(len(data["results"]), 5)

        # 2. Kannada Filter
        res_kn = self.client.get("/api/open-library/catalog?language=kn")
        self.assertEqual(res_kn.status_code, 200)
        data_kn = res_kn.get_json()
        for item in data_kn["results"]:
            self.assertEqual(item["language"], "kn")
            self.assertTrue(item["is_original_kannada"])

        # 3. Creative Commons Filter
        res_cc = self.client.get("/api/open-library/catalog?license=creative_commons")
        self.assertEqual(res_cc.status_code, 200)
        data_cc = res_cc.get_json()
        for item in data_cc["results"]:
            self.assertTrue("CC" in item["license_id"] or "Creative Commons" in item["license_id"])

    def test_11_open_library_item_details_and_rights_evaluation(self):
        """GET /api/open-library/item/<id> returns rich metadata and rights verification."""
        res = self.client.get("/api/open-library/item/sati-sulochana-1934")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["item"]["id"], "sati-sulochana-1934")
        self.assertEqual(data["rights_evaluation"]["status"], "playable")

    def test_12_open_library_stats_returns_live_counts(self):
        """GET /api/open-library/stats returns live aggregate metrics."""
        res = self.client.get("/api/open-library/stats")
        self.assertEqual(res.status_code, 200)
        stats = res.get_json().get("stats", {})
        self.assertGreaterEqual(stats.get("total_records", 0), 10)
        self.assertGreaterEqual(stats.get("playable_records", 0), 10)
        self.assertIn("kn", stats.get("by_language", {}))
        self.assertIn("en", stats.get("by_language", {}))

    def test_13_series_and_episode_endpoints(self):
        """GET /api/streaming/series/<id>/episodes returns per-episode rights status."""
        res = self.client.get("/api/streaming/series/sintel/episodes?season=1")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(data["total_episodes"], 1)
        first_ep = data["episodes"][0]
        self.assertTrue(first_ep["is_playable"])
        self.assertEqual(first_ep["rights_status"], "playable")


if __name__ == "__main__":
    unittest.main()
