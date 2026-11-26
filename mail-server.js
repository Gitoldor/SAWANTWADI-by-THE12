import http from 'node:http';
import crypto from 'node:crypto';

const PORT = Number(process.env.PORT || 10000);
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '89011073863-98b4vrionc2nvimj6ffec9b99qi6qjdt.apps.googleusercontent.com';
const APP_ORIGIN = process.env.APP_ORIGIN || 'https://sawantwadi-by-the12.pages.dev';

function redirectUri() {
  return process.env.GMAIL_REDIRECT_URI || (process.env.RENDER_EXTERNAL_URL
    ? process.env.RENDER_EXTERNAL_URL.replace(/\/$/, '') + '/gmail/oauth/callback'
    : '');
}

function json(res, status, body, origin = APP_ORIGIN) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': origin,
    'Vary': 'Origin'
  });
  res.end(JSON.stringify(body));
}

function html(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);
}

function makeState(secret) {
  const payload = Buffer.from(JSON.stringify({
    iat: Date.now(),
    nonce: crypto.randomBytes(18).toString('hex')
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return payload + '.' + signature;
}

function validState(state, secret) {
  try {
    const parts = String(state || '').split('.');
    const payload = parts[0];
    const signature = parts[1];
    if (!payload || !signature || parts.length !== 2) return false;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return false;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number.isFinite(data.iat) && Date.now() - data.iat >= 0 && Date.now() - data.iat < 10 * 60 * 1000;
  } catch {
    return false;
  }
}

async function readBody(req, maxBytes = 16000) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw, 'utf8') > maxBytes) throw new Error('Request too large');
  }
  return JSON.parse(raw || '{}');
}

