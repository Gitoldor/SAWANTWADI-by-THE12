/* Sho1re1 PRO — single shared membership checker for every paid feature. */
(function (root) {
  "use strict";
  if (root.Sho1re1Pro) return;

  const API = "https://sawantwadi-read-api.onrender.com/pro-status";
  const CACHE_MS = 10000;
  let cached = null;
  let checkedAt = 0;
  let pending = null;
  const listeners = new Set();

  function authContext() {
    try {
      if (root.Sho1re1Auth) return { auth: root.Sho1re1Auth, storage: root.localStorage };
      if (root.parent && root.parent !== root && root.parent.Sho1re1Auth) {
        return { auth: root.parent.Sho1re1Auth, storage: root.parent.localStorage };
      }
    } catch (_) {}
    return { auth: null, storage: root.localStorage };
  }

  function getUser(ctx) {
    try {
      const user = ctx.auth && ctx.auth.getUser && ctx.auth.getUser();
      if (user && user.email) return user;
    } catch (_) {}
    try {
      const user = JSON.parse(ctx.storage.getItem("sho1re1_google_profile_v1") || "null");
      return user && user.email ? user : null;
    } catch (_) { return null; }
  }

  function publish(active) {
    cached = active === true;
    checkedAt = Date.now();
    listeners.forEach(function (fn) { try { fn(cached); } catch (_) {} });
    try { root.dispatchEvent(new CustomEvent("sho1re1:prochange", { detail: { active: cached } })); } catch (_) {}
    return cached;
  }

  function check(force) {
    if (pending) return pending;
    if (!force && cached !== null && Date.now() - checkedAt < CACHE_MS) {
      return Promise.resolve(cached);
    }

    const ctx = authContext();
    const user = getUser(ctx);
    if (!user) return Promise.resolve(publish(false));

    let credential = "";
    try {
      credential = ctx.auth && ctx.auth.getCredential ? ctx.auth.getCredential() : "";
    } catch (_) {}
    if (!credential) return Promise.resolve(publish(false));

    pending = fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(user.email || "").trim().toLowerCase(),
        credential: credential
      }),
      cache: "no-store"
    }).then(function (response) {
      if (!response.ok) throw new Error("PRO membership check failed");
      return response.json();
    }).then(function (result) {
      return publish(result && result.success === true && result.active === true);
    }).catch(function () {
      return publish(false);
    }).finally(function () {
      pending = null;
    });

    return pending;
  }

  function onChange(callback) {
    if (typeof callback !== "function") return function () {};
    listeners.add(callback);
    if (cached !== null) {
      try { callback(cached); } catch (_) {}
    }
    return function () { listeners.delete(callback); };
  }

  root.Sho1re1Pro = {
    check: function () { return check(false); },
    refresh: function () { return check(true); },
    onChange: onChange,
    getCached: function () { return cached; }
  };

  // All feature modules receive the same result when identity or credentials change.
  root.addEventListener("sho1re1:authchange", function () { check(true); });
  root.addEventListener("sho1re1:credential", function () { check(true); });
  root.addEventListener("storage", function (event) {
    if (!event.key || event.key === "sho1re1_google_profile_v1") check(true);
  });
  root.addEventListener("focus", function () { check(true); });
})(window);
