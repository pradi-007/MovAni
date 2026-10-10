# MOVAni — Streaming Platform Starter

A practical Flask starter for a Netflix-style catalog with TMDB metadata, local authorized MP4 playback, account registration/login, watch progress, watchlist API, and an admin API for adding titles. It does **not** include copyrighted movies, anime episodes, or access to pirated streams. You must supply files you own or are licensed to distribute, or playback URLs from a legitimate provider.

## Features included

- Responsive dark catalog UI
- TMDB trending/search metadata via backend (credentials never sent to browser)
- SQLite database initialized automatically
- User registration/login with password hashing and signed sessions
- Local MP4 playback with HTTP conditional/range support through Flask
- Optional provider playback URL field for authorized HTTPS HLS or YouTube embeds
- Save watch progress for signed-in users
- Admin-protected API to add catalog titles
- Health endpoint at `/health`

## 1. Requirements

- Python 3.10+ (3.11/3.12 recommended)
- A TMDB API key or Read Access Token
- Authorized MP4 files for local playback, or a legitimate video hosting provider

## 2. Run locally on Windows

Open PowerShell in this folder (the folder containing `app.py` and `run.py` is not required; this starter's entrypoint is `app.py`).

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env` and set `TMDB_READ_ACCESS_TOKEN` or `TMDB_API_KEY`. Generate secrets:

```powershell
py -c "import secrets; print(secrets.token_urlsafe(48))"
py -c "from werkzeug.security import generate_password_hash; print(generate_password_hash('choose-a-strong-admin-password'))"
```

Put the generated values in `FLASK_SECRET_KEY` and `ADMIN_PASSWORD_HASH`. Set `ADMIN_USERNAME` too. Keep `.env` private.

Start the app:

```powershell
py app.py
```

Open `http://127.0.0.1:5000`. Check `http://127.0.0.1:5000/health`.

> If you already have a `run.py` entry point in your existing MOVAni repository, either keep using it after merging the route changes, or add this starter as a separate branch first. Do not overwrite existing files before backing them up.

## 3. Add local video files

1. Put an authorized MP4 inside `movies/`, e.g. `sample.mp4`.
2. Use H.264 video + AAC audio for broad browser compatibility.
3. Generate the admin password hash as above and configure `.env`.
4. Restart the app.
5. Use the admin API below to create a title whose `video_type` is `local` and `video_path` is `sample.mp4`.

### Add a title via PowerShell

PowerShell Basic auth example (replace credentials and values):

```powershell
$pair = 'admin:YOUR_ADMIN_PASSWORD'
$basic = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($pair))
$headers = @{ Authorization = "Basic $basic" }
$body = @{
  title = 'My Authorized Film'
  media_type = 'movie'
  overview = 'A demo title from my licensed library.'
  release_year = '2026'
  video_type = 'local'
  video_path = 'sample.mp4'
} | ConvertTo-Json
Invoke-RestMethod -Uri 'http://127.0.0.1:5000/api/admin/titles' -Method Post -Headers $headers -ContentType 'application/json' -Body $body
```

Then open `/` and select Watch in Available to watch. To add metadata from TMDB, copy the title's `tmdb_id`, `poster_path`, and `backdrop_path` into the JSON payload. This starter intentionally keeps catalog metadata separate from actual playback rights.

### Authorized HLS provider playback

Set `video_type` to `hls` and `playback_url` to an HTTPS `.m3u8` playback URL supplied by your provider. This starter uses native browser HLS support only; cross-browser support usually requires a maintained player library such as hls.js. For private content, generate short-lived signed playback URLs on the server rather than storing public permanent links.

For YouTube trailers, use `video_type: "youtube"` and a provider-approved embed URL, such as `https://www.youtube.com/embed/VIDEO_ID`. This is for trailers/embeddable content, not a source of full movie files.

## 4. API overview

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/tmdb/trending?type=all` | Trending TMDB metadata |
| GET | `/api/tmdb/search?q=...` | Search TMDB metadata |
| GET | `/api/catalog` | Local catalog titles |
| POST | `/api/register` | Create user account (JSON username/password) |
| POST | `/api/login` | Sign in (JSON username/password) |
| POST | `/api/logout` | Sign out |
| POST | `/api/admin/titles` | Add catalog title (HTTP Basic admin auth) |
| GET | `/watch/<id>` | Watch page |
| GET | `/stream/<filename>` | Serve local MP4 from movies directory |
| POST | `/api/progress/<id>` | Save watch progress (signed-in user) |
| GET | `/api/progress` | List signed-in user's progress |
| POST | `/api/watchlist/<id>` | Toggle title in watchlist (signed-in user) |

## 5. Deployment notes

For a demo, deploy the Flask app to a Python host such as Render using `requirements.txt` and `Procfile`. Set environment variables in the host dashboard, not in source control. Set `FLASK_SECRET_KEY`, TMDB credentials, `ADMIN_USERNAME`, and `ADMIN_PASSWORD_HASH`. Start command: `gunicorn app:app --bind 0.0.0.0:$PORT`.

**Do not deploy the SQLite database or local `movies/` folder on an ephemeral app filesystem for production.** Many hosts erase local files on redeploy and local disk does not scale. For production:

- Use managed PostgreSQL for users/catalog/progress.
- Store video in a video platform/object storage and use a CDN.
- Use provider-signed playback URLs or tokens for private titles.
- Use HTTPS, rate limits, CSRF protections for browser mutations, strong secrets, backups, monitoring, and a secure admin interface.
- Do not expose the admin API without a strong password hash and HTTPS.
- Review privacy, copyright, age-rating, takedown, and regional licensing obligations before public launch.

This starter is a learning MVP, not a security-audited production Netflix replacement. Before public deployment, add CSRF protection, rate limiting, email verification/password reset, stronger admin authorization/roles, production database migrations, and tests.

## TMDB attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. Review the current TMDB API terms and attribution requirements before public release.
