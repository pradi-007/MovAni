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

    matches = [
        item for item in CATALOG_DATA
        if query in item["title"].lower()
        or query in item["overview"].lower()
        or query in item["studio"].lower()
        or any(query in g.lower() for g in item["genres"])
        or any(query in a["name"].lower() for a in item["xray"]["actors"])
    ]
    return jsonify(matches)
