/**
 * SitWhereAh service worker — makes the app work fully offline.
 *
 * Strategy: runtime caching. On first visit (online), every same-origin
 * file the app fetches is copied into a cache. On later visits — even with
 * no network — those cached copies are served. Because all guest data is
 * baked into the JS bundle and attendance lives in IndexedDB, caching the
 * app shell is enough to run the whole app offline.
 *
 * DEV SAFETY: localhost is exempt from the HTTPS requirement, so this worker
 * can install during `pnpm dev`. Cache-first would then serve stale JS and
 * silently break hot-reload. So on localhost this worker refuses to cache or
 * intercept anything, wipes its caches, and unregisters itself.
 *
 * That self-destruct is why you never have to clear storage by hand: the
 * browser always revalidates sw.js on navigation (it does NOT serve the
 * worker script from the worker's own cache), so this file always reaches
 * the browser even when an older worker is active.
 *
 * Bump CACHE_VERSION to force clients to re-fetch after a production deploy;
 * old caches are deleted on activate.
 */
const CACHE_VERSION = "sitwhereah-v3";

const DEV_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const IS_DEV = DEV_HOSTS.has(self.location.hostname);

self.addEventListener("install", () => {
  // Activate this worker immediately instead of waiting for old tabs to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (IS_DEV) {
        // Self-destruct on localhost: wipe every cache, unregister, and
        // reload open tabs so they come back uncontrolled and un-cached.
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
        await self.registration.unregister();
        const clients = await self.clients.matchAll({ type: "window" });
        for (const client of clients) {
          try {
            await client.navigate(client.url);
          } catch {
            // Some clients can't be navigated; harmless.
          }
        }
        return;
      }

      // Production: delete caches from previous versions.
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  // Never intercept on localhost — let dev requests hit the network directly.
  if (IS_DEV) return;

  const req = event.request;

  const url = new URL(req.url);

  // Only handle same-origin GET requests. Let everything else (POST, other
  // origins) pass straight through to the network.
  if (req.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // API responses are LIVE data (attendance polls, guest list) — caching
  // them would freeze multi-device check-in. Straight to the network,
  // always.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);

      // Page navigations: NETWORK-FIRST — pages carry fresh server data
      // (e.g. /r/[slug] renders the group's current response). The cache
      // is only the offline fallback.
      if (req.mode === "navigate") {
        try {
          const res = await fetch(req);
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        } catch {
          const cached = await cache.match(req);
          if (cached) return cached;
          const home = await cache.match("/");
          if (home) return home;
          return new Response("Offline", { status: 503 });
        }
      }

      // Static assets (JS/CSS/fonts/images): cache-first with background
      // refresh (stale-while-revalidate) — these are content-hashed or
      // rarely change, so stale is fine and fast.
      const cached = await cache.match(req);
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
      const res = await network;
      if (res) return res;
      return new Response("Offline", { status: 503, statusText: "Offline" });
    })()
  );
});
