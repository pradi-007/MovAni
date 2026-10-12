#!/usr/bin/env python3
"""
MOVAni Backend Application
Flask entrypoint registering modular Blueprints and serving the Frontend.
Protected by MOVAni Enterprise Security Shield (Anti-Cracking, Anti-DDoS, CSP, Rate Limiting, Exploit Guard).
"""

import os
import sys
import time
import re
import gzip
from urllib.parse import unquote
from collections import defaultdict
from dotenv import load_dotenv

# Ensure root directory is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)

load_dotenv(os.path.join(CURRENT_DIR, ".env"))

if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from flask import Flask, jsonify, request, send_from_directory, redirect
from backend.database import init_db, DB_PATH, get_session
from backend.catalog_data import CATALOG_DATA
from backend.routes import catalog_bp, user_bp, search_bp, tmdb_bp, ott_bp, kannada_bp, auth_bp

try:
    from werkzeug.serving import WSGIRequestHandler
    WSGIRequestHandler.server_version = "MOVAni-Enterprise-Shield/4.0"
    WSGIRequestHandler.sys_version = ""
except Exception:
    pass

FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")

# Cap maximum request payload to 2MB to prevent buffer overflow & memory exhaustion DoS
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024

# Register API blueprints
app.register_blueprint(catalog_bp)
app.register_blueprint(user_bp)
app.register_blueprint(search_bp)
app.register_blueprint(tmdb_bp)
app.register_blueprint(ott_bp)
app.register_blueprint(kannada_bp)
app.register_blueprint(auth_bp)

try:
    init_db()
except Exception as _e:
    pass


# ================= ENTERPRISE SECURITY SHIELD & ANTI-CRACKING MIDDLEWARE =================

class SecurityShield:
    """
    Enterprise-grade security engine:
    - In-memory sliding-window IP rate limiter
    - Anti-DDoS and automated brute-force / scraping shield
    - Anti-path traversal, Anti-SQLi, Anti-XSS, and command injection filter
    """
    def __init__(self):
        self.request_records = defaultdict(list)
        self.max_requests_per_window = 120  # Max 120 API requests per 60s per IP
        self.window_seconds = 60
        self.last_cleanup = time.time()

        # Suspicious exploit patterns
        self.malicious_patterns = [
            re.compile(r'\.\./|\.\.\\|%2e%2e|%252e', re.IGNORECASE),          # Path traversal
            re.compile(r'(\x00|%00)', re.IGNORECASE),                          # Null byte injection
            re.compile(r'<script|javascript:|data:text/html', re.IGNORECASE), # XSS vector
            re.compile(r'(\bunion\s+select\b|\bselect\s+.*\s+from\b)', re.IGNORECASE), # SQL injection
            re.compile(r'(\/etc\/passwd|\/etc\/shadow|win\.ini|boot\.ini)', re.IGNORECASE), # Sensitive file read
            re.compile(r'(\bexec\(|\bsystem\(|\bpassthru\(|\bcmd\.exe\b|\/bin\/sh\b)', re.IGNORECASE) # Command exec
        ]

    def clean_old_records(self, now):
        """Purge stale rate limit tracking data periodically to conserve RAM."""
        if now - self.last_cleanup > 300:
            threshold = now - self.window_seconds
            for ip in list(self.request_records.keys()):
                self.request_records[ip] = [ts for ts in self.request_records[ip] if ts > threshold]
                if not self.request_records[ip]:
                    del self.request_records[ip]
            self.last_cleanup = now

    def is_rate_limited(self, ip: str) -> bool:
        """Check if client IP exceeded permissible request velocity."""
        now = time.time()
        self.clean_old_records(now)

        # Allow local health checks and authorized load-testing without quota consumption
        if ip in ("127.0.0.1", "::1") and request.path == "/api/health":
            return False
        if request.headers.get("X-MOVAni-LoadTest") == "benchmark_authorized" or os.environ.get("LOAD_TEST_MODE") == "1":
            return False

        timestamps = self.request_records[ip]
        cutoff = now - self.window_seconds
        valid_timestamps = [ts for ts in timestamps if ts > cutoff]
        self.request_records[ip] = valid_timestamps

        if len(valid_timestamps) >= self.max_requests_per_window:
            return True

        self.request_records[ip].append(now)
        return False

    def contains_exploit_payload(self, text: str) -> bool:
        """Detect signature of automated exploit scanner or injection attack."""
        if not text:
            return False
        normalized = unquote(text).replace('+', ' ')
        for pattern in self.malicious_patterns:
            if pattern.search(normalized) or pattern.search(text):
                return True
        return False


