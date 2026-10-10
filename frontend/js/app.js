/**
 * MOVAni Master Application Controller
 * Bootstraps frontend, synchronizes state with Python REST API & TMDB,
 * and manages global keyboard navigation, category filtering, and modals.
 */

const App = {
  async init() {
    // Ensure all catalog items have guaranteed direct fallback stream URLs
    State.catalog.forEach(item => {
      if (!item.streamUrl) {
        item.streamUrl = "https://vjs.zencdn.net/v/oceans.mp4";
      }
      if (!item.backupStreamUrl) {
        item.backupStreamUrl = "https://archive.org/download/Tears-of-Steel/tears_of_steel_720p.mp4";
      }
    });

    // 1. Initial UI render from baseline state
    UI.renderHero();
    UI.renderTop10();
    UI.renderCategoryTrays();
    UI.renderContinueWatching();
    UI.updateWatchlistBadge();
    this.startHeroAutoAdvance();

    // 2. Global event listeners & Anti-Popup Ad Shield
    const origWindowOpen = window.open;
    window.open = function(url, target, features) {
      if (!url) return null;
      if (url.startsWith('/') || url.startsWith(window.location.origin) || url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
        return origWindowOpen.call(window, url, target, features);
      }
      console.warn('[MOVAni Shield] Blocked third-party ad popup/redirect:', url);
      return null;
    };

    window.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#searchInput') && !e.target.closest('#searchDropdown')) {
        Search.hideDropdown();
      }
    });

    // 3. Synchronize with Python backend & live TMDB
    await this.syncWithBackend();
  },

  async syncWithBackend() {
    if (!API.isAvailable) return;
    try {
      // Parallel fetch for user state and TMDB global rails
      const [wlData, cwData, tmdbStatus, homeRows] = await Promise.all([
        API.getWatchlist(),
        API.getContinueWatching(),
        API.getTmdbStatus(),
        API.getTmdbRows()
      ]);

      // 1. Sync Watchlist
      if (wlData && Array.isArray(wlData.ids)) {
        State.watchlist = wlData.ids;
        localStorage.setItem('movani_watchlist', JSON.stringify(State.watchlist));
        UI.updateWatchlistBadge();
      }

      // 2. Sync Continue Watching
      if (cwData && Array.isArray(cwData) && cwData.length > 0) {
        State.continueWatching = cwData;
        localStorage.setItem('movani_continue_watching', JSON.stringify(State.continueWatching));
        UI.renderContinueWatching();
      }

      // 3. Check TMDB status
      if (tmdbStatus && tmdbStatus.api_key_valid) {
        State.tmdbConnected = true;
        const badge = document.getElementById('tmdbLiveBadge');
        if (badge) badge.classList.remove('hidden');
      }

      // 3b. Initialize Universal Master OTT Status
      try {
        const ottStatus = await API.getOttStatus();
        if (ottStatus && ottStatus.status === 'operational') {
          State.ottConnected = true;
          const ottBadge = document.getElementById('masterOttLiveBadge');
          if (ottBadge) ottBadge.classList.remove('hidden');
        }
      } catch (e) {
        console.log('Universal Master OTT status notice:', e);
      }

      // 4. Ingest Global Home Rails
      if (homeRows && typeof homeRows === 'object') {
        State.homeRowsData = homeRows;

        // Merge incoming global titles into catalog
        const allNew = [
          ...(homeRows.trending || []),
          ...(homeRows.anime || []),
          ...(homeRows.movies || []),
          ...(homeRows.series || []),
          ...(homeRows.top_rated || []),
          ...(homeRows.action || []),
          ...(homeRows.scifi || [])
        ];

        allNew.forEach(item => {
          if (!State.catalog.some(c => c.id === item.id || (item.tmdbId && c.tmdbId === item.tmdbId))) {
            State.catalog.push(item);
          }
        });

        // Set billboard to #1 Global Trending
        if (homeRows.trending && homeRows.trending.length > 0) {
          State.currentHeroIndex = 0;
        }

        UI.renderHero();
        UI.renderTop10(homeRows.top10);
        UI.renderCategoryTrays();
        console.log("Successfully ingested global streaming rails from TMDB!");
      }
    } catch (err) {
      console.log('Backend sync notice (offline mode active):', err.message);
    }
  },

  // ================= HERO CONTROLLER =================
  setHeroIndex(idx) {
    State.currentHeroIndex = idx;
    UI.renderHero();
    this.restartHeroAutoAdvance();
  },

  cycleHeroNext() {
    const max = Math.min(5, State.catalog.length);
    State.currentHeroIndex = (State.currentHeroIndex + 1) % max;
    UI.renderHero();
    this.restartHeroAutoAdvance();
  },

  startHeroAutoAdvance() {
    if (State.heroAutoAdvanceTimer) clearInterval(State.heroAutoAdvanceTimer);
    State.heroAutoAdvanceTimer = setInterval(() => {
      const max = Math.min(5, State.catalog.length);
      State.currentHeroIndex = (State.currentHeroIndex + 1) % max;
      UI.renderHero();
    }, 7000);
  },

  restartHeroAutoAdvance() {
    this.startHeroAutoAdvance();
  },

  playHeroTitle() {
    const item = State.catalog[State.currentHeroIndex];
    if (item) Player.open(item);
  },

  playHeroTrailer() {
    const item = State.catalog[State.currentHeroIndex];
    if (item) Player.openWithMode(item, 'trailer');
  },

  openHeroDetailsModal() {
    const item = State.catalog[State.currentHeroIndex];
    if (item) UI.openDetailsModal(item);
  },

  openHeroXray() {
    const item = State.catalog[State.currentHeroIndex];
    if (item) {
      Player.open(item);
      if (window.XRay) XRay.toggle(true);
    }
  },

  toggleHeroAudio() {
    State.heroMuted = !State.heroMuted;
    const icon = document.getElementById('heroMuteIcon');
    if (icon) {
      icon.className = State.heroMuted ? 'ph ph-speaker-simple-slash text-lg' : 'ph ph-speaker-high text-lg text-brand-blue';
    }
    UI.showToast(State.heroMuted ? 'Preview sound muted' : 'Preview sound enabled');
  },

  toggleWatchlistHero() {
    const item = State.catalog[State.currentHeroIndex];
    if (item) {
      this.toggleWatchlist(item.id);
      UI.renderHero();
    }
  },

  // ================= WATCHLIST CONTROLLER =================
  async toggleWatchlist(id) {
    const item = State.catalog.find(i => i.id === id);
    const title = item ? item.title : 'Title';

    if (State.watchlist.includes(id)) {
      State.watchlist = State.watchlist.filter(item => item !== id);
      UI.showToast(`Removed "${title}" from Watchlist`);
    } else {
      State.watchlist.push(id);
      UI.showToast(`Added "${title}" to Watchlist`);
    }

    localStorage.setItem('movani_watchlist', JSON.stringify(State.watchlist));
    UI.updateWatchlistBadge();
    UI.renderWatchlistModalItems();

    // Sync to SQLite backend
    if (API.isAvailable) {
      await API.toggleWatchlist(id);
    }
  },

  toggleWatchlistModal() {
    const modal = document.getElementById('watchlistModal');
    if (!modal) return;
    const isHidden = modal.classList.contains('hidden');
    if (isHidden) {
      UI.renderWatchlistModalItems();
      modal.classList.remove('hidden');
    } else {
      modal.classList.add('hidden');
    }
  },

  async clearWatchlist() {
    if (confirm("Are you sure you want to clear your entire watchlist?")) {
      State.watchlist = [];
      localStorage.setItem('movani_watchlist', JSON.stringify([]));
      UI.updateWatchlistBadge();
      UI.renderWatchlistModalItems();
      UI.showToast("Watchlist cleared");

      if (API.isAvailable) {
        await API.clearWatchlist();
      }
    }
  },

  // ================= CONTINUE WATCHING CONTROLLER =================
  recordContinueWatching(item, currentSeconds = 0, totalSeconds = 160, progress = 0, epLabel = '') {
    if (!item) return;

    const prog = progress > 0 ? progress : (totalSeconds > 0 ? Math.round((currentSeconds / totalSeconds) * 100) : 25);
    const ep = epLabel || (item.type === 'anime' || item.type === 'series' ? `S${State.currentSeason || 1}:E${State.currentEpisode || 1}` : (item.runtime || 'Feature'));

    const existingIndex = State.continueWatching.findIndex(i => i.id === item.id);
    const payload = {
      id: item.id,
      title: item.title,
      progress: Math.min(100, Math.max(5, prog)),
      ep: ep,
      thumb: item.backdrop || item.poster,
      current_seconds: currentSeconds,
      total_seconds: totalSeconds
    };

    if (existingIndex >= 0) {
      State.continueWatching[existingIndex] = payload;
    } else {
      State.continueWatching.unshift(payload);
    }

    localStorage.setItem('movani_continue_watching', JSON.stringify(State.continueWatching));
    UI.renderContinueWatching();

    if (API.isAvailable) {
      API.saveContinueWatching(item.id, prog, ep, currentSeconds, totalSeconds);
    }
  },

  removeContinueItem(id) {
    State.continueWatching = State.continueWatching.filter(i => i.id !== id);
    localStorage.setItem('movani_continue_watching', JSON.stringify(State.continueWatching));
    UI.renderContinueWatching();
    UI.showToast("Removed from Continue Watching");

    if (API.isAvailable) {
      API.removeContinueWatching(id);
    }
  },

  clearContinueWatching() {
    if (confirm("Clear all items from Continue Watching?")) {
      State.continueWatching = [];
      localStorage.setItem('movani_continue_watching', JSON.stringify([]));
      UI.renderContinueWatching();
      UI.showToast("Continue Watching cleared");

      if (API.isAvailable) {
        API.clearContinueWatching();
      }
    }
  },

  // ================= NETFLIX CATEGORY SWITCHER =================
  filterCategory(category) {
    State.activeCategoryFilter = category;

    // Update active nav button styles
    const navButtons = {
      'all': 'nav-all',
      'movies': 'nav-movies',
      'series': 'nav-series',
      'anime': 'nav-anime',
      'new': 'nav-new',
      'watchlist': 'nav-watchlist'
    };

    Object.entries(navButtons).forEach(([cat, id]) => {
      const btn = document.getElementById(id);
      if (btn) {
        if (cat === category) {
          btn.className = "nav-item px-3 py-1.5 rounded text-white bg-brand-surface border border-brand-border";
        } else {
          btn.className = "nav-item px-3 py-1.5 rounded hover:text-white hover:bg-brand-surface/70 transition text-slate-300";
        }
      }
    });

    // Special: My List opens Watchlist modal
    if (category === 'watchlist') {
      this.toggleWatchlistModal();
      return;
    }

    const banner = document.getElementById('activeFilterBanner');
    const statusText = document.getElementById('filterStatusText');

    // Section visibility toggling based on Netflix view
    const sections = {
      studios: document.getElementById('studiosSection'),
      top10: document.getElementById('top10Section'),
      continueSec: document.getElementById('continueSection'),
      trending: document.getElementById('trendingSection'),
      anime: document.getElementById('animeSection'),
      movies: document.getElementById('moviesSection'),
      series: document.getElementById('seriesSection'),
      topRated: document.getElementById('topRatedSection'),
      action: document.getElementById('actionSection'),
      scifi: document.getElementById('scifiSection')
    };

    if (category === 'all') {
      if (banner) banner.classList.add('hidden');
      Object.values(sections).forEach(s => s && s.classList.remove('hidden'));
      UI.renderHero();
    } else if (category === 'movies') {
      if (banner) { banner.classList.remove('hidden'); banner.classList.add('flex'); }
      if (statusText) statusText.innerText = 'Showing: Global Blockbuster Movies & Action Hits';
      
      if (sections.studios) sections.studios.classList.add('hidden');
      if (sections.anime) sections.anime.classList.add('hidden');
      if (sections.series) sections.series.classList.add('hidden');
      if (sections.movies) sections.movies.classList.remove('hidden');
      if (sections.action) sections.action.classList.remove('hidden');
      if (sections.scifi) sections.scifi.classList.remove('hidden');
      if (sections.topRated) sections.topRated.classList.remove('hidden');

      // Set hero to top movie
      const topMovie = State.catalog.find(i => i.type === 'movies');
      if (topMovie) {
        State.currentHeroIndex = State.catalog.indexOf(topMovie);
        UI.renderHero();
      }
    } else if (category === 'series') {
      if (banner) { banner.classList.remove('hidden'); banner.classList.add('flex'); }
      if (statusText) statusText.innerText = 'Showing: Binge-Worthy TV & Web Series Worldwide';
      
      if (sections.studios) sections.studios.classList.add('hidden');
      if (sections.anime) sections.anime.classList.add('hidden');
      if (sections.movies) sections.movies.classList.add('hidden');
      if (sections.series) sections.series.classList.remove('hidden');
      if (sections.topRated) sections.topRated.classList.remove('hidden');

      const topSeries = State.catalog.find(i => i.type === 'series');
      if (topSeries) {
        State.currentHeroIndex = State.catalog.indexOf(topSeries);
        UI.renderHero();
      }
    } else if (category === 'anime') {
      if (banner) { banner.classList.remove('hidden'); banner.classList.add('flex'); }
      if (statusText) statusText.innerText = 'Showing: Anime Simulcasts & Global Sensations';
      
      if (sections.studios) sections.studios.classList.add('hidden');
      if (sections.movies) sections.movies.classList.add('hidden');
      if (sections.series) sections.series.classList.add('hidden');
      if (sections.anime) sections.anime.classList.remove('hidden');
      if (sections.action) sections.action.classList.remove('hidden');

      const topAnime = State.catalog.find(i => i.type === 'anime');
      if (topAnime) {
        State.currentHeroIndex = State.catalog.indexOf(topAnime);
        UI.renderHero();
      }
    } else if (category === 'new') {
      if (banner) { banner.classList.remove('hidden'); banner.classList.add('flex'); }
      if (statusText) statusText.innerText = 'Showing: New Releases & Global Trending';
      
      if (sections.trending) sections.trending.classList.remove('hidden');
      if (sections.top10) sections.top10.classList.remove('hidden');
      if (sections.topRated) sections.topRated.classList.remove('hidden');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    UI.showToast(`Browsing: ${category.toUpperCase()}`);
  },

  resetAllFilters() {
    this.filterCategory('all');
  },

  filterStudio(studioName) {
    this.filterPlatform(studioName);
  },

  filterPlatform(platformName) {
    State.activeStudioFilter = platformName;
    const banner = document.getElementById('activeFilterBanner');
    const statusText = document.getElementById('filterStatusText');
    if (banner) { banner.classList.remove('hidden'); banner.classList.add('flex'); }
    if (statusText) statusText.innerText = `Browsing OTT Platform: ${platformName}`;

    // Filter catalog items by platform or studio or providers
    const filtered = State.catalog.filter(i => {
      const matchStudio = (i.studio || '').toLowerCase().includes(platformName.toLowerCase());
      const matchProviders = i.providers && i.providers.some(p => (p.name || '').toLowerCase().includes(platformName.toLowerCase()));
      const matchGenres = i.genres && i.genres.some(g => g.toLowerCase().includes(platformName.toLowerCase()));
      const matchOverview = (i.overview || '').toLowerCase().includes(platformName.toLowerCase());
      return matchStudio || matchProviders || matchGenres || matchOverview;
    });

    if (filtered.length > 0) {
      UI.renderTrayItems('trending-tray', filtered);
      State.currentHeroIndex = State.catalog.indexOf(filtered[0]);
      UI.renderHero();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      UI.showToast(`Showing all titles from ${platformName}`);
    } else {
      // Query live global database for titles on that OTT platform
      if (API.isAvailable) {
        API.searchTmdb(platformName, 12).then(results => {
          if (results && results.length > 0) {
            results.forEach(r => {
              if (!State.catalog.some(c => c.id === r.id)) State.catalog.push(r);
            });
            UI.renderTrayItems('trending-tray', results);
            State.currentHeroIndex = State.catalog.indexOf(results[0]) >= 0 ? State.catalog.indexOf(results[0]) : 0;
            UI.renderHero();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            UI.showToast(`Loaded ${results.length} titles from ${platformName}`);
          } else {
            UI.showToast(`Showing titles from ${platformName}`);
          }
        }).catch(() => {
          UI.showToast(`Showing titles from ${platformName}`);
        });
      } else {
        UI.showToast(`Showing titles from ${platformName}`);
      }
    }
  },

  async filterLanguage(langCode) {
    const code = (langCode || 'all').toLowerCase();

    // Update active button styling
    document.querySelectorAll('.lang-chip').forEach(btn => {
      btn.classList.remove('bg-brand-blue', 'text-white', 'border-brand-blue', 'shadow-md');
      btn.classList.add('bg-brand-surface', 'border-brand-border', 'text-slate-300');
    });
    const activeBtn = document.getElementById(`lang-btn-${code}`);
    if (activeBtn) {
      activeBtn.classList.remove('bg-brand-surface', 'border-brand-border', 'text-slate-300');
      activeBtn.classList.add('bg-brand-blue', 'text-white', 'border-brand-blue', 'shadow-md');
    }

    const traySection = document.getElementById('languageTraySection');
    const tray = document.getElementById('language-tray');
    const titleEl = document.getElementById('languageTrayTitle');
    const countEl = document.getElementById('languageTrayCount');

    if (code === 'all') {
      if (traySection) traySection.classList.add('hidden');
      UI.renderCategoryTrays();
      UI.showToast("Showing all languages & global catalog");
      return;
    }

    const langNames = {
      hi: "Hindi (हिंदी)",
      kn: "Kannada (ಕನ್ನಡ)",
      en: "English",
      ja: "Japanese (日本語)",
      ta: "Tamil (தமிழ்)",
      te: "Telugu (తెలుగు)",
      ko: "Korean (한국어)",
      es: "Spanish (Español)",
      fr: "French (Français)",
      de: "German (Deutsch)"
    };
    const langLabel = langNames[code] || code.toUpperCase();

    UI.showToast(`Loading titles in ${langLabel}...`);

    try {
      let titles = [];
      if (API.isAvailable) {
        titles = await API.getTmdbByLanguage(code, 20);
      }

      if (!titles || titles.length === 0) {
        titles = State.catalog.filter(i => {
          const a = (i.audio || []).join(' ').toLowerCase();
          return a.includes(code) || a.includes(langLabel.toLowerCase());
        });
      }

      if (titles && titles.length > 0) {
        if (traySection) traySection.classList.remove('hidden');
        if (titleEl) titleEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-brand-blue"></span> Top Titles in ${langLabel}`;
        if (countEl) countEl.innerText = `${titles.length} Titles`;
        if (tray) UI.renderTrayItems('language-tray', titles);

        titles.forEach(t => {
          if (!State.catalog.some(c => c.id === t.id)) State.catalog.push(t);
          if (window.Search && Search.resultsMap) Search.resultsMap[t.id] = t;
        });

        traySection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        UI.showToast(`Loaded ${titles.length} titles in ${langLabel}`);
      } else {
        UI.showToast(`No titles found for ${langLabel}`);
      }
    } catch (e) {
      console.log('Language filter error:', e);
      UI.showToast(`Showing titles in ${langLabel}`);
    }
  },

  scrollTray(id, offset) {
    const el = document.getElementById(id);
    if (el) el.scrollBy({ left: offset, behavior: 'smooth' });
  },

  playFromDetails() {
    if (State.detailsModalItem) {
      UI.closeDetailsModal();
      Player.open(State.detailsModalItem);
    }
  },

  playTrailerFromDetails() {
    if (State.detailsModalItem) {
      UI.closeDetailsModal();
      Player.openWithMode(State.detailsModalItem, 'trailer');
    }
  },

  toggleWatchlistFromDetails() {
    if (State.detailsModalItem) {
      this.toggleWatchlist(State.detailsModalItem.id);
      const inWl = State.watchlist.includes(State.detailsModalItem.id);
      const icon = document.getElementById('detailsWatchlistIcon');
      if (icon) {
        icon.className = inWl ? 'ph ph-check text-emerald-400' : 'ph ph-plus';
      }
    }
  },

  // ================= GLOBAL KEYBOARD SHORTCUTS =================
  handleGlobalKeydown(e) {
    const isTyping = document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
    if (isTyping && e.key !== 'Escape') return;

    const playerModal = document.getElementById('playerModal');
    const detailsModal = document.getElementById('detailsModal');
    const watchlistModal = document.getElementById('watchlistModal');

    // Esc closes open modals
    if (e.key === 'Escape') {
      if (document.activeElement) document.activeElement.blur();
      if (playerModal && !playerModal.classList.contains('hidden')) Player.close();
      if (detailsModal && !detailsModal.classList.contains('hidden')) UI.closeDetailsModal();
      if (watchlistModal && !watchlistModal.classList.contains('hidden')) watchlistModal.classList.add('hidden');
      Search.hideDropdown();
      return;
    }

    // / or Ctrl+K to search
    if ((e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) && document.activeElement.id !== 'searchInput') {
      e.preventDefault();
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
      return;
    }

    // In player shortcuts
    if (playerModal && !playerModal.classList.contains('hidden')) {
      if (e.key === ' ') {
        e.preventDefault();
        Player.togglePlayback();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        Player.skip(-10);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        Player.skip(10);
      } else if (e.key.toLowerCase() === 'm') {
        Player.toggleMute();
      } else if (e.key.toLowerCase() === 'f') {
        Player.toggleFullscreen();
      } else if (e.key.toLowerCase() === 'x') {
        if (window.XRay) XRay.toggle();
      } else if (e.key.toLowerCase() === 'c') {
        Player.cycleSubtitles();
      } else if (e.key.toLowerCase() === 'a') {
        Player.cycleAudio();
      } else if (e.key.toLowerCase() === 'n') {
        Player.nextEpisode();
      } else if (e.key.toLowerCase() === 'p') {
        Player.prevEpisode();
      }
    }
  }
};

