#!/usr/bin/env python3
"""
TMDB API Routes for MOVAni
Serves live content, trending media, anime simulcasts, and multi-search via TMDB.
"""

from flask import Blueprint, jsonify, request
from backend.tmdb import (
    check_tmdb_status,
    get_tmdb_trending,
    get_tmdb_anime,
    get_tmdb_movies,
    get_tmdb_series,
    get_tmdb_top_rated,
    get_tmdb_by_genre,
    get_tmdb_by_language,
    get_tmdb_recommendations,
    get_tmdb_tv_season,
    get_tmdb_home_rows,
    get_tmdb_full_details,
    search_tmdb
)

tmdb_bp = Blueprint("tmdb", __name__, url_prefix="/api/tmdb")


@tmdb_bp.route("/status")
def tmdb_status():
    """Check live status of TMDB connection and API key."""
    status = check_tmdb_status()
    return jsonify(status)


@tmdb_bp.route("/rows")
def tmdb_home_rows():
    """Retrieve pre-aggregated streaming rails for Netflix homepage layout."""
    rows = get_tmdb_home_rows()
    return jsonify(rows)


@tmdb_bp.route("/trending")
def tmdb_trending():
    """Retrieve live trending media from TMDB."""
    window = request.args.get("window", "day")
    limit = int(request.args.get("limit", 20))
    items = get_tmdb_trending(time_window=window, limit=limit)
    return jsonify(items)


@tmdb_bp.route("/anime")
def tmdb_anime():
    """Retrieve trending anime simulcasts from TMDB."""
    limit = int(request.args.get("limit", 15))
    items = get_tmdb_anime(limit=limit)
    return jsonify(items)


@tmdb_bp.route("/movies")
def tmdb_movies():
    """Retrieve blockbuster movies from TMDB."""
    limit = int(request.args.get("limit", 15))
    items = get_tmdb_movies(limit=limit)
    return jsonify(items)


@tmdb_bp.route("/series")
def tmdb_series():
    """Retrieve binge-worthy web series from TMDB."""
    limit = int(request.args.get("limit", 15))
    items = get_tmdb_series(limit=limit)
    return jsonify(items)


@tmdb_bp.route("/top-rated")
def tmdb_top_rated():
    """Retrieve top-rated movies or TV shows from TMDB."""
    m_type = request.args.get("type", "movie")
    limit = int(request.args.get("limit", 15))
    items = get_tmdb_top_rated(media_type=m_type, limit=limit)
    return jsonify(items)


@tmdb_bp.route("/genre/<media_type>/<int:genre_id>")
def tmdb_genre(media_type, genre_id):
    """Retrieve titles filtered by genre ID."""
    limit = int(request.args.get("limit", 15))
    items = get_tmdb_by_genre(media_type=media_type, genre_id=genre_id, limit=limit)
    return jsonify(items)


@tmdb_bp.route("/language/<lang_code>")
def tmdb_language(lang_code):
    """Retrieve titles filtered by language code (hi, ta, te, ja, ko, en, es, fr, de)."""
    limit = int(request.args.get("limit", 20))
    items = get_tmdb_by_language(lang_code=lang_code, limit=limit)
    return jsonify(items)


@tmdb_bp.route("/title/<media_type>/<int:tmdb_id>")
def tmdb_title(media_type, tmdb_id):
    """Retrieve full movie/show details including YouTube trailers and cast."""
    item = get_tmdb_full_details(media_type, tmdb_id)
    if not item:
        return jsonify({"error": "Title not found on TMDB"}), 404
    return jsonify(item)


@tmdb_bp.route("/recommendations/<media_type>/<int:tmdb_id>")
def tmdb_recommendations(media_type, tmdb_id):
    """Retrieve related recommendations for a movie or TV show."""
    limit = int(request.args.get("limit", 12))
    items = get_tmdb_recommendations(media_type=media_type, tmdb_id=tmdb_id, limit=limit)
    return jsonify(items)


@tmdb_bp.route("/tv/<int:tv_id>/season/<int:season_number>")
def tmdb_tv_season(tv_id, season_number):
    """Retrieve season episodes list with stills, descriptions, and durations."""
    season_data = get_tmdb_tv_season(tv_id=tv_id, season_number=season_number)
    return jsonify(season_data)


@tmdb_bp.route("/search")
def tmdb_search():
    """Live search across TMDB's global library."""
    query = request.args.get("q", "")
    limit = int(request.args.get("limit", 15))
    results = search_tmdb(query, limit=limit)
    return jsonify(results)
