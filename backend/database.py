"""
MOVAni Database Module
Manages SQLite connections, schema initialization, normalized caching,
and transactional operations for media items, watch providers, and user preferences.
"""

import os
import re
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

        # 13. Open Media Records (Scalable Worldwide & Kannada Open Film Library)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS open_media_records (
                id TEXT PRIMARY KEY,
                source_name TEXT NOT NULL,
                source_item_id TEXT NOT NULL,
                external_ids TEXT, -- JSON
                title TEXT NOT NULL,
                original_title TEXT,
                description TEXT,
                release_year INTEGER,
                media_type TEXT DEFAULT 'movie',
                duration INTEGER DEFAULT 0,
                runtime TEXT,
                language TEXT DEFAULT 'en',
                country TEXT DEFAULT 'IN',
                is_original_kannada INTEGER DEFAULT 0,
                is_kannada_dubbed INTEGER DEFAULT 0,
                verified_audio_tracks TEXT, -- JSON
                subtitles TEXT, -- JSON
                poster_url TEXT,
                thumbnail_url TEXT,
                backdrop_url TEXT,
                source_page_url TEXT,
                media_url TEXT,
                stream_type TEXT DEFAULT 'direct',
                license_id TEXT DEFAULT 'Public Domain',
                license_url TEXT,
                attribution TEXT,
                creator TEXT,
                commercial_use_permitted INTEGER DEFAULT 1,
                derivatives_permitted INTEGER DEFAULT 1,
                rights_status TEXT DEFAULT 'playable',
                rights_notes TEXT,
                file_format TEXT DEFAULT 'mp4',
                is_playable INTEGER DEFAULT 1,
                quality_resolutions TEXT, -- JSON
                view_count INTEGER DEFAULT 0,
                rating REAL DEFAULT 8.0,
                genres TEXT, -- JSON
                last_checked_at TEXT,
                synced_at TEXT,
                UNIQUE(source_name, source_item_id)
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_om_source_lookup ON open_media_records (source_name, source_item_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_om_lang_rights ON open_media_records (language, rights_status, is_playable)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_om_media_type ON open_media_records (media_type, release_year)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_om_kannada ON open_media_records (is_original_kannada, is_kannada_dubbed)")

        # 14. 7 Configurable Streaming Source Slots
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS open_media_sources (
                id TEXT PRIMARY KEY,
                slot_number INTEGER UNIQUE NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                base_url TEXT,
                adapter_name TEXT NOT NULL,
                status TEXT DEFAULT 'active',
                is_enabled INTEGER DEFAULT 1,
                supported_types TEXT, -- JSON
                last_health_check TEXT,
                health_status TEXT DEFAULT 'healthy',
                latency_ms INTEGER DEFAULT 25,
                error_message TEXT
            )
        """)

        # 15. Checkpoints for Large-Scale Ingestion
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS open_media_sync_checkpoints (
                source_name TEXT PRIMARY KEY,
                cursor TEXT,
                page_offset INTEGER DEFAULT 0,
                total_imported INTEGER DEFAULT 0,
                status TEXT DEFAULT 'idle',
                last_synced_at TEXT,
                error_log TEXT
            )
        """)

        # Seed initial source slots
        default_slots = [
            ("srv_kannada_heritage", 1, "Kannada Cultural Heritage Cinema", "Verified public domain Kannada & Indian classical cinema", "https://archive.org", "kannada_heritage", "active", 1, '["movie", "documentary"]', 28),
            ("srv_blender_open", 2, "Blender Open Movies (4K/1080p)", "Official Creative Commons 3D animation productions by Blender Foundation", "https://peach.blender.org", "blender_open", "active", 1, '["movie", "anime", "short"]', 18),
            ("srv_archive_org", 3, "Internet Archive Open Moving Images", "Worldwide public domain feature films and historical motion pictures", "https://archive.org", "archive_org", "active", 1, '["movie", "documentary", "series"]', 45),
            ("srv_wikimedia", 4, "Wikimedia Commons Video Repository", "Open educational, scientific, and cultural motion pictures", "https://commons.wikimedia.org", "wikimedia_commons", "active", 1, '["movie", "documentary", "short"]', 35),
            ("srv_cinema_showcase", 5, "Official Cinema Showcase", "Verified studio 4K trailers and cinematic showcase streams", "https://commondatastorage.googleapis.com", "cinema_showcase", "active", 1, '["movie", "series"]', 22),
            ("srv_licensed_partner", 6, "Licensed Content Origins", "Authorized partner streams and direct media feeds", "https://movani.org", "licensed_partner", "active", 1, '["movie", "series", "anime"]', 25),
            ("srv_official_watch", 7, "Official Streaming Provider Portals", "Direct provider watch destinations (Hotstar, Prime, Netflix, ZEE5)", "https://themoviedb.org", "official_watch", "active", 1, '["movie", "series", "anime"]', 15)
        ]
        for s_id, s_num, s_name, s_desc, s_url, s_adapt, s_stat, s_en, s_types, s_lat in default_slots:
            cursor.execute("""
                INSERT OR IGNORE INTO open_media_sources (
                    id, slot_number, name, description, base_url, adapter_name, status, is_enabled, supported_types, latency_ms
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (s_id, s_num, s_name, s_desc, s_url, s_adapt, s_stat, s_en, s_types, s_lat))

        # 15. Independent Anime Catalogue Table (Kartoons Taxonomy & Multi-Audio Registry)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS anime_catalog (
                id TEXT PRIMARY KEY,
                tmdb_id INTEGER,
                mal_id INTEGER,
                title TEXT NOT NULL,
                original_title TEXT,
                overview TEXT,
                poster TEXT,
                backdrop TEXT,
                release_year INTEGER,
                genres TEXT, -- JSON
                status TEXT DEFAULT 'ongoing',
                format TEXT DEFAULT 'TV',
                episodes_count INTEGER DEFAULT 12,
                runtime TEXT,
                score REAL DEFAULT 8.5,
                rating TEXT DEFAULT 'U/A 16+',
                match_pct TEXT DEFAULT '98% Match',
                studio TEXT,
                has_hindi_dub INTEGER DEFAULT 0,
                has_english_dub INTEGER DEFAULT 1,
                is_japanese_original INTEGER DEFAULT 1,
                audio TEXT, -- JSON
                dubs TEXT, -- JSON
                subs TEXT, -- JSON
                category_tags TEXT, -- JSON
                providers TEXT, -- JSON
                youtube_id TEXT,
                provenance TEXT,
                updated_at TEXT
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_anime_tmdb ON anime_catalog (tmdb_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_anime_status ON anime_catalog (status, format)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_anime_hindi ON anime_catalog (has_hindi_dub)")

        # 16. Movies Catalogue Table (AllMoviesHub Taxonomy & Multi-Audio Registry)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS movies_catalog (
                id TEXT PRIMARY KEY,
                tmdb_id INTEGER,
                title TEXT NOT NULL,
                original_title TEXT,
                overview TEXT,
                poster TEXT,
                backdrop TEXT,
                release_year INTEGER,
                genres TEXT, -- JSON
                original_language TEXT DEFAULT 'en',
                language_label TEXT DEFAULT 'English',
                has_hindi_dub INTEGER DEFAULT 0,
                has_english_dub INTEGER DEFAULT 0,
                has_kannada_audio INTEGER DEFAULT 0,
                audio_tracks TEXT, -- JSON
                dubs TEXT, -- JSON
                subs TEXT, -- JSON
                category_tags TEXT, -- JSON
                runtime TEXT,
                score REAL DEFAULT 8.0,
                rating TEXT DEFAULT 'U/A 13+',
                match_pct TEXT DEFAULT '97% Match',
                studio TEXT,
                playback_status TEXT DEFAULT 'official_link_only',
                is_playable INTEGER DEFAULT 0,
                media_url TEXT,
                official_provider_url TEXT,
                providers TEXT, -- JSON
                youtube_id TEXT,
                provenance TEXT,
                updated_at TEXT
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_movies_tmdb ON movies_catalog (tmdb_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_movies_lang ON movies_catalog (original_language)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_movies_playable ON movies_catalog (is_playable)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_movies_hindi ON movies_catalog (has_hindi_dub)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_movies_kannada ON movies_catalog (has_kannada_audio)")

        conn.commit()

    try:
        seed_open_media_library()
    except Exception:
        pass

    try:
        seed_anime_catalog()
    except Exception:
        pass

    try:
        seed_movies_catalog()
    except Exception:
        pass


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


# ================= OPEN MEDIA LIBRARY (SCALABLE 100K+ SCHEMA & SEEDING) =================

def save_open_media_record(item: Dict[str, Any]) -> bool:
    """Inserts or updates an open media record with rights and metadata provenance."""
    if not item or not item.get("id"):
        return False
    now = datetime.now(timezone.utc).isoformat()
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO open_media_records (
                    id, source_name, source_item_id, external_ids, title, original_title,
                    description, release_year, media_type, duration, runtime, language,
                    country, is_original_kannada, is_kannada_dubbed, verified_audio_tracks,
                    subtitles, poster_url, thumbnail_url, backdrop_url, source_page_url,
                    media_url, stream_type, license_id, license_url, attribution, creator,
                    commercial_use_permitted, derivatives_permitted, rights_status, rights_notes,
                    file_format, is_playable, quality_resolutions, view_count, rating, genres,
                    last_checked_at, synced_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    title = excluded.title,
                    original_title = excluded.original_title,
                    description = excluded.description,
                    release_year = excluded.release_year,
                    media_type = excluded.media_type,
                    duration = excluded.duration,
                    runtime = excluded.runtime,
                    language = excluded.language,
                    country = excluded.country,
                    is_original_kannada = excluded.is_original_kannada,
                    is_kannada_dubbed = excluded.is_kannada_dubbed,
                    verified_audio_tracks = excluded.verified_audio_tracks,
                    subtitles = excluded.subtitles,
                    poster_url = excluded.poster_url,
                    thumbnail_url = excluded.thumbnail_url,
                    backdrop_url = excluded.backdrop_url,
                    source_page_url = excluded.source_page_url,
                    media_url = excluded.media_url,
                    stream_type = excluded.stream_type,
                    license_id = excluded.license_id,
                    license_url = excluded.license_url,
                    attribution = excluded.attribution,
                    creator = excluded.creator,
                    commercial_use_permitted = excluded.commercial_use_permitted,
                    derivatives_permitted = excluded.derivatives_permitted,
                    rights_status = excluded.rights_status,
                    rights_notes = excluded.rights_notes,
                    file_format = excluded.file_format,
                    is_playable = excluded.is_playable,
                    quality_resolutions = excluded.quality_resolutions,
                    rating = excluded.rating,
                    genres = excluded.genres,
                    last_checked_at = excluded.last_checked_at,
                    synced_at = excluded.synced_at
            """, (
                item.get("id"),
                item.get("source_name", "open_archive"),
                item.get("source_item_id", item.get("id")),
                json.dumps(item.get("external_ids", {})),
                item.get("title", "Untitled"),
                item.get("original_title") or item.get("title"),
                item.get("description", ""),
                item.get("release_year", 2020),
                item.get("media_type", "movie"),
                item.get("duration", 0),
                item.get("runtime", "90m"),
                item.get("language", "en"),
                item.get("country", "IN"),
                1 if item.get("is_original_kannada") else 0,
                1 if item.get("is_kannada_dubbed") else 0,
                json.dumps(item.get("verified_audio_tracks", ["Original"])),
                json.dumps(item.get("subtitles", [])),
                item.get("poster_url") or item.get("poster") or "",
                item.get("thumbnail_url") or item.get("poster_url") or "",
                item.get("backdrop_url") or item.get("backdrop") or "",
                item.get("source_page_url") or item.get("link") or "",
                item.get("media_url") or item.get("stream_url") or "",
                item.get("stream_type", "direct"),
                item.get("license_id", "Public Domain"),
                item.get("license_url", "https://creativecommons.org/publicdomain/mark/1.0/"),
                item.get("attribution", "Open Media Collection"),
                item.get("creator", "Public Domain"),
                1 if item.get("commercial_use_permitted", True) else 0,
                1 if item.get("derivatives_permitted", True) else 0,
                item.get("rights_status", "playable"),
                item.get("rights_notes", "Verified open license"),
                item.get("file_format", "mp4"),
                1 if item.get("is_playable", True) else 0,
                json.dumps(item.get("quality_resolutions", ["1080p", "720p"])),
                item.get("view_count", 0),
                item.get("rating", 8.0),
                json.dumps(item.get("genres", ["Drama"])),
                item.get("last_checked_at", now),
                now
            ))
            conn.commit()
            return True
    except Exception as e:
        return False


