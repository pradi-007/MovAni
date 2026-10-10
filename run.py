#!/usr/bin/env python3
"""
MOVAni Master Server Runner
Initializes SQLite database, registers blueprints, and starts the development server.
"""

import os
import sys
import argparse
import threading
import webbrowser
import time

# Ensure workspace root is in python path
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app import app, FRONTEND_DIR
from backend.database import init_db, DB_PATH
from backend.catalog_data import CATALOG_DATA, STUDIOS_LIST


def open_browser(url, delay=1.0):
    """Open default web browser after short delay to allow server startup."""
    def _open():
        time.sleep(delay)
        try:
            webbrowser.open_new_tab(url)
        except Exception:
            pass
    threading.Thread(target=_open, daemon=True).start()


def main():
    parser = argparse.ArgumentParser(description="MOVAni Streaming Web Application Server")
    parser.add_argument("--host", default="0.0.0.0", help="Host interface (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=5000, help="Port to listen on (default: 5000)")
    parser.add_argument("--debug", action="store_true", help="Run with Flask debug mode enabled")
    parser.add_argument("--no-browser", action="store_true", help="Do not automatically launch web browser")
    args = parser.parse_args()

    # Reconfigure stdout for UTF-8 on Windows command lines if supported
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass

    # 1. Initialize SQLite Database
    init_db()

    # 2. Display formatted startup banner
    local_url = f"http://localhost:{args.port}"
    loopback_url = f"http://127.0.0.1:{args.port}"
    android_emu_url = f"http://10.0.2.2:{args.port}"

    print("=" * 70)
    print(">>  M O V A n i  --  Streaming & Discovery Portal  <<")
    print("    Movies - Web Series - Anime Simulcasts - Prime X-Ray - Top 10")
    print("=" * 70)
    print(f"[*] Localhost Web:     {local_url}")
    print(f"[*] Loopback IP:       {loopback_url}")
    print(f"[+] Android Emulator:  {android_emu_url} (for Flutter testing)")
    print(f"[-] Frontend Root:     {FRONTEND_DIR}")
    print(f"[-] SQLite Database:   {DB_PATH}")
    print(f"[-] Catalog Data:      {len(CATALOG_DATA)} titles across {len(STUDIOS_LIST)} studio hubs")
    print(f"[+] TMDB Integration:  LIVE (API Key & Read Access Token Authenticated)")
    print(f"[+] REST Endpoints:    /api/catalog, /api/top10, /api/studios,")
    print(f"                       /api/watchlist, /api/continue-watching, /api/music,")
    print(f"                       /api/tmdb/trending, /api/tmdb/anime, /api/tmdb/search")
    print("=" * 70)
    print("Press CTRL+C to stop the server.")
    print("=" * 70)

    # 3. Launch browser if requested
    if not args.no_browser and not os.environ.get("WERKZEUG_RUN_MAIN"):
        open_browser(local_url)

    # 4. Start Flask server
    app.run(host=args.host, port=args.port, debug=args.debug, threaded=True)


if __name__ == "__main__":
    main()
