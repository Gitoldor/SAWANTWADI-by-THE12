/* Sawantwadi full-site offline preload. */
"use strict";

const CACHE_NAME = "sawantwadi-static-v2";
const MANIFEST_URL = new URL("./offline-assets.json", self.registration.scope).href;
const STATUS_URL = new URL("./offline-preload-status.json", self.registration.scope).href;

async function preloadAll() {
  const cache = await caches.open(CACHE_NAME);
  const manifestResponse = await fetch(MANIFEST_URL, { cache: "no-store" });
  if (!manifestResponse.ok) throw new Error("Offline asset manifest could not be loaded");
  const manifest = await manifestResponse.json();
  const files = Array.isArray(manifest.files) ? manifest.files : [];
  let completed = 0;
  const failures = [];

  for (let i = 0; i < files.length; i += 4) {
    const batch = files.slice(i, i + 4);
    await Promise.all(batch.map(async path => {
      const url = new URL(path, self.registration.scope);
      try {
        // Keep already cached assets; only download missing files on retries.
        const existing = await cache.match(url.href);
        if (existing) {
          completed++;
          return;
        }
        const response = await fetch(url.href, { cache: "no-store" });
        if (!response.ok || response.type !== "basic") {
          throw new Error("HTTP " + response.status);
        }
        await cache.put(url.href, response.clone());
        completed++;
      } catch (error) {
        failures.push({ path, error: String(error && error.message || error) });
      }
    }));
  }

  const result = {
    type: "OFFLINE_PRELOAD_RESULT",
    total: files.length,
    cached: completed,
    failed: failures.length,
    failures
  };

  await cache.put(STATUS_URL, new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  }));
  return result;
}

async function readPreloadStatus() {
  const cache = await caches.open(CACHE_NAME);
  const response = await cache.match(STATUS_URL);
  return response ? response.json() : null;
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const manifestResponse = await fetch(MANIFEST_URL, { cache: "no-store" });
    if (!manifestResponse.ok) throw new Error("Offline asset manifest could not be loaded");
    await cache.put(MANIFEST_URL, manifestResponse.clone());
    await preloadAll();
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names
        .filter(name => name.startsWith("sawantwadi-static-") && name !== CACHE_NAME)
        .map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if (!event.data) return;
  const port = event.ports && event.ports[0];

  if (event.data.type === "GET_OFFLINE_PRELOAD_STATUS") {
    event.waitUntil(readPreloadStatus().then(result => {
      if (port) port.postMessage(result || {
        type: "OFFLINE_PRELOAD_RESULT", total: 0, cached: 0, failed: 1,
        failures: [{ path: "offline-preload-status.json", error: "Preload status is not available yet" }]
      });
    }));
    return;
  }

  if (event.data.type !== "RUN_OFFLINE_PRELOAD") return;
  event.waitUntil(preloadAll().then(result => {
    if (port) port.postMessage(result);
    return self.clients.matchAll({ type: "window", includeUncontrolled: true })
      .then(clients => clients.forEach(client => client.postMessage(result)));
  }).catch(error => {
    if (port) port.postMessage({
      type: "OFFLINE_PRELOAD_RESULT", total: 0, cached: 0, failed: 1,
      failures: [{ path: "offline-assets.json", error: String(error) }]
    });
  }));
});

function isCacheableRequest(request, url) {
  if (request.method !== "GET" || request.headers.has("range")) return false;
  if (url.origin !== self.location.origin || url.pathname.includes("/api/")) return false;
  if (request.mode === "navigate") return true;
  return /\.(html?|js|mjs|css|json|webmanifest|png|jpe?g|webp|avif|svg|gif|ico|woff2?|ttf|otf)$/i.test(url.pathname);
}

function cacheKeyFor(request, url) {
  if (request.mode !== "navigate") return request;
  const key = new URL(url.href);
  key.search = "";
  key.hash = "";
  if (key.pathname.endsWith("/")) key.pathname += "index.html";
  return new Request(key.href, { method: "GET" });
}

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (!isCacheableRequest(request, url)) return;
  const key = cacheKeyFor(request, url);
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(key);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && response.type === "basic") {
        await cache.put(key, response.clone());
      }
      return response;
    } catch (error) {
      if (request.mode === "navigate") {
        const fallback = await cache.match(new URL("./index.html", self.registration.scope).href);
        if (fallback) return fallback;
      }
      throw error;
    }
  })());
});
