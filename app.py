#!/usr/bin/env python3
"""
MOVAni Application Entrypoint
Delegates to the modular backend package in backend/app.py.
"""

import os
import sys

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app import app, create_app, FRONTEND_DIR
from backend.database import init_db, get_db, DB_PATH

if __name__ == "__main__":
    from run import main
    main()
