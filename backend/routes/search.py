"""
Search API Routes
Provides live multi-attribute full-text filtering across titles, actors, genres, and studios.
"""

from flask import Blueprint, jsonify, request
from backend.catalog_data import CATALOG_DATA

search_bp = Blueprint("search", __name__, url_prefix="/api")


@search_bp.route("/search")
def search_titles():
    """Instant live search across titles, actors, genres, and overviews."""
    query = request.args.get("q", "").strip().lower()
    if not query:
        return jsonify([])

    norm_q = query.replace("doreman", "doraemon").replace("doremon", "doraemon")

    matches = [
        item for item in CATALOG_DATA
        if (query in item["title"].lower() or norm_q in item["title"].lower())
        or (query in item["overview"].lower() or norm_q in item["overview"].lower())
        or query in item["studio"].lower()
        or (item.get("language") and (query in item["language"].lower() or norm_q in item["language"].lower()))
        or any(query in g.lower() or norm_q in g.lower() for g in item.get("genres", []))
        or any(query in d.lower() for d in item.get("dubs", []))
        or any(query in a["name"].lower() or norm_q in a["name"].lower() for a in item.get("xray", {}).get("actors", []))
    ]
    if "kannada" in query or query == "kn" or "ಕನ್ನಡ" in query:
        matches.sort(key=lambda x: 1 if (x.get("language") == "Kannada" or x.get("isKannada")) else 0, reverse=True)

    return jsonify(matches)
