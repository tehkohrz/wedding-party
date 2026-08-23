"use client";

/**
 * Polling / retry scheduler for the day-of screens.
 *
 * Written after a multi-hour Supabase outage, during which the two hooks
 * that talk to /api each turned into an error loop:
 *
 *   - useAttendance used setInterval(4s). Every request hung ~20s waiting
 *     on the dead database, so ticks fired while earlier ones were still
 *     open and in-flight requests STACKED rather than queued.
 *   - useDbGuests retried on a flat 5s timer, forever, with no ceiling.
 *
 * One open kiosk tab was therefore issuing ~27 database-touching requests
 * a minute, indefinitely — enough for Supabase to flag the project.
 *
 * The guarantees here:
 *   1. NEVER overlapping — the next run is scheduled only after the
 *      previous one settles (a setTimeout chain, not setInterval).
 *   2. Every attempt is aborted after `timeoutMs`, so one hung request
 *      can't stall the chain forever.
 *   3. Failures back off exponentially with jitter, up to `maxDelayMs`.
 *      Jitter matters: several kiosks that started together would
 *      otherwise retry in lockstep and arrive as a burst.
 *   4. Nothing runs while the tab is hidden — a forgotten background tab
 *      costs nothing — and it refreshes the moment it's looked at again.
 *   5. A success resets the backoff, so recovery is immediate.
 *
 * `load` should THROW to signal failure. Omit `intervalMs` for a
 * load-once-and-retry-until-it-works resource; pass it to keep polling.
 */
import { useCallback, useEffect, useRef } from "react";

export interface BackoffPollOptions {
  /** Gap between successful runs. Omit to stop after the first success. */
  intervalMs?: number;
  /** Abort a single attempt after this long. */
  timeoutMs?: number;
  /** Delay after the first failure; doubles from there. */
  baseDelayMs?: number;
  /** Ceiling for the backoff. */
  maxDelayMs?: number;
  /** Skip work while document.hidden (default true). */
  pauseWhenHidden?: boolean;
}

/** Exponential with ±25% jitter, capped. */
function backoffDelay(failures: number, base: number, max: number): number {
  const exponential = Math.min(base * 2 ** (failures - 1), max);
  return Math.round(exponential * (0.75 + Math.random() * 0.5));
}

export function useBackoffPoll(
  load: (signal: AbortSignal) => Promise<void>,
  {
    intervalMs,
    timeoutMs = 10_000,
    baseDelayMs = 5_000,
    maxDelayMs = 60_000,
    pauseWhenHidden = true,
  }: BackoffPollOptions = {},
): { refresh: () => void } {
  // `load` may be redefined every render; keep the effect stable by reading
  // it through a ref rather than listing it as a dependency. The ref is
  // updated in an effect, never during render.
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  }, [load]);
  const refreshRef = useRef<() => void>(() => {});

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let inFlight = false;
    let failures = 0;
    let settled = false; // load-once mode: succeeded, nothing more to do

    const clear = () => {
      if (timer) clearTimeout(timer);
      timer = undefined;
    };

    const schedule = (ms: number) => {
      clear();
      if (alive && !settled) timer = setTimeout(run, ms);
    };

    async function run(): Promise<void> {
      if (!alive || settled || inFlight) return;
      // Hidden tab: don't schedule anything. The visibilitychange handler
      // restarts the chain when the tab comes back.
      if (pauseWhenHidden && document.hidden) return;

      inFlight = true;
      const controller = new AbortController();
      const abortTimer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        await loadRef.current(controller.signal);
        if (!alive) return;
        failures = 0;
        if (intervalMs === undefined) {
          settled = true;
          clear();
        } else {
          schedule(intervalMs);
        }
      } catch {
        if (!alive) return;
        failures += 1;
        schedule(backoffDelay(failures, baseDelayMs, maxDelayMs));
      } finally {
        clearTimeout(abortTimer);
        inFlight = false;
      }
    }

    // An outside trigger (e.g. this device just wrote an arrival) should
    // refresh now and forgive any accumulated backoff.
    refreshRef.current = () => {
      failures = 0;
      schedule(0);
    };

    const onVisibility = () => {
      if (!document.hidden) refreshRef.current();
    };
    if (pauseWhenHidden) {
      document.addEventListener("visibilitychange", onVisibility);
    }

    void run();

    return () => {
      alive = false;
      clear();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs, timeoutMs, baseDelayMs, maxDelayMs, pauseWhenHidden]);

  return { refresh: useCallback(() => refreshRef.current(), []) };
}
