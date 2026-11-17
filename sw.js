const CACHE_NAME = "sho1re1-v2";
const OLD_CACHE_NAMES = ["my-app-v1"];

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames
          .filter(name =>
            OLD_CACHE_NAMES.includes(name) ||
            (name.startsWith("sho1re1-") && name !== CACHE_NAME)
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

  // Leave external requests and non-web schemes to the browser.
  if (requestUrl.origin !== self.location.origin) return;
  if (requestUrl.protocol !== "http:" && requestUrl.protocol !== "https:") return;

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
  // Existing cached files are returned immediately for faster repeat visits.
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
