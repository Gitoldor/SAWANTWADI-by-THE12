/* Sho1re1 shared-by attribution helper.
   Adds a short visual attribution to supported shared links. */
(() => {
  'use strict';
  const STORAGE_KEY = 'sho1re1_google_profile_v1';
  function getName() {
    try {
      const authUser = window.Sho1re1Auth && typeof window.Sho1re1Auth.getUser === 'function'
        ? window.Sho1re1Auth.getUser() : null;
      if (authUser && typeof authUser.displayName === 'string' && authUser.displayName.trim()) {
        return authUser.displayName.trim().replace(/\s+/g, ' ').slice(0, 32);
      }
      const localUser = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return localUser && typeof localUser.displayName === 'string'
        ? localUser.displayName.trim().replace(/\s+/g, ' ').slice(0, 32) : '';
    } catch (_) { return ''; }
  }
  function show(value) {
    const name = String(value || '').trim().replace(/\s+/g, ' ').slice(0, 32);
    if (!name || !document.body) return;
    const old = document.getElementById('s1-shared-by-flash');
    if (old) old.remove();
    const overlay = document.createElement('div');
    overlay.id = 's1-shared-by-flash';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px;background:rgba(8,9,12,.94);color:#fff;text-align:center;font-family:Inter,system-ui,-apple-system,sans-serif;opacity:0;transition:opacity .16s ease;pointer-events:none;';
    const label = document.createElement('div');
    label.textContent = 'Shared by';
    label.style.cssText = 'font-size:clamp(20px,5vw,30px);font-weight:700;letter-spacing:.02em;opacity:.78;margin-bottom:12px;';
    const nameLine = document.createElement('div');
    nameLine.textContent = name;
    nameLine.style.cssText = 'max-width:100%;overflow-wrap:anywhere;font-size:clamp(38px,11vw,76px);line-height:1.04;font-weight:900;letter-spacing:-.055em;';
    overlay.append(label, nameLine);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 180);
    }, 1000);
  }
  window.Sho1re1SharedBy = { getName, show };
})();