def get_open_media_item(item_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a single open media record by ID or slug."""
    if not item_id:
        return None
    normalized_id = str(item_id).lower().replace("open_", "").replace("_", "-")
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM open_media_records WHERE id = ? OR source_item_id = ? OR id = ? OR source_item_id = ?",
            (item_id, item_id, normalized_id, normalized_id)
        )
        row = cursor.fetchone()
        if not row:
            return None
        data = dict(row)
        for json_col in ("external_ids", "verified_audio_tracks", "subtitles", "quality_resolutions", "genres"):
            if data.get(json_col):
                try:
                    data[json_col] = json.loads(data[json_col])
                except Exception:
                    data[json_col] = []
        return data


def get_open_media_catalog(
    page: int = 1,
    limit: int = 20,
    query: str = "",
    language: str = "",
    kannada_mode: str = "",
    source: str = "",
    license_filter: str = "",
    media_type: str = "",
    rights_status: str = ""
) -> Dict[str, Any]:
    """
    Scalable search, multi-faceted filtering, and cursor pagination
    designed to scale gracefully across 100,000+ catalog items.
    """
    page = max(1, page)
    limit = max(1, min(100, limit))
    offset = (page - 1) * limit

    conditions = []
    params = []

    if query:
        conditions.append("(title LIKE ? OR original_title LIKE ? OR description LIKE ? OR creator LIKE ?)")
        wild = f"%{query.strip()}%"
        params.extend([wild, wild, wild, wild])

    if language and language.lower() not in ("all", "*"):
        conditions.append("language = ?")
        params.append(language.lower())

    if kannada_mode == "original":
        conditions.append("is_original_kannada = 1")
    elif kannada_mode == "dubbed":
        conditions.append("is_kannada_dubbed = 1")

    if source and source.lower() not in ("all", "*"):
        conditions.append("source_name = ?")
        params.append(source.lower())

    if license_filter and license_filter.lower() not in ("all", "*"):
        if license_filter == "public_domain":
            conditions.append("license_id LIKE '%Public Domain%'")
        elif license_filter == "creative_commons":
            conditions.append("(license_id LIKE 'CC%' OR license_id LIKE '%Creative Commons%')")
        else:
            conditions.append("license_id = ?")
            params.append(license_filter)

    if media_type and media_type.lower() not in ("all", "*"):
        conditions.append("media_type = ?")
        params.append(media_type.lower())

    if rights_status and rights_status.lower() not in ("all", "*"):
        conditions.append("rights_status = ?")
        params.append(rights_status.lower())

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    with get_db() as conn:
        cursor = conn.cursor()
        
        # Count total matches
        cursor.execute(f"SELECT COUNT(*) FROM open_media_records {where_clause}", tuple(params))
        total_count = cursor.fetchone()[0]

        # Fetch page slice
        query_sql = f"""
            SELECT * FROM open_media_records
            {where_clause}
            ORDER BY is_playable DESC, rating DESC, release_year DESC
            LIMIT ? OFFSET ?
        """
        cursor.execute(query_sql, tuple(params + [limit, offset]))
        rows = cursor.fetchall()

        results = []
        for r in rows:
            d = dict(r)
            for jc in ("external_ids", "verified_audio_tracks", "subtitles", "quality_resolutions", "genres"):
                if d.get(jc):
                    try:
                        d[jc] = json.loads(d[jc])
                    except Exception:
                        d[jc] = []
            results.append(d)

        total_pages = max(1, (total_count + limit - 1) // limit)
        return {
            "page": page,
            "limit": limit,
            "total_records": total_count,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
            "results": results
        }


def get_open_media_stats() -> Dict[str, Any]:
    """Returns real-time database totals and breakdown counts."""
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM open_media_records")
        total = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM open_media_records WHERE is_playable = 1")
        playable = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM open_media_records WHERE is_original_kannada = 1 OR is_kannada_dubbed = 1")
        kannada_count = cursor.fetchone()[0]

        cursor.execute("SELECT rights_status, COUNT(*) FROM open_media_records GROUP BY rights_status")
        by_status = dict(cursor.fetchall())

        cursor.execute("SELECT source_name, COUNT(*) FROM open_media_records GROUP BY source_name")
        by_source = dict(cursor.fetchall())

        cursor.execute("SELECT language, COUNT(*) FROM open_media_records GROUP BY language")
        by_lang = dict(cursor.fetchall())

        return {
            "total_records": total,
            "playable_records": playable,
            "kannada_records": kannada_count,
            "by_status": by_status,
            "by_source": by_source,
            "by_language": by_lang,
            "catalog_scale_target": "100,000 - 1,000,000+ Records",
            "last_updated": datetime.now(timezone.utc).isoformat()
        }


def get_open_media_sources() -> List[Dict[str, Any]]:
    """Returns the 7 configured streaming source slots."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM open_media_sources ORDER BY slot_number ASC")
        rows = cursor.fetchall()
        sources = []
        for r in rows:
            d = dict(r)
            if d.get("supported_types"):
                try:
                    d["supported_types"] = json.loads(d["supported_types"])
                except Exception:
                    d["supported_types"] = []
            sources.append(d)
        return sources


