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

        # 9. Users Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                is_verified INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)")

        # 10. Email Verifications Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS email_verifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token TEXT UNIQUE NOT NULL,
                otp TEXT,
                expires_at TEXT NOT NULL,
                used_at TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_verif_token ON email_verifications (token)")

        # 11. Password Resets Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS password_resets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token TEXT UNIQUE NOT NULL,
                otp TEXT,
                expires_at TEXT NOT NULL,
                used_at TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_reset_token ON password_resets (token)")

        # 12. User Sessions Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_token TEXT UNIQUE NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_session_token ON user_sessions (session_token)")


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


# ================= AUTHENTICATION & USER HELPERS =================

def create_user(name: str, email: str, password_hash: str) -> int:
    """Create a new unverified user in SQLite."""
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, is_verified, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)",
            (name.strip(), email.lower().strip(), password_hash, now, now)
        )
        conn.commit()
        return cursor.lastrowid


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Retrieve user record by email address."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),))
        row = cursor.fetchone()
        if row:
            return dict(row)
    return None


def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Retrieve user record by user ID."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if row:
            return dict(row)
    return None


def set_user_verified(user_id: int):
    """Mark user account as verified."""
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET is_verified = 1, updated_at = ? WHERE id = ?", (now, user_id))
        conn.commit()


def update_user_password(user_id: int, new_password_hash: str):
    """Update user password hash and updated_at."""
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", (new_password_hash, now, user_id))
        conn.commit()


def create_email_verification(user_id: int, token: str, otp: str, expires_at: str):
    """Store single-use email verification token and OTP."""
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO email_verifications (user_id, token, otp, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, token, otp, expires_at, now)
        )
        conn.commit()


def get_email_verification(token_or_otp: str, user_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
    """Lookup unused verification token or OTP."""
    with get_db() as conn:
        cursor = conn.cursor()
        if user_id:
            cursor.execute(
                "SELECT * FROM email_verifications WHERE (token = ? OR otp = ?) AND user_id = ? AND used_at IS NULL ORDER BY created_at DESC LIMIT 1",
                (token_or_otp, token_or_otp, user_id)
            )
        else:
            cursor.execute(
                "SELECT * FROM email_verifications WHERE (token = ? OR otp = ?) AND used_at IS NULL ORDER BY created_at DESC LIMIT 1",
                (token_or_otp, token_or_otp)
            )
        row = cursor.fetchone()
        if row:
            return dict(row)
    return None


def mark_email_verification_used(token_id: int):
    """Mark email verification token as consumed."""
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE email_verifications SET used_at = ? WHERE id = ?", (now, token_id))
        conn.commit()


def create_password_reset(user_id: int, token: str, otp: str, expires_at: str):
    """Store password reset token and OTP."""
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO password_resets (user_id, token, otp, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, token, otp, expires_at, now)
        )
        conn.commit()


def get_password_reset(token_or_otp: str) -> Optional[Dict[str, Any]]:
    """Lookup unused password reset token or OTP."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM password_resets WHERE (token = ? OR otp = ?) AND used_at IS NULL ORDER BY created_at DESC LIMIT 1",
            (token_or_otp, token_or_otp)
        )
        row = cursor.fetchone()
        if row:
            return dict(row)
    return None


def mark_password_reset_used(token_id: int):
    """Mark password reset token as consumed."""
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE password_resets SET used_at = ? WHERE id = ?", (now, token_id))
        conn.commit()


def create_session(user_id: int, session_token: str, expires_at: str, ip_address: str = "", user_agent: str = ""):
    """Store active user session."""
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, session_token, ip_address, user_agent, expires_at, now)
        )
        conn.commit()


def get_session(session_token: str) -> Optional[Dict[str, Any]]:
    """Lookup active session and join user details."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.session_token, s.expires_at, s.user_id, u.email, u.name, u.is_verified
            FROM user_sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.session_token = ?
        """, (session_token,))
        row = cursor.fetchone()
        if row:
            return dict(row)
    return None


def revoke_session(session_token: str):
    """Delete a specific session token upon logout."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM user_sessions WHERE session_token = ?", (session_token,))
        conn.commit()


def revoke_all_user_sessions(user_id: int):
    """Revoke all sessions for a user upon password reset."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM user_sessions WHERE user_id = ?", (user_id,))
        conn.commit()