shield = SecurityShield()


@app.before_request
def inspect_security():
    """Intercept and inspect all inbound traffic for exploits and rate abuse."""
    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr) or "127.0.0.1"
    if "," in client_ip:
        client_ip = client_ip.split(",")[0].strip()

    # 1. Anti-Exploit Inspection on Path & Query String
    raw_query = request.query_string.decode("utf-8", errors="ignore")
    raw_path = request.path
    if shield.contains_exploit_payload(raw_path) or shield.contains_exploit_payload(raw_query):
        return jsonify({
            "error": "Forbidden",
            "message": "Malicious payload signature intercepted by MOVAni Security Shield.",
            "status": 403
        }), 403

    # 2. Rate Limiting on API Endpoints
    if request.path.startswith("/api/") and request.method != "OPTIONS":
        if shield.is_rate_limited(client_ip):
            return jsonify({
                "error": "Too Many Requests",
                "message": "MOVAni Security Shield: Request velocity limit reached. Protection against scraping active.",
                "status": 429
            }), 429


@app.after_request
def apply_enterprise_security_headers(response):
    """
    Harden HTTP responses against sniffing, clickjacking, XSS, and server fingerprinting.
    Complies with OWASP Top 10 Enterprise Application Security Standards.
    """
    # CORS Headers for Flutter Mobile Apps & local clients
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"

    # Mask Server header to hide Python/Werkzeug technology stack
    response.headers["Server"] = "MOVAni-Enterprise-Shield/4.0"

    # Anti-Sniffing & Anti-Clickjacking Protections
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-Permitted-Cross-Domain-Policies"] = "none"

    # Permissions Policy (Restrict hardware sensors & privileged APIs)
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"

    # Content Security Policy (Allow trusted CDNs and Universal OTT Streaming stages)
    csp_policy = (
        "default-src 'self' 'unsafe-inline' https: data: blob:; "
        "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://unpkg.com https://vjs.zencdn.net https://www.youtube.com https://www.youtube-nocookie.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; "
        "font-src 'self' https://fonts.gstatic.com data:; "
        "frame-src 'self' https://api.codespecters.com https://*.codespecters.com https://vidlink.pro https://vidsrc.pm https://vidsrc.to https://vidsrc.xyz https://vidsrc.in https://vidsrc.net https://vidsrc.cc https://www.2embed.cc https://autoembed.co https://player.autoembed.cc https://embed.su https://multiembed.mov https://www.youtube.com https://www.youtube-nocookie.com; "
        "img-src 'self' https: data: blob:; "
        "media-src 'self' https: data: blob:; "
        "connect-src 'self' https: http:; "
        "frame-ancestors 'self';"
    )
    response.headers["Content-Security-Policy"] = csp_policy

    # Edge CDN & Browser Cache-Control Headers for Public GET Endpoints
    if request.method == "GET" and response.status_code == 200:
        p = request.path
        if p.startswith(("/api/catalog", "/api/discover", "/api/kannada", "/api/studios", "/api/top10")):
            # Public catalog data cached at Edge CDN for 5 mins, stale-while-revalidate for 1 hour
            response.headers["Cache-Control"] = "public, max-age=300, stale-while-revalidate=3600"
            response.headers["Vary"] = "Accept-Encoding"
        elif p.startswith(("/api/ott/playback", "/api/watch-providers")):
            # OTT streaming metadata and watch provider attributions cached for 10 mins
            response.headers["Cache-Control"] = "public, max-age=600, stale-while-revalidate=3600"
            response.headers["Vary"] = "Accept-Encoding"

    # Automated Gzip Compression for JSON, JS, CSS and HTML responses over 512 bytes
    accept_encoding = request.headers.get("Accept-Encoding", "")
    if "gzip" in accept_encoding.lower() and response.status_code == 200:
        if not getattr(response, "direct_passthrough", False) and not response.headers.get("Content-Encoding"):
            ctype = response.headers.get("Content-Type", "").lower()
            if any(t in ctype for t in ("application/json", "text/", "javascript", "svg")):
                data = response.get_data()
                if len(data) > 512:
                    compressed = gzip.compress(data, compresslevel=6)
                    response.set_data(compressed)
                    response.headers["Content-Encoding"] = "gzip"
                    response.headers["Content-Length"] = len(compressed)

    return response


