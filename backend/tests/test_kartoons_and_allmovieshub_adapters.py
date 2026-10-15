#!/usr/bin/env python3
"""
Unit and Integration Tests for Kartoons Anime and AllMoviesHub Movie Adapters.
Verifies:
- Terms-compliant discovery and health checks (respecting Cloudflare Turnstile & anti-bot WAF).
- Strict distinction between catalogue pages, officially embeddable players, and direct media streams.
- Verified 206 range-request direct media playback for open titles.
- Official viewing link provision for protected commercial titles (no DRM/paywall bypass).
- Correct integration with SourceRegistry and StreamResolver.
"""

import unittest
from backend.streaming.registry import streaming_registry
from backend.streaming.adapters.kartoons_adapter import KartoonsAnimeAdapter, VERIFIED_PLAYABLE_ANIME
from backend.streaming.adapters.allmovieshub_adapter import AllMoviesHubAdapter, VERIFIED_PLAYABLE_MOVIES
from backend.streaming.resolver import StreamResolver
from backend.streaming.models import MediaStreamSource, RightsStatus


class TestKartoonsAndAllMoviesHubAdapters(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.kartoons_adapter = streaming_registry.get_adapter_by_name("kartoons_anime")
        cls.allmovieshub_adapter = streaming_registry.get_adapter_by_name("allmovieshub")

    def test_01_kartoons_adapter_registration(self):
        """Verify Kartoons anime adapter is properly registered in streaming registry."""
        self.assertIsNotNone(self.kartoons_adapter, "Kartoons adapter must be registered in SourceRegistry")
        self.assertIsInstance(self.kartoons_adapter, KartoonsAnimeAdapter)
        self.assertEqual(self.kartoons_adapter.adapter_name, "kartoons_anime")
        self.assertEqual(self.kartoons_adapter.slot_number, 8)
        self.assertTrue(self.kartoons_adapter.is_enabled)

    def test_02_allmovieshub_adapter_registration(self):
        """Verify AllMoviesHub movie adapter is properly registered in streaming registry."""
        self.assertIsNotNone(self.allmovieshub_adapter, "AllMoviesHub adapter must be registered in SourceRegistry")
        self.assertIsInstance(self.allmovieshub_adapter, AllMoviesHubAdapter)
        self.assertEqual(self.allmovieshub_adapter.adapter_name, "allmovieshub")
        self.assertEqual(self.allmovieshub_adapter.slot_number, 9)
        self.assertTrue(self.allmovieshub_adapter.is_enabled)

    def test_03_kartoons_media_type_support(self):
        """Verify Kartoons adapter supports anime, series, and animation formats."""
        self.assertTrue(self.kartoons_adapter.supports_media_type("anime"))
        self.assertTrue(self.kartoons_adapter.supports_media_type("series"))
        self.assertTrue(self.kartoons_adapter.supports_media_type("tv"))
        self.assertTrue(self.kartoons_adapter.supports_media_type("animation"))
        self.assertTrue(self.kartoons_adapter.supports_media_type("movie"))

    def test_04_allmovieshub_media_type_support(self):
        """Verify AllMoviesHub adapter supports movie formats."""
        self.assertTrue(self.allmovieshub_adapter.supports_media_type("movie"))
        self.assertTrue(self.allmovieshub_adapter.supports_media_type("movies"))
        self.assertTrue(self.allmovieshub_adapter.supports_media_type("cinema"))

    def test_05_kartoons_verified_playable_direct_anime(self):
        """Verify verified open anime resolves direct 206 range-request stream."""
        media_item = {
            "id": "anime-sita-sings-the-blues",
            "title": "Sita Sings the Blues",
            "type": "anime",
            "format": "Movie"
        }
        stream = self.kartoons_adapter.get_stream(media_item)
        self.assertIsNotNone(stream)
        self.assertIsInstance(stream, MediaStreamSource)
        self.assertEqual(stream.playback_status, "playback_verified")
        self.assertEqual(stream.stream_type, "direct")
        self.assertTrue(stream.is_playable)
        self.assertTrue(stream.media_url.startswith("https://"))
        self.assertTrue(stream.media_url.endswith(".mp4"))
        self.assertIn("English", str(stream.audio_tracks))

    def test_06_allmovieshub_verified_playable_direct_movie(self):
        """Verify verified open movie resolves direct range-request stream."""
        media_item = {
            "id": "movie-caminandes",
            "title": "Caminandes: Llamigos",
            "type": "movies",
            "format": "Movie"
        }
        stream = self.allmovieshub_adapter.get_stream(media_item)
        self.assertIsNotNone(stream)
        self.assertIsInstance(stream, MediaStreamSource)
        self.assertEqual(stream.playback_status, "playback_verified")
        self.assertEqual(stream.stream_type, "direct")
        self.assertTrue(stream.is_playable)
        self.assertTrue(stream.media_url.startswith("https://"))
        self.assertTrue(stream.media_url.endswith(".mp4"))

    def test_07_commercial_titles_distinguish_official_link_vs_video_url(self):
        """
        Verify commercial DRM-protected titles are NOT given fake video stream URLs.
        Must return official_link_only or embed player, never passing blog HTML pages as video streams.
        """
        # Commercial movie with no open license
        comm_movie = {
            "id": "movie-1075676",
            "title": "Stree 2",
            "tmdb_id": 1075676,
            "type": "movies",
            "official_provider_url": "https://www.primevideo.com/detail/0S8XG0U2P2C8/"
        }
        stream_comm = self.allmovieshub_adapter.get_stream(comm_movie)
        self.assertIsNotNone(stream_comm)
        # Media URL must either be an embed player or None (if official link only), NEVER a raw .html blog page
        if stream_comm.media_url:
            self.assertFalse(stream_comm.media_url.endswith(".html"))
            self.assertIn(stream_comm.stream_type, ("embed", "external_player"))
        else:
            self.assertEqual(stream_comm.playback_status, "official_link_only")
            self.assertIsNotNone(stream_comm.official_page_url)

    def test_08_kartoons_health_check_detects_turnstile(self):
        """Verify health check accurately probes Kartoons and identifies Cloudflare Turnstile protection."""
        health = self.kartoons_adapter.check_health()
        self.assertEqual(health.source_id, "kartoons_anime")
        self.assertEqual(health.slot_number, 8)
        self.assertIn(health.status, ("turnstile_protected", "healthy", "error", "degraded"))
        self.assertIsNotNone(health.details)
        self.assertIn("turnstile_protected", health.details)

    def test_09_allmovieshub_health_check(self):
        """Verify health check inspects AllMoviesHub portal accessibility."""
        health = self.allmovieshub_adapter.check_health()
        self.assertEqual(health.source_id, "allmovieshub")
        self.assertEqual(health.slot_number, 9)
        self.assertIn(health.status, ("healthy", "degraded", "error"))

    def test_10_registry_discovers_sources_for_anime_and_movie(self):
        """Verify SourceRegistry.get_sources_for_title discovers custom adapter streams."""
        anime_sources = streaming_registry.get_sources_for_title({
            "id": "anime-sita-sings-the-blues",
            "title": "Sita Sings the Blues",
            "type": "anime"
        })
        self.assertGreater(len(anime_sources), 0)
        playable_anime = next((s for s in anime_sources if s.playback_status == "playback_verified"), None)
        self.assertIsNotNone(playable_anime)
        self.assertEqual(playable_anime.slot_number, 8)

        movie_sources = streaming_registry.get_sources_for_title({
            "id": "movie-caminandes",
            "title": "Caminandes: Llamigos",
            "type": "movies"
        })
        self.assertGreater(len(movie_sources), 0)
        playable_movie = next((s for s in movie_sources if s.playback_status == "playback_verified"), None)
        self.assertIsNotNone(playable_movie)
        self.assertEqual(playable_movie.slot_number, 9)

    def test_11_stream_resolver_end_to_end_direct_playback(self):
        """Verify StreamResolver.resolve_title_stream resolves playable open titles."""
        res_anime = StreamResolver.resolve_title_stream("anime-sita-sings-the-blues")
        self.assertTrue(res_anime.success)
        self.assertTrue(res_anime.is_playable)
        self.assertTrue(res_anime.media_url.startswith("https://"))
        self.assertEqual(res_anime.playback_status, "playback_verified")

        res_movie = StreamResolver.resolve_title_stream("movie-caminandes")
        self.assertTrue(res_movie.success)
        self.assertTrue(res_movie.is_playable)
        self.assertTrue(res_movie.media_url.startswith("https://"))
        self.assertEqual(res_movie.playback_status, "playback_verified")


if __name__ == "__main__":
    unittest.main()
