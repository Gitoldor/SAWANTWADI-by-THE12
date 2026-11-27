/* Sho1re1 MAX Cloud Saves — post IDs synced to the signed-in Google account. */
(function (root) {
  "use strict";
  if (root.Sho1re1CloudSaves) return;

  const API = "https://sawantwadi-read-api.onrender.com/max-saved-posts";
  const SESSION_API = "https://sawantwadi-read-api.onrender.com/auth-session";

  function getAuth() {
    try { return root.Sho1re1Auth || (root.parent && root.parent.Sho1re1Auth) || null; }
    catch (_) { return null; }
  }

  function getUser(auth) {
    try { return auth && auth.getUser ? auth.getUser() : null; }
    catch (_) { return null; }
  }

  function getCredential(auth) {
    return new Promise(function (resolve, reject) {
      let token = "";
      try { token = auth && auth.getCredential ? auth.getCredential() : ""; } catch (_) {}
      if (token) return resolve(token);
      if (!auth || typeof auth.requestCredential !== "function") {
        return reject(new Error("Sign in with Google to use MAX Cloud Saves."));
      }
      let settled = false;
      const finish = function (value) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (value) resolve(value);
        else reject(new Error("Google sign-in is required to sync cloud saves."));
      };
      const timer = setTimeout(function () {
        finish("");
      }, 45000);
      try { auth.requestCredential(function (value) { finish(value || ""); }); }
      catch (_) { finish(""); }
    });
  }

  async function getSession(auth) {
    let token = "";
    try { token = auth && auth.getSessionToken ? auth.getSessionToken() : ""; } catch (_) {}
    if (token) return token;

    const credential = await getCredential(auth);
    const response = await fetch(SESSION_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: credential }),
      cache: "no-store"
    });
    const result = await response.json().catch(function () { return {}; });
    if (!response.ok || !result.success || !result.sessionToken) {
      throw new Error(result.error || "Could not verify your Google account.");
    }
    try {
      if (auth && auth.setSessionToken) auth.setSessionToken(result.sessionToken, result.expiresAt);
    } catch (_) {}
    return result.sessionToken;
  }

  async function request(action, postId) {
    const auth = getAuth();
    const user = getUser(auth);
    if (!user || !user.email) throw new Error("Sign in with Google to use MAX Cloud Saves.");
    const sessionToken = await getSession(auth);
    const response = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: action,
        postId: postId == null ? undefined : String(postId),
        email: String(user.email).trim().toLowerCase(),
        sessionToken: sessionToken
      }),
      cache: "no-store"
    });
    const result = await response.json().catch(function () { return {}; });
    if (!response.ok || !result.success) {
      const error = new Error(result.error || "Cloud save request failed.");
      error.status = response.status;
      throw error;
    }
    return result;
  }

  root.Sho1re1CloudSaves = {
    list: function () {
      return request("list").then(function (result) {
        return (result.saved || []).map(function (item) { return String(item.post_id); });
      });
    },
    save: function (postId) { return request("save", postId); },
    remove: function (postId) { return request("remove", postId); }
  };
})(window);
