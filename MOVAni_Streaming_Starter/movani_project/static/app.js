const tmdbGrid = document.getElementById('tmdbGrid');
const libraryGrid = document.getElementById('libraryGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

function escapeHtml(value='') {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function renderTmdb(items) {
  if (!Array.isArray(items) || !items.length) {
    tmdbGrid.innerHTML = '<div class="empty-state">No titles found. Check your TMDB credentials or try another search.</div>';
    return;
  }
  tmdbGrid.innerHTML = items.map(item => `
    <article class="poster-card">
      ${item.poster_url ? `<img src="${escapeHtml(item.poster_url)}" alt="Poster for ${escapeHtml(item.title)}" loading="lazy">` : '<div class="poster-placeholder">MOVAni</div>'}
      <div class="poster-info"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.release_year || 'Release year unknown')} · ${escapeHtml((item.media_type || 'title').toUpperCase())}</p><span class="muted">Metadata only · Add a licensed playback source to watch</span></div>
    </article>`).join('');
}
async function loadTrending() {
  tmdbGrid.innerHTML = '<div class="loading">Loading trending titles…</div>';
  try {
    const res = await fetch('/api/tmdb/trending?type=all');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'TMDB unavailable');
    renderTmdb(data);
  } catch (err) {
    tmdbGrid.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}<br>Set TMDB_READ_ACCESS_TOKEN or TMDB_API_KEY in your .env file, then restart the server.</div>`;
  }
}
async function searchTitles() {
  const q = searchInput.value.trim();
  if (!q) return loadTrending();
  tmdbGrid.innerHTML = '<div class="loading">Searching…</div>';
  try {
    const res = await fetch('/api/tmdb/search?q=' + encodeURIComponent(q));
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Search failed');
    renderTmdb(data);
  } catch (err) {
    tmdbGrid.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
  }
}
searchBtn?.addEventListener('click', searchTitles);
searchInput?.addEventListener('keydown', e => { if (e.key === 'Enter') searchTitles(); });
loadTrending();

const modal = document.getElementById('authModal');
document.getElementById('authBtn')?.addEventListener('click', () => modal.hidden = false);
document.getElementById('closeAuth')?.addEventListener('click', () => modal.hidden = true);
modal?.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });
const form = document.getElementById('authForm');
let authMode = 'login';
form?.querySelector('[data-mode="login"]')?.addEventListener('click', () => authMode = 'login');
document.getElementById('registerBtn')?.addEventListener('click', async () => { authMode = 'register'; await submitAuth(); });
form?.addEventListener('submit', async e => { e.preventDefault(); authMode = 'login'; await submitAuth(); });
async function submitAuth() {
  const msg = document.getElementById('authMessage');
  const username = form.elements.username.value;
  const password = form.elements.password.value;
  msg.textContent = 'Please wait…';
  try {
    const res = await fetch('/api/' + authMode, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Authentication failed');
    location.reload();
  } catch (err) { msg.textContent = err.message; }
}
document.getElementById('logoutBtn')?.addEventListener('click', async () => { await fetch('/api/logout', {method:'POST'}); location.reload(); });
