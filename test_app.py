"""
MOVAni Backend Unit & Integration Tests
Validates all REST API endpoints and SQLite database operations.
"""

import sqlite3
import unittest
from app import app, init_db, get_db, DB_PATH


class MOVAniTestCase(unittest.TestCase):
    def setUp(self):
        init_db()
        self.client = app.test_client()
        with get_db() as conn:
            conn.execute("DELETE FROM watchlist")
            conn.execute("DELETE FROM saved_music")
            conn.commit()

    def test_health_check(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["app"], "MOVAni")
        self.assertEqual(data["titles_count"], 20)

    def test_frontend_serving(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"MOVAni", res.data)

    def test_catalog_retrieval_and_filtering(self):
        # All titles
        res = self.client.get("/api/catalog")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(len(data), 20)

        # Filter category = anime
        res_anime = self.client.get("/api/catalog?category=anime")
        data_anime = res_anime.get_json()
        self.assertTrue(all(item["type"] == "anime" for item in data_anime))

        # Filter studio = MAPPA
        res_mappa = self.client.get("/api/catalog?studio=MAPPA")
        data_mappa = res_mappa.get_json()
        self.assertTrue(all("mappa" in item["studio"].lower() for item in data_mappa))

    def test_single_title_details(self):
        res = self.client.get("/api/catalog/cm-reze")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["title"], "Chainsaw Man: Reze Arc")
        self.assertIn("xray", data)
        self.assertIn("actors", data["xray"])
        self.assertIn("song", data["xray"])

    def test_top10(self):
        res = self.client.get("/api/top10")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(len(data), 10)

    def test_studios(self):
        res = self.client.get("/api/studios")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(len(data), 6)

    def test_search(self):
        res = self.client.get("/api/search?q=reze")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreaterEqual(len(data), 1)
        self.assertEqual(data[0]["id"], "cm-reze")

    def test_watchlist_workflow(self):
        # Add to watchlist
        res_add = self.client.post("/api/watchlist", json={"id": "solo-leveling"})
        self.assertEqual(res_add.status_code, 200)
        
        # Verify in watchlist
        res_get = self.client.get("/api/watchlist")
        data = res_get.get_json()
        self.assertIn("solo-leveling", data["ids"])

        # Clear watchlist
        res_clear = self.client.delete("/api/watchlist")
        self.assertEqual(res_clear.status_code, 200)

        # Verify empty
        res_empty = self.client.get("/api/watchlist")
        self.assertEqual(len(res_empty.get_json()["ids"]), 0)

    def test_continue_watching_workflow(self):
        # Update progress
        res_post = self.client.post("/api/continue-watching", json={
            "id": "cm-reze",
            "progress": 75,
            "ep": "S1:E9"
        })
        self.assertEqual(res_post.status_code, 200)

        # Get list
        res_get = self.client.get("/api/continue-watching")
        data = res_get.get_json()
        matched = next((i for i in data if i["id"] == "cm-reze"), None)
        self.assertIsNotNone(matched)
        self.assertEqual(matched["progress"], 75)

    def test_music_workflow(self):
        res_post = self.client.post("/api/music", json={
            "title": "Kick Back",
            "artist": "Kenshi Yonezu",
            "title_id": "cm-reze"
        })
        self.assertEqual(res_post.status_code, 200)

        res_get = self.client.get("/api/music")
        data = res_get.get_json()
        matched = next((m for m in data if m["title"] == "Kick Back"), None)
        self.assertIsNotNone(matched)

    def test_tmdb_integration(self):
        res = self.client.get("/api/tmdb/status")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json()["api_key_valid"])

        res_tr = self.client.get("/api/tmdb/trending?limit=2")
        self.assertEqual(res_tr.status_code, 200)
        self.assertGreater(len(res_tr.get_json()), 0)


if __name__ == "__main__":
    unittest.main()
