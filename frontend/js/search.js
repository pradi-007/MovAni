/**
 * MOVAni Live Search Module
 * Instant multi-attribute search filtering with real-time dropdown suggestions.
 */

const Search = {
  debounceTimer: null,
  resultsMap: {},

  handleInput(query) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.execute(query);
    }, 120);
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

  async execute(query) {
    const rawQ = query.trim().toLowerCase();
    const clearBtn = document.getElementById('clearSearchBtn');
    const dropdown = document.getElementById('searchDropdown');
    const listContainer = document.getElementById('searchDropdownList');
    const countLabel = document.getElementById('searchResultCount');

    if (rawQ.length === 0) {
      clearBtn.classList.add('hidden');
      dropdown.classList.add('hidden');
      return;
    }

    clearBtn.classList.remove('hidden');
    dropdown.classList.remove('hidden');

    // Query typo normalization
    const q = rawQ.replace(/doreman/g, 'doraemon').replace(/doremon/g, 'doraemon');

    // 1. Query local/backend catalog
    let localMatches = await API.search(q);
    if (!localMatches || localMatches.length === 0) {
      localMatches = State.catalog.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(rawQ) ||
        (item.overview && (item.overview.toLowerCase().includes(q) || item.overview.toLowerCase().includes(rawQ))) ||
        (item.studio && item.studio.toLowerCase().includes(q)) ||
        (item.genres && item.genres.some(g => g.toLowerCase().includes(q))) ||
        (item.xray && item.xray.actors && item.xray.actors.some(a => a.name.toLowerCase().includes(q)))
      );
    }

    // 2. Query live TMDB global database (up to 25 results)
    const tmdbMatches = await API.searchTmdb(q, 25);
    if (tmdbMatches && tmdbMatches.length > 0) {
      tmdbMatches.forEach(tm => {
        if (!State.catalog.find(c => c.id === tm.id)) {
          State.catalog.push(tm);
        }
      });
    }

    // 3. Merge, deduplicate, and index in resultsMap
    const filtered = [...(localMatches || [])];
    if (tmdbMatches) {
      tmdbMatches.forEach(tm => {
        if (!filtered.some(c => c.id === tm.id || (tm.tmdbId && c.tmdbId === tm.tmdbId) || c.title.toLowerCase() === tm.title.toLowerCase())) {
          filtered.push(tm);
        }
      });
    }

    filtered.forEach(item => {
      this.resultsMap[item.id] = item;
      if (item.tmdbId) {
        this.resultsMap[String(item.tmdbId)] = item;
      }
    });

    countLabel.innerText = `${filtered.length} Results for "${query}"`;

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="py-6 text-center text-xs text-slate-400">
          No matching titles found.<br /><span class="text-[10px] text-slate-500">Try searching any movie, series, or anime (e.g. "Inception", "Naruto", "Avengers", "Loki")</span>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = filtered.map(item => `
      <div onclick="Player.playTitleById('${item.id}'); Search.hideDropdown();" class="flex items-center gap-2.5 p-2 rounded hover:bg-brand-card cursor-pointer transition border border-transparent hover:border-brand-border group">
        <img src="${item.poster}" alt="${item.title}" onerror="this.src='https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg'" class="w-9 h-12 object-cover rounded flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <p class="text-xs font-bold text-white truncate">${item.title}</p>
            ${item.isClassic ? '<span class="text-[9px] bg-amber-950/80 text-amber-400 border border-amber-800/60 px-1 py-0.2 rounded font-bold">CLASSIC HD</span>' : (item.id.startsWith('tmdb-') ? '<span class="text-[9px] bg-sky-950/80 text-sky-400 border border-sky-800/60 px-1 py-0.2 rounded font-bold">LIVE STREAM</span>' : '')}
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
  },

  clear() {
    const input = document.getElementById('searchInput');
    input.value = '';
    document.getElementById('clearSearchBtn').classList.add('hidden');
    this.hideDropdown();
  },

  showDropdown() {
    const val = document.getElementById('searchInput').value.trim();
    if (val.length > 0) {
      document.getElementById('searchDropdown').classList.remove('hidden');
    }
  },

  hideDropdown() {
    document.getElementById('searchDropdown').classList.add('hidden');
  }
};
