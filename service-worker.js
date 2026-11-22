/* Sawantwadi offline cache — bump CACHE_NAME when you publish a new app version. */
"use strict";

const CACHE_NAME = "sawantwadi-static-v1";
const PRECACHE_URLS = [
  "./index.html", "./account.html", "./explore.html", "./menu.html",
  "./news.html", "./nofeature.html", "./saved.html", "./welcome.html",
  "./y.html", "./manifest.json", "./pwa-register.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
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

async function storeResponse(cache, key, response) {
  if (!response || !response.ok || response.type !== "basic") return;
  const control = (response.headers.get("Cache-Control") || "").toLowerCase();
  if (control.includes("no-store") || control.includes("private")) return;
  const size = Number(response.headers.get("Content-Length") || 0);
  if (size > 8 * 1024 * 1024) return;
  try { await cache.put(key, response.clone()); }
  catch (error) { console.warn("[Sawantwadi PWA] Cache write failed:", error); }
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
      await storeResponse(cache, key, response);
      return response;
    } catch (error) {
      if (request.mode === "navigate") {
        const fallback = await cache.match("./index.html");
        if (fallback) return fallback;
      }
      throw error;
    }
  })());
});
