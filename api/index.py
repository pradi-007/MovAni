#!/usr/bin/env python3
"""
MOVAni Master Vercel Serverless Function Entrypoint
Exposes top-level 'app', 'application', and 'handler' WSGI entrypoints.
"""

import os
import sys

# Ensure repository root is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app import app

from urllib.parse import parse_qs

class VercelPathNormalizationMiddleware:
    """
    Restores PATH_INFO when Vercel rewrites forward requests to /api/index
    or strips subpaths. Extracts __path query parameter or Vercel edge headers.
    """
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        original_path = ""

        # 1. Check __path query parameter
        query_string = environ.get("QUERY_STRING", "")
        if "__path=" in query_string:
            params = parse_qs(query_string)
            if "__path" in params and params["__path"]:
                original_path = params["__path"][0]
                # Strip __path from query string
                clean_params = [p for p in query_string.split("&") if not p.startswith("__path=")]
                environ["QUERY_STRING"] = "&".join(clean_params)

        # 2. Check Vercel edge headers
        if not original_path:
            for header in (
                "HTTP_X_MATCHED_PATH",
                "HTTP_X_VERCEL_MATCHED_PATH",
                "HTTP_X_FORWARDED_URI",
                "HTTP_X_ORIGINAL_URL",
                "REQUEST_URI",
                "RAW_URI"
            ):
                val = environ.get(header)
                if val:
                    val = val.split("?")[0]
                    if val and val not in ("/api/index", "/api/index.py", "/api"):
                        original_path = val
                        break

        if original_path:
            environ["PATH_INFO"] = original_path

        return self.wsgi_app(environ, start_response)

app.wsgi_app = VercelPathNormalizationMiddleware(app.wsgi_app)

# Explicit top-level WSGI variables required by Vercel Python runtime
app = app
application = app
handler = app

if __name__ == "__main__":
    app.run(debug=True)
