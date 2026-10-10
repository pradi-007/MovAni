"""
User State API Routes
Handles user personal data: Watchlist, Continue Watching, and Saved Soundtracks via SQLite.
"""

from datetime import datetime
from flask import Blueprint, jsonify, request
from backend.database import get_db
from backend.catalog_data import CATALOG_DATA

user_bp = Blueprint("user", __name__, url_prefix="/api")


# ================= WATCHLIST =================

@user_bp.route("/watchlist", methods=["GET", "POST", "DELETE"])
def handle_watchlist():
    """Manage user's personal watchlist backed by SQLite."""
    with get_db() as conn:
        cursor = conn.cursor()

        if request.method == "GET":
            cursor.execute("SELECT title_id FROM watchlist ORDER BY created_at DESC")
            saved_ids = [row[0] for row in cursor.fetchall()]
            saved_items = [i for i in CATALOG_DATA if i["id"] in saved_ids]
            return jsonify({
                "ids": saved_ids,
                "items": saved_items,
                "count": len(saved_ids)
            })

        elif request.method == "POST":
            data = request.get_json(silent=True) or {}
            title_id = data.get("id")
            if not title_id:
                return jsonify({"error": "Missing title id"}), 400

            cursor.execute("SELECT title_id FROM watchlist WHERE title_id = ?", (title_id,))
            exists = cursor.fetchone()

            if exists:
                cursor.execute("DELETE FROM watchlist WHERE title_id = ?", (title_id,))
                action = "removed"
            else:
                cursor.execute(
                    "INSERT INTO watchlist (title_id, created_at) VALUES (?, ?)",
                    (title_id, datetime.now().isoformat())
                )
                action = "added"

            conn.commit()

            cursor.execute("SELECT title_id FROM watchlist ORDER BY created_at DESC")
            all_ids = [row[0] for row in cursor.fetchall()]
            return jsonify({
                "action": action,
                "title_id": title_id,
                "watchlist": all_ids,
                "count": len(all_ids)
            })

        elif request.method == "DELETE":
            cursor.execute("DELETE FROM watchlist")
            conn.commit()
            return jsonify({"message": "Watchlist cleared", "count": 0})


# ================= CONTINUE WATCHING =================

@user_bp.route("/continue-watching", methods=["GET", "POST"])
def handle_continue_watching():
    """Manage JioHotstar style Continue Watching rail backed by SQLite."""
    with get_db() as conn:
        cursor = conn.cursor()

        if request.method == "GET":
            cursor.execute("SELECT title_id, progress, ep, current_seconds, total_seconds FROM continue_watching ORDER BY updated_at DESC")
            rows = cursor.fetchall()
            result = []
            for t_id, prog, ep, curr_sec, tot_sec in rows:
                title_item = next((i for i in CATALOG_DATA if i["id"] == t_id), None)
                if title_item:
                    result.append({
                        "id": t_id,
                        "title": title_item["title"],
                        "progress": prog,
                        "ep": ep,
                        "current_seconds": curr_sec or 0,
                        "total_seconds": tot_sec or 0,
                        "thumb": title_item["backdrop"]
                    })
                else:
                    result.append({
                        "id": t_id,
                        "title": ep if ep and ep != "Resume" else f"Title #{t_id}",
                        "progress": prog,
                        "ep": ep,
                        "current_seconds": curr_sec or 0,
                        "total_seconds": tot_sec or 0,
                        "thumb": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80"
                    })
            return jsonify(result)

        elif request.method == "POST":
            data = request.get_json(silent=True) or {}
            title_id = data.get("id")
            progress = data.get("progress", 25)
            ep = data.get("ep", "Resume")
            current_seconds = float(data.get("current_seconds", 0))
            total_seconds = float(data.get("total_seconds", 0))

            if not title_id:
                return jsonify({"error": "Missing title id"}), 400

            cursor.execute(
                """
                INSERT INTO continue_watching (title_id, progress, ep, current_seconds, total_seconds, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(title_id) DO UPDATE SET
                    progress = excluded.progress,
                    ep = excluded.ep,
                    current_seconds = excluded.current_seconds,
                    total_seconds = excluded.total_seconds,
                    updated_at = excluded.updated_at
                """,
                (title_id, progress, ep, current_seconds, total_seconds, datetime.now().isoformat())
            )
            conn.commit()
            return jsonify({
                "status": "saved",
                "title_id": title_id,
                "progress": progress,
                "current_seconds": current_seconds,
                "total_seconds": total_seconds
            })


@user_bp.route("/continue-watching/<title_id>", methods=["DELETE"])
def remove_continue_watching(title_id):
    """Remove a title from Continue Watching."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM continue_watching WHERE title_id = ?", (title_id,))
        conn.commit()
    return jsonify({"status": "removed", "title_id": title_id})


@user_bp.route("/continue-watching/clear", methods=["POST"])
def clear_all_continue_watching():
    """Clear entire continue watching history."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM continue_watching")
        conn.commit()
    return jsonify({"status": "cleared"})


# ================= SAVED MUSIC (X-RAY) =================

@user_bp.route("/music", methods=["GET", "POST"])
def handle_saved_music():
    """Manage Amazon Prime in-stream X-Ray saved music library."""
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

            cursor.execute("SELECT song_title FROM saved_music WHERE song_title = ?", (song_title,))
            exists = cursor.fetchone()

            if exists:
                cursor.execute("DELETE FROM saved_music WHERE song_title = ?", (song_title,))
                action = "removed"
            else:
                cursor.execute(
                    "INSERT INTO saved_music (song_title, artist, title_id, saved_at) VALUES (?, ?, ?, ?)",
                    (song_title, artist, title_id, datetime.now().isoformat())
                )
                action = "saved"

            conn.commit()
            return jsonify({"action": action, "song_title": song_title})
