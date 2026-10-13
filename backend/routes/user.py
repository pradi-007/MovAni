"""
User State API Routes
Handles user-isolated personal data: Watchlist, Continue Watching, and Saved Soundtracks via SQLite.
Strictly isolates watch history and watchlists by the authenticated session user ID.
Server-side ownership verification ensures User A cannot view or manipulate User B's state.
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from flask import Blueprint, jsonify, request
from backend.database import (
    get_db,
    get_session,
    get_cached_media_item,
    get_user_watchlist,
    add_user_watchlist,
    remove_user_watchlist,
    clear_user_watchlist,
    get_user_continue_watching,
    save_user_continue_watching,
    remove_user_continue_watching,
    clear_user_continue_watching
)
from backend.catalog_data import CATALOG_DATA

user_bp = Blueprint("user", __name__, url_prefix="/api")


def get_authenticated_user_context() -> tuple[Optional[int], Optional[str]]:
    """
    Extract authenticated user ID and session error status.
    Returns (user_id, error_code).
    error_code is 'SESSION_REPLACED' if session was invalidated by another device login.
    """
    token = request.headers.get("Authorization", "")
    if token.startswith("Bearer "):
        token = token[7:].strip()
    else:
        token = request.cookies.get("movani_session", "")

    if not token:
        token = request.headers.get("X-Session-Token", "")

    if not token:
        return None, None

    session = get_session(token)
    if not session:
        return None, "SESSION_INVALID"

    # Enforce active session status and One-Device policy
    if session.get("status") == "revoked":
        reason = session.get("revocation_reason") or "device_replaced"
        return None, ("SESSION_REPLACED" if reason == "device_replaced" else "SESSION_REVOKED")

    # Check expiration
    try:
        expires_at = datetime.fromisoformat(session["expires_at"])
        if datetime.now(timezone.utc).replace(tzinfo=None) > expires_at.replace(tzinfo=None):
            return None, "SESSION_EXPIRED"
    except Exception:
        pass

    return session.get("user_id"), None


def get_current_user_id() -> Optional[int]:
    uid, _ = get_authenticated_user_context()
    return uid


# ================= WATCHLIST =================

@user_bp.route("/watchlist", methods=["GET", "POST", "DELETE"])
def handle_watchlist():
    """Manage user's personal watchlist backed by SQLite."""
    user_id, err_code = get_authenticated_user_context()

    if err_code == "SESSION_REPLACED":
        return jsonify({
            "error": "Your account was signed in on another device. This session has been closed.",
            "code": "SESSION_REPLACED",
            "session_revoked": True
        }), 401

    if request.method == "GET":
        if not user_id:
            return jsonify({
                "ids": [],
                "items": [],
                "count": 0
            })

        saved_ids = get_user_watchlist(user_id)
        saved_items = []
        for sid in saved_ids:
            item = next((i for i in CATALOG_DATA if str(i.get("id")) == sid or str(i.get("tmdbId")) == sid), None)
            if not item:
                item = get_cached_media_item(sid)
            if item:
                saved_items.append(item)
            else:
                saved_items.append({"id": sid, "title": f"Title #{sid}", "type": "movie"})

        return jsonify({
            "ids": saved_ids,
            "items": saved_items,
            "count": len(saved_ids)
        })

    elif request.method == "POST":
        if not user_id:
            return jsonify({"error": "Authentication required to modify watchlist", "authenticated": False}), 401

        data = request.get_json(silent=True) or {}
        title_id = str(data.get("id") or "").strip()
        if not title_id:
            return jsonify({"error": "Missing title id"}), 400

        current_watchlist = get_user_watchlist(user_id)
        if title_id in current_watchlist:
            remove_user_watchlist(user_id, title_id)
            action = "removed"
        else:
            add_user_watchlist(user_id, title_id)
            action = "added"

        updated_ids = get_user_watchlist(user_id)
        return jsonify({
            "action": action,
            "title_id": title_id,
            "watchlist": updated_ids,
            "count": len(updated_ids)
        })

    elif request.method == "DELETE":
        if not user_id:
            return jsonify({"error": "Authentication required to clear watchlist", "authenticated": False}), 401

        clear_user_watchlist(user_id)
        return jsonify({"message": "Watchlist cleared", "count": 0})


# ================= CONTINUE WATCHING =================

