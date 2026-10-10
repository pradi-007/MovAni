import os
import re
import sqlite3
from pathlib import Path
from functools import wraps
from flask import Flask, jsonify, render_template, request, abort, send_from_directory, session, redirect, url_for, flash
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import requests

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / '.env')
MOVIES_DIR = BASE_DIR / 'movies'
INSTANCE_DIR = BASE_DIR / 'instance'
DB_PATH = INSTANCE_DIR / 'movani.db'
MOVIES_DIR.mkdir(exist_ok=True)
INSTANCE_DIR.mkdir(exist_ok=True)

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'change-this-secret-before-deploying')
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024 * 1024  # 2 GB upload cap for local testing
TMDB_API_KEY = os.getenv('TMDB_API_KEY', '').strip()
TMDB_READ_TOKEN = os.getenv('TMDB_READ_ACCESS_TOKEN', '').strip()
ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD_HASH = os.getenv('ADMIN_PASSWORD_HASH', '')


def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    return conn


def init_db():
    with db() as con:
        con.executescript('''
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS titles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tmdb_id INTEGER,
          media_type TEXT NOT NULL DEFAULT 'movie' CHECK(media_type IN ('movie','tv','anime')),
          title TEXT NOT NULL,
          overview TEXT DEFAULT '',
          poster_path TEXT DEFAULT '',
          backdrop_path TEXT DEFAULT '',
          release_year TEXT DEFAULT '',
          genre TEXT DEFAULT '',
          video_type TEXT NOT NULL DEFAULT 'none' CHECK(video_type IN ('none','local','hls','youtube')),
          video_path TEXT DEFAULT '',
          playback_url TEXT DEFAULT '',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS watch_progress (
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title_id INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
          position_seconds REAL NOT NULL DEFAULT 0,
          duration_seconds REAL NOT NULL DEFAULT 0,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY(user_id, title_id)
        );
        CREATE TABLE IF NOT EXISTS watchlist (
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title_id INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY(user_id, title_id)
        );
        ''')


def user_required(fn):
    @wraps(fn)
    def wrapped(*args, **kwargs):
        if not session.get('user_id'):
            return jsonify({'error': 'Please sign in first.'}), 401
        return fn(*args, **kwargs)
    return wrapped


def title_dict(row):
    d = dict(row)
    d['poster_url'] = ('https://image.tmdb.org/t/p/w500' + d['poster_path']) if d.get('poster_path') else ''
    d['backdrop_url'] = ('https://image.tmdb.org/t/p/w1280' + d['backdrop_path']) if d.get('backdrop_path') else ''
    d['has_playback'] = d.get('video_type') in ('local', 'hls', 'youtube') and bool(d.get('video_path') or d.get('playback_url'))
    return d


def tmdb_request(path, params=None):
    params = params or {}
    headers = {'accept': 'application/json'}
    if TMDB_READ_TOKEN:
        headers['Authorization'] = f'Bearer {TMDB_READ_TOKEN}'
    elif TMDB_API_KEY:
        params['api_key'] = TMDB_API_KEY
    else:
        raise RuntimeError('TMDB credentials are not configured. Add TMDB_READ_ACCESS_TOKEN or TMDB_API_KEY to .env.')
    response = requests.get(f'https://api.themoviedb.org/3/{path.lstrip("/")}', params=params, headers=headers, timeout=15)
    response.raise_for_status()
    return response.json()


@app.get('/')
def home():
    with db() as con:
        titles = [title_dict(r) for r in con.execute('SELECT * FROM titles ORDER BY created_at DESC LIMIT 30').fetchall()]
    return render_template('index.html', titles=titles, signed_in=bool(session.get('user_id')), username=session.get('username'))


@app.get('/api/tmdb/trending')
def tmdb_trending():
    try:
        media = request.args.get('type', 'all')
        if media not in ('all', 'movie', 'tv'):
            media = 'all'
        data = tmdb_request(f'trending/{media}/week', {'language': 'en-US', 'page': 1})
        results = []
        for item in data.get('results', []):
            results.append({
                'tmdb_id': item.get('id'),
                'media_type': item.get('media_type') or media,
                'title': item.get('title') or item.get('name') or 'Untitled',
                'overview': item.get('overview') or '',
                'poster_path': item.get('poster_path') or '',
                'backdrop_path': item.get('backdrop_path') or '',
                'release_year': (item.get('release_date') or item.get('first_air_date') or '')[:4],
                'poster_url': ('https://image.tmdb.org/t/p/w500' + item['poster_path']) if item.get('poster_path') else '',
                'backdrop_url': ('https://image.tmdb.org/t/p/w1280' + item['backdrop_path']) if item.get('backdrop_path') else ''
            })
        return jsonify(results)
    except requests.RequestException:
        return jsonify({'error': 'TMDB request failed. Check your network and API credentials.'}), 502
    except RuntimeError as exc:
        return jsonify({'error': str(exc)}), 503


