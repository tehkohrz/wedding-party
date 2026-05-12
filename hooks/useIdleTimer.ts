"use client";

/**
 * Fires `onIdle` after `timeoutMs` of no user activity.
 *
 * "Activity" = pointerdown / keydown / touchstart anywhere on the document.
 * Every event resets the timer. Returns nothing — purely effectful.
 *
 * Used by WizardShell to bounce the guest back to the welcome screen if
 * they walk away mid-check-in.
 */
import { useEffect, useRef } from "react";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "touchstart"] as const;

export function useIdleTimer(onIdle: () => void, timeoutMs: number) {
  // Keep the latest onIdle in a ref so the listeners don't need to re-attach
  // every time the callback identity changes.
  //
  // The ref is updated inside an effect, not during render, because React
  // may render a component without committing (Suspense rollback, Strict
  // Mode double-render, concurrent preemption). Writing to a ref during
  // render in those cases would leave the ref in a wrong-for-the-final-UI
  // state. Effects only run on committed renders, so updating here is safe.
  const callbackRef = useRef(onIdle);
  useEffect(() => {
    callbackRef.current = onIdle;
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    function reset() {
      clearTimeout(timer);
      timer = setTimeout(() => callbackRef.current(), timeoutMs);
    }

    reset(); // start the clock immediately

    for (const ev of ACTIVITY_EVENTS) {
      document.addEventListener(ev, reset, { passive: true });
    }

    return () => {
      clearTimeout(timer);
      for (const ev of ACTIVITY_EVENTS) {
        document.removeEventListener(ev, reset);
      }
    };
  }, [timeoutMs]);
}