@user_bp.route("/continue-watching", methods=["GET", "POST"])
def handle_continue_watching():
    """Manage user-isolated Continue Watching rail backed by SQLite."""
    user_id, err_code = get_authenticated_user_context()

    if err_code == "SESSION_REPLACED":
        return jsonify({
            "error": "Your account was signed in on another device. This session has been closed.",
            "code": "SESSION_REPLACED",
            "session_revoked": True
        }), 401

    if request.method == "GET":
        if not user_id:
            return jsonify([])  # Clean empty state for guests

        records = get_user_continue_watching(user_id)
        result = []
        for r in records:
            t_id = r["title_id"]
            title_item = next((i for i in CATALOG_DATA if str(i.get("id")) == t_id or str(i.get("tmdbId")) == t_id), None)
            if not title_item:
                title_item = get_cached_media_item(t_id)

            if title_item:
                thumb = title_item.get("backdrop") or title_item.get("poster")
                title_name = title_item.get("title", f"Title #{t_id}")
            else:
                thumb = "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80"
                title_name = r.get("ep") if r.get("ep") and r.get("ep") != "Resume" else f"Title #{t_id}"

            result.append({
                "id": t_id,
                "title": title_name,
                "progress": r.get("progress", 0),
                "ep": r.get("ep") or "Resume",
                "media_type": r.get("media_type") or "movie",
                "season": r.get("season", 1),
                "episode": r.get("episode", 1),
                "current_seconds": r.get("current_seconds") or 0.0,
                "total_seconds": r.get("total_seconds") or 0.0,
                "thumb": thumb
            })
        return jsonify(result)

    elif request.method == "POST":
        if not user_id:
            return jsonify({"error": "Authentication required to save watch progress", "authenticated": False}), 401

        data = request.get_json(silent=True) or {}
        title_id = str(data.get("id") or "").strip()
        if not title_id:
            return jsonify({"error": "Missing title id"}), 400

        try:
            progress = int(data.get("progress", 0))
        except (ValueError, TypeError):
            progress = 0

        ep = str(data.get("ep") or "Resume")
        media_type = str(data.get("media_type") or "movie")

        try:
            season = int(data.get("season", 1))
        except (ValueError, TypeError):
            season = 1

        try:
            episode = int(data.get("episode", 1))
        except (ValueError, TypeError):
            episode = 1

        try:
            current_seconds = float(data.get("current_seconds", 0.0))
        except (ValueError, TypeError):
            current_seconds = 0.0

        try:
            total_seconds = float(data.get("total_seconds", 0.0))
        except (ValueError, TypeError):
            total_seconds = 0.0

        save_user_continue_watching(
            user_id=user_id,
            title_id=title_id,
            progress=progress,
            ep=ep,
            current_seconds=current_seconds,
            total_seconds=total_seconds,
            media_type=media_type,
            season=season,
            episode=episode
        )

        return jsonify({
            "status": "saved",
            "title_id": title_id,
            "progress": progress,
            "current_seconds": current_seconds,
            "total_seconds": total_seconds
        })


@user_bp.route("/continue-watching/<title_id>", methods=["DELETE"])
def remove_continue_watching(title_id):
    """Remove a title from Continue Watching for the authenticated user."""
    user_id, err_code = get_authenticated_user_context()
    if err_code == "SESSION_REPLACED":
        return jsonify({
            "error": "Your account was signed in on another device. This session has been closed.",
            "code": "SESSION_REPLACED",
            "session_revoked": True
        }), 401

    if not user_id:
        return jsonify({"error": "Authentication required", "authenticated": False}), 401

    remove_user_continue_watching(user_id, str(title_id))
    return jsonify({"status": "removed", "title_id": title_id})


@user_bp.route("/continue-watching/clear", methods=["POST"])
def clear_all_continue_watching():
    """Clear entire continue watching history for the authenticated user."""
    user_id, err_code = get_authenticated_user_context()
    if err_code == "SESSION_REPLACED":
        return jsonify({
            "error": "Your account was signed in on another device. This session has been closed.",
            "code": "SESSION_REPLACED",
            "session_revoked": True
        }), 401

    if not user_id:
        return jsonify({"error": "Authentication required", "authenticated": False}), 401

    clear_user_continue_watching(user_id)
    return jsonify({"status": "cleared"})


@user_bp.route("/continue-watching/progress/<title_id>", methods=["GET"])
def get_title_progress(title_id):
    """Retrieve resume progress for a specific title for the authenticated user."""
    user_id, err_code = get_authenticated_user_context()
    if err_code == "SESSION_REPLACED":
        return jsonify({
            "error": "Your account was signed in on another device. This session has been closed.",
            "code": "SESSION_REPLACED",
            "session_revoked": True
        }), 401

    if not user_id:
        return jsonify({"has_progress": False, "current_seconds": 0, "total_seconds": 0, "progress": 0})

    records = get_user_continue_watching(user_id)
    match = next((r for r in records if str(r.get("title_id")) == str(title_id)), None)
    if match:
        return jsonify({
            "has_progress": True,
            "title_id": str(title_id),
            "current_seconds": match.get("current_seconds", 0.0),
            "total_seconds": match.get("total_seconds", 0.0),
            "progress": match.get("progress", 0),
            "ep": match.get("ep", "Resume"),
            "season": match.get("season", 1),
            "episode": match.get("episode", 1)
        })

    return jsonify({"has_progress": False, "current_seconds": 0, "total_seconds": 0, "progress": 0})


# ================= SAVED MUSIC (X-RAY) =================

@user_bp.route("/music", methods=["GET", "POST"])
def handle_saved_music():
    """Manage Amazon Prime in-stream X-Ray saved music library."""
    user_id, err_code = get_authenticated_user_context()
    if err_code == "SESSION_REPLACED":
        return jsonify({
            "error": "Your account was signed in on another device. This session has been closed.",
            "code": "SESSION_REPLACED",
            "session_revoked": True
        }), 401

    with get_db() as conn:
        cursor = conn.cursor()

        if request.method == "GET":
            cursor.execute("SELECT song_title, artist, title_id FROM saved_music ORDER BY saved_at DESC")
            rows = cursor.fetchall()
            return jsonify([{"title": r[0], "artist": r[1], "title_id": r[2]} for r in rows])

        elif request.method == "POST":
            data = request.get_json(silent=True) or {}
            song_title = data.get("title")
            artist = data.get("artist", "")
            title_id = data.get("title_id", "")

            if not song_title:
                return jsonify({"error": "Missing song title"}), 400

            now = datetime.now(timezone.utc).isoformat()
            cursor.execute("SELECT song_title FROM saved_music WHERE song_title = ?", (song_title,))
            exists = cursor.fetchone()
            if exists:
                cursor.execute("DELETE FROM saved_music WHERE song_title = ?", (song_title,))
                action = "removed"
            else:
                cursor.execute(
                    "INSERT OR REPLACE INTO saved_music (song_title, artist, title_id, saved_at) VALUES (?, ?, ?, ?)",
                    (song_title, artist, title_id, now)
                )
                action = "saved"

            conn.commit()
            return jsonify({"action": action, "song_title": song_title})
