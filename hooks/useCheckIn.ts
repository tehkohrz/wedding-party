"use client";

/**
 * Checks in one round of guests and moves on to their lunch seats.
 *
 * The welcome screen (solo guests) and the group screen (Check-in button)
 * both call it, so a failed save behaves the same on each:
 *   - "saving": the write is in flight; further taps do nothing.
 *   - "failed": the write threw (WiFi drop, server error or timeout). The
 *     guest stays on the screen and the caller shows CHECKIN_COPY.saveFailed.
 *     Tapping again retries.
 * On success the round goes into the wizard store and the wizard moves to
 * /checkin/lunch. Status stays "saving" through the exit slide.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { markArrivedMany } from "@/lib/attendance";
import { useWizardStore } from "@/lib/store";

export type CheckInStatus = "idle" | "saving" | "failed";

export function useCheckIn() {
  const router = useRouter();
  const setDirection = useWizardStore((s) => s.setDirection);
  const setCheckedInThisRound = useWizardStore(
    (s) => s.setCheckedInThisRound
  );
  const [status, setStatus] = useState<CheckInStatus>("idle");

  async function checkIn(guestIds: number[]) {
    if (status === "saving") return;
    setStatus("saving");
    try {
      await markArrivedMany(guestIds);
    } catch {
      setStatus("failed");
      return;
    }
    setCheckedInThisRound(guestIds);
    setDirection("forward");
    router.push("/checkin/lunch");
  }

  /** Hides a failure message, e.g. once the guest edits their search. */
  function clearFailed() {
    setStatus((s) => (s === "failed" ? "idle" : s));
  }

  return { checkIn, status, clearFailed };
}
