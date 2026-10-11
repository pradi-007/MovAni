"""
Catalog API Routes
Provides endpoints for retrieving titles, top 10 rankings, and studio channels.
"""

from flask import Blueprint, jsonify, request
from backend.catalog_data import CATALOG_DATA, STUDIOS_LIST

catalog_bp = Blueprint("catalog", __name__, url_prefix="/api")


@catalog_bp.route("/catalog")
def get_catalog():
    """
    Retrieve streaming catalog with optional filters:
    - category: 'anime', 'movies', 'series'
    - studio: e.g. 'MAPPA', 'Crunchyroll', 'Paramount'
    - q: search keyword
    - limit: maximum results
    """
    category = request.args.get("category", "").strip().lower()
    studio = request.args.get("studio", "").strip().lower()
    query = request.args.get("q", "").strip().lower()
    dub = request.args.get("dub", "").strip().lower()
    sub = request.args.get("sub", "").strip().lower()
    lang = request.args.get("lang", "").strip().lower()
    limit = request.args.get("limit", type=int)

    results = CATALOG_DATA

    if category and category != "all":
        results = [item for item in results if item["type"].lower() == category]

    if studio:
        results = [item for item in results if studio in item["studio"].lower()]

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
            or any(target_lang in d.lower() for d in item.get("dubs", []))
            or any(target_lang in a.lower() for a in item.get("audio", []))
            or any(target_lang in s.lower() for s in item.get("subs", []))
        ]

    if query:
        results = [
            item for item in results
            if query in item["title"].lower()
            or query in item["overview"].lower()
            or query in item["studio"].lower()
            or any(query in g.lower() for g in item["genres"])
            or any(query in a["name"].lower() for a in item["xray"]["actors"])
        ]

    if limit and limit > 0:
        results = results[:limit]

    return jsonify(results)


@catalog_bp.route("/catalog/<title_id>")
def get_title(title_id):
    """Retrieve detailed title metadata including in-stream X-Ray intelligence."""
    item = next((i for i in CATALOG_DATA if i["id"] == title_id), None)
    if not item:
        return jsonify({"error": "Title not found"}), 404
    return jsonify(item)


@catalog_bp.route("/top10")
def get_top10():
    """Retrieve Netflix-style Top 10 rankings today."""
    return jsonify(CATALOG_DATA[:10])


@catalog_bp.route("/studios")
def get_studios():
    """Retrieve Amazon Prime style Studio & Network Hubs with title counts."""
    studios_with_counts = []
    for s in STUDIOS_LIST:
        matching_count = sum(1 for item in CATALOG_DATA if s["name"].lower() in item["studio"].lower())
        studios_with_counts.append({
            **s,
            "titles_count": matching_count
        })
    return jsonify(studios_with_counts)
