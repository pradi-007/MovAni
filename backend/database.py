"""
MOVAni Database Module
Manages SQLite connections, schema initialization, normalized caching,
and transactional operations for media items, watch providers, and user preferences.
"""

import os
import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from typing import Dict, Any, List, Optional

DB_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(DB_DIR)

# In Vercel serverless environments, write operations are restricted to /tmp
if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    DB_PATH = os.path.join("/tmp", "movani.db")
else:
    DB_PATH = os.path.join(ROOT_DIR, "movani.db")


@contextmanager
def get_db():
    """Context manager for SQLite connections ensuring clean auto-closing."""
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    """Initializes tables for Watchlist, Continue Watching, Media Cache, Watch Providers, and Preferences."""
    with get_db() as conn:
        cursor = conn.cursor()

        # 1. Watchlist Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS watchlist (
                title_id TEXT PRIMARY KEY,
                created_at TEXT
            )
        """)

        # 2. Continue Watching Table
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

        # Migration columns if they don't exist
        try:
            cursor.execute("ALTER TABLE continue_watching ADD COLUMN current_seconds REAL DEFAULT 0")
        except sqlite3.OperationalError:
            pass
        try:
            cursor.execute("ALTER TABLE continue_watching ADD COLUMN total_seconds REAL DEFAULT 0")
        except sqlite3.OperationalError:
            pass

        # 3. Saved Music Tracks Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS saved_music (
                song_title TEXT PRIMARY KEY,
                artist TEXT,
                title_id TEXT,
                saved_at TEXT
            )
        """)

        # 4. Media Catalog Cache (Normalized records for TMDB and curated titles)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS media_catalog (
                id TEXT PRIMARY KEY,
                tmdb_id INTEGER,
                media_type TEXT DEFAULT 'movie',
                title TEXT,
                original_title TEXT,
                original_language TEXT,
                overview TEXT,
                release_date TEXT,
                poster TEXT,
                backdrop TEXT,
                vote_average REAL DEFAULT 7.5,
                match_pct INTEGER DEFAULT 95,
                runtime TEXT,
                genres TEXT, -- JSON array
                studio TEXT,
                youtube_id TEXT,
                is_kannada INTEGER DEFAULT 0,
                has_kannada_audio INTEGER DEFAULT 0,
                verified_audio TEXT, -- JSON array
                verified_dubs TEXT,  -- JSON array
                verified_subs TEXT,  -- JSON array
                cached_at TEXT
            )
        """)

        # Index for fast lookup
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_media_tmdb ON media_catalog (tmdb_id, media_type)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_media_lang ON media_catalog (original_language)")

        # 5. Watch Providers Cache (Attributed to JustWatch via TMDB)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS watch_providers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tmdb_id INTEGER,
                media_type TEXT,
                region TEXT DEFAULT 'IN',
                provider_name TEXT,
                provider_logo TEXT,
                monetization_type TEXT, -- 'flatrate', 'rent', 'buy', 'free'
                link TEXT,
                cached_at TEXT
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_wp_lookup ON watch_providers (tmdb_id, media_type, region)")

        # 6. Episodes Cache
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS episodes_cache (
                id TEXT PRIMARY KEY,
                tv_id INTEGER,
                season_number INTEGER,
                episode_number INTEGER,
                name TEXT,
                overview TEXT,
                still_path TEXT,
                runtime TEXT,
                vote_average REAL,
                air_date TEXT,
                cached_at TEXT
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_ep_lookup ON episodes_cache (tv_id, season_number)")

        # 7. Streaming Assets (Authorized playback mappings & verified audio renditions)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS streaming_assets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_id TEXT,
                tmdb_id INTEGER,
                media_type TEXT DEFAULT 'movie',
                provider_id TEXT,
                provider_name TEXT,
                stream_url TEXT,
                stream_type TEXT,
                audio_languages TEXT,
                has_original_kannada INTEGER DEFAULT 0,
                is_authorized INTEGER DEFAULT 1,
                status TEXT DEFAULT 'available'
            )
        """)

        # 8. User Preferences
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_preferences (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at TEXT
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


def save_cached_media_item(item: Dict[str, Any]):
    """Insert or update a media catalog item into SQLite."""
    if not item or not item.get("id"):
        return
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO media_catalog (
                    id, tmdb_id, media_type, title, original_title, original_language,
                    overview, release_date, poster, backdrop, vote_average, match_pct,
                    runtime, genres, studio, youtube_id, is_kannada, has_kannada_audio,
                    verified_audio, verified_dubs, verified_subs, cached_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    tmdb_id=excluded.tmdb_id,
                    media_type=excluded.media_type,
                    title=excluded.title,
                    original_title=excluded.original_title,
                    original_language=excluded.original_language,
                    overview=excluded.overview,
                    release_date=excluded.release_date,
                    poster=excluded.poster,
                    backdrop=excluded.backdrop,
                    vote_average=excluded.vote_average,
                    match_pct=excluded.match_pct,
                    runtime=excluded.runtime,
                    genres=excluded.genres,
                    studio=excluded.studio,
                    youtube_id=excluded.youtube_id,
                    is_kannada=excluded.is_kannada,
                    has_kannada_audio=excluded.has_kannada_audio,
                    verified_audio=excluded.verified_audio,
                    verified_dubs=excluded.verified_dubs,
                    verified_subs=excluded.verified_subs,
                    cached_at=excluded.cached_at
            """, (
                str(item.get("id")),
                int(item.get("tmdbId") or item.get("id") or 0) if str(item.get("tmdbId") or item.get("id")).isdigit() else None,
                item.get("type") or "movies",
                item.get("title") or "Untitled",
                item.get("original_title") or item.get("title") or "Untitled",
                item.get("original_language") or ("kn" if item.get("isKannada") else "en"),
                item.get("overview") or "",
                item.get("year") or item.get("release_date") or "",
                item.get("poster") or "",
                item.get("backdrop") or "",
                float(item.get("vote_average") or 7.5),
                int(str(item.get("match") or "95").replace("% Match", "").strip() or 95),
                item.get("runtime") or "Feature Film",
                json.dumps(item.get("genres") or ["Action", "Drama"]),
                item.get("studio") or "MOVAni Cinema",
                item.get("youtubeId") or "",
                1 if (item.get("isKannada") or (item.get("language") or "").lower() == "kannada") else 0,
                1 if (item.get("hasKannadaAudio") or item.get("isKannada")) else 0,
                json.dumps(item.get("audio") or []),
                json.dumps(item.get("dubs") or []),
                json.dumps(item.get("subs") or []),
                datetime.now().isoformat()
            ))
            conn.commit()
    except Exception as e:
        print(f"Error caching media item {item.get('id')}: {e}")


def get_cached_media_item(title_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve cached media item from SQLite by ID or TMDB ID."""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM media_catalog WHERE id = ? OR tmdb_id = ?", (str(title_id), str(title_id)))
            row = cursor.fetchone()
            if row:
                return {
                    "id": row["id"],
                    "tmdbId": row["tmdb_id"],
                    "type": row["media_type"],
                    "title": row["title"],
                    "original_title": row["original_title"],
                    "original_language": row["original_language"],
                    "overview": row["overview"],
                    "year": (row["release_date"] or "")[:4],
                    "release_date": row["release_date"],
                    "poster": row["poster"],
                    "backdrop": row["backdrop"],
                    "vote_average": row["vote_average"],
                    "match": f"{row['match_pct']}% Match",
                    "runtime": row["runtime"],
                    "genres": json.loads(row["genres"] or "[]"),
                    "studio": row["studio"],
                    "youtubeId": row["youtube_id"],
                    "isKannada": bool(row["is_kannada"]),
                    "hasKannadaAudio": bool(row["has_kannada_audio"]),
                    "audio": json.loads(row["verified_audio"] or "[]"),
                    "dubs": json.loads(row["verified_dubs"] or "[]"),
                    "subs": json.loads(row["verified_subs"] or "[]")
                }
    except Exception as e:
        print(f"Error retrieving media item {title_id}: {e}")
    return None
