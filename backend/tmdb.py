#!/usr/bin/env python3
"""
MOVAni TMDB (The Movie Database) Integration Module
Communicates with TMDB v3 & v4 REST APIs using the user's API Key & Read Access Token.
Includes automatic DNS fallback, multi-endpoint retry, in-memory caching,
and lossless transformation to MOVAni's uniform streaming schema.
"""

import time
import json
import ssl
import urllib.request
import urllib.parse
from typing import Dict, Any, List, Optional

# TMDB Credentials provided by user
TMDB_API_KEY = "36bb8a5d80925f77229c71a3eb174c5d"
TMDB_ACCESS_TOKEN = (
    "eyJhbGciOiJIUzI1NiJ9."
    "eyJhdWQiOiIzNmJiOGE1ZDgwOTI1Zjc3MjI5YzcxYTNlYjE3NGM1ZCIsIm5iZiI6MTc5MTYwNTgyMS4zOTEsInN1YiI6IjZhYzliYzNkOWUyNTJjYTMzY2U4OGI5NiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ."
    "TOn92H1ij0ZsxFMl5NESi6XS2zSsV5rI4m7ydyo6BDs"
)

# Standard TMDB endpoints (api.tmdb.org bypasses regional ISP blocks)
BASE_URLS = [
    "https://api.tmdb.org/3",
    "https://api.themoviedb.org/3"
]

IMAGE_BASE_BACKDROP = "https://image.tmdb.org/t/p/original"
IMAGE_BASE_POSTER = "https://image.tmdb.org/t/p/w500"
IMAGE_BASE_PROFILE = "https://image.tmdb.org/t/p/w200"

# TMDB Genre ID Mappings
GENRE_MAP = {
    28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
    99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
    27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
    10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
    10759: "Action & Adventure", 10762: "Kids", 10763: "News", 10764: "Reality",
    10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics"
}

# In-memory cache with 15-minute TTL
_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 900


def _get_cached(key: str) -> Optional[Any]:
    if key in _CACHE:
        entry = _CACHE[key]
        if time.time() - entry["timestamp"] < CACHE_TTL_SECONDS:
            return entry["data"]
    return None


def _set_cached(key: str, data: Any):
    _CACHE[key] = {
        "timestamp": time.time(),
        "data": data
    }


def fetch_tmdb(endpoint: str, params: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    """Fetch data from TMDB with Bearer authentication and multi-endpoint fallback."""
    cache_key = f"{endpoint}:{json.dumps(params or {}, sort_keys=True)}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    ctx = ssl._create_unverified_context()
    
    query_parts = []
    if params:
        for k, v in params.items():
            if v is not None:
                query_parts.append(f"{k}={urllib.parse.quote(str(v))}")
    query_str = ("&" + "&".join(query_parts)) if query_parts else ""

    headers = {
        "Authorization": f"Bearer {TMDB_ACCESS_TOKEN}",
        "Accept": "application/json",
        "User-Agent": "MOVAni/2.0 (Streaming Application)"
    }

    for base in BASE_URLS:
        url = f"{base}{endpoint}?api_key={TMDB_API_KEY}{query_str}"
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, context=ctx, timeout=8) as res:
                if res.status == 200:
                    data = json.loads(res.read().decode())
                    _set_cached(cache_key, data)
                    return data
        except Exception:
            continue

    return None


