/**
 * MOVAni Authentication & Profile Management Engine
 * Synchronizes user session between backend and frontend.
 */

const Auth = {
  currentUser: null,
  isAuthenticated: false,

  async init() {
    this.checkSession();
  },

  async checkSession() {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          this.currentUser = data.user;
          this.isAuthenticated = true;
          this.renderUserUI(data.user);
          return;
        }
      }
    } catch {
      // Local fallback check
      const localUser = localStorage.getItem('movani_user');
      if (localUser) {
        try {
          const u = JSON.parse(localUser);
          this.currentUser = u;
          this.isAuthenticated = true;
          this.renderUserUI(u);
          return;
        } catch {}
      }
    }

    this.currentUser = null;
    this.isAuthenticated = false;
    this.renderGuestUI();
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
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}

    localStorage.removeItem('movani_token');
    localStorage.removeItem('movani_user');
    this.currentUser = null;
    this.isAuthenticated = false;
    this.renderGuestUI();

    if (window.UI && UI.showToast) {
      UI.showToast("Signed out successfully.");
    }
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
