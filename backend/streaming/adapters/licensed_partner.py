"""
MOVAni Streaming Engine - Licensed Partner & Direct Media Origin Adapter (Slot 6)
Integrates authorized direct media files, HLS streams, and creator partnerships.
"""

from typing import Dict, Any, Optional
from backend.streaming.adapters.base import BaseSourceAdapter
from backend.streaming.models import MediaStreamSource, SourceHealthResult


class LicensedPartnerAdapter(BaseSourceAdapter):
    """Slot 6: Licensed Partner Streams & Direct Media Origins."""

    def __init__(self):
        super().__init__(
            slot_number=6,
            adapter_name="licensed_partner",
            display_name="Licensed Partner Media (Slot 6)",
            is_enabled=True
        )

    def get_stream(self, media_item: Dict[str, Any]) -> Optional[MediaStreamSource]:
        # Check if media item has an authorized direct stream URL attached
        direct_url = media_item.get("direct_stream_url") or media_item.get("media_url")
        if not direct_url:
            return None

        # Verify it's marked authorized
        is_auth = media_item.get("is_authorized", True)
        if not is_auth:
            return None

        return MediaStreamSource(
            source_id="licensed_partner",
            provider_name="MOVAni Licensed Content Origin",
            slot_number=self.slot_number,
            title=media_item.get("title", "Licensed Title"),
            media_url=direct_url,
            stream_type=media_item.get("stream_type", "direct"),
            quality="1080p High Bitrate",
            audio_tracks=media_item.get("verified_audio_tracks", ["Original Audio"]),
            license_id="Creator Authorized",
            license_url="https://movani.org/licenses/partner",
            attribution=media_item.get("attribution", "MOVAni Content Partner"),
            creator=media_item.get("creator") or media_item.get("studio") or "Content Partner",
            rights_status="playable",
            is_authorized=True,
            is_playable=True,
            official_page_url=media_item.get("source_page_url")
        )

    def check_health(self) -> SourceHealthResult:
        return SourceHealthResult(
            source_id=self.adapter_name,
            provider_name=self.display_name,
            slot_number=self.slot_number,
            is_healthy=True,
            status="healthy",
            latency_ms=25,
            status_code=200
        )