@app.get('/api/tmdb/search')
def tmdb_search():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])
    kind = request.args.get('type', 'multi')
    if kind not in ('multi', 'movie', 'tv'):
        kind = 'multi'
    try:
        data = tmdb_request(f'search/{kind}', {'query': query, 'include_adult': 'false', 'language': 'en-US', 'page': 1})
        results = []
        for item in data.get('results', []):
            if item.get('media_type') == 'person':
                continue
            results.append({
                'tmdb_id': item.get('id'), 'media_type': item.get('media_type') or kind,
                'title': item.get('title') or item.get('name') or 'Untitled',
                'overview': item.get('overview') or '', 'poster_path': item.get('poster_path') or '',
                'backdrop_path': item.get('backdrop_path') or '',
                'release_year': (item.get('release_date') or item.get('first_air_date') or '')[:4],
                'poster_url': ('https://image.tmdb.org/t/p/w500' + item['poster_path']) if item.get('poster_path') else '',
                'backdrop_url': ('https://image.tmdb.org/t/p/w1280' + item['backdrop_path']) if item.get('backdrop_path') else ''
            })
        return jsonify(results)
    except requests.RequestException:
        return jsonify({'error': 'TMDB search failed.'}), 502
    except RuntimeError as exc:
        return jsonify({'error': str(exc)}), 503


@app.get('/api/catalog')
def catalog():
    with db() as con:
        rows = con.execute('SELECT * FROM titles ORDER BY created_at DESC').fetchall()
    return jsonify([title_dict(r) for r in rows])


@app.post('/api/register')
def register():
    data = request.get_json(silent=True) or request.form
    username = str(data.get('username', '')).strip()
    password = str(data.get('password', ''))
    if not re.fullmatch(r'[A-Za-z0-9_.-]{3,32}', username) or len(password) < 8:
        return jsonify({'error': 'Username must be 3–32 letters/numbers/._- and password must be at least 8 characters.'}), 400
    try:
        with db() as con:
            cur = con.execute('INSERT INTO users(username,password_hash) VALUES(?,?)', (username, generate_password_hash(password)))
            user_id = cur.lastrowid
        session['user_id'] = user_id
        session['username'] = username
        return jsonify({'ok': True, 'username': username}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'That username is already taken.'}), 409


@app.post('/api/login')
def login():
    data = request.get_json(silent=True) or request.form
    username = str(data.get('username', '')).strip()
    password = str(data.get('password', ''))
    with db() as con:
        user = con.execute('SELECT * FROM users WHERE username=?', (username,)).fetchone()
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'error': 'Invalid username or password.'}), 401
    session['user_id'] = user['id']
    session['username'] = user['username']
    return jsonify({'ok': True, 'username': user['username']})


@app.post('/api/logout')
def logout():
    session.clear()
    return jsonify({'ok': True})


def is_admin_request():
    auth = request.authorization
    if auth and ADMIN_PASSWORD_HASH:
        return auth.username == ADMIN_USERNAME and check_password_hash(ADMIN_PASSWORD_HASH, auth.password)
    return bool(session.get('is_admin'))


@app.post('/api/admin/titles')
def add_title():
    # For the initial local prototype, admin credentials are HTTP Basic auth.
    # Set ADMIN_PASSWORD_HASH in .env; generate a hash using the README instructions.
    if not is_admin_request():
        return jsonify({'error': 'Admin authentication required. Configure ADMIN_USERNAME and ADMIN_PASSWORD_HASH.'}), 401
    data = request.get_json(silent=True) or request.form
    title = str(data.get('title', '')).strip()
    media_type = str(data.get('media_type', 'movie')).strip().lower()
    video_type = str(data.get('video_type', 'none')).strip().lower()
    video_path = str(data.get('video_path', '')).strip()
    playback_url = str(data.get('playback_url', '')).strip()
    if not title:
        return jsonify({'error': 'title is required'}), 400
    if media_type not in ('movie', 'tv', 'anime') or video_type not in ('none', 'local', 'hls', 'youtube'):
        return jsonify({'error': 'Invalid media_type or video_type'}), 400
    if video_type == 'local':
        if not re.fullmatch(r'[A-Za-z0-9_. -]+\.mp4', video_path, flags=re.I) or not (MOVIES_DIR / video_path).is_file():
            return jsonify({'error': 'video_path must be the filename of an existing MP4 inside the movies folder.'}), 400
        playback_url = ''
    elif video_type in ('hls', 'youtube'):
        if not playback_url.startswith('https://'):
            return jsonify({'error': 'Use an HTTPS playback URL from a provider you are authorized to use.'}), 400
        video_path = ''
    else:
        video_path = playback_url = ''
    with db() as con:
        cur = con.execute('''INSERT INTO titles(tmdb_id,media_type,title,overview,poster_path,backdrop_path,release_year,genre,video_type,video_path,playback_url)
          VALUES(?,?,?,?,?,?,?,?,?,?,?)''', (
            int(data.get('tmdb_id')) if str(data.get('tmdb_id', '')).isdigit() else None,
            media_type, title, str(data.get('overview', '')), str(data.get('poster_path', '')),
            str(data.get('backdrop_path', '')), str(data.get('release_year', ''))[:4], str(data.get('genre', '')),
            video_type, video_path, playback_url))
        new_id = cur.lastrowid
    return jsonify({'ok': True, 'id': new_id}), 201


