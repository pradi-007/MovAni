/**
 * MOVAni API Client
 * Connects frontend to the Python Flask REST API endpoints with graceful offline fallback.
 */

const API = {
  isAvailable: window.location.protocol.startsWith('http'),

  getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('movani_token') : null;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['X-Session-Token'] = token;
    }
    return headers;
  },

  async authFetch(url, options = {}) {
    if (!this.isAvailable) return null;
    const authHeaders = this.getAuthHeaders();
    const finalOptions = {
      ...options,
      credentials: 'include',
      headers: {
        ...authHeaders,
        ...(options.headers || {})
      }
    };
    try {
      const res = await fetch(url, finalOptions);
      if (res && res.status === 401) {
        try {
          const clone = res.clone();
          const data = await clone.json();
          if (data && data.code === 'SESSION_REPLACED') {
            if (window.Auth && typeof Auth.handleSessionReplaced === 'function') {
              Auth.handleSessionReplaced(data.error || 'Your account was signed in on another device.');
            }
          }
        } catch (_) {}
      }
      return res;
    } catch {
      return null;
    }
  },

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
      const res = await this.authFetch('/api/watchlist');
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async toggleWatchlist(titleId) {
    if (!this.isAvailable) return null;
    try {
      const res = await this.authFetch('/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({ id: titleId })
      });
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async clearWatchlist() {
    if (!this.isAvailable) return null;
    try {
      const res = await this.authFetch('/api/watchlist', { method: 'DELETE' });
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getContinueWatching() {
    if (!this.isAvailable) return null;
    try {
      const res = await this.authFetch('/api/continue-watching');
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async saveContinueWatching(titleId, progress, ep, currentSeconds = 0, totalSeconds = 0) {
    if (!this.isAvailable) return null;
    try {
      const res = await this.authFetch('/api/continue-watching', {
        method: 'POST',
        body: JSON.stringify({
          id: titleId,
          progress: progress,
          ep: ep,
          current_seconds: currentSeconds,
          total_seconds: totalSeconds
        })
      });
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async removeContinueWatching(titleId) {
    if (!this.isAvailable) return null;
    try {
      const res = await this.authFetch(`/api/continue-watching/${encodeURIComponent(titleId)}`, { method: 'DELETE' });
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async clearContinueWatching() {
    if (!this.isAvailable) return null;
    try {
      const res = await this.authFetch('/api/continue-watching/clear', { method: 'POST' });
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async saveMusic(title, artist, titleId) {
    if (!this.isAvailable) return null;
    try {
      const res = await this.authFetch('/api/music', {
        method: 'POST',
        body: JSON.stringify({ title, artist, title_id: titleId })
      });
      return res && res.ok ? await res.json() : null;
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
      const res = await this.fetchWithTimeout('/api/tmdb/rows', {}, 16000);
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

  // ================= WORLDWIDE PAGINATED DISCOVERY & WATCH PROVIDERS =================
  async getTitle(titleId) {
    if (!this.isAvailable) return null;
    try {
      const res = await this.fetchWithTimeout(`/api/catalog/${encodeURIComponent(titleId)}`, {}, 6000);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async discoverMovies(page = 1, sortBy = 'popularity.desc', lang = '', genres = '', year = '') {
    if (!this.isAvailable) return null;
    try {
      const p = new URLSearchParams({ page, sort_by: sortBy });
      if (lang) p.append('lang', lang);
      if (genres) p.append('genres', genres);
      if (year) p.append('year', year);
      const res = await this.fetchWithTimeout(`/api/discover/movies?${p.toString()}`, {}, 7000);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async discoverTv(page = 1, sortBy = 'popularity.desc', lang = '', genres = '', year = '') {
    if (!this.isAvailable) return null;
    try {
      const p = new URLSearchParams({ page, sort_by: sortBy });
      if (lang) p.append('lang', lang);
      if (genres) p.append('genres', genres);
      if (year) p.append('year', year);
      const res = await this.fetchWithTimeout(`/api/discover/tv?${p.toString()}`, {}, 7000);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async discoverAnime(page = 1, sortBy = 'popularity.desc') {
    if (!this.isAvailable) return null;
    try {
      const p = new URLSearchParams({ page, sort_by: sortBy });
      const res = await this.fetchWithTimeout(`/api/discover/anime?${p.toString()}`, {}, 7000);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async discoverKannada(page = 1, limit = 20) {
    if (!this.isAvailable) return null;
    try {
      const p = new URLSearchParams({ page, limit });
      const res = await this.fetchWithTimeout(`/api/kannada?${p.toString()}`, {}, 8000);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getKannada(page = 1, limit = 20) {
    return this.discoverKannada(page, limit);
  },

  async getWatchProviders(mediaType = 'movie', tmdbId = 0, region = 'IN') {
    if (!this.isAvailable || !tmdbId) return null;
    try {
      const res = await this.fetchWithTimeout(`/api/watch-providers/${mediaType}/${tmdbId}?region=${region}`, {}, 5000);
      return res && res.ok ? await res.json() : null;
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
  },

  // ================= MOVANI STREAMING ENGINE & OPEN MEDIA LIBRARY =================
  async getStreamingSources(titleId) {
    if (!this.isAvailable || !titleId) return null;
    try {
      const res = await this.fetchWithTimeout(`/api/streaming/title/${encodeURIComponent(titleId)}/sources`, {}, 4000);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async resolveStream(titleId, slotNumber = 1, season = 1, episode = 1) {
    if (!this.isAvailable || !titleId) return null;
    try {
      const res = await this.authFetch(`/api/streaming/title/${encodeURIComponent(titleId)}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ slot_number: slotNumber, season, episode })
      });
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getStreamingSourcesHealth() {
    if (!this.isAvailable) return null;
    try {
      const res = await this.fetchWithTimeout('/api/streaming/health/all', {}, 4000);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getOpenLibraryCatalog(params = {}) {
    if (!this.isAvailable) return null;
    try {
      const query = new URLSearchParams(params).toString();
      const res = await this.fetchWithTimeout(`/api/open-library/catalog?${query}`, {}, 5000);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getOpenLibraryStats() {
    if (!this.isAvailable) return null;
    try {
      const res = await this.fetchWithTimeout('/api/open-library/stats', {}, 4000);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getOpenLibraryItem(id) {
    if (!this.isAvailable || !id) return null;
    try {
      const res = await this.fetchWithTimeout(`/api/open-library/item/${encodeURIComponent(id)}`, {}, 4000);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getOpenLibrarySources(id) {
    if (!this.isAvailable || !id) return null;
    try {
      const res = await this.fetchWithTimeout(`/api/open-library/${encodeURIComponent(id)}/sources`, {}, 4000);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async verifyOpenLibraryItem(id) {
    if (!this.isAvailable || !id) return null;
    try {
      const res = await this.authFetch(`/api/open-library/${encodeURIComponent(id)}/verify`, {
        method: 'POST'
      });
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  // ================= KARTTONS ANIME CATALOGUE INTEGRATION =================
  async getAnimeCatalog(params = {}) {
    if (!this.isAvailable) return null;
    try {
      const query = new URLSearchParams(params).toString();
      const res = await this.fetchWithTimeout(`/api/anime/catalog?${query}`, {}, 5000);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async searchAnime(query = '', filters = {}) {
    if (!this.isAvailable) return null;
    try {
      const qParams = new URLSearchParams({ q: query, ...filters }).toString();
      const res = await this.fetchWithTimeout(`/api/anime/search?${qParams}`, {}, 5000);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getAnimeGenres() {
    if (!this.isAvailable) return null;
    try {
      const res = await this.fetchWithTimeout('/api/anime/genres', {}, 4000);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getAnimeDetails(id) {
    if (!this.isAvailable || !id) return null;
    try {
      const res = await this.fetchWithTimeout(`/api/anime/${encodeURIComponent(id)}`, {}, 4000);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getAnimeEpisodes(id, season = 1) {
    if (!this.isAvailable || !id) return null;
    try {
      const res = await this.fetchWithTimeout(`/api/anime/${encodeURIComponent(id)}/episodes?season=${season}`, {}, 4000);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getAnimeSources(id, season = 1, episode = 1) {
    if (!this.isAvailable || !id) return null;
    try {
      const res = await this.fetchWithTimeout(`/api/anime/${encodeURIComponent(id)}/sources?season=${season}&episode=${episode}`, {}, 4000);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async syncAnimeCatalog() {
    if (!this.isAvailable) return null;
    try {
      const res = await this.authFetch('/api/anime/sync', { method: 'POST' });
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  // ================= ALLMOVIESHUB MOVIE CATALOGUE & MULTI-AUDIO INTEGRATION =================
  async getMoviesCatalog(params = {}) {
    if (!this.isAvailable) return null;
    try {
      const query = new URLSearchParams(params).toString();
      const res = await this.fetchWithTimeout(`/api/movies/catalog?${query}`, {}, 5000);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async searchMovies(query = '', filters = {}) {
    if (!this.isAvailable) return null;
    try {
      const qParams = new URLSearchParams({ q: query, ...filters }).toString();
      const res = await this.fetchWithTimeout(`/api/movies/search?${qParams}`, {}, 5000);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getMovieCategories() {
    if (!this.isAvailable) return null;
    try {
      const res = await this.fetchWithTimeout('/api/movies/categories', {}, 4000);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getMovieDetails(id) {
    if (!this.isAvailable || !id) return null;
    try {
      const res = await this.fetchWithTimeout(`/api/movies/${encodeURIComponent(id)}`, {}, 4000);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async getMovieSources(id) {
    if (!this.isAvailable || !id) return null;
    try {
      const res = await this.fetchWithTimeout(`/api/movies/${encodeURIComponent(id)}/sources`, {}, 4000);
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async verifyMovieSource(id) {
    if (!this.isAvailable || !id) return null;
    try {
      const res = await this.authFetch(`/api/movies/${encodeURIComponent(id)}/verify`, { method: 'POST' });
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  async syncMoviesCatalog() {
    if (!this.isAvailable) return null;
    try {
      const res = await this.authFetch('/api/movies/sync', { method: 'POST' });
      return res && res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  }
};




