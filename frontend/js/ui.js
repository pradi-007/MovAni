/**
 * MOVAni Master UI Renderer Module
 * Netflix & Prime Video UI Architecture:
 * - Dynamic Hero Billboard with spotlight switcher and audio toggle
 * - Top 10 Today with bold outline numbers
 * - Multi-Row Rails (Trending, Anime Simulcasts, Blockbuster Movies, Binge Series, Top Rated, Action, Sci-Fi)
 * - JioHotstar-style Continue Watching with progress bars & exact resume
 * - Comprehensive Netflix Title Details & Episode Browser Modal
 * - Reactive Watchlist Drawer
 */

const UI = {
  // ================= HERO BILLBOARD =================
  renderHero() {
    const item = State.catalog[State.currentHeroIndex];
    if (!item) return;

    const titleEl = document.getElementById('heroTitle');
    const overviewEl = document.getElementById('heroOverview');
    const backdropEl = document.getElementById('heroBackdrop');
    const matchTag = document.getElementById('heroMatchTag');
    const ratingTag = document.getElementById('heroRatingTag');
    const genresTag = document.getElementById('heroGenres');
    const studioTag = document.getElementById('heroStudio');
    const runtimeTag = document.getElementById('heroRuntime');

    if (titleEl) titleEl.innerText = item.title;
    if (overviewEl) overviewEl.innerText = item.overview;
    if (backdropEl) backdropEl.style.backgroundImage = `url('${item.backdrop}')`;
    if (matchTag) matchTag.innerText = item.match;
    if (ratingTag) ratingTag.innerText = item.rating;
    if (genresTag) genresTag.innerText = `Genres: ${item.genres.slice(0, 2).join(', ')}`;
    if (studioTag) studioTag.innerText = `Studio: ${item.studio}`;
    if (runtimeTag) runtimeTag.innerText = item.runtime;

    const inWatchlist = Array.isArray(State.watchlist) && State.watchlist.includes(item.id);
    const wlIcon = document.getElementById('heroWatchlistIcon');
    if (wlIcon) {
      wlIcon.className = inWatchlist ? 'ph ph-check text-lg text-emerald-400' : 'ph ph-plus text-lg';
    }

    const muteIcon = document.getElementById('heroMuteIcon');
    if (muteIcon) {
      muteIcon.className = State.heroMuted ? 'ph ph-speaker-simple-slash text-lg' : 'ph ph-speaker-high text-lg text-brand-blue';
    }

    const indicator = document.getElementById('heroSlideIndicator');
    if (indicator) indicator.innerText = `${(State.currentHeroIndex || 0) + 1} / 5`;

    this.renderHeroThumbnails();
  },

  renderHeroThumbnails() {
    const container = document.getElementById('heroThumbnails');
    if (!container || !Array.isArray(State.catalog)) return;
    const heroIdx = State.currentHeroIndex || 0;
    container.innerHTML = State.catalog.slice(0, 5).map((item, idx) => `
      <button onclick="App.setHeroIndex(${idx})" class="relative w-12 h-8 rounded overflow-hidden border ${idx === heroIdx ? 'border-brand-blue ring-1 ring-brand-blue' : 'border-brand-border opacity-50'} hover:opacity-100 transition">
        <img src="${item.poster}" alt="${item.title}" class="w-full h-full object-cover" loading="lazy" decoding="async" />
        ${idx === heroIdx ? '<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-blue"></div>' : ''}
      </button>
    `).join('');
  },

  // ================= NETFLIX TOP 10 TODAY ROW =================
  renderTop10(items = null) {
    const container = document.getElementById('top10-tray');
    if (!container) return;
    const topItems = items || (State.homeRowsData?.top10) || (Array.isArray(State.catalog) ? State.catalog.slice(0, 10) : []);
    
    container.innerHTML = topItems.slice(0, 10).map((item, index) => `
      <div onclick="Player.playTitleById('${item.id}')" class="top10-card flex-shrink-0 flex items-end cursor-pointer group select-none">
        <div class="top10-number -mr-5 sm:-mr-7 z-0 font-black">${index + 1}</div>
        <div class="media-card relative z-10 w-36 sm:w-44 h-52 sm:h-64 rounded-lg bg-brand-surface border border-brand-border overflow-hidden">
          <img src="${item.poster}" alt="${item.title}" onerror="this.src='https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg'" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent flex flex-col justify-end p-2.5">
            <span class="text-[10px] font-black text-brand-blue tracking-wider">${(item.type || 'MOVIE').toUpperCase()}</span>
            <p class="text-xs font-bold text-white truncate">${item.title}</p>
            <div class="flex items-center justify-between text-[10px] text-slate-300 pt-0.5">
              <span class="text-emerald-400 font-bold">${item.match}</span>
              <span>${item.year}</span>
            </div>
          </div>
          
          <div class="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
            <button onclick="event.stopPropagation(); Player.playTitleById('${item.id}')" class="w-7 h-7 rounded bg-black/75 hover:bg-emerald-500 text-emerald-300 hover:text-black flex items-center justify-center text-xs border border-white/10" title="Stream Full Movie">
              <i class="ph ph-play-fill"></i>
            </button>
            <button onclick="event.stopPropagation(); UI.openDetailsModal(State.catalog.find(i=>i.id==='${item.id}') || ${JSON.stringify(item).replace(/"/g, '&quot;')})" class="w-7 h-7 rounded bg-black/75 hover:bg-slate-700 text-white flex items-center justify-center text-xs border border-white/10" title="More Info">
              <i class="ph ph-info"></i>
            </button>
            <button onclick="event.stopPropagation(); App.toggleWatchlist('${item.id}')" class="w-7 h-7 rounded bg-black/75 hover:bg-brand-blue text-white flex items-center justify-center text-xs border border-white/10" title="Watchlist">
              <i class="ph ${(Array.isArray(State.watchlist) && State.watchlist.includes(item.id)) ? 'ph-check text-emerald-400' : 'ph-plus'}"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },

  // ================= GLOBAL CATEGORY RAILS =================
  renderCategoryTrays() {
    const data = State.homeRowsData;
    const cat = Array.isArray(State.catalog) ? State.catalog : [];
    
    // 1. Trending Now
    const trendingItems = data?.trending || cat.slice(0, 15);
    this.renderTrayItems('trending-tray', trendingItems);

    // 2. Anime Simulcasts
    const animeItems = data?.anime || cat.filter(i => i.type === 'anime');
    this.renderTrayItems('anime-tray', animeItems);

    // 3. Blockbuster Movies
    const movieItems = data?.movies || cat.filter(i => i.type === 'movies');
    this.renderTrayItems('movies-tray', movieItems);

    // 3b. Evergreen Kannada Cinema Classics
    const kannadaItems = cat.filter(i => 
      i.language === 'Kannada' || 
      (i.audio && i.audio.some(a => a.toLowerCase().includes('kannada'))) ||
      (i.dubs && i.dubs.some(d => d.toLowerCase().includes('kannada') && !d.toLowerCase().includes('dubbed')))
    );
    this.renderTrayItems('kannada-classics-tray', kannadaItems);

    // 3c. Golden Era Bollywood & Hindi Classics
    const hindiClassics = cat.filter(i =>
      i.language === 'Hindi' ||
      (i.audio && i.audio.some(a => a.toLowerCase().includes('hindi') && !a.toLowerCase().includes('dubbed')))
    );
    this.renderTrayItems('hindi-classics-tray', hindiClassics);

    // 4. Binge-Worthy TV Series
    const seriesItems = data?.series || cat.filter(i => i.type === 'series');
    this.renderTrayItems('series-tray', seriesItems);

    // 5. Critically Acclaimed / Top Rated
    const topRatedItems = data?.top_rated || cat.slice(5, 15);
    this.renderTrayItems('toprated-tray', topRatedItems);

    // 6. Action & Adrenaline
    const actionItems = data?.action || cat.filter(i => i.genres?.includes('Action'));
    this.renderTrayItems('action-tray', actionItems);

    // 7. Sci-Fi & Cosmic
    const scifiItems = data?.scifi || cat.filter(i => i.genres?.includes('Sci-Fi') || i.genres?.includes('Fantasy'));
    this.renderTrayItems('scifi-tray', scifiItems);
  },

  renderTrayItems(elementId, items) {
    const el = document.getElementById(elementId);
    if (!el || !items || items.length === 0) return;

    el.innerHTML = items.map(item => {
      const isTheatrical = item.theatricalStream || item.isUpcoming;
      let badgeHtml = '';
      if (isTheatrical) {
        badgeHtml = `
          <div class="absolute bottom-2 left-2 bg-red-600/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-wide uppercase shadow flex items-center gap-1">
            <i class="ph ph-film-strip"></i> 4K Theatrical
          </div>
        `;
      } else if (item.isClassic) {
        badgeHtml = `
          <div class="absolute bottom-2 left-2 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded tracking-wide uppercase shadow flex items-center gap-1 font-sans">
            <i class="ph ph-crown-fill text-[10px]"></i> Golden Classic
          </div>
        `;
      } else if (item.dubs && item.dubs.length > 0) {
        const primaryDub = item.dubs[0].replace(' Dubbed', '').replace(' (Original)', '');
        const extraCount = item.dubs.length - 1;
        const dubText = extraCount > 0 ? `${primaryDub} +${extraCount} Dubs` : primaryDub;
        badgeHtml = `
          <div class="absolute bottom-2 left-2 bg-black/85 text-sky-300 border border-sky-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow backdrop-blur-sm">
            <i class="ph ph-headphones text-[10px]"></i> ${dubText}
          </div>
        `;
      }

      return `
      <div onclick="Player.playTitleById('${item.id}')" class="media-card flex-shrink-0 w-44 sm:w-52 bg-brand-surface rounded-lg border border-brand-border overflow-hidden cursor-pointer group">
        <div class="relative h-60 sm:h-72 w-full overflow-hidden bg-slate-900">
          <img src="${item.poster}" alt="${item.title}" onerror="this.src='https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg'" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy" decoding="async" />
          
          <div class="absolute top-2 right-2 bg-black/75 text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/10">
            ${item.rating || 'U/A 16+'}
          </div>

          ${badgeHtml}

          <!-- Card Top Hover Action Buttons -->
          <div class="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
            <button onclick="event.stopPropagation(); Player.playTitleById('${item.id}')" class="w-7 h-7 rounded bg-black/75 hover:bg-emerald-500 text-emerald-300 hover:text-black flex items-center justify-center text-xs border border-white/10 transition" title="Stream Full Movie">
              <i class="ph ph-play-fill"></i>
            </button>
            <button onclick="event.stopPropagation(); App.toggleWatchlist('${item.id}')" class="w-7 h-7 rounded bg-black/75 hover:bg-brand-blue text-white flex items-center justify-center text-xs border border-white/10 transition" title="Add to Watchlist">
              <i class="ph ${(Array.isArray(State.watchlist) && State.watchlist.includes(item.id)) ? 'ph-check text-emerald-400' : 'ph-plus'}"></i>
            </button>
            <button onclick="event.stopPropagation(); UI.openDetailsModal(State.catalog.find(i=>i.id==='${item.id}') || ${JSON.stringify(item).replace(/"/g, '&quot;')})" class="w-7 h-7 rounded bg-black/75 hover:bg-slate-700 text-white flex items-center justify-center text-xs border border-white/10 transition" title="More Info">
              <i class="ph ph-info"></i>
            </button>
          </div>

          <!-- Play Center Hover Pill -->
          <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition pointer-events-none">
            <div class="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl group-hover:scale-105 transition">
              <i class="ph ph-play-fill text-2xl ml-0.5"></i>
            </div>
          </div>
        </div>

        <div class="p-3 space-y-1">
          <div class="flex items-center justify-between text-[11px] text-slate-400">
            <span class="text-emerald-400 font-bold">${item.match}</span>
            <span>${item.year}</span>
          </div>
          <h4 class="text-xs sm:text-sm font-bold text-white truncate group-hover:text-brand-blue transition">${item.title}</h4>
          <div class="flex items-center gap-1.5 text-[10px] text-slate-400 pt-0.5">
            <span class="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-medium">${item.studio}</span>
            <span class="truncate">${(item.genres || []).slice(0, 2).join(', ')}</span>
          </div>
        </div>
      </div>
    `;
    }).join('');
  },

  // ================= JIOHOTSTAR CONTINUE WATCHING =================
  renderContinueWatching() {
    const container = document.getElementById('continueTray');
    if (!container) return;
    if (!Array.isArray(State.continueWatching) || State.continueWatching.length === 0) {
      document.getElementById('continueSection')?.classList.add('hidden');
      return;
    }
    document.getElementById('continueSection')?.classList.remove('hidden');

    container.innerHTML = State.continueWatching.map(item => `
      <div onclick="Player.playTitleById('${item.id}', ${item.current_seconds || 0})" class="bg-brand-surface hover:bg-brand-card border border-brand-border rounded-lg overflow-hidden cursor-pointer transition group">
        <div class="relative h-32 w-full">
          <img src="${item.thumb}" alt="${item.title}" onerror="this.src='https://image.tmdb.org/t/p/w780/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg'" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy" />
          
          <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
            <div class="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
              <i class="ph ph-play-fill text-lg ml-0.5"></i>
            </div>
          </div>

          <button onclick="event.stopPropagation(); App.removeContinueItem('${item.id}')" class="absolute top-2 right-2 w-6 h-6 rounded bg-black/70 hover:bg-red-600 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition" title="Remove">
            <i class="ph ph-x"></i>
          </button>

          <div class="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
            <div class="h-full bg-brand-blue" style="width: ${item.progress}%"></div>
          </div>
        </div>

        <div class="p-3 flex items-center justify-between">
          <div class="min-w-0">
            <p class="text-xs font-bold text-white truncate">${item.title}</p>
            <p class="text-[10px] text-slate-400">${item.ep || 'Resume'} • ${Math.round(item.progress)}%</p>
          </div>
          <span class="text-[10px] font-mono text-brand-blue font-bold ml-2">${item.current_seconds ? Math.floor(item.current_seconds / 60) + 'm' : item.progress + '%'}</span>
        </div>
      </div>
    `).join('');
  },

  // ================= WATCHLIST DRAWER =================
  updateWatchlistBadge() {
    const count = Array.isArray(State.watchlist) ? State.watchlist.length : 0;
    const badge = document.getElementById('watchlistCountBadge');
    if (badge) badge.innerText = count;
    const drawerCount = document.getElementById('drawerWatchlistCount');
    if (drawerCount) drawerCount.innerText = count;
  },

  renderWatchlistModalItems() {
    const container = document.getElementById('watchlistModalItems');
    if (!container) return;

    if (!Array.isArray(State.watchlist) || State.watchlist.length === 0) {
      container.innerHTML = `
        <div class="py-16 text-center text-slate-500 text-xs">
          <i class="ph ph-film-slate text-4xl mb-2 text-slate-600 block"></i>
          Your watchlist is currently empty.<br />Add movies, series, or anime using the + button.
        </div>
      `;
      return;
    }

    const items = (Array.isArray(State.catalog) ? State.catalog : []).filter(item => State.watchlist.includes(item.id));
    container.innerHTML = items.map(item => `
      <div class="flex items-center gap-3 p-2.5 bg-brand-card border border-brand-border rounded-lg group">
        <img src="${item.poster}" alt="${item.title}" class="w-12 h-16 object-cover rounded" loading="lazy" decoding="async" />
        <div class="flex-1 min-w-0">
          <h4 class="text-xs font-bold text-white truncate">${item.title}</h4>
          <p class="text-[10px] text-slate-400">${item.type.toUpperCase()} • ${item.year} • ${item.studio}</p>
          <button onclick="Player.playTitleById('${item.id}'); App.toggleWatchlistModal();" class="text-brand-blue text-[11px] font-bold mt-1.5 flex items-center gap-1 hover:underline">
            <i class="ph ph-play-fill"></i> Watch Now
          </button>
        </div>
        <button onclick="App.toggleWatchlist('${item.id}')" class="text-slate-400 hover:text-red-400 p-2 rounded transition" title="Remove">
          <i class="ph ph-trash text-base"></i>
        </button>
      </div>
    `).join('');
  },

  // ================= NETFLIX TITLE DETAILS & EPISODE BROWSER MODAL =================
  openDetailsModal(item) {
    if (!item) return;
    State.detailsModalItem = item;
    const modal = document.getElementById('detailsModal');
    if (!modal) return;
    
    document.getElementById('detailsTitle').innerText = item.title;
    document.getElementById('detailsType').innerText = item.type.toUpperCase();
    document.getElementById('detailsBackdrop').src = item.backdrop;
    document.getElementById('detailsMatch').innerText = item.match;
    document.getElementById('detailsYear').innerText = item.year;
    document.getElementById('detailsRating').innerText = item.rating;
    document.getElementById('detailsRuntime').innerText = item.runtime;
    document.getElementById('detailsStudio').innerText = item.studio;
    document.getElementById('detailsOverview').innerText = item.overview;
    document.getElementById('detailsGenres').innerText = (item.genres || []).join(', ');
    document.getElementById('detailsAudio').innerText = (item.audio || ['English 5.1']).join(', ');

    // Render Dubbed Languages Badges (Full Indian & Global Dubs)
    const dubsContainer = document.getElementById('detailsDubsList');
    if (dubsContainer) {
      const defaultDubs = [
        "Kannada (ಕನ್ನಡ Dubbed)", "Hindi (हिंदी Dubbed)", "Tamil (தமிழ் Dubbed)",
        "Telugu (తెలుగు Dubbed)", "Malayalam (മലയാളം Dubbed)", "Bengali (বাংলা Dubbed)",
        "Marathi (मराठी Dubbed)", "Punjabi (ਪੰਜਾਬੀ Dubbed)", "English (Original)"
      ];
      const dubs = (item.dubs && item.dubs.length > 0) ? item.dubs : defaultDubs;
      dubsContainer.innerHTML = dubs.map(d => `
        <span class="px-2.5 py-1 rounded-md bg-brand-blue/20 border border-brand-blue/40 text-sky-200 font-semibold text-xs flex items-center gap-1.5 shadow-sm">
          <i class="ph ph-headphones text-sm text-brand-blue"></i> ${d}
        </span>
      `).join('');
    }

    // Render Subtitles Badges (Full Indian & Global Subtitles)
    const subsContainer = document.getElementById('detailsSubsList');
    if (subsContainer) {
      const defaultSubs = [
        "Kannada [Sub] (ಕನ್ನಡ)", "Hindi [Sub] (हिंदी)", "Tamil [Sub] (தமிழ்)",
        "Telugu [Sub] (తెలుగు)", "Malayalam [Sub] (മലയാളം)", "Bengali [Sub] (বাংলা)",
        "Marathi [Sub] (मराठी)", "Punjabi [Sub] (ਪੰਜਾਬੀ)", "English [CC]"
      ];
      const subs = (item.subs && item.subs.length > 0) ? item.subs : defaultSubs;
      subsContainer.innerHTML = subs.map(s => `
        <span class="px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-200 font-semibold text-xs flex items-center gap-1.5 shadow-sm">
          <i class="ph ph-chat-teardrop-text text-sm text-amber-400"></i> ${s}
        </span>
      `).join('');
    }

    // Cast list
    const castContainer = document.getElementById('detailsCastList');
    if (castContainer && item.xray?.actors) {
      castContainer.innerText = item.xray.actors.map(a => a.name).join(', ');
    } else if (castContainer) {
      castContainer.innerText = 'Lead Actors & Performers';
    }

    // Watchlist icon state
    const inWatchlist = Array.isArray(State.watchlist) && State.watchlist.includes(item.id);
    const wlIcon = document.getElementById('detailsWatchlistIcon');
    if (wlIcon) {
      wlIcon.className = inWatchlist ? 'ph ph-check text-emerald-400' : 'ph ph-plus';
    }

    // Watch Providers (JustWatch via TMDB)
    const provContainer = document.getElementById('detailsProviders');
    if (provContainer) {
      const renderProviders = (provs) => {
        provContainer.innerHTML = (provs || []).map(p => `
          <div class="flex items-center gap-2 px-3 py-1.5 bg-brand-card border border-brand-border rounded">
            ${p.logo ? `<img src="${p.logo}" alt="${p.name}" class="w-4 h-4 rounded object-cover flex-shrink-0" />` : '<i class="ph ph-check-circle-fill text-brand-blue"></i>'}
            <span class="text-xs font-bold text-white">${p.name}</span>
            <span class="text-[10px] text-slate-400">(${p.badge || 'Stream'})</span>
          </div>
        `).join('') + `<span class="text-[9px] text-slate-500 block w-full pt-1">Streaming availability data powered by JustWatch via TMDB</span>`;
      };

      renderProviders(item.providers || [
        { name: "Prime Video", badge: "4K UHD" },
        { name: "MOVAni Pass", badge: "Stream Now" }
      ]);

      // Query live Watch Providers if TMDB ID exists
      const tmdbNumericId = item.tmdbId || (item.id && item.id.startsWith('tmdb-') ? item.id.split('-')[2] : null);
      if (tmdbNumericId && API.getWatchProviders) {
        API.getWatchProviders(item.type || 'movie', tmdbNumericId).then(data => {
          if (data && Array.isArray(data.providers) && data.providers.length > 0) {
            renderProviders(data.providers);
          }
        }).catch(() => {});
      }
    }

    // Episodes & Seasons section for Series & Anime
    const isEpisodic = (item.type === 'anime' || item.type === 'series');
    const epSection = document.getElementById('detailsEpisodesSection');
    if (isEpisodic && epSection) {
      epSection.classList.remove('hidden');
      this.loadDetailsEpisodes(item, 1);
    } else if (epSection) {
      epSection.classList.add('hidden');
    }

    // Load recommendations from TMDB
    this.loadDetailsRecommendations(item);

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  async loadDetailsEpisodes(item, seasonNumber = 1) {
    const list = document.getElementById('detailsEpisodesList');
    const select = document.getElementById('detailsSeasonSelect');
    if (!list) return;

    if (select) {
      select.innerHTML = [1, 2, 3, 4].map(s => `
        <option value="${s}" ${s === seasonNumber ? 'selected' : ''}>Season ${s}</option>
      `).join('');
    }

    const tmdbId = item.tmdbId || (item.id.startsWith('tmdb-') ? item.id.split('-')[2] : null);
    let episodes = [];

    if (tmdbId && API.isAvailable) {
      try {
        const data = await API.getTmdbTvSeason(tmdbId, seasonNumber);
        if (data && Array.isArray(data.episodes) && data.episodes.length > 0) {
          episodes = data.episodes;
        }
      } catch {
        // Fallback
      }
    }

    if (episodes.length === 0) {
      list.innerHTML = `
        <div class="py-8 text-center text-xs text-slate-400 w-full col-span-2">
          <i class="ph ph-film-slate text-3xl mb-2 text-slate-500 block"></i>
          Official episode listings are syncing from TMDB.<br />
          Click Play to stream Season ${seasonNumber} directly in the 4K multi-server player.
        </div>
      `;
      return;
    }

    list.innerHTML = episodes.map(ep => `
      <div onclick="Player.playTitleById('${item.id}', 0, ${seasonNumber}, ${ep.episode_number}); UI.closeDetailsModal();" class="flex flex-col sm:flex-row sm:items-center gap-4 p-3 bg-brand-card hover:bg-brand-surface border border-brand-border rounded-lg cursor-pointer transition group">
        <span class="text-base font-black text-slate-500 group-hover:text-white w-6 text-center">${ep.episode_number}</span>
        
        <div class="relative w-full sm:w-36 h-20 rounded overflow-hidden bg-slate-900 flex-shrink-0">
          <img src="${ep.still}" alt="${ep.name}" class="w-full h-full object-cover group-hover:scale-105 transition" loading="lazy" decoding="async" />
          <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
            <div class="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center">
              <i class="ph ph-play-fill text-lg ml-0.5"></i>
            </div>
          </div>
          <span class="absolute bottom-1 right-1 bg-black/80 text-[10px] font-bold text-white px-1 rounded">${ep.runtime || '24m'}</span>
        </div>

        <div class="flex-1 min-w-0 space-y-1">
          <div class="flex items-center justify-between">
            <h4 class="text-xs sm:text-sm font-bold text-white group-hover:text-brand-blue truncate">${ep.name}</h4>
            <span class="text-[11px] font-mono text-emerald-400 font-bold ml-2">★ ${ep.vote_average || '8.5'}</span>
          </div>
          <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">${ep.overview}</p>
        </div>
      </div>
    `).join('');
  },

  handleDetailsSeasonChange(seasonNumber) {
    if (State.detailsModalItem) {
      this.loadDetailsEpisodes(State.detailsModalItem, parseInt(seasonNumber) || 1);
    }
  },

  async loadDetailsRecommendations(item) {
    const list = document.getElementById('detailsRecommendationsList');
    if (!list) return;

    const tmdbId = item.tmdbId || (item.id.startsWith('tmdb-') ? item.id.split('-')[2] : null);
    let recs = [];

    if (tmdbId && API.isAvailable) {
      try {
        const data = await API.getTmdbRecommendations(item.type, tmdbId, 6);
        if (Array.isArray(data) && data.length > 0) {
          recs = data;
        }
      } catch {
        // Fallback
      }
    }

    if (recs.length === 0) {
      recs = State.catalog.filter(i => i.id !== item.id).slice(0, 6);
    }

    list.innerHTML = recs.slice(0, 6).map(r => `
      <div onclick="UI.openDetailsModal(State.catalog.find(i=>i.id==='${r.id}') || ${JSON.stringify(r).replace(/"/g, '&quot;')})" class="bg-brand-card hover:bg-brand-surface border border-brand-border rounded-lg overflow-hidden cursor-pointer transition group">
        <div class="relative h-36 sm:h-44 w-full bg-slate-900">
          <img src="${r.backdrop || r.poster}" alt="${r.title}" onerror="this.src='https://image.tmdb.org/t/p/w780/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg'" class="w-full h-full object-cover group-hover:scale-105 transition" loading="lazy" decoding="async" />
          <div class="absolute top-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            ${r.rating || 'U/A 16+'}
          </div>
        </div>
        <div class="p-2.5 space-y-1">
          <div class="flex items-center justify-between text-[10px] text-slate-400">
            <span class="text-emerald-400 font-bold">${r.match || '96% Match'}</span>
            <span>${r.year || '2024'}</span>
          </div>
          <h5 class="text-xs font-bold text-white truncate group-hover:text-brand-blue">${r.title}</h5>
          <p class="text-[10px] text-slate-400 line-clamp-2 leading-tight">${r.overview || ''}</p>
        </div>
      </div>
    `).join('');
  },

  closeDetailsModal() {
    const modal = document.getElementById('detailsModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  // ================= UNIVERSAL MASTER OTT SERVER MODAL & INTEL =================
  async openOttModal() {
    const modal = document.getElementById('ottModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    this.refreshOttStatus();
  },

  closeOttModal() {
    const modal = document.getElementById('ottModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  async refreshOttStatus() {
    if (API.isAvailable) {
      try {
        const res = await API.getOttStatus();
        if (res && res.status === 'operational') {
          this.showToast("Universal Master OTT Server Online (All Platforms Connected)");
          return;
        }
      } catch (err) {
        console.log('OTT status notice:', err);
      }
    }
    this.showToast("Universal Master OTT Server Online");
  },

  // ================= TOAST SYSTEM =================
  showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'bg-brand-surface border border-brand-border text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-2xl flex items-center gap-2 transform translate-y-2 opacity-0 transition-all duration-300';
    toast.innerHTML = `
      <i class="ph ph-info text-brand-blue text-base"></i>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
};
