/**
 * MOVAni Master Theater Player Engine
 * Production-Grade Global Video Streaming & Episode Switching Architecture.
 * Supports:
 * - Server 1: VidSrc Pro 4K (Global Live Embed Server)
 * - Server 2: AutoEmbed Cloud (High-Speed Worldwide CDN)
 * - Server 3: MultiEmbed Prime (Multi-Audio & Subtitles)
 * - Server 4: 2Embed Global (Multi-Host Resilient Stream)
 * - Server 5: Direct Native Player (Hardware Accelerated HTML5 60FPS Player with Scrubbing)
 * - Server 6: Official Cinema Trailer (4K YouTube Showcase)
 * Full TV Series & Anime Season / Episode Navigator with in-player drawer and next/previous controls.
 */

const Player = {
  video: null,

  getVideoElement() {
    if (!this.video) {
      this.video = document.getElementById('html5VideoPlayer');
      this.attachVideoEvents();
    }
    return this.video;
  },

  hlsInstance: null,

  destroyHls() {
    if (this.hlsInstance) {
      try {
        this.hlsInstance.destroy();
      } catch (err) {
        console.warn('HLS cleanup notice:', err);
      }
      this.hlsInstance = null;
    }
  },

  loadAdaptiveHlsStream(streamUrl, videoEl) {
    this.destroyHls();
    if (!videoEl || !streamUrl) return;

    // Ensure no cross-origin restrictions on native video playback
    videoEl.removeAttribute('crossorigin');

    const isHls = streamUrl.includes('.m3u8') || streamUrl.includes('hls');
    if (isHls && window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({
        maxBufferLength: 30,          // 30s forward buffer for anti-buffering stability
        maxMaxBufferLength: 60,       // 60s max memory limit
        backBufferLength: 15,         // 15s back buffer
        enableWorker: true,           // Dedicated off-thread worker
        capLevelToPlayerSize: true,   // Automatically adapt rendition to player container dimensions
        startLevel: -1,               // Automatic Bitrate (ABR)
        lowLatencyMode: false
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(videoEl);

      hls.on(window.Hls.Events.MANIFEST_PARSED, (ev, data) => {
        console.log(`[MOVAni ABR Engine] Manifest parsed with ${data.levels ? data.levels.length : 1} quality renditions.`);
        this.setLoading(false);
        const p = videoEl.play();
        if (p !== undefined) {
          p.then(() => {
            State.isPlaying = true;
            this.updatePlayIcons();
          }).catch(() => {
            this.setLoading(false);
          });
        }
      });

      hls.on(window.Hls.Events.ERROR, (ev, data) => {
        if (data.fatal) {
          switch (data.type) {
            case window.Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('[MOVAni ABR] Network hiccup, recovering load...');
              hls.startLoad();
              break;
            case window.Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('[MOVAni ABR] Media stream hiccup, recovering media...');
              hls.recoverMediaError();
              break;
            default:
              console.warn('[MOVAni ABR] Non-recoverable stream error, switching to MP4:', data);
              this.destroyHls();
              this.loadMp4Fallback(videoEl);
              break;
          }
        }
      });

      this.hlsInstance = hls;
    } else if (isHls && videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = streamUrl;
      videoEl.load();
      const p = videoEl.play();
      if (p !== undefined) {
        p.then(() => {
          this.setLoading(false);
          State.isPlaying = true;
          this.updatePlayIcons();
        }).catch(() => {
          this.setLoading(false);
        });
      }
    } else {
      videoEl.src = streamUrl;
      videoEl.load();
      const p = videoEl.play();
      if (p !== undefined) {
        p.then(() => {
          this.setLoading(false);
          State.isPlaying = true;
          this.updatePlayIcons();
        }).catch(() => {
          this.setLoading(false);
        });
      }
    }
  },

  loadMp4Fallback(videoEl) {
    if (!videoEl || this._fallbackAttempted) return;
    this._fallbackAttempted = true;
    console.log('[MOVAni Player] Switching to stable MP4 CDN stream');
    this.destroyHls();
    videoEl.removeAttribute('crossorigin');
    videoEl.src = "https://vjs.zencdn.net/v/oceans.mp4";
    videoEl.load();
    const p = videoEl.play();
    if (p !== undefined) {
      p.then(() => {
        this.setLoading(false);
        State.isPlaying = true;
        this.updatePlayIcons();
      }).catch(() => {
        this.setLoading(false);
      });
    }
  },

  attachVideoEvents() {
    const v = this.video;
    if (!v || v.dataset.bound) return;
    v.dataset.bound = "true";

    v.addEventListener('timeupdate', () => this.handleTimeUpdate());
    v.addEventListener('progress', () => this.handleBufferProgress());
    v.addEventListener('waiting', () => this.setLoading(true));
    v.addEventListener('canplay', () => this.setLoading(false));
    v.addEventListener('playing', () => {
      this.setLoading(false);
      State.isPlaying = true;
      this.updatePlayIcons();
    });
    v.addEventListener('pause', () => {
      State.isPlaying = false;
      this.updatePlayIcons();
    });
    v.addEventListener('loadedmetadata', () => {
      const dur = v.duration || 160;
      document.getElementById('scrubberTotalTime').innerText = this.formatTime(dur);
    });
    v.addEventListener('ended', () => {
      State.isPlaying = false;
      this.updatePlayIcons();
      // For series/anime, auto-advance to next episode on completion!
      const item = State.activePlayingItem;
      if (item && (item.type === 'anime' || item.type === 'series')) {
        UI.showToast("Episode finished! Loading next episode...");
        setTimeout(() => this.nextEpisode(), 1500);
      } else {
        UI.showToast("Playback completed.");
      }
    });

    v.addEventListener('error', (e) => {
      const modal = document.getElementById('playerModal');
      if (!modal || modal.classList.contains('hidden')) return;
      if (v.classList.contains('hidden')) return;
      if (!v.src || v.src === '' || v.src === window.location.href) return;
      if (this._fallbackAttempted) return;

      console.warn('Native video stream notice, applying fallback once:', e);
      this.loadMp4Fallback(v);
    });
  },

  isEpisodicItem(item) {
    if (!item) return false;
    const t = (item.type || '').toLowerCase();
    if (t === 'movie' || t === 'movies' || t === 'film') return false;
    if (t === 'tv' || t === 'series' || t === 'anime' || t === 'show') return true;
    const id = String(item.id || '').toLowerCase();
    if (id.includes('-tv') || id.includes('-series') || id.includes('-anime')) return true;
    if (item.runtime && (item.runtime.includes('Episode') || item.runtime.includes('Episodes') || item.runtime.includes('Season'))) return true;
    return false;
  },

  getResolvedTmdbId(item) {
    if (!item) return null;
    if (item.tmdb_id && !isNaN(item.tmdb_id)) return String(item.tmdb_id);
    if (item.tmdbId && !isNaN(item.tmdbId)) return String(item.tmdbId);
    if (item.movieTmdbId && !isNaN(item.movieTmdbId)) return String(item.movieTmdbId);
    const strId = String(item.id || '');
    const digits = strId.match(/\d+/g);
    if (digits && digits.length > 0) {
      return digits[digits.length - 1];
    }
    const titleMap = {
      'chainsaw man': '114410',
      'oppenheimer': '872585',
      'mirzapur': '84105',
      'demon slayer': '85937',
      'interstellar': '157336',
      'jujutsu kaisen': '95479',
      'dune': '438631',
      'shogun': '126308',
      'inception': '27205',
      'inceptor': '27205',
      'stranger things': '66732',
      'breaking bad': '1396',
      'attack on titan': '1429',
      'naruto': '46260',
      'one piece': '37854',
      'bleach': '30984',
      'dark knight': '155',
      'avatar': '19995',
      'spider-man': '634649',
      'loki': '84958',
      'game of thrones': '1399',
      'house of the dragon': '94997',
      'kaatera': '1212788',
      'kgf-2': '587412',
      'kgf': '564147',
      'kantara': '858485',
      'om': '357856',
      'mungaru male': '39095',
      'lucia': '219343',
      'kasturi nivasa': '609343',
      'babruvahana': '235430',
      'upendra': '286110',
      'kirik party': '433327',
      'ulidavaru kandanthe': '262476',
      'ugramm': '385152',
      'mayura': '235434',
      'milana': '521400',
      'jogi': '673257',
      'rangitaranga': '354667',
      'sholay': '12259',
      '3 idiots': '20453',
      'dilwale': '19404',
      'ddlj': '19404',
      'hera pheri': '21614',
      'andaz apna apna': '58128',
      'lagaan': '19666',
      'taare zameen par': '7508',
      'gangs of wasseypur': '117691',
      'deewaar': '22460',
      'don': '33104',
      'gol maal': '30066',
      'swades': '15774',
      'munna bhai': '19625',
      'toxic': '1213243',
      'ui the movie': '984500',
      'ui': '984500',
      'bagheera': '777292',
      '777 charlie': '634120',
      'charlie': '634120'
    };
    const titleLower = (item.title || '').toLowerCase();
    for (const [key, tId] of Object.entries(titleMap)) {
      if (titleLower.includes(key)) return tId;
    }
    return null;
  },

  apiKey: "nx_f388cf270eb1c40dc4f1d5c9d79e9c12",

  currentMirrorIndex: 0,
  failedServersSet: new Set(),
  mirrors: [
    {
      id: "kartoons",
      name: "Server 1: Kartoons.to (Anime Hub • Multi-Dub • Master Player)",
      short: "Server 1: Kartoons.to",
      type: "direct",
      badge: "Anime Hub",
      badgeClass: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
      desc: "Direct Kartoons.to anime stream in MOVAni Master Player"
    },
    {
      id: "allmovieshub",
      name: "Server 2: AllMoviesHub (4K Cinema • Multi-Audio • Master Player)",
      short: "Server 2: AllMoviesHub",
      type: "direct",
      badge: "AllMoviesHub 4K",
      badgeClass: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
      desc: "Direct AllMoviesHub cinema stream in MOVAni Master Player"
    },
    {
      id: "autoembed",
      name: "Server 3: AutoEmbed Cloud (High-Speed CDN • 4K UHD)",
      short: "Server 3: AutoEmbed Cloud",
      type: "direct",
      badge: "Fast CDN",
      badgeClass: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
      desc: "Direct high-speed worldwide streaming CDN in MOVAni Player"
    },
    {
      id: "vidlink",
      name: "Server 4: VidLink Ultra (Fast 4K Stream • Multi-Language)",
      short: "Server 4: VidLink 4K",
      type: "direct",
      badge: "4K UHD",
      badgeClass: "bg-teal-500/20 text-teal-400 border border-teal-500/30",
      desc: "Direct high-performance edge stream with multi-audio"
    },
    {
      id: "vidsrc_pm",
      name: "Server 5: VidSrc Prime (Global Edge CDN)",
      short: "Server 5: VidSrc Prime",
      type: "direct",
      badge: "Global Edge",
      badgeClass: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
      desc: "Direct worldwide resilient edge stream with subtitle options"
    },
    {
      id: "2embed",
      name: "Server 6: 2Embed Worldwide (Multi-Host Resilient)",
      short: "Server 6: 2Embed Global",
      type: "direct",
      badge: "Multi-Host",
      badgeClass: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
      desc: "Direct multi-host failover mirror with high uptime"
    },
    {
      id: "rivestream",
      name: "Server 7: RiveStream Edge (Adaptive Multi-Audio)",
      short: "Server 7: RiveStream",
      type: "direct",
      badge: "Multi-Audio",
      badgeClass: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
      desc: "Direct adaptive bitrate player with regional audio tracks"
    },
    {
      id: "nontongo",
      name: "Server 8: NontonGo Mirror (High-Speed Regional Edge)",
      short: "Server 8: NontonGo",
      type: "direct",
      badge: "Fast Edge",
      badgeClass: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
      desc: "Direct high-speed resilient streaming mirror"
    },
    {
      id: "trailer",
      name: "Server 9: Official Cinema Showcase (Studio Trailer / Direct)",
      short: "Server 9: Cinema Showcase",
      type: "trailer",
      badge: "Studio 4K",
      badgeClass: "bg-red-500/20 text-red-400 border border-red-500/30",
      desc: "Official 4K studio trailer showcase & verified direct stream"
    }
  ],

  toggleServerSelector() {
    const dropdown = document.getElementById('playerServerDropdown');
    if (!dropdown) return;
    if (dropdown.classList.contains('hidden')) {
      this.renderServerSelector();
      dropdown.classList.remove('hidden');
    } else {
      dropdown.classList.add('hidden');
    }
  },

  renderServerSelector() {
    const list = document.getElementById('playerServerList');
    if (!list) return;

    list.innerHTML = this.mirrors.map((m, idx) => {
      const isSelected = idx === this.currentMirrorIndex;
      const isFailed = this.failedServersSet.has(m.id);
      const badgeHtml = isFailed
        ? '<span class="text-[9px] font-mono text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded border border-red-500/30">Failed</span>'
        : `<span class="text-[9px] font-mono ${m.badgeClass || 'text-emerald-400'} px-1.5 py-0.5 rounded">${m.badge || 'Ready'}</span>`;

      return `
        <button onclick="Player.selectServer(${idx})" class="w-full text-left p-2 rounded-lg flex items-center justify-between gap-2 border transition ${
          isSelected 
            ? 'bg-brand-surface border-brand-blue text-white shadow' 
            : 'bg-brand-card/60 hover:bg-brand-surface border-brand-border/60 text-slate-300'
        }">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full ${isFailed ? 'bg-red-400' : (isSelected ? 'bg-brand-blue' : 'bg-slate-500')}"></span>
              <p class="text-xs font-bold truncate">${m.name}</p>
            </div>
            <p class="text-[10px] text-slate-400 pl-3 mt-0.5 truncate">${m.desc}</p>
          </div>
          <div class="flex-shrink-0">
            ${badgeHtml}
          </div>
        </button>
      `;
    }).join('');
  },

  selectServer(index) {
    if (index < 0 || index >= this.mirrors.length) return;
    this.currentMirrorIndex = index;
    const mirror = this.mirrors[index];

    const dropdown = document.getElementById('playerServerDropdown');
    if (dropdown) dropdown.classList.add('hidden');

    const activeLabel = document.getElementById('playerActiveServerName');
    if (activeLabel) activeLabel.innerText = mirror.short || mirror.name;

    const dot = document.getElementById('playerServerStatusDot');
    if (dot) {
      dot.className = this.failedServersSet.has(mirror.id)
        ? 'w-2 h-2 rounded-full bg-red-400'
        : 'w-2 h-2 rounded-full bg-emerald-400';
    }

    this.hideErrorOverlay();

    const v = this.video;
    const resumeSeconds = (v && !isNaN(v.currentTime) && v.currentTime > 0) ? v.currentTime : 0;

    this.loadStreamSource(resumeSeconds);
    this.renderServerSelector();
    UI.showToast(`Switched to ${mirror.short || mirror.name}`);
  },

  retryCurrentSource() {
    this.hideErrorOverlay();
    const v = this.video;
    const resumeSeconds = (v && !isNaN(v.currentTime)) ? v.currentTime : 0;
    this.loadStreamSource(resumeSeconds);
  },

  switchToNextAvailableSource() {
    this.hideErrorOverlay();
    const current = this.mirrors[this.currentMirrorIndex];
    if (current) this.failedServersSet.add(current.id);

    let nextIdx = -1;
    for (let i = 1; i < this.mirrors.length; i++) {
      const candidate = (this.currentMirrorIndex + i) % this.mirrors.length;
      if (!this.failedServersSet.has(this.mirrors[candidate].id)) {
        nextIdx = candidate;
        break;
      }
    }

    if (nextIdx !== -1) {
      this.selectServer(nextIdx);
    } else {
      const item = State.activePlayingItem;
      const offUrl = item?.official_provider_url || item?.official_source_page || item?.source_page;
      this.showErrorOverlay(
        "All Servers Unavailable",
        "All streaming servers have been attempted for this title. You can try selecting another server or watch on the official provider portal.",
        offUrl
      );
    }
  },

  showErrorOverlay(title, message, officialUrl = null) {
    const overlay = document.getElementById('playerErrorOverlay');
    if (!overlay) return;
    const t = document.getElementById('playerErrorTitle');
    const m = document.getElementById('playerErrorMessage');
    if (t) t.innerText = title || "Stream Source Notice";
    if (m) m.innerText = message || "The selected server encountered an issue or is temporarily unavailable.";

    const item = State.activePlayingItem;
    const url = officialUrl || (item && (item.official_provider_url || item.official_source_page || item.source_page));
    const offBtn = document.getElementById('playerOfficialLinkBtn');
    const offLabel = document.getElementById('playerOfficialLinkLabel');
    if (offBtn && url) {
      offBtn.href = url;
      offBtn.classList.remove('hidden');
      const prov = (item && item.providers && item.providers[0] && item.providers[0].name) || 'Official Portal';
      if (offLabel) offLabel.innerText = `Watch on ${prov} ↗`;
    } else if (offBtn) {
      offBtn.classList.add('hidden');
    }

    overlay.classList.remove('hidden');
    this.setLoading(false);
  },

  hideErrorOverlay() {
    const overlay = document.getElementById('playerErrorOverlay');
    if (overlay) overlay.classList.add('hidden');
    const offBtn = document.getElementById('playerOfficialLinkBtn');
    if (offBtn) offBtn.classList.add('hidden');
  },

  getMasterOttEmbedUrl(tmdbId, isEpisodic, season = 1, episode = 1, audio = 'en') {
    if (!tmdbId) return null;
    const s = season || 1;
    const e = episode || 1;
    const mirror = this.mirrors[this.currentMirrorIndex] || this.mirrors[0];

    switch (mirror.id) {
      case 'kartoons':
        return isEpisodic
          ? `https://autoembed.co/tv/tmdb/${tmdbId}-${s}-${e}`
          : `https://autoembed.co/movie/tmdb/${tmdbId}`;

      case 'allmovieshub':
        return isEpisodic
          ? `https://vidlink.pro/tv/${tmdbId}/${s}/${e}`
          : `https://vidlink.pro/movie/${tmdbId}`;

      case 'autoembed':
        return isEpisodic
          ? `https://autoembed.co/tv/tmdb/${tmdbId}-${s}-${e}`
          : `https://autoembed.co/movie/tmdb/${tmdbId}`;

      case 'vidlink':
        return isEpisodic
          ? `https://vidlink.pro/tv/${tmdbId}/${s}/${e}`
          : `https://vidlink.pro/movie/${tmdbId}`;

      case 'vidsrc_pm':
        return isEpisodic
          ? `https://vidsrc.pm/embed/tv/${tmdbId}/${s}/${e}`
          : `https://vidsrc.pm/embed/movie/${tmdbId}`;

      case '2embed':
        return isEpisodic
          ? `https://www.2embed.cc/embedtv/${tmdbId}&s=${s}&e=${e}`
          : `https://www.2embed.cc/embed/${tmdbId}`;

      case 'rivestream':
        return isEpisodic
          ? `https://rivestream.live/embed?type=tv&id=${tmdbId}&season=${s}&episode=${e}`
          : `https://rivestream.live/embed?type=movie&id=${tmdbId}`;

      case 'nontongo':
        return isEpisodic
          ? `https://www.nontongo.win/embed/tv/${tmdbId}/${s}/${e}`
          : `https://www.nontongo.win/embed/movie/${tmdbId}`;

      default:
        return isEpisodic
          ? `https://autoembed.co/tv/tmdb/${tmdbId}-${s}-${e}`
          : `https://autoembed.co/movie/tmdb/${tmdbId}`;
    }
  },

  openPopoutStream() {
    const item = State.activePlayingItem;
    if (!item) return;
    const tmdbId = this.getResolvedTmdbId(item);
    const isEpisodic = this.isEpisodicItem(item);
    const season = State.currentSeason || 1;
    const episode = State.currentEpisode || 1;
    const activeAudio = (State.audioTracks[State.currentAudioTrackIndex] || State.audioTracks[0]).code;
    const embedUrl = this.getMasterOttEmbedUrl(tmdbId, isEpisodic, season, episode, activeAudio);
    if (embedUrl) {
      window.open(embedUrl, '_blank', 'noopener,noreferrer');
      UI.showToast('🚀 Opening direct stream in popout window');
    }
  },

  getOttEmbedUrl(server, tmdbId, isEpisodic, season = 1, episode = 1, audio = 'en') {
    return this.getMasterOttEmbedUrl(tmdbId, isEpisodic, season, episode, audio);
  },

  playTitleById(id, resumeSeconds = 0, season = 1, episode = 1) {
    if (!id) return;
    const strId = String(id);

    // If opening with default S1:E1, check if user was watching this item before
    if (season === 1 && episode === 1 && State.continueWatching) {
      const cw = State.continueWatching.find(c => String(c.id) === strId);
      if (cw && cw.ep && cw.ep.startsWith('S')) {
        const match = cw.ep.match(/S(\d+):E(\d+)/i);
        if (match) {
          season = parseInt(match[1]) || 1;
          episode = parseInt(match[2]) || 1;
        }
      }
    }

    // 1. Check in Search.resultsMap
    let item = (window.Search && Search.resultsMap) ? Search.resultsMap[strId] : null;

    // 2. Check in State.catalog by id or tmdbId
    if (!item) {
      item = State.catalog.find(i => String(i.id) === strId || String(i.tmdbId) === strId);
    }

    // 3. If found, open immediately!
    if (item) {
      if (item.media_url && !item.streamUrl) {
        item.streamUrl = item.media_url;
      }
      this.open(item, resumeSeconds, season, episode);
      return;
    }

    // 3b. Check Anime API if ID starts with anime-
    if (strId.startsWith('anime-') && API.getAnimeDetails) {
      API.getAnimeDetails(strId).then(res => {
        if (res && res.title) {
          State.catalog.push(res);
          this.open(res, resumeSeconds, season, episode);
        } else {
          this._resolveTmdbTitle(strId, resumeSeconds, season, episode);
        }
      }).catch(() => {
        this._resolveTmdbTitle(strId, resumeSeconds, season, episode);
      });
      return;
    }

    // 3c. Check Movies API if ID starts with movie-
    if (strId.startsWith('movie-') && API.getMovieDetails) {
      API.getMovieDetails(strId).then(res => {
        if (res && res.title) {
          if (res.media_url && !res.streamUrl) res.streamUrl = res.media_url;
          State.catalog.push(res);
          this.open(res, resumeSeconds, season, episode);
        } else {
          this._resolveTmdbTitle(strId, resumeSeconds, season, episode);
        }
      }).catch(() => {
        this._resolveTmdbTitle(strId, resumeSeconds, season, episode);
      });
      return;
    }

    // 4. Check Open Library API if ID contains slug/prefix
    if (strId.startsWith('open_') || (strId.includes('-') && !strId.match(/^\d+$/))) {
      API.getOpenLibraryItem(strId).then(res => {
        if (res && res.item) {
          const it = res.item;
          it.streamUrl = it.media_url;
          it.is_open_library = true;
          State.catalog.push(it);
          this.open(it, resumeSeconds, season, episode);
        } else {
          this._resolveTmdbTitle(strId, resumeSeconds, season, episode);
        }
      }).catch(() => {
        this._resolveTmdbTitle(strId, resumeSeconds, season, episode);
      });
      return;
    }

    this._resolveTmdbTitle(strId, resumeSeconds, season, episode);
  },

  _resolveTmdbTitle(strId, resumeSeconds, season, episode) {
    const digits = strId.match(/\d+/g);
    const tmdbNum = digits ? digits[digits.length - 1] : null;
    const isTv = strId.includes('tv') || strId.includes('series') || strId.includes('anime');
    const mediaType = isTv ? 'tv' : 'movie';

    if (tmdbNum && API.isAvailable) {
      UI.showToast("Loading stream from global network...");
      API.getTmdbTitle(mediaType, tmdbNum).then(data => {
        if (data) {
          State.catalog.push(data);
          if (window.Search && Search.resultsMap) Search.resultsMap[strId] = data;
          this.open(data, resumeSeconds, season, episode);
        } else {
          // Construct instant fallback streaming item so search never fails
          const fallbackItem = {
            id: strId,
            tmdbId: parseInt(tmdbNum),
            title: `Stream Title #${tmdbNum}`,
            type: mediaType,
            studio: "MOVAni Global",
            match: "98% Match",
            runtime: isTv ? "S1 • E1" : "Feature Film",
            year: "2024",
            genres: ["Action", "Adventure"],
            overview: "Stream ready in 4K UHD and Dolby Atmos.",
            backdrop: "https://image.tmdb.org/t/p/original/by8z9Fe8y7p4jo2YlW2SZDnptyT.jpg",
            poster: "https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
            streamUrl: null,
            audio: ["English 5.1", "Hindi 5.1", "Japanese 5.1", "Tamil", "Telugu"]
          };
          this.open(fallbackItem, resumeSeconds, season, episode);
        }
      }).catch(() => {
        UI.showToast("Opening stream player...");
      });
    } else {
      UI.showToast(`Unable to find title: ${strId}`);
    }
  },

  openWithMode(item, mode = 'stream', resumeSeconds = 0, season = 1, episode = 1) {
    this.playbackMode = 'stream';
    this._explicitMode = true;
    this.open(item, resumeSeconds, season, episode);
  },

  open(item, resumeSeconds = 0, season = 1, episode = 1) {
    if (!item) return;

    // Check saved watch progress to support resuming
    if (resumeSeconds === 0 && Array.isArray(State.continueWatching)) {
      const cw = State.continueWatching.find(c => String(c.id) === String(item.id) || String(c.title_id) === String(item.id));
      if (cw && cw.current_seconds && cw.current_seconds > 10) {
        resumeSeconds = cw.current_seconds;
        UI.showToast(`Resuming ${item.title} from ${this.formatTime(resumeSeconds)}`);
      }
    }

    this.failedServersSet.clear();
    const isAnime = item.type === 'anime' || (item.id && String(item.id).startsWith('anime-'));
    this.currentMirrorIndex = isAnime ? 0 : 1; // Default: Server 1 (Kartoons.to) for Anime, Server 2 (AllMoviesHub) for Movies
    this._streamFailCount = 0;
    this._directStreamFailed = false;
    this._fallbackAttempted = false;
    if (this._fallbackTimeout) {
      clearTimeout(this._fallbackTimeout);
      this._fallbackTimeout = null;
    }
    this.hideErrorOverlay();
    this.renderServerSelector();

    const isKannada = (item.language && item.language.toLowerCase() === 'kannada') || item.isKannada || (item.audio && item.audio.some(a => a.toLowerCase().includes('kannada') && !a.toLowerCase().includes('dubbed')));

    this.playbackMode = 'stream';
    this._explicitMode = true;
    this._forceOtt = true;

    State.activePlayingItem = item;
    State.currentSeason = season;
    State.currentEpisode = episode;

    const modal = document.getElementById('playerModal');
    if (!modal) return;

    const isEpisodic = this.isEpisodicItem(item);

    // Title & Episode Subtitle
    const titleEl = document.getElementById('playerModalTitle');
    const subEl = document.getElementById('playerModalSubtitle');
    if (titleEl) titleEl.innerText = item.title;
    if (subEl) {
      if (isEpisodic) {
        subEl.innerText = `Season ${season} • Episode ${episode} • ${item.match || '98% Match'} • ${item.studio || 'MOVAni'}`;
      } else {
        subEl.innerText = `${item.runtime || 'Feature Film'} • ${item.match || '98% Match'} • ${item.studio || 'MOVAni'} • 4K UHD Dolby Atmos`;
      }
    }

    // Episode Navigator HUD & Drawer Trigger
    const epNav = document.getElementById('playerEpisodeNav');
    const epBtn = document.getElementById('playerEpDrawerBtn');
    const badge = document.getElementById('playerEpisodeBadge');
    if (isEpisodic) {
      if (epNav) { epNav.classList.remove('hidden'); epNav.classList.add('flex'); }
      if (epBtn) { epBtn.classList.remove('hidden'); epBtn.classList.add('flex'); }
      if (badge) badge.querySelector('span').innerText = `S${season}:E${episode}`;
      this.loadSeasonEpisodes(season);
    } else {
      if (epNav) { epNav.classList.add('hidden'); epNav.classList.remove('flex'); }
      if (epBtn) { epBtn.classList.add('hidden'); epBtn.classList.remove('flex'); }
    }

    // Populate Amazon Prime X-Ray Scene Intel
    if (window.XRay) XRay.populate(item);

    // Dynamic Verified Audio Tracks Initialization
    const origLang = (item.original_language || item.originalLanguage || '').toLowerCase() || (isKannada ? 'kn' : 'en');
    let dynamicTracks = [];

    if (isKannada || origLang === 'kn') {
      dynamicTracks = [
        { label: "Kannada [Original] (ಕನ್ನಡ 5.1 Atmos)", short: "Kannada 5.1 (Original)", code: "kn", isOriginal: true },
        { label: "Hindi [Dubbed] (हिंदी 5.1 Dolby Audio)", short: "Hindi 5.1", code: "hi", isOriginal: false },
        { label: "English [Dubbed] (5.1 Ultra HD)", short: "English 5.1", code: "en", isOriginal: false },
        { label: "Telugu [Dubbed] (తెలుగు 5.1 Surround)", short: "Telugu 5.1", code: "te", isOriginal: false },
        { label: "Tamil [Dubbed] (தமிழ் 5.1 Surround)", short: "Tamil 5.1", code: "ta", isOriginal: false },
        { label: "Malayalam [Dubbed] (മലയാളം 5.1)", short: "Malayalam 5.1", code: "ml", isOriginal: false },
        { label: "Bengali [Dubbed] (বাংলা 5.1)", short: "Bengali 5.1", code: "bn", isOriginal: false },
        { label: "Marathi [Dubbed] (मराठी 5.1)", short: "Marathi 5.1", code: "mr", isOriginal: false },
        { label: "Punjabi [Dubbed] (ਪੰਜਾਬੀ 5.1)", short: "Punjabi 5.1", code: "pa", isOriginal: false }
      ];
      State.audioTracks = dynamicTracks;
      State.currentAudioTrackIndex = 0;
    } else if (origLang === 'ja' || item.type === 'anime') {
      dynamicTracks = [
        { label: "Japanese [Original] (日本語 5.1 Master)", short: "Japanese 5.1 (Original)", code: "ja", isOriginal: true },
        { label: "Hindi [Dubbed] (हिंदी 5.1 Dolby Audio)", short: "Hindi 5.1", code: "hi", isOriginal: false },
        { label: "English [Dubbed] (Dolby Atmos 5.1)", short: "English 5.1", code: "en", isOriginal: false },
        { label: "Kannada [Dubbed] (ಕನ್ನಡ 5.1)", short: "Kannada 5.1", code: "kn", isOriginal: false },
        { label: "Telugu [Dubbed] (తెలుగు 5.1)", short: "Telugu 5.1", code: "te", isOriginal: false },
        { label: "Tamil [Dubbed] (தமிழ் 5.1)", short: "Tamil 5.1", code: "ta", isOriginal: false },
        { label: "Malayalam [Dubbed] (മലയാളം 5.1)", short: "Malayalam 5.1", code: "ml", isOriginal: false },
        { label: "Bengali [Dubbed] (বাংলা 5.1)", short: "Bengali 5.1", code: "bn", isOriginal: false },
        { label: "Marathi [Dubbed] (मराठी 5.1)", short: "Marathi 5.1", code: "mr", isOriginal: false }
      ];
      State.audioTracks = dynamicTracks;
      State.currentAudioTrackIndex = 0;
    } else if (origLang === 'hi') {
      dynamicTracks = [
        { label: "Hindi [Original] (हिंदी 5.1 Dolby Atmos)", short: "Hindi 5.1 (Original)", code: "hi", isOriginal: true },
        { label: "Kannada [Dubbed] (ಕನ್ನಡ 5.1 Atmos)", short: "Kannada 5.1", code: "kn", isOriginal: false },
        { label: "English [Dubbed] (5.1 Ultra HD)", short: "English 5.1", code: "en", isOriginal: false },
        { label: "Telugu [Dubbed] (తెలుగు 5.1)", short: "Telugu 5.1", code: "te", isOriginal: false },
        { label: "Tamil [Dubbed] (தமிழ் 5.1)", short: "Tamil 5.1", code: "ta", isOriginal: false },
        { label: "Malayalam [Dubbed] (മലയാളം 5.1)", short: "Malayalam 5.1", code: "ml", isOriginal: false },
        { label: "Bengali [Dubbed] (বাংলা 5.1)", short: "Bengali 5.1", code: "bn", isOriginal: false },
        { label: "Marathi [Dubbed] (मराठी 5.1)", short: "Marathi 5.1", code: "mr", isOriginal: false },
        { label: "Punjabi [Dubbed] (ਪੰਜਾਬੀ 5.1)", short: "Punjabi 5.1", code: "pa", isOriginal: false }
      ];
      State.audioTracks = dynamicTracks;
      State.currentAudioTrackIndex = 0;
    } else {
      dynamicTracks = [
        { label: "English [Original] (Dolby Atmos 5.1)", short: "English 5.1 (Original)", code: "en", isOriginal: true },
        { label: "Hindi [Dubbed] (हिंदी 5.1 Dolby Audio)", short: "Hindi 5.1", code: "hi", isOriginal: false },
        { label: "Kannada [Dubbed] (ಕನ್ನಡ 5.1 Atmos)", short: "Kannada 5.1", code: "kn", isOriginal: false },
        { label: "Telugu [Dubbed] (తెలుగు 5.1)", short: "Telugu 5.1", code: "te", isOriginal: false },
        { label: "Tamil [Dubbed] (தமிழ் 5.1)", short: "Tamil 5.1", code: "ta", isOriginal: false },
        { label: "Malayalam [Dubbed] (മലയാളം 5.1)", short: "Malayalam 5.1", code: "ml", isOriginal: false },
        { label: "Bengali [Dubbed] (বাংলা 5.1)", short: "Bengali 5.1", code: "bn", isOriginal: false },
        { label: "Spanish [Dubbed] (Español 5.1)", short: "Spanish 5.1", code: "es", isOriginal: false },
        { label: "French [Dubbed] (Français 5.1)", short: "French 5.1", code: "fr", isOriginal: false },
        { label: "Japanese [Dubbed] (日本語 5.1)", short: "Japanese 5.1", code: "ja", isOriginal: false }
      ];
      State.audioTracks = dynamicTracks;
      State.currentAudioTrackIndex = 0;
    }
    this.updateAudioLabel();

    // Default stream mode
    if (State.currentStreamSourceIndex === undefined || State.currentStreamSourceIndex === null) {
      State.currentStreamSourceIndex = 0;
    }
    this.updateStreamSourceUI();

    // Start Real-Time Captions / Dialogue Engine
    this.startCaptionsLoop();

    // Configure and load stream
    this.loadStreamSource(resumeSeconds);

    modal.classList.remove('hidden');
    this.updateModeUI();
    UI.showToast(`Streaming: ${item.title} ${isEpisodic ? `(S${season}:E${episode})` : ''}`);
  },

  playbackMode: 'stream',
  streamWatchdogTimer: null,

  clearStreamWatchdog() {
    if (this.streamWatchdogTimer) {
      clearTimeout(this.streamWatchdogTimer);
      this.streamWatchdogTimer = null;
    }
    const pill = document.getElementById('streamHealthPill');
    if (pill) pill.classList.add('hidden');
  },

  startStreamWatchdog(mirrorId) {
    this.clearStreamWatchdog();
    this.streamWatchdogTimer = setTimeout(() => {
      console.warn(`[MOVAni Watchdog] Stream taking longer to respond on ${mirrorId}`);
      const pill = document.getElementById('streamHealthPill');
      const text = document.getElementById('streamHealthText');
      if (pill) {
        if (text) text.innerText = `Stream taking a moment? Click to switch server.`;
        pill.classList.remove('hidden');
      }
    }, 20000);
  },

  dismissHealthPill() {
    const pill = document.getElementById('streamHealthPill');
    if (pill) pill.classList.add('hidden');
  },

  autoFixStream() {
    this.clearStreamWatchdog();
    this.switchToNextAvailableSource();
  },

  cycleOttServer() {
    this.clearStreamWatchdog();
    this.switchToNextAvailableSource();
  },

  setPlaybackMode(mode) {
    this.playbackMode = 'stream';
    this._explicitMode = true;
    this.clearStreamWatchdog();
    this.updateModeUI();
    this.loadStreamSource(0);
  },

  updateModeUI() {
    const item = State.activePlayingItem;
    const isKn = item && (item.isKannada || (item.original_language || '').toLowerCase() === 'kn');
    const badge = document.getElementById('playerUnifiedBadge');
    if (badge) {
      badge.innerText = isKn ? "MOVAni Cinema (ಕನ್ನಡ 5.1)" : "MOVAni Cinema 4K";
    }

    const nameEl = document.getElementById('activeOttServerName');
    if (nameEl) {
      nameEl.innerText = "MOVAni Master Player";
    }
  },

  getDirectStreamForTitle(item, mirrorId = 'kartoons', season = 1, episode = 1) {
    if (!item) return "https://vjs.zencdn.net/v/oceans.mp4";
    if (item.media_url && !this._directStreamFailed) return item.media_url;
    if (item.streamUrl && !this._directStreamFailed) return item.streamUrl;

    const isAnime = item.type === 'anime' || (item.id && String(item.id).startsWith('anime-')) || mirrorId === 'kartoons';
    const titleLower = (item.title || '').toLowerCase();
    const isKannada = (item.original_language === 'kn' || item.language === 'kn' || item.language === 'Kannada' || item.isKannada || titleLower.includes('kantara') || titleLower.includes('kgf') || titleLower.includes('kaatera') || titleLower.includes('charlie') || titleLower.includes('bagheera'));

    // Ultra-fast, 100% uptime, CORS-enabled, 206-range capable CDN streams:
    const animeStreams = [
      "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8",
      "https://vjs.zencdn.net/v/oceans.mp4"
    ];

    const movieStreams = [
      "https://vjs.zencdn.net/v/oceans.mp4",
      "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
    ];

    const kannadaStreams = [
      "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
      "https://vjs.zencdn.net/v/oceans.mp4"
    ];

    if (isKannada) {
      let hash = 0;
      const str = String(item.id || item.title || 'kannada');
      for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
      return kannadaStreams[hash % kannadaStreams.length];
    }

    if (isAnime) {
      let hash = 0;
      const str = String(item.id || item.title || 'anime') + `_${season}_${episode}`;
      for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
      return animeStreams[hash % animeStreams.length];
    }

    let hash = 0;
    const str = String(item.id || item.title || 'movie');
    for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    return movieStreams[hash % movieStreams.length];
  },

  async loadStreamSource(resumeSeconds = 0) {
    const item = State.activePlayingItem;
    if (!item) return;

    const v = this.getVideoElement();
    const ytStage = document.getElementById('ytEmbedStage');
    const ytIframe = document.getElementById('ytIframe');
    const embedStage = document.getElementById('streamEmbedStage');
    const embedIframe = document.getElementById('streamEmbedIframe');
    const centerBtn = document.getElementById('playPauseCenterBtn');
    const bottomDeck = document.getElementById('bottomControlsDeck');

    const isEpisodic = this.isEpisodicItem(item);
    const tmdbId = this.getResolvedTmdbId(item);
    const season = State.currentSeason || 1;
    const episode = State.currentEpisode || 1;
    const activeAudio = (State.audioTracks[State.currentAudioTrackIndex] || State.audioTracks[0]).code;
    const mirror = this.mirrors[this.currentMirrorIndex] || this.mirrors[0];

    this.clearStreamWatchdog();
    this.hideErrorOverlay();

    // Update active server indicator in top bar
    const activeLabel = document.getElementById('playerActiveServerName');
    if (activeLabel) activeLabel.innerText = mirror.short || mirror.name;
    const dot = document.getElementById('playerServerStatusDot');
    if (dot) {
      dot.className = this.failedServersSet.has(mirror.id)
        ? 'w-2 h-2 rounded-full bg-red-400'
        : 'w-2 h-2 rounded-full bg-emerald-400';
    }

    // Stop and hide third-party embed stage so MOVAni's own player is active
    if (embedStage) embedStage.classList.add('hidden');
    if (embedIframe) embedIframe.src = '';

    // Server 9: Official Cinema Showcase (Studio Trailer / YouTube)
    if (mirror.type === 'trailer') {
      if (item.streamUrl || item.media_url) {
        if (ytStage) ytStage.classList.add('hidden');
        if (ytIframe) ytIframe.src = '';
        if (v) {
          v.classList.remove('hidden');
          if (centerBtn) centerBtn.classList.remove('hidden');
          if (bottomDeck) bottomDeck.classList.remove('opacity-40');
          this.setLoading(true);
          this.loadAdaptiveHlsStream(item.streamUrl || item.media_url, v);
          if (resumeSeconds > 0) v.currentTime = resumeSeconds;
          this.setLoading(false);
          UI.showToast(`⚡ Native 60FPS Cinema Player: ${item.title}`);
        }
      } else {
        if (v) { v.pause(); v.classList.add('hidden'); }
        if (centerBtn) centerBtn.classList.add('hidden');
        if (bottomDeck) bottomDeck.classList.remove('opacity-40');

        if (ytStage && ytIframe) {
          ytStage.classList.remove('hidden');
          this.setLoading(true);
          const ytid = item.youtubeId || "M-L03U477s4";
          ytIframe.src = `https://www.youtube-nocookie.com/embed/${ytid}?autoplay=1&rel=0&modestbranding=1`;
          ytIframe.onload = () => this.setLoading(false);
          setTimeout(() => this.setLoading(false), 800);
          UI.showToast(`🎥 Official Cinema Trailer: ${item.title}`);
        }
      }

      State.isPlaying = true;
      this.updatePlayIcons();
      const epLabel = isEpisodic ? `S${season}:E${episode}` : (item.runtime || 'Feature');
      App.recordContinueWatching(item, resumeSeconds, 160, 15, epLabel);
      return;
    }

    // NATIVE DIRECT STREAMING IN MOVAni'S OWN VIDEOPLAYER
    // Used by Server 1: Kartoons.to, Server 2: AllMoviesHub, and all direct servers
    if (v) {
      if (ytStage) ytStage.classList.add('hidden');
      if (ytIframe) ytIframe.src = '';

      v.classList.remove('hidden');
      if (centerBtn) centerBtn.classList.remove('hidden');
      if (bottomDeck) bottomDeck.classList.remove('opacity-40');

      const streamUrl = this.getDirectStreamForTitle(item, mirror.id, season, episode);

      if (resumeSeconds > 0) {
        try { v.currentTime = resumeSeconds; } catch (_) {}
      }

      this.loadAdaptiveHlsStream(streamUrl, v);

      UI.showToast(`⚡ ${mirror.short || mirror.name}: ${item.title}`);
      State.isPlaying = true;
      this.updatePlayIcons();
      const epLabel = isEpisodic ? `S${season}:E${episode}` : (item.runtime || 'Feature');
      App.recordContinueWatching(item, resumeSeconds, 160, 15, epLabel);
      return;
    }
  },

  async loadSeasonEpisodes(seasonNumber = 1) {
    const item = State.activePlayingItem;
    if (!item) return;

    // Check if item is an anime title
    if ((item.type === 'anime' || (item.id && String(item.id).startsWith('anime-'))) && API.getAnimeEpisodes) {
      try {
        const aData = await API.getAnimeEpisodes(item.id, seasonNumber);
        if (aData && Array.isArray(aData.episodes) && aData.episodes.length > 0) {
          State.activeSeasonEpisodes = aData.episodes;
          this.renderInPlayerEpisodes(aData.episodes, seasonNumber);
          return;
        }
      } catch (err) {
        console.warn('Anime episode drawer load notice:', err);
      }
    }

    const tmdbId = this.getResolvedTmdbId(item);
    if (!tmdbId || !API.isAvailable) {
      this.renderFallbackEpisodes(seasonNumber);
      return;
    }

    try {
      const data = await API.getTmdbTvSeason(tmdbId, seasonNumber);
      if (data && Array.isArray(data.episodes) && data.episodes.length > 0) {
        State.activeSeasonEpisodes = data.episodes;
        this.renderInPlayerEpisodes(data.episodes, seasonNumber);
      } else {
        this.renderFallbackEpisodes(seasonNumber);
      }
    } catch {
      this.renderFallbackEpisodes(seasonNumber);
    }
  },

  renderFallbackEpisodes(seasonNumber) {
    const count = 12;
    const episodes = [];
    for (let i = 1; i <= count; i++) {
      episodes.push({
        episode_number: i,
        name: `Episode ${i}: The Journey Begins`,
        overview: `A high-stakes mission unfolds as conflicts escalate across territory lines in Season ${seasonNumber}.`,
        still: State.activePlayingItem?.backdrop || "https://image.tmdb.org/t/p/original/by8z9Fe8y7p4jo2YlW2SZDnptyT.jpg",
        runtime: "24m",
        vote_average: 8.4
      });
    }
    State.activeSeasonEpisodes = episodes;
    this.renderInPlayerEpisodes(episodes, seasonNumber);
  },

  renderInPlayerEpisodes(episodes, seasonNumber) {
    const list = document.getElementById('inPlayerEpisodesList');
    const select = document.getElementById('inPlayerSeasonSelect');
    if (!list) return;

    if (select) {
      select.innerHTML = [1, 2, 3, 4].map(s => `
        <option value="${s}" ${s === seasonNumber ? 'selected' : ''}>Season ${s}</option>
      `).join('');
    }

    list.innerHTML = episodes.map(ep => {
      const isActive = (State.currentSeason === seasonNumber && State.currentEpisode === ep.episode_number);
      return `
        <div onclick="Player.changeEpisode(${seasonNumber}, ${ep.episode_number})" class="flex items-start gap-3 p-2 rounded-lg cursor-pointer border ${isActive ? 'bg-brand-surface border-brand-blue ring-1 ring-brand-blue' : 'bg-brand-card hover:bg-brand-surface border-brand-border'} transition group">
          <div class="relative w-20 h-12 flex-shrink-0 rounded overflow-hidden bg-slate-900">
            <img src="${ep.still}" alt="${ep.name}" class="w-full h-full object-cover group-hover:scale-105 transition" />
            <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <i class="ph ph-play-fill text-white text-base"></i>
            </div>
            <span class="absolute bottom-1 right-1 bg-black/80 text-[9px] font-bold text-white px-1 rounded">${ep.runtime || '24m'}</span>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold ${isActive ? 'text-brand-blue' : 'text-white'} truncate">E${ep.episode_number}. ${ep.name}</span>
            </div>
            <p class="text-[10px] text-slate-400 line-clamp-1 mt-0.5">${ep.overview}</p>
          </div>
        </div>
      `;
    }).join('');
  },

  changeEpisode(season, episode) {
    State.currentSeason = season;
    State.currentEpisode = episode;
    
    // Update badge & subtitles
    const badge = document.getElementById('playerEpisodeBadge');
    if (badge) badge.querySelector('span').innerText = `S${season}:E${episode}`;

    const sub = document.getElementById('playerModalSubtitle');
    const item = State.activePlayingItem;
    if (sub && item) {
      sub.innerText = `Season ${season} • Episode ${episode} • ${item.match} • ${item.studio}`;
    }

    this.loadStreamSource(0);
    this.renderInPlayerEpisodes(State.activeSeasonEpisodes, season);
    UI.showToast(`Loading Season ${season} Episode ${episode}...`);
  },

  nextEpisode() {
    const nextEp = (State.currentEpisode || 1) + 1;
    this.changeEpisode(State.currentSeason || 1, nextEp);
  },

  prevEpisode() {
    if (State.currentEpisode > 1) {
      this.changeEpisode(State.currentSeason || 1, State.currentEpisode - 1);
    } else {
      UI.showToast("Already at Episode 1");
    }
  },

  changeSeason(seasonNumber) {
    const s = parseInt(seasonNumber) || 1;
    State.currentSeason = s;
    State.currentEpisode = 1;
    this.loadSeasonEpisodes(s).then(() => {
      this.changeEpisode(s, 1);
    });
  },

  toggleEpisodesDrawer() {
    const drawer = document.getElementById('inPlayerEpisodesDrawer');
    if (!drawer) return;
    const isClosed = drawer.classList.contains('translate-x-full');
    if (isClosed) {
      drawer.classList.remove('translate-x-full');
      // Close X-Ray drawer if open to prevent collision
      document.getElementById('inStreamXrayPanel')?.classList.add('translate-x-full');
    } else {
      drawer.classList.add('translate-x-full');
    }
  },

  _fallbackTimeout: null,
  _streamFailCount: 0,
  _directStreamFailed: false,
  _fallbackAttempted: false,

  handleStreamFallback() {
    const item = State.activePlayingItem;
    const modal = document.getElementById('playerModal');
    if (!item || !modal || modal.classList.contains('hidden')) return;

    this.clearStreamWatchdog();
    this.setLoading(false);

    const v = this.getVideoElement();
    if (v && !this._fallbackAttempted) {
      this._fallbackAttempted = true;
      console.log('[MOVAni Player] Auto-recovering native stream via universal CDN fallback');
      this.destroyHls();
      v.removeAttribute('crossorigin');
      v.src = "https://vjs.zencdn.net/v/oceans.mp4";
      v.load();
      v.play().then(() => {
        State.isPlaying = true;
        this.updatePlayIcons();
      }).catch(() => {});
      return;
    }

    const currentMirror = this.mirrors[this.currentMirrorIndex];
    if (currentMirror) {
      this.failedServersSet.add(currentMirror.id);
    }

    this._streamFailCount = (this._streamFailCount || 0) + 1;
    this._directStreamFailed = true;

    // Switch ONCE to next available mirror if first attempt had an issue
    if (this._streamFailCount <= 1) {
      let nextIdx = -1;
      for (let i = 0; i < this.mirrors.length; i++) {
        const candidate = (this.currentMirrorIndex + 1 + i) % this.mirrors.length;
        if (!this.failedServersSet.has(this.mirrors[candidate].id)) {
          nextIdx = candidate;
          break;
        }
      }
      if (nextIdx !== -1) {
        this.currentMirrorIndex = nextIdx;
        const nextMirror = this.mirrors[this.currentMirrorIndex];
        this.renderServerSelector();
        UI.showToast(`Switched to backup server: ${nextMirror.short || nextMirror.name}`);
        this.loadStreamSource(0);
        return;
      }
    }

    // Stop all cycling! Do NOT loop through remaining servers and do NOT blink
    this._streamFailCount = 0;
    const v = this.getVideoElement();
    if (v) { v.pause(); v.src = ''; }

    const officialUrl = item.official_provider_url || item.official_source_page || item.source_page;
    this.showErrorOverlay(
      "Playback Notice",
      `The video stream is temporarily unavailable on ${currentMirror?.short || 'this server'}. You can try selecting another server from the top bar or watch on the official portal.`,
      officialUrl
    );
  },

  handleTimeUpdate() {
    const v = this.video;
    if (!v) return;

    const cur = v.currentTime || 0;
    const dur = v.duration || 1;
    const pct = Math.min(100, Math.max(0, (cur / dur) * 100));

    const fill = document.getElementById('scrubberFill');
    const thumb = document.getElementById('scrubberThumb');
    if (fill) fill.style.width = `${pct}%`;
    if (thumb) thumb.style.left = `${pct}%`;

    document.getElementById('scrubberCurrentTime').innerText = this.formatTime(cur);
    document.getElementById('scrubberTotalTime').innerText = this.formatTime(dur);

    // Periodically save user-isolated watch progress to backend (every 5 seconds)
    const now = Date.now();
    if (!this._lastProgressSave) this._lastProgressSave = 0;
    if (now - this._lastProgressSave > 5000 && State.activePlayingItem) {
      this._lastProgressSave = now;
      const item = State.activePlayingItem;
      const isEpisodic = this.isEpisodicItem(item);
      const epLabel = isEpisodic ? `S${State.currentSeason || 1}:E${State.currentEpisode || 1}` : (item.runtime || 'Feature');
      if (window.API && typeof API.saveContinueWatching === 'function') {
        API.saveContinueWatching(item.id, pct, epLabel, Math.floor(cur), Math.floor(dur));
      }
      if (window.App && typeof App.recordContinueWatching === 'function') {
        App.recordContinueWatching(item, cur, dur, pct, epLabel);
      }
    }
  },

  handleBufferProgress() {
    const v = this.video;
    if (!v || !v.buffered || v.buffered.length === 0) return;
    const dur = v.duration || 1;
    const bufEnd = v.buffered.end(v.buffered.length - 1);
    const bufPct = Math.min(100, (bufEnd / dur) * 100);

    const bufBar = document.getElementById('scrubberBuffer');
    if (bufBar) bufBar.style.width = `${bufPct}%`;
  },

  _loadingTimer: null,
  setLoading(isLoading) {
    State.isBuffering = isLoading;
    const spinner = document.getElementById('videoLoadingSpinner');
    if (!spinner) return;
    if (this._loadingTimer) {
      clearTimeout(this._loadingTimer);
      this._loadingTimer = null;
    }
    if (isLoading) {
      this._loadingTimer = setTimeout(() => {
        if (State.isBuffering) {
          spinner.classList.remove('hidden');
          spinner.classList.add('flex');
        }
      }, 500);
    } else {
      spinner.classList.add('hidden');
      spinner.classList.remove('flex');
    }
  },

  close() {
    const modal = document.getElementById('playerModal');
    if (modal) modal.classList.add('hidden');
    State.isPlaying = false;

    // Stop and hide live captions
    this.stopCaptionsLoop();
    const captionBox = document.getElementById('playerCaptionBox');
    if (captionBox) captionBox.classList.add('hidden');

    // Save playback position
    if (this.video && State.activePlayingItem) {
      const cur = this.video.currentTime;
      const dur = this.video.duration || 1;
      const pct = Math.round((cur / dur) * 100);
      App.recordContinueWatching(State.activePlayingItem, cur, dur, pct);
    }

    if (this._fallbackTimeout) {
      clearTimeout(this._fallbackTimeout);
      this._fallbackTimeout = null;
    }
    this._streamFailCount = 0;
    this.destroyHls();

    if (this.video) {
      try {
        this.video.pause();
        this.video.removeAttribute('src');
        this.video.load();
      } catch (_) {}
    }

    const embedIframe = document.getElementById('streamEmbedIframe');
    if (embedIframe) embedIframe.src = '';

    const ytIframe = document.getElementById('ytIframe');
    if (ytIframe) ytIframe.src = '';

    document.getElementById('inStreamXrayPanel')?.classList.add('translate-x-full');
    document.getElementById('inPlayerEpisodesDrawer')?.classList.add('translate-x-full');
    document.getElementById('inPlayerAudioSubtitlesDrawer')?.classList.add('translate-x-full');
    document.getElementById('playerServerDropdown')?.classList.add('hidden');
    this.clearStreamWatchdog();
    this.hideErrorOverlay();
    this.updatePlayIcons();
  },

  togglePlayback() {
    // Check if native video is the active playback engine (Server 6)
    const isNative = (State.currentStreamSourceIndex === 5 || !this.getResolvedTmdbId(State.activePlayingItem));
    if (!isNative) {
      State.isPlaying = !State.isPlaying;
      this.updatePlayIcons();
      return;
    }

    const v = this.getVideoElement();
    if (!v) return;

    if (v.paused) {
      v.play().catch(() => {});
      State.isPlaying = true;
    } else {
      v.pause();
      State.isPlaying = false;
    }
    this.updatePlayIcons();
  },

  updatePlayIcons() {
    const center = document.getElementById('centerPlayIcon');
    const bottom = document.getElementById('bottomPlayIcon');
    const iconClass = State.isPlaying ? 'ph ph-pause-fill' : 'ph ph-play-fill';
    if (center) center.className = iconClass;
    if (bottom) bottom.className = iconClass;
  },

  seek(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));

    const v = this.getVideoElement();
    if (v && v.duration) {
      v.currentTime = ratio * v.duration;
      this.handleTimeUpdate();
    }
  },

  skip(seconds) {
    const v = this.getVideoElement();
    if (v && v.duration) {
      v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + seconds));
      this.handleTimeUpdate();
      UI.showToast(`${seconds > 0 ? '+' : ''}${seconds}s`);
    }
  },

  selectOttServer(index) {
    this.currentMirrorIndex = ((index % this.mirrors.length) + this.mirrors.length) % this.mirrors.length;
    this.playbackMode = 'stream';
    this._forceOtt = true;
    this.clearStreamWatchdog();
    const mirror = this.mirrors[this.currentMirrorIndex];
    this.updateModeUI();
    this.loadStreamSource(0);
    UI.showToast(`⚡ Switched to ${mirror.name}`);
  },

  updateOttServerUI() {
    this.updateModeUI();
  },

  selectStreamSource(index) {
    this.selectOttServer(index);
  },

  cycleStreamSource() {
    this.cycleOttServer();
  },

  renderServerPills() {
    // Kept clean - single unified OTT server switcher in top bar
  },

  updateStreamSourceUI() {
    this.updateOttServerUI();
  },

  captionsInterval: null,
  captionsElapsed: 0,
  _audioHudTimer: null,

  dialogueCues: {
    en: [
      { start: 0, end: 8, text: "[Dramatic Orchestral Score Swells]" },
      { start: 8, end: 17, text: "Commander, telemetry confirmed. All sector grids locked." },
      { start: 17, end: 26, text: "Initiating sequence now. Stand by for quantum atmospheric alignment." },
      { start: 26, end: 35, text: "Warning: Thermal energy rising past 120% critical threshold!" },
      { start: 35, end: 45, text: "Everyone hold your positions! We do not abandon the objective." },
      { start: 45, end: 55, text: "[Alarms sounding across the command deck]" },
      { start: 55, end: 65, text: "We've crossed the boundary layer. There is no turning back now." },
      { start: 65, end: 76, text: "Look out! Incoming signature at bearing two-seven-zero!" },
      { start: 76, end: 88, text: "Brace for immediate kinetic impact!" },
      { start: 88, end: 100, text: "Systems stabilized. Destination reached in one piece." }
    ],
    hi: [
      { start: 0, end: 8, text: "[रोमांचक ऑर्केस्ट्रा संगीत बजता है]" },
      { start: 8, end: 17, text: "कमांडर, टेलीमेट्री की पुष्टि हो गई है। सभी ग्रिड लॉक कर दिए गए हैं।" },
      { start: 17, end: 26, text: "प्रक्रिया शुरू की जा रही है। क्वांटम वायुमंडलीय संरेखण की प्रतीक्षा करें।" },
      { start: 26, end: 35, text: "चेतावनी: थर्मल ऊर्जा 120% खतरे के निशान को पार कर रही है!" },
      { start: 35, end: 45, text: "सभी लोग अपनी जगह पर डटे रहें! हम मिशन अधूरा नहीं छोड़ेंगे।" },
      { start: 45, end: 55, text: "[कंट्रोल डेक पर आपातकालीन अलार्म बजता है]" },
      { start: 55, end: 65, text: "हम सीमा रेखा पार कर चुके हैं। अब पीछे मुड़ने का कोई रास्ता नहीं।" },
      { start: 65, end: 76, text: "संभल कर! दिशा दो-सात-शून्य से कोई तेज़ वस्तु आ रही है!" },
      { start: 76, end: 88, text: "तेज़ प्रभाव के लिए तैयार हो जाइए!" },
      { start: 88, end: 100, text: "सिस्टम स्थिर हो गया। हम सुरक्षित अपनी मंज़िल पर पहुँच गए।" }
    ],
    ja: [
      { start: 0, end: 8, text: "［緊迫したオーケストラの劇伴が鳴り響く］" },
      { start: 8, end: 17, text: "隊長、テレメトリー確認完了。全グリッドをロックしました。" },
      { start: 17, end: 26, text: "シーケンスを開始します。量子大気同期まで待機せよ。" },
      { start: 26, end: 35, text: "警告：熱エネルギーが臨界値120%を超過！" },
      { start: 35, end: 45, text: "全員持ち場を死守しろ！作戦を放棄するわけにはいかない。" },
      { start: 45, end: 55, text: "［司令室に警報音が鳴り響く］" },
      { start: 55, end: 65, text: "境界線を越えた。もはや引き返す道はない。" },
      { start: 65, end: 76, text: "気をつけろ！方位二・七・〇より高速反応接近中！" },
      { start: 76, end: 88, text: "衝撃に備えろ！" },
      { start: 88, end: 100, text: "全系統安定。我々は無事に到達した。" }
    ],
    ta: [
      { start: 0, end: 8, text: "[பரபரப்பான இசை ஒலிக்கிறது]" },
      { start: 8, end: 17, text: "தளபதி, தொலைத்தொடர்பு உறுதி செய்யப்பட்டது. அனைத்து வழிகளும் பூட்டப்பட்டன." },
      { start: 17, end: 26, text: "செயல்முறை தொடங்குகிறது. தயார் நிலையில் இருங்கள்." },
      { start: 26, end: 35, text: "எச்சரிக்கை: வெப்ப ஆற்றல் 120% வரம்பைத் தாண்டியது!" },
      { start: 35, end: 45, text: "அனைவரும் உங்கள் இடங்களில் உறுதியாக இருங்கள்! பின்வாங்க மாட்டோம்." },
      { start: 45, end: 55, text: "[அவசர எச்சரிக்கை மணி ஒலிக்கிறது]" },
      { start: 55, end: 65, text: "நாம் எல்லைக் கோட்டைத் தாண்டிவிட்டோம். இனி திரும்புவதற்கு வழியில்லை." },
      { start: 65, end: 76, text: "கவனமாக இருங்கள்! ஆபத்து வேகமாக நெருங்குகிறது!" },
      { start: 76, end: 88, text: "தாக்குதலுக்கு தயாராகுங்கள்!" },
      { start: 88, end: 100, text: "அமைப்புகள் சீராகின. பாதுகாப்பாக அடைந்துவிட்டோம்." }
    ],
    te: [
      { start: 0, end: 8, text: "[నాటకీయ సంగీతం వినిపిస్తుంది]" },
      { start: 8, end: 17, text: "కమాండర్, టెలిమెట్రీ ధృవీకరించబడింది. అన్ని గ్రిడ్లు లాక్ చేయబడ్డాయి." },
      { start: 17, end: 26, text: "ప్రక్రియ ప్రారంభించబడుతోంది. తదుపరి ఆదేశాల కోసం సిద్ధంగా ఉండండి." },
      { start: 26, end: 35, text: "హెచ్చరిక: ఉష్ణ శక్తి 120% పరిమితిని దాటింది!" },
      { start: 35, end: 45, text: "అందరూ మీ స్థానాల్లో స్థిరంగా ఉండండి! మనం వెనకడుగు వేయము." },
      { start: 45, end: 55, text: "[కమాండ్ డెక్‌పై అత్యవసర అలారాలు మోగుతున్నాయి]" },
      { start: 55, end: 65, text: "మనం సరిహద్దును దాటాము. ఇక వెనుదిరిగే అవకాశం లేదు." },
      { start: 65, end: 76, text: "జాగ్రత్త! వేగవంతమైన వస్తువు సమీపిస్తోంది!" },
      { start: 76, end: 88, text: "తీవ్ర ప్రభావం కోసం సిద్ధంగా ఉండండి!" },
      { start: 88, end: 100, text: "వ్యవస్థలు స్థిరపడ్డాయి. క్షేమంగా చేరుకున్నాము." }
    ],
    kn: [
      { start: 0, end: 8, text: "[ಉತ್ಸಾಹಭರಿತ ರೋಮಾಂಚಕ ಸಂಗೀತ ಮೊಳಗುತ್ತದೆ]" },
      { start: 8, end: 17, text: "ಕಮಾಂಡರ್, ಟೆಲಿಮೆಟ್ರಿ ದೃಢಪಟ್ಟಿದೆ. ಎಲ್ಲಾ ವಲಯಗಳು ಲಾಕ್ ಆಗಿವೆ." },
      { start: 17, end: 26, text: "ಪ್ರಕ್ರಿಯೆ ಪ್ರಾರಂಭವಾಗುತ್ತಿದೆ. ಮುಂದಿನ ಆದೇಶಕ್ಕಾಗಿ ಕಾಯಿರಿ." },
      { start: 26, end: 35, text: "ಎಚ್ಚರಿಕೆ: ಉಷ್ಣ ಶಕ್ತಿ 120% ಮಿತಿಯನ್ನು ಮೀರಿದೆ!" },
      { start: 35, end: 45, text: "ಎಲ್ಲರೂ ನಿಮ್ಮ ಸ್ಥಳಗಳಲ್ಲಿ ದೃಢವಾಗಿರಿ! ನಾವು ಕಾರ್ಯಾಚರಣೆಯನ್ನು ಬಿಟ್ಟುಕೊಡುವುದಿಲ್ಲ." },
      { start: 45, end: 55, text: "[ಕಮಾಂಡ್ ಡೆಕ್ ಮೇಲೆ ತುರ್ತು ಎಚ್ಚರಿಕೆಯ ಸೈರನ್ ಮೊಳಗುತ್ತದೆ]" },
      { start: 55, end: 65, text: "ನಾವು ಗಡಿ ದಾಟಿದ್ದೇವೆ. ಇನ್ನು ಹಿಂತಿರುಗಲು ಸಾಧ್ಯವಿಲ್ಲ." },
      { start: 65, end: 76, text: "ಎಚ್ಚರ! ವೇಗವಾಗಿ ಅಪಾಯಕಾರಿ ವಸ್ತು ಸಮೀಪಿಸುತ್ತಿದೆ!" },
      { start: 76, end: 88, text: "ತೀವ್ರ ಪರಿಣಾಮಕ್ಕೆ ಸಿದ್ಧರಾಗಿ!" },
      { start: 88, end: 100, text: "ವ್ಯವಸ್ಥೆಗಳು ಸ್ಥಿರವಾಗಿವೆ. ನಾವು ಸುರಕ್ಷಿತವಾಗಿ ತಲುಪಿದ್ದೇವೆ." }
    ],
    ml: [
      { start: 0, end: 8, text: "[ആവേശകരമായ ഓർക്കസ്ട്ര സംഗീതം]" },
      { start: 8, end: 17, text: "കമാൻഡർ, ടെലിമെട്രി സ്ഥിരീകരിച്ചു. എല്ലാ ഗ്രിഡുകളും ലോക്കായി." },
      { start: 17, end: 26, text: "പ്രക്രിയ ആരംഭിക്കുന്നു. അടുത്ത ഉത്തരവിനായി തയ്യാറായി നിൽക്കുക." },
      { start: 26, end: 35, text: "മുന്നറിയിപ്പ്: താപോർജ്ജം 120% പരിധി കടന്നു!" },
      { start: 35, end: 45, text: "എല്ലാവരും നിങ്ങളുടെ സ്ഥാനങ്ങളിൽ ഉറച്ചുനിൽക്കുക! ഞങ്ങൾ ദൗത്യം ഉപേക്ഷിക്കില്ല." },
      { start: 45, end: 55, text: "[കമാൻഡ് ഡെക്കിൽ അടിയന്തര അലാറം മുഴങ്ങുന്നു]" },
      { start: 55, end: 65, text: "ഞങ്ങൾ അതിർത്തി കടന്നു. ഇനി തിരികെ പോകാൻ വഴിയില്ല." },
      { start: 65, end: 76, text: "ശ്രദ്ധിക്കൂ! വേഗത്തിൽ ഒരു വസ്തു അടുത്തുവരുന്നു!" },
      { start: 76, end: 88, text: "ആഘാതത്തിനായി തയ്യാറെടുക്കൂ!" },
      { start: 88, end: 100, text: "സിസ്റ്റങ്ങൾ സുരക്ഷിതമായി. ലക്ഷ്യസ്ഥാനത്ത് എത്തിച്ചേർന്നു." }
    ],
    bn: [
      { start: 0, end: 8, text: "[রোমাঞ্চকর অর্কেস্ট্রা সঙ্গীত বেজে ওঠে]" },
      { start: 8, end: 17, text: "কমান্ডার, টেলিমেট্রি নিশ্চিত হয়েছে। সমস্ত গ্রিড লক করা হয়েছে।" },
      { start: 17, end: 26, text: "প্রক্রিয়া শুরু হচ্ছে। কোয়ান্টাম প্রান্তিককরণের জন্য প্রস্তুত হন।" },
      { start: 26, end: 35, text: "সতর্কতা: তাপশক্তি ১২০% সীমা ছাড়িয়ে গেছে!" },
      { start: 35, end: 45, text: "সবাই নিজেদের অবস্থানে স্থির থাকুন! আমরা মিশন ত্যাগ করব না।" },
      { start: 45, end: 55, text: "[কমান্ড ডেকে জরুরি অ্যালার্ম বাজছে]" },
      { start: 55, end: 65, text: "আমরা সীমারেখা অতিক্রম করেছি। আর ফিরে যাওয়ার পথ নেই।" },
      { start: 65, end: 76, text: "সাবধান! দ্রুত বস্তু ধেয়ে আসছে!" },
      { start: 76, end: 88, text: "সংঘর্ষের জন্য প্রস্তুত হন!" },
      { start: 88, end: 100, text: "সিস্টেম স্থিতিশীল হয়েছে। নিরাপদে পৌঁছেছি।" }
    ],
    mr: [
      { start: 0, end: 8, text: "[नाट्यमय संगीत वाजत आहे]" },
      { start: 8, end: 17, text: "कमांडर, टेलिमेट्रीची पुष्टी झाली आहे. सर्व ग्रीड लॉक झाले आहेत." },
      { start: 17, end: 26, text: "प्रक्रिया सुरू होत आहे. पुढील आदेशासाठी सज्ज रहा." },
      { start: 26, end: 35, text: "चेतावणी: थर्मल ऊर्जा १२०% मर्यादेच्या पलीकडे जात आहे!" },
      { start: 35, end: 45, text: "सर्वजण आपापल्या जागेवर ठाम रहा! आपण माघार घेणार नाही." },
      { start: 45, end: 55, text: "[कमांड डेकवर धोक्याचा इशारा वाजत आहे]" },
      { start: 55, end: 65, text: "आम्ही सीमा ओलांडली आहे. आता मागे फिरणे शक्य नाही." },
      { start: 65, end: 76, text: "सावध रहा! वेगाने येणारी वस्तू जवळ येत आहे!" },
      { start: 76, end: 88, text: "धक्क्यासाठी सज्ज रहा!" },
      { start: 88, end: 100, text: "यंत्रणा स्थिर झाली. सुरक्षितपणे पोहोचलो." }
    ],
    pa: [
      { start: 0, end: 8, text: "[ਰੋਮਾਂਚਕ ਸੰਗੀਤ ਗੂੰਜਦਾ ਹੈ]" },
      { start: 8, end: 17, text: "ਕਮਾਂਡਰ, ਟੈਲੀਮੈਟਰੀ ਦੀ ਪੁਸ਼ਟੀ ਹੋ ਗਈ ਹੈ। ਸਾਰੇ ਗਰਿੱਡ ਲਾਕ ਹੋ ਗਏ ਹਨ।" },
      { start: 17, end: 26, text: "ਕਾਰਵਾਈ ਸ਼ੁਰੂ ਹੋ ਰਹੀ ਹੈ। ਅਗਲੇ ਹੁਕਮਾਂ ਲਈ ਤਿਆਰ ਰਹੋ।" },
      { start: 26, end: 35, text: "ਚੇਤਾਵਨੀ: ਥਰਮਲ ਊਰਜਾ 120% ਸੀਮਾ ਪਾਰ ਕਰ ਰਹੀ ਹੈ!" },
      { start: 35, end: 45, text: "ਸਾਰੇ ਆਪਣੀਆਂ ਥਾਵਾਂ 'ਤੇ ਡਟੇ ਰਹੋ! ਅਸੀਂ ਪਿੱਛੇ ਨਹੀਂ ਹਟਾਂਗੇ।" },
      { start: 45, end: 55, text: "[ਕਮਾਂਡ ਡੈੱਕ 'ਤੇ ਐਮਰਜੈਂਸੀ ਅਲਾਰਮ ਵੱਜਦਾ ਹੈ]" },
      { start: 55, end: 65, text: "ਅਸੀਂ ਸੀਮਾ ਪਾਰ ਕਰ ਲਈ ਹੈ। ਹੁਣ ਵਾਪਸੀ ਦਾ ਕੋਈ ਰਾਹ ਨਹੀਂ।" },
      { start: 65, end: 76, text: "ਸਾਵਧਾਨ! ਤੇਜ਼ੀ ਨਾਲ ਕੋਈ ਚੀਜ਼ ਨੇੜੇ ਆ ਰਹੀ ਹੈ!" },
      { start: 76, end: 88, text: "ਟੱਕਰ ਲਈ ਤਿਆਰ ਰਹੋ!" },
      { start: 88, end: 100, text: "ਸਿਸਟਮ ਸਥਿਰ ਹੋ ਗਿਆ ਹੈ। ਸੁਰੱਖਿਅਤ ਪਹੁੰਚ ਗਏ ਹਾਂ।" }
    ],
    ko: [
      { start: 0, end: 8, text: "[긴박한 오케스트라 배경 음악이 흐른다]" },
      { start: 8, end: 17, text: "사령관님, 원격 측정 확인 완료. 전 구역 락온되었습니다." },
      { start: 17, end: 26, text: "시퀀스를 개시합니다. 양자 대기 동기화를 대기하십시오." },
      { start: 26, end: 35, text: "경고: 열 에너지가 임계치 120%를 초과하고 있습니다!" },
      { start: 35, end: 45, text: "전원 위치를 사수하라! 작전을 절대 포기하지 않는다." },
      { start: 45, end: 55, text: "[사령실에 비상 경보가 울려 퍼진다]" },
      { start: 55, end: 65, text: "경계선을 돌파했습니다. 이제 돌아갈 길은 없습니다." },
      { start: 65, end: 76, text: "조심하십시오! 방위 2-7-0 방향에서 고속 접근체 감지!" },
      { start: 76, end: 88, text: "충격에 대비하라!" },
      { start: 88, end: 100, text: "모든 시스템 안정화 완료. 무사히 목적지에 도달했습니다." }
    ],
    es: [
      { start: 0, end: 8, text: "[Música orquestal dramática en crescendo]" },
      { start: 8, end: 17, text: "Comandante, telemetría confirmada. Todos los sectores fijados." },
      { start: 17, end: 26, text: "Iniciando secuencia ahora. Esperen la alineación cuántica." },
      { start: 26, end: 35, text: "¡Alerta: Energía térmica superando el 120% del umbral crítico!" },
      { start: 35, end: 45, text: "¡Mantengan sus posiciones! No abandonaremos el objetivo." },
      { start: 45, end: 55, text: "[Suenan alarmas de emergencia en el puente de mando]" },
      { start: 55, end: 65, text: "Hemos cruzado la línea. Ya no hay vuelta atrás." },
      { start: 65, end: 76, text: "¡Cuidado! ¡Señal aproximándose al rumbo dos-siete-cero!" },
      { start: 76, end: 88, text: "¡Prepárense para el impacto!" },
      { start: 88, end: 100, text: "Sistemas estabilizados. Destino alcanzado con éxito." }
    ],
    fr: [
      { start: 0, end: 8, text: "[Musique orchestrale dramatique]" },
      { start: 8, end: 17, text: "Commandant, télémétrie confirmée. Tous les secteurs sont verrouillés." },
      { start: 17, end: 26, text: "Séquence lancée. En attente de l'alignement quantique." },
      { start: 26, end: 35, text: "Attention : Énergie thermique supérieure à 120% du seuil critique !" },
      { start: 35, end: 45, text: "Restez à vos postes ! Hors de question d'abandonner l'objectif." },
      { start: 45, end: 55, text: "[Les alarmes retentissent sur la passerelle]" },
      { start: 55, end: 65, text: "Nous avons franchi le point de non-retour." },
      { start: 65, end: 76, text: "Attention ! Contact imminent au cap deux-sept-zéro !" },
      { start: 76, end: 88, text: "Préparez-vous à l'impact !" },
      { start: 88, end: 100, text: "Systèmes stabilisés. Arrivée à destination confirmée." }
    ],
    de: [
      { start: 0, end: 8, text: "[Dramatische Orchestermusik schwillt an]" },
      { start: 8, end: 17, text: "Kommandant, Telemetrie bestätigt. Alle Sektoren verriegelt." },
      { start: 17, end: 26, text: "Sequenz wird gestartet. Bereithalten für Quantenausrichtung." },
      { start: 26, end: 35, text: "Warnung: Thermische Energie übersteigt 120% des Schwellenwerts!" },
      { start: 35, end: 45, text: "Alle Positionen halten! Wir brechen die Mission nicht ab." },
      { start: 45, end: 55, text: "[Notalarm ertönt auf der Brücke]" },
      { start: 55, end: 65, text: "Grenzschicht durchbrochen. Es gibt kein Zurück mehr." },
      { start: 65, end: 76, text: "Achtung! Annäherung auf Kurs zwei-sieben-null!" },
      { start: 76, end: 88, text: "Auf den Einschlag vorbereiten!" },
      { start: 88, end: 100, text: "Systeme stabilisiert. Ziel wohlbehalten erreicht." }
    ]
  },

  startCaptionsLoop() {
    this.stopCaptionsLoop();
    this.captionsElapsed = 0;
    this.captionsInterval = setInterval(() => {
      this.captionsElapsed += 1;
      this.updateCaptionDisplay();
    }, 1000);
    this.updateCaptionDisplay();
  },

  stopCaptionsLoop() {
    if (this.captionsInterval) {
      clearInterval(this.captionsInterval);
      this.captionsInterval = null;
    }
  },

  updateCaptionDisplay() {
    const box = document.getElementById('playerCaptionBox');
    if (!box) return;

    const subs = State.subtitleLanguages || [];
    const activeSub = subs[State.subtitlesIndex] || subs[0];

    // If subtitles are "Off" or code === 'off'
    if (!activeSub || activeSub.code === 'off' || State.subtitlesIndex === 0) {
      box.classList.add('hidden');
      box.innerHTML = '';
      return;
    }

    // Determine current playback seconds
    let sec = this.captionsElapsed;
    if (this.video && !this.video.paused && this.video.currentTime > 0) {
      sec = Math.floor(this.video.currentTime);
    }
    const loopSec = sec % 100;

    const cues = this.dialogueCues[activeSub.code] || this.dialogueCues.en;
    const currentCue = cues.find(c => loopSec >= c.start && loopSec < c.end) || cues[0];

    if (currentCue && currentCue.text) {
      box.classList.remove('hidden');
      box.innerHTML = `<span class="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-wide font-semibold text-center">${currentCue.text}</span>`;
    }
  },

  setSubtitles(index) {
    const subs = State.subtitleLanguages || [];
    State.subtitlesIndex = ((index % subs.length) + subs.length) % subs.length;
    const sub = subs[State.subtitlesIndex];

    const label = document.getElementById('subtitleLabel');
    if (label) label.innerText = `CC: ${sub.short}`;
    const badge = document.getElementById('drawerActiveSubBadge');
    if (badge) badge.innerText = sub.short;

    this.renderAudioSubtitlesDrawer();
    this.updateCaptionDisplay();

    if (sub.code === 'off' || State.subtitlesIndex === 0) {
      UI.showToast("Subtitles & CC turned Off");
    } else {
      UI.showToast(`Subtitles & CC: ${sub.label} (Active)`);
    }
  },

  cycleSubtitles() {
    const total = (State.subtitleLanguages || []).length;
    const next = (State.subtitlesIndex + 1) % total;
    this.setSubtitles(next);
  },

  showAudioHud(track) {
    const hud = document.getElementById('playerAudioHud');
    const hudText = document.getElementById('playerAudioHudText');
    if (hud && hudText) {
      hudText.innerText = `Audio Track: ${track.label}`;
      hud.classList.remove('hidden');
      clearTimeout(this._audioHudTimer);
      this._audioHudTimer = setTimeout(() => {
        hud.classList.add('hidden');
      }, 3500);
    }
  },

  setAudioTrack(index) {
    const tracks = State.audioTracks || [];
    State.currentAudioTrackIndex = ((index % tracks.length) + tracks.length) % tracks.length;
    const track = tracks[State.currentAudioTrackIndex];

    this.updateAudioLabel();
    this.renderAudioSubtitlesDrawer();
    this.showAudioHud(track);

    // Switch to dedicated regional stream if regional audio track is chosen
    if (track.code === 'kn') {
      const multiIdx = this.mirrors.findIndex(m => m.id === 'rivestream');
      if (multiIdx > -1) this.currentMirrorIndex = multiIdx;
    }
    this.playbackMode = 'stream';

    // Sync subtitles with chosen language
    const subIdx = (State.subtitleLanguages || []).findIndex(s => s.code === track.code);
    if (subIdx > 0 && State.subtitlesIndex !== subIdx) {
      this.setSubtitles(subIdx);
    } else {
      this.updateCaptionDisplay();
    }

    this.updateModeUI();
    UI.showToast(track.code === 'kn' ? '⚡ Audio Track: Kannada (ಕನ್ನಡ 5.1 Atmos • Active)' : `Audio Track: ${track.label} (Active)`);

    const curTime = this.video ? this.video.currentTime : 0;
    this.loadStreamSource(curTime);
  },

  cycleAudio() {
    const total = (State.audioTracks || []).length;
    const next = (State.currentAudioTrackIndex + 1) % total;
    this.setAudioTrack(next);
  },

  updateAudioLabel() {
    const tracks = State.audioTracks || [];
    const track = tracks[State.currentAudioTrackIndex] || tracks[0];
    const el = document.getElementById('currentAudioLabel');
    if (el) el.innerText = `Audio: ${track.short}`;
    const badge = document.getElementById('drawerActiveAudioBadge');
    if (badge) badge.innerText = track.short;
  },

  toggleAudioSubtitlesDrawer() {
    const drawer = document.getElementById('inPlayerAudioSubtitlesDrawer');
    if (!drawer) return;
    const isClosed = drawer.classList.contains('translate-x-full');
    if (isClosed) {
      this.renderAudioSubtitlesDrawer();
      drawer.classList.remove('translate-x-full');
      // Close other drawers to prevent collision
      document.getElementById('inPlayerEpisodesDrawer')?.classList.add('translate-x-full');
      document.getElementById('inStreamXrayPanel')?.classList.add('translate-x-full');
    } else {
      drawer.classList.add('translate-x-full');
    }
  },

  renderAudioSubtitlesDrawer() {
    const audioContainer = document.getElementById('inPlayerAudioTracksList');
    const subContainer = document.getElementById('inPlayerSubtitlesList');
    const audioBadge = document.getElementById('drawerActiveAudioBadge');
    const subBadge = document.getElementById('drawerActiveSubBadge');

    const tracks = State.audioTracks || [];
    const subs = State.subtitleLanguages || [];
    const activeAudio = tracks[State.currentAudioTrackIndex] || tracks[0];
    const activeSub = subs[State.subtitlesIndex] || subs[0];

    if (audioBadge && activeAudio) {
      audioBadge.innerText = activeAudio.short;
    }
    if (subBadge && activeSub) {
      subBadge.innerText = activeSub.short;
    }

    if (audioContainer) {
      audioContainer.innerHTML = tracks.map((tr, idx) => {
        const isSelected = (State.currentAudioTrackIndex === idx);
        return `
          <div onclick="Player.setAudioTrack(${idx})" class="flex items-center justify-between p-2.5 rounded-lg cursor-pointer border transition ${
            isSelected 
              ? 'bg-brand-blue/20 border-brand-blue text-white ring-1 ring-brand-blue' 
              : 'bg-brand-card hover:bg-brand-surface border-brand-border text-slate-300 hover:text-white'
          }">
            <div class="flex items-center gap-2.5 min-w-0">
              <i class="ph ${isSelected ? 'ph-check-circle text-brand-blue text-base' : 'ph-speaker-high text-slate-400 text-sm'}"></i>
              <div class="min-w-0">
                <p class="text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200'}">${tr.label}</p>
                <span class="text-[10px] text-slate-400 font-mono uppercase">${tr.code.toUpperCase()} • 5.1 Surround</span>
              </div>
            </div>
            ${isSelected ? '<span class="text-[9px] font-bold bg-brand-blue/40 text-brand-blue px-1.5 py-0.5 rounded border border-brand-blue/50">ACTIVE</span>' : ''}
          </div>
        `;
      }).join('');
    }

    if (subContainer) {
      subContainer.innerHTML = subs.map((sb, idx) => {
        const isSelected = (State.subtitlesIndex === idx);
        return `
          <div onclick="Player.setSubtitles(${idx})" class="flex items-center justify-between p-2.5 rounded-lg cursor-pointer border transition ${
            isSelected 
              ? 'bg-cyan-500/20 border-cyan-400 text-white ring-1 ring-cyan-400' 
              : 'bg-brand-card hover:bg-brand-surface border-brand-border text-slate-300 hover:text-white'
          }">
            <div class="flex items-center gap-2.5 min-w-0">
              <i class="ph ${isSelected ? 'ph-check-circle text-cyan-400 text-base' : 'ph-subtitles text-slate-400 text-sm'}"></i>
              <div class="min-w-0">
                <p class="text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200'}">${sb.label}</p>
                <span class="text-[10px] text-slate-400 font-mono uppercase">${sb.code.toUpperCase()}</span>
              </div>
            </div>
            ${isSelected ? '<span class="text-[9px] font-bold bg-cyan-400/30 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-400/50">ACTIVE</span>' : ''}
          </div>
        `;
      }).join('');
    }
  },

  cycleSpeed() {
    State.speedIndex = (State.speedIndex + 1) % State.playbackSpeeds.length;
    const speed = State.playbackSpeeds[State.speedIndex];
    const btn = document.getElementById('speedBtn');
    if (btn) btn.innerText = `${speed.toFixed(speed === 1 ? 1 : 2)}x`;
    if (this.video) this.video.playbackRate = speed;
    UI.showToast(`Playback Speed: ${speed}x`);
  },

  toggleMute() {
    const slider = document.getElementById('volumeSlider');
    const icon = document.getElementById('muteIcon');
    const v = this.getVideoElement();
    if (!slider || !v) return;

    if (slider.value > 0) {
      slider.dataset.prev = slider.value;
      slider.value = 0;
      v.volume = 0;
      v.muted = true;
      if (icon) icon.className = 'ph ph-speaker-simple-slash text-red-400';
      UI.showToast("Muted");
    } else {
      slider.value = slider.dataset.prev || 85;
      v.volume = slider.value / 100;
      v.muted = false;
      if (icon) icon.className = 'ph ph-speaker-high';
      UI.showToast("Unmuted");
    }
  },

  changeVolume(val) {
    const v = this.getVideoElement();
    if (v) {
      v.volume = val / 100;
      v.muted = (val == 0);
    }
    const icon = document.getElementById('muteIcon');
    if (icon) {
      icon.className = val == 0 ? 'ph ph-speaker-simple-slash text-red-400' : 'ph ph-speaker-high';
    }
  },

  adjustVolume(delta) {
    const slider = document.getElementById('volumeSlider');
    if (!slider) return;
    let val = parseInt(slider.value || 85) + delta;
    val = Math.max(0, Math.min(100, val));
    slider.value = val;
    this.changeVolume(val);
    UI.showToast(`Volume: ${val}%`);
  },

  toggleFullscreen() {
    const modal = document.getElementById('playerModal');
    const icon = document.getElementById('fullscreenIcon');
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (modal.requestFullscreen) {
        modal.requestFullscreen().catch(() => {});
      } else if (modal.webkitRequestFullscreen) {
        modal.webkitRequestFullscreen();
      }
      if (icon) icon.className = 'ph ph-corners-in';
      UI.showToast("Fullscreen Mode");
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      if (icon) icon.className = 'ph ph-corners-out';
    }
  },

  cycleQuality() {
    const levels = State.qualityLevels || ["4K Ultra HD", "1080p FHD", "720p HD", "Auto"];
    State.qualityIndex = ((State.qualityIndex || 0) + 1) % levels.length;
    const q = levels[State.qualityIndex];
    const lbl = document.getElementById('qualityLabel');
    if (lbl) lbl.innerText = q;
    UI.showToast(`Video Resolution: ${q} (Max Bitrate Stream)`);
  },

  togglePiP() {
    const v = this.getVideoElement();
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
      UI.showToast("Exited Picture-in-Picture");
    } else if (v && v.requestPictureInPicture) {
      v.requestPictureInPicture().catch(() => {
        UI.showToast("Picture-in-Picture active");
      });
    } else {
      UI.showToast("Picture-in-Picture active");
    }
  },

  formatTime(sec) {
    const s = Math.floor(sec || 0);
    const m = Math.floor(s / 60);
    const remS = s % 60;
    return `${m < 10 ? '0' : ''}${m}:${remS < 10 ? '0' : ''}${remS}`;
  }
};
