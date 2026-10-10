#!/usr/bin/env python3
"""
MOVAni Backend Application
Flask entrypoint registering modular Blueprints and serving the Frontend.
"""

import os
import sys

# Ensure root directory is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from flask import Flask, jsonify, send_from_directory
from backend.database import init_db, DB_PATH
from backend.catalog_data import CATALOG_DATA
from backend.routes import catalog_bp, user_bp, search_bp, tmdb_bp, ott_bp

FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")

# Register API blueprints
app.register_blueprint(catalog_bp)
app.register_blueprint(user_bp)
app.register_blueprint(search_bp)
app.register_blueprint(tmdb_bp)
app.register_blueprint(ott_bp)


# ================= CORS & CROSS-ORIGIN SUPPORT FOR FLUTTER & WEB =================

@app.after_request
def add_cors_headers(response):
    """Allow Flutter mobile apps, emulators, and external localhost clients to query APIs."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
    return response


@app.route("/api/<path:path>", methods=["OPTIONS"])
def handle_options_preflight(path):
    """Handle preflight requests for Flutter mobile app REST calls."""
    return "", 204



# ================= FRONTEND SERVING =================

@app.route("/")
def index():
    """Serve the primary MOVAni single-page streaming application."""
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:filename>")
def serve_static(filename):
    """Serve frontend static assets (CSS, JS, images)."""
    return send_from_directory(FRONTEND_DIR, filename)


# ================= SYSTEM HEALTH =================

@app.route("/api/health")
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "app": "MOVAni",
        "version": "2.2.0",
        "architecture": "modular_flask_and_vanilla_spa",
        "titles_count": len(CATALOG_DATA),
        "tmdb_enabled": True,
        "ott_provider": "Universal Master OTT Platform",
        "ott_ad_free": True,
        "ott_platforms": ["Netflix", "Prime Video", "Disney+ Hotstar", "Apple TV+", "HBO Max", "Crunchyroll", "Paramount+", "JioCinema", "Zee5"]
    })


def create_app():
    """Application factory for testing and deployment."""
    init_db()
    return app


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 5000))
    print("=" * 65)
    print("🎬 MOVAni Streaming Web Application (Modular Backend)")
    print(f"📡 Backend URL:     http://127.0.0.1:{port}")
    print(f"🌐 Frontend Folder: {FRONTEND_DIR}")
    print(f"🗄️ SQLite Database: {DB_PATH}")
    print(f"📚 Catalog Titles:  {len(CATALOG_DATA)} titles loaded")
    print("=" * 65)
    app.run(host="0.0.0.0", port=port, debug=True)
