"use client";

/**
 * Registers /sw.js on mount so the app installs its service worker.
 *
 * Renders nothing — it's a mount-effect only. Placed in the root layout so
 * every page triggers registration. The browser dedupes: registering an
 * already-active worker is a no-op.
 *
 * Service workers only run over HTTPS (or localhost), and only take effect
 * from a production build — so this does nothing meaningful in `pnpm dev`.
 */
import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failures are non-fatal — the app still works online.
    });
  }, []);

  return null;
}
