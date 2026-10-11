import os
import requests
from flask import Blueprint, jsonify, request

kannada_bp = Blueprint("kannada", __name__)

TMDB_URL = "https://api.themoviedb.org/3"


def tmdb_get(path, params):
    token = os.getenv("TMDB_ACCESS_TOKEN")
    if not token:
        raise RuntimeError("TMDB_ACCESS_TOKEN is not configured")

    response = requests.get(
        f"{TMDB_URL}{path}",
        headers={
            "Authorization": f"Bearer {token}",
            "accept": "application/json",
        },
        params=params,
        timeout=15,
    )
    response.raise_for_status()
    return response.json()


@kannada_bp.get("/api/kannada")
def get_kannada_catalog():
    page = request.args.get("page", 1, type=int)
    page = max(1, min(page or 1, 500))

    media_type = request.args.get("type", "movie").lower()
    if media_type not in ("movie", "tv"):
        return jsonify({"error": "type must be movie or tv"}), 400

    try:
        data = tmdb_get(f"/discover/{media_type}", {
            "with_original_language": "kn",
            "language": "en-US",
            "sort_by": "popularity.desc",
            "page": page,
            "include_adult": "false",
        })

        results = []
        for item in data.get("results", []):
            results.append({
                "id": item["id"],
                "media_type": media_type,
                "title": item.get("title") or item.get("name"),
                "original_language": item.get("original_language"),
                "overview": item.get("overview", ""),
                "release_date": (
                    item.get("release_date")
                    or item.get("first_air_date")
                    or ""
                ),
                "poster_url": (
                    "https://image.tmdb.org/t/p/w500"
                    + item["poster_path"]
                    if item.get("poster_path") else None
                ),
                "audio_verified": False,
                "playable": False,
            })

        return jsonify({
            "page": data.get("page", page),
            "total_pages": data.get("total_pages", 0),
            "total_results": data.get("total_results", 0),
            "results": results,
            "note": (
                "Original-language metadata does not verify dubbed audio. "
                "Playback requires a separately authorized video source."
            ),
        })

    except requests.RequestException:
        return jsonify({"error": "TMDB request failed"}), 502
    except RuntimeError as error:
        return jsonify({"error": str(error)}), 500