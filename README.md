# MOVAni — Movies, Web Series & Anime Simulcasts

A production-grade, high-contrast, responsive streaming & discovery web application combining the premier UI/UX patterns from **Netflix**, **Amazon Prime Video**, and **JioHotstar** into a clean, matte obsidian dark theme.

Built with a clean architectural separation between **Modular Frontend** and **Python Flask Backend**, backed by **SQLite persistence** and full REST APIs.

---

## 🏗️ Architecture & Project Structure

```
E:\MovAni\
├── backend/
│   ├── __init__.py             # Backend package marker
│   ├── app.py                  # Flask entrypoint, Blueprint registrations, static serving
│   ├── database.py             # SQLite connection manager, schema migrations, seed data
│   ├── catalog_data.py         # Master dataset (20 titles, studios, X-Ray intelligence)
│   ├── routes/
│   │   ├── __init__.py         # Blueprints export
│   │   ├── catalog.py          # /api/catalog, /api/top10, /api/studios
│   │   ├── user.py             # /api/watchlist, /api/continue-watching, /api/music
│   │   └── search.py           # /api/search?q=<query>
│   └── tests/
│       └── test_api.py         # Backend integration test suite (8/8 passing)
│
├── frontend/
│   ├── index.html              # Clean streaming SPA layout
│   ├── css/
│   │   └── styles.css          # Matte obsidian design tokens, scrollbars, Top 10 stroke numbers
│   └── js/
│       ├── api.js              # Asynchronous REST client with automatic offline fallback
│       ├── state.js            # Master state container & 20-title client baseline
│       ├── ui.js               # DOM renderers for Hero Billboard, rails, modals & toasts
│       ├── xray.js             # Amazon Prime Video in-stream X-Ray intelligence drawer
│       ├── player.js           # Theater modal player, timeline scrubber, 10s skip, audio cycler
│       ├── search.js           # Live search debouncing & instant dropdown suggestions
│       └── app.js              # Master controller, keyboard shortcuts, backend synchronization
│
├── run.py                      # Top-level server launcher with auto-browser opening
├── app.py                      # Convenience root entrypoint delegating to backend
├── test_app.py                 # Root test runner (10/10 passing)
├── run.bat                     # 1-click Windows runner batch script
├── requirements.txt            # Python dependencies (Flask >= 3.0.0)
├── movani.db                   # SQLite database (auto-created on startup)
└── README.md                   # Full technical documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure Python 3.10+ is installed on your system.

Install requirements:
```bash
py -m pip install -r requirements.txt
```

### 2. Launch the Application Server
Run using the server runner:
```bash
py run.py
```
Or use the 1-click launcher on Windows:
```bash
run.bat
```

The server will automatically:
1. Initialize the SQLite database (`movani.db`) if not present.
2. Seed initial Continue Watching progress entries.
3. Serve the modular frontend at **`http://127.0.0.1:5000`**.
4. Open the web application in your default browser.

### 3. CLI Server Options
```bash
py run.py --port 8080 --no-browser --debug
```

---

## 🧪 Running Automated Tests

Run the backend test suite:
```bash
py backend/tests/test_api.py
```
Or run the root integration tests:
```bash
py test_app.py
```
Both test suites validate:
- System health check & static file serving
- Catalog filtering by category (`anime`, `movies`, `series`) and studio (`MAPPA`, `Crunchyroll`, `HBO Max`)
- Netflix Top 10 ranking query
- Prime Video Studio Hubs aggregation
- Search engine queries across titles, overviews, and cast
- SQLite persistence for Watchlist (add, retrieve, clear)
- SQLite persistence for Continue Watching (add, update progress, delete, clear)
- SQLite persistence for Saved Music tracks

---

## 📡 REST API Reference

| Endpoint | Method | Parameters | Description |
|:---|:---|:---|:---|
| `/` | `GET` | — | Serves the single-page streaming interface |
| `/api/health` | `GET` | — | Health check and catalog count |
| `/api/catalog` | `GET` | `category`, `studio`, `q`, `limit` | Query titles with optional filters |
| `/api/catalog/<id>` | `GET` | — | Retrieve full metadata and X-Ray specs for a title |
| `/api/top10` | `GET` | — | Retrieve Top 10 titles today |
| `/api/studios` | `GET` | — | Retrieve studio hubs with counts |
| `/api/search` | `GET` | `q=<query>` | Multi-field search across titles, actors, genres |
| `/api/watchlist` | `GET` | — | Retrieve all saved title IDs in user's watchlist |
| `/api/watchlist` | `POST` | JSON: `{ "title_id": "..." }` | Toggle title presence in watchlist |
| `/api/watchlist` | `DELETE` | — | Clear all titles from watchlist |
| `/api/continue-watching` | `GET` | — | Retrieve continue watching items |
| `/api/continue-watching` | `POST` | JSON: `{ "title_id": "...", "progress": 50, "ep": "S1:E2" }` | Record/update playback progress |
| `/api/continue-watching/<id>` | `DELETE` | — | Remove a specific title from continue watching |
| `/api/continue-watching/clear` | `POST` | — | Clear continue watching history |
| `/api/music` | `GET` | — | Retrieve saved music tracks |
| `/api/music` | `POST` | JSON: `{ "song_title": "...", "artist": "...", "title_id": "..." }` | Save soundtrack to music library |
| `/api/tmdb/status` | `GET` | — | Check live TMDB connectivity & credential health |
| `/api/tmdb/trending` | `GET` | `window=day`, `limit=20` | Live trending titles from TMDB |
| `/api/tmdb/anime` | `GET` | `limit=15` | Live trending anime simulcasts from TMDB |
| `/api/tmdb/movies` | `GET` | `limit=15` | Live blockbuster movies from TMDB |
| `/api/tmdb/series` | `GET` | `limit=15` | Live binge-worthy TV series from TMDB |
| `/api/tmdb/title/<type>/<id>` | `GET` | — | Full details, YouTube trailer, and X-Ray cast from TMDB |
| `/api/tmdb/search` | `GET` | `q=<query>`, `limit=10` | Live multi-search across millions of global titles on TMDB |

