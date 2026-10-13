/**
 * MOVAni Authentication & Profile Management Engine
 * Synchronizes user session between backend and frontend.
 * Strictly enforces One-Device-Per-Account policy and isolates user state.
 */

const Auth = {
  currentUser: null,
  isAuthenticated: false,
  _sessionReplacedNoticeShown: false,

  async init() {
    await this.checkSession();
  },

  handleSessionReplaced(message) {
    if (this._sessionReplacedNoticeShown) return;
    this._sessionReplacedNoticeShown = true;

    localStorage.removeItem('movani_token');
    localStorage.removeItem('movani_user');
    this.currentUser = null;
    this.isAuthenticated = false;
    this.renderGuestUI();

    State.continueWatching = [];
    State.watchlist = [];
    if (window.UI) {
      if (typeof UI.renderContinueWatching === 'function') UI.renderContinueWatching();
      if (typeof UI.updateWatchlistBadge === 'function') UI.updateWatchlistBadge();
    }

    const titleEl = document.getElementById('continueWatchingTitle');
    if (titleEl) titleEl.innerText = 'Continue Watching';

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="max-w-md w-full bg-[#0f141f] border border-amber-500/50 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
        <div class="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-3xl">
          <i class="ph ph-device-mobile-camera"></i>
        </div>
        <div>
          <h3 class="text-base font-bold text-white">Signed In on Another Device</h3>
          <p class="text-xs text-slate-300 mt-2 leading-relaxed">
            ${message || 'Your account was signed in on another device. In accordance with the One-Device-Per-Account policy, this previous session has been closed.'}
          </p>
        </div>
        <button onclick="window.location.href='login.html'" class="w-full py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-bold text-xs rounded-lg transition shadow-lg">
          Sign In on This Device
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async checkSession() {
    try {
      const token = localStorage.getItem('movani_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['X-Session-Token'] = token;
      }

      const res = await fetch('/api/auth/me', {
        headers,
        credentials: 'include'
      });

      if (res.status === 401) {
        localStorage.removeItem('movani_token');
        localStorage.removeItem('movani_user');
        try {
          const errData = await res.json();
          if (errData && errData.code === 'SESSION_REPLACED') {
            this.handleSessionReplaced(errData.error);
            return;
          }
        } catch (_) {}
        window.location.replace('login.html');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          this.currentUser = data.user;
          this.isAuthenticated = true;
          localStorage.setItem('movani_user', JSON.stringify(data.user));
          this.renderUserUI(data.user);
          await this.syncUserData(data.user);
          return;
        }
      }
    } catch (_) {}

    localStorage.removeItem('movani_token');
    localStorage.removeItem('movani_user');
    this.currentUser = null;
    this.isAuthenticated = false;
    window.location.replace('login.html');
  },

  async syncUserData(user) {
    const titleEl = document.getElementById('continueWatchingTitle');
    if (titleEl) {
      const firstName = (user.name || 'User').split(' ')[0];
      titleEl.innerText = `Continue Watching for ${firstName}`;
    }
    const noticeEl = document.getElementById('continueSyncNotice');
    if (noticeEl) {
      noticeEl.innerText = `Synced with ${user.email}`;
    }

    // Hydrate Continue Watching from backend
    if (window.API && typeof API.getContinueWatching === 'function') {
      try {
        const cw = await API.getContinueWatching();
        if (Array.isArray(cw)) {
          State.continueWatching = cw;
          try {
            localStorage.setItem('movani_continue_watching_' + user.id, JSON.stringify(cw));
          } catch (_) {}
        }
      } catch (_) {}
    }

    // Hydrate Watchlist from backend
    if (window.API && typeof API.getWatchlist === 'function') {
      try {
        const wl = await API.getWatchlist();
        if (wl && Array.isArray(wl.ids)) {
          State.watchlist = wl.ids;
          try {
            localStorage.setItem('movani_watchlist_' + user.id, JSON.stringify(wl.ids));
          } catch (_) {}
        }
      } catch (_) {}
    }

    if (window.UI) {
      if (typeof UI.renderContinueWatching === 'function') UI.renderContinueWatching();
      if (typeof UI.updateWatchlistBadge === 'function') UI.updateWatchlistBadge();
    }
  },

  renderUserUI(user) {
    const container = document.getElementById('userNavContainer');
    if (!container) return;

    const initials = (user.name || 'User').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    container.innerHTML = `
      <div class="relative">
        <button onclick="Auth.toggleUserDropdown()" class="flex items-center gap-2.5 p-1 rounded-lg hover:bg-brand-surface border border-transparent hover:border-brand-border transition group focus:outline-none">
          <div class="w-8 h-8 rounded bg-gradient-to-tr from-teal-500 to-cyan-400 p-[1.5px] shadow group-hover:scale-105 transition">
            <div class="w-full h-full bg-[#0a0d14] rounded-[3px] flex items-center justify-center font-bold text-xs text-teal-300">
              ${initials}
            </div>
          </div>
          <div class="hidden xl:flex flex-col text-left">
            <span class="text-xs font-bold text-slate-200 leading-none truncate max-w-[110px]">${user.name}</span>
            <span class="text-[10px] font-medium text-teal-400 flex items-center gap-0.5">
              <i class="ph ph-seal-check text-xs"></i> Verified VIP
            </span>
          </div>
          <i class="ph ph-caret-down text-slate-400 text-xs hidden xl:block"></i>
        </button>

        <!-- Dropdown Menu -->
        <div id="userDropdownMenu" class="hidden absolute right-0 top-12 w-56 bg-[#0f141f] border border-brand-border rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div class="px-3 py-2 border-b border-brand-border/60 mb-1">
            <div class="text-xs font-bold text-white truncate">${user.name}</div>
            <div class="text-[11px] text-slate-400 truncate mt-0.5">${user.email}</div>
          </div>
          <a href="/login?action=reset" class="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-brand-surface rounded-lg transition">
            <i class="ph ph-key text-teal-400 text-sm"></i> Change Password
          </a>
          <button onclick="Auth.logout()" class="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition text-left mt-1">
            <i class="ph ph-sign-out text-sm"></i> Sign Out
          </button>
        </div>
      </div>
    `;
  },

  renderGuestUI() {
    const container = document.getElementById('userNavContainer');
    if (!container) return;

    container.innerHTML = `
      <a href="/login" class="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white rounded text-xs font-bold shadow-md shadow-teal-500/20 hover:shadow-teal-500/35 transition cursor-pointer">
        <i class="ph ph-user text-sm"></i>
        <span>Sign In</span>
      </a>
    `;
  },

  toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdownMenu');
    if (dropdown) dropdown.classList.toggle('hidden');
  },

  async logout() {
    try {
      const token = localStorage.getItem('movani_token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch('/api/auth/logout', { method: 'POST', headers, credentials: 'include' });
    } catch {}

    const uid = this.currentUser?.id;
    if (uid) {
      localStorage.removeItem('movani_continue_watching_' + uid);
      localStorage.removeItem('movani_watchlist_' + uid);
    }
    localStorage.removeItem('movani_token');
    localStorage.removeItem('movani_user');
    this.currentUser = null;
    this.isAuthenticated = false;
    this.renderGuestUI();

    State.continueWatching = [];
    State.watchlist = [];

    const titleEl = document.getElementById('continueWatchingTitle');
    if (titleEl) titleEl.innerText = 'Continue Watching';

    if (window.UI) {
      if (typeof UI.renderContinueWatching === 'function') UI.renderContinueWatching();
      if (typeof UI.updateWatchlistBadge === 'function') UI.updateWatchlistBadge();
      if (typeof UI.showToast === 'function') UI.showToast("Signed out successfully.");
    }

    setTimeout(() => {
      window.location.href = 'login.html';
    }, 400);
  }
};

// Global click listener to close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('userDropdownMenu');
  if (dropdown && !dropdown.classList.contains('hidden')) {
    if (!e.target.closest('#userNavContainer')) {
      dropdown.classList.add('hidden');
    }
  }
});

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  Auth.init();
});