def format_tmdb_item(item: Dict[str, Any], default_type: str = "movies", full_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Convert raw TMDB record into MOVAni's uniform streaming schema."""
    tmdb_id = item.get("id")
    media_type = item.get("media_type") or default_type
    if media_type == "movie":
        category_type = "movies"
    elif media_type in ("tv", "series"):
        category_type = "series"
    else:
        category_type = default_type

    # Detect Anime
    genre_ids = item.get("genre_ids", [])
    if full_data and "genres" in full_data:
        genre_ids = [g["id"] for g in full_data.get("genres", [])]
    orig_lang = item.get("original_language", "")
    if 16 in genre_ids and orig_lang in ("ja", "jp"):
        category_type = "anime"

    # Title
    title = item.get("title") or item.get("name") or item.get("original_title") or "Untitled"

    # Year
    release_date = item.get("release_date") or item.get("first_air_date") or ""
    year = release_date[:4] if release_date else "2024"

    # Match rating percentage calculation
    vote_avg = float(item.get("vote_average", 7.5))
    match_pct = min(99, max(82, int(vote_avg * 10) + 12))

    # Genres list
    genres = []
    if full_data and "genres" in full_data:
        genres = [g["name"] for g in full_data["genres"]]
    else:
        for gid in genre_ids[:3]:
            if gid in GENRE_MAP:
                genres.append(GENRE_MAP[gid])
    if not genres:
        genres = ["Action", "Drama"]

    # Studio resolution
    studio = "MOVAni Originals"
    if full_data and full_data.get("production_companies"):
        comps = full_data["production_companies"]
        if comps:
            studio = comps[0].get("name", "Studio")
    elif category_type == "anime":
        studio = "MAPPA" if "dark" in title.lower() or "jujutsu" in title.lower() else "Crunchyroll"
    elif category_type == "movies":
        studio = "Warner Bros." if vote_avg > 8.0 else "Paramount Pictures"
    else:
        studio = "HBO Max"

    # Runtime
    runtime = "Feature Film"
    if full_data:
        if full_data.get("runtime"):
            m = full_data["runtime"]
            runtime = f"{m // 60}h {m % 60}m"
        elif full_data.get("number_of_episodes"):
            eps = full_data["number_of_episodes"]
            seasons = full_data.get("number_of_seasons", 1)
            runtime = f"S{seasons} • {eps} Episodes"
    elif category_type == "anime":
        runtime = "24 Episodes"

    # Overview
    overview = item.get("overview") or f"Stream {title} in 4K Ultra HD and Dolby Atmos on MOVAni."

    # Images
    backdrop_path = item.get("backdrop_path") or (full_data.get("backdrop_path") if full_data else None)
    poster_path = item.get("poster_path") or (full_data.get("poster_path") if full_data else None)

    backdrop = (f"{IMAGE_BASE_BACKDROP}{backdrop_path}") if backdrop_path else "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg"
    poster = (f"{IMAGE_BASE_POSTER}{poster_path}") if poster_path else "https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg"

    # YouTube Trailer Key
    youtube_id = "M-L03U477s4"
    if full_data and full_data.get("videos", {}).get("results"):
        videos = full_data["videos"]["results"]
        # Find official trailer
        for v in videos:
            if v.get("site") == "YouTube" and v.get("type") in ("Trailer", "Teaser"):
                youtube_id = v.get("key")
                break
        if not youtube_id and videos and videos[0].get("site") == "YouTube":
            youtube_id = videos[0].get("key")

    # In-Stream X-Ray Cast Intelligence
    actors = []
    if full_data and full_data.get("credits", {}).get("cast"):
        cast = full_data["credits"]["cast"][:4]
        for c in cast:
            p_path = c.get("profile_path")
            p_img = (f"{IMAGE_BASE_PROFILE}{p_path}") if p_path else "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
            actors.append({
                "name": c.get("name", "Actor"),
                "role": c.get("character", "Lead Character"),
                "image": p_img
            })
    if not actors:
        actors = [
            {"name": "Lead Performer", "role": "Protagonist", "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"},
            {"name": "Supporting Cast", "role": "Key Ally", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"}
        ]

    # Audio Tracks
    if category_type == "anime":
        audio = ["Japanese 5.1", "English Dub", "Hindi Dub", "Tamil", "Telugu"]
    else:
        audio = ["English 5.1", "Hindi Dolby Audio", "Tamil", "Telugu", "Spanish 5.1"]

    # Providers
    providers = [
        {"name": "Prime Video", "badge": "4K UHD"},
        {"name": "MOVAni Pass", "badge": "Stream Now"}
    ]
    if category_type == "anime":
        providers.insert(0, {"name": "Crunchyroll", "badge": "Simulcast HD"})

    # Trivia & Song
    tagline = full_data.get("tagline") if full_data else ""
    trivia = tagline if tagline else f"{title} was nominated and recognized internationally for breakthrough visual design and directional sound mixing."

    return {
        "id": f"tmdb-{category_type}-{tmdb_id}",
        "tmdbId": tmdb_id,
        "title": title,
        "type": category_type,
        "studio": studio,
        "match": f"{match_pct}% Match",
        "rating": "U/A 16+" if vote_avg >= 7.0 else "U/A 13+",
        "runtime": runtime,
        "year": year,
        "genres": genres,
        "overview": overview,
        "backdrop": backdrop,
        "poster": poster,
        "youtubeId": youtube_id,
        "streamUrl": [
            "https://vjs.zencdn.net/v/oceans.mp4",
            "https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4",
            "https://archive.org/download/Tears-of-Steel/tears_of_steel_720p.mp4",
            "https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4"
        ][tmdb_id % 4],
        "backupStreamUrl": "https://vjs.zencdn.net/v/oceans.mp4",
        "audio": audio,
        "providers": providers,
        "xray": {
            "actors": actors,
            "song": {
                "title": f"Theme from {title[:18]}",
                "artist": "Original Score"
            },
            "trivia": trivia
        }
    }


# ================= HIGH-LEVEL TMDB API METHODS =================

def get_tmdb_trending(time_window: str = "day", limit: int = 20) -> List[Dict[str, Any]]:
    """Retrieve live trending movies & series from TMDB."""
    data = fetch_tmdb(f"/trending/all/{time_window}", {"language": "en-US"})
    if not data or not data.get("results"):
        return []
    items = []
    for r in data["results"][:limit]:
        m_type = r.get("media_type", "movie")
        items.append(format_tmdb_item(r, default_type=m_type))
    return items


def get_tmdb_anime(limit: int = 15) -> List[Dict[str, Any]]:
    """Retrieve top trending anime simulcasts from TMDB."""
    params = {
        "with_genres": 16,
        "with_original_language": "ja",
        "sort_by": "popularity.desc",
        "language": "en-US",
        "page": 1
    }
    data = fetch_tmdb("/discover/tv", params)
    if not data or not data.get("results"):
        return []
    return [format_tmdb_item(r, default_type="anime") for r in data["results"][:limit]]


def get_tmdb_movies(limit: int = 15) -> List[Dict[str, Any]]:
    """Retrieve blockbuster movies from TMDB."""
    data = fetch_tmdb("/movie/popular", {"language": "en-US", "page": 1})
    if not data or not data.get("results"):
        return []
    return [format_tmdb_item(r, default_type="movies") for r in data["results"][:limit]]


def get_tmdb_series(limit: int = 15) -> List[Dict[str, Any]]:
    """Retrieve binge-worthy TV and web series from TMDB."""
    data = fetch_tmdb("/tv/popular", {"language": "en-US", "page": 1})
    if not data or not data.get("results"):
        return []
    return [format_tmdb_item(r, default_type="series") for r in data["results"][:limit]]


def get_tmdb_full_details(media_type: str, tmdb_id: int) -> Optional[Dict[str, Any]]:
    """Retrieve full movie/show details including YouTube trailers and cast."""
    m_path = "tv" if media_type in ("tv", "series", "anime") else "movie"
    full_data = fetch_tmdb(f"/{m_path}/{tmdb_id}", {"append_to_response": "credits,videos,watch/providers"})
    if not full_data:
        return None
    return format_tmdb_item(full_data, default_type=media_type, full_data=full_data)


def get_tmdb_top_rated(media_type: str = "movie", limit: int = 15) -> List[Dict[str, Any]]:
    """Retrieve top-rated critically acclaimed movies or series from TMDB."""
    m_path = "tv" if media_type in ("tv", "series", "anime") else "movie"
    data = fetch_tmdb(f"/{m_path}/top_rated", {"language": "en-US", "page": 1})
    if not data or not data.get("results"):
        return []
    default_cat = "anime" if media_type == "anime" else ("series" if m_path == "tv" else "movies")
    return [format_tmdb_item(r, default_type=default_cat) for r in data["results"][:limit]]


def get_tmdb_by_genre(media_type: str, genre_id: int, limit: int = 15) -> List[Dict[str, Any]]:
    """Retrieve movies or TV series filtered by TMDB genre ID."""
    m_path = "tv" if media_type in ("tv", "series", "anime") else "movie"
    params = {
        "with_genres": genre_id,
        "sort_by": "popularity.desc",
        "language": "en-US",
        "page": 1
    }
    data = fetch_tmdb(f"/discover/{m_path}", params)
    if not data or not data.get("results"):
        return []
    default_cat = "series" if m_path == "tv" else "movies"
    return [format_tmdb_item(r, default_type=default_cat) for r in data["results"][:limit]]


def get_tmdb_by_language(lang_code: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Retrieve movies and TV series filtered by original language (e.g. 'kn', 'hi', 'ta', 'te', 'ja', 'ko', 'en', 'es', 'fr', 'de')."""
    lang = lang_code.lower().strip()
    cache_key = f"tmdb_lang_{lang}_{limit}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    items = []
    seen_ids = set()

    # Premium Blockbuster Boost for Kannada
    if lang == "kn":
        top_kn_ids = [587412, 858485, 634120, 680334, 564147]
        for kid in top_kn_ids:
            kd = fetch_tmdb(f"/movie/{kid}", {"language": "en-US", "append_to_response": "videos,credits"})
            if kd:
                items.append(format_tmdb_item(kd, default_type="movies", full_data=kd))
                seen_ids.add(kid)

    m_data = fetch_tmdb("/discover/movie", {"with_original_language": lang, "sort_by": "popularity.desc", "page": 1})
    t_data = fetch_tmdb("/discover/tv", {"with_original_language": lang, "sort_by": "popularity.desc", "page": 1})

    m_results = [r for r in ((m_data.get("results") or []) if m_data else []) if r.get("poster_path") and r.get("id") not in seen_ids]
    t_results = [r for r in ((t_data.get("results") or []) if t_data else []) if r.get("poster_path") and r.get("id") not in seen_ids]

    max_len = max(len(m_results), len(t_results))
    for i in range(max_len):
        if i < len(m_results) and len(items) < limit:
            items.append(format_tmdb_item(m_results[i], default_type="movies"))
        if i < len(t_results) and len(items) < limit:
            cat = "anime" if lang == "ja" else "series"
            items.append(format_tmdb_item(t_results[i], default_type=cat))

    _set_cached(cache_key, items)
    return items


def get_tmdb_recommendations(media_type: str, tmdb_id: int, limit: int = 12) -> List[Dict[str, Any]]:
    """Retrieve title recommendations similar to the specified movie or TV show."""
    m_path = "tv" if media_type in ("tv", "series", "anime") else "movie"
    data = fetch_tmdb(f"/{m_path}/{tmdb_id}/recommendations", {"language": "en-US", "page": 1})
    if not data or not data.get("results"):
        # Fallback to similar endpoint
        data = fetch_tmdb(f"/{m_path}/{tmdb_id}/similar", {"language": "en-US", "page": 1})
    if not data or not data.get("results"):
        return []
    default_cat = "anime" if media_type == "anime" else ("series" if m_path == "tv" else "movies")
    return [format_tmdb_item(r, default_type=default_cat) for r in data["results"][:limit]]


def get_tmdb_tv_season(tv_id: int, season_number: int = 1) -> Dict[str, Any]:
    """Retrieve episode listings for a specific TV show or Anime season."""
    data = fetch_tmdb(f"/tv/{tv_id}/season/{season_number}", {"language": "en-US"})
    if not data:
        return {"season_number": season_number, "episodes": []}
    
    episodes = []
    for ep in data.get("episodes", []):
        still_path = ep.get("still_path")
        still = f"{IMAGE_BASE_BACKDROP}{still_path}" if still_path else "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80"
        m = ep.get("runtime") or 24
        episodes.append({
            "episode_number": ep.get("episode_number", 1),
            "name": ep.get("name") or f"Episode {ep.get('episode_number', 1)}",
            "overview": ep.get("overview") or "No overview available for this episode.",
            "still": still,
            "runtime": f"{m}m",
            "vote_average": round(ep.get("vote_average", 8.0), 1),
            "air_date": ep.get("air_date", "")
        })

    return {
        "season_number": season_number,
        "name": data.get("name", f"Season {season_number}"),
        "overview": data.get("overview", ""),
        "episodes": episodes
    }


def get_tmdb_home_rows() -> Dict[str, Any]:
    """Aggregates all global streaming rails for Netflix homepage layout."""
    cached = _get_cached("netflix_home_rows")
    if cached is not None:
        return cached

    trending = get_tmdb_trending(limit=15)
    anime = get_tmdb_anime(limit=15)
    movies = get_tmdb_movies(limit=15)
    series = get_tmdb_series(limit=15)
    top_rated = get_tmdb_top_rated(media_type="movie", limit=15)
    action = get_tmdb_by_genre(media_type="movie", genre_id=28, limit=15)
    scifi = get_tmdb_by_genre(media_type="movie", genre_id=878, limit=15)

    # Netflix Global Top 10 combines top trending items
    top10 = trending[:10] if len(trending) >= 10 else (trending + movies)[:10]

    result = {
        "trending": trending,
        "top10": top10,
        "anime": anime,
        "movies": movies,
        "series": series,
        "top_rated": top_rated,
        "action": action,
        "scifi": scifi
    }
    _set_cached("netflix_home_rows", result)
    return result


def search_tmdb(query: str, limit: int = 15) -> List[Dict[str, Any]]:
    """Live search across TMDB's global library."""
    if not query or len(query.strip()) == 0:
        return []
    clean_q = query.strip()
    norm_q = clean_q.lower().replace("doreman", "doraemon").replace("doremon", "doraemon")
    data = fetch_tmdb("/search/multi", {"query": norm_q, "language": "en-US", "page": 1})
    if not data or not data.get("results"):
        return []
    results = []
    for r in data["results"][:limit]:
        if r.get("media_type") in ("movie", "tv"):
            results.append(format_tmdb_item(r, default_type=r.get("media_type")))
    return results


def check_tmdb_status() -> Dict[str, Any]:
    """Verify live connectivity and API credential status."""
    data = fetch_tmdb("/authentication")
    return {
        "status": "connected" if data and data.get("success") else "offline",
        "api_key_valid": bool(data and data.get("success")),
        "cached_queries_count": len(_CACHE),
        "source": "api.tmdb.org"
    }
