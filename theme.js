// ============================================================
// LibraVault — Theme Module (Dark / Light)
// ============================================================

const Theme = {
  get current() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  },

  // Call in every page's <head> to prevent flash of wrong theme
  applyEarly() {
    const t = localStorage.getItem('lms_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  },

  // Call after auth is ready; loads user's saved preference from Firestore
  async init(uid) {
    let theme = localStorage.getItem('lms_theme') || 'dark';
    if (uid) {
      try {
        const snap = await db.collection('users').doc(uid).get();
        if (snap.exists && snap.data().theme) {
          theme = snap.data().theme;
        }
      } catch (_) {}
    }
    this._apply(theme, null); // don't re-save on load
    this._syncButtons();
  },

  // Toggle and save
  toggle(uid = null) {
    const next = this.current === 'dark' ? 'light' : 'dark';
    this._apply(next, uid);
  },

  _apply(theme, uid) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lms_theme', theme);
    if (uid) {
      db.collection('users').doc(uid).update({ theme }).catch(() => {});
    }
    this._syncButtons();
  },

  _syncButtons() {
    const isDark = this.current === 'dark';
    const sunSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>`;
    const moonSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>`;

    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.innerHTML = isDark ? sunSvg : moonSvg;
      btn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    });
  }
};

// Apply immediately (prevent flash)
Theme.applyEarly();
