import http from "node:http";
import crypto from "node:crypto";

const PORT = Number(process.env.PORT || 10000);
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_DATABASE_ID = process.env.CF_DATABASE_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;

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
  if (typeof credential !== "string" || credential.length > 12000) return null;
  const now = Math.floor(Date.now() / 1000);
  if (credential.startsWith("s1_")) {
    if (credential.length < 30 || credential.length > 200) return null;
    const tokenHash = crypto.createHash("sha256").update(credential).digest("hex");
    const result = await queryD1(
      "SELECT email,expires_at FROM sho1re1_auth_sessions WHERE token_hash=? AND expires_at>? LIMIT 1",
      [tokenHash, now]
    );
    const rows = result[0]?.results || [];
    return rows[0] ? { email: String(rows[0].email || "").trim().toLowerCase() } : null;
  }
  if (credential.length < 100) return null;
  const response = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(credential));
  if (!response.ok) return null;
  const identity = await response.json();
  const expectedClientId = "89011073863-98b4vrionc2nvimj6ffec9b99qi6qjdt.apps.googleusercontent.com";
  if (identity.aud !== expectedClientId || identity.email_verified !== "true" ||
      !identity.email || !identity.sub || Number(identity.exp) * 1000 <= Date.now()) return null;
  return { email: String(identity.email).trim().toLowerCase() };
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
      const identity = await verifyAccessCredential(credential);
      if (!identity) return send(res, 401, { success: false, allowed: false, error: "Valid sign-in required" });
      const requestedEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (requestedEmail && requestedEmail !== identity.email) {
        return send(res, 403, { success: false, allowed: false, error: "Signed-in account mismatch" });
      }

      const result = await queryD1(
        "SELECT enabled,personal_plan_id,personal_expires_at,business_plan_id,business_expires_at FROM pro WHERE email = ? COLLATE NOCASE LIMIT 1",
        [identity.email]
      );
      const rows = result[0]?.results || [];
      const row = rows[0] || {};
      const now = Math.floor(Date.now() / 1000);
      const legacyActive = Number(row.enabled) === 1 && !row.personal_plan_id && !row.business_plan_id &&
        row.personal_expires_at == null && row.business_expires_at == null;
      const personalActive = !!row.personal_plan_id && Number(row.personal_expires_at) > now;
      const businessActive = !!row.business_plan_id && Number(row.business_expires_at) > now;
      const allowed = legacyActive || personalActive || businessActive;
      return send(res, 200, { success: true, allowed, personalActive, businessActive });
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
      const identity = await verifyAccessCredential(body.credential);
      if (!identity) return send(res, 401, { success: false, active: false, error: "Valid sign-in required" });
      const result = await queryD1(
        "SELECT enabled,personal_plan_id,personal_expires_at,business_plan_id,business_expires_at FROM pro WHERE email = ? COLLATE NOCASE LIMIT 1",
        [identity.email]
      );
      const rows = result[0]?.results || [];
      const row = rows[0] || {};
      const now = Math.floor(Date.now() / 1000);
      const legacyActive = Number(row.enabled) === 1 && !row.personal_plan_id && !row.business_plan_id &&
        row.personal_expires_at == null && row.business_expires_at == null;
      const personalActive = !!row.personal_plan_id && Number(row.personal_expires_at) > now;
      const businessActive = !!row.business_plan_id && Number(row.business_expires_at) > now;
      const active = legacyActive || personalActive || businessActive;
      const planId = personalActive
        ? (row.personal_plan_id === "MAX_30D" ? "MAX_30D" : "PRO_7D")
        : businessActive ? row.business_plan_id : (legacyActive ? "PRO_LEGACY" : null);
      return send(res, 200, { success: true, active, planId, personalActive, businessActive });
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