// Expose modules to global window object
window.App = App;
window.UI = UI;
window.Player = Player;
window.XRay = XRay;
window.Search = Search;
window.State = State;
window.API = API;

// Global helper wrappers for direct HTML inline event handlers
window.filterCategory = (type) => App.filterCategory(type);
window.filterStudio = (studio) => App.filterStudio(studio);
window.filterPlatform = (platform) => App.filterPlatform(platform);
window.resetAllFilters = () => App.resetAllFilters();
window.toggleWatchlistModal = () => App.toggleWatchlistModal();
window.clearWatchlist = () => App.clearWatchlist();
window.clearContinueWatching = () => App.clearContinueWatching();
window.removeContinueItem = (id) => App.removeContinueItem(id);
window.playHeroTitle = () => App.playHeroTitle();
window.playHeroTrailer = () => App.playHeroTrailer();
window.openHeroDetailsModal = () => App.openHeroDetailsModal();
window.openHeroXray = () => App.openHeroXray();
window.toggleWatchlistHero = () => App.toggleWatchlistHero();
window.cycleHeroNext = () => App.cycleHeroNext();
window.setHeroIndex = (idx) => App.setHeroIndex(idx);
window.playFromDetails = () => App.playFromDetails();
window.playTrailerFromDetails = () => App.playTrailerFromDetails();
window.toggleWatchlistFromDetails = () => App.toggleWatchlistFromDetails();
window.scrollTray = (id, off) => App.scrollTray(id, off);
window.handleSearch = (val) => Search.handleInput(val);
window.clearSearch = () => Search.clear();
window.showSearchDropdown = () => Search.showDropdown();
window.hideSearchDropdown = () => Search.hideDropdown();