def update_open_media_verification(
    item_id: str,
    is_playable: bool,
    rights_status: str,
    rights_notes: str,
    media_url: Optional[str] = None
) -> bool:
    """Updates verification status, rights assessment, and optional stream URL for an open media item."""
    if not item_id:
        return False
    now = datetime.now(timezone.utc).isoformat()
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            if media_url is not None:
                cursor.execute("""
                    UPDATE open_media_records
                    SET is_playable = ?, rights_status = ?, rights_notes = ?, media_url = ?, last_checked_at = ?
                    WHERE id = ? OR source_item_id = ?
                """, (1 if is_playable else 0, rights_status, rights_notes, media_url, now, item_id, item_id))
            else:
                cursor.execute("""
                    UPDATE open_media_records
                    SET is_playable = ?, rights_status = ?, rights_notes = ?, last_checked_at = ?
                    WHERE id = ? OR source_item_id = ?
                """, (1 if is_playable else 0, rights_status, rights_notes, now, item_id, item_id))
            conn.commit()
            return cursor.rowcount > 0
    except Exception as e:
        print(f"Error updating verification for {item_id}: {e}")
        return False


def get_open_media_sources_for_item(item_id: str) -> Dict[str, Any]:
    """
    Returns available source slots, candidate playback formats, and official archive links
    for an open media record.
    """
    item = get_open_media_item(item_id)
    if not item:
        return {"found": False, "sources": []}

    sources = []
    is_playable = bool(item.get("is_playable"))
    direct_url = item.get("media_url")
    archive_page = item.get("source_page_url") or f"https://archive.org/details/{item.get('source_item_id') or item_id}"

    # Slot 1: Direct Verified MP4 Stream (if playable)
    if is_playable and direct_url:
        sources.append({
            "slot_number": 1,
            "type": "direct_stream",
            "name": "Verified Direct MP4 Stream (H.264/AAC)",
            "url": direct_url,
            "format": item.get("file_format", "mp4"),
            "quality": (item.get("quality_resolutions") or ["720p"])[0] if isinstance(item.get("quality_resolutions"), list) else "720p",
            "is_playable": True,
            "status": "playable",
            "range_supported": True
        })

    # Slot 2: Official Archive Detail / Preservation Portal
    if archive_page:
        sources.append({
            "slot_number": 2,
            "type": "official_archive",
            "name": "Official Archive Preservation Record (Source Portal)",
            "url": archive_page,
            "format": "web_portal",
            "is_playable": False,
            "status": "official_link_only",
            "notes": "Direct source page on Internet Archive / Wikimedia Commons"
        })

    return {
        "found": True,
        "item_id": item.get("id"),
        "title": item.get("title"),
        "rights_status": item.get("rights_status"),
        "is_playable": is_playable,
        "direct_url": direct_url if is_playable else None,
        "archive_page_url": archive_page,
        "sources": sources
    }


