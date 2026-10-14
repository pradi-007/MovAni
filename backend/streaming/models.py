"""
MOVAni Streaming Engine - Models & Data Classes
Defines normalized schemas for media streams, provider sources,
rights status, and health results.
"""

from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone


class RightsStatus(str, Enum):
    DISCOVERED = "discovered"
    LICENSE_DETECTED = "license_detected"
    RIGHTS_VERIFIED = "rights_verified"
    PLAYABLE = "playable"
    OFFICIAL_LINK_ONLY = "official_link_only"
    UNAVAILABLE = "unavailable"
    REVIEW_REQUIRED = "review_required"


class LicenseType(str, Enum):
    PUBLIC_DOMAIN = "Public Domain"
    CC0 = "CC0 1.0 Universal"
    CC_BY_3 = "CC BY 3.0"
    CC_BY_4 = "CC BY 4.0"
    CC_BY_SA_4 = "CC BY-SA 4.0"
    CREATOR_AUTHORIZED = "Creator Authorized"
    OFFICIAL_PARTNER = "Official Provider Stream"
    REVIEW_REQUIRED = "Under Copyright Review"


@dataclass
class MediaStreamSource:
    """Represents a specific playable or reference streaming option."""
    source_id: str
    provider_name: str
    slot_number: int  # 1 to 7
    title: str
    media_url: Optional[str] = None
    stream_type: str = "direct"  # "direct" (mp4/webm), "hls" (m3u8), "dash" (mpd), "external_player"
    quality: str = "1080p"
    quality_options: List[str] = field(default_factory=lambda: ["1080p", "720p", "480p"])
    audio_tracks: List[str] = field(default_factory=lambda: ["Original"])
    subtitles: List[Dict[str, str]] = field(default_factory=list)
    license_id: str = "Public Domain"
    license_url: Optional[str] = None
    attribution: Optional[str] = None
    creator: Optional[str] = None
    rights_status: str = "playable"
    is_authorized: bool = True
    is_playable: bool = True
    official_page_url: Optional[str] = None
    commercial_use_permitted: bool = True
    derivatives_permitted: bool = True
    territory_restrictions: Optional[str] = None
    last_verified_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class StreamResolution:
    """Result of resolving a media stream for playback."""
    success: bool
    title_id: str
    title: str
    source_id: Optional[str] = None
    slot_number: Optional[int] = None
    provider_name: Optional[str] = None
    stream_url: Optional[str] = None
    stream_type: str = "direct"
    audio_language: str = "Original"
    verified_audio_tracks: List[str] = field(default_factory=list)
    subtitles: List[Dict[str, str]] = field(default_factory=list)
    quality_options: List[str] = field(default_factory=list)
    is_authorized: bool = False
    is_playable: bool = False
    official_page_url: Optional[str] = None
    license_info: Optional[Dict[str, Any]] = None
    rights_status: str = "unavailable"
    error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class SourceHealthResult:
    """Result of an automated health check on a provider source."""
    source_id: str
    provider_name: str
    slot_number: int
    is_healthy: bool
    status: str  # "healthy", "degraded", "offline", "unconfigured"
    latency_ms: int = 0
    status_code: Optional[int] = None
    error_message: Optional[str] = None
    last_checked_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
