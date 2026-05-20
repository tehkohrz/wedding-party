"use client";

/**
 * Wizard route guard.
 *
 * The inner wizard screens (/group, /lunch) only make sense when a guest
 * has been selected on the welcome screen. That selection lives in the
 * Zustand store, which is in-memory — so it's gone if someone:
 *   - opens /group or /lunch directly by URL
 *   - refreshes the page mid-wizard
 *
 * In those cases there's no guest to show. This hook redirects back to
 * the welcome screen. Uses router.replace (not push) so the broken URL
 * doesn't land in history — pressing Back later won't return to it.
 *
 * Returns the current guest (or null during the redirect tick) so the
 * calling screen can render real content once it's confirmed present.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/store";
import type { Guest } from "@/lib/schema";

export function useRequireGuest(): Guest | null {
  const router = useRouter();
  const currentGuest = useWizardStore((s) => s.currentGuest);

  useEffect(() => {
    if (!currentGuest) {
      router.replace("/");
    }
  }, [currentGuest, router]);

  return currentGuest;
}
