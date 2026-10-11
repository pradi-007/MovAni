/**
 * MOVAni Master Application Controller
 * Bootstraps frontend, synchronizes state with Python REST API & TMDB,
 * and manages global keyboard navigation, category filtering, and modals.
 * Protected by MOVAni Client Security Shield.
 */

// ================= ENTERPRISE CLIENT-SIDE SECURITY SHIELD =================
(function initClientSecurityShield() {
  // 1. Anti-Clickjacking: Safe check for unauthorized external frames
  try {
    if (window.top && window.top !== window.self) {
      try {
        if (window.top.location.hostname !== window.location.hostname) {
          window.top.location = window.location;
        }
      } catch (_) {}
    }
  } catch (_) {}

  // 2. Anti-Tamper & Security Warning Console Banner
  try {
    console.log(
      "%c⛔ STOP! MOVAni ENTERPRISE SECURITY SHIELD ACTIVE ⛔",
      "color: #ef4444; font-size: 20px; font-weight: 900; background: #0a0d14; padding: 6px 12px; border-radius: 6px; border: 1px solid #ef4444;"
    );
    console.log(
      "%cWARNING: Unauthorized script injection, token extraction, reverse engineering, and automated scraping are strictly monitored and IP-logged by MOVAni Shield.",
      "color: #f59e0b; font-size: 12px; font-weight: bold;"
    );
  } catch (_) {}
})();

