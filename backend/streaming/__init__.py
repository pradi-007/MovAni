"""
MOVAni Streaming Engine Package
Provides modular streaming discovery, digital rights evaluation,
SSRF security checking, and 7-slot provider resolution.
"""

from backend.streaming.models import (
    MediaStreamSource,
    StreamResolution,
    SourceHealthResult,
    RightsStatus,
    LicenseType
)
from backend.streaming.rights import RightsEngine
from backend.streaming.health import SourceHealthMonitor, SSRFSecurityGuard
from backend.streaming.registry import SourceRegistry, streaming_registry
from backend.streaming.resolver import StreamResolver

__all__ = [
    "MediaStreamSource",
    "StreamResolution",
    "SourceHealthResult",
    "RightsStatus",
    "LicenseType",
    "RightsEngine",
    "SourceHealthMonitor",
    "SSRFSecurityGuard",
    "SourceRegistry",
    "streaming_registry",
    "StreamResolver"
]
