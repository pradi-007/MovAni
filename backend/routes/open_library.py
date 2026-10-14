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
    save_open_media_record
)
from backend.streaming.rights import RightsEngine

open_library_bp = Blueprint("open_library", __name__, url_prefix="/api/open-library")


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


@open_library_bp.route("/item/<id>", methods=["GET"])
def get_item(id: str):
    """Retrieves full metadata, license evidence, and audio tracks for an open media item."""
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


@open_library_bp.route("/stats", methods=["GET"])
def get_stats():
    """Returns live database counts and faceted breakdowns."""
    stats = get_open_media_stats()
    return jsonify({
        "success": True,
        "stats": stats
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
