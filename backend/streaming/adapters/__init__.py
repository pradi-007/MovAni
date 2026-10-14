"""
MOVAni Streaming Engine - Provider Adapters Package
Exports all 7 source adapters for the unified streaming registry.
"""

from backend.streaming.adapters.base import BaseSourceAdapter
from backend.streaming.adapters.kannada_heritage import KannadaHeritageAdapter
from backend.streaming.adapters.blender_open import BlenderOpenMovieAdapter
from backend.streaming.adapters.archive_org import ArchiveOrgAdapter
from backend.streaming.adapters.wikimedia import WikimediaCommonsAdapter
from backend.streaming.adapters.cinema_showcase import CinemaShowcaseAdapter
from backend.streaming.adapters.licensed_partner import LicensedPartnerAdapter
from backend.streaming.adapters.official_watch import OfficialWatchAdapter

__all__ = [
    "BaseSourceAdapter",
    "KannadaHeritageAdapter",
    "BlenderOpenMovieAdapter",
    "ArchiveOrgAdapter",
    "WikimediaCommonsAdapter",
    "CinemaShowcaseAdapter",
    "LicensedPartnerAdapter",
    "OfficialWatchAdapter",
]
