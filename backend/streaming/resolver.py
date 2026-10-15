"""
MOVAni Streaming Engine - Stream Resolver
Resolves media requests to verified, authorized streaming sources with SSRF validation,
rights checking, and authentic audio track metadata.
"""

from typing import Dict, Any, Optional, List
from backend.streaming.models import StreamResolution, MediaStreamSource, RightsStatus
from backend.streaming.registry import streaming_registry
from backend.streaming.rights import RightsEngine
from backend.streaming.health import SSRFSecurityGuard


class StreamResolver:
    """
    Coordinates title lookup, source resolution, and security validation.
    """

    @classmethod
    def resolve_title_stream(
        cls,
        title_id: str,
        media_item: Optional[Dict[str, Any]] = None,
        preferred_slot: Optional[int] = None,
        season: int = 1,
        episode: int = 1
    ) -> StreamResolution:
        """
        Resolves a playable stream for the requested title.
        """
        if not media_item:
            # Lookup in database
            from backend.database import get_cached_media_item, get_open_media_item, get_anime_item, get_movie_item
            media_item = get_open_media_item(title_id)
            if not media_item:
                media_item = get_cached_media_item(title_id)
            if not media_item:
                media_item = get_anime_item(title_id)
            if not media_item:
                media_item = get_movie_item(title_id)
            if not media_item:
                from backend.anime_service import anime_service
                media_item = anime_service.get_details(title_id)
            if not media_item:
                from backend.movie_service import movie_service
                media_item = movie_service.get_details(title_id)
            if not media_item:
                from backend.streaming.adapters.kartoons_adapter import VERIFIED_PLAYABLE_ANIME
                if title_id in VERIFIED_PLAYABLE_ANIME:
                    media_item = dict(VERIFIED_PLAYABLE_ANIME[title_id])
                    media_item["id"] = title_id
                    media_item["type"] = "anime"
            if not media_item:
                from backend.streaming.adapters.allmovieshub_adapter import VERIFIED_PLAYABLE_MOVIES
                if title_id in VERIFIED_PLAYABLE_MOVIES:
                    media_item = dict(VERIFIED_PLAYABLE_MOVIES[title_id])
                    media_item["id"] = title_id
                    media_item["type"] = "movies"
            if not media_item:
                # Lookup in catalog_data
                from backend.catalog_data import CATALOG_DATA
                media_item = next((i for i in CATALOG_DATA if i.get("id") == title_id), None)

        if not media_item:
            return StreamResolution(
                success=False,
                title_id=title_id,
                title="Unknown Title",
                error=f"Title '{title_id}' not found in MOVAni catalog."
            )

        title_name = media_item.get("title") or title_id

        # 1. Discover all authorized sources from registry
        available_sources: List[MediaStreamSource] = streaming_registry.get_sources_for_title(media_item)

        if not available_sources:
            return StreamResolution(
                success=False,
                title_id=title_id,
                title=title_name,
                rights_status="unavailable",
                is_playable=False,
                error="No authorized streaming sources configured for this title."
            )

        # 2. Select chosen source slot or default to first playable source
        selected_source: Optional[MediaStreamSource] = None
        if preferred_slot and preferred_slot > 0:
            for src in available_sources:
                if src.slot_number == preferred_slot:
                    selected_source = src
                    break

        if not selected_source:
            # Find first directly playable source
            for src in available_sources:
                if src.is_playable and src.media_url:
                    selected_source = src
                    break
            # Fallback to first available source (e.g. official link)
            if not selected_source and available_sources:
                selected_source = available_sources[0]

        # 3. Audio & Kannada Authenticity Verification
        audio_info = RightsEngine.verify_kannada_content(media_item)
        if selected_source.audio_tracks and selected_source.audio_tracks != ["Original"]:
            verified_audio = selected_source.audio_tracks
        else:
            verified_audio = audio_info["verified_audio_tracks"]

        # 4. Security Check (SSRF guard on media URL if direct playback)
        if selected_source.media_url:
            is_safe, sec_reason = SSRFSecurityGuard.is_safe_url(selected_source.media_url)
            if not is_safe:
                return StreamResolution(
                    success=False,
                    title_id=title_id,
                    title=title_name,
                    source_id=selected_source.source_id,
                    slot_number=selected_source.slot_number,
                    provider_name=selected_source.provider_name,
                    rights_status="unavailable",
                    error=f"Playback blocked by security shield: {sec_reason}"
                )

        # 5. Construct successful resolution
        return StreamResolution(
            success=True,
            title_id=title_id,
            title=title_name,
            source_id=selected_source.source_id,
            slot_number=selected_source.slot_number,
            provider_name=selected_source.provider_name,
            stream_url=selected_source.media_url,
            stream_type=selected_source.stream_type,
            audio_language=verified_audio[0] if verified_audio else "Original",
            verified_audio_tracks=verified_audio,
            subtitles=selected_source.subtitles,
            quality_options=selected_source.quality_options,
            is_authorized=selected_source.is_authorized,
            is_playable=selected_source.is_playable,
            official_page_url=selected_source.official_page_url,
            rights_status=selected_source.rights_status,
            playback_status=selected_source.playback_status,
            license_info={
                "license_id": selected_source.license_id,
                "license_url": selected_source.license_url,
                "attribution": selected_source.attribution,
                "creator": selected_source.creator
            }
        )