---

## 🎨 Design System & Aesthetics

- **Matte Obsidian Palette**:
  - Carbon Background: `#0a0d14`
  - Structured Card Surfaces: `#121722`, `#161d2b`
  - Crisp Structural Borders: `#222b3d`
- **Zero Glassmorphic Blur**: Pure solid matte surfaces—no frosted glass, liquid distortion mesh, or neon-green accents.
- **Punchy Accents**:
  - Crimson Red (`#e50914`): Top 10 badges, live tags, Simulcast badges.
  - Electric Prime Cyan (`#00a8e1`): Focus rings, progress meters, audio accents.
- **Typography**: Clean Google Font **Inter** (400 to 900) for maximum legibility across mobile to 4K displays.
- **Clean Homepage**: Front-page audio tracker/language banners omitted; audio selection is placed natively inside the theater player HUD.

---

## 🌟 Signature Features Combined

### 1. Netflix Signature
- **Cinematic Hero Billboard**: Dynamic 99% match tag, U/A 16+ age certification, studio tags, 4K Ultra HD & Dolby Atmos badges.
- **Spotlight Carousel Switcher**: Auto-advancing marquee (7s timer) with thumbnail rack, progress indicators, and manual controls.
- **Top 10 Today Row**: Giant bold outline typography numbers (`-webkit-text-stroke: 4px`) layered behind rank cards with electric cyan hover transitions.

### 2. Amazon Prime Video Signature
- **Studio & Network Hub Chips**: Crunchyroll, MAPPA Vault, HBO Max, Paramount+, Ufotable, and Hotstar Hub chips with instant rail filtering.
- **In-Stream X-Ray Drawer**:
  - **Cast in Scene**: Headshots with character roles and actor details.
  - **Music in Scene**: Currently playing soundtrack with instant "Save to MOVAni Music Library" toggle.
  - **Verified Production Trivia**: Curated behind-the-scenes facts and trivia.
  - **Legal Streaming Discovery**: Direct links and badges for legal providers (Crunchyroll, Prime Video, Netflix, Disney+ Hotstar, JioCinema).

### 3. JioHotstar Signature
- **Dense Horizontal Carousels**:
  - **Continue Watching for Alex**: Real-time progress bars, episode tags (`S1:E8`, `Feature Film`), resume buttons, and remove actions backed by SQLite & `localStorage`.
  - **Anime Simulcasts**: Weekly broadcast tags and studio markers.
  - **Blockbuster Movies & Binge-Worthy Web Series Rails**: Smooth scroll buttons and gesture scrolling.
- **In-Player Multi-Language Audio Switcher**: Seamlessly cycle between Japanese 5.1, English 5.1, Hindi Dolby Audio, Tamil, and Telugu with on-screen HUD confirmation.

---

## ⚡ Core Interactive Functionality

- **Live Search Engine**: Dynamically filters across titles, genres, studios, overviews, and actor names in real time with an instant suggestion dropdown.
- **Watchlist Drawer**: Real-time Add, Remove, Clear All, and live navbar badge count synchronization backed by SQLite.
- **Dual-Mode Theater Modal Player**:
  - **Direct Trailer Mode**: Streams official 4K/HD trailers via YouTube embed.
  - **Cinema HUD Mode**: Timeline scrubber, play/pause, ±10s skip, speed adjustment (`0.75x` to `2.0x`), audio track selector, and volume control.
- **Mobile Bottom Navigation Bar**: Smartphone-optimized bottom navigation with instant category jumping.
- **Toast Notification System**: High-contrast, animated toast alerts for watchlist actions, audio changes, and saved music.

---

## ⌨️ Global Keyboard Shortcuts

| Shortcut | Action |
|:---|:---|
| `/` or `Ctrl + K` | Focus and select search bar |
| `Space` | Play / Pause video in theater modal |
| `←` / `→` | Skip backward / forward 10 seconds |
| `M` | Toggle audio mute / unmute |
| `F` | Toggle fullscreen mode |
| `X` | Toggle in-stream X-Ray intelligence drawer |
| `Esc` | Close any open modal, drawer, or search dropdown |

---

## 💻 Tech Stack

- **Backend**: Python 3.10+, Flask 3.1+, SQLite3 (Standard Library)
- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript (ES6+), Phosphor Icons, Google Fonts Inter
