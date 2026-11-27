import http from "node:http";
import crypto from "node:crypto";

const PORT = Number(process.env.PORT || 10000);
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_DATABASE_ID = process.env.CF_DATABASE_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const FAMGATEWAY_API_KEY = process.env.FAMGATEWAY_API_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "89011073863-98b4vrionc2nvimj6ffec9b99qi6qjdt.apps.googleusercontent.com";
const APP_ORIGIN = process.env.APP_ORIGIN || "https://sawantwadi-by-the12.pages.dev";

const PLANS = Object.freeze({
  PRO_7D:       { amount: 5,  days: 7,  label: "PRO" },
  MAX_30D:      { amount: 20, days: 30, label: "MAX" },
  BUSINESS_PRO: { amount: 10, days: 7,  label: "BUSINESS PRO" },
  BUSINESS_MAX: { amount: 30, days: 30, label: "BUSINESS MAX" }
});

const cors = {
  "Access-Control-Allow-Origin": APP_ORIGIN,
  "Vary": "Origin",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Cache-Control": "no-store"
};

function send(res, status, body) {
  res.writeHead(status, { ...cors, "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}
function readBody(req, limit = 20000) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
      if (raw.length > limit) {
        reject(Object.assign(new Error("Request too large"), { status: 413 }));
        req.destroy();
      }
    });
    req.on("end", () => {
      try { resolve(JSON.parse(raw || "{}")); }
      catch { reject(Object.assign(new Error("Invalid JSON"), { status: 400 })); }
    });
    req.on("error", reject);
  });
}
function configured() {
  return Boolean(CF_ACCOUNT_ID && CF_DATABASE_ID && CF_API_TOKEN && FAMGATEWAY_API_KEY);
}
async function queryD1(sql, params = []) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(CF_ACCOUNT_ID)}/d1/database/${encodeURIComponent(CF_DATABASE_ID)}/query`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${CF_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ sql, params })
  });
  const payload = await response.json();
  if (!response.ok || payload.success !== true) {
    console.error("D1 request failed", response.status, payload.errors || []);
    throw new Error("Membership database request failed");
  }
  return payload.result?.[0]?.results || [];
}

async function verifyGoogleCredential(token) {
  if (typeof token !== "string" || token.length < 100 || token.length > 12000) {
    throw Object.assign(new Error("Google sign-in required"), { status: 401 });
  }
  const response = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(token));
  if (!response.ok) throw Object.assign(new Error("Google sign-in expired. Sign in again."), { status: 401 });
  const identity = await response.json();
  if (identity.aud !== GOOGLE_CLIENT_ID || identity.email_verified !== "true" ||
      !identity.email || !identity.sub || Number(identity.exp) * 1000 <= Date.now()) {
    throw Object.assign(new Error("Google account could not be verified"), { status: 401 });
  }
  return {
    sub: String(identity.sub),
    email: String(identity.email).trim().toLowerCase(),
    name: String(identity.name || "Sho1re1 user").slice(0, 80)
  };
}

function signContinuation(data) {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = crypto.createHmac("sha256", FAMGATEWAY_API_KEY).update(payload).digest("base64url");
  return payload + "." + signature;
}
function verifyContinuation(token, orderId) {
  if (typeof token !== "string" || token.length > 3000) {
    throw Object.assign(new Error("Payment details are missing. Return to the plan page and retry."), { status: 401 });
  }
  const parts = token.split(".");
  if (parts.length !== 2) throw Object.assign(new Error("Invalid payment details"), { status: 401 });
  const expected = crypto.createHmac("sha256", FAMGATEWAY_API_KEY).update(parts[0]).digest();
  let supplied;
  try { supplied = Buffer.from(parts[1], "base64url"); } catch { supplied = Buffer.alloc(0); }
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    throw Object.assign(new Error("Invalid payment details"), { status: 401 });
  }
  let data;
  try { data = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")); }
  catch { throw Object.assign(new Error("Invalid payment details"), { status: 401 }); }
  if (data.orderId !== orderId || !data.sub || !data.email || !PLANS[data.planId] ||
      !Number.isFinite(Number(data.payableAmount)) || !Number.isFinite(Number(data.issuedAt)) ||
      Number(data.tokenExpiresAt) * 1000 <= Date.now()) {
    throw Object.assign(new Error("Payment session expired. Choose your plan again."), { status: 401 });
  }
  return data;
}

async function gatewayRequest(path, options = {}) {
  const response = await fetch("https://famgateway.in" + path, {
    ...options,
    headers: { "X-Api-Key": FAMGATEWAY_API_KEY, Accept: "application/json", ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("FamGateway returned HTTP", response.status);
    throw new Error("Payment gateway request failed");
  }
  return payload;
}
function gatewayData(payload) { return payload?.data || payload || {}; }
function paidStatus(payload) {
  const d = gatewayData(payload);
  return String(payload?.status || d?.status || "").toLowerCase() === "success" ||
    String(d?.payment_status || "").toLowerCase() === "success";
}
async function authoritativeVerify(orderId) {
  return gatewayRequest("/api/verify-order.php?order_id=" + encodeURIComponent(orderId));
}

async function activatePaidOrder(data, verified) {
  const d = gatewayData(verified);
  const utr = String(d.utr || d.bank_utr || d.transaction_id || "").trim();
  const amount = Number(d.payable_amount || d.amount || 0);
  if (!paidStatus(verified) || !utr || amount !== Number(data.payableAmount)) {
    throw Object.assign(new Error("Payment is not confirmed for the expected amount"), { status: 409 });
  }

  const now = Math.floor(Date.now() / 1000);
  const plan = PLANS[data.planId];
  const rows = await queryD1(
    "SELECT plan,enabled,created_at,expires_at FROM pro WHERE email=? COLLATE NOCASE LIMIT 1",
    [data.email]
  );
  const current = rows[0] || null;
  const orderStamp = String(data.issuedAt);

  // created_at records the most recently activated checkout. This makes repeat
  // return/poll requests idempotent without storing a separate order table.
  if (current && String(current.created_at) === orderStamp) {
    const expiry = Number(current.expires_at) || 0;
    return { active: Number(current.enabled) === 1 && expiry > now, planId: current.plan, expiresAt: expiry ? new Date(expiry * 1000).toISOString() : null };
  }

  const oldExpiry = current && Number(current.enabled) === 1 ? Number(current.expires_at) || 0 : 0;
  const expiry = Math.max(now, oldExpiry) + plan.days * 86400;

  if (current) {
    await queryD1(
      "UPDATE pro SET plan=?,enabled=1,created_at=?,expires_at=? WHERE email=? COLLATE NOCASE",
      [data.planId, orderStamp, expiry, data.email]
    );
  } else {
    await queryD1(
      "INSERT INTO pro (email,plan,enabled,created_at,expires_at) VALUES (?,?,1,?,?)",
      [data.email, data.planId, orderStamp, expiry]
    );
  }
  return { active: true, planId: data.planId, expiresAt: new Date(expiry * 1000).toISOString() };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
  const url = new URL(req.url || "/", "http://localhost");
  if (req.method === "GET" && url.pathname === "/health") {
    return send(res, 200, { success: true, service: "sho1re1-payments", configured: configured() });
  }
  if (!configured()) return send(res, 503, { success: false, error: "Payment service is not configured" });

  try {
    if (req.method === "POST" && url.pathname === "/api/orders") {
      const body = await readBody(req);
      const identity = await verifyGoogleCredential(body.credential);
      const planId = String(body.planId || "");
      const plan = PLANS[planId];
      if (!plan) return send(res, 400, { success: false, error: "Unknown plan" });

      const gateway = await gatewayRequest("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: plan.amount,
          customer_name: identity.name,
          redirect_url: APP_ORIGIN + "/pro.html?payment=return"
        })
      });
      if (String(gateway.status || "").toLowerCase() !== "success") {
        return send(res, 502, { success: false, error: "Gateway could not create the payment order" });
      }
      const d = gatewayData(gateway);
      const orderId = String(d.order_id || "");
      const payableAmount = Number(d.payable_amount || d.amount || 0);
      if (!orderId || !Number.isFinite(payableAmount) || payableAmount < plan.amount) {
        return send(res, 502, { success: false, error: "Gateway returned an invalid order" });
      }
      const issuedAt = Date.now();
      const continuationToken = signContinuation({
        orderId, sub: identity.sub, email: identity.email, planId,
        payableAmount, issuedAt, tokenExpiresAt: Math.floor(Date.now() / 1000) + 7 * 86400
      });
      return send(res, 200, {
        success: true,
        order: {
          orderId, planId, baseAmount: plan.amount, payableAmount,
          checkoutUrl: String(d.checkout_url || ""),
          qrUrl: String(d.qr_url || ""),
          upiIntent: String(d.upi_intent || ""),
          continuationToken,
          expiresAt: d.expires_at_ist || null
        }
      });
    }

    if (req.method === "POST" && url.pathname === "/api/verify") {
      const body = await readBody(req);
      const orderId = String(body.orderId || "");
      if (!orderId || orderId.length > 100) return send(res, 400, { success: false, error: "Order ID required" });
      const data = verifyContinuation(body.continuationToken, orderId);
      const verified = await authoritativeVerify(orderId);
      if (!paidStatus(verified)) return send(res, 200, { success: true, status: "pending" });
      const activation = await activatePaidOrder(data, verified);
      return send(res, 200, { success: true, status: "paid", activation });
    }

    if (req.method === "POST" && url.pathname === "/api/subscription") {
      const body = await readBody(req);
      const identity = await verifyGoogleCredential(body.credential);
      const rows = await queryD1(
        "SELECT plan,enabled,created_at,expires_at FROM pro WHERE email=? COLLATE NOCASE LIMIT 1",
        [identity.email]
      );
      const row = rows[0] || null;
      const now = Math.floor(Date.now() / 1000);
      if (!row || Number(row.enabled) !== 1) {
        return send(res, 200, { success: true, email: identity.email, subscriptions: [] });
      }
      const expiry = row.expires_at == null ? 0 : Number(row.expires_at);
      if (expiry && expiry <= now) {
        await queryD1("UPDATE pro SET enabled=0 WHERE email=? COLLATE NOCASE", [identity.email]);
        return send(res, 200, { success: true, email: identity.email, subscriptions: [] });
      }
      const legacy = !row.plan && !expiry;
      const subscriptions = [{
        family: row.plan && row.plan.startsWith("BUSINESS_") ? "BUSINESS" : "PERSONAL",
        planId: row.plan || "PRO_LEGACY",
        expiresAt: expiry ? new Date(expiry * 1000).toISOString() : null,
        legacy
      }];
      return send(res, 200, { success: true, email: identity.email, subscriptions });
    }

    return send(res, 404, { success: false, error: "Not found" });
  } catch (error) {
    console.error("Payment API error:", error.message);
    return send(res, error.status || 500, { success: false, error: error.message || "Payment service error" });
  }
});

server.listen(PORT, () => console.log("Sho1re1 simple payment service listening on", PORT));
