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
  PRO_7D:       { amount: 5,  days: 7,  family: "PERSONAL", label: "PRO" },
  MAX_30D:      { amount: 20, days: 30, family: "PERSONAL", label: "MAX" },
  BUSINESS_PRO: { amount: 10, days: 7, family: "BUSINESS", label: "BUSINESS PRO" },
  BUSINESS_MAX: { amount: 30, days: 30, family: "BUSINESS", label: "BUSINESS MAX" }
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
      try { resolve({ raw, body: raw ? JSON.parse(raw) : {} }); }
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
    throw new Error("Payment database request failed");
  }
  return payload.result?.[0]?.results || [];
}
let schemaReady;
async function ensureSchema() {
  if (!schemaReady) schemaReady = (async () => {
    await queryD1(`CREATE TABLE IF NOT EXISTS sho1re1_payment_orders (
      order_id TEXT PRIMARY KEY,
      google_sub TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      base_amount INTEGER NOT NULL,
      payable_amount TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      utr TEXT UNIQUE,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    )`);
    // Membership stays in the app's existing `pro` table. Additive migration only:
    // existing email/enabled/created_at rows are preserved.
    const columns = await queryD1("PRAGMA table_info(pro)");
    const present = new Set(columns.map(column => column.name));
    const additions = [
      ["google_sub", "TEXT"],
      ["personal_plan_id", "TEXT"],
      ["personal_expires_at", "INTEGER"],
      ["personal_last_order_id", "TEXT"],
      ["business_plan_id", "TEXT"],
      ["business_expires_at", "INTEGER"],
      ["business_last_order_id", "TEXT"]
    ];
    for (const [name, type] of additions) {
      if (!present.has(name)) await queryD1("ALTER TABLE pro ADD COLUMN " + name + " " + type);
    }
    await queryD1("CREATE INDEX IF NOT EXISTS idx_sho1re1_orders_google_sub ON sho1re1_payment_orders(google_sub)");
  })().catch(error => { schemaReady = null; throw error; });
  return schemaReady;
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
async function gatewayRequest(path, options = {}) {
  const response = await fetch("https://famgateway.in" + path, {
    ...options,
    headers: {
      "X-Api-Key": FAMGATEWAY_API_KEY,
      Accept: "application/json",
      ...(options.headers || {})
    }
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
async function activatePaidOrder(order, identity, verified) {
  const d = gatewayData(verified);
  const utr = String(d.utr || d.bank_utr || d.transaction_id || "").trim();
  const amount = String(d.payable_amount || d.amount || "");
  if (!paidStatus(verified) || !utr || Number(amount) !== Number(order.payable_amount)) {
    throw Object.assign(new Error("Payment is not verified for the expected amount"), { status: 409 });
  }
  const now = Math.floor(Date.now() / 1000);
  const plan = PLANS[order.plan_id];
  if (!plan || identity.sub !== order.google_sub) {
    throw Object.assign(new Error("This payment belongs to a different Google account"), { status: 403 });
  }
  if (order.status === "ACTIVATED") {
    const current = await queryD1(
      "SELECT personal_plan_id,personal_expires_at,business_plan_id,business_expires_at FROM pro WHERE email=? COLLATE NOCASE LIMIT 1",
      [identity.email]
    );
    const row = current[0] || {};
    const planId = plan.family === "PERSONAL" ? row.personal_plan_id : row.business_plan_id;
    const expiry = Number(plan.family === "PERSONAL" ? row.personal_expires_at : row.business_expires_at) || 0;
    return { active: expiry > now, planId, family: plan.family, expiresAt: expiry ? new Date(expiry * 1000).toISOString() : null };
  }

  // Repeated verify/return requests must never extend the same paid order twice.
  const existing = await queryD1(
    "SELECT enabled, google_sub, personal_plan_id, personal_expires_at, personal_last_order_id, business_plan_id, business_expires_at, business_last_order_id FROM pro WHERE email=? COLLATE NOCASE LIMIT 1",
    [identity.email]
  );
  const row = existing[0] || {};
  const lastOrder = plan.family === "PERSONAL" ? row.personal_last_order_id : row.business_last_order_id;
  const expiryField = plan.family === "PERSONAL" ? row.personal_expires_at : row.business_expires_at;
  const planField = plan.family === "PERSONAL" ? row.personal_plan_id : row.business_plan_id;
  if (lastOrder === order.order_id) {
    return { active: Number(expiryField) > now, planId: planField, family: plan.family, expiresAt: new Date(Number(expiryField) * 1000).toISOString() };
  }

  // The account email is first persisted here, only after gateway verification.
  await queryD1(
    "UPDATE sho1re1_payment_orders SET status='PAID', utr=? WHERE order_id=? AND status!='ACTIVATED' AND (utr IS NULL OR utr=?)",
    [utr, order.order_id, utr]
  );
  const oldExpiry = Number(expiryField) || 0;
  const start = Math.max(now, oldExpiry);
  const expiry = start + plan.days * 86400;

  if (plan.family === "PERSONAL") {
    await queryD1(
      `INSERT INTO pro (email, enabled, google_sub, personal_plan_id, personal_expires_at, personal_last_order_id)
       VALUES (?, 1, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         enabled=1, google_sub=excluded.google_sub,
         personal_plan_id=excluded.personal_plan_id,
         personal_expires_at=excluded.personal_expires_at,
         personal_last_order_id=excluded.personal_last_order_id`,
      [identity.email, identity.sub, order.plan_id, expiry, order.order_id]
    );
  } else {
    await queryD1(
      `INSERT INTO pro (email, enabled, google_sub, business_plan_id, business_expires_at, business_last_order_id)
       VALUES (?, 1, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         enabled=1, google_sub=excluded.google_sub,
         business_plan_id=excluded.business_plan_id,
         business_expires_at=excluded.business_expires_at,
         business_last_order_id=excluded.business_last_order_id`,
      [identity.email, identity.sub, order.plan_id, expiry, order.order_id]
    );
  }
  await queryD1("UPDATE sho1re1_payment_orders SET status='ACTIVATED' WHERE order_id=? AND status='PAID'", [order.order_id]);
  return { active: true, planId: order.plan_id, family: plan.family, expiresAt: new Date(expiry * 1000).toISOString() };
}

async function markWebhookPaid(orderId, payload) {
  const rows = await queryD1("SELECT * FROM sho1re1_payment_orders WHERE order_id=? LIMIT 1", [orderId]);
  if (!rows.length) return false;
  const order = rows[0];
  if (order.status === "ACTIVATED") return true;
  const verified = await authoritativeVerify(orderId);
  const d = gatewayData(verified);
  const utr = String(d.utr || d.bank_utr || d.transaction_id || payload.utr || "").trim();
  const amount = String(d.payable_amount || d.amount || payload.payable_amount || payload.amount || "");
  if (!paidStatus(verified) || !utr || Number(amount) !== Number(order.payable_amount)) return false;
  await queryD1(
    "UPDATE sho1re1_payment_orders SET status='PAID', utr=? WHERE order_id=? AND (utr IS NULL OR utr=?)",
    [utr, orderId, utr]
  );
  return true;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
  const url = new URL(req.url || "/", "http://localhost");
  if (req.method === "GET" && url.pathname === "/health") {
    return send(res, 200, { success: true, service: "sho1re1-payments", configured: configured() });
  }
  if (req.method === "POST" && url.pathname === "/webhook") {
    if (!FAMGATEWAY_API_KEY) return send(res, 503, { success: false });
    try {
      const { raw, body } = await readBody(req, 30000);
      const signature = String(req.headers["x-famgateway-signature"] || "");
      const expected = crypto.createHmac("sha256", FAMGATEWAY_API_KEY).update(raw).digest();
      const supplied = /^[a-f0-9]{64}$/i.test(signature) ? Buffer.from(signature, "hex") : Buffer.alloc(0);
      if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
        return send(res, 401, { success: false, error: "Invalid signature" });
      }
      if (body.event === "payment.success" || String(body.status).toLowerCase() === "success") {
        if (!configured()) return send(res, 503, { success: false });
        await ensureSchema();
        const ok = await markWebhookPaid(String(body.order_id || ""), body);
        if (!ok) return send(res, 409, { success: false, error: "Order not matched or payment not verified" });
      }
      return send(res, 200, { success: true });
    } catch (error) {
      console.error("Webhook processing failed:", error.message);
      return send(res, error.status || 500, { success: false, error: "Webhook processing failed" });
    }
  }

  if (!configured()) return send(res, 503, { success: false, error: "Payment service is not configured" });
  try {
    await ensureSchema();

    if (req.method === "POST" && url.pathname === "/api/orders") {
      const { body } = await readBody(req);
      const identity = await verifyGoogleCredential(body.credential);
      const plan = PLANS[String(body.planId || "")];
      if (!plan) return send(res, 400, { success: false, error: "Unknown plan" });

      const gateway = await gatewayRequest("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: plan.amount,
          customer_name: identity.name,
          redirect_url: APP_ORIGIN + "/pro.html?payment=return",
          webhook_url: process.env.FAMGATEWAY_WEBHOOK_URL || undefined
        })
      });
      if (String(gateway.status || "").toLowerCase() !== "success") {
        return send(res, 502, { success: false, error: "Gateway could not create the payment order" });
      }
      const d = gatewayData(gateway);
      const orderId = String(d.order_id || "");
      const payable = String(d.payable_amount || d.amount || "");
      if (!orderId || !Number.isFinite(Number(payable)) || Number(payable) < plan.amount) {
        return send(res, 502, { success: false, error: "Gateway returned an invalid order" });
      }
      const now = Math.floor(Date.now() / 1000);
      await queryD1(
        "INSERT INTO sho1re1_payment_orders (order_id,google_sub,plan_id,base_amount,payable_amount,status,created_at,expires_at) VALUES (?,?,?,?,?,'PENDING',?,?)",
        [orderId, identity.sub, body.planId, plan.amount, payable, now, now + 300]
      );
      return send(res, 200, {
        success: true,
        order: {
          orderId,
          planId: body.planId,
          baseAmount: plan.amount,
          payableAmount: payable,
          checkoutUrl: String(d.checkout_url || ""),
          qrUrl: String(d.qr_url || ""),
          upiIntent: String(d.upi_intent || ""),
          expiresAt: d.expires_at_ist || null
        }
      });
    }

    if (req.method === "POST" && url.pathname === "/api/verify") {
      const { body } = await readBody(req);
      const identity = await verifyGoogleCredential(body.credential);
      const orderId = String(body.orderId || "");
      if (!orderId || orderId.length > 100) return send(res, 400, { success: false, error: "Order ID required" });
      const rows = await queryD1("SELECT * FROM sho1re1_payment_orders WHERE order_id=? LIMIT 1", [orderId]);
      if (!rows.length || rows[0].google_sub !== identity.sub) {
        return send(res, 404, { success: false, error: "Payment order not found for this account" });
      }
      const order = rows[0];
      if (Number(order.expires_at) < Math.floor(Date.now() / 1000) && order.status !== "PAID") {
        return send(res, 200, { success: true, status: "expired" });
      }
      if (order.status !== "PAID") {
        const verified = await authoritativeVerify(orderId);
        const d = gatewayData(verified);
        if (!paidStatus(verified)) return send(res, 200, { success: true, status: "pending" });
        const activation = await activatePaidOrder(order, identity, verified);
        return send(res, 200, { success: true, status: "paid", activation });
      }
      const verified = await authoritativeVerify(orderId);
      if (!paidStatus(verified)) return send(res, 409, { success: false, error: "Payment status could not be re-confirmed" });
      const activation = await activatePaidOrder(order, identity, verified);
      return send(res, 200, { success: true, status: "paid", activation });
    }

    if (req.method === "POST" && url.pathname === "/api/subscription") {
      const { body } = await readBody(req);
      const identity = await verifyGoogleCredential(body.credential);
      // If the buyer closed checkout before the return page loaded, the verified
      // webhook leaves the order PAID. Reconcile it on the next authenticated visit.
      const paidOrders = await queryD1(
        "SELECT * FROM sho1re1_payment_orders WHERE google_sub=? AND status='PAID' ORDER BY created_at ASC",
        [identity.sub]
      );
      for (const order of paidOrders) {
        const verified = await authoritativeVerify(order.order_id);
        if (paidStatus(verified)) await activatePaidOrder(order, identity, verified);
      }
      const rows = await queryD1(
        "SELECT enabled, google_sub, personal_plan_id, personal_expires_at, business_plan_id, business_expires_at FROM pro WHERE email=? COLLATE NOCASE LIMIT 1",
        [identity.email]
      );
      const row = rows[0] || {};
      const now = Math.floor(Date.now() / 1000);
      const legacyActive = Number(row.enabled) === 1 && !row.personal_plan_id && !row.business_plan_id &&
        row.personal_expires_at == null && row.business_expires_at == null;
      const subscriptions = [];
      if (legacyActive) subscriptions.push({ family: "PERSONAL", planId: "PRO_LEGACY", expiresAt: null, legacy: true });
      if (row.personal_plan_id && Number(row.personal_expires_at) > now) subscriptions.push({
        family: "PERSONAL", planId: row.personal_plan_id,
        expiresAt: new Date(Number(row.personal_expires_at) * 1000).toISOString()
      });
      if (row.business_plan_id && Number(row.business_expires_at) > now) subscriptions.push({
        family: "BUSINESS", planId: row.business_plan_id,
        expiresAt: new Date(Number(row.business_expires_at) * 1000).toISOString()
      });
      return send(res, 200, { success: true, email: identity.email, subscriptions });
    }

    return send(res, 404, { success: false, error: "Not found" });
  } catch (error) {
    console.error("Payment API error:", error.message);
    return send(res, error.status || 500, { success: false, error: error.message || "Payment service error" });
  }
});

server.listen(PORT, () => console.log("Sho1re1 payment service listening on", PORT));
