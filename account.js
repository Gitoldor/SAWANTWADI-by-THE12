/* Sho1re1 account page UI. Requires google-login.js. */
(function () {
  "use strict";
  const root = document.getElementById("sho-account-root");
  if (!root) return;

  function render() {
    const auth = window.Sho1re1Auth;
    if (!auth) {
      root.innerHTML = '<p class="sho-account-loading">Account service unavailable. Please refresh.</p>';
      return;
    }
    const user = auth.getUser();
    if (!user) {
      root.innerHTML = `
        <div class="sho-account-empty">
          <div class="sho-account-avatar">S</div>
          <h2>You’re not signed in</h2>
          <p>Use your Google account to create your Sho1re1 profile.</p>
          <div data-sho-google-button class="sho-google-button"></div>
        </div>`;
      const button = root.querySelector("[data-sho-google-button]");
      if (auth.isGoogleReady()) auth.renderButton(button);
      else {
        button.innerHTML = '<span class="sho-google-loading">Preparing Google sign-in…</span>';
        const timer = setInterval(() => {
          if (auth.isGoogleReady()) { clearInterval(timer); auth.renderButton(button); }
        }, 250);
        setTimeout(() => clearInterval(timer), 15000);
      }
      return;
    }
    root.innerHTML = `
      <div class="sho-account-profile">
        <div class="sho-account-avatar-wrap">
          ${user.picture ? '<img class="sho-account-avatar-img" src="' + escapeAttr(user.picture) + '" alt="">' : '<div class="sho-account-avatar">' + escapeHtml((user.displayName || "S").slice(0,1).toUpperCase()) + '</div>'}
          <span class="sho-account-online"></span>
        </div>
        <span class="sho-account-status">GOOGLE ACCOUNT CONNECTED</span>
        <h2>${escapeHtml(user.displayName || user.googleName || "Sho1re1 member")}</h2>
        <p class="sho-account-email">${escapeHtml(user.email)}</p>
        <form id="sho-account-name-form" class="sho-account-name-form">
          <label for="sho-account-name">Your Sho1re1 display name</label>
          <input id="sho-account-name" maxlength="32" required value="${escapeAttr(user.displayName || "")}" placeholder="Choose a name">
          <button type="submit" class="sho-auth-primary">Update name</button>
        </form>
        <button type="button" id="sho-account-signout" class="sho-account-signout">Sign out</button>
        <p class="sho-account-note">This profile is currently stored on this device. It is not a cloud-synced account.</p>
      </div>`;
    root.querySelector("#sho-account-name-form").addEventListener("submit", event => {
      event.preventDefault();
      if (auth.setDisplayName(root.querySelector("#sho-account-name").value)) {
        const button = root.querySelector("#sho-account-name-form button");
        button.textContent = "Saved";
        setTimeout(() => { if (button.isConnected) button.textContent = "Update name"; }, 1400);
      }
    });
    root.querySelector("#sho-account-signout").addEventListener("click", () => {
      auth.signOut();
      render();
    });
  }
  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }
  function escapeAttr(value) { return escapeHtml(value); }

  if (window.Sho1re1Auth) {
    render();
    window.Sho1re1Auth.onChange(render);
  } else {
    window.addEventListener("load", render, { once: true });
    setTimeout(render, 300);
  }
})();