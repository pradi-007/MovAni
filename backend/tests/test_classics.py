import unittest
import json
from backend.app import app
from backend.universal_ott import resolve_tmdb_id, get_universal_playback_manifest
from backend.catalog_data import CATALOG_DATA

class TestClassicsAndRegionalStreaming(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_catalog_contains_classics(self):
        om = next((i for i in CATALOG_DATA if i["id"] == "om-1995"), None)
        self.assertIsNotNone(om)
        self.assertEqual(om["tmdbId"], 357856)
        self.assertTrue(om["isClassic"])
        self.assertIn("Kannada", om["language"])

        sholay = next((i for i in CATALOG_DATA if i["id"] == "sholay-1975"), None)
        self.assertIsNotNone(sholay)
        self.assertEqual(sholay["tmdbId"], 12259)
        self.assertTrue(sholay["isClassic"])
        self.assertIn("Hindi", sholay["language"])

    def test_kannada_language_filter(self):
        res = self.client.get("/api/catalog?lang=kn")
        self.assertEqual(res.status_code, 200)
        items = json.loads(res.data)
        self.assertTrue(len(items) >= 14)
        titles = [i["title"] for i in items]
        self.assertIn("Om", titles)
        self.assertIn("Mungaru Male", titles)
        self.assertIn("Lucia", titles)
        self.assertIn("Kasturi Nivasa", titles)

    def test_hindi_language_filter(self):
        res = self.client.get("/api/catalog?lang=hi")
        self.assertEqual(res.status_code, 200)
        items = json.loads(res.data)
        self.assertTrue(len(items) >= 12)
        titles = [i["title"] for i in items]
        self.assertIn("Sholay", titles)
        self.assertIn("3 Idiots", titles)
        self.assertIn("Hera Pheri", titles)

    def test_search_classics(self):
        # Search "Upendra"
        res = self.client.get("/api/search?q=upendra")
        items = json.loads(res.data)
        self.assertTrue(len(items) > 0)
        self.assertTrue(any("upendra" in i["title"].lower() or "upendra" in str(i.get("xray", {})).lower() for i in items))

        # Search "Babu Bhaiya" or "Hera Pheri"
        res2 = self.client.get("/api/search?q=hera%20pheri")
        items2 = json.loads(res2.data)
        self.assertTrue(len(items2) > 0)
        self.assertEqual(items2[0]["title"], "Hera Pheri")

    def test_universal_ott_manifest_for_classics(self):
        # Test Kaatera
        kaatera_id = resolve_tmdb_id("kaatera")
        self.assertEqual(kaatera_id, 1212788)
        manifest_kaatera = get_universal_playback_manifest("kaatera")
        self.assertEqual(manifest_kaatera["status"], "available")
        self.assertTrue("autoembed.co" in manifest_kaatera["playback_url"] or "codespecters.com" in manifest_kaatera["global_mirror_url"])

        # Test Sholay
        sholay_id = resolve_tmdb_id("sholay")
        self.assertEqual(sholay_id, 12259)
        manifest_sholay = get_universal_playback_manifest("sholay")
        self.assertEqual(manifest_sholay["status"], "available")

        # Test Om
        om_id = resolve_tmdb_id("om")
        self.assertEqual(om_id, 357856)

if __name__ == "__main__":
    unittest.main()
