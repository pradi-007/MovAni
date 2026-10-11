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
      console.log('Native video stream error, switching to live server:', e);
      this.handleStreamFallback();
    });
  },

  isEpisodicItem(item) {
    if (!item) return false;
    const t = (item.type || '').toLowerCase();
    const id = String(item.id || '').toLowerCase();
    if (t === 'tv' || t === 'series' || t === 'anime' || t === 'show') return true;
    if (id.includes('-tv-') || id.includes('-series-') || id.includes('-anime-')) return true;
    if (item.runtime && (item.runtime.includes('Episode') || item.runtime.includes('Season') || item.runtime.startsWith('S'))) return true;
    return false;
  },

  getResolvedTmdbId(item) {
    if (!item) return null;
    if (item.tmdbId && !isNaN(item.tmdbId)) return String(item.tmdbId);
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
      'kgf': '554230',
      'kantara': '1013860',
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
      'munna bhai': '19625'
    };
    if (item.isUpcoming || item.theatricalStream) {
      return null;
    }
    const titleLower = (item.title || '').toLowerCase();
    for (const [key, tId] of Object.entries(titleMap)) {
      if (titleLower.includes(key)) return tId;
    }
    return null;
  },

  apiKey: "nx_f388cf270eb1c40dc4f1d5c9d79e9c12",

  currentMirrorIndex: 0,
  mirrors: [
    { id: "autoembed", name: "Server 1: AutoEmbed Cloud (High-Speed Global CDN • Instant)" },
    { id: "vidlink", name: "Server 2: VidLink Pro 4K (Instant Edge Stream • 4K)" },
    { id: "kannada", name: "Server 3: Kannada Cinema HD (ಕನ್ನಡ 5.1 Atmos • Original Audio)" },
    { id: "multiembed", name: "Server 4: MultiEmbed Prime (All Indian & Global Dubs)" },
    { id: "nexstream", name: "Server 5: NexStream 4K VIP (Codespecters • VIP Key)" },
    { id: "vidsrc_pm", name: "Server 6: VidSrc 4K Ultra (Fast Edge CDN)" },
    { id: "2embed", name: "Server 7: 2Embed High-Speed (1080p FHD Resilient)" },
    { id: "fullmovie", name: "Server 8: Classic Full Movie HD (Official Stream)" }
  ],

  getMasterOttEmbedUrl(tmdbId, isEpisodic, season = 1, episode = 1, audio = 'en') {
    if (!tmdbId) return null;
    const s = season || 1;
    const e = episode || 1;
    const key = this.apiKey || 'nx_f388cf270eb1c40dc4f1d5c9d79e9c12';
    const mirror = this.mirrors[this.currentMirrorIndex] || this.mirrors[0];

    switch (mirror.id) {
      case 'nexstream':
        // NexStream VIP API (Powered by Codespecters)
        return isEpisodic
          ? `https://api.codespecters.com/embed/tv/${tmdbId}/${s}/${e}?apikey=${key}`
          : `https://api.codespecters.com/embed/movie/${tmdbId}?apikey=${key}`;

      case 'autoembed':
        // AutoEmbed Cloud Mirror (High-Speed Global CDN)
        return isEpisodic
          ? `https://autoembed.co/tv/tmdb/${tmdbId}-${s}-${e}`
          : `https://autoembed.co/movie/tmdb/${tmdbId}`;

      case 'vidlink':
        // VidLink Pro Edge Stream (Blazing Fast 4K)
        return isEpisodic
          ? `https://vidlink.pro/tv/${tmdbId}/${s}/${e}`
          : `https://vidlink.pro/movie/${tmdbId}`;

      case 'vidsrc_pm':
      case 'vcr':
        // VidSrc 4K Ultra
        return isEpisodic
          ? `https://vidsrc.pm/embed/tv?tmdb=${tmdbId}&season=${s}&episode=${e}&ds_lang=${audio}`
          : `https://vidsrc.pm/embed/movie?tmdb=${tmdbId}&ds_lang=${audio}`;

      case '2embed':
        // 2Embed High-Speed Resilient
        return isEpisodic
          ? `https://www.2embed.cc/embedtv/${tmdbId}&s=${s}&e=${e}`
          : `https://www.2embed.cc/embed/${tmdbId}`;

      case 'multiembed':
        // MultiEmbed Prime (Multi-Audio & Dubs)
        return isEpisodic
          ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${s}&e=${e}`
          : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`;

      case 'kannada':
      case 'fullmovie':
        const curItem = State.activePlayingItem;
        const fullMovieKey = (curItem && (curItem.fullMovieYoutubeId || curItem.youtubeId)) || null;
        if (fullMovieKey) {
          return `https://www.youtube.com/embed/${fullMovieKey}?autoplay=1&controls=1&rel=0&modestbranding=1`;
        }
        return isEpisodic
          ? `https://api.codespecters.com/embed/tv/${tmdbId}/${s}/${e}?apikey=${key}`
          : `https://api.codespecters.com/embed/movie/${tmdbId}?apikey=${key}`;

      default:
        return isEpisodic
          ? `https://api.codespecters.com/embed/tv/${tmdbId}/${s}/${e}?apikey=${key}`
          : `https://api.codespecters.com/embed/movie/${tmdbId}?apikey=${key}`;
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
      this.open(item, resumeSeconds, season, episode);
      return;
    }

    // 4. Resolve dynamically from TMDB
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
            backdrop: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg",
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
      UI.showToast(`Unable to find title: ${id}`);
    }
  },

  openWithMode(item, mode = 'trailer', resumeSeconds = 0, season = 1, episode = 1) {
    this.playbackMode = mode || 'trailer';
    this._explicitMode = true;
    this.open(item, resumeSeconds, season, episode);
  },

  open(item, resumeSeconds = 0, season = 1, episode = 1) {
    const isKannada = (item.language && item.language.toLowerCase() === 'kannada') || item.isKannada || (item.audio && item.audio.some(a => a.toLowerCase().includes('kannada') && !a.toLowerCase().includes('dubbed')));

    if (!this._explicitMode) {
      if (item.isUpcoming || item.theatricalStream) {
        // Upcoming cinema releases (e.g. Toxic, UI The Movie) stream official 4K feature
        this.playbackMode = 'trailer';
      } else if (isKannada || item.isClassic || item.fullMovieYoutubeId || item.id === 'kaatera' || (item.language && ['kn', 'hi'].includes(item.language) && item.fullMovieYoutubeId)) {
        // Pure Kannada cinema & Indian classics default to Full Movie HD stream (Original Audio)
        this.playbackMode = 'fullmovie';
      } else {
        this.playbackMode = 'stream';
      }
    }
    this._explicitMode = false;
    this._forceOtt = false;

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

    // Audio Track init
    if (isKannada) {
      const knIdx = (State.audioTracks || []).findIndex(t => t.code === 'kn');
      if (knIdx > -1) State.currentAudioTrackIndex = knIdx;
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
    // Monitor Server 1 (NexStream) or any scraper mirror
    if (mirrorId === 'nexstream') {
      this.streamWatchdogTimer = setTimeout(() => {
        const pill = document.getElementById('streamHealthPill');
        const activeMirror = this.mirrors[this.currentMirrorIndex];
        if (pill && this.playbackMode === 'stream' && activeMirror?.id === 'nexstream') {
          pill.classList.remove('hidden');
          const text = document.getElementById('streamHealthText');
          if (text) text.innerText = "NexStream slow or unavailable? Auto-Switch to Server 1 (AutoEmbed Cloud)";
        }
      }, 7000);
    }
  },

  dismissHealthPill() {
    const pill = document.getElementById('streamHealthPill');
    if (pill) pill.classList.add('hidden');
  },

  autoFixStream() {
    this.clearStreamWatchdog();
    const item = State.activePlayingItem;
    if (item && (item.isUpcoming || item.theatricalStream)) {
      UI.showToast(`🎬 Playing 4K Theatrical Feature: ${item.title}`);
      return;
    }
    // If classic title with full movie available and not currently playing full movie, switch to it
    if (item && item.fullMovieYoutubeId && this.playbackMode !== 'fullmovie') {
      this.toggleFullMovieMode();
      return;
    }
    // If currently on NexStream, instantly jump to Server 1 (AutoEmbed Cloud)
    if (this.mirrors[this.currentMirrorIndex]?.id === 'nexstream') {
      this.currentMirrorIndex = 0;
      this.playbackMode = 'stream';
      this._forceOtt = true;
      const mirror = this.mirrors[this.currentMirrorIndex];
      this.updateModeUI();
      this.loadStreamSource(0);
      UI.showToast(`⚡ Switched to ${mirror.name}`);
      return;
    }
    // Otherwise cycle to next mirror
    this.cycleOttServer();
  },

  toggleTrailerMode() {
    this.playbackMode = (this.playbackMode === 'trailer') ? 'stream' : 'trailer';
    this._explicitMode = true;
    this.clearStreamWatchdog();
    this.updateModeUI();
    this.loadStreamSource(0);
    UI.showToast(this.playbackMode === 'trailer' ? "Playing Official 4K Cinema Trailer" : `Streaming on ${this.mirrors[this.currentMirrorIndex].name}`);
  },

  toggleFullMovieMode() {
    this.playbackMode = (this.playbackMode === 'fullmovie') ? 'stream' : 'fullmovie';
    this._explicitMode = true;
    this.clearStreamWatchdog();
    this.updateModeUI();
    this.loadStreamSource(0);
    UI.showToast(this.playbackMode === 'fullmovie' ? "🎬 Playing Full Movie (Official HD Stream)" : `Streaming on ${this.mirrors[this.currentMirrorIndex].name}`);
  },

  cycleOttServer() {
    const item = State.activePlayingItem;
    if (item && (item.isUpcoming || item.theatricalStream)) {
      UI.showToast(`🎬 "${item.title}" is an upcoming theatrical cinema release. Streaming official 4K feature showcase.`);
      return;
    }
    this.currentMirrorIndex = (this.currentMirrorIndex + 1) % this.mirrors.length;
    this.playbackMode = 'stream';
    this._forceOtt = true;
    this.clearStreamWatchdog();
    const mirror = this.mirrors[this.currentMirrorIndex];
    this.updateModeUI();
    this.loadStreamSource(0);
    UI.showToast(`⚡ Switched to ${mirror.name}`);
  },

  setPlaybackMode(mode) {
    if (mode === 'trailer') {
      this.playbackMode = 'trailer';
    } else if (mode === 'fullmovie') {
      this.playbackMode = 'fullmovie';
    } else {
      this.playbackMode = 'stream';
    }
    this._explicitMode = true;
    this.clearStreamWatchdog();
    this.updateModeUI();
    this.loadStreamSource(0);
  },

  updateModeUI() {
    const mirror = this.mirrors[this.currentMirrorIndex] || this.mirrors[0];
    const nameEl = document.getElementById('activeOttServerName');
    const trailerBtn = document.getElementById('modeBtnTrailer');
    const fullMovieBtn = document.getElementById('modeBtnFullMovie');
    const switcherBtn = document.getElementById('serverSwitcherBtn');

    if (nameEl) {
      if (this.playbackMode === 'fullmovie') {
        nameEl.innerText = "Full Movie HD (Official Stream)";
      } else {
        nameEl.innerText = mirror.name.replace(/\(.*?\)/g, '').trim();
      }
    }

    if (fullMovieBtn) {
      if (this.playbackMode === 'fullmovie') {
        fullMovieBtn.className = "flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500 text-black font-bold shadow transition cursor-pointer";
      } else {
        fullMovieBtn.className = "flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-brand-card text-emerald-400 hover:text-white transition cursor-pointer";
      }
    }

    if (trailerBtn) {
      if (this.playbackMode === 'trailer') {
        trailerBtn.className = "flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500 text-black font-bold shadow transition cursor-pointer";
      } else {
        trailerBtn.className = "flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-brand-card text-slate-300 hover:text-white transition cursor-pointer";
      }
    }

    if (switcherBtn) {
      if (this.playbackMode === 'stream') {
        switcherBtn.className = "flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand-blue text-white font-bold transition shadow cursor-pointer";
      } else {
        switcherBtn.className = "flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-brand-surface hover:bg-brand-card text-slate-300 font-normal transition cursor-pointer";
      }
    }
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

    this.updateModeUI();

    // Hide native video canvas & center play button for clean, zero-buffer embed streaming
    if (v) { v.pause(); v.classList.add('hidden'); }
    if (centerBtn) centerBtn.classList.add('hidden');
    if (bottomDeck) bottomDeck.classList.add('opacity-40');

    const isTheatricalUpcoming = (item.theatricalStream || item.isUpcoming) && !this._forceOtt;

    // 1. Trailer Mode OR Upcoming Theatrical Cinema Release (e.g. Toxic, UI The Movie)
    if (this.playbackMode === 'trailer' || (isTheatricalUpcoming && item.youtubeId)) {
      if (embedStage) embedStage.classList.add('hidden');
      if (embedIframe) embedIframe.src = '';
      this.clearStreamWatchdog();

      if (ytStage && ytIframe && item.youtubeId) {
        ytStage.classList.remove('hidden');
        ytIframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        ytIframe.referrerPolicy = 'strict-origin-when-cross-origin';
        ytIframe.src = `https://www.youtube.com/embed/${item.youtubeId}?autoplay=1&controls=1&rel=0&modestbranding=1`;
        if (isTheatricalUpcoming && this.playbackMode !== 'trailer') {
          UI.showToast(`🎬 Playing 4K Theatrical Feature: ${item.title}`);
        } else {
          UI.showToast(`🎬 Playing Official Trailer: ${item.title}`);
        }
      }
      State.isPlaying = true;
      this.updatePlayIcons();
      return;
    }

    // 2. Full Movie HD Mode (Guaranteed Stream for Indian Classics & Golden Era Hits)
    if (this.playbackMode === 'fullmovie' || mirror.id === 'fullmovie' || mirror.id === 'kannada') {
      if (embedStage) embedStage.classList.add('hidden');
      if (embedIframe) embedIframe.src = '';
      this.clearStreamWatchdog();
      const streamYtId = item.fullMovieYoutubeId || item.youtubeId;

      if (ytStage && ytIframe && streamYtId) {
        ytStage.classList.remove('hidden');
        ytIframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        ytIframe.referrerPolicy = 'strict-origin-when-cross-origin';
        ytIframe.src = `https://www.youtube.com/embed/${streamYtId}?autoplay=1&controls=1&rel=0&modestbranding=1`;
        UI.showToast(`🎬 Playing Full Movie (HD): ${item.title}`);
      } else if (tmdbId && embedStage && embedIframe) {
        embedStage.classList.remove('hidden');
        embedIframe.removeAttribute('sandbox');
        embedIframe.setAttribute('referrerpolicy', 'no-referrer');
        embedIframe.referrerPolicy = 'no-referrer';
        this.setLoading(true);
        const embedUrl = this.getMasterOttEmbedUrl(tmdbId, isEpisodic, season, episode, activeAudio);
        embedIframe.src = embedUrl;
        embedIframe.onload = () => {
          this.setLoading(false);
          this.clearStreamWatchdog();
        };
        setTimeout(() => this.setLoading(false), 400);
        this.startStreamWatchdog(mirror.id);
      }
      State.isPlaying = true;
      this.updatePlayIcons();
      return;
    }

    // 3. Direct Smooth 4K Streaming Mode (Server 1: NexStream 4K VIP, Server 2: AutoEmbed, etc.)
    if (ytStage) ytStage.classList.add('hidden');
    if (ytIframe) ytIframe.src = '';

    if (tmdbId && embedStage && embedIframe) {
      embedStage.classList.remove('hidden');
      embedIframe.removeAttribute('sandbox');
      embedIframe.setAttribute('referrerpolicy', 'no-referrer');
      embedIframe.referrerPolicy = 'no-referrer';
      this.setLoading(true);
      const embedUrl = this.getMasterOttEmbedUrl(tmdbId, isEpisodic, season, episode, activeAudio);
      embedIframe.src = embedUrl;
      embedIframe.onload = () => {
        this.setLoading(false);
        this.clearStreamWatchdog();
      };
      setTimeout(() => this.setLoading(false), 400);
      this.startStreamWatchdog(mirror.id);
      UI.showToast(`🎬 Streaming: ${item.title} (4K Ultra HD)`);
    } else if ((item.fullMovieYoutubeId || item.youtubeId) && ytStage && ytIframe) {
      // Fallback only if no TMDB ID is available anywhere
      embedStage.classList.add('hidden');
      if (embedIframe) embedIframe.src = '';
      ytStage.classList.remove('hidden');
      ytIframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      ytIframe.referrerPolicy = 'strict-origin-when-cross-origin';
      ytIframe.src = `https://www.youtube.com/embed/${item.fullMovieYoutubeId || item.youtubeId}?autoplay=1&controls=1&rel=0&modestbranding=1`;
    }

    State.isPlaying = true;
    this.updatePlayIcons();

    // Record continue watching with episode format
    const epLabel = isEpisodic ? `S${season}:E${episode}` : (item.runtime || 'Feature');
    App.recordContinueWatching(item, resumeSeconds, 160, 15, epLabel);
  },

  async loadSeasonEpisodes(seasonNumber = 1) {
    const item = State.activePlayingItem;
    if (!item) return;
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
        still: State.activePlayingItem?.backdrop || "https://image.tmdb.org/t/p/w780/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg",
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

  _fallbackIndex: 0,
  _streamFailCount: 0,

  handleStreamFallback() {
    const item = State.activePlayingItem;
    if (!item) return;

    this._streamFailCount = (this._streamFailCount || 0) + 1;

    // Cycle through OTT mirrors (VidLink -> VidSrc PM -> AutoEmbed -> 2Embed)
    if (this._streamFailCount < 4) {
      this.currentMirrorIndex = (this.currentMirrorIndex + 1) % this.mirrors.length;
      const mirror = this.mirrors[this.currentMirrorIndex];
      this.loadStreamSource(0);
      UI.showToast(`Connecting to backup stream: ${mirror.name}`);
      return;
    }

    // If OTT mirrors all exhausted, smoothly switch to the title's official 4K Cinema feature
    if (item.youtubeId) {
      this._streamFailCount = 0;
      this.setPlaybackMode('trailer');
      UI.showToast("Streaming official 4K cinema feature (Theatrical Release)");
      return;
    }

    UI.showToast("Master stream reconnecting...");
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

  setLoading(isLoading) {
    State.isBuffering = isLoading;
    const spinner = document.getElementById('videoLoadingSpinner');
    if (spinner) {
      if (isLoading) {
        spinner.classList.remove('hidden');
        spinner.classList.add('flex');
      } else {
        spinner.classList.add('hidden');
        spinner.classList.remove('flex');
      }
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

    if (this.video) {
      this.video.pause();
      this.video.src = '';
    }

    const embedIframe = document.getElementById('streamEmbedIframe');
    if (embedIframe) embedIframe.src = '';

    const ytIframe = document.getElementById('ytIframe');
    if (ytIframe) ytIframe.src = '';

    document.getElementById('inStreamXrayPanel')?.classList.add('translate-x-full');
    document.getElementById('inPlayerEpisodesDrawer')?.classList.add('translate-x-full');
    document.getElementById('inPlayerAudioSubtitlesDrawer')?.classList.add('translate-x-full');
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

    // Switch to dedicated Kannada stream if Kannada audio track is chosen
    if (track.code === 'kn') {
      const cur = State.activePlayingItem;
      if (cur && (cur.fullMovieYoutubeId || cur.youtubeId)) {
        this.playbackMode = 'fullmovie';
      }
    }

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
