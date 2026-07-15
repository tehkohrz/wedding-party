"use client";

/**
 * Registers /sw.js in production; actively UNREGISTERS it in development.
 *
 * Why the dev branch: localhost is exempt from the HTTPS requirement, so a
 * service worker will happily install during `pnpm dev`. Ours is cache-first,
 * which means it would serve stale JS/CSS and silently break hot-reload —
 * your code changes just wouldn't appear. So in dev we tear it down and wipe
 * its caches, which also self-heals any worker installed by an earlier run.
 *
 * Renders nothing. Lives in the root layout so every page triggers it.
 * Service workers only take effect from a production build over HTTPS
 * (or localhost).
 */
import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failures are non-fatal — the app still works online.
      });
      return;
    }

    // Development: remove any previously-installed worker and its caches.
    void (async () => {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    })();
  }, []);

  return null;
}
