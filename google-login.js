/* Sho1re1 Google sign-in — client-side profile layer.
   Google Identity Services popup; no credential/token is persisted. */
(function () {
  "use strict";
  if (window.Sho1re1Auth) return;

  const CLIENT_ID = "89011073863-98b4vrionc2nvimj6ffec9b99qi6qjdt.apps.googleusercontent.com";
  const STORAGE_KEY = "sho1re1_google_profile_v1";
  let user = readUser();
  let credential = "";
  let ready = false;
  let pendingCredentialRequest = false;
  const credentialWaiters = new Set();
  let waitingForName = false;
  const listeners = new Set();

  function readUser() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return value && value.sub ? value : null;
    } catch (_) { return null; }
  }
  function saveUser(next) {
    user = next;
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch (error) { console.warn("Could not save Sho1re1 profile locally.", error); }
    notify();
  }
  function notify() {
    listeners.forEach(fn => { try { fn(user); } catch (e) { console.error(e); } });
    window.dispatchEvent(new CustomEvent("sho1re1:authchange", { detail: { user } }));
  }
  function decodeCredential(token) {
    try {
      const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(decodeURIComponent(Array.prototype.map.call(atob(part), c =>
        "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")));
    } catch (error) {
      console.error("Could not read Google sign-in profile.", error);
      return null;
    }
  }
  function onCredential(response) {
    credential = typeof response.credential === "string" ? response.credential : "";
    const data = decodeCredential(credential);
    if (!data || !data.sub) return;
    credentialWaiters.forEach(fn => { try { fn(credential); } catch (_) {} });
    credentialWaiters.clear();
    window.dispatchEvent(new CustomEvent("sho1re1:credential", { detail: { email: data.email || "" } }));
    const previous = readUser();
    const returningProfile = previous && previous.sub === data.sub && previous.displayName;
    saveUser({
      sub: data.sub,
      email: data.email || "",
      googleName: data.name || "",
      picture: data.picture || "",
      displayName: returningProfile ? previous.displayName : "",
      signedInAt: Date.now()
    });
    if (!returningProfile) promptName();
    else closeWelcome();
  }
  function loadGoogle() {
    if (window.google && google.accounts && google.accounts.id) {
      initializeGoogle();
      return;
    }
    if (document.querySelector('script[data-sho1re1-gsi]')) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.sho1re1Gsi = "true";
    script.onload = initializeGoogle;
    script.onerror = () => {
      document.querySelectorAll(".sho-google-loading").forEach(el => {
        el.textContent = "Google sign-in couldn't load. Check your connection and try again.";
      });
    };
    document.head.appendChild(script);
  }
  function initializeGoogle() {
    if (ready || !window.google || !google.accounts || !google.accounts.id) return;
    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: onCredential,
      auto_select: false,
      cancel_on_tap_outside: true
    });
    ready = true;
    if (pendingCredentialRequest) { pendingCredentialRequest = false; try { google.accounts.id.prompt(); } catch (_) {} }
    document.querySelectorAll("[data-sho-google-button]").forEach(renderButton);
  }
  function renderButton(target) {
    if (!target) return;
    if (!ready) { target.innerHTML = '<span class="sho-google-loading">Preparing secure Google sign-in…</span>'; return; }
    target.innerHTML = "";
    google.accounts.id.renderButton(target, {
      type: "standard", theme: "outline", size: "large",
      shape: "pill", text: "continue_with", width: Math.min(320, Math.max(220, target.clientWidth || 280))
    });
  }
  function closeWelcome() {
    const overlay = document.getElementById("sho-login-overlay");
    if (overlay) overlay.remove();
  }
  function promptName() {
    const existing = document.getElementById("sho-name-overlay");
    if (existing) return;
    const overlay = document.createElement("div");
    overlay.id = "sho-name-overlay";
    overlay.className = "sho-auth-overlay";
    overlay.innerHTML = `
      <section class="sho-auth-dialog" role="dialog" aria-modal="true" aria-labelledby="sho-name-title">
        <button class="sho-auth-close" type="button" aria-label="Close">×</button>
        <div class="sho-auth-mark">S</div>
        <p class="sho-auth-kicker">ONE LAST STEP</p>
        <h2 id="sho-name-title">What should we call you?</h2>
        <p class="sho-auth-copy">Choose the name people will see on Sho1re1.</p>
        <form id="sho-name-form">
          <input id="sho-display-name" maxlength="32" autocomplete="nickname" required placeholder="Your display name">
          <button class="sho-auth-primary" type="submit">Save my name</button>
        </form>
      </section>`;
    document.body.appendChild(overlay);
    const input = overlay.querySelector("#sho-display-name");
    input.value = user ? (user.displayName || user.googleName || "") : "";
    overlay.querySelector(".sho-auth-close").addEventListener("click", () => overlay.remove());
    overlay.querySelector("#sho-name-form").addEventListener("submit", event => {
      event.preventDefault();
      const name = input.value.trim().replace(/\s+/g, " ");
      if (!name || !user) return;
      saveUser({ ...user, displayName: name });
      overlay.remove();
      closeWelcome();
    });
    setTimeout(() => input.focus(), 80);
  }
  function showWelcome() {
    if (user || document.getElementById("sho-login-overlay")) return;
    const overlay = document.createElement("div");
    overlay.id = "sho-login-overlay";
    overlay.className = "sho-auth-overlay";
    overlay.innerHTML = `
      <section class="sho-auth-dialog" role="dialog" aria-modal="true" aria-labelledby="sho-login-title">
        <div class="sho-auth-mark">S</div>
        <p class="sho-auth-kicker">WELCOME TO SHO1RE1</p>
        <h2 id="sho-login-title">Make it yours.</h2>
        <p class="sho-auth-copy">Sign in with Google and choose the name you want to use in the community.</p>
        <div data-sho-google-button class="sho-google-button"></div>
        <button type="button" class="sho-auth-later">Maybe later</button>
        <p class="sho-auth-footnote">Your profile is saved on this device.</p>
      </section>`;
    document.body.appendChild(overlay);
    renderButton(overlay.querySelector("[data-sho-google-button]"));
    overlay.querySelector(".sho-auth-later").addEventListener("click", closeWelcome);
  }
  function signOut() {
    credential = "";
    saveUser(null);
    if (ready && google.accounts.id.disableAutoSelect) google.accounts.id.disableAutoSelect();
  }
  function setDisplayName(name) {
    const clean = String(name || "").trim().replace(/\s+/g, " ").slice(0, 32);
    if (!user || !clean) return false;
    saveUser({ ...user, displayName: clean });
    return true;
  }
  window.Sho1re1Auth = {
    getUser: () => user ? { ...user } : null,
    getCredential: () => credential || "",
    requestCredential(callback) {
      if (credential) { if (typeof callback === "function") callback(credential); return; }
      if (typeof callback === "function") credentialWaiters.add(callback);
      pendingCredentialRequest = true;
      if (ready) { pendingCredentialRequest = false; try { google.accounts.id.prompt(); } catch (_) {} }
      else loadGoogle();
    },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    renderButton,
    promptName,
    setDisplayName,
    signOut,
    isGoogleReady: () => ready
  };

  loadGoogle();
  const isAccountPage = /(?:^|\/)account\.html$/.test(location.pathname);
  if (!isAccountPage && !user) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", showWelcome, { once: true });
    else showWelcome();
  }
})();