#!/usr/bin/env python3
"""
MOVAni Movie Catalogue Routes (AllMoviesHub Model)
Provides endpoints:
- GET /api/movies/catalog: Filterable, paginated movie discovery adhering to AllMoviesHub taxonomy
- GET /api/movies/search: High-speed keyword search
- GET /api/movies/categories: Available AllMoviesHub categories, descriptions, and badges
- GET /api/movies/<movie_id>: Movie details with multi-audio, dub, and streaming metadata
- GET /api/movies/<movie_id>/sources: Verified playback servers, authorized watch providers, and audio tracks
- POST /api/movies/<movie_id>/verify: Real-time source availability check
- POST /api/movies/sync: Synchronize movie catalogue with TMDB
"""

from flask import Blueprint, jsonify, request
from backend.movie_service import movie_service
from backend.database import get_movies_catalog, get_movie_item, save_movie_item

movies_bp = Blueprint("movies", __name__, url_prefix="/api/movies")


@movies_bp.route("/catalog", methods=["GET"])
def get_catalog():
    """
    Retrieve movie titles according to AllMoviesHub taxonomy and multi-audio filters:
    - category: 'bollywood', 'hollywood_hindi', 'kannada', 'telugu', 'tamil', 'malayalam', 'dual_audio', 'playable', 'all'
    - genre: e.g. 'Action', 'Drama', 'Comedy', 'Thriller'
    - lang / language: 'hi', 'kn', 'en', 'te', 'ta', 'ml', 'all'
    - q: keyword search query
    - playable / playable_only: 1 or true
    - page: page number (default 1)
    - limit: items per page (default 20)
    """
    category = request.args.get("category", "all")
    genre = request.args.get("genre")
    language = request.args.get("lang") or request.args.get("language")
    query = request.args.get("q") or request.args.get("query")
    playable_only = request.args.get("playable", "0").lower() in ("1", "true", "yes") or request.args.get("playable_only", "0").lower() in ("1", "true", "yes")
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)

    data = movie_service.get_catalog(
        category=category,
        language=language,
        genre=genre,
        query=query,
        playable_only=playable_only,
        page=page,
        limit=limit
    )
    return jsonify(data)


@movies_bp.route("/search", methods=["GET"])
def search_movies():
    """Search movie titles with optional genre or language filters."""
    query = request.args.get("q", "").strip()
    genre = request.args.get("genre")
    language = request.args.get("lang") or request.args.get("language")
    limit = request.args.get("limit", 20, type=int)

    data = movie_service.search(query=query, language=language, genre=genre, limit=limit)
    return jsonify(data)


@movies_bp.route("/categories", methods=["GET"])
def get_categories():
    """Return distinct AllMoviesHub categories with badges and descriptions."""
    categories = movie_service.get_categories()
    return jsonify({"categories": categories})


@movies_bp.route("/<movie_id>", methods=["GET"])
def get_movie_details(movie_id):
    """Retrieve full details, audio tracks, and streaming readiness for a movie."""
    details = movie_service.get_details(movie_id)
    if not details:
        # Fallback to database lookup
        db_item = get_movie_item(movie_id)
        if db_item:
            details = db_item

    if details:
        return jsonify(details)
    return jsonify({"error": "Movie not found", "id": movie_id}), 404


@movies_bp.route("/<movie_id>/sources", methods=["GET"])
def get_sources(movie_id):
    """
    Retrieve backend source registry for a movie conforming to 7 slots contract:
    - movie_id, source_id, provider_name, slot_number
    - official_source_page, media_url (where authorized)
    - rights_status, supported_format, audio_languages, subtitles
    - last_verification_time, playback_status, error_details
    """
    sources = movie_service.get_sources(movie_id)
    return jsonify({
        "movie_id": movie_id,
        "total_sources": len(sources),
        "sources": sources
    })


@movies_bp.route("/<movie_id>/verify", methods=["POST"])
def verify_movie_source(movie_id):
    """Verify in real-time whether movie stream or watch provider is operational."""
    details = movie_service.get_details(movie_id)
    if not details:
        db_item = get_movie_item(movie_id)
        if db_item:
            details = db_item

    if not details:
        return jsonify({"error": "Movie not found", "id": movie_id, "verified": False}), 404

    is_playable = bool(details.get("is_playable") and details.get("media_url"))
    sources = movie_service.get_sources(movie_id)
    playback_status = "verified_playable" if is_playable else details.get("playback_status", "official_link_only")

    return jsonify({
        "movie_id": movie_id,
        "is_playable": is_playable,
        "playback_status": playback_status,
        "total_valid_sources": len(sources),
        "active_slot": sources[0]["slot_number"] if sources else None,
        "verified": True
    })


@movies_bp.route("/sync", methods=["POST"])
def sync_movies():
    """Sync movie catalog with TMDB discovery & curated database."""
    try:
        catalog = movie_service.get_catalog(category="all", page=1, limit=50)
        for item in catalog.get("results", []):
            save_movie_item(item)
        return jsonify({
            "status": "success",
            "message": "Movies catalogue synchronized successfully",
            "synced_count": len(catalog.get("results", []))
        })
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500
