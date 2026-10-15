#!/usr/bin/env python3
"""
MOVAni Anime Catalogue Routes
Provides endpoints:
- GET /api/anime/catalog: Filterable, paginated anime discovery adhering to Kartoons taxonomy
- GET /api/anime/search: High-speed keyword search
- GET /api/anime/genres: Available genres and category counts
- GET /api/anime/<anime_id>: Title details with multi-audio & dub metadata
- GET /api/anime/<anime_id>/episodes: Episode manifest for specified season
- GET /api/anime/<anime_id>/sources: Verified playback servers, authorized watch providers, and audio tracks
- POST /api/anime/sync: Synchronize anime catalogue with TMDB
"""

from flask import Blueprint, jsonify, request
from backend.anime_service import anime_service
from backend.database import get_anime_catalog, get_anime_item, save_anime_item

anime_bp = Blueprint("anime", __name__, url_prefix="/api/anime")


@anime_bp.route("/catalog", methods=["GET"])
def get_catalog():
    """
    Retrieve anime titles according to Kartoons taxonomy and multi-audio filters:
    - category: 'popular', 'trending', 'recently_updated', 'movies', 'series', 'completed', 'ongoing', 'all'
    - genre: e.g. 'Action', 'Comedy', 'Fantasy', 'Supernatural'
    - status: 'ongoing', 'completed', 'all'
    - lang / dub: 'hi' (Hindi Dubbed), 'en' (English Dubbed), 'ja' (Japanese Original), 'all'
    - q: keyword search query
    - page: page number (default 1)
    - limit: items per page (default 20)
    """
    category = request.args.get("category", "all")
    genre = request.args.get("genre")
    status = request.args.get("status")
    language = request.args.get("lang") or request.args.get("language") or request.args.get("dub")
    query = request.args.get("q")
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)

    data = anime_service.get_catalog(
        category=category,
        genre=genre,
        status=status,
        language=language,
        query=query,
        page=page,
        limit=limit
    )
    return jsonify(data)


@anime_bp.route("/search", methods=["GET"])
def search_anime():
    """Search anime titles with optional genre or language filters."""
    query = request.args.get("q", "").strip()
    genre = request.args.get("genre")
    language = request.args.get("lang") or request.args.get("language")
    limit = request.args.get("limit", 20, type=int)

    data = anime_service.search(query=query, genre=genre, language=language, limit=limit)
    return jsonify(data)


@anime_bp.route("/genres", methods=["GET"])
def get_genres():
    """Return distinct genres with title counts."""
    genres = anime_service.get_genres()
    return jsonify({"genres": genres})


@anime_bp.route("/<anime_id>", methods=["GET"])
def get_title_details(anime_id):
    """Retrieve full details, audio tracks, and dub information for an anime title."""
    details = anime_service.get_details(anime_id)
    if not details:
        # Fallback to database lookup
        db_item = get_anime_item(anime_id)
        if db_item:
            details = db_item

    if details:
        return jsonify(details)
    return jsonify({"error": "Anime title not found", "id": anime_id}), 404


@anime_bp.route("/<anime_id>/episodes", methods=["GET"])
def get_episodes(anime_id):
    """Retrieve season episodes manifest."""
    season = request.args.get("season", 1, type=int)
    episodes = anime_service.get_episodes(anime_id, season_number=season)
    return jsonify({
        "anime_id": anime_id,
        "season": season,
        "total_episodes": len(episodes),
        "episodes": episodes
    })


@anime_bp.route("/<anime_id>/sources", methods=["GET"])
def get_sources(anime_id):
    """Retrieve playback source manifests, authorized providers, and verified audio tracks."""
    season = request.args.get("season", 1, type=int)
    episode = request.args.get("episode", 1, type=int)

    sources = anime_service.get_playback_sources(anime_id, season_number=season, episode_number=episode)
    return jsonify(sources)


@anime_bp.route("/sync", methods=["POST"])
def sync_anime():
    """Sync anime catalog with TMDB discovery."""
    try:
        catalog = anime_service.get_catalog(category="all", page=1, limit=50)
        for item in catalog.get("results", []):
            save_anime_item(item)
        return jsonify({
            "status": "success",
            "message": "Anime catalogue synchronized successfully",
            "synced_count": len(catalog.get("results", []))
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
