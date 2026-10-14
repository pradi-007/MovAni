"""
MOVAni Streaming Engine - Official Provider Watch Options Adapter (Slot 7)
Directs users to verified official provider streaming destinations (Netflix, Prime, Hotstar, ZEE5, etc.)
when direct playback is not licensed to MOVAni.
"""

from typing import Dict, Any, Optional
from backend.streaming.adapters.base import BaseSourceAdapter
from backend.streaming.models import MediaStreamSource, SourceHealthResult


class OfficialWatchAdapter(BaseSourceAdapter):
    """Slot 7: Official Streaming Provider Portals."""

    def __init__(self):
        super().__init__(
            slot_number=7,
            adapter_name="official_watch",
            display_name="Official Watch Options (Slot 7)",
            is_enabled=True
        )

    def get_stream(self, media_item: Dict[str, Any]) -> Optional[MediaStreamSource]:
        # Check providers list from TMDB / Watch Providers table
        providers = media_item.get("watch_providers") or media_item.get("providers") or []
        official_link = None
        provider_name = "Official Streaming Provider"

        if providers and isinstance(providers, list):
            first_p = providers[0]
            if isinstance(first_p, dict):
                official_link = first_p.get("link")
                provider_name = first_p.get("provider_name") or provider_name

        if not official_link:
            official_link = media_item.get("official_url") or media_item.get("tmdb_link") or media_item.get("source_page_url")

        if not official_link:
            tmdb_id = media_item.get("tmdb_id")
            m_type = media_item.get("media_type", "movie")
            if tmdb_id:
                official_link = f"https://www.themoviedb.org/{m_type}/{tmdb_id}/watch"

        if not official_link:
            return None

        return MediaStreamSource(
            source_id="official_watch",
            provider_name=provider_name,
            slot_number=self.slot_number,
            title=f"{media_item.get('title', 'Title')} ({provider_name})",
            media_url=None,  # No direct playback
            stream_type="external_player",
            quality="Official Stream",
            audio_tracks=["Official Provider Audio"],
            license_id="Official Provider Stream",
            license_url="https://movani.org/licenses/official-provider",
            attribution=f"Stream directly via {provider_name}",
            creator=provider_name,
            rights_status="official_link_only",
            is_authorized=True,
            is_playable=False,
            official_page_url=official_link
        )

    def check_health(self) -> SourceHealthResult:
        return SourceHealthResult(
            source_id=self.adapter_name,
            provider_name=self.display_name,
            slot_number=self.slot_number,
            is_healthy=True,
            status="healthy",
            latency_ms=15,
            status_code=200
        )
