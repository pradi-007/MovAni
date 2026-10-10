"""
MOVAni Backend Modular Test Suite
Validates all REST API endpoints across blueprints and SQLite persistence.
"""

import os
import sys
import sqlite3
import unittest

# Ensure root directory is in sys.path
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(os.path.dirname(TEST_DIR))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app import create_app
from backend.database import DB_PATH


class MOVAniModularTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("DELETE FROM watchlist")
            conn.execute("DELETE FROM saved_music")
            conn.commit()

    def test_health_endpoint(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["app"], "MOVAni")
        self.assertGreaterEqual(data["titles_count"], 24)

    def test_catalog_and_filtering(self):
        # All titles
        res = self.client.get("/api/catalog")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreaterEqual(len(data), 24)

        # Category filter
        res_series = self.client.get("/api/catalog?category=series")
        data_series = res_series.get_json()
        self.assertTrue(all(item["type"] == "series" for item in data_series))

        # Studio filter
        res_ufotable = self.client.get("/api/catalog?studio=Ufotable")
        data_ufotable = res_ufotable.get_json()
        self.assertTrue(all("ufotable" in item["studio"].lower() for item in data_ufotable))

        # Dub filter
        res_dub = self.client.get("/api/catalog?dub=Kannada")
        data_dub = res_dub.get_json()
        self.assertGreater(len(data_dub), 0)
        self.assertTrue(any("kannada" in d.lower() for item in data_dub for d in item.get("dubs", [])))

    def test_single_title(self):
        res = self.client.get("/api/catalog/oppenheimer")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["title"], "Oppenheimer")
        self.assertIn("xray", data)

    def test_top10_and_studios(self):
        res_top10 = self.client.get("/api/top10")
        self.assertEqual(res_top10.status_code, 200)
        self.assertEqual(len(res_top10.get_json()), 10)

        res_studios = self.client.get("/api/studios")
        self.assertEqual(res_studios.status_code, 200)
        self.assertEqual(len(res_studios.get_json()), 7)

    def test_search(self):
        res = self.client.get("/api/search?q=demon")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreaterEqual(len(data), 1)
        self.assertEqual(data[0]["id"], "demon-slayer")

    def test_watchlist_crud(self):
        # Add to watchlist
        res_add = self.client.post("/api/watchlist", json={"id": "cm-reze"})
        self.assertEqual(res_add.status_code, 200)
        self.assertEqual(res_add.get_json()["action"], "added")

        # Verify
        res_get = self.client.get("/api/watchlist")
        self.assertIn("cm-reze", res_get.get_json()["ids"])

        # Toggle remove
        res_toggle = self.client.post("/api/watchlist", json={"id": "cm-reze"})
        self.assertEqual(res_toggle.get_json()["action"], "removed")

        # Clear
        res_clear = self.client.delete("/api/watchlist")
        self.assertEqual(res_clear.status_code, 200)

    def test_continue_watching(self):
        res_post = self.client.post("/api/continue-watching", json={
            "id": "dune-2",
            "progress": 55,
            "ep": "Feature Film"
        })
        self.assertEqual(res_post.status_code, 200)

        res_get = self.client.get("/api/continue-watching")
        data = res_get.get_json()
        matched = next((i for i in data if i["id"] == "dune-2"), None)
        self.assertIsNotNone(matched)
        self.assertEqual(matched["progress"], 55)

    def test_saved_music(self):
        res_post = self.client.post("/api/music", json={
            "title": "SPECIALZ",
            "artist": "King Gnu",
            "title_id": "jujutsu-kaisen"
        })
        self.assertEqual(res_post.status_code, 200)

        res_get = self.client.get("/api/music")
        data = res_get.get_json()
        matched = next((m for m in data if m["title"] == "SPECIALZ"), None)
        self.assertIsNotNone(matched)

    def test_tmdb_status_and_endpoints(self):
        # TMDB Status check
        res_status = self.client.get("/api/tmdb/status")
        self.assertEqual(res_status.status_code, 200)
        data = res_status.get_json()
        self.assertTrue(data.get("api_key_valid"))
        self.assertEqual(data.get("status"), "connected")

        # TMDB Trending check
        res_trending = self.client.get("/api/tmdb/trending?limit=2")
        self.assertEqual(res_trending.status_code, 200)
        tr_data = res_trending.get_json()
        self.assertGreater(len(tr_data), 0)
        self.assertTrue(tr_data[0]["id"].startswith("tmdb-"))

        # TMDB Search check
        res_search = self.client.get("/api/tmdb/search?q=Inception&limit=1")
        self.assertEqual(res_search.status_code, 200)
        sr_data = res_search.get_json()
        self.assertGreater(len(sr_data), 0)

    def test_tmdb_rows_and_seasons(self):
        # TMDB Pre-aggregated Netflix Home Rows
        res_rows = self.client.get("/api/tmdb/rows")
        self.assertEqual(res_rows.status_code, 200)
        rows_data = res_rows.get_json()
        self.assertIn("trending", rows_data)
        self.assertIn("anime", rows_data)
        self.assertIn("movies", rows_data)
        self.assertIn("series", rows_data)

        # TMDB TV Season Episodes
        res_season = self.client.get("/api/tmdb/tv/94605/season/1")
        self.assertEqual(res_season.status_code, 200)
        season_data = res_season.get_json()
        self.assertEqual(season_data.get("season_number"), 1)
        self.assertGreater(len(season_data.get("episodes", [])), 0)


if __name__ == "__main__":
    unittest.main()
