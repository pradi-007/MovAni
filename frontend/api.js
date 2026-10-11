/**
 * MOVAni API Client
 * Connects frontend to the Python Flask REST API endpoints with graceful offline fallback.
 */

const API = {
  isAvailable: window.location.protocol.startsWith('http'),

  async fetchWithTimeout(url, options = {}, timeoutMs = 3500) {
    if (!this.isAvailable) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch {
      clearTimeout(timer);
      return null;
    }
  },

  async getCatalog(category = '', studio = '', lang = '', dub = '', sub = '') {
    if (!this.isAvailable) return null;
    try {
      const params = new URLSearchParams();
      if (category && category !== 'all') params.append('category', category);
      if (studio) params.append('studio', studio);
      if (lang) params.append('lang', lang);
      if (dub) params.append('dub', dub);
      if (sub) params.append('sub', sub);
      const res = await this.fetchWithTimeout(`/api/catalog?${params.toString()}`);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getTop10() {
    if (!this.isAvailable) return null;
    try {
      const res = await fetch('/api/top10');
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getStudios() {
    if (!this.isAvailable) return null;
    try {
      const res = await fetch('/api/studios');
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getWatchlist() {
    if (!this.isAvailable) return null;
    try {
      const res = await fetch('/api/watchlist');
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async toggleWatchlist(titleId) {
    if (!this.isAvailable) return null;
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: titleId })
      });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async clearWatchlist() {
    if (!this.isAvailable) return null;
    try {
      const res = await fetch('/api/watchlist', { method: 'DELETE' });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getContinueWatching() {
    if (!this.isAvailable) return null;
    try {
      const res = await fetch('/api/continue-watching');
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async saveContinueWatching(titleId, progress, ep, currentSeconds = 0, totalSeconds = 0) {
    if (!this.isAvailable) return null;
    try {
      const res = await fetch('/api/continue-watching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: titleId,
          progress: progress,
          ep: ep,
          current_seconds: currentSeconds,
          total_seconds: totalSeconds
        })
      });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async removeContinueWatching(titleId) {
    if (!this.isAvailable) return null;
    try {
      const res = await fetch(`/api/continue-watching/${titleId}`, { method: 'DELETE' });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async clearContinueWatching() {
    if (!this.isAvailable) return null;
    try {
      const res = await fetch('/api/continue-watching/clear', { method: 'POST' });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async saveMusic(title, artist, titleId) {
    if (!this.isAvailable) return null;
    try {
      const res = await fetch('/api/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, artist, title_id: titleId })
      });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async search(query) {
    if (!this.isAvailable) return null;
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  // ================= TMDB LIVE API METHODS =================
  async getTmdbStatus() {
    if (!this.isAvailable) return null;
    try {
      const res = await this.fetchWithTimeout('/api/tmdb/status', {}, 2500);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getTmdbTrending(limit = 20) {
    if (!this.isAvailable) return null;
    try {
      const res = await this.fetchWithTimeout(`/api/tmdb/trending?limit=${limit}`);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getTmdbAnime(limit = 15) {
    if (!this.isAvailable) return null;
    try {
      const res = await this.fetchWithTimeout(`/api/tmdb/anime?limit=${limit}`);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getTmdbMovies(limit = 15) {
    if (!this.isAvailable) return null;
    try {
      const res = await this.fetchWithTimeout(`/api/tmdb/movies?limit=${limit}`);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getTmdbSeries(limit = 15) {
    if (!this.isAvailable) return null;
    try {
      const res = await this.fetchWithTimeout(`/api/tmdb/series?limit=${limit}`);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getTmdbTitle(mediaType, tmdbId) {
    if (!this.isAvailable) return null;
    try {
      const res = await this.fetchWithTimeout(`/api/tmdb/title/${mediaType}/${tmdbId}`);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getTmdbRows() {
    if (!this.isAvailable) return null;
    try {
      const res = await this.fetchWithTimeout('/api/tmdb/rows', {}, 4000);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getTmdbTvSeason(tvId, seasonNumber = 1) {
    if (!this.isAvailable) return null;
    try {
      const res = await fetch(`/api/tmdb/tv/${tvId}/season/${seasonNumber}`);
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getTmdbRecommendations(mediaType, tmdbId, limit = 12) {
    if (!this.isAvailable) return null;
    try {
      const res = await fetch(`/api/tmdb/recommendations/${mediaType}/${tmdbId}?limit=${limit}`);
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getTmdbTopRated(type = 'movie', limit = 15) {
    if (!this.isAvailable) return null;
    try {
      const res = await fetch(`/api/tmdb/top-rated?type=${type}&limit=${limit}`);
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getTmdbByLanguage(langCode, limit = 20) {
    if (!this.isAvailable) return null;
    try {
      const res = await fetch(`/api/tmdb/language/${encodeURIComponent(langCode)}?limit=${limit}`);
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async searchTmdb(query, limit = 15) {
    if (!this.isAvailable) return null;
    try {
      const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  // ================= UNIVERSAL MASTER OTT API METHODS =================
  async getOttSession(userEmail = 'viewer@movani.io') {
    if (!this.isAvailable) return null;
    try {
      const res = await fetch(`/api/ott/session?user_id=${encodeURIComponent(userEmail)}`);
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getOttPlayback(contentId, season = 1, episode = 1, audio = 'en') {
    if (!this.isAvailable) return null;
    try {
      const res = await fetch(`/api/ott/playback/${contentId}?season=${season}&episode=${episode}&audio=${audio}`);
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getOttStatus() {
    if (!this.isAvailable) return null;
    try {
      const res = await fetch('/api/ott/status');
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  }
};

