import http from "node:http";
import crypto from "node:crypto";

const PORT = Number(process.env.PORT || 10000);
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_DATABASE_ID = process.env.CF_DATABASE_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const AUTH_SESSION_SECRET = process.env.AUTH_SESSION_SECRET || "";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
  "Cache-Control": "no-store"
};

function send(res, status, body) {
  res.writeHead(status, { ...headers, "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function verifyAccessCredential(credential) {
  if (typeof credential !== "string" || credential.length < 100 || credential.length > 12000) return null;
  const response = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(credential));
  if (!response.ok) return null;
  const identity = await response.json();
  const expectedClientId = "89011073863-98b4vrionc2nvimj6ffec9b99qi6qjdt.apps.googleusercontent.com";
  if (identity.aud !== expectedClientId || identity.email_verified !== "true" ||
      !identity.email || !identity.sub || Number(identity.exp) * 1000 <= Date.now()) return null;
  return { email: String(identity.email).trim().toLowerCase() };
}


function createAppSession(email) {
  if (!AUTH_SESSION_SECRET || AUTH_SESSION_SECRET.length < 32) throw new Error("App session signing is not configured");
  const payload = Buffer.from(JSON.stringify({ email, typ: "sho1re1-session", exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 })).toString("base64url");
  const signature = crypto.createHmac("sha256", AUTH_SESSION_SECRET).update(payload).digest("base64url");
  return payload + "." + signature;
}
function verifyAppSession(token) {
  if (!AUTH_SESSION_SECRET || typeof token !== "string" || token.length > 2000) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const expected = crypto.createHmac("sha256", AUTH_SESSION_SECRET).update(parts[0]).digest();
  let actual;
  try { actual = Buffer.from(parts[1], "base64url"); } catch (_) { return null; }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    if (payload.typ !== "sho1re1-session" || !payload.email || Number(payload.exp) * 1000 <= Date.now()) return null;
    return { email: String(payload.email).trim().toLowerCase(), exp: Number(payload.exp) };
  } catch (_) { return null; }
}
async function resolveIdentity(body) {
  const session = verifyAppSession(body && body.sessionToken);
  if (session) return session;
  return verifyAccessCredential(body && body.credential);
}