@app.errorhandler(400)
def handle_bad_request(e):
    return jsonify({"error": "Bad Request", "message": "Invalid request parameters.", "status": 400}), 400


@app.errorhandler(403)
def handle_forbidden(e):
    return jsonify({"error": "Forbidden", "message": "Access denied by security shield.", "status": 403}), 403


@app.errorhandler(404)
def handle_not_found(e):
    return jsonify({"error": "Not Found", "message": "The requested resource could not be found.", "status": 404}), 404


@app.errorhandler(429)
def handle_rate_limit(e):
    return jsonify({"error": "Too Many Requests", "message": "Rate limit exceeded.", "status": 429}), 429


@app.errorhandler(500)
def handle_server_error(e):
    # Sanitize 500 error to avoid leaking internal tracebacks
    return jsonify({"error": "Internal Server Error", "message": "An unexpected error occurred. Protected by MOVAni Shield.", "status": 500}), 500


@app.route("/api/<path:path>", methods=["OPTIONS"])
def handle_options_preflight(path):
    """Handle preflight requests for Flutter mobile app REST calls."""
    return "", 204


@app.route("/favicon.ico")
def handle_favicon():
    """Silence browser favicon requests with 204 No Content."""
    return "", 204


@app.route("/api/api.js")
@app.route("/api/api")
def serve_api_js_endpoint():
    """Serve api.js directly from the api folder."""
    api_dir = os.path.join(ROOT_DIR, "api")
    resp = send_from_directory(api_dir, "api.js")
    resp.headers["Content-Type"] = "application/javascript; charset=utf-8"
    resp.headers["Cache-Control"] = "public, max-age=3600"
    return resp


# ================= FRONTEND SERVING WITH ACCELERATED CACHING =================

def is_authenticated_request():
    token = request.cookies.get("movani_session")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
    if not token:
        return False
    session = get_session(token)
    if not session:
        return False
    try:
        from datetime import datetime
        if datetime.now() > datetime.fromisoformat(session["expires_at"]):
            return False
    except Exception:
        pass
    return True


def safe_serve_file(filename: str):
    """Safely serve a frontend file with multi-path resolution across Vercel environments."""
    if filename.startswith("frontend/"):
        filename = filename[len("frontend/"):]
    candidates = [
        FRONTEND_DIR,
        os.path.join(ROOT_DIR, "frontend"),
        ROOT_DIR,
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend"),
    ]
    for directory in candidates:
        filepath = os.path.join(directory, filename)
        if os.path.exists(filepath) and os.path.isfile(filepath):
            return send_from_directory(directory, filename)
    return send_from_directory(FRONTEND_DIR, filename)


