#!/usr/bin/env python3
"""
Test Suite for MOVAni Movie Catalogue Service & AllMoviesHub Integration
Verifies:
- AllMoviesHub taxonomy discovery: Bollywood, Hollywood Hindi Dubbed, South Indian, Regional, Dual Audio
- Multi-audio & dub tagging (has_hindi_dub, has_english_dub, has_kannada_audio, audio_tracks)
- Strict distinction between catalogue discovery and verified direct media playback
- 7-slot backend source registry with authentic fields, no phantom sources
- Real-time source verification endpoint
- Dynamic catalog integration and /api/catalog/<id> resolution
- Non-regression across Kannada cinema, Anime catalogue, Auth, and Player services
"""

import unittest
from backend.app import app
from backend.database import init_db, get_movie_item, get_movies_catalog, save_movie_item
from backend.movie_service import movie_service, CURATED_MOVIES_SEED


class TestAllMoviesHubIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = app.test_client()

    def test_movies_catalog_endpoint_structure(self):
        """Verify GET /api/movies/catalog returns paginated response with provenance and multi-audio tags."""
        res = self.client.get("/api/movies/catalog?page=1&limit=10")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("results", data)
        self.assertIn("page", data)
        self.assertIn("total_results", data)
        self.assertIn("provenance", data)
        self.assertGreater(data["total_results"], 0)
        self.assertLessEqual(len(data["results"]), 10)

        # Validate item schema
        item = data["results"][0]
        self.assertIn("id", item)
        self.assertIn("title", item)
        self.assertIn("poster", item)
        self.assertIn("genres", item)
        self.assertIn("score", item)
        self.assertIn("type", item)
        self.assertEqual(item["type"], "movies")
        self.assertIn("has_hindi_dub", item)
        self.assertIn("has_english_dub", item)
        self.assertIn("audio_tracks", item)
        self.assertIn("dubs", item)
        self.assertIn("subs", item)

    def test_allmovieshub_categories_endpoint(self):
        """Verify GET /api/movies/categories returns distinct categories with descriptions and badges."""
        res = self.client.get("/api/movies/categories")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("categories", data)
        self.assertIsInstance(data["categories"], list)
        self.assertGreater(len(data["categories"]), 4)

        cat_ids = [c["id"] for c in data["categories"]]
        self.assertIn("bollywood", cat_ids)
        self.assertIn("hollywood_hindi", cat_ids)
        self.assertIn("kannada", cat_ids)
        self.assertIn("dual_audio", cat_ids)
        self.assertIn("playable", cat_ids)

    def test_category_filtering_bollywood(self):
        """Verify filtering for Bollywood Hindi cinema blockbusters."""
        res = self.client.get("/api/movies/catalog?category=bollywood")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreater(data["total_results"], 0)
        for item in data["results"]:
            self.assertEqual(item.get("original_language"), "hi")

    def test_category_filtering_hollywood_hindi_dual_audio(self):
        """Verify filtering for Hollywood Hindi Dubbed / Dual Audio releases."""
        res = self.client.get("/api/movies/catalog?category=hollywood_hindi")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreater(data["total_results"], 0)
        for item in data["results"]:
            self.assertEqual(item.get("has_hindi_dub"), 1)
            self.assertTrue(item.get("original_language") == "en" or item.get("has_english_dub") == 1)

    def test_category_filtering_south_indian_kannada(self):
        """Verify filtering for authentic Kannada Cinema titles."""
        res = self.client.get("/api/movies/catalog?category=kannada")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreater(data["total_results"], 0)
        for item in data["results"]:
            self.assertTrue(item.get("original_language") == "kn" or item.get("has_kannada_audio") == 1)

    def test_multi_audio_dual_audio_tagging(self):
        """Verify Dual Audio & Multi-Audio tagging."""
        res = self.client.get("/api/movies/catalog?category=dual_audio")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreater(data["total_results"], 0)
        for item in data["results"]:
            self.assertEqual(item.get("has_hindi_dub"), 1)
            self.assertTrue(item.get("has_english_dub") == 1 or item.get("has_kannada_audio") == 1)

    def test_movie_details_endpoint(self):
        """Verify GET /api/movies/<movie_id> returns complete movie details."""
        res = self.client.get("/api/movies/movie-1075676")
        self.assertEqual(res.status_code, 200)
        item = res.get_json()
        self.assertEqual(item.get("id"), "movie-1075676")
        self.assertIn("Stree 2", item.get("title"))
        self.assertIn("audio_tracks", item)
        self.assertIn("sources", item)
        self.assertIsInstance(item["sources"], list)

    def test_backend_source_registry_schema_and_slots(self):
        """
        Verify GET /api/movies/<movie_id>/sources adheres strictly to Section 4:
        - movie_id and source_id
        - provider_name and official_source_page
        - media_url where authorized
        - rights or licence status
        - supported format and languages
        - last_verification_time
        - playback_status and error details
        """
        res = self.client.get("/api/movies/movie-1075676/sources")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("sources", data)
        self.assertIn("total_sources", data)
        self.assertGreater(data["total_sources"], 0)

        slots_seen = set()
        for src in data["sources"]:
            self.assertEqual(src["movie_id"], "movie-1075676")
            self.assertIn("source_id", src)
            self.assertIn("slot_number", src)
            self.assertIn(src["slot_number"], range(1, 8))
            self.assertNotIn(src["slot_number"], slots_seen, "Duplicate slot number detected")
            slots_seen.add(src["slot_number"])
            self.assertIn("provider_name", src)
            self.assertIn("official_source_page", src)
            self.assertIn("rights_status", src)
            self.assertIn("supported_format", src)
            self.assertIn("audio_languages", src)
            self.assertIn("subtitles", src)
            self.assertIn("last_verification_time", src)
            self.assertIn("playback_status", src)

    def test_real_playable_vs_catalogue_distinction(self):
        """
        Verify strict distinction between catalogue discovery and verified direct media playback:
        - Open public domain/CC movie: is_playable=1, direct media_url, verified_playable
        - Copyright-protected commercial film: is_playable=0, media_url=None, official_link_only with explanation
        """
        # 1. Verified Playable Open Title (Scarlet Street)
        res_open = self.client.get("/api/movies/open_scarlet_street_1945")
        self.assertEqual(res_open.status_code, 200)
        open_item = res_open.get_json()
        self.assertEqual(open_item.get("is_playable"), 1)
        self.assertIsNotNone(open_item.get("media_url"))
        self.assertTrue(open_item["media_url"].startswith("http"))
        self.assertEqual(open_item.get("playback_status"), "verified_playable")

        res_open_sources = self.client.get("/api/movies/open_scarlet_street_1945/sources")
        open_sources = res_open_sources.get_json()["sources"]
        direct_src = next((s for s in open_sources if s.get("slot_number") == 1), None)
        self.assertIsNotNone(direct_src)
        self.assertEqual(direct_src["rights_status"], "playable")
        self.assertEqual(direct_src["playback_status"], "verified_playable")
        self.assertIsNotNone(direct_src["media_url"])

        # 2. Commercial DRM-protected title (Stree 2)
        res_comm = self.client.get("/api/movies/movie-1075676")
        self.assertEqual(res_comm.status_code, 200)
        comm_item = res_comm.get_json()
        self.assertEqual(comm_item.get("is_playable"), 0)
        self.assertIsNone(comm_item.get("media_url"))
        self.assertEqual(comm_item.get("playback_status"), "official_link_only")

        res_comm_sources = self.client.get("/api/movies/movie-1075676/sources")
        comm_sources = res_comm_sources.get_json()["sources"]
        official_portal_src = next((s for s in comm_sources if s.get("rights_status") == "official_link_only"), None)
        self.assertIsNotNone(official_portal_src)
        self.assertIsNone(official_portal_src["media_url"])
        self.assertIn("restricted by licensing", official_portal_src["error_details"].lower())

    def test_movie_source_verification_endpoint(self):
        """Verify POST /api/movies/<movie_id>/verify executes real-time status check."""
        res = self.client.post("/api/movies/open_scarlet_street_1945/verify")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("verified"))
        self.assertTrue(data.get("is_playable"))
        self.assertEqual(data.get("playback_status"), "verified_playable")

        res_comm = self.client.post("/api/movies/movie-1075676/verify")
        self.assertEqual(res_comm.status_code, 200)
        data_comm = res_comm.get_json()
        self.assertTrue(data_comm.get("verified"))
        self.assertFalse(data_comm.get("is_playable"))
        self.assertEqual(data_comm.get("playback_status"), "official_link_only")

    def test_movie_search_and_deduplication(self):
        """Verify high-speed keyword search across titles and studios."""
        res = self.client.get("/api/movies/search?q=Deadpool")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreaterEqual(data["total_results"], 1)
        titles = [i["title"].lower() for i in data["results"]]
        self.assertTrue(any("deadpool" in t for t in titles))

    def test_catalog_title_id_cross_resolution(self):
        """Verify that general /api/catalog/<title_id> resolves movies_catalog items."""
        res = self.client.get("/api/catalog/movie-1075676")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get("id"), "movie-1075676")
        self.assertIn("Stree 2", data.get("title"))

    def test_non_regression_kannada_anime_and_auth(self):
        """Verify existing Kannada, Anime, and Auth APIs remain completely operational."""
        # Kannada API
        res_kn = self.client.get("/api/kannada/catalog?limit=5")
        self.assertEqual(res_kn.status_code, 200)

        # Anime API
        res_an = self.client.get("/api/anime/catalog?limit=5")
        self.assertEqual(res_an.status_code, 200)

        # Auth status check
        res_auth = self.client.get("/api/auth/me")
        self.assertIn(res_auth.status_code, [200, 401])


if __name__ == "__main__":
    unittest.main()