async function queryD1(sql, params = []) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(CF_ACCOUNT_ID)}/d1/database/${encodeURIComponent(CF_DATABASE_ID)}/query`;
  const upstream = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${CF_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ sql, params })
  });

  const payload = await upstream.json();
  if (!upstream.ok || payload.success !== true) {
    console.error("Cloudflare D1 query failed", { status: upstream.status, errors: payload.errors || [] });
    throw new Error("D1 query failed");
  }
  return payload.result || [];
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, headers);
    return res.end();
  }

  const path = new URL(req.url || "/", "http://localhost").pathname;

  if (req.method === "GET" && path === "/health") {
    return send(res, 200, { success: true, service: "sawantwadi-render-read-api" });
  }



  if (req.method === "POST" && path === "/auth-session") {
    try {
      let raw = "";
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 20000) return send(res, 413, { success: false, error: "Request too large" });
      }
      const body = JSON.parse(raw || "{}");
      const identity = await verifyAccessCredential(body.credential);
      if (!identity) return send(res, 401, { success: false, error: "Valid Google sign-in required" });
      const sessionToken = createAppSession(identity.email);
      const payload = JSON.parse(Buffer.from(sessionToken.split(".")[0], "base64url").toString("utf8"));
      return send(res, 200, { success: true, sessionToken, expiresAt: payload.exp });
    } catch (error) {
      console.error("App session creation failed", error?.message || "Unknown error");
      return send(res, 503, { success: false, error: "Persistent sign-in is temporarily unavailable" });
    }
  }

  // MAX-only cloud saves. Identity comes from a verified Google token or signed app session.
  if (req.method === "POST" && path === "/max-saved-posts") {
    if (!CF_ACCOUNT_ID || !CF_DATABASE_ID || !CF_API_TOKEN) {
      return send(res, 503, { success: false, error: "D1 connection is not configured" });
    }
    try {
      let raw = "";
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 12000) return send(res, 413, { success: false, error: "Request too large" });
      }
      const body = JSON.parse(raw || "{}");
      const identity = await resolveIdentity(body);
      if (!identity) return send(res, 401, { success: false, error: "Valid sign-in required" });
      const requestedEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (requestedEmail && requestedEmail !== identity.email) {
        return send(res, 403, { success: false, error: "Signed-in account mismatch" });
      }

      const membershipResult = await queryD1(
        "SELECT plan,enabled,expires_at FROM pro WHERE email = ? COLLATE NOCASE LIMIT 1",
        [identity.email]
      );
      const membership = membershipResult[0]?.results?.[0] || {};
      const now = Math.floor(Date.now() / 1000);
      const maxActive = membership.plan === "MAX_30D" &&
        Number(membership.enabled) === 1 && Number(membership.expires_at) > now;
      if (!maxActive) {
        return send(res, 403, { success: false, maxActive: false, error: "Active MAX membership required" });
      }

      const action = String(body.action || "list");
      if (action === "list") {
        const result = await queryD1(
          "SELECT post_id,created_at FROM max_saved_posts WHERE email = ? COLLATE NOCASE ORDER BY created_at DESC",
          [identity.email]
        );
        return send(res, 200, { success: true, maxActive: true, plan: "MAX_30D", saved: result[0]?.results || [] });
      }

      const postId = typeof body.postId === "string" ? body.postId.trim() : "";
      if (!postId || postId.length > 180 || /[\\u0000-\\u001f]/.test(postId)) {
        return send(res, 400, { success: false, error: "Valid post ID required" });
      }
      if (action === "save") {
        await queryD1(
          "INSERT OR IGNORE INTO max_saved_posts (email,post_id,created_at) VALUES (?,?,?)",
          [identity.email, postId, now]
        );
        return send(res, 200, { success: true, maxActive: true, saved: true, postId });
      }
      if (action === "remove") {
        await queryD1(
          "DELETE FROM max_saved_posts WHERE email = ? COLLATE NOCASE AND post_id = ?",
          [identity.email, postId]
        );
        return send(res, 200, { success: true, maxActive: true, saved: false, postId });
      }
      return send(res, 400, { success: false, error: "Unsupported action" });
    } catch (error) {
      console.error("MAX cloud saves failed", error?.message || "Unknown error");
      return send(res, 500, { success: false, error: "Unable to sync cloud saves" });
    }
  }

  if (req.method === "POST" && path === "/location-custom-access") {
    if (!CF_ACCOUNT_ID || !CF_DATABASE_ID || !CF_API_TOKEN) {
      return send(res, 503, { success: false, error: "D1 connection is not configured" });
    }

    try {
      let raw = "";
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 20000) return send(res, 413, { success: false, error: "Request too large" });
      }
      const body = JSON.parse(raw || "{}");
      const credential = typeof body.credential === "string" ? body.credential : "";
      const identity = await resolveIdentity(body);
      if (!identity) return send(res, 401, { success: false, allowed: false, error: "Valid sign-in required" });
      const requestedEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (requestedEmail && requestedEmail !== identity.email) {
        return send(res, 403, { success: false, allowed: false, error: "Signed-in account mismatch" });
      }

      await queryD1("UPDATE pro SET plan=COALESCE(plan,'PRO_7D'), expires_at=COALESCE(expires_at, ?) WHERE enabled=1 AND (plan IS NULL OR (plan='PRO_7D' AND expires_at IS NULL))", [Math.floor(Date.now() / 1000) + 7 * 86400]);
      const result = await queryD1(
        "SELECT * FROM pro WHERE email = ? COLLATE NOCASE LIMIT 1",
        [identity.email]
      );
      const rows = result[0]?.results || [];
      const row = rows[0] || {};
      const now = Math.floor(Date.now() / 1000);
      const plan = row.plan || row.business_plan_id || row.personal_plan_id || (Number(row.enabled) === 1 ? "PRO_7D" : null);
      const expiry = row.expires_at ?? (row.business_plan_id ? row.business_expires_at : row.personal_expires_at);
      const active = Number(row.enabled) === 1 && Number(expiry) > now;
      const businessActive = active && String(plan || "").startsWith("BUSINESS_");
      const personalActive = active && !businessActive;
      return send(res, 200, { success: true, allowed: active, personalActive, businessActive });
    } catch (error) {
      console.error("Location customization access check failed", error?.message || "Unknown error");
      return send(res, 500, { success: false, allowed: false, error: "Unable to verify access" });
    }
  }

  // Display-only PRO badge status. This endpoint does not authorize PRO features.
  if (req.method === "POST" && path === "/pro-status") {
    if (!CF_ACCOUNT_ID || !CF_DATABASE_ID || !CF_API_TOKEN) {
      return send(res, 503, { success: false, active: false, error: "D1 connection is not configured" });
    }
    try {
      let raw = "";
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 2000) return send(res, 413, { success: false, active: false, error: "Request too large" });
      }
      const body = JSON.parse(raw || "{}");
      const identity = await resolveIdentity(body);
      if (!identity) return send(res, 401, { success: false, active: false, error: "Valid sign-in required" });
      await queryD1("UPDATE pro SET plan=COALESCE(plan,'PRO_7D'), expires_at=COALESCE(expires_at, ?) WHERE enabled=1 AND (plan IS NULL OR (plan='PRO_7D' AND expires_at IS NULL))", [Math.floor(Date.now() / 1000) + 7 * 86400]);
      const result = await queryD1(
        "SELECT enabled,plan,expires_at FROM pro WHERE email = ? COLLATE NOCASE LIMIT 1",
        [identity.email]
      );
      const rows = result[0]?.results || [];
      const row = rows[0] || {};
      const now = Math.floor(Date.now() / 1000);
      const plan = row.plan || row.business_plan_id || row.personal_plan_id || (Number(row.enabled) === 1 ? "PRO_7D" : null);
      const expiry = row.expires_at ?? (row.business_plan_id ? row.business_expires_at : row.personal_expires_at);
      const active = Number(row.enabled) === 1 && Number(expiry) > now;
      const businessActive = active && String(plan || "").startsWith("BUSINESS_");
      const personalActive = active && !businessActive;
      return send(res, 200, { success: true, active, planId: active ? (plan || "PRO_7D") : null, personalActive, businessActive });
    } catch (error) {
      console.error("PRO badge status check failed", error?.message || "Unknown error");
      return send(res, 500, { success: false, active: false, error: "Unable to check PRO status" });
    }
  }

  if (req.method !== "GET" || !["/places", "/media", "/notifications", "/posts-by-email"].includes(path)) {
    return send(res, 404, { success: false, error: "Not found" });
  }

  if (!CF_ACCOUNT_ID || !CF_DATABASE_ID || !CF_API_TOKEN) {
    return send(res, 503, { success: false, error: "D1 connection is not configured" });
  }

  try {
    if (path === "/posts-by-email") {
      const requestedUrl = new URL(req.url || "/", "http://localhost");
      const email = String(requestedUrl.searchParams.get("email") || "").trim().toLowerCase();
      if (!email || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return send(res, 400, { success: false, error: "Valid email required" });
      }
      const result = await queryD1(
        "SELECT id,title,topic,type,subtype,plan,lat,lng,image,link,plan2,createdOn,email FROM places WHERE email = ? COLLATE NOCASE ORDER BY id DESC",
        [email]
      );
      const rows = result[0]?.results;
      if (!Array.isArray(rows)) {
        return send(res, 502, { success: false, error: "Unexpected D1 response" });
      }
      return send(res, 200, { success: true, places: rows });
    }

    if (path === "/media") {
      const columns = "id,title,topic,type,subtype,plan,lat,lng,image,link,plan2,createdOn,paymentOrderId,paymentUtr,paymentAmount,postCode,email";
      const [postsResult, reelsResult, longFormsResult] = await Promise.all([
        queryD1("SELECT " + columns + " FROM posts ORDER BY id DESC"),
        queryD1("SELECT " + columns + " FROM reels ORDER BY id DESC"),
        queryD1("SELECT " + columns + " FROM long_forms ORDER BY id DESC")
      ]);

      const normalizeMedia = (result, kind) => {
        const rows = result[0]?.results;
        if (!Array.isArray(rows)) throw new Error("Unexpected D1 " + kind + " response");
        return rows.map(row => ({ ...row, sourceId: row.id, id: kind + "-" + row.id, contentKind: kind }));
      };

      return send(res, 200, {
        success: true,
        posts: normalizeMedia(postsResult, "post"),
        reels: normalizeMedia(reelsResult, "reel"),
        long_forms: normalizeMedia(longFormsResult, "long_form")
      });
    }
    if (path === "/notifications") {
      // Preserve the previous 24-hour notification lifetime.
      await queryD1(
        "DELETE FROM notifications WHERE julianday(createdAt) <= julianday('now', '-24 hours')"
      );

      const result = await queryD1(
        "SELECT id,image,title,message,link,createdAt FROM notifications ORDER BY createdAt DESC"
      );
      const notifications = result[0]?.results;

      if (!Array.isArray(notifications)) {
        console.error("Unexpected D1 notifications response shape");
        return send(res, 502, { success: false, error: "Unexpected D1 response" });
      }

      return send(res, 200, { success: true, notifications });
    }

    const result = await queryD1(
      "SELECT id,title,topic,type,subtype,plan,lat,lng,image,link,plan2,createdOn FROM places ORDER BY id DESC"
    );
    const rows = result[0]?.results;

    if (!Array.isArray(rows)) {
      console.error("Unexpected D1 places response shape");
      return send(res, 502, { success: false, error: "Unexpected D1 response" });
    }

    const places = rows.map((row) => {
      const place = { ...row };
      if (place.plan2 == null) delete place.plan2;
      if (place.createdOn == null) delete place.createdOn;
      return place;
    });

    return send(res, 200, { success: true, places });
  } catch (error) {
    console.error("Database request failed", error?.message || "Unknown error");
    return send(res, 500, { success: false, error: "Unable to load data" });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Sawantwadi read API listening on port ${PORT}`);
});
