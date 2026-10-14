"""
MOVAni Streaming Engine - Base Provider Adapter
Defines the standard contract for all streaming providers and source adapters.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from backend.streaming.models import MediaStreamSource, SourceHealthResult


class BaseSourceAdapter(ABC):
    """Abstract Base Class for all MOVAni Streaming Providers."""

    def __init__(self, slot_number: int, adapter_name: str, display_name: str, is_enabled: bool = True):
        self.slot_number = slot_number
        self.adapter_name = adapter_name
        self.display_name = display_name
        self.is_enabled = is_enabled

    @abstractmethod
    def get_stream(self, media_item: Dict[str, Any]) -> Optional[MediaStreamSource]:
        """
        Inspects the media item and returns a MediaStreamSource if this adapter
        can legitimately provide an authorized stream or official link for it.
        """
        pass

    @abstractmethod
    def check_health(self) -> SourceHealthResult:
        """
        Tests provider availability and latency.
        """
        pass

    def supports_media_type(self, media_type: str) -> bool:
        """Default support check - adapters can override."""
        return True

    def get_info(self) -> Dict[str, Any]:
        """Returns metadata about this adapter slot."""
        return {
            "slot_number": self.slot_number,
            "adapter_name": self.adapter_name,
            "display_name": self.display_name,
            "is_enabled": self.is_enabled
        }
