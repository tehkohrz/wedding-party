/**
 * SitWhereAh service worker — makes the app work fully offline.
 *
 * Strategy: runtime caching. On first visit (online), every same-origin
 * file the app fetches is copied into a cache. On later visits — even with
 * no network — those cached copies are served. Because all guest data is
 * baked into the JS bundle and attendance lives in IndexedDB, caching the
 * app shell is enough to run the whole app offline.
 *
 * Not using a precache manifest (Serwist/next-pwa) because this app is small
 * and fully client-side; runtime caching covers it without build-tool
 * integration. Bump CACHE_VERSION to force all clients to re-fetch after a
 * deploy (old caches are deleted on activate).
 */
const CACHE_VERSION = "sitwhereah-v1";

self.addEventListener("install", (event) => {
  // Activate this worker immediately instead of waiting for old tabs to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Delete caches from previous versions.
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle same-origin GET requests. Let everything else (POST, other
  // origins) pass straight through to the network.
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cached = await cache.match(req);

      // Cache-first: serve the cached copy if we have it, and refresh it in
      // the background (stale-while-revalidate).
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);

      if (cached) {
        event.waitUntil(network); // update cache in background
        return cached;
      }

      // Not cached yet → go to network and cache it.
      const res = await network;
      if (res) return res;

      // Offline and uncached. For page navigations, fall back to the cached
      // home page so the app still boots.
      if (req.mode === "navigate") {
        const home = await cache.match("/");
        if (home) return home;
      }
      return new Response("Offline", { status: 503, statusText: "Offline" });
    })()
  );
});
