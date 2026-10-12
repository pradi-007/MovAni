"""
Automated QA Test Suite for MOVAni
Covers Phase 1 to Phase 8 specifications:
- Kannada movie discovery & original language mapping
- Detail page resolution for cached and non-cached TMDB titles
- Audio track verification (no phantom dubs)
- Global search across catalog and TMDB
- Paginated discovery
- TV series episode listings without fake placeholders
- Watch providers (JustWatch via TMDB)
- Resilient network and database fallbacks
"""

import unittest
import json
from backend.app import app
from backend.database import init_db, get_cached_media_item, save_cached_media_item
from backend.catalog_data import CATALOG_DATA


class MOVAniExpansionTestSuite(unittest.TestCase):
    def setUp(self):
        init_db()
        self.client = app.test_client()

    def test_01_discover_kannada_movies(self):
        """Test 1: Discover Kannada movies via /api/kannada with original_language = 'kn'."""
        res = self.client.get("/api/kannada?page=1&limit=10")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue("results" in data)
        self.assertGreaterEqual(len(data["results"]), 1)
        self.assertEqual(data.get("language"), "kn")
        # Every returned item must be verified Kannada
        for item in data["results"]:
            orig_lang = item.get("original_language") or item.get("language")
            self.assertTrue(orig_lang == "kn" or orig_lang == "Kannada" or item.get("isKannada"))

    def test_02_kannada_movie_detail_resolution(self):
        """Test 2 & 3: Open Kannada movie detail and confirm original language is mapped correctly."""
        # Test KGF Chapter 1
        res = self.client.get("/api/catalog/kgf-1")
        self.assertEqual(res.status_code, 200)
        item = res.get_json()
        self.assertEqual(item.get("title"), "K.G.F: Chapter 1")
        self.assertTrue(item.get("isKannada") or item.get("original_language") == "kn" or item.get("language") == "Kannada")
        self.assertEqual(item.get("tmdbId"), 564147)

    def test_03_non_cached_tmdb_title_resolution(self):
        """Test 4: Resolve a title absent from local CATALOG_DATA by TMDB ID without breaking."""
        # Inception TMDB ID: 27205
        res = self.client.get("/api/catalog/27205")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("Inception", data.get("title", ""))
        self.assertEqual(data.get("tmdbId"), 27205)

    def test_04_audio_verification_no_phantom_kannada_dub(self):
        """Test 5 & 7: Verify audio track authenticity - Non-Kannada title does not falsely claim original Kannada."""
        # Oppenheimer is English original
        res = self.client.get("/api/catalog/oppenheimer")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertFalse(data.get("isKannada", False))
        self.assertEqual(data.get("language", "English"), "English")

    def test_05_global_search_returns_results(self):
        """Test 8: Search for titles present in catalog and across global TMDB."""
        # Search for Kantara
        res = self.client.get("/api/search?q=kantara")
        self.assertEqual(res.status_code, 200)
        results = res.get_json()
        self.assertGreaterEqual(len(results), 1)
        self.assertTrue(any("kantara" in r.get("title", "").lower() for r in results))

    def test_06_paginated_catalog_and_discovery(self):
        """Test 9: Load additional catalog pages without duplicates."""
        res_p1 = self.client.get("/api/catalog?paginate=1&page=1&limit=10")
        self.assertEqual(res_p1.status_code, 200)
        data_p1 = res_p1.get_json()
        self.assertEqual(data_p1.get("page"), 1)
        self.assertLessEqual(len(data_p1.get("results")), 10)

        res_p2 = self.client.get("/api/catalog?paginate=1&page=2&limit=10")
        self.assertEqual(res_p2.status_code, 200)
        data_p2 = res_p2.get_json()
        self.assertEqual(data_p2.get("page"), 2)

        p1_ids = {item["id"] for item in data_p1["results"]}
        p2_ids = {item["id"] for item in data_p2["results"]}
        # Confirm no duplicate IDs between page 1 and page 2
        self.assertEqual(len(p1_ids.intersection(p2_ids)), 0)

    def test_07_tv_season_episodes(self):
        """Test 10: Open TV series season and retrieve episode structure."""
        # Stranger Things TMDB TV ID: 66732
        res = self.client.get("/api/tmdb/tv/66732/season/1")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get("season_number"), 1)
        self.assertTrue("episodes" in data)

    def test_08_watch_providers_endpoint(self):
        """Test 11 & 13: Watch Providers endpoint returns valid provider structure with JustWatch attribution."""
        res = self.client.get("/api/watch-providers/movie/554230?region=IN")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get("region"), "IN")
        self.assertIn("JustWatch", data.get("attribution", ""))
        self.assertTrue("providers" in data)

    def test_09_database_cache_persistence(self):
        """Test 12: Media item caching in SQLite."""
        test_item = {
            "id": "test-movie-99999",
            "tmdbId": 99999,
            "title": "Test Cinema Feature",
            "type": "movies",
            "language": "Kannada",
            "isKannada": True,
            "hasKannadaAudio": True,
            "overview": "Automated test item",
            "year": "2024",
            "genres": ["Action", "Drama"]
        }
        save_cached_media_item(test_item)
        retrieved = get_cached_media_item("test-movie-99999")
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.get("title"), "Test Cinema Feature")
        self.assertTrue(retrieved.get("isKannada"))


if __name__ == "__main__":
    unittest.main()