const App = {
  async init() {
    // 1. Initial UI render from baseline state
    UI.renderHero();
    UI.renderTop10();
    UI.renderCategoryTrays();
    UI.renderContinueWatching();
    UI.updateWatchlistBadge();
    this.startHeroAutoAdvance();

    // Stage tamper-proofing: Prevent right-click context menu scraping on player canvas
    const videoCanvas = document.getElementById('videoCanvasContainer');
    if (videoCanvas) {
      videoCanvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

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

    // 3. Synchronize with Python backend & live TMDB in background
    this.syncWithBackend().catch(err => console.warn('Background sync notice:', err));
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
    if (!Array.isArray(State.watchlist)) State.watchlist = [];
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
      kannadaClassics: document.getElementById('kannadaClassicsSection'),
      hindiClassics: document.getElementById('hindiClassicsSection'),
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
      if (statusText) statusText.innerText = 'Showing: Global Blockbuster Movies & Regional Classics';
      
      if (sections.studios) sections.studios.classList.add('hidden');
      if (sections.anime) sections.anime.classList.add('hidden');
      if (sections.series) sections.series.classList.add('hidden');
      if (sections.movies) sections.movies.classList.remove('hidden');
      if (sections.kannadaClassics) sections.kannadaClassics.classList.remove('hidden');
      if (sections.hindiClassics) sections.hindiClassics.classList.remove('hidden');
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

  scrollToOttHub() {
    const section = document.getElementById('studiosSection');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      section.classList.add('ring-2', 'ring-brand-blue', 'rounded-2xl', 'p-2');
      setTimeout(() => {
        section.classList.remove('ring-2', 'ring-brand-blue', 'rounded-2xl', 'p-2');
      }, 2500);
      UI.showToast("All OTT Platforms in One: Select any platform to explore");
    }
  },

  scrollToLanguages() {
    const section = document.getElementById('languagesSection');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      section.classList.add('ring-2', 'ring-brand-blue', 'rounded-2xl', 'p-2');
      setTimeout(() => {
        section.classList.remove('ring-2', 'ring-brand-blue', 'rounded-2xl', 'p-2');
      }, 2500);
      UI.showToast("Explore titles by Audio & Subtitle Language");
    }
  },

  closeOttShowcaseTray() {
    const traySec = document.getElementById('ottShowcaseTraySection');
    if (traySec) traySec.classList.add('hidden');
    document.querySelectorAll('.ott-platform-card').forEach(btn => {
      btn.classList.remove('border-brand-blue', 'ring-2', 'ring-brand-blue', 'scale-[1.03]');
    });
    UI.showToast("Closed OTT showcase tray");
  },

  filterStudio(studioName) {
    this.filterPlatform(studioName);
  },

  async filterPlatform(platformName) {
    State.activeStudioFilter = platformName;
    const normName = platformName.toLowerCase();

    // Visual card active state
    document.querySelectorAll('.ott-platform-card').forEach(btn => {
      btn.classList.remove('border-brand-blue', 'ring-2', 'ring-brand-blue', 'scale-[1.03]');
    });

    const activeBtn = document.getElementById(`ott-card-${normName.replace(/[^a-z0-9]/g, '')}`);
    if (activeBtn) {
      activeBtn.classList.add('border-brand-blue', 'ring-2', 'ring-brand-blue', 'scale-[1.03]');
    }

    const traySection = document.getElementById('ottShowcaseTraySection');
    const trayTitle = document.getElementById('ottShowcaseTitle');
    const trayCount = document.getElementById('ottShowcaseCount');

    UI.showToast(`Loading catalog for ${platformName}...`);

    // 1. Search local curated catalog
    let filtered = State.catalog.filter(i => {
      const matchStudio = (i.studio || '').toLowerCase().includes(normName);
      const matchProviders = i.providers && i.providers.some(p => (p.name || '').toLowerCase().includes(normName));
      const matchGenres = i.genres && i.genres.some(g => g.toLowerCase().includes(normName));
      const matchOverview = (i.overview || '').toLowerCase().includes(normName);
      return matchStudio || matchProviders || matchGenres || matchOverview;
    });

    // 2. Query TMDB if local matches are fewer than 6
    if (filtered.length < 6 && API.isAvailable) {
      try {
        const queryTerm = normName.includes('hotstar') ? 'Hotstar' : (normName.includes('prime') ? 'Amazon' : (normName.includes('apple') ? 'Apple TV' : platformName));
        const results = await API.searchTmdb(queryTerm, 12);
        if (results && results.length > 0) {
          const seen = new Set(filtered.map(f => f.id));
          results.forEach(r => {
            if (!seen.has(r.id)) {
              seen.add(r.id);
              filtered.push(r);
              if (!State.catalog.some(c => c.id === r.id)) State.catalog.push(r);
              if (window.Search && Search.resultsMap) Search.resultsMap[r.id] = r;
            }
          });
        }
      } catch (err) {
        console.log('Platform TMDB query error:', err);
      }
    }

    if (traySection) {
      traySection.classList.remove('hidden');
      if (trayTitle) trayTitle.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-brand-blue animate-pulse inline-block mr-1"></span> ${platformName} Streaming Catalog`;
      if (trayCount) trayCount.innerText = `${filtered.length} Titles`;
      UI.renderTrayItems('ott-showcase-tray', filtered.length > 0 ? filtered : State.catalog.slice(0, 10));
      traySection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    UI.showToast(`Showing ${filtered.length} titles from ${platformName}`);
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
      kn: "Kannada (ಕನ್ನಡ)",
      hi: "Hindi (हिंदी)",
      ta: "Tamil (தமிழ்)",
      te: "Telugu (తెలుగు)",
      ml: "Malayalam (മലയാളം)",
      bn: "Bengali (বাংলা)",
      mr: "Marathi (मराठी)",
      pa: "Punjabi (ਪੰਜਾਬੀ)",
      en: "English",
      ja: "Japanese (日本語)",
      ko: "Korean (한국어)",
      es: "Spanish (Español)",
      fr: "French (Français)",
      de: "German (Deutsch)"
    };
    const langLabel = langNames[code] || code.toUpperCase();

    UI.showToast(`Loading titles in ${langLabel}...`);

    try {
      // 1. Search local curated catalog across audio, dubs, subs, language
      const searchTerms = [code, langLabel.toLowerCase()];
      if (code === 'kn') searchTerms.push('kannada', 'kan');
      if (code === 'hi') searchTerms.push('hindi', 'hin');
      if (code === 'ta') searchTerms.push('tamil', 'tam');
      if (code === 'te') searchTerms.push('telugu', 'tel');
      if (code === 'ml') searchTerms.push('malayalam', 'mal');
      if (code === 'bn') searchTerms.push('bengali', 'ben');
      if (code === 'mr') searchTerms.push('marathi', 'mar');
      if (code === 'pa') searchTerms.push('punjabi', 'pun');
      if (code === 'en') searchTerms.push('english', 'eng');
      if (code === 'ja') searchTerms.push('japanese', 'jap', 'jp');
      if (code === 'ko') searchTerms.push('korean', 'kor');

      const localMatches = State.catalog.filter(i => {
        const audioStr = (i.audio || []).join(' ').toLowerCase();
        const dubsStr = (i.dubs || []).join(' ').toLowerCase();
        const subsStr = (i.subs || []).join(' ').toLowerCase();
        const langStr = (i.language || '').toLowerCase();
        return searchTerms.some(term => audioStr.includes(term) || dubsStr.includes(term) || subsStr.includes(term) || langStr.includes(term));
      });

      // 2. Fetch live TMDB / catalog API titles for this language
      let tmdbTitles = [];
      if (API.isAvailable) {
        try {
          tmdbTitles = await API.getTmdbByLanguage(code, 20) || [];
        } catch (e) {
          console.log('Language fetch note:', e);
        }
      }

      const seenIds = new Set(localMatches.map(m => m.id));
      const titles = [...localMatches];
      tmdbTitles.forEach(t => {
        if (!seenIds.has(t.id)) {
          seenIds.add(t.id);
          titles.push(t);
        }
      });

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
      const inWl = Array.isArray(State.watchlist) && State.watchlist.includes(State.detailsModalItem.id);
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
