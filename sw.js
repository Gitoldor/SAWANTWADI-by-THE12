const CACHE_NAME = "sho1re1-v3";
const EXTERNAL_CACHE_NAME = "sho1re1-external-v1";
const MAP_TILE_CACHE_NAME = "sho1re1-map-tiles-v1";
const MAX_CACHED_MAP_TILES = 600;
const OLD_CACHE_NAMES = ["my-app-v1"];

// Only cache external hosts that this app deliberately uses.
const OFFLINE_EXTERNAL_HOSTS = new Set([
  "cdnjs.cloudflare.com",
  "unpkg.com",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "i.ibb.co",
  "images.unsplash.com"
]);

function isMapTileHost(hostname) {
  return hostname === "server.arcgisonline.com" || hostname === "tile.openstreetmap.org" || hostname.endsWith(".tile.openstreetmap.org") || hostname === "basemaps.cartocdn.com" || hostname.endsWith(".basemaps.cartocdn.com");
}

async function trimMapTileCache(cache) {
  const keys = await cache.keys();
  const excess = keys.length - MAX_CACHED_MAP_TILES;
  if (excess > 0) await Promise.all(keys.slice(0, excess).map(key => cache.delete(key)));
}

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const keep = new Set([CACHE_NAME, EXTERNAL_CACHE_NAME, MAP_TILE_CACHE_NAME]);
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames
          .filter(name =>
            OLD_CACHE_NAMES.includes(name) ||
            (name.startsWith("sho1re1-") && !keep.has(name))
          )
          .map(name => caches.delete(name))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;
  if (request.headers.has("range")) return;

  const requestUrl = new URL(request.url);
  if (requestUrl.protocol !== "http:" && requestUrl.protocol !== "https:") return;

  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isApprovedExternal =
    OFFLINE_EXTERNAL_HOSTS.has(requestUrl.hostname);

  if (!isSameOrigin && isMapTileHost(requestUrl.hostname)) {
    event.respondWith((async () => {
      const cache = await caches.open(MAP_TILE_CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok || response.type === "opaque") {
          await cache.put(request, response.clone()).catch(() => {});
          await trimMapTileCache(cache).catch(() => {});
        }
        return response;
      } catch (error) {
        const fallback = await cache.match(request);
        if (fallback) return fallback;
        throw error;
      }
    })());
    return;
  }

  // Cache only the external CDNs/images/fonts the app uses.
  // This lets menu.html and its visual assets work after they have
  // been successfully loaded once while online.
  if (!isSameOrigin) {
    if (!isApprovedExternal) return;

    event.respondWith(
      (async () => {
        const cache = await caches.open(EXTERNAL_CACHE_NAME);
        const cached = await cache.match(request);

        if (cached) return cached;

        try {
          const response = await fetch(request);

          // Opaque responses are expected for classic no-CORS assets.
          if (response.ok || response.type === "opaque") {
            await cache.put(request, response.clone()).catch(() => {});
          }

          return response;
        } catch (error) {
          const fallback = await cache.match(request);
          if (fallback) return fallback;
          throw error;
        }
      })()
    );

    return;
  }

  if (request.mode === "navigate") {
    // Prefer fresh HTML, but keep a successful copy for offline visits.
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);

        try {
          const response = await fetch(request);

          if (response.ok && response.type === "basic") {
            await cache.put(request, response.clone()).catch(() => {});
          }

          return response;
        } catch (error) {
          const cached =
            await cache.match(request, { ignoreSearch: true }) ||
            await cache.match(new URL("/", self.location.origin).href) ||
            await cache.match(new URL("/index.html", self.location.origin).href);

          if (cached) return cached;
          throw error;
        }
      })()
    );

    return;
  }

  // Cache successful same-origin files after the first network request.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);

      if (cached) return cached;

      const response = await fetch(request);

      if (response.ok && response.type === "basic") {
        await cache.put(request, response.clone()).catch(() => {});
      }

      return response;
    })()
  );
});
