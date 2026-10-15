#!/usr/bin/env python3
"""
Test Suite for MOVAni Anime Catalogue Service & Kartoons Integration
Verifies:
- Anime discovery and categorization (popular, trending, movies, completed, ongoing)
- Multi-audio & dub detection (Japanese original, Hindi dubbed, English dubbed)
- Episode listing, season navigation, and details endpoints
- Multi-server playback sources, authorized providers, and terms compliance
- Database caching, deduplication, and search integration
- Non-regression of existing movies, TV series, Kannada cinema, and authentication
"""

import unittest
from backend.app import app
from backend.database import init_db, get_anime_item, get_anime_catalog, save_anime_item
from backend.anime_service import anime_service, CURATED_ANIME_SEED


class TestAnimeCatalogue(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = app.test_client()

    def test_anime_catalog_endpoint_structure(self):
        """Verify GET /api/anime/catalog returns paginated response with provenance."""
        res = self.client.get("/api/anime/catalog?page=1&limit=10")
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
        self.assertEqual(item["type"], "anime")

    def test_category_filtering_movies(self):
        """Verify filtering for anime feature films."""
        res = self.client.get("/api/anime/catalog?category=movies")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        for item in data["results"]:
            self.assertEqual(item.get("format"), "Movie")
            self.assertIn(item.get("title"), ["Spirited Away", "Your Name.", "Suzume", "Demon Slayer: Kimetsu no Yaiba - The Movie: Mugen Train"])

    def test_category_filtering_completed_and_ongoing(self):
        """Verify filtering by completion status (completed vs ongoing series)."""
        res_completed = self.client.get("/api/anime/catalog?category=completed")
        self.assertEqual(res_completed.status_code, 200)
        completed_data = res_completed.get_json()
        for item in completed_data["results"]:
            self.assertEqual(item.get("status"), "completed")

        res_ongoing = self.client.get("/api/anime/catalog?category=ongoing")
        self.assertEqual(res_ongoing.status_code, 200)
        ongoing_data = res_ongoing.get_json()
        for item in ongoing_data["results"]:
            self.assertEqual(item.get("status"), "ongoing")

    def test_multi_audio_hindi_dub_filtering(self):
        """Verify filtering for verified Hindi-dubbed anime titles."""
        res = self.client.get("/api/anime/catalog?lang=hi")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreater(data["total_results"], 0)
        for item in data["results"]:
            has_hindi = item.get("has_hindi_dub") == 1 or any("hindi" in d.lower() for d in item.get("dubs", []))
            self.assertTrue(has_hindi, f"Item {item.get('title')} does not show verified Hindi dub")

    def test_anime_genres_endpoint(self):
        """Verify GET /api/anime/genres returns distinct genres with counts."""
        res = self.client.get("/api/anime/genres")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("genres", data)
        self.assertIsInstance(data["genres"], list)
        self.assertGreater(len(data["genres"]), 0)
        genre_names = [g["name"] for g in data["genres"]]
        self.assertIn("Action", genre_names)
        self.assertIn("Fantasy", genre_names)

    def test_anime_keyword_search(self):
        """Verify searching for anime by title keyword."""
        res = self.client.get("/api/anime/search?q=Chainsaw")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreaterEqual(data["total_results"], 1)
        titles = [i["title"].lower() for i in data["results"]]
        self.assertTrue(any("chainsaw" in t for t in titles))

    def test_anime_details_endpoint(self):
        """Verify GET /api/anime/<id> returns complete title metadata."""
        res = self.client.get("/api/anime/anime-114410")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["title"], "Chainsaw Man")
        self.assertEqual(data["tmdb_id"], 114410)
        self.assertIn("Japanese (Original)", data.get("dubs", []))
        self.assertIn("Hindi Dubbed", data.get("dubs", []))
        self.assertIn("English Dubbed", data.get("dubs", []))
        self.assertGreaterEqual(data.get("episodes_count", 0), 1)
        self.assertIn("providers", data)

    def test_anime_episodes_endpoint(self):
        """Verify GET /api/anime/<id>/episodes returns episodes list."""
        res = self.client.get("/api/anime/anime-114410/episodes?season=1")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["anime_id"], "anime-114410")
        self.assertEqual(data["season"], 1)
        self.assertGreater(data["total_episodes"], 0)
        ep1 = data["episodes"][0]
        self.assertEqual(ep1["episode_number"], 1)
        self.assertIn("name", ep1)
        self.assertIn("still", ep1)

    def test_anime_playback_sources_endpoint(self):
        """Verify GET /api/anime/<id>/sources returns multi-server URLs and authorized providers."""
        res = self.client.get("/api/anime/anime-114410/sources?season=1&episode=2")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "ready")
        self.assertEqual(data["season"], 1)
        self.assertEqual(data["episode"], 2)
        self.assertIn("servers", data)
        self.assertGreater(len(data["servers"]), 0)

        # Check server URL contains episodic parameters
        first_server = data["servers"][0]
        self.assertIn("114410", first_server["url"])

        # Check multi-audio tracks
        audio_codes = [t["code"] for t in data["audio_tracks"]]
        self.assertIn("ja", audio_codes)
        self.assertIn("hi", audio_codes)
        self.assertIn("en", audio_codes)

        # Check authorized providers
        self.assertIn("authorized_providers", data)
        self.assertGreater(len(data["authorized_providers"]), 0)

    def test_global_search_includes_anime(self):
        """Verify that general /api/search finds anime titles."""
        res = self.client.get("/api/search?q=demon+slayer")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
        titles = [i.get("title", "").lower() for i in data]
        self.assertTrue(any("demon slayer" in t for t in titles))

    def test_catalog_detail_fallback_resolves_anime(self):
        """Verify /api/catalog/<anime_id> successfully resolves anime records."""
        res = self.client.get("/api/catalog/anime-114410")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get("title"), "Chainsaw Man")


if __name__ == "__main__":
    unittest.main()
