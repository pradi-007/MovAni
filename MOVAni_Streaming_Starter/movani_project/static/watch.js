const player = document.getElementById('videoPlayer');
const statusEl = document.getElementById('playerStatus');
if (player && player.dataset.hls) {
  // Native HLS support (Safari/iOS and some browsers). For wider support, add hls.js via a pinned local dependency.
  player.src = player.dataset.hls;
}
if (player && window.MOVANI_SIGNED_IN && window.MOVANI_TITLE_ID) {
  let lastSent = 0;
  const save = () => {
    if (!Number.isFinite(player.currentTime) || Date.now() - lastSent < 8000) return;
    lastSent = Date.now();
    fetch(`/api/progress/${window.MOVANI_TITLE_ID}`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({position_seconds:player.currentTime,duration_seconds:Number.isFinite(player.duration)?player.duration:0})
    }).catch(() => {});
  };
  player.addEventListener('timeupdate', save);
  player.addEventListener('pause', () => { lastSent = 0; save(); });
  player.addEventListener('ended', () => {
    fetch(`/api/progress/${window.MOVANI_TITLE_ID}`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({position_seconds:0,duration_seconds:Number.isFinite(player.duration)?player.duration:0})}).catch(() => {});
  });
}
player?.addEventListener('error', () => { if (statusEl) statusEl.textContent = 'Playback failed. Check the video URL, file codec, and provider playback permissions.'; });