// Player and XRay modal wrappers
window.closePlayerModal = () => Player.close();
window.toggleInPlayerXray = (force) => { if (window.XRay) XRay.toggle(force); };
window.toggleVideoPlaybackState = () => Player.togglePlayback();
window.skipTime = (sec) => Player.skip(sec);
window.saveCurrentMusicTrack = () => { if (window.XRay) XRay.saveCurrentMusic(); };
window.seekScrubber = (e) => Player.seek(e);
window.toggleMute = () => Player.toggleMute();
window.changeVolume = (val) => Player.changeVolume(val);
window.cycleAudioTrack = () => Player.cycleAudio();
window.cycleSubtitles = () => Player.cycleSubtitles();
window.toggleAudioSubtitlesDrawer = () => Player.toggleAudioSubtitlesDrawer();
window.cycleSpeed = () => Player.cycleSpeed();
window.toggleModalFullscreen = () => Player.toggleFullscreen();
window.openDetailsModal = (item) => UI.openDetailsModal(item || State.catalog[State.currentHeroIndex]);
window.closeDetailsModal = () => UI.closeDetailsModal();
window.openOttModal = () => UI.openOttModal();
window.closeOttModal = () => UI.closeOttModal();
window.cycleOttServer = () => Player.cycleOttServer();
window.filterLanguage = (code) => App.filterLanguage(code);

// Initialize application on DOM ready
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}
