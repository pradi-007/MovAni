# MOVAni Comprehensive System Audit Report

**Date:** October 12, 2026  
**System:** MOVAni Global Streaming Web Application  
**Repository:** `pradi-007/MovAni`  
**Deployment Target:** Vercel Serverless (`https://mov-ani.vercel.app/`) & Local Flask Engine (`http://127.0.0.1:5000`)

---

## 1. Architecture Overview & Entry Points

* **Backend Framework:** Python 3.14 / Flask 3.0.0 modular REST API.
* **Server Startup Entrypoint:** `backend/app.py` (`create_app()` factory and `__main__` entrypoint running on `0.0.0.0:5000`).
* **Vercel Serverless Entrypoint:** `api/index.py` wrapping WSGI `app` with sys.path resolution and error recovery.
* **Database:** SQLite3 (`movani.db` locally, `/tmp/movani.db` on Vercel serverless).
* **Frontend:** Modern Vanilla JavaScript SPA (`frontend/index.html`, Tailwind CSS CDN + Phosphor Icons, modular JS scripts in `frontend/js/`).
* **Metadata Source:** TMDB v3/v4 via `api.tmdb.org` (CloudFront CDN) with DoH fallback and regional JustWatch watch-provider attribution.

---

## 2. Existing Modules & Routes Audit

| Module Path | Route Prefix | Responsibility | Status |
| :--- | :--- | :--- | :--- |
| `backend/app.py` | `/`, `/api/health` | Static asset serving, CORS, security headers, blueprint registry | Active & Healthy |
| `backend/database.py` | N/A | SQLite connection manager, schema initialization, caching | Active & Hardened |
| `backend/tmdb.py` | N/A | TMDB API client, DoH resolver, JustWatch provider extraction | Active |
| `backend/routes/catalog.py` | `/api/catalog`, `/api/discover` | Dynamic title resolver, paginated discovery, genre/studio channels | Active |
| `backend/routes/kannada.py` | `/api/kannada` | Authentic Kannada cinema discovery (`with_original_language=kn`) | Active |
| `backend/routes/search.py` | `/api/search` | Unified live multi-search (curated + TMDB deduplicated) | Active |
| `backend/routes/ott.py` | `/api/ott` | OTT session generator, stream playback manifest, health | Needs Stream Unification |
| `backend/routes/user.py` | `/api/user`, `/api/watchlist` | Watchlist, Continue Watching, saved soundtracks | Active; Needs User Auth |

---

## 3. Streaming Server Integrations & URL Resolution Audit

The system previously exposed multiple external streaming mirrors:
1. **NexStream VIP (Server 1):** `https://api.codespecters.com/embed/movie/{tmdb_id}?apikey={NEXSTREAM_API_KEY}` (VIP Token: `nx_f388cf270eb1c40dc4f1d5c9d79e9c12`).
2. **MultiEmbed Prime (Server 2):** `https://multiembed.mov/?video_id={tmdb_id}&tmdb=1` (Indian Regional Audio & Kannada 5.1 Atmos).
3. **VidLink (Server 3):** `https://vidlink.pro/movie/{tmdb_id}`.
4. **SmashyStream (Server 4):** `https://embed.smashystream.com/playere.php?tmdb={tmdb_id}`.
5. **EmbedSuite (Server 5):** `https://embedsuite.com/embed/movie/{tmdb_id}`.
6. **AutoEmbed (Server 6):** `https://autoembed.co/movie/tmdb/{tmdb_id}`.
7. **Direct CDN Fallback Assets:** Open source video samples (`vjs.zencdn.net`, `archive.org`).

### Identified Player Deficiencies:
* **Multiple Disconnected Player Interfaces:** Users were presented with server switcher buttons ("Server 1", "Server 2") which broke immersion.
* **Overlaid Iframes Disabling Custom HUD:** When external iframes were loaded, MOVAni's custom playback bar, audio track selector, and scrubber were dimmed or hidden.
* **Infinite Fake Buffering:** When an external stream failed or was blocked by CORS/X-Frame-Options, users were left waiting indefinitely instead of seeing clear status messages.

---

## 4. Authentication, Security & Session Audit

* **Current State:** 
  * The existing project has NO database-backed user authentication.
  * The frontend had a static profile modal that saved a mock name to `localStorage`.
  * No password hashing, no email verification, no session tokens, no reset password flows.
* **Security Risks Identified:**
  * No rate limiting on user inputs.
  * Unauthenticated access to personal data endpoints (`/api/watchlist`, `/api/continue-watching`).
  * Lack of CSRF protection and secure session cookies.

---

## 5. Audio & Subtitles Verification Audit

* **Hardcoded Language Declarations:**
  * In `backend/universal_ott.py`, `STANDARD_AUDIO_TRACKS` hardcoded 10 languages and `STANDARD_SUBTITLES` hardcoded 11 languages for every title regardless of actual availability.
* **Missing Title-Specific Manifests:**
  * Playback manifests must be derived on a per-title and per-episode basis from verified TMDB/manifest data.
* **Kannada Audio Authenticity:**
  * Setting `original_language = kn` marks the production language, but external CDNs often only host Hindi/English dubs.
  * Solution: Route Kannada titles to verified Indian regional CDNs (MultiEmbed Prime / NexStream VIP) and clearly display playback availability if original audio is unserved.

---

## 6. Frontend UI Cleanliness & Dead Controls Audit

* **Nonfunctional Elements to Fix/Remove:**
  * Fake playback speed controls on iframe embeds where iframe security blocks playbackRate changes.
  * Duplicate server selection badges in the player header.
  * Unused decorative popup menus and placeholders.
  * Inconsistent icon alignments in top navigation and player HUD.

---

## 7. Action Plan & Next Phases

1. **Phase 2 & 3:** Implement complete backend authentication (`backend/auth.py`, `backend/routes/auth.py`, schema migrations in SQLite, password hashing with PBKDF2/SHA-256, secure expiring email verification tokens, rate-limited auth endpoints) + build the 3D Animated Glassmorphic Login/Register/Reset UI (`frontend/login.html` & modal) matching the design specification.
2. **Phase 4:** Unify player into **one consistent MOVAni player interface** with seamless backend resolution and automatic fallback.
3. **Phase 5:** Per-title verified audio and subtitle track resolution.
4. **Phase 6 & 8:** Clean UI, remove dead controls and intrusive ads.
5. **Phase 10:** Comprehensive regression test suite.