async function exchangeRefreshToken() {
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  if (!refreshToken || !clientSecret) throw new Error('Gmail sender is not configured');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error('Gmail authorization refresh failed');
  return data.access_token;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  const path = url.pathname;
  const origin = req.headers.origin || '';

  if (req.method === 'OPTIONS') {
    if (origin !== APP_ORIGIN) return json(res, 403, { success: false, error: 'Origin not allowed' });
    res.writeHead(204, {
      'Access-Control-Allow-Origin': APP_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    });
    return res.end();
  }

  if (req.method === 'GET' && path === '/health') {
    return json(res, 200, { success: true, service: 'sho1re1-mail-api' });
  }

  if (req.method === 'GET' && path === '/gmail/oauth/start') {
    const secret = process.env.GMAIL_CLIENT_SECRET;
    const sender = String(process.env.GMAIL_SENDER_EMAIL || '').trim().toLowerCase();
    const callback = redirectUri();
    if (!secret || !sender || !callback) {
      return html(res, 503, '<h2>Mail setup is incomplete</h2><p>Set GMAIL_CLIENT_SECRET, GMAIL_SENDER_EMAIL and GMAIL_REDIRECT_URI in Render.</p>');
    }
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: callback,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      scope: 'openid email profile https://www.googleapis.com/auth/gmail.send',
      state: makeState(secret),
      login_hint: sender
    });
    res.writeHead(302, {
      Location: 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString(),
      'Cache-Control': 'no-store'
    });
    return res.end();
  }

  if (req.method === 'GET' && path === '/gmail/oauth/callback') {
    const secret = process.env.GMAIL_CLIENT_SECRET;
    const sender = String(process.env.GMAIL_SENDER_EMAIL || '').trim().toLowerCase();
    const callback = redirectUri();
    if (!secret || !sender || !callback) return html(res, 503, '<h2>Mail setup is incomplete</h2>');
    if (url.searchParams.get('error')) return html(res, 400, '<h2>Google authorization was cancelled or denied.</h2>');
    const code = url.searchParams.get('code');
    if (!code || !validState(url.searchParams.get('state'), secret)) {
      return html(res, 400, '<h2>Invalid or expired authorization state. Start authorization again.</h2>');
    }
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: secret,
          redirect_uri: callback,
          grant_type: 'authorization_code'
        })
      });
      const tokens = await tokenResponse.json();
      if (!tokenResponse.ok || !tokens.access_token) {
        console.error('Gmail OAuth code exchange failed');
        return html(res, 502, '<h2>Google token exchange failed. Check the OAuth client and redirect URI.</h2>');
      }
      const userResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: 'Bearer ' + tokens.access_token }
      });
      const user = await userResponse.json();
      if (!userResponse.ok || String(user.email || '').toLowerCase() !== sender || user.email_verified !== true) {
        return html(res, 403, '<h2>The authorized Google account does not match GMAIL_SENDER_EMAIL in Render.</h2>');
      }
      if (!tokens.refresh_token) {
        return html(res, 400, '<h2>Google did not return a refresh token. Revoke this app access in your Google Account and start authorization again.</h2>');
      }
      const token = escapeHtml(tokens.refresh_token);
      const page = '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sho1re1 Gmail authorization</title></head><body style="font:16px system-ui;max-width:680px;margin:40px auto;padding:20px"><h2>Gmail authorization successful</h2><p>Authorized sender: <b>' + escapeHtml(user.email) + '</b></p><p>Copy this refresh token and save it in Render as <code>GMAIL_REFRESH_TOKEN</code>. Treat it like a password. Do not share it.</p><textarea id="token" readonly style="width:100%;min-height:110px;box-sizing:border-box">' + token + '</textarea><p><button onclick="navigator.clipboard.writeText(document.getElementById(\\'token\\').value)">Copy refresh token</button></p><p>After saving the secret in Render, redeploy the mail service. You can then close this page.</p></body></html>';
      return html(res, 200, page);
    } catch (error) {
      console.error('Gmail OAuth callback failed', error?.message || 'Unknown error');
      return html(res, 500, '<h2>Authorization failed. Check Render logs for a safe error summary.</h2>');
    }
  }

  if (req.method === 'POST' && path === '/welcome') {
    if (origin !== APP_ORIGIN) return json(res, 403, { success: false, error: 'Origin not allowed' });
    if (!process.env.GMAIL_REFRESH_TOKEN || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_SENDER_EMAIL) {
      return json(res, 503, { success: false, error: 'Welcome email sender is not configured' });
    }
    try {
      const body = await readBody(req);
      const credential = typeof body.credential === 'string' ? body.credential : '';
      if (!credential || credential.length > 12000) return json(res, 400, { success: false, error: 'Google credential required' });

      const verifyResponse = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential));
      if (!verifyResponse.ok) return json(res, 401, { success: false, error: 'Google sign-in could not be verified' });
      const identity = await verifyResponse.json();
      if (identity.aud !== GOOGLE_CLIENT_ID || identity.email_verified !== 'true' ||
          !identity.email || !identity.sub || Number(identity.exp) * 1000 <= Date.now()) {
        return json(res, 401, { success: false, error: 'Invalid Google identity' });
      }

      const accessToken = await exchangeRefreshToken();
      const sender = String(process.env.GMAIL_SENDER_EMAIL).trim().toLowerCase();
      const recipient = String(identity.email).trim().toLowerCase();
      const displayName = String(identity.name || 'there').replace(/[\r\n<>]/g, '').slice(0, 80);
      const subject = 'Welcome to Sho1re1!';
      const plain = 'Hi ' + displayName + ',\n\nHappy to have you on Sho1re1! Discover local places, explore what is happening around Sawantwadi, and share with your community.\n\nHappy exploring,\nTeam Sho1re1';
      const htmlBody = '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#202124;max-width:560px;margin:auto"><h2>Welcome to Sho1re1!</h2><p>Hi ' + escapeHtml(displayName) + ',</p><p>We are happy to have you here. Discover local places, explore what is happening around Sawantwadi, and share with your community.</p><p>Happy exploring,<br><b>Team Sho1re1</b></p></div>';
      const boundary = 'sho1re1_' + crypto.randomBytes(12).toString('hex');
      const message = [
        'From: Sho1re1 <' + sender + '>',
        'To: ' + recipient,
        'Subject: =?UTF-8?B?' + Buffer.from(subject, 'utf8').toString('base64') + '?=',
        'MIME-Version: 1.0',
        'Content-Type: multipart/alternative; boundary="' + boundary + '"',
        '',
        '--' + boundary,
        'Content-Type: text/plain; charset="UTF-8"',
        'Content-Transfer-Encoding: base64',
        '',
        Buffer.from(plain, 'utf8').toString('base64'),
        '--' + boundary,
        'Content-Type: text/html; charset="UTF-8"',
        'Content-Transfer-Encoding: base64',
        '',
        Buffer.from(htmlBody, 'utf8').toString('base64'),
        '--' + boundary + '--'
      ].join('\r\n');
      const raw = Buffer.from(message, 'utf8').toString('base64url');
      const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw })
      });
      if (!sendResponse.ok) {
        console.error('Gmail send failed with status', sendResponse.status);
        return json(res, 502, { success: false, error: 'Welcome email could not be sent' });
      }
      return json(res, 200, { success: true, sent: true });
    } catch (error) {
      console.error('Welcome email request failed', error?.message || 'Unknown error');
      return json(res, 500, { success: false, error: 'Welcome email could not be sent' });
    }
  }

  return json(res, 404, { success: false, error: 'Not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('Sho1re1 mail API listening on port ' + PORT);
});