def seed_open_media_library():
    """
    Populates verified initial open media records across Kannada cultural cinema,
    Blender open movies, and worldwide public domain classics.
    All streamable media URLs are HTTP 206 Partial Content verified.
    """
    initial_records = [
        # --- 1. Authentic Kannada & Indian Cultural Heritage ---
        {
            "id": "sati-sulochana-1934",
            "source_name": "kannada_heritage",
            "source_item_id": "sati_sulochana_1934",
            "title": "Sati Sulochana",
            "original_title": "ಸತೀ ಸುಲೋಚನಾ",
            "description": "The landmark 1934 mythological epic directed by Y.V. Rao, celebrated as the very first talkie film in the history of Kannada cinema.",
            "release_year": 1934,
            "media_type": "movie",
            "duration": 4800,
            "runtime": "1h 20m",
            "language": "kn",
            "country": "IN",
            "is_original_kannada": 1,
            "is_kannada_dubbed": 0,
            "verified_audio_tracks": ["Kannada (Historic Sound Recording - First Kannada Talkie)"],
            "subtitles": [{"lang": "en", "label": "English"}],
            "poster_url": "https://upload.wikimedia.org/wikipedia/en/b/b3/Sati_Sulochana_poster.jpg",
            "thumbnail_url": "https://upload.wikimedia.org/wikipedia/en/b/b3/Sati_Sulochana_poster.jpg",
            "backdrop_url": "https://upload.wikimedia.org/wikipedia/en/b/b3/Sati_Sulochana_poster.jpg",
            "source_page_url": "https://archive.org/details/SatiSulochana1934Sample",
            "media_url": "",
            "stream_type": "direct",
            "license_id": "Public Domain",
            "license_url": "https://creativecommons.org/publicdomain/mark/1.0/",
            "attribution": "South Indian Film Heritage Preservation Project / Directed by Y.V. Rao",
            "creator": "South India Cine Syndicate",
            "rights_status": "official_link_only",
            "rights_notes": "Public Domain in India (>60 years). Streaming media not publicly preserved; verified official archive source page linked.",
            "file_format": "mp4",
            "is_playable": 0,
            "genres": ["Drama", "History", "Mythology"],
            "rating": 8.8
        },
        {
            "id": "bhakta-dhruva-1934",
            "source_name": "kannada_heritage",
            "source_item_id": "bhakta_dhruva_1934",
            "title": "Bhakta Dhruva",
            "original_title": "ಭಕ್ತ ಧ್ರುವ",
            "description": "Historic 1934 Kannada talkie directed by C.V. Raman, depicting the steadfast devotion of Prince Dhruva.",
            "release_year": 1934,
            "media_type": "movie",
            "duration": 5400,
            "runtime": "1h 30m",
            "language": "kn",
            "country": "IN",
            "is_original_kannada": 1,
            "is_kannada_dubbed": 0,
            "verified_audio_tracks": ["Kannada (Original Talkie)"],
            "poster_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
            "source_page_url": "https://archive.org/details/BhaktaDhruva1934Excerpt",
            "media_url": "",
            "stream_type": "direct",
            "license_id": "Public Domain",
            "license_url": "https://creativecommons.org/publicdomain/mark/1.0/",
            "attribution": "Indian Cinematograph Archives / Directed by C.V. Raman",
            "creator": "Vani Pictures",
            "rights_status": "official_link_only",
            "rights_notes": "Public Domain in India (>60 years). Cultural heritage record; archive detail page linked.",
            "file_format": "mp4",
            "is_playable": 0,
            "genres": ["Drama", "Mythology"],
            "rating": 8.4
        },
        {
            "id": "bedara-kannappa-1954",
            "source_name": "kannada_heritage",
            "source_item_id": "bedara_kannappa_1954",
            "title": "Bedara Kannappa",
            "original_title": "ಬೇಡರ ಕಣ್ಣಪ್ಪ",
            "description": "The legendary 1954 classic marking the cinematic debut of Dr. Rajkumar, winning the Certificate of Merit at the 2nd National Film Awards.",
            "release_year": 1954,
            "media_type": "movie",
            "duration": 8400,
            "runtime": "2h 20m",
            "language": "kn",
            "country": "IN",
            "is_original_kannada": 1,
            "is_kannada_dubbed": 0,
            "verified_audio_tracks": ["Kannada (Original Master Audio)"],
            "poster_url": "https://upload.wikimedia.org/wikipedia/en/0/07/Bedara_Kannappa_poster.jpg",
            "source_page_url": "https://archive.org/details/BedaraKannappa1954Classic",
            "media_url": "",
            "stream_type": "direct",
            "license_id": "Public Domain",
            "license_url": "https://creativecommons.org/publicdomain/mark/1.0/",
            "attribution": "Karnataka State Film Archives / Directed by H.L.N. Simha / Starring Dr. Rajkumar",
            "creator": "Gubbi Karnataka Films",
            "rights_status": "official_link_only",
            "rights_notes": "Public Domain under Indian Copyright Act (>60 years elapsed). Archival catalog record.",
            "file_format": "mp4",
            "is_playable": 0,
            "genres": ["Classic", "Drama", "Devotional"],
            "rating": 9.2
        },
        {
            "id": "raja-harishchandra-1913",
            "source_name": "kannada_heritage",
            "source_item_id": "raja_harishchandra_1913",
            "title": "Raja Harishchandra",
            "original_title": "राजा हरिश्चंद्र",
            "description": "The first Indian full-length silent feature film, written, produced and directed by the father of Indian cinema, Dadasaheb Phalke.",
            "release_year": 1913,
            "media_type": "movie",
            "duration": 2400,
            "runtime": "40m",
            "language": "hi",
            "country": "IN",
            "is_original_kannada": 0,
            "is_kannada_dubbed": 0,
            "verified_audio_tracks": ["Silent Cinema (Orchestral Score)"],
            "poster_url": "https://upload.wikimedia.org/wikipedia/commons/e/ec/Raja_Harishchandra_1913_Title_Card.jpg",
            "source_page_url": "https://archive.org/details/RajaHarishchandra1913",
            "media_url": "https://archive.org/download/RajaHarishchandra1913/raja-harishchandra-1913.mp4",
            "stream_type": "direct",
            "license_id": "Public Domain",
            "license_url": "https://creativecommons.org/publicdomain/mark/1.0/",
            "attribution": "National Film Heritage Mission / Directed by Dadasaheb Phalke",
            "creator": "Phalke Films",
            "rights_status": "playable",
            "rights_notes": "Public Domain worldwide (published 1913). Direct MP4 verified with HTTP 206 range requests.",
            "file_format": "mp4",
            "is_playable": 1,
            "genres": ["Silent", "Classic", "History"],
            "rating": 9.0
        },

        # --- 2. Blender Foundation Open Movies (Creative Commons CC BY) ---
        {
            "id": "sintel",
            "source_name": "blender_open",
            "source_item_id": "Sintel",
            "title": "Sintel",
            "original_title": "Sintel",
            "description": "A lonely young woman searches for a baby dragon she nurtured, exploring the bitter consequences of devotion in a stunning fantasy universe.",
            "release_year": 2010,
            "media_type": "short",
            "duration": 918,
            "runtime": "15m",
            "language": "en",
            "country": "NL",
            "is_original_kannada": 0,
            "is_kannada_dubbed": 0,
            "verified_audio_tracks": ["English (5.1 Surround & Stereo)", "Dutch (Voiceover)"],
            "subtitles": [{"lang": "en", "label": "English"}, {"lang": "kn", "label": "Kannada"}, {"lang": "fr", "label": "French"}],
            "poster_url": "https://upload.wikimedia.org/wikipedia/commons/8/8f/Sintel_poster.jpg",
            "thumbnail_url": "https://upload.wikimedia.org/wikipedia/commons/8/8f/Sintel_poster.jpg",
            "backdrop_url": "https://upload.wikimedia.org/wikipedia/commons/3/36/Sintel_dragon.jpg",
            "source_page_url": "https://durian.blender.org/",
            "media_url": "https://archive.org/download/Sintel/sintel-2048-stereo_512kb.mp4",
            "stream_type": "direct",
            "license_id": "CC BY 3.0",
            "license_url": "https://creativecommons.org/licenses/by/3.0/",
            "attribution": "(CC) Blender Foundation | durian.blender.org | Directed by Colin Levy",
            "creator": "Blender Foundation",
            "rights_status": "playable",
            "rights_notes": "Freely licensed under Creative Commons Attribution 3.0. Stream 206 range-verified.",
            "file_format": "mp4",
            "is_playable": 1,
            "genres": ["Animation", "Fantasy", "Short"],
            "rating": 8.9
        },
        {
            "id": "tears-of-steel",
            "source_name": "blender_open",
            "source_item_id": "Tears-of-Steel",
            "title": "Tears of Steel",
            "original_title": "Tears of Steel",
            "description": "Set in a dystopian future Amsterdam, a squad of warriors attempts to stage a desperate holographic intervention in an apocalyptic robot uprising.",
            "release_year": 2012,
            "media_type": "short",
            "duration": 734,
            "runtime": "12m",
            "language": "en",
            "country": "NL",
            "is_original_kannada": 0,
            "is_kannada_dubbed": 0,
            "verified_audio_tracks": ["English (Original Stereo)"],
            "subtitles": [{"lang": "en", "label": "English"}],
            "poster_url": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Tears_of_Steel_poster.jpg",
            "source_page_url": "https://mango.blender.org/",
            "media_url": "https://archive.org/download/Tears-of-Steel/tears_of_steel_720p.mp4",
            "stream_type": "direct",
            "license_id": "CC BY 3.0",
            "license_url": "https://creativecommons.org/licenses/by/3.0/",
            "attribution": "(CC) Blender Foundation | mango.blender.org | Directed by Ian Hubert",
            "creator": "Blender Foundation",
            "rights_status": "playable",
            "rights_notes": "Creative Commons Attribution 3.0. Stream 206 range-verified.",
            "file_format": "mp4",
            "is_playable": 1,
            "genres": ["Sci-Fi", "VFX", "Action"],
            "rating": 8.3
        },
        {
            "id": "cosmos-laundromat",
            "source_name": "blender_open",
            "source_item_id": "CosmosLaundromatFirstCycle",
            "title": "Cosmos Laundromat: First Cycle",
            "original_title": "Cosmos Laundromat",
            "description": "On a desolate island, a suicidal sheep named Franck meets a mysterious salesman who offers him the gift of a lifetime.",
            "release_year": 2015,
            "media_type": "short",
            "duration": 720,
            "runtime": "12m",
            "language": "en",
            "country": "NL",
            "is_original_kannada": 0,
            "is_kannada_dubbed": 0,
            "verified_audio_tracks": ["English (Original Stereo)"],
            "poster_url": "https://upload.wikimedia.org/wikipedia/commons/6/6b/Cosmos_Laundromat_Poster.jpg",
            "source_page_url": "https://cloud.blender.org/p/cosmos-laundromat/",
            "media_url": "https://archive.org/download/CosmosLaundromatFirstCycle/Cosmos%20Laundromat%20-%20First%20Cycle%20%281080p%29.mp4",
            "stream_type": "direct",
            "license_id": "CC BY 3.0",
            "license_url": "https://creativecommons.org/licenses/by/3.0/",
            "attribution": "(CC) Blender Institute | Directed by Mathieu Auvray",
            "creator": "Blender Institute",
            "rights_status": "playable",
            "rights_notes": "Creative Commons Attribution 3.0. Stream 206 range-verified.",
            "file_format": "mp4",
            "is_playable": 1,
            "genres": ["Animation", "Sci-Fi", "Dark Comedy"],
            "rating": 8.7
        },
        {
            "id": "elephants-dream",
            "source_name": "blender_open",
            "source_item_id": "ElephantsDream",
            "title": "Elephants Dream",
            "original_title": "Elephants Dream",
            "description": "The world's first open-movie 3D animated production, following Proog and Emo as they journey through the monumental machinery of the machine.",
            "release_year": 2006,
            "media_type": "short",
            "duration": 653,
            "runtime": "11m",
            "language": "en",
            "country": "NL",
            "is_original_kannada": 0,
            "is_kannada_dubbed": 0,
            "verified_audio_tracks": ["English (Original Stereo)"],
            "poster_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Elephants_Dream_poster.jpg/800px-Elephants_Dream_poster.jpg",
            "source_page_url": "https://orange.blender.org/",
            "media_url": "https://archive.org/download/ElephantsDream/ed_hd.mp4",
            "stream_type": "direct",
            "license_id": "CC BY 2.5",
            "license_url": "https://creativecommons.org/licenses/by/2.5/",
            "attribution": "(CC) Blender Foundation / orange.blender.org",
            "creator": "Blender Foundation",
            "rights_status": "playable",
            "rights_notes": "Creative Commons Attribution 2.5. Stream 206 range-verified.",
            "file_format": "mp4",
            "is_playable": 1,
            "genres": ["Animation", "Sci-Fi", "Classic"],
            "rating": 8.4
        },
        {
            "id": "big-buck-bunny",
            "source_name": "blender_open",
            "source_item_id": "BigBuckBunny_328",
            "title": "Big Buck Bunny",
            "original_title": "Big Buck Bunny",
            "description": "A large and lovable rabbit teaches three bullying forest critters a hilarious lesson about respect in this open-source classic.",
            "release_year": 2008,
            "media_type": "short",
            "duration": 596,
            "runtime": "10m",
            "language": "en",
            "country": "NL",
            "is_original_kannada": 0,
            "is_kannada_dubbed": 0,
            "verified_audio_tracks": ["Orchestral Score (Original Stereo)"],
            "poster_url": "https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg",
            "source_page_url": "https://peach.blender.org/",
            "media_url": "https://archive.org/download/BigBuckBunny_328/BigBuckBunny_512kb.mp4",
            "stream_type": "direct",
            "license_id": "CC BY 3.0",
            "license_url": "https://creativecommons.org/licenses/by/3.0/",
            "attribution": "(CC) Blender Foundation | peach.blender.org | Directed by Sacha Goedegebure",
            "creator": "Blender Foundation",
            "rights_status": "playable",
            "rights_notes": "Creative Commons Attribution 3.0. Stream 206 range-verified.",
            "file_format": "mp4",
            "is_playable": 1,
            "genres": ["Animation", "Comedy"],
            "rating": 8.5
        },

        # --- 3. Worldwide Public Domain Masterpieces ---
        {
            "id": "his-girl-friday-1940",
            "source_name": "archive_org",
            "source_item_id": "his_girl_friday",
            "title": "His Girl Friday",
            "original_title": "His Girl Friday",
            "description": "Howard Hawks' lightning-fast screwball comedy classic starring Cary Grant and Rosalind Russell as sharp-witted newspaper journalists.",
            "release_year": 1940,
            "media_type": "movie",
            "duration": 5520,
            "runtime": "1h 32m",
            "language": "en",
            "country": "US",
            "is_original_kannada": 0,
            "is_kannada_dubbed": 0,
            "verified_audio_tracks": ["English (Original Audio)"],
            "poster_url": "https://upload.wikimedia.org/wikipedia/commons/f/fe/His_Girl_Friday_poster.jpg",
            "source_page_url": "https://archive.org/details/his_girl_friday",
            "media_url": "https://archive.org/download/his_girl_friday/his_girl_friday_512kb.mp4",
            "stream_type": "direct",
            "license_id": "Public Domain",
            "license_url": "https://creativecommons.org/publicdomain/mark/1.0/",
            "attribution": "Directed by Howard Hawks / Columbia Pictures / Public Domain",
            "creator": "Columbia Pictures",
            "rights_status": "playable",
            "rights_notes": "Public Domain due to failure to renew copyright in 1968. Stream 206 range-verified.",
            "file_format": "mp4",
            "is_playable": 1,
            "genres": ["Comedy", "Romance", "Classic"],
            "rating": 8.9
        },
        {
            "id": "night-of-the-living-dead-1968",
            "source_name": "archive_org",
            "source_item_id": "Night.Of.The.Living.Dead_1080p",
            "title": "Night of the Living Dead",
            "original_title": "Night of the Living Dead",
            "description": "George A. Romero's revolutionary 1968 horror classic following a group trapped in a rural farmhouse during a zombie apocalypse.",
            "release_year": 1968,
            "media_type": "movie",
            "duration": 5760,
            "runtime": "1h 36m",
            "language": "en",
            "country": "US",
            "is_original_kannada": 0,
            "is_kannada_dubbed": 0,
            "verified_audio_tracks": ["English (Original Mono & Stereo Remaster)"],
            "poster_url": "https://upload.wikimedia.org/wikipedia/commons/8/8b/Night_of_the_Living_Dead_%281968%29_theatrical_poster.jpg",
            "source_page_url": "https://archive.org/details/Night.Of.The.Living.Dead_1080p",
            "media_url": "https://archive.org/download/Night.Of.The.Living.Dead_1080p/NightOfTheLivingDead_720p.mp4",
            "stream_type": "direct",
            "license_id": "Public Domain",
            "license_url": "https://creativecommons.org/publicdomain/mark/1.0/",
            "attribution": "Directed by George A. Romero / Image Ten / Public Domain due to notice omission",
            "creator": "George A. Romero",
            "rights_status": "playable",
            "rights_notes": "Public Domain due to distributor omission of copyright notice upon 1968 theatrical release. Stream 206 range-verified.",
            "file_format": "mp4",
            "is_playable": 1,
            "genres": ["Horror", "Thriller", "Classic"],
            "rating": 8.7
        },
        {
            "id": "the-general-1926",
            "source_name": "archive_org",
            "source_item_id": "The_General_Buster_Keaton",
            "title": "The General",
            "original_title": "The General",
            "description": "Buster Keaton's epic Civil War silent comedy masterpiece featuring legendary physical stunts and precision train sequences.",
            "release_year": 1926,
            "media_type": "movie",
            "duration": 4680,
            "runtime": "1h 18m",
            "language": "en",
            "country": "US",
            "is_original_kannada": 0,
            "is_kannada_dubbed": 0,
            "verified_audio_tracks": ["Silent Cinema (Accompaniment)"],
            "poster_url": "https://upload.wikimedia.org/wikipedia/commons/c/c5/The_General_%281926_film%29_poster.jpg",
            "source_page_url": "https://archive.org/details/The_General_Buster_Keaton",
            "media_url": "https://archive.org/download/The_General_Buster_Keaton/The_General_512kb.mp4",
            "stream_type": "direct",
            "license_id": "Public Domain",
            "license_url": "https://creativecommons.org/publicdomain/mark/1.0/",
            "attribution": "Directed by Buster Keaton & Clyde Bruckman / United Artists / Public Domain",
            "creator": "Buster Keaton Productions",
            "rights_status": "playable",
            "rights_notes": "Public Domain worldwide (published 1926). Stream 206 range-verified.",
            "file_format": "mp4",
            "is_playable": 1,
            "genres": ["Comedy", "Action", "Classic"],
            "rating": 9.3
        },
        {
            "id": "metropolis-1927",
            "source_name": "archive_org",
            "source_item_id": "Metropolis1927EnglishVersion",
            "title": "Metropolis",
            "original_title": "Metropolis",
            "description": "Fritz Lang's monumental 1927 dystopian science fiction masterpiece exploring class conflict in an awe-inspiring futuristic metropolis.",
            "release_year": 1927,
            "media_type": "movie",
            "duration": 9180,
            "runtime": "2h 33m",
            "language": "de",
            "country": "DE",
            "is_original_kannada": 0,
            "is_kannada_dubbed": 0,
            "verified_audio_tracks": ["Silent Cinema (Full Orchestral Score)"],
            "poster_url": "https://upload.wikimedia.org/wikipedia/commons/0/06/Metropolisposter.jpg",
            "source_page_url": "https://archive.org/details/Metropolis1927EnglishVersion",
            "media_url": "https://archive.org/download/Metropolis1927EnglishVersion/Metropolis_1927_English_Version.mp4",
            "stream_type": "direct",
            "license_id": "Public Domain",
            "license_url": "https://creativecommons.org/publicdomain/mark/1.0/",
            "attribution": "Directed by Fritz Lang / UFA Studio / Worldwide Public Domain",
            "creator": "Fritz Lang & Thea von Harbou",
            "rights_status": "playable",
            "rights_notes": "Public Domain worldwide (published 1927). Stream 206 range-verified.",
            "file_format": "mp4",
            "is_playable": 1,
            "genres": ["Sci-Fi", "Drama", "Classic"],
            "rating": 9.4
        },
        {
            "id": "jungle-book-1942",
            "source_name": "archive_org",
            "source_item_id": "JungleBook",
            "title": "Jungle Book",
            "original_title": "Jungle Book",
            "description": "Zoltan Korda's Technicolor adaptation of Rudyard Kipling's tales, starring Sabu as Mowgli raised by wolves in India.",
            "release_year": 1942,
            "media_type": "movie",
            "duration": 6540,
            "runtime": "1h 48m",
            "language": "en",
            "country": "US",
            "is_original_kannada": 0,
            "is_kannada_dubbed": 0,
            "verified_audio_tracks": ["English (Original Soundtrack)"],
            "poster_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Jungle_Book_%281942_film%29_poster.jpg/800px-Jungle_Book_%281942_film%29_poster.jpg",
            "source_page_url": "https://archive.org/details/JungleBook",
            "media_url": "https://archive.org/download/JungleBook/Jungle_Book_512kb.mp4",
            "stream_type": "direct",
            "license_id": "Public Domain",
            "license_url": "https://creativecommons.org/publicdomain/mark/1.0/",
            "attribution": "Directed by Zoltan Korda / Alexander Korda Films / Public Domain",
            "creator": "Alexander Korda Films",
            "rights_status": "playable",
            "rights_notes": "Public Domain in the United States (failure to renew copyright in 1970). Stream 206 range-verified.",
            "file_format": "mp4",
            "is_playable": 1,
            "genres": ["Adventure", "Family", "Classic"],
            "rating": 8.6
        },
        {
            "id": "scarlet-street-1945",
            "source_name": "archive_org",
            "source_item_id": "ScarletStreet",
            "title": "Scarlet Street",
            "original_title": "Scarlet Street",
            "description": "Fritz Lang's gripping film noir masterpiece starring Edward G. Robinson and Joan Bennett in a tale of manipulation and obsession.",
            "release_year": 1945,
            "media_type": "movie",
            "duration": 6120,
            "runtime": "1h 42m",
            "language": "en",
            "country": "US",
            "is_original_kannada": 0,
            "is_kannada_dubbed": 0,
            "verified_audio_tracks": ["English (Original Mono)"],
            "poster_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Scarlet_Street_poster.jpg/800px-Scarlet_Street_poster.jpg",
            "source_page_url": "https://archive.org/details/ScarletStreet",
            "media_url": "https://archive.org/download/ScarletStreet/Scarlet_Street_512kb.mp4",
            "stream_type": "direct",
            "license_id": "Public Domain",
            "license_url": "https://creativecommons.org/publicdomain/mark/1.0/",
            "attribution": "Directed by Fritz Lang / Universal Pictures / Public Domain (non-renewal)",
            "creator": "Universal Pictures",
            "rights_status": "playable",
            "rights_notes": "Public Domain in the United States due to copyright non-renewal. Stream 206 range-verified.",
            "file_format": "mp4",
            "is_playable": 1,
            "genres": ["Film Noir", "Drama", "Crime"],
            "rating": 8.8
        },
        {
            "id": "nosferatu-1922",
            "source_name": "archive_org",
            "source_item_id": "Nosferatu_most_complete_version_93_mins.",
            "title": "Nosferatu",
            "original_title": "Nosferatu, eine Symphonie des Grauens",
            "description": "F.W. Murnau's eerie German Expressionist vampire landmark starring Max Schreck as the terrifying Count Orlok.",
            "release_year": 1922,
            "media_type": "movie",
            "duration": 5640,
            "runtime": "1h 34m",
            "language": "de",
            "country": "DE",
            "is_original_kannada": 0,
            "is_kannada_dubbed": 0,
            "verified_audio_tracks": ["Silent Cinema (Orchestral Score)"],
            "poster_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Nosferatu_1922_theatrical_poster.jpg/800px-Nosferatu_1922_theatrical_poster.jpg",
            "source_page_url": "https://archive.org/details/Nosferatu_most_complete_version_93_mins.",
            "media_url": "https://archive.org/download/Nosferatu_most_complete_version_93_mins./Nosferatu_1922_Symphony_of_Horror_512kb.mp4",
            "stream_type": "direct",
            "license_id": "Public Domain",
            "license_url": "https://creativecommons.org/publicdomain/mark/1.0/",
            "attribution": "Directed by F.W. Murnau / Jofa-Atelier Berlin / Public Domain worldwide",
            "creator": "Prana Film",
            "rights_status": "playable",
            "rights_notes": "Public Domain worldwide (published 1922). Stream 206 range-verified.",
            "file_format": "mp4",
            "is_playable": 1,
            "genres": ["Horror", "Silent", "Expressionism"],
            "rating": 9.1
        }
    ]

    for rec in initial_records:
        save_open_media_record(rec)


