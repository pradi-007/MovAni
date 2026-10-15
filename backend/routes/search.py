"""
Search API Routes
Provides live multi-attribute full-text filtering across titles, actors, genres,
studios, and proxies TMDB global search with unified deduplication.
"""

import time
from flask import Blueprint, jsonify, request
from backend.catalog_data import CATALOG_DATA
from backend.tmdb import search_tmdb

search_bp = Blueprint("search", __name__, url_prefix="/api")

_SEARCH_CACHE = {}
_SEARCH_CACHE_TTL = 300  # 5 minutes in-memory cache


@search_bp.route("/search")
def search_titles():
    """
    Worldwide live search across titles, actors, genres, overviews,
    and TMDB global movie and TV catalog with deduplication.
    """
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify([])

    limit = request.args.get("limit", 25, type=int)
    page = request.args.get("page", 1, type=int)

    norm_q = query.lower().replace("doreman", "doraemon").replace("doremon", "doraemon")

    cache_key = f"{norm_q}:{limit}:{page}"
    now = time.time()
    if cache_key in _SEARCH_CACHE and (now - _SEARCH_CACHE[cache_key]["time"]) < _SEARCH_CACHE_TTL:
        return jsonify(_SEARCH_CACHE[cache_key]["data"])

    # 1. Search curated / local catalog
    local_matches = [
        item for item in CATALOG_DATA
        if (norm_q in item.get("title", "").lower() or query.lower() in item.get("title", "").lower())
        or (norm_q in item.get("overview", "").lower())
        or (norm_q in (item.get("studio") or "").lower())
        or (item.get("language") and norm_q in item["language"].lower())
        or any(norm_q in g.lower() for g in item.get("genres", []))
        or any(norm_q in d.lower() for d in item.get("dubs", []))
        or any(norm_q in a.get("name", "").lower() for a in item.get("xray", {}).get("actors", []))
    ]

    # 1b. Search cached anime catalogue
    anime_matches = []
    try:
        from backend.database import search_anime_catalog
        anime_matches = search_anime_catalog(norm_q, limit=limit)
    except Exception:
        pass

    # 2. Query TMDB global library
    tmdb_matches = []
    try:
        tmdb_matches = search_tmdb(norm_q, limit=limit)
    except Exception as e:
        print(f"TMDB search error for '{query}': {e}")

    # 3. Merge & Deduplicate
    seen_ids = set()
    seen_titles = set()
    combined = []

    for item in local_matches + anime_matches:
        tid = str(item.get("tmdbId") or item.get("tmdb_id") or item.get("id"))
        t_title = item.get("title", "").strip().lower()
        if tid not in seen_ids and t_title not in seen_titles:
            seen_ids.add(tid)
            seen_titles.add(t_title)
            combined.append(item)

    for item in tmdb_matches:
        tid = str(item.get("tmdbId") or item.get("id"))
        t_title = item.get("title", "").strip().lower()
        if tid not in seen_ids and t_title not in seen_titles:
            seen_ids.add(tid)
            seen_titles.add(t_title)
            combined.append(item)

    # Kannada Boost if user searched for Kannada
    if "kannada" in norm_q or norm_q == "kn" or "ಕನ್ನಡ" in query:
        combined.sort(key=lambda x: 1 if (x.get("language") == "Kannada" or x.get("isKannada") or x.get("original_language") == "kn") else 0, reverse=True)

    # Slice results
    start = (page - 1) * limit
    end = start + limit
    paginated = combined[start:end] if page > 1 else combined[:limit]

    _SEARCH_CACHE[cache_key] = {"time": time.time(), "data": paginated}
    return jsonify(paginated)
