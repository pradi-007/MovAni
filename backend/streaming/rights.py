"""
MOVAni Streaming Engine - Rights Verification & Licensing Engine
Enforces digital rights verification, public domain rules, Creative Commons terms,
and authentic Kannada audio validation before permitting playback.
"""

from typing import Dict, Any, Tuple
from datetime import datetime, timezone
from backend.streaming.models import RightsStatus, LicenseType


# Recognized Open & Permissive Licenses
VERIFIED_OPEN_LICENSES = {
    "Public Domain": {
        "commercial": True,
        "derivatives": True,
        "attribution_required": False,
        "url": "https://creativecommons.org/publicdomain/mark/1.0/"
    },
    "CC0 1.0 Universal": {
        "commercial": True,
        "derivatives": True,
        "attribution_required": False,
        "url": "https://creativecommons.org/publicdomain/zero/1.0/"
    },
    "CC BY 3.0": {
        "commercial": True,
        "derivatives": True,
        "attribution_required": True,
        "url": "https://creativecommons.org/licenses/by/3.0/"
    },
    "CC BY 4.0": {
        "commercial": True,
        "derivatives": True,
        "attribution_required": True,
        "url": "https://creativecommons.org/licenses/by/4.0/"
    },
    "CC BY-SA 4.0": {
        "commercial": True,
        "derivatives": True,
        "attribution_required": True,
        "url": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    "Creator Authorized": {
        "commercial": True,
        "derivatives": False,
        "attribution_required": True,
        "url": "https://movani.org/licenses/creator-authorized"
    },
    "Official Provider Stream": {
        "commercial": False,
        "derivatives": False,
        "attribution_required": True,
        "url": "https://movani.org/licenses/official-provider"
    }
}


class RightsEngine:
    """
    Evaluates media records and ensures no unverified or unauthorized media
    is marked as playable.
    """

    @staticmethod
    def evaluate_media_rights(item: Dict[str, Any]) -> Tuple[RightsStatus, str, Dict[str, Any]]:
        """
        Evaluates the rights of a media item.
        Returns (RightsStatus, verification_notes, permissions).
        """
        if not item:
            return RightsStatus.UNAVAILABLE, "Empty media record provided.", {}

        license_name = (item.get("license_id") or item.get("license") or "").strip()
        release_year = item.get("release_year") or 0
        media_url = item.get("media_url") or item.get("stream_url") or ""
        country = (item.get("country") or "").upper()
        source_name = (item.get("source_name") or "").lower()

        # 1. Check if film is documented public domain by publication year
        # Indian Copyright Act 1957: Cinematograph films fall into public domain 60 years after publication.
        # US works: Published prior to 1929 are public domain worldwide.
        current_year = datetime.now(timezone.utc).year
        is_pre_1929 = 0 < release_year < 1929
        is_india_public_domain = country in ("IN", "INDIA") and 0 < release_year <= (current_year - 60)

        if not license_name:
            if is_pre_1929:
                license_name = "Public Domain"
            elif is_india_public_domain:
                license_name = "Public Domain"
            else:
                return RightsStatus.REVIEW_REQUIRED, "No license information documented. Under copyright review.", {
                    "commercial": False,
                    "derivatives": False
                }

        # 2. Check if license is in verified open licenses
        lic_meta = VERIFIED_OPEN_LICENSES.get(license_name)
        if not lic_meta:
            # Fallback for generic Public Domain or Creative Commons strings
            low_lic = license_name.lower()
            if "public domain" in low_lic or "pd" in low_lic:
                lic_meta = VERIFIED_OPEN_LICENSES["Public Domain"]
            elif "cc0" in low_lic:
                lic_meta = VERIFIED_OPEN_LICENSES["CC0 1.0 Universal"]
            elif "cc by" in low_lic:
                lic_meta = VERIFIED_OPEN_LICENSES["CC BY 4.0"]
            elif "creator" in low_lic or "authorized" in low_lic:
                lic_meta = VERIFIED_OPEN_LICENSES["Creator Authorized"]
            else:
                return RightsStatus.REVIEW_REQUIRED, f"Unrecognized license '{license_name}'. Requires legal review.", {
                    "commercial": False,
                    "derivatives": False
                }

        # 3. Check media file availability
        if not media_url:
            source_page = item.get("source_page_url") or item.get("link")
            if source_page:
                return RightsStatus.OFFICIAL_LINK_ONLY, "No direct media URL available; viewing permitted on official provider page.", lic_meta
            return RightsStatus.RIGHTS_VERIFIED, "Rights verified, but media stream is currently unavailable.", lic_meta

        # 4. Rights and media both verified
        notes = f"Verified under '{license_name}'. Redistribution permitted under stated terms."
        if is_india_public_domain:
            notes = f"Verified Public Domain under Indian Copyright Act (published {release_year}, >60 years)."
        elif is_pre_1929:
            notes = f"Verified Worldwide Public Domain (published {release_year}, pre-1929)."

        return RightsStatus.PLAYABLE, notes, lic_meta

    @staticmethod
    def verify_kannada_content(item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates authentic Kannada audio claims.
        Distinguishes original Kannada language vs verified dubbed tracks.
        Eliminates false claims (5.1, Dolby Atmos, phantom dubs).
        """
        raw_lang = (item.get("language") or item.get("originalLanguage") or item.get("original_language") or "").lower()
        verified_audio = item.get("verified_audio_tracks") or item.get("verified_audio") or []
        if isinstance(verified_audio, str):
            try:
                import json
                verified_audio = json.loads(verified_audio)
            except Exception:
                verified_audio = [verified_audio]

        is_orig_kn = raw_lang in ("kn", "kannada") or bool(item.get("is_kannada") or item.get("is_original_kannada"))
        
        # Check if Kannada dub is explicitly verified in audio tracks
        audio_str_list = [str(a).lower() for a in verified_audio]
        has_kn_dub = any("kannada" in a for a in audio_str_list) and not is_orig_kn

        # Sanitize audio claim: never output unverified surround sound (5.1/Atmos)
        clean_tracks = []
        if is_orig_kn:
            clean_tracks.append("Kannada (Original Stereo)")
        elif has_kn_dub:
            clean_tracks.append("Kannada (Official Dub)")

        # Include other verified tracks
        for track in verified_audio:
            t_str = str(track)
            if "5.1" in t_str or "atmos" in t_str.lower():
                t_str = t_str.replace("5.1", "").replace("Atmos", "").replace("Dolby", "").strip()
            if t_str and t_str not in clean_tracks:
                clean_tracks.append(t_str)

        if not clean_tracks:
            clean_tracks = ["Original Track"]

        return {
            "is_original_kannada": bool(is_orig_kn),
            "is_kannada_dubbed": bool(has_kn_dub),
            "verified_audio_tracks": clean_tracks,
            "has_kannada_audio": bool(is_orig_kn or has_kn_dub)
        }