# ================= ANIME CATALOGUE DATABASE ACCESSORS =================

def save_anime_item(item: Dict[str, Any]):
    """Insert or update an anime title in the SQLite anime_catalog table."""
    if not item or not item.get("id"):
        return
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO anime_catalog (
                    id, tmdb_id, mal_id, title, original_title, overview, poster, backdrop,
                    release_year, genres, status, format, episodes_count, runtime, score,
                    rating, match_pct, studio, has_hindi_dub, has_english_dub, is_japanese_original,
                    audio, dubs, subs, category_tags, providers, youtube_id, provenance, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    tmdb_id=excluded.tmdb_id,
                    mal_id=excluded.mal_id,
                    title=excluded.title,
                    original_title=excluded.original_title,
                    overview=excluded.overview,
                    poster=excluded.poster,
                    backdrop=excluded.backdrop,
                    release_year=excluded.release_year,
                    genres=excluded.genres,
                    status=excluded.status,
                    format=excluded.format,
                    episodes_count=excluded.episodes_count,
                    runtime=excluded.runtime,
                    score=excluded.score,
                    rating=excluded.rating,
                    match_pct=excluded.match_pct,
                    studio=excluded.studio,
                    has_hindi_dub=excluded.has_hindi_dub,
                    has_english_dub=excluded.has_english_dub,
                    is_japanese_original=excluded.is_japanese_original,
                    audio=excluded.audio,
                    dubs=excluded.dubs,
                    subs=excluded.subs,
                    category_tags=excluded.category_tags,
                    providers=excluded.providers,
                    youtube_id=excluded.youtube_id,
                    provenance=excluded.provenance,
                    updated_at=excluded.updated_at
            """, (
                str(item.get("id")),
                item.get("tmdb_id"),
                item.get("mal_id"),
                item.get("title"),
                item.get("original_title"),
                item.get("overview"),
                item.get("poster"),
                item.get("backdrop"),
                item.get("release_year") or 2024,
                json.dumps(item.get("genres", [])),
                item.get("status", "ongoing"),
                item.get("format", "TV"),
                item.get("episodes_count", 12),
                item.get("runtime", "12 Episodes"),
                float(item.get("score") or 8.5),
                item.get("rating", "U/A 16+"),
                item.get("match") or item.get("match_pct") or "98% Match",
                item.get("studio", "Anime Studio"),
                1 if item.get("has_hindi_dub") else 0,
                1 if item.get("has_english_dub", 1) else 0,
                1 if item.get("is_japanese_original", 1) else 0,
                json.dumps(item.get("audio", [])),
                json.dumps(item.get("dubs", [])),
                json.dumps(item.get("subs", [])),
                json.dumps(item.get("category_tags", [])),
                json.dumps(item.get("providers", [])),
                item.get("youtubeId") or item.get("youtube_id"),
                item.get("provenance", "Kartoons Index Taxonomy & Verified Multi-Audio Registry"),
                now_iso
            ))
            conn.commit()
    except Exception as e:
        print(f"Error saving anime item {item.get('id')}: {e}")


def _row_to_anime(row) -> Dict[str, Any]:
    """Convert an sqlite3.Row from anime_catalog into a full Python dictionary."""
    if not row:
        return {}
    r = dict(row)
    for field in ["genres", "audio", "dubs", "subs", "category_tags", "providers"]:
        if r.get(field):
            try:
                r[field] = json.loads(r[field])
            except Exception:
                r[field] = []
        else:
            r[field] = []
    r["type"] = "anime"
    r["match"] = r.get("match_pct") or "98% Match"
    r["year"] = str(r.get("release_year") or "2024")
    r["youtubeId"] = r.get("youtube_id")
    return r


def get_anime_item(id_or_tmdb: str) -> Optional[Dict[str, Any]]:
    """Retrieve an anime record from SQLite by ID or TMDB numeric ID."""
    str_val = str(id_or_tmdb).strip()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM anime_catalog WHERE id = ?", (str_val,))
        row = cursor.fetchone()
        if row:
            return _row_to_anime(row)

        digits = re.findall(r"\d+", str_val)
        if digits:
            tmdb_num = int(digits[-1])
            cursor.execute("SELECT * FROM anime_catalog WHERE tmdb_id = ?", (tmdb_num,))
            row = cursor.fetchone()
            if row:
                return _row_to_anime(row)
    return None


def get_anime_catalog(
    category: str = "all",
    genre: Optional[str] = None,
    status: Optional[str] = None,
    language: Optional[str] = None,
    query: Optional[str] = None,
    page: int = 1,
    limit: int = 20
) -> Dict[str, Any]:
    """
    Query the cached anime catalog in SQLite with filters and pagination.
    """
    category = (category or "all").lower().strip()
    genre = (genre or "").lower().strip()
    status = (status or "").lower().strip()
    lang = (language or "").lower().strip()
    query = (query or "").lower().strip()
    page = max(1, page)
    limit = max(1, min(100, limit))

    where_clauses = []
    params = []

    if category == "movies":
        where_clauses.append("format = 'Movie'")
    elif category == "series":
        where_clauses.append("format = 'TV'")
    elif category in ["ongoing", "recently_updated"]:
        where_clauses.append("status = 'ongoing'")
    elif category == "completed":
        where_clauses.append("status = 'completed'")

    if status and status != "all":
        where_clauses.append("status = ?")
        params.append(status)

    if lang and lang != "all":
        if lang in ["hi", "hindi"]:
            where_clauses.append("has_hindi_dub = 1")
        elif lang in ["en", "english"]:
            where_clauses.append("has_english_dub = 1")
        elif lang in ["ja", "japanese"]:
            where_clauses.append("is_japanese_original = 1")

    if genre and genre != "all":
        where_clauses.append("LOWER(genres) LIKE ?")
        params.append(f"%{genre}%")

    if query:
        where_clauses.append("(LOWER(title) LIKE ? OR LOWER(original_title) LIKE ? OR LOWER(overview) LIKE ? OR LOWER(studio) LIKE ?)")
        q_wild = f"%{query}%"
        params.extend([q_wild, q_wild, q_wild, q_wild])

    where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""
    order_by = "ORDER BY score DESC" if category in ["popular", "trending", "all"] else "ORDER BY release_year DESC"

    with get_db() as conn:
        cursor = conn.cursor()
        count_query = f"SELECT COUNT(*) FROM anime_catalog {where_sql}"
        cursor.execute(count_query, params)
        total_results = cursor.fetchone()[0]

        offset = (page - 1) * limit
        data_query = f"SELECT * FROM anime_catalog {where_sql} {order_by} LIMIT ? OFFSET ?"
        cursor.execute(data_query, params + [limit, offset])
        rows = cursor.fetchall()
        results = [_row_to_anime(r) for r in rows]

    total_pages = max(1, (total_results + limit - 1) // limit)
    return {
        "page": page,
        "total_pages": total_pages,
        "total_results": total_results,
        "results": results,
        "provenance": "Kartoons Index Taxonomy & Verified Multi-Audio Registry | TMDB Official Anime API (v3/v4)"
    }


def search_anime_catalog(query: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Fast search across anime titles and studios."""
    res = get_anime_catalog(query=query, limit=limit)
    return res.get("results", [])


def seed_anime_catalog():
    """Populate anime_catalog with rich curated Kartoons seed data if empty."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM anime_catalog")
        cnt = cursor.fetchone()[0]
        if cnt == 0:
            try:
                from backend.anime_service import CURATED_ANIME_SEED
                for item in CURATED_ANIME_SEED:
                    save_anime_item(item)
            except Exception as e:
                print(f"Error seeding anime catalog: {e}")


# ================= MOVIES CATALOGUE DATABASE ACCESSORS (ALLMOVIESHUB TAXONOMY) =================

def save_movie_item(item: Dict[str, Any]):
    """Insert or update a movie title in the SQLite movies_catalog table."""
    if not item or not item.get("id"):
        return
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO movies_catalog (
                    id, tmdb_id, title, original_title, overview, poster, backdrop,
                    release_year, genres, original_language, language_label,
                    has_hindi_dub, has_english_dub, has_kannada_audio,
                    audio_tracks, dubs, subs, category_tags, runtime, score,
                    rating, match_pct, studio, playback_status, is_playable,
                    media_url, official_provider_url, providers, youtube_id, provenance, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    tmdb_id=excluded.tmdb_id,
                    title=excluded.title,
                    original_title=excluded.original_title,
                    overview=excluded.overview,
                    poster=excluded.poster,
                    backdrop=excluded.backdrop,
                    release_year=excluded.release_year,
                    genres=excluded.genres,
                    original_language=excluded.original_language,
                    language_label=excluded.language_label,
                    has_hindi_dub=excluded.has_hindi_dub,
                    has_english_dub=excluded.has_english_dub,
                    has_kannada_audio=excluded.has_kannada_audio,
                    audio_tracks=excluded.audio_tracks,
                    dubs=excluded.dubs,
                    subs=excluded.subs,
                    category_tags=excluded.category_tags,
                    runtime=excluded.runtime,
                    score=excluded.score,
                    rating=excluded.rating,
                    match_pct=excluded.match_pct,
                    studio=excluded.studio,
                    playback_status=excluded.playback_status,
                    is_playable=excluded.is_playable,
                    media_url=excluded.media_url,
                    official_provider_url=excluded.official_provider_url,
                    providers=excluded.providers,
                    youtube_id=excluded.youtube_id,
                    provenance=excluded.provenance,
                    updated_at=excluded.updated_at
            """, (
                str(item.get("id")),
                item.get("tmdb_id"),
                item.get("title"),
                item.get("original_title"),
                item.get("overview"),
                item.get("poster"),
                item.get("backdrop"),
                item.get("release_year") or 2024,
                json.dumps(item.get("genres", [])),
                item.get("original_language", "en"),
                item.get("language_label") or item.get("language", "English"),
                1 if item.get("has_hindi_dub") else 0,
                1 if item.get("has_english_dub") else 0,
                1 if item.get("has_kannada_audio") else 0,
                json.dumps(item.get("audio_tracks", item.get("audio", []))),
                json.dumps(item.get("dubs", [])),
                json.dumps(item.get("subs", [])),
                json.dumps(item.get("category_tags", [])),
                item.get("runtime", "Feature Film"),
                float(item.get("score") or 8.0),
                item.get("rating", "U/A 16+"),
                item.get("match") or item.get("match_pct") or "97% Match",
                item.get("studio", "Cinema Studio"),
                item.get("playback_status", "official_link_only"),
                1 if item.get("is_playable") else 0,
                item.get("media_url"),
                item.get("official_provider_url"),
                json.dumps(item.get("providers", [])),
                item.get("youtubeId") or item.get("youtube_id"),
                item.get("provenance", "AllMoviesHub Index Taxonomy & Multi-Audio Registry"),
                now_iso
            ))
            conn.commit()
    except Exception as e:
        print(f"Error saving movie item {item.get('id')}: {e}")


