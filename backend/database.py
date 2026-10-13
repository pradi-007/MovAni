"""
MOVAni Database Module
Manages SQLite connections, schema initialization, normalized caching,
and transactional operations for media items, watch providers, and user preferences.
"""

import os
import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

DB_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(DB_DIR)

# In Vercel serverless environments, write operations are restricted to /tmp
if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    DB_PATH = os.path.join("/tmp", "movani.db")
    if not os.path.exists(DB_PATH):
        seed_db = os.path.join(ROOT_DIR, "movani.db")
        if os.path.exists(seed_db):
            try:
                import shutil
                shutil.copy2(seed_db, DB_PATH)
            except Exception:
                pass
else:
    DB_PATH = os.path.join(ROOT_DIR, "movani.db")


@contextmanager
def get_db():
    """Context manager for SQLite connections ensuring clean auto-closing and high-concurrency WAL performance."""
    conn = sqlite3.connect(DB_PATH, timeout=15.0)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute("PRAGMA busy_timeout=5000;")
        conn.execute("PRAGMA cache_size=-64000;")
        conn.execute("PRAGMA temp_store=MEMORY;")
    except Exception:
        pass
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    """Initializes tables for Watchlist, Continue Watching, Media Cache, Watch Providers, and Preferences."""
    with get_db() as conn:
        cursor = conn.cursor()

        # 1. Watchlist Table (User-Isolated)
        cursor.execute("PRAGMA table_info(watchlist)")
        wl_cols = [row[1] for row in cursor.fetchall()]
        if not wl_cols:
            cursor.execute("""
                CREATE TABLE watchlist (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    title_id TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    UNIQUE(user_id, title_id),
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_wl_user ON watchlist (user_id)")
        elif "user_id" not in wl_cols:
            cursor.execute("ALTER TABLE watchlist RENAME TO watchlist_legacy")
            cursor.execute("""
                CREATE TABLE watchlist (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    title_id TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    UNIQUE(user_id, title_id),
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_wl_user ON watchlist (user_id)")
            cursor.execute("DROP TABLE IF EXISTS watchlist_legacy")

        # 2. Continue Watching Table (User-Isolated)
        cursor.execute("PRAGMA table_info(continue_watching)")
        cw_cols = [row[1] for row in cursor.fetchall()]
        if not cw_cols:
            cursor.execute("""
                CREATE TABLE continue_watching (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    title_id TEXT NOT NULL,
                    progress INTEGER DEFAULT 0,
                    ep TEXT DEFAULT 'Resume',
                    media_type TEXT DEFAULT 'movie',
                    season INTEGER DEFAULT 1,
                    episode INTEGER DEFAULT 1,
                    current_seconds REAL DEFAULT 0,
                    total_seconds REAL DEFAULT 0,
                    updated_at TEXT NOT NULL,
                    UNIQUE(user_id, title_id),
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_cw_user ON continue_watching (user_id)")
        elif "user_id" not in cw_cols:
            cursor.execute("ALTER TABLE continue_watching RENAME TO continue_watching_legacy")
            cursor.execute("""
                CREATE TABLE continue_watching (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    title_id TEXT NOT NULL,
                    progress INTEGER DEFAULT 0,
                    ep TEXT DEFAULT 'Resume',
                    media_type TEXT DEFAULT 'movie',
                    season INTEGER DEFAULT 1,
                    episode INTEGER DEFAULT 1,
                    current_seconds REAL DEFAULT 0,
                    total_seconds REAL DEFAULT 0,
                    updated_at TEXT NOT NULL,
                    UNIQUE(user_id, title_id),
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_cw_user ON continue_watching (user_id)")
            cursor.execute("DROP TABLE IF EXISTS continue_watching_legacy")
        else:
            for col_def in [
                ("media_type", "TEXT DEFAULT 'movie'"),
                ("season", "INTEGER DEFAULT 1"),
                ("episode", "INTEGER DEFAULT 1"),
                ("current_seconds", "REAL DEFAULT 0"),
                ("total_seconds", "REAL DEFAULT 0")
            ]:
                if col_def[0] not in cw_cols:
                    try:
                        cursor.execute(f"ALTER TABLE continue_watching ADD COLUMN {col_def[0]} {col_def[1]}")
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
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sa_lookup ON streaming_assets (item_id, tmdb_id)")

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

        # Migrations for attempt limits on OTP verification and resets
        try:
            cursor.execute("ALTER TABLE email_verifications ADD COLUMN attempts INTEGER DEFAULT 0")
        except sqlite3.OperationalError:
            pass
        try:
            cursor.execute("ALTER TABLE email_verifications ADD COLUMN max_attempts INTEGER DEFAULT 5")
        except sqlite3.OperationalError:
            pass
        try:
            cursor.execute("ALTER TABLE password_resets ADD COLUMN attempts INTEGER DEFAULT 0")
        except sqlite3.OperationalError:
            pass
        try:
            cursor.execute("ALTER TABLE password_resets ADD COLUMN max_attempts INTEGER DEFAULT 5")
        except sqlite3.OperationalError:
            pass

        # 12. User Sessions Table (One-Device Enforcement Support)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_token TEXT UNIQUE NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL,
                status TEXT DEFAULT 'active',
                revocation_reason TEXT DEFAULT NULL,
                device_id TEXT DEFAULT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_session_token ON user_sessions (session_token)")
        try:
            cursor.execute("ALTER TABLE user_sessions ADD COLUMN status TEXT DEFAULT 'active'")
        except sqlite3.OperationalError:
            pass
        try:
            cursor.execute("ALTER TABLE user_sessions ADD COLUMN revocation_reason TEXT DEFAULT NULL")
        except sqlite3.OperationalError:
            pass
        try:
            cursor.execute("ALTER TABLE user_sessions ADD COLUMN device_id TEXT DEFAULT NULL")
        except sqlite3.OperationalError:
            pass

        # Seed owner accounts with is_verified = 1 so they always exist on any container spin-up
        default_owners = [
            (
                88,
                'ybro57924@gmail.com',
                'Pradeepmalleni',
                'scrypt:32768:8:1$0gyfkAcdixeaVDSj$6e25b337a58d64af9688243ef990ca6a1e1a7c7a35d558f5505cd71c08169275a40ebf72709884eb0578d3d14ae63fd5b995858abeba22a0c94c3ac9545690de',
                1,
                '2026-01-01T00:00:00',
                '2026-01-01T00:00:00'
            ),
            (
                87,
                'pradeepmalleni4@gmail.com',
                'Pradeep',
                'scrypt:32768:8:1$QLMeLlfeQ8asLajW$87eb88aec714e93af1a80e60faae8f91268b101ad802c5d71299b3d463892fcccb1f2fa2bd9f7808f7fd86e72807fbdc74d50cef4895a816073ecd4c16aaf80b',
                1,
                '2026-01-01T00:00:00',
                '2026-01-01T00:00:00'
            ),
            (
                86,
                'pradeepmalleni4@outlook.com',
                'Pradeep',
                'scrypt:32768:8:1$ZP4ZBVGMxtuzNgne$f6b75484585856b9ecf472ca4665b2bd77583537cf8069949a349a51d9d36f506bb06fa9c8e466ec5603f7cfe71a969ed62d42bf6228940e00b2cb2bdb496ccd',
                1,
                '2026-01-01T00:00:00',
                '2026-01-01T00:00:00'
            )
        ]
        for u_id, u_email, u_name, u_hash, u_verif, u_created, u_updated in default_owners:
            cursor.execute("""
                INSERT OR IGNORE INTO users (id, email, name, password_hash, is_verified, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (u_id, u_email, u_name, u_hash, u_verif, u_created, u_updated))
            cursor.execute("UPDATE users SET is_verified = 1 WHERE email = ?", (u_email,))

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


def invalidate_user_verifications(user_id: int):
    """Mark all pending unconsumed email verification tokens for this user as invalidated."""
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE email_verifications SET used_at = ? WHERE user_id = ? AND used_at IS NULL", (now, user_id))
        conn.commit()


def increment_verification_attempts(token_id: int) -> int:
    """Increment failed verification attempt count and return new count."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE email_verifications SET attempts = COALESCE(attempts, 0) + 1 WHERE id = ?", (token_id,))
        cursor.execute("SELECT attempts FROM email_verifications WHERE id = ?", (token_id,))
        row = cursor.fetchone()
        conn.commit()
        return row["attempts"] if row else 1


def get_latest_email_verification_for_user(user_id: int) -> Optional[Dict[str, Any]]:
    """Retrieve the most recently created verification token/OTP record for a user."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM email_verifications WHERE user_id = ? ORDER BY id DESC LIMIT 1", (user_id,))
        row = cursor.fetchone()
        if row:
            return dict(row)
    return None


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


def get_password_reset(token_or_otp: str, user_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
    """Lookup unused password reset token or OTP, optionally scoped by user ID."""
    with get_db() as conn:
        cursor = conn.cursor()
        if user_id:
            cursor.execute(
                "SELECT * FROM password_resets WHERE (token = ? OR otp = ?) AND user_id = ? AND used_at IS NULL ORDER BY created_at DESC LIMIT 1",
                (token_or_otp, token_or_otp, user_id)
            )
        else:
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


def invalidate_user_password_resets(user_id: int):
    """Mark all pending unconsumed password reset tokens for this user as invalidated."""
    now = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE password_resets SET used_at = ? WHERE user_id = ? AND used_at IS NULL", (now, user_id))
        conn.commit()


def increment_password_reset_attempts(token_id: int) -> int:
    """Increment failed password reset attempt count and return new count."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE password_resets SET attempts = COALESCE(attempts, 0) + 1 WHERE id = ?", (token_id,))
        cursor.execute("SELECT attempts FROM password_resets WHERE id = ?", (token_id,))
        row = cursor.fetchone()
        conn.commit()
        return row["attempts"] if row else 1


def get_latest_password_reset_for_user(user_id: int) -> Optional[Dict[str, Any]]:
    """Retrieve the most recently created password reset token/OTP record for a user."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM password_resets WHERE user_id = ? ORDER BY id DESC LIMIT 1", (user_id,))
        row = cursor.fetchone()
        if row:
            return dict(row)
    return None


def create_session(
    user_id: int,
    session_token: str,
    expires_at: str,
    ip_address: str = "",
    user_agent: str = "",
    device_id: str = ""
):
    """
    Enforce One-Device-Per-Account policy:
    Revoke all existing active sessions for this user with reason 'device_replaced',
    then insert the new active session.
    """
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        # Revoke existing sessions for this user (One-Device-Per-Account policy)
        cursor.execute("""
            UPDATE user_sessions
            SET status = 'revoked', revocation_reason = 'device_replaced'
            WHERE user_id = ? AND (status IS NULL OR status = 'active')
        """, (user_id,))
        # Insert new active session
        cursor.execute("""
            INSERT INTO user_sessions (
                user_id, session_token, ip_address, user_agent, expires_at, created_at, status, device_id
            ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
        """, (user_id, session_token, ip_address, user_agent, expires_at, now, device_id))
        conn.commit()


def get_session(session_token: str) -> Optional[Dict[str, Any]]:
    """Lookup session, joining user data and checking revocation status."""
    if not session_token:
        return None
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.session_token, s.expires_at, s.user_id, s.status, s.revocation_reason,
                   u.email, u.name, u.is_verified
            FROM user_sessions s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.session_token = ?
        """, (session_token,))
        row = cursor.fetchone()
        if row:
            if row["status"] == "revoked":
                if row["revocation_reason"] == "device_replaced":
                    return dict(row)
                return None
            return dict(row)

    # Serverless resilience fallback: verify HMAC-signed session across Vercel containers
    try:
        from backend.routes.auth import decode_signed_session_token
        verified = decode_signed_session_token(session_token)
        if verified:
            return verified
    except Exception:
        pass

    return None


def revoke_session(session_token: str, reason: str = "logged_out"):
    """Revoke a specific session token upon explicit logout or expiration."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE user_sessions 
            SET status = 'revoked', revocation_reason = ? 
            WHERE session_token = ?
        """, (reason, session_token))
        if cursor.rowcount == 0:
            now = datetime.now(timezone.utc).isoformat()
            cursor.execute("""
                INSERT OR REPLACE INTO user_sessions (
                    user_id, session_token, ip_address, user_agent, expires_at, created_at, status, revocation_reason
                ) VALUES (0, ?, '', '', ?, ?, 'revoked', ?)
            """, (session_token, now, now, reason))
        conn.commit()


def revoke_all_user_sessions(user_id: int, reason: str = "security_reset"):
    """Revoke all sessions for a user upon password reset or security trigger."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE user_sessions 
            SET status = 'revoked', revocation_reason = ? 
            WHERE user_id = ?
        """, (reason, user_id))
        conn.commit()


# ================= USER-ISOLATED WATCHLIST & CONTINUE WATCHING =================

def get_user_watchlist(user_id: int) -> List[str]:
    """Retrieve title IDs in user's personal watchlist."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT title_id FROM watchlist WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        return [row[0] for row in cursor.fetchall()]


def add_user_watchlist(user_id: int, title_id: str) -> bool:
    """Add title to user's personal watchlist if not already present."""
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR IGNORE INTO watchlist (user_id, title_id, created_at)
            VALUES (?, ?, ?)
        """, (user_id, title_id, now))
        conn.commit()
        return cursor.rowcount > 0


def remove_user_watchlist(user_id: int, title_id: str):
    """Remove title from user's personal watchlist."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM watchlist WHERE user_id = ? AND title_id = ?", (user_id, title_id))
        conn.commit()


def clear_user_watchlist(user_id: int):
    """Clear all items from user's personal watchlist."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM watchlist WHERE user_id = ?", (user_id,))
        conn.commit()


def get_user_continue_watching(user_id: int) -> List[Dict[str, Any]]:
    """Retrieve user-specific continue watching items in descending updated order."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT title_id, progress, ep, media_type, season, episode, current_seconds, total_seconds, updated_at
            FROM continue_watching
            WHERE user_id = ?
            ORDER BY updated_at DESC
        """, (user_id,))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]


def save_user_continue_watching(
    user_id: int,
    title_id: str,
    progress: int = 0,
    ep: str = "Resume",
    current_seconds: float = 0.0,
    total_seconds: float = 0.0,
    media_type: str = "movie",
    season: int = 1,
    episode: int = 1
):
    """Save or update continue watching record for the authenticated user."""
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO continue_watching (
                user_id, title_id, progress, ep, media_type, season, episode, current_seconds, total_seconds, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, title_id) DO UPDATE SET
                progress = excluded.progress,
                ep = excluded.ep,
                media_type = excluded.media_type,
                season = excluded.season,
                episode = excluded.episode,
                current_seconds = excluded.current_seconds,
                total_seconds = excluded.total_seconds,
                updated_at = excluded.updated_at
        """, (user_id, title_id, progress, ep, media_type, season, episode, current_seconds, total_seconds, now))
        conn.commit()


def remove_user_continue_watching(user_id: int, title_id: str):
    """Remove a title from user's personal continue watching rail."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM continue_watching WHERE user_id = ? AND title_id = ?", (user_id, title_id))
        conn.commit()


def clear_user_continue_watching(user_id: int):
    """Clear all continue watching records for a specific user."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM continue_watching WHERE user_id = ?", (user_id,))
        conn.commit()


