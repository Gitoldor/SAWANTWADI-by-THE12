import http from "node:http";

const PORT = Number(process.env.PORT || 10000);
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_DATABASE_ID = process.env.CF_DATABASE_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Cache-Control": "no-store"
};

function send(res, status, body) {
  res.writeHead(status, { ...headers, "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function queryD1(sql) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(CF_ACCOUNT_ID)}/d1/database/${encodeURIComponent(CF_DATABASE_ID)}/query`;
  const upstream = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${CF_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ sql })
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
