"""
MOVAni Streaming Engine - Source Registry
Coordinates the 7 configurable streaming slots and routes playback discovery.
"""

from typing import Dict, List, Optional, Any
from backend.streaming.adapters.base import BaseSourceAdapter
from backend.streaming.adapters.kannada_heritage import KannadaHeritageAdapter
from backend.streaming.adapters.blender_open import BlenderOpenMovieAdapter
from backend.streaming.adapters.archive_org import ArchiveOrgAdapter
from backend.streaming.adapters.wikimedia import WikimediaCommonsAdapter
from backend.streaming.adapters.cinema_showcase import CinemaShowcaseAdapter
from backend.streaming.adapters.licensed_partner import LicensedPartnerAdapter
from backend.streaming.adapters.official_watch import OfficialWatchAdapter
from backend.streaming.models import MediaStreamSource, SourceHealthResult


class SourceRegistry:
    """
    Central registry for the 7 provider streaming slots.
    """

    def __init__(self):
        self._slots: Dict[int, BaseSourceAdapter] = {}
        self._init_default_adapters()

    def _init_default_adapters(self):
        """Initializes the default 7 provider adapters."""
        adapters = [
            KannadaHeritageAdapter(),      # Slot 1
            BlenderOpenMovieAdapter(),     # Slot 2
            ArchiveOrgAdapter(),           # Slot 3
            WikimediaCommonsAdapter(),     # Slot 4
            CinemaShowcaseAdapter(),       # Slot 5
            LicensedPartnerAdapter(),      # Slot 6
            OfficialWatchAdapter()         # Slot 7
        ]
        for adapter in adapters:
            self._slots[adapter.slot_number] = adapter

    def register_adapter(self, adapter: BaseSourceAdapter):
        """Registers or replaces an adapter in its slot (1-7)."""
        if 1 <= adapter.slot_number <= 7:
            self._slots[adapter.slot_number] = adapter

    def get_adapter(self, slot_number: int) -> Optional[BaseSourceAdapter]:
        return self._slots.get(slot_number)

    def get_adapter_by_name(self, name: str) -> Optional[BaseSourceAdapter]:
        for adapter in self._slots.values():
            if adapter.adapter_name == name:
                return adapter
        return None

    def get_sources_for_title(self, media_item: Dict[str, Any]) -> List[MediaStreamSource]:
        """
        Queries all enabled slots for available streaming options for this media item.
        Returns a list of MediaStreamSource instances.
        """
        available_sources: List[MediaStreamSource] = []

        # Iterate slots 1 through 7 in order
        for slot_num in range(1, 8):
            adapter = self._slots.get(slot_num)
            if adapter and adapter.is_enabled:
                try:
                    stream = adapter.get_stream(media_item)
                    if stream:
                        available_sources.append(stream)
                except Exception:
                    pass

        return available_sources

    def get_all_slots_info(self) -> List[Dict[str, Any]]:
        """Returns the configuration and enabled state of all 7 slots."""
        info = []
        for slot_num in range(1, 8):
            adapter = self._slots.get(slot_num)
            if adapter:
                info.append(adapter.get_info())
            else:
                info.append({
                    "slot_number": slot_num,
                    "adapter_name": f"unassigned_slot_{slot_num}",
                    "display_name": f"Source Slot {slot_num} (Unconfigured)",
                    "is_enabled": False
                })
        return info

    def check_all_health(self) -> List[SourceHealthResult]:
        """Runs health checks on all registered provider slots."""
        results = []
        for slot_num in range(1, 8):
            adapter = self._slots.get(slot_num)
            if adapter:
                results.append(adapter.check_health())
            else:
                results.append(SourceHealthResult(
                    source_id=f"slot_{slot_num}",
                    provider_name=f"Slot {slot_num}",
                    slot_number=slot_num,
                    is_healthy=False,
                    status="unconfigured",
                    error_message="No adapter configured for this slot"
                ))
        return results


# Global singleton registry
streaming_registry = SourceRegistry()
