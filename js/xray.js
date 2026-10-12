/**
 * MOVAni Amazon Prime Video X-Ray Intelligence Module
 * Manages the in-stream X-Ray drawer: in-scene cast, music with save action, verified trivia, and legal providers.
 */

const XRay = {
  populate(item) {
    document.getElementById('xraySongName').innerText = `"${item.xray.song.title}"`;
    document.getElementById('xrayArtistName').innerText = item.xray.song.artist;
    document.getElementById('xrayTriviaText').innerText = item.xray.trivia;
    document.getElementById('xrayCastCount').innerText = `${item.xray.actors.length} Actors in Scene`;

    const isSongSaved = State.savedMusicTracks.includes(item.xray.song.title);
    document.getElementById('saveMusicIcon').className = isSongSaved ? 'ph ph-heart-fill text-brand-red text-lg' : 'ph ph-heart text-lg';

    // Cast list
    const castContainer = document.getElementById('xrayCastList');
    castContainer.innerHTML = item.xray.actors.map(actor => `
      <div class="flex items-center gap-2.5 bg-brand-card p-2 rounded border border-brand-border">
        <img src="${actor.image}" alt="${actor.name}" class="w-8 h-8 rounded-full object-cover border border-brand-border flex-shrink-0" />
        <div class="min-w-0">
          <p class="text-xs font-bold text-white truncate">${actor.name}</p>
          <p class="text-[10px] text-slate-400 truncate">${actor.role}</p>
        </div>
      </div>
    `).join('');

    // Where to watch legally
    const whereContainer = document.getElementById('xrayWhereToWatch');
    whereContainer.innerHTML = item.providers.map(p => `
      <span class="px-2 py-1 bg-brand-card rounded text-[10px] font-bold text-slate-200 border border-brand-border flex items-center gap-1">
        <i class="ph ph-check-circle text-emerald-400"></i> ${p.name} (${p.badge})
      </span>
    `).join('');
  },

  toggle(forceOpen = false) {
    const panel = document.getElementById('inStreamXrayPanel');
    if (forceOpen) {
      panel.classList.remove('translate-x-full');
    } else {
      panel.classList.toggle('translate-x-full');
    }
  },

  async saveCurrentMusic() {
    if (!State.activePlayingItem) return;
    const song = State.activePlayingItem.xray.song;
    const title = song.title;

    if (State.savedMusicTracks.includes(title)) {
      State.savedMusicTracks = State.savedMusicTracks.filter(s => s !== title);
      document.getElementById('saveMusicIcon').className = 'ph ph-heart text-lg';
      UI.showToast(`Removed "${title}" from saved music`);
    } else {
      State.savedMusicTracks.push(title);
      document.getElementById('saveMusicIcon').className = 'ph ph-heart-fill text-brand-red text-lg';
      UI.showToast(`Saved "${title}" to MOVAni Music Library!`);
    }

    localStorage.setItem('movani_saved_tracks', JSON.stringify(State.savedMusicTracks));
    await API.saveMusic(title, song.artist, State.activePlayingItem.id);
  }
};