def _row_to_movie(row) -> Dict[str, Any]:
    """Convert an sqlite3.Row from movies_catalog into a full Python dictionary."""
    if not row:
        return {}
    r = dict(row)
    for field in ["genres", "audio_tracks", "dubs", "subs", "category_tags", "providers"]:
        if r.get(field):
            try:
                r[field] = json.loads(r[field])
            except Exception:
                r[field] = []
        else:
            r[field] = []
    r["audio"] = r.get("audio_tracks", [])
    r["type"] = "movies"
    r["match"] = r.get("match_pct") or "97% Match"
    r["year"] = str(r.get("release_year") or "2024")
    r["language"] = r.get("language_label") or "Hindi"
    r["youtubeId"] = r.get("youtube_id")
    return r


def get_movie_item(id_or_tmdb: str) -> Optional[Dict[str, Any]]:
    """Retrieve a movie record from SQLite by ID or TMDB numeric ID."""
    str_val = str(id_or_tmdb).strip()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM movies_catalog WHERE id = ?", (str_val,))
        row = cursor.fetchone()
        if row:
            return _row_to_movie(row)

        digits = re.findall(r"\d+", str_val)
        if digits:
            tmdb_num = int(digits[-1])
            cursor.execute("SELECT * FROM movies_catalog WHERE tmdb_id = ?", (tmdb_num,))
            row = cursor.fetchone()
            if row:
                return _row_to_movie(row)
    return None


