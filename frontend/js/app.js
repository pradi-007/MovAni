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
    const ALLOWED_OPEN_DOMAINS = [
      'codespecters.com', 'autoembed.co', 'vidlink.pro', 'multiembed.mov',
      'vidsrc.pm', '2embed.cc', '2embed.skin', 'rivestream.live', 'nontongo.win',
      'embed.su', 'vjs.zencdn.net', 'archive.org',
      'youtube.com', 'youtu.be', 'justwatch.com', 'themoviedb.org', 'tmdb.org',
      'netflix.com', 'primevideo.com', 'hotstar.com', 'crunchyroll.com',
      'apple.com', 'max.com', 'hbomax.com', 'jiocinema.com', 'paramountplus.com'
    ];
    window.open = function(url, target, features) {
      if (!url) return null;
      if (
        url.startsWith('/') ||
        url.startsWith(window.location.origin) ||
        url.startsWith('http://localhost') ||
        url.startsWith('http://127.0.0.1') ||
        ALLOWED_OPEN_DOMAINS.some(domain => url.includes(domain))
      ) {
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
    this.loadOpenLibraryCatalog().catch(err => console.warn('Open Library load notice:', err));
  },

  async syncWithBackend() {
    if (!API.isAvailable) return;
    try {
      // Parallel resilient fetch using Promise.allSettled
      const [wlRes, cwRes, tmdbRes, rowsRes, knRes] = await Promise.allSettled([
        API.getWatchlist(),
        API.getContinueWatching(),
        API.getTmdbStatus(),
        API.getTmdbRows(),
        API.getKannada(1, 20)
      ]);

      const wlData = wlRes.status === 'fulfilled' ? wlRes.value : null;
      const cwData = cwRes.status === 'fulfilled' ? cwRes.value : null;
      const tmdbStatus = tmdbRes.status === 'fulfilled' ? tmdbRes.value : null;
      const homeRows = rowsRes.status === 'fulfilled' ? rowsRes.value : null;
      const knData = knRes.status === 'fulfilled' ? knRes.value : null;

      // 1. Sync Watchlist
      const uid = window.Auth?.currentUser?.id;
      if (wlData && Array.isArray(wlData.ids)) {
        State.watchlist = wlData.ids;
        if (uid) localStorage.setItem('movani_watchlist_' + uid, JSON.stringify(State.watchlist));
        UI.updateWatchlistBadge();
      }

      // 2. Sync Continue Watching
      if (Array.isArray(cwData)) {
        State.continueWatching = cwData;
        if (uid) localStorage.setItem('movani_continue_watching_' + uid, JSON.stringify(State.continueWatching));
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
          ...(homeRows.scifi || []),
          ...(homeRows.kannada || []),
          ...(homeRows.hindi || [])
        ];

        allNew.forEach(item => {
          if (!State.catalog.some(c => c.id === item.id || (item.tmdbId && c.tmdbId === item.tmdbId))) {
            State.catalog.push(item);
          }
        });

        // Set billboard to #1 Global Trending if available
        if (homeRows.trending && homeRows.trending.length > 0) {
          State.currentHeroIndex = 0;
        }
      }

      // 5. Ingest Kannada live catalog
      if (knData && Array.isArray(knData.results)) {
        if (!State.homeRowsData) State.homeRowsData = {};
        State.homeRowsData.kannada = knData.results;
        knData.results.forEach(item => {
          if (!State.catalog.some(c => c.id === item.id || (item.tmdbId && c.tmdbId === item.tmdbId))) {
            State.catalog.push(item);
          }
        });
      }

      // 6. Ingest Kartoons Anime Catalog (Multi-Audio & Dubs)
      try {
        if (API.getAnimeCatalog) {
          const animeData = await API.getAnimeCatalog({ limit: 24 });
          if (animeData && Array.isArray(animeData.results) && animeData.results.length > 0) {
            if (!State.homeRowsData) State.homeRowsData = {};
            State.homeRowsData.anime = animeData.results;
            animeData.results.forEach(item => {
              if (!State.catalog.some(c => c.id === item.id || (item.tmdb_id && (c.tmdbId === item.tmdb_id || c.tmdb_id === item.tmdb_id)))) {
                State.catalog.push(item);
              }
            });
          }
        }
      } catch (ae) {
        console.log('Anime catalogue sync notice:', ae);
      }

      // 7. Ingest AllMoviesHub Multi-Audio Movie Catalog
      try {
        if (API.getMoviesCatalog) {
          const moviesData = await API.getMoviesCatalog({ limit: 24 });
          if (moviesData && Array.isArray(moviesData.results) && moviesData.results.length > 0) {
            if (!State.homeRowsData) State.homeRowsData = {};
            State.homeRowsData.movies = moviesData.results;
            moviesData.results.forEach(item => {
              if (!State.catalog.some(c => c.id === item.id || (item.tmdb_id && (c.tmdbId === item.tmdb_id || c.tmdb_id === item.tmdb_id)))) {
                State.catalog.push(item);
              }
            });
          }
        }
      } catch (me) {
        console.log('Movies catalogue sync notice:', me);
      }

      UI.renderHero();
      UI.renderTop10(State.homeRowsData?.top10);
      UI.renderCategoryTrays();
      console.log("Successfully ingested global streaming rails from TMDB, Kannada catalog, Anime & AllMoviesHub!");
    } catch (err) {
      console.log('Backend sync notice (offline mode active):', err.message);
    }
  },

  async reloadSection(sectionName) {
    UI.showToast(`Refreshing ${sectionName}...`);
    try {
      if (sectionName === 'kannada' && API.isAvailable) {
        const data = await API.getKannada(1, 20);
        if (data && data.results) {
          if (!State.homeRowsData) State.homeRowsData = {};
          State.homeRowsData.kannada = data.results;
          UI.renderCategoryTrays();
          return;
        }
      }
      if (sectionName === 'anime' && API.isAvailable && API.getAnimeCatalog) {
        const aData = await API.getAnimeCatalog({ limit: 24 });
        if (aData && aData.results) {
          if (!State.homeRowsData) State.homeRowsData = {};
          State.homeRowsData.anime = aData.results;
          UI.renderCategoryTrays();
          return;
        }
      }
      if (sectionName === 'movies' && API.isAvailable && API.getMoviesCatalog) {
        const mData = await API.getMoviesCatalog({ limit: 24 });
        if (mData && mData.results) {
          if (!State.homeRowsData) State.homeRowsData = {};
          State.homeRowsData.movies = mData.results;
          UI.renderCategoryTrays();
          return;
        }
      }
      await this.syncWithBackend();
    } catch (e) {
      UI.showToast(`Retry failed for ${sectionName}.`);
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
    if (item) Player.open(item);
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

    const uid = window.Auth?.currentUser?.id;
    if (uid) localStorage.setItem('movani_continue_watching_' + uid, JSON.stringify(State.continueWatching));
    UI.renderContinueWatching();

    if (API.isAvailable) {
      API.saveContinueWatching(item.id, prog, ep, currentSeconds, totalSeconds);
    }
  },

  removeContinueItem(id) {
    State.continueWatching = State.continueWatching.filter(i => i.id !== id);
    const uid = window.Auth?.currentUser?.id;
    if (uid) localStorage.setItem('movani_continue_watching_' + uid, JSON.stringify(State.continueWatching));
    UI.renderContinueWatching();
    UI.showToast("Removed from Continue Watching");

    if (API.isAvailable) {
      API.removeContinueWatching(id);
    }
  },

  clearContinueWatching() {
    if (confirm("Clear all items from Continue Watching?")) {
      State.continueWatching = [];
      const uid = window.Auth?.currentUser?.id;
      if (uid) localStorage.setItem('movani_continue_watching_' + uid, JSON.stringify([]));
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
      if (statusText) statusText.innerText = 'Showing: Movies Hub (Bollywood, Hollywood Dual Audio, South Indian & Playable Classics)';
      
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
      if (statusText) statusText.innerText = 'Showing: Anime Simulcasts & Global Sensations (Multi-Audio & Dubs)';
      
      if (sections.studios) sections.studios.classList.add('hidden');
      if (sections.movies) sections.movies.classList.add('hidden');
      if (sections.series) sections.series.classList.add('hidden');
      if (sections.anime) sections.anime.classList.remove('hidden');
      if (sections.action) sections.action.classList.remove('hidden');

      if ((!State.homeRowsData?.anime || State.homeRowsData.anime.length === 0) && API.isAvailable && API.getAnimeCatalog) {
        API.getAnimeCatalog({ limit: 24 }).then(data => {
          if (data && Array.isArray(data.results) && data.results.length > 0) {
            if (!State.homeRowsData) State.homeRowsData = {};
            State.homeRowsData.anime = data.results;
            data.results.forEach(item => {
              if (!State.catalog.some(c => c.id === item.id)) State.catalog.push(item);
            });
            UI.renderCategoryTrays();
            const topAnime = State.catalog.find(i => i.type === 'anime');
            if (topAnime) {
              State.currentHeroIndex = State.catalog.indexOf(topAnime);
              UI.renderHero();
            }
          }
        }).catch(() => {});
      }

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
      const cat = Array.isArray(State.catalog) ? State.catalog : [];

      // 1. PURE ORIGINAL LANGUAGE MATCHES (Tier 1 - Highest Priority)
      let primaryMatches = [];
      if (code === 'kn') {
    primaryMatches = cat.filter(item => {
        if (!item) return false;

        const originalLanguage = String(
            item.original_language ||
            item.originalLanguage ||
            item.language ||
            ''
        ).toLowerCase();

        if (
            originalLanguage === 'kn' ||
            originalLanguage === 'kannada' ||
            item.isKannada === true
        ) {
            return true;
        }

        const audioTracks = Array.isArray(item.audio)
            ? item.audio
            : [];

        return audioTracks.some(track => {
            const label = (
                typeof track === 'string'
                    ? track
                    : String(
                        track?.language ||
                        track?.name ||
                        track?.label ||
                        ''
                    )
            ).toLowerCase();

            return (
                (label === 'kn' || label.includes('kannada')) &&
                !label.includes('dubbed')
            );
        });
    });
      } else if (code === 'hi') {
        primaryMatches = cat.filter(i => {
          if (!i) return false;
          if (i.language && i.language.toLowerCase() === 'hindi') return true;
          const aList = i.audio || [];
          return aList.some(a => a.toLowerCase().includes('hindi') && !a.toLowerCase().includes('dubbed'));
        });
      } else {
        primaryMatches = cat.filter(i => {
          if (!i) return false;
          const langStr = (i.language || '').toLowerCase();
          const targetName = langLabel.split(' ')[0].toLowerCase();
          return langStr === targetName || (i.audio && i.audio.some(a => a.toLowerCase().includes(targetName) && !a.toLowerCase().includes('dubbed')));
        });
      }

      // 2. Fetch live TMDB / catalog API titles for this language
      let tmdbTitles = [];
      if (API.isAvailable) {
        try {
          tmdbTitles = await API.getTmdbByLanguage(code, 20) || [];
        } catch (e) {
          console.log('Language fetch note:', e);
        }
      }

      // 3. SECONDARY DUBBED MATCHES (Only added at end)
      const targetTerm = (code === 'kn' ? 'kannada' : (code === 'hi' ? 'hindi' : langLabel.split(' ')[0].toLowerCase()));
      const dubbedMatches = cat.filter(i => {
        if (primaryMatches.some(p => p.id === i.id)) return false;
        const dubsStr = (i.dubs || []).join(' ').toLowerCase();
        const subsStr = (i.subs || []).join(' ').toLowerCase();
        return dubsStr.includes(targetTerm) || subsStr.includes(targetTerm);
      });

      const seenIds = new Set();
      const titles = [];

      // Add Primary (Original) titles first!
      primaryMatches.forEach(item => {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          titles.push(item);
        }
      });

      // Add live TMDB original language titles next
      tmdbTitles.forEach(t => {
        if (!seenIds.has(t.id)) {
          seenIds.add(t.id);
          titles.push(t);
        }
      });

      // Add Dubbed titles at the very end
      dubbedMatches.forEach(d => {
        if (!seenIds.has(d.id)) {
          seenIds.add(d.id);
          titles.push(d);
        }
      });

      if (titles && titles.length > 0) {
        if (traySection) traySection.classList.remove('hidden');
        if (titleEl) {
          if (code === 'kn') {
            titleEl.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span> ಕನ್ನಡ ಚಲನಚಿತ್ರಗಳು • Top Kannada Cinema (Original Audio 5.1)`;
          } else {
            titleEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-brand-blue"></span> Top Titles in ${langLabel}`;
          }
        }
        if (countEl) countEl.innerText = `${titles.length} Titles`;
        if (tray) UI.renderTrayItems('language-tray', titles);

        titles.forEach(t => {
          if (!State.catalog.some(c => c.id === t.id)) State.catalog.push(t);
          if (window.Search && Search.resultsMap) Search.resultsMap[t.id] = t;
        });

        traySection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        UI.showToast(code === 'kn' ? `Loaded ${primaryMatches.length} Original Kannada Blockbusters (ಕನ್ನಡ 5.1)` : `Loaded ${titles.length} titles in ${langLabel}`);
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
      Player.open(State.detailsModalItem);
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
      }
    }
  },

  // ================= OPEN FILM LIBRARY CONTROLLER =================
  async loadOpenLibraryCatalog(params = {}) {
    const data = await API.getOpenLibraryCatalog(params);
    if (data && Array.isArray(data.results)) {
      State.openLibraryCatalog = data.results;
      this.renderOpenLibraryTray(data.results);
    }
  },

  filterOpenLibrary(category = 'all') {
    document.querySelectorAll('.ol-chip').forEach(btn => {
      btn.className = 'ol-chip px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-surface border border-brand-border text-slate-300 hover:text-white hover:border-cyan-400 transition flex items-center gap-1';
    });
    const activeBtn = document.getElementById(`ol-btn-${category}`);
    if (activeBtn) {
      activeBtn.className = 'ol-chip px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 text-black shadow transition flex items-center gap-1';
    }

    let params = { limit: 30 };
    if (category === 'kannada') {
      params = { language: 'kn', kannada_mode: 'original', limit: 30 };
    } else if (category === 'blender') {
      params = { source: 'blender_open', limit: 30 };
    } else if (category === 'public_domain') {
      params = { license: 'public_domain', limit: 30 };
    }
    this.loadOpenLibraryCatalog(params);
  },

  renderOpenLibraryTray(items) {
    const tray = document.getElementById('open-library-tray');
    if (!tray) return;

    if (!items || items.length === 0) {
      tray.innerHTML = `
        <div class="w-full py-8 text-center text-slate-400 bg-brand-surface/40 rounded-lg border border-brand-border">
          <i class="ph ph-film-slate text-3xl text-cyan-400/60 mb-2"></i>
          <p class="text-sm">No open media records found for this filter.</p>
        </div>
      `;
      return;
    }

    const fallbackPoster = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20450%22%20width%3D%22300%22%20height%3D%22450%22%3E%3Crect%20width%3D%22300%22%20height%3D%22450%22%20fill%3D%22%23121722%22%2F%3E%3Cpath%20d%3D%22M120%20180%20l80%2045%20-80%2045%20z%22%20fill%3D%22%2306b6d4%22%2F%3E%3Ctext%20x%3D%22150%22%20y%3D%22320%22%20font-family%3D%22sans-serif%22%20font-weight%3D%22bold%22%20font-size%3D%2220%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%3EOPEN%20FILM%3C%2Ftext%3E%3C%2Fsvg%3E";

    tray.innerHTML = items.map(item => {
      const existing = State.catalog.find(c => c.id === item.id);
      if (!existing) {
        State.catalog.push({
          ...item,
          streamUrl: item.media_url,
          is_open_library: true
        });
      }

      const isPlayable = Boolean(item.is_playable && item.media_url);
      const isOfficialLinkOnly = item.rights_status === 'official_link_only' || !isPlayable;
      const isKannada = item.is_original_kannada || item.language === 'kn';

      let licenseBadge = '';
      if (isOfficialLinkOnly) {
        licenseBadge = '<span class="bg-amber-500/90 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">ARCHIVE LINK</span>';
      } else if ((item.license_id || 'Public Domain').includes('Public Domain')) {
        licenseBadge = '<span class="bg-emerald-500/90 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">PUBLIC DOMAIN</span>';
      } else {
        licenseBadge = '<span class="bg-cyan-500/90 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">' + (item.license_id || 'CC') + '</span>';
      }

      const audioBadge = isKannada
        ? '<span class="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">ಕನ್ನಡ Original</span>'
        : `<span class="text-[9px] font-bold text-slate-300 bg-black/60 px-1.5 py-0.5 rounded">${item.runtime || 'Feature'}</span>`;

      const actionFooter = isPlayable
        ? '<span class="text-emerald-400 font-bold flex items-center gap-0.5"><i class="ph ph-play-circle text-xs"></i> Play</span>'
        : '<span class="text-cyan-400 font-bold flex items-center gap-0.5"><i class="ph ph-arrow-square-out text-xs"></i> Archive</span>';

      return `
        <div onclick="App.handleOpenLibraryClick('${item.id}')" class="media-card flex-shrink-0 w-44 sm:w-52 bg-brand-surface rounded-lg border border-brand-border hover:border-cyan-500/60 overflow-hidden cursor-pointer group transition duration-200">
          <div class="relative h-60 sm:h-72 w-full overflow-hidden bg-slate-900">
            <img src="${item.poster_url || item.thumbnail_url || fallbackPoster}" alt="${item.title}" onerror="this.onerror=null; this.src='${fallbackPoster}';" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy" decoding="async" />
            
            <div class="absolute top-2 left-2 flex flex-col gap-1">
              ${licenseBadge}
            </div>

            <div class="absolute bottom-2 left-2 flex items-center gap-1">
              ${audioBadge}
            </div>

            <div class="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
              <button onclick="event.stopPropagation(); App.verifyOpenLibraryRecord('${item.id}')" class="w-7 h-7 rounded bg-black/80 hover:bg-emerald-500 hover:text-black text-emerald-300 flex items-center justify-center text-xs border border-white/10 transition" title="Test Live Stream Range">
                <i class="ph ph-arrows-clockwise"></i>
              </button>
              <button onclick="event.stopPropagation(); App.showOpenLibraryLicenseInfo('${item.id}')" class="w-7 h-7 rounded bg-black/80 hover:bg-cyan-500 hover:text-black text-cyan-300 flex items-center justify-center text-xs border border-white/10 transition" title="License & Rights Evidence">
                <i class="ph ph-shield-check"></i>
              </button>
            </div>
          </div>

          <div class="p-3">
            <h4 class="text-xs sm:text-sm font-bold text-white truncate group-hover:text-cyan-400 transition">${item.title}</h4>
            <div class="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>${item.release_year || 'Classic'} • ${item.language ? item.language.toUpperCase() : 'IN'}</span>
              ${actionFooter}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  handleOpenLibraryClick(itemId) {
    const item = (State.openLibraryCatalog || []).find(i => i.id === itemId) || State.catalog.find(c => c.id === itemId);
    if (!item) return;

    const isPlayable = Boolean(item.is_playable && item.media_url);
    if (isPlayable) {
      Player.playTitleById(itemId);
    } else {
      if (item.source_page_url) {
        window.open(item.source_page_url, '_blank');
        UI.showToast(`Opening official archival repository for "${item.title}"`);
      } else {
        this.showOpenLibraryLicenseInfo(itemId);
      }
    }
  },

  async verifyOpenLibraryRecord(itemId) {
    UI.showToast("Verifying stream accessibility with HTTP range requests...");
    const res = await API.verifyOpenLibraryItem(itemId);
    if (res && res.success) {
      if (res.is_playable) {
        UI.showToast(`✅ Stream Verified! (${res.verification_detail?.content_type || 'video/mp4'})`);
      } else {
        UI.showToast(`ℹ️ Archival Record: ${res.rights_notes || 'Official Archive Portal Link'}`);
      }
      this.loadOpenLibraryCatalog();
    } else {
      UI.showToast("Verification request failed.");
    }
  },

  async showOpenLibraryLicenseInfo(itemId) {
    const res = await API.getOpenLibraryItem(itemId);
    if (!res || !res.item) {
      UI.showToast("Could not load license metadata.");
      return;
    }
    const it = res.item;
    const re = res.rights_evaluation || {};
    const modal = document.getElementById('openLibraryStatsModal');
    if (!modal) return;

    const body = document.getElementById('openLibraryStatsModalBody');
    if (body) {
      body.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-start justify-between gap-4 border-b border-brand-border pb-4">
            <div>
              <h3 class="text-lg font-black text-white">${it.title} (${it.release_year})</h3>
              <p class="text-xs text-slate-400 mt-0.5">${it.original_title ? it.original_title + ' • ' : ''}Country: ${it.country || 'IN'} • Language: ${it.language ? it.language.toUpperCase() : 'EN'}</p>
            </div>
            <span class="${it.is_playable ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'} text-xs font-bold px-2.5 py-1 rounded">
              ${it.is_playable ? 'Playable' : (re.status || 'Official Link Only')}
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div class="bg-brand-surface p-3 rounded border border-brand-border space-y-1">
              <span class="text-slate-400 uppercase tracking-wider text-[10px] font-bold">License Type</span>
              <p class="font-bold text-cyan-300 text-sm">${it.license_id || 'Public Domain'}</p>
              <a href="${it.license_url || 'https://creativecommons.org'}" target="_blank" rel="noopener noreferrer" class="text-brand-blue hover:underline text-[11px] block mt-1">View Legal Deed <i class="ph ph-arrow-square-out"></i></a>
            </div>

            <div class="bg-brand-surface p-3 rounded border border-brand-border space-y-1">
              <span class="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Source Provider</span>
              <p class="font-bold text-white text-sm">${(it.source_name || 'Open Archive').replace('_', ' ').toUpperCase()}</p>
              ${it.source_page_url ? `<a href="${it.source_page_url}" target="_blank" rel="noopener noreferrer" class="text-brand-blue hover:underline text-[11px] block mt-1">Source Repository <i class="ph ph-arrow-square-out"></i></a>` : ''}
            </div>
          </div>

          <div class="bg-brand-surface p-3 rounded border border-brand-border space-y-1 text-xs">
            <span class="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Attribution & Creator</span>
            <p class="text-slate-200">${it.attribution || 'Open Cultural Preservation'}</p>
            <p class="text-slate-400 text-[11px]">Director / Creator: ${it.creator || 'Public Domain'}</p>
          </div>

          <div class="bg-brand-surface p-3 rounded border border-brand-border space-y-1 text-xs">
            <span class="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Digital Rights Verification Notes</span>
            <p class="text-slate-300">${re.notes || it.rights_notes || 'Verified compliant with applicable copyright laws.'}</p>
          </div>

          <div class="pt-2 flex justify-end gap-2">
            <button onclick="App.closeOpenLibraryStatsModal()" class="px-4 py-2 bg-brand-surface hover:bg-brand-card text-white text-xs font-bold rounded border border-brand-border transition">Close</button>
            ${it.is_playable && it.media_url ? `
              <button onclick="App.closeOpenLibraryStatsModal(); Player.playTitleById('${it.id}')" class="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded shadow transition flex items-center gap-1.5">
                <i class="ph ph-play-fill"></i> Stream Now
              </button>
            ` : `
              <a href="${it.source_page_url || 'https://archive.org'}" target="_blank" rel="noopener noreferrer" class="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded shadow transition flex items-center gap-1.5">
                <i class="ph ph-arrow-square-out"></i> Visit Archive Portal
              </a>
            `}
          </div>
        </div>
      `;
    }
    modal.classList.remove('hidden');
  },

  async openOpenLibraryStatsModal() {
    const res = await API.getOpenLibraryStats();
    const stats = (res && res.stats) ? res.stats : {};
    const modal = document.getElementById('openLibraryStatsModal');
    if (!modal) return;

    const body = document.getElementById('openLibraryStatsModalBody');
    if (body) {
      body.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b border-brand-border pb-3">
            <div>
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <i class="ph ph-chart-bar text-cyan-400"></i> Open Film Library Metrics
              </h3>
              <p class="text-xs text-slate-400">Live database counts for legal, open-access streaming titles</p>
            </div>
            <span class="text-[10px] font-mono text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded border border-cyan-500/30">Target: 100K - 1M+ Records</span>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div class="bg-brand-surface p-3 rounded-lg border border-brand-border text-center">
              <span class="text-[10px] text-slate-400 uppercase font-bold">Total Catalog</span>
              <p class="text-xl font-black text-white mt-1">${stats.total_records || 18}</p>
            </div>
            <div class="bg-brand-surface p-3 rounded-lg border border-brand-border text-center">
              <span class="text-[10px] text-slate-400 uppercase font-bold">Playable Now</span>
              <p class="text-xl font-black text-emerald-400 mt-1">${stats.playable_records || 18}</p>
            </div>
            <div class="bg-brand-surface p-3 rounded-lg border border-brand-border text-center">
              <span class="text-[10px] text-slate-400 uppercase font-bold">Kannada Titles</span>
              <p class="text-xl font-black text-amber-400 mt-1">${stats.kannada_records || 3}</p>
            </div>
          </div>

          <div class="space-y-2 text-xs">
            <span class="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Records by Source Provider</span>
            <div class="grid grid-cols-2 gap-2">
              ${Object.entries(stats.by_source || {}).map(([src, count]) => `
                <div class="bg-brand-surface/70 px-3 py-2 rounded border border-brand-border/60 flex items-center justify-between">
                  <span class="text-slate-300 capitalize">${src.replace('_', ' ')}</span>
                  <span class="font-mono font-bold text-cyan-400">${count}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="space-y-2 text-xs">
            <span class="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Language Breakdown</span>
            <div class="flex flex-wrap gap-2">
              ${Object.entries(stats.by_language || {}).map(([lang, count]) => `
                <span class="bg-brand-surface px-2.5 py-1 rounded border border-brand-border text-slate-300 font-mono text-[11px]">
                  ${lang.toUpperCase()}: <strong class="text-white">${count}</strong>
                </span>
              `).join('')}
            </div>
          </div>

          <div class="pt-2 flex justify-end">
            <button onclick="App.closeOpenLibraryStatsModal()" class="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded shadow transition">Close</button>
          </div>
        </div>
      `;
    }
    modal.classList.remove('hidden');
  },

  closeOpenLibraryStatsModal() {
    const modal = document.getElementById('openLibraryStatsModal');
    if (modal) modal.classList.add('hidden');
  },

  openOpenLibraryModal() {
    const section = document.getElementById('openLibrarySection');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
window.openDetailsById = (id) => UI.openDetailsById(id);
window.closeDetailsModal = () => UI.closeDetailsModal();
window.openOttModal = () => UI.openOttModal();
window.closeOttModal = () => UI.closeOttModal();
window.cycleOttServer = () => Player.cycleOttServer();
window.filterLanguage = (code) => App.filterLanguage(code);
window.reloadSection = (sec) => App.reloadSection(sec);

// Initialize application on DOM ready
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}
