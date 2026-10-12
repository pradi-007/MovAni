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

# Explicit top-level WSGI variables required by Vercel Python runtime
app = app
application = app
handler = app

if __name__ == "__main__":
    app.run(debug=True)