@app.get('/watch/<int:title_id>')
def watch(title_id):
    with db() as con:
        row = con.execute('SELECT * FROM titles WHERE id=?', (title_id,)).fetchone()
    if not row:
        abort(404)
    title = title_dict(row)
    if not title['has_playback']:
        return render_template('unavailable.html', title=title), 404
    if title['video_type'] == 'local':
        title['player_url'] = url_for('stream_movie', filename=title['video_path'])
    elif title['video_type'] == 'youtube':
        title['player_url'] = title['playback_url']
    else:
        title['player_url'] = title['playback_url']
    return render_template('watch.html', title=title, signed_in=bool(session.get('user_id')))


@app.get('/stream/<path:filename>')
def stream_movie(filename):
    # Only serve files from MOVIES_DIR. Do not accept arbitrary filesystem paths.
    if not filename.lower().endswith('.mp4') or '/' in filename or '\\' in filename or filename.startswith('.'):
        abort(404)
    target = MOVIES_DIR / filename
    if not target.is_file():
        abort(404)
    return send_from_directory(str(MOVIES_DIR), filename, mimetype='video/mp4', as_attachment=False, conditional=True, max_age=0)


@app.post('/api/progress/<int:title_id>')
@user_required
def save_progress(title_id):
    data = request.get_json(silent=True) or {}
    try:
        position = max(0, float(data.get('position_seconds', 0)))
        duration = max(0, float(data.get('duration_seconds', 0)))
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid playback position'}), 400
    with db() as con:
        exists = con.execute('SELECT id FROM titles WHERE id=?', (title_id,)).fetchone()
        if not exists:
            return jsonify({'error': 'Title not found'}), 404
        con.execute('''INSERT INTO watch_progress(user_id,title_id,position_seconds,duration_seconds,updated_at)
          VALUES(?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id,title_id) DO UPDATE SET
          position_seconds=excluded.position_seconds,duration_seconds=excluded.duration_seconds,updated_at=CURRENT_TIMESTAMP''',
          (session['user_id'], title_id, position, duration))
    return jsonify({'ok': True})


@app.get('/api/progress')
@user_required
def get_progress():
    with db() as con:
        rows = con.execute('''SELECT t.*, p.position_seconds,p.duration_seconds,p.updated_at AS progress_updated
          FROM watch_progress p JOIN titles t ON t.id=p.title_id WHERE p.user_id=? ORDER BY p.updated_at DESC''', (session['user_id'],)).fetchall()
    return jsonify([title_dict(r) for r in rows])


@app.post('/api/watchlist/<int:title_id>')
@user_required
def toggle_watchlist(title_id):
    with db() as con:
        if not con.execute('SELECT id FROM titles WHERE id=?', (title_id,)).fetchone():
            return jsonify({'error': 'Title not found'}), 404
        row = con.execute('SELECT 1 FROM watchlist WHERE user_id=? AND title_id=?', (session['user_id'], title_id)).fetchone()
        if row:
            con.execute('DELETE FROM watchlist WHERE user_id=? AND title_id=?', (session['user_id'], title_id))
            added = False
        else:
            con.execute('INSERT INTO watchlist(user_id,title_id) VALUES(?,?)', (session['user_id'], title_id))
            added = True
    return jsonify({'ok': True, 'added': added})


@app.get('/health')
def health():
    return jsonify({'ok': True, 'app': 'MOVAni'})


@app.errorhandler(413)
def too_large(_error):
    return jsonify({'error': 'Upload is too large. Place large video files in the movies folder or use a video hosting provider.'}), 413


init_db()

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=int(os.getenv('PORT', '5000')), debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true')
