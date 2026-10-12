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

class VercelPathNormalizationMiddleware:
    """
    Restores PATH_INFO when Vercel rewrites forward requests to /api/index
    or strips subpaths.
    """
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        raw_uri = environ.get("REQUEST_URI") or environ.get("RAW_URI") or ""
        path_info = environ.get("PATH_INFO", "")
        if path_info in ("/api/index", "/api/index.py", "/api") and raw_uri:
            clean = raw_uri.split("?")[0]
            if clean and clean not in ("/api/index", "/api/index.py"):
                environ["PATH_INFO"] = clean
        return self.wsgi_app(environ, start_response)

app.wsgi_app = VercelPathNormalizationMiddleware(app.wsgi_app)

# Explicit top-level WSGI variables required by Vercel Python runtime
app = app
application = app
handler = app

if __name__ == "__main__":
    app.run(debug=True)
