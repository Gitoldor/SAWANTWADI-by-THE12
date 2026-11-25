import http from "node:http";

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

async function verifyGoogleIdentity(credential) {
  if (!credential || typeof credential !== "string" || credential.length > 12000) return null;
  const response = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(credential));
  if (!response.ok) return null;
  const identity = await response.json();
  const expectedClientId = "89011073863-98b4vrionc2nvimj6ffec9b99qi6qjdt.apps.googleusercontent.com";
  if (identity.aud !== expectedClientId || identity.email_verified !== "true" ||
      !identity.email || !identity.sub || Number(identity.exp) * 1000 <= Date.now()) return null;
  return identity;
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

  if (req.method === "POST" && path === "/pro/register") {
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
      const identity = await verifyGoogleIdentity(body.credential);
      if (!identity) {
        return send(res, 401, { success: false, error: "Verified Google sign-in required" });
      }

      await queryD1(
        "INSERT INTO pro (email, google_sub, enabled, plan, status) VALUES (?, ?, 0, 'FREE', 'free') ON CONFLICT(email) DO UPDATE SET google_sub = excluded.google_sub, updated_at = CURRENT_TIMESTAMP",
        [identity.email, identity.sub]
      );

      const result = await queryD1(
        "SELECT enabled, plan, status, plan_id, started_at, expires_at FROM pro WHERE email = ? COLLATE NOCASE LIMIT 1",
        [identity.email]
      );
      const rows = result[0]?.results;
      if (!Array.isArray(rows) || !rows.length) {
        return send(res, 500, { success: false, error: "PRO account could not be loaded" });
      }

      const account = rows[0];
      const expired = !!account.expires_at && Date.parse(account.expires_at) <= Date.now();
      if (expired && Number(account.enabled) === 1) {
        await queryD1(
          "UPDATE pro SET enabled = 0, status = 'expired', plan = 'FREE', updated_at = CURRENT_TIMESTAMP WHERE email = ? COLLATE NOCASE",
          [identity.email]
        );
      }

      const isPro = Number(account.enabled) === 1 && !expired;
      return send(res, 200, {
        success: true,
        pro: {
          email: identity.email,
          plan: isPro ? (account.plan || "PRO") : "FREE",
          status: isPro ? "active" : (expired ? "expired" : (account.status || "free")),
          planId: account.plan_id || null,
          startedAt: account.started_at || null,
          expiresAt: account.expires_at || null,
          isPro
        }
      });
    } catch (error) {
      console.error("PRO account registration failed", error?.message || "Unknown error");
      return send(res, 500, { success: false, error: "Unable to register PRO account" });
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
      if (!credential || credential.length > 12000) {
        return send(res, 400, { success: false, allowed: false, error: "Google sign-in required" });
      }

      const identity = await verifyGoogleIdentity(credential);
      if (!identity) return send(res, 401, { success: false, allowed: false, error: "Google identity could not be verified" });

      const result = await queryD1(
        "SELECT enabled FROM pro WHERE email = ? COLLATE NOCASE LIMIT 1",
        [identity.email]
      );
      const rows = result[0]?.results;
      const allowed = Array.isArray(rows) && rows.length > 0 && Number(rows[0].enabled) === 1;
      return send(res, 200, { success: true, allowed });
    } catch (error) {
      console.error("Location customization access check failed", error?.message || "Unknown error");
      return send(res, 500, { success: false, allowed: false, error: "Unable to verify access" });
    }
  }

  if (req.method !== "GET" || !["/places", "/notifications"].includes(path)) {
    return send(res, 404, { success: false, error: "Not found" });
  }

  if (!CF_ACCOUNT_ID || !CF_DATABASE_ID || !CF_API_TOKEN) {
    return send(res, 503, { success: false, error: "D1 connection is not configured" });
  }

  try {
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
