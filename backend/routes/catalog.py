"""
Catalog API Routes
Provides endpoints for retrieving titles, paginated discovery, top 10 rankings,
studio channels, and dynamic title details with TMDB / SQLite resolution.
"""

import re
from flask import Blueprint, jsonify, request
from backend.catalog_data import CATALOG_DATA, STUDIOS_LIST
from backend.database import get_cached_media_item, save_cached_media_item
from backend.tmdb import (
    get_tmdb_full_details,
    discover_titles_paginated,
    get_tmdb_watch_providers,
    format_tmdb_item,
    fetch_tmdb
)

catalog_bp = Blueprint("catalog", __name__, url_prefix="/api")


@catalog_bp.route("/catalog")
def get_catalog():
    """
    Retrieve streaming catalog with optional filters and pagination:
    - category: 'anime', 'movies', 'series'
    - studio: e.g. 'MAPPA', 'Crunchyroll', 'Paramount'
    - q: search keyword
    - page: page number (default 1)
    - limit: maximum results
    """
    category = request.args.get("category", "").strip().lower()
    studio = request.args.get("studio", "").strip().lower()
    query = request.args.get("q", "").strip().lower()
    dub = request.args.get("dub", "").strip().lower()
    sub = request.args.get("sub", "").strip().lower()
    lang = (request.args.get("lang") or request.args.get("language") or "").strip().lower()
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", type=int) or 50
    paginate = request.args.get("paginate", "0") == "1" or "page" in request.args

    results = list(CATALOG_DATA)

    if category and category != "all":
        results = [item for item in results if item.get("type", "").lower() == category]

    if studio:
        results = [item for item in results if studio in (item.get("studio") or "").lower()]

    if dub:
        results = [
            item for item in results
            if any(dub in d.lower() for d in item.get("dubs", []))
            or any(dub in a.lower() for a in item.get("audio", []))
        ]

    if sub:
        results = [
            item for item in results
            if any(sub in s.lower() for s in item.get("subs", []))
        ]

    if lang and lang != "all":
        lang_map = {
            "kn": "kannada",
            "hi": "hindi",
            "en": "english",
            "ja": "japanese",
            "ta": "tamil",
            "te": "telugu",
            "ko": "korean",
            "es": "spanish",
            "fr": "french",
            "de": "german"
        }
        target_lang = lang_map.get(lang, lang)
        results = [
            item for item in results
            if (item.get("language") and target_lang in item["language"].lower())
            or (item.get("isKannada") and target_lang == "kannada")
            or any(target_lang in d.lower() for d in item.get("dubs", []))
            or any(target_lang in a.lower() for a in item.get("audio", []))
            or any(target_lang in s.lower() for s in item.get("subs", []))
        ]
        if target_lang == "kannada":
            results.sort(key=lambda x: 1 if (x.get("language") == "Kannada" or x.get("isKannada")) else 0, reverse=True)
        elif target_lang == "hindi":
            results.sort(key=lambda x: 1 if (x.get("language") == "Hindi") else 0, reverse=True)

    if query:
        results = [
            item for item in results
            if query in item.get("title", "").lower()
            or query in item.get("overview", "").lower()
            or query in item.get("studio", "").lower()
            or any(query in g.lower() for g in item.get("genres", []))
            or any(query in a.get("name", "").lower() for a in item.get("xray", {}).get("actors", []))
        ]

    total_results = len(results)
    total_pages = max(1, (total_results + limit - 1) // limit)

    if paginate:
        start = (page - 1) * limit
        end = start + limit
        paginated_results = results[start:end]
        return jsonify({
            "page": page,
            "total_pages": total_pages,
            "total_results": total_results,
            "results": paginated_results
        })

    if limit and limit > 0:
        results = results[:limit]

    return jsonify(results)


@catalog_bp.route("/catalog/<title_id>")
def get_title(title_id):
    """
    Retrieve detailed title metadata including in-stream X-Ray intelligence.
    Dynamically resolves any TMDB ID or catalog slug so movie detail pages never break.
    """
    str_id = str(title_id).strip()

    # 1. Check in curated CATALOG_DATA
    item = next((i for i in CATALOG_DATA if str(i.get("id")) == str_id or str(i.get("tmdbId")) == str_id), None)
    if item:
        return jsonify(item)

    # 2. Check in SQLite cache
    cached = get_cached_media_item(str_id)
    if cached:
        return jsonify(cached)

    # 3. Resolve from TMDB dynamically
    digits = re.findall(r"\d+", str_id)
    if digits:
        tmdb_numeric_id = int(digits[-1])
        media_type = "tv" if ("series" in str_id or "anime" in str_id or "tv" in str_id) else "movie"
        try:
            full_item = get_tmdb_full_details(media_type, tmdb_numeric_id)
            if full_item:
                return jsonify(full_item)
            # Try alternate media type if first failed
            alt_type = "movie" if media_type == "tv" else "tv"
            alt_item = get_tmdb_full_details(alt_type, tmdb_numeric_id)
            if alt_item:
                return jsonify(alt_item)
        except Exception as e:
            print(f"Error dynamically resolving TMDB ID {str_id}: {e}")

    return jsonify({"error": "Title not found", "id": title_id}), 404


@catalog_bp.route("/discover/movies")
def discover_movies():
    """Paginated Worldwide movie discovery engine."""
    page = request.args.get("page", 1, type=int)
    sort_by = request.args.get("sort_by", "popularity.desc")
    lang = request.args.get("lang") or request.args.get("language")
    genres = request.args.get("genres")
    year = request.args.get("year", type=int)

    data = discover_titles_paginated(
        media_type="movie",
        page=page,
        sort_by=sort_by,
        with_original_language=lang,
        with_genres=genres,
        year=year
    )
    return jsonify(data)


@catalog_bp.route("/discover/tv")
def discover_tv():
    """Paginated Worldwide TV series discovery engine."""
    page = request.args.get("page", 1, type=int)
    sort_by = request.args.get("sort_by", "popularity.desc")
    lang = request.args.get("lang") or request.args.get("language")
    genres = request.args.get("genres")
    year = request.args.get("year", type=int)

    data = discover_titles_paginated(
        media_type="tv",
        page=page,
        sort_by=sort_by,
        with_original_language=lang,
        with_genres=genres,
        year=year
    )
    return jsonify(data)


@catalog_bp.route("/discover/anime")
def discover_anime():
    """Paginated Anime discovery engine."""
    page = request.args.get("page", 1, type=int)
    sort_by = request.args.get("sort_by", "popularity.desc")

    data = discover_titles_paginated(
        media_type="tv",
        page=page,
        sort_by=sort_by,
        with_original_language="ja",
        with_genres="16"
    )
    return jsonify(data)


@catalog_bp.route("/watch-providers/<media_type>/<int:tmdb_id>")
def watch_providers_endpoint(media_type, tmdb_id):
    """Retrieve verified watch providers with JustWatch attribution."""
    region = request.args.get("region", "IN").upper()
    data = get_tmdb_watch_providers(media_type=media_type, tmdb_id=tmdb_id, region=region)
    return jsonify(data)


@catalog_bp.route("/top10")
def get_top10():
    """Retrieve Netflix-style Top 10 rankings today."""
    return jsonify(CATALOG_DATA[:10])


@catalog_bp.route("/studios")
def get_studios():
    """Retrieve Amazon Prime style Studio & Network Hubs with title counts."""
    studios_with_counts = []
    for s in STUDIOS_LIST:
        matching_count = sum(1 for item in CATALOG_DATA if s["name"].lower() in (item.get("studio") or "").lower())
        studios_with_counts.append({
            **s,
            "titles_count": matching_count
        })
    return jsonify(studios_with_counts)
