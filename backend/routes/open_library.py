"""
MOVAni Open Film Library - API Blueprint
Scalable catalog discovery, multi-faceted filtering, metadata provenance,
and large-scale ingestion endpoints (designed to scale toward 100k-1M+ records).
"""

from flask import Blueprint, jsonify, request
from typing import Dict, Any

from backend.database import (
    get_open_media_catalog,
    get_open_media_item,
    get_open_media_stats,
    save_open_media_record,
    update_open_media_verification,
    get_open_media_sources_for_item
)
from backend.streaming.rights import RightsEngine
from backend.streaming.health import StreamHealthMonitor
from backend.streaming.adapters.archive_org import ArchiveOrgAdapter
from backend.streaming.registry import streaming_registry

open_library_bp = Blueprint("open_library", __name__, url_prefix="/api/open-library")


@open_library_bp.route("", methods=["GET"])
@open_library_bp.route("/", methods=["GET"])
@open_library_bp.route("/catalog", methods=["GET"])
def get_catalog():
    """
    Search, filter, and paginate the Open Media Library.
    Supports filters for language, authentic Kannada mode, provider source,
    license type, media type, and rights status.
    """
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))
    query = request.args.get("q", "").strip()
    language = request.args.get("language", "").strip()
    kannada_mode = request.args.get("kannada_mode", "").strip()
    source = request.args.get("source", "").strip()
    license_filter = request.args.get("license", "").strip()
    media_type = request.args.get("media_type", "").strip()
    rights_status = request.args.get("rights_status", "").strip()

    catalog_data = get_open_media_catalog(
        page=page,
        limit=limit,
        query=query,
        language=language,
        kannada_mode=kannada_mode,
        source=source,
        license_filter=license_filter,
        media_type=media_type,
        rights_status=rights_status
    )

    return jsonify({
        "success": True,
        **catalog_data
    }), 200


@open_library_bp.route("/stats", methods=["GET"])
def get_stats():
    """Returns live database counts and faceted breakdowns."""
    stats = get_open_media_stats()
    return jsonify({
        "success": True,
        "stats": stats
    }), 200


@open_library_bp.route("/item/<id>", methods=["GET"])
@open_library_bp.route("/<id>", methods=["GET"])
def get_item(id: str):
    """Retrieves full metadata, license evidence, and audio tracks for an open media item."""
    if id in ("catalog", "stats", "ingest"):
        return jsonify({"success": False, "error": "Not found"}), 404

    item = get_open_media_item(id)
    if not item:
        return jsonify({
            "success": False,
            "error": f"Open media record '{id}' not found."
        }), 404

    # Evaluate rights and audio
    rights_status, rights_notes, lic_meta = RightsEngine.evaluate_media_rights(item)
    audio_info = RightsEngine.verify_kannada_content(item)

    return jsonify({
        "success": True,
        "item": item,
        "rights_evaluation": {
            "status": rights_status.value,
            "notes": rights_notes,
            "license_metadata": lic_meta
        },
        "audio_verification": audio_info
    }), 200


@open_library_bp.route("/item/<id>/sources", methods=["GET"])
@open_library_bp.route("/<id>/sources", methods=["GET"])
def get_sources(id: str):
    """
    Returns candidate streaming slots, direct MP4, HLS, official archive page,
    and rights evaluation for this item.
    """
    item = get_open_media_item(id)
    if not item:
        return jsonify({
            "success": False,
            "error": f"Open media record '{id}' not found."
        }), 404

    sources_info = get_open_media_sources_for_item(id)
    # Also resolve registry sources
    registry_sources = streaming_registry.get_sources_for_title(item)
    rendered_sources = []
    for s in registry_sources:
        rendered_sources.append({
            "slot_number": s.slot_number,
            "provider_name": s.provider_name,
            "media_url": s.media_url,
            "official_page_url": s.official_page_url,
            "stream_type": s.stream_type,
            "quality": s.quality,
            "is_playable": s.is_playable,
            "rights_status": s.rights_status,
            "license_id": s.license_id
        })

    return jsonify({
        "success": True,
        "item_id": id,
        "title": item.get("title"),
        "is_playable": bool(item.get("is_playable")),
        "rights_status": item.get("rights_status"),
        "direct_stream_url": item.get("media_url") if item.get("is_playable") else None,
        "official_archive_page": item.get("source_page_url"),
        "internal_sources": sources_info.get("sources", []),
        "provider_slots": rendered_sources
    }), 200