def get_movies_catalog(
    category: str = "all",
    genre: Optional[str] = None,
    language: Optional[str] = None,
    query: Optional[str] = None,
    playable_only: bool = False,
    page: int = 1,
    limit: int = 20
) -> Dict[str, Any]:
    """
    Query the cached movies catalog in SQLite with filters and pagination.
    """
    category = (category or "all").lower().strip()
    genre = (genre or "").lower().strip()
    lang = (language or "").lower().strip()
    query = (query or "").lower().strip()
    page = max(1, page)
    limit = max(1, min(100, limit))

    where_clauses = []
    params = []

    if category == "bollywood":
        where_clauses.append("original_language = 'hi'")
    elif category == "hollywood_hindi":
        where_clauses.append("(has_hindi_dub = 1 AND (original_language = 'en' OR has_english_dub = 1))")
    elif category == "kannada":
        where_clauses.append("(original_language = 'kn' OR has_kannada_audio = 1)")
    elif category == "telugu":
        where_clauses.append("original_language = 'te'")
    elif category == "tamil":
        where_clauses.append("original_language = 'ta'")
    elif category == "malayalam":
        where_clauses.append("original_language = 'ml'")
    elif category == "dual_audio":
        where_clauses.append("(has_hindi_dub = 1 AND (has_english_dub = 1 OR has_kannada_audio = 1))")
    elif category == "playable" or playable_only:
        where_clauses.append("is_playable = 1")

    if lang and lang != "all":
        if lang in ["hi", "hindi"]:
            where_clauses.append("(original_language = 'hi' OR has_hindi_dub = 1)")
        elif lang in ["kn", "kannada"]:
            where_clauses.append("(original_language = 'kn' OR has_kannada_audio = 1)")
        elif lang in ["en", "english"]:
            where_clauses.append("(original_language = 'en' OR has_english_dub = 1)")
        elif lang in ["te", "telugu"]:
            where_clauses.append("original_language = 'te'")
        elif lang in ["ta", "tamil"]:
            where_clauses.append("original_language = 'ta'")
        elif lang in ["ml", "malayalam"]:
            where_clauses.append("original_language = 'ml'")
        else:
            where_clauses.append("original_language = ?")
            params.append(lang)

    if genre and genre != "all":
        where_clauses.append("LOWER(genres) LIKE ?")
        params.append(f"%{genre}%")

    if query:
        where_clauses.append("(LOWER(title) LIKE ? OR LOWER(original_title) LIKE ? OR LOWER(overview) LIKE ? OR LOWER(studio) LIKE ?)")
        q_wild = f"%{query}%"
        params.extend([q_wild, q_wild, q_wild, q_wild])

    where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""
    order_by = "ORDER BY score DESC" if category in ["popular", "trending", "all"] else "ORDER BY release_year DESC"

    with get_db() as conn:
        cursor = conn.cursor()
        count_query = f"SELECT COUNT(*) FROM movies_catalog {where_sql}"
        cursor.execute(count_query, params)
        total_results = cursor.fetchone()[0]

        offset = (page - 1) * limit
        data_query = f"SELECT * FROM movies_catalog {where_sql} {order_by} LIMIT ? OFFSET ?"
        cursor.execute(data_query, params + [limit, offset])
        rows = cursor.fetchall()
        results = [_row_to_movie(r) for r in rows]

    total_pages = max(1, (total_results + limit - 1) // limit)
    return {
        "page": page,
        "total_pages": total_pages,
        "total_results": total_results,
        "results": results,
        "provenance": "AllMoviesHub Index Taxonomy & Multi-Audio Registry | TMDB Official API (v3/v4)"
    }


def search_movies_catalog(query: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Fast search across movie titles and studios."""
    res = get_movies_catalog(query=query, limit=limit)
    return res.get("results", [])


def seed_movies_catalog():
    """Populate movies_catalog with rich curated AllMoviesHub seed data if empty."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM movies_catalog")
        cnt = cursor.fetchone()[0]
        if cnt == 0:
            try:
                from backend.movie_service import CURATED_MOVIES_SEED
                for item in CURATED_MOVIES_SEED:
                    save_movie_item(item)
            except Exception as e:
                print(f"Error seeding movies catalog: {e}")





