#!/usr/bin/env python3
"""
Universal Master OTT API Routes for MOVAni
Provides endpoints:
- /api/ott/session: Stream session token generator
- /api/ott/playback/<content_id>: Universal Master 4K Ad-Free Stream Manifest (All Platforms • All Languages)
- /api/ott/status: Universal Master OTT Platform health
"""

from flask import Blueprint, jsonify, request
from backend.universal_ott import (
    generate_ott_session,
    get_universal_playback_manifest,
    get_master_ott_status
)

ott_bp = Blueprint("ott", __name__, url_prefix="/api/ott")


@ott_bp.route("/session", methods=["GET", "POST"])
def ott_session():
    """Generate or retrieve a valid Universal Master OTT Session token."""
    user_id = request.args.get("user_id", "viewer@movani.io")
    session = generate_ott_session(user_id=user_id)
    return jsonify(session)


@ott_bp.route("/playback/<content_id>", methods=["GET"])
def ott_playback(content_id):
    """
    Retrieve guaranteed 100% ad-free stream manifest for any title, season, or episode.
    Guarantees no 'We couldn't find this content or episode is not available' errors.
    """
    season = request.args.get("season", 1, type=int)
    episode = request.args.get("episode", 1, type=int)
    audio = request.args.get("audio", "en")
    media_type = request.args.get("type", None)
    
    manifest = get_universal_playback_manifest(
        content_id=content_id,
        season=season,
        episode=episode,
        audio_lang=audio,
        media_type=media_type
    )
    return jsonify(manifest)


@ott_bp.route("/status", methods=["GET"])
def ott_status():
    """Return live status of the Universal Master OTT Video Platform."""
    status = get_master_ott_status()
    return jsonify(status)