@open_library_bp.route("/item/<id>/verify", methods=["POST"])
@open_library_bp.route("/<id>/verify", methods=["POST"])
def verify_item(id: str):
    """
    Performs live API verification of item metadata, file enumeration,
    media URL accessibility with HTTP range check, and persists the verified state.
    """
    item = get_open_media_item(id)
    if not item:
        return jsonify({
            "success": False,
            "error": f"Open media record '{id}' not found."
        }), 404

    media_url = item.get("media_url")
    is_playable = False
    verification_detail = {}
    new_rights_status = item.get("rights_status", "discovered")
    notes = item.get("rights_notes", "")

    # 1. If direct media_url exists, perform live range test
    if media_url:
        health = ArchiveOrgAdapter.verify_media_url(media_url, timeout=5.0)
        is_playable = health.get("is_playable", False)
        verification_detail = health
        if is_playable:
            new_rights_status = "playable"
            notes = f"Verified range playback (HTTP {health.get('status_code', 206)}, Content-Type: {health.get('content_type', 'video/mp4')})."
        else:
            notes = f"Media URL verification failed: {health.get('error', 'Unreachable')}"

    # 2. If not playable and source is archive_org, check archive metadata dynamically
    if not is_playable and ("archive.org" in str(item.get("source_page_url") or "") or item.get("source_name") == "archive_org"):
        identifier = item.get("source_item_id") or id
        metadata = ArchiveOrgAdapter.fetch_item_metadata(identifier, timeout=6.0)
        if metadata:
            candidates = ArchiveOrgAdapter.enumerate_candidate_files(identifier, metadata.get("files", []))
            if candidates:
                best = candidates[0]
                best_test = ArchiveOrgAdapter.verify_media_url(best["direct_url"], timeout=5.0)
                if best_test.get("is_playable"):
                    is_playable = True
                    media_url = best["direct_url"]
                    new_rights_status = "playable"
                    notes = f"Verified streaming candidate from Internet Archive ({best['name']}, {best['quality']})."
                    verification_detail = best_test
            else:
                new_rights_status = "official_link_only"
                notes = "Internet Archive metadata verified; no streamable browser video file found. Archive portal page preserved."
        else:
            new_rights_status = "official_link_only"
            notes = "Archive metadata check completed. Preserving official portal reference."

    # If still not playable and item has a source_page_url, set official_link_only
    if not is_playable:
        if item.get("source_page_url"):
            new_rights_status = "official_link_only"
        else:
            new_rights_status = "unavailable"

    # Persist updated status to database
    update_open_media_verification(
        item_id=id,
        is_playable=is_playable,
        rights_status=new_rights_status,
        rights_notes=notes,
        media_url=media_url
    )

    return jsonify({
        "success": True,
        "item_id": id,
        "is_playable": is_playable,
        "rights_status": new_rights_status,
        "rights_notes": notes,
        "media_url": media_url if is_playable else None,
        "verification_detail": verification_detail
    }), 200


@open_library_bp.route("/ingest", methods=["POST"])
def ingest_record():
    """
    Ingests or synchronizes a media record into the catalog.
    Enforces uniqueness, provenance tracking, and digital rights evaluation.
    """
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"success": False, "error": "Title is required."}), 400

    item_id = data.get("id") or title.lower().replace(" ", "-")
    source_name = data.get("source_name") or "archive_org"

    # Evaluate rights
    rights_status, notes, _ = RightsEngine.evaluate_media_rights(data)
    audio_info = RightsEngine.verify_kannada_content(data)

    record = {
        **data,
        "id": item_id,
        "source_name": source_name,
        "source_item_id": data.get("source_item_id") or item_id,
        "rights_status": rights_status.value,
        "rights_notes": notes,
        "is_playable": 1 if rights_status.value == "playable" else 0,
        "is_original_kannada": 1 if audio_info["is_original_kannada"] else 0,
        "is_kannada_dubbed": 1 if audio_info["is_kannada_dubbed"] else 0,
        "verified_audio_tracks": audio_info["verified_audio_tracks"]
    }

    saved = save_open_media_record(record)
    if saved:
        return jsonify({
            "success": True,
            "message": f"Successfully ingested '{title}' into Open Media Library.",
            "record_id": item_id,
            "rights_status": rights_status.value
        }), 201
    else:
        return jsonify({
            "success": False,
            "error": "Failed to persist media record."
        }), 500
