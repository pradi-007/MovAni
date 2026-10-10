import os
import sys

# Ensure repository root is in sys.path for modular imports
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app import app

# Vercel serverless WSGI entrypoint
handler = app
