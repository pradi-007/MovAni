"""
MOVAni Database Module
Manages SQLite connections, schema initialization, and transactional operations.
"""

import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime

DB_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(DB_DIR)
DB_PATH = os.path.join(ROOT_DIR, "movani.db")


@contextmanager
def get_db():
    """Context manager for SQLite connections ensuring clean auto-closing."""
    conn = sqlite3.connect(DB_PATH)
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    """Initializes tables for Watchlist, Continue Watching, and Saved Music."""
    with get_db() as conn:
        cursor = conn.cursor()

        # Watchlist Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS watchlist (
                title_id TEXT PRIMARY KEY,
                created_at TEXT
            )
        """)

        # Continue Watching Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS continue_watching (
                title_id TEXT PRIMARY KEY,
                progress INTEGER,
                ep TEXT,
                current_seconds REAL DEFAULT 0,
                total_seconds REAL DEFAULT 0,
                updated_at TEXT
            )
        """)

        # Migration for existing databases
        try:
            cursor.execute("ALTER TABLE continue_watching ADD COLUMN current_seconds REAL DEFAULT 0")
        except sqlite3.OperationalError:
            pass
        try:
            cursor.execute("ALTER TABLE continue_watching ADD COLUMN total_seconds REAL DEFAULT 0")
        except sqlite3.OperationalError:
            pass

        # Saved Music Tracks Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS saved_music (
                song_title TEXT PRIMARY KEY,
                artist TEXT,
                title_id TEXT,
                saved_at TEXT
            )
        """)

        # Seed initial continue watching items if empty
        cursor.execute("SELECT COUNT(*) FROM continue_watching")
        if cursor.fetchone()[0] == 0:
            initial_continue = [
                ("cm-reze", 68, "S1:E8"),
                ("solo-leveling", 42, "S1:E6"),
                ("mirzapur-3", 85, "S3:E4"),
                ("oppenheimer", 30, "Feature Film")
            ]
            for t_id, prog, ep in initial_continue:
                cursor.execute(
                    "INSERT INTO continue_watching (title_id, progress, ep, updated_at) VALUES (?, ?, ?, ?)",
                    (t_id, prog, ep, datetime.now().isoformat())
                )

        conn.commit()
