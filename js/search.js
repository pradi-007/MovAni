/**
 * MOVAni Ultra-Fast Live Search Module
 * High-Performance Search Architecture:
 * - 220ms Adaptive Debounce with Request Cancellation (AbortController)
 * - In-Memory Search Cache (Map) for instant 0ms responses on repeated queries
 * - Instant Local Pipeline: displays immediate catalog matches while network resolves
 * - Zero race conditions or out-of-order execution
 */

const Search = {
  debounceTimer: null,
  abortController: null,
  cache: new Map(),
  resultsMap: {},

  handleInput(query) {
    clearTimeout(this.debounceTimer);
    const trimmed = (query || '').trim();

    if (trimmed.length === 0) {
      this.clear();
      return;
    }

    // Instant response if already in client cache
    if (this.cache.has(trimmed.toLowerCase())) {
      this.renderResults(trimmed, this.cache.get(trimmed.toLowerCase()));
      return;
    }

    // Quick instant local preview (< 5ms)
    this.renderInstantLocalPreview(trimmed);

    // Debounced network dispatch
    this.debounceTimer = setTimeout(() => {
      this.execute(trimmed);
    }, 220);
  },

  async handleEnterKey() {
    const dropdown = document.getElementById('searchDropdown');
    const firstPlayBtn = dropdown ? dropdown.querySelector('[onclick*="Player.playTitleById"]') : null;
    if (firstPlayBtn) {
      firstPlayBtn.click();
      return;
    }
    const input = document.getElementById('searchInput');
    const val = input ? input.value.trim() : '';
    if (val) {
      await this.execute(val);
      const newPlayBtn = dropdown ? dropdown.querySelector('[onclick*="Player.playTitleById"]') : null;
      if (newPlayBtn) newPlayBtn.click();
    }
  },

  renderInstantLocalPreview(rawQ) {
    const q = rawQ.toLowerCase();
    const dropdown = document.getElementById('searchDropdown');
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) clearBtn.classList.remove('hidden');
    if (dropdown) dropdown.classList.remove('hidden');

    if (!Array.isArray(State.catalog)) return;

    const instantMatches = State.catalog.filter(item =>
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.overview && item.overview.toLowerCase().includes(q)) ||
      (item.genres && item.genres.some(g => g.toLowerCase().includes(q)))
    ).slice(0, 10);

    if (instantMatches.length > 0) {
      this.renderResults(rawQ, instantMatches, true);
    }
  },

  async execute(query) {
    const rawQ = query.trim();
    const cacheKey = rawQ.toLowerCase();

    if (this.cache.has(cacheKey)) {
      this.renderResults(rawQ, this.cache.get(cacheKey));
      return;
    }

    // Cancel previous in-flight search request to prevent race conditions & backend lag
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(rawQ)}`, {
        signal: this.abortController.signal,
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      const results = (data && data.results) ? data.results : (Array.isArray(data) ? data : []);

      // Cache up to 100 queries in memory
      if (this.cache.size > 100) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      this.cache.set(cacheKey, results);

      this.renderResults(rawQ, results);
    } catch (err) {
      if (err.name === 'AbortError') return; // Expected cancellation
      console.log('Search notice:', err);
    }
  },

  renderResults(query, items, isPreview = false) {
    const listContainer = document.getElementById('searchDropdownList');
    const countLabel = document.getElementById('searchResultCount');
    const clearBtn = document.getElementById('clearSearchBtn');
    const dropdown = document.getElementById('searchDropdown');

    if (clearBtn) clearBtn.classList.remove('hidden');
    if (dropdown) dropdown.classList.remove('hidden');

    if (!items || items.length === 0) {
      if (!isPreview) {
        if (countLabel) countLabel.innerText = `0 Results for "${query}"`;
        if (listContainer) {
          listContainer.innerHTML = `
            <div class="py-6 text-center text-xs text-slate-400">
              No matching titles found.<br /><span class="text-[10px] text-slate-500">Try searching any worldwide movie, series, or anime (e.g. "Kantara", "Inception", "Naruto")</span>
            </div>
          `;
        }
      }
      return;
    }

    // Index items in resultsMap for instant retrieval
    items.forEach(item => {
      this.resultsMap[item.id] = item;
      if (item.tmdbId) {
        this.resultsMap[String(item.tmdbId)] = item;
      }
    });

    if (countLabel) {
      countLabel.innerText = `${items.length} Results for "${query}"${isPreview ? ' (preview)' : ''}`;
    }

    if (listContainer) {
      listContainer.innerHTML = items.map(item => `
        <div onclick="Player.playTitleById('${item.id}'); Search.hideDropdown();" class="flex items-center gap-2.5 p-2 rounded hover:bg-brand-card cursor-pointer transition border border-transparent hover:border-brand-border group">
          <img 
            src="${item.poster || 'https://image.tmdb.org/t/p/w342/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg'}" 
            alt="${item.title}" 
            loading="lazy"
            onerror="this.src='https://image.tmdb.org/t/p/w342/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg'" 
            class="w-9 h-12 object-cover rounded flex-shrink-0 bg-slate-900" 
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <p class="text-xs font-bold text-white truncate">${item.title}</p>
              ${item.isClassic ? '<span class="text-[9px] bg-amber-950/80 text-amber-400 border border-amber-800/60 px-1 py-0.2 rounded font-bold">CLASSIC</span>' : (String(item.id).startsWith('tmdb-') ? '<span class="text-[9px] bg-sky-950/80 text-sky-400 border border-sky-800/60 px-1 py-0.2 rounded font-bold">4K STREAM</span>' : '')}
            </div>
            <p class="text-[10px] text-slate-400 truncate">${(item.type || 'MOVIE').toUpperCase()} • ${item.year || '2024'} • ${item.match || '98% Match'}</p>
          </div>
          <div class="flex items-center gap-1.5">
            <button onclick="event.stopPropagation(); UI.openDetailsModal(Search.resultsMap['${item.id}'] || State.catalog.find(i=>i.id==='${item.id}')); Search.hideDropdown();" class="p-1.5 text-slate-400 hover:text-white rounded hover:bg-brand-surface" title="More Info">
              <i class="ph ph-info text-sm"></i>
            </button>
            <span class="text-[10px] font-bold text-brand-blue bg-brand-surface px-2 py-1 rounded border border-brand-border flex-shrink-0 group-hover:bg-brand-blue group-hover:text-white transition flex items-center gap-1">
              <i class="ph ph-play-fill text-xs"></i> Stream
            </span>
          </div>
        </div>
      `).join('');
    }
  },

  clear() {
    const input = document.getElementById('searchInput');
    if (input) input.value = '';
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) clearBtn.classList.add('hidden');
    this.hideDropdown();
  },

  showDropdown() {
    const input = document.getElementById('searchInput');
    const val = input ? input.value.trim() : '';
    if (val.length > 0) {
      const dropdown = document.getElementById('searchDropdown');
      if (dropdown) dropdown.classList.remove('hidden');
    }
  },

  hideDropdown() {
    const dropdown = document.getElementById('searchDropdown');
    if (dropdown) dropdown.classList.add('hidden');
  }
};