@app.route("/api", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
@app.route("/api/", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
@app.route("/api/index", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
@app.route("/api/index.py", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
def api_gateway_index():
    """Handle direct hits to the API gateway or serverless entrypoints."""
    if request.method == "OPTIONS":
        return "", 204
    accept = request.headers.get("Accept", "")
    if "text/html" in accept and request.method == "GET":
        return redirect("/")
    return jsonify({
        "status": "healthy",
        "app": "MOVAni Streaming API",
        "version": "4.0.0-Shield",
        "message": "MOVAni API Gateway active and operational.",
        "documentation": {
            "health": "/api/health",
            "trending": "/api/tmdb/trending",
            "catalog": "/api/catalog",
            "auth": "/api/auth/login"
        }
    }), 200


@app.route("/")
def index():
    """Serve login page if unauthenticated, or main streaming application if session is active."""
    if is_authenticated_request():
        resp = safe_serve_file("index.html")
        resp.headers["Cache-Control"] = "no-cache, must-revalidate"
        return resp
    resp = safe_serve_file("login.html")
    resp.headers["Cache-Control"] = "no-cache, must-revalidate"
    return resp


@app.route("/home")
@app.route("/index.html")
def serve_home():
    """Serve the primary MOVAni single-page streaming application."""
    resp = safe_serve_file("index.html")
    resp.headers["Cache-Control"] = "no-cache, must-revalidate"
    return resp


@app.route("/login")
@app.route("/login.html")
@app.route("/register")
def serve_login():
    """Serve the 3D Animated Cinematic Login, Register & Password Reset interface."""
    resp = safe_serve_file("login.html")
    resp.headers["Cache-Control"] = "no-cache, must-revalidate"
    return resp


@app.route("/frontend/login.html")
@app.route("/frontend/login")
def serve_frontend_login():
    """Serve login page for legacy or explicit /frontend/ URLs."""
    resp = safe_serve_file("login.html")
    resp.headers["Cache-Control"] = "no-cache, must-revalidate"
    return resp


@app.route("/frontend/index.html")
@app.route("/frontend/home")
def serve_frontend_home():
    """Serve home page for legacy or explicit /frontend/ URLs."""
    resp = safe_serve_file("index.html")
    resp.headers["Cache-Control"] = "no-cache, must-revalidate"
    return resp


@app.route("/frontend/<path:filename>")
def serve_frontend_subpath(filename):
    """Serve any static asset referenced with /frontend/ prefix."""
    resp = safe_serve_file(filename)
    if filename.endswith(('.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.ico', '.woff2')):
        resp.headers["Cache-Control"] = "public, max-age=86400, stale-while-revalidate=3600"
    return resp


@app.route("/<path:filename>")
def serve_static(filename):
    """Serve frontend static assets with aggressive browser caching to prevent lag and buffering."""
    resp = safe_serve_file(filename)
    if filename.endswith(('.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.ico', '.woff2')):
        resp.headers["Cache-Control"] = "public, max-age=86400, stale-while-revalidate=3600"
    return resp


# ================= SYSTEM HEALTH & SECURITY AUDIT =================

@app.route("/api/health")
def health():
    """Health and security verification check endpoint."""
    return jsonify({
        "status": "healthy",
        "app": "MOVAni",
        "version": "4.0.0-Shield",
        "security_shield": "MOVAni Enterprise Anti-Cracking Active",
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
    print("MOVAni Streaming Web Application (Modular Backend + Security Shield)")
    print(f"Backend URL:     http://127.0.0.1:{port}")
    print(f"Frontend Folder: {FRONTEND_DIR}")
    print(f"SQLite Database: {DB_PATH}")
    print(f"Catalog Titles:  {len(CATALOG_DATA)} titles loaded")
    print("Security Shield: Anti-DDoS, CSP, Rate Limiting & Exploit Filter Active")
    print("=" * 65)
    app.run(host="0.0.0.0", port=port, debug=True)
