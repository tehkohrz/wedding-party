"use client";

/**
 * Live API data shared by every screen that reads it.
 *
 * A resource (the guest list, the arrivals) has ONE poller and one cached
 * value, however many components read it. The value stays in memory while
 * the wizard moves between screens, so the next screen renders at once
 * instead of refetching and waiting.
 *
 * The poller keeps the guarantees written after a Supabase outage, when
 * setInterval polling stacked hung requests and one kiosk tab sent ~27
 * database requests a minute:
 *   1. NEVER overlapping — the next run is scheduled only after the
 *      previous one settles (a setTimeout chain, not setInterval).
 *   2. Every attempt is aborted after `timeoutMs`.
 *   3. Failures back off exponentially with jitter, up to `maxDelayMs`.
 *   4. Nothing runs while the tab is hidden, and it refreshes the moment
 *      the tab is looked at again.
 *   5. A success resets the backoff.
 *
 * The poller runs while at least one component reads the resource. It
 * stops after a short grace period once none do, which spans the moment
 * between one screen unmounting and the next mounting.
 */
import { useSyncExternalStore } from "react";

export interface PollOptions {
  /** Gap between successful runs. */
  intervalMs: number;
  /** Abort a single attempt after this long. */
  timeoutMs?: number;
  /** Delay after the first failure; doubles from there. */
  baseDelayMs?: number;
  /** Ceiling for the backoff. */
  maxDelayMs?: number;
}

export interface LiveResource<T> {
  subscribe: (listener: () => void) => () => void;
  get: () => T | undefined;
  /** Fetch now and forgive any backoff, e.g. after this device writes. */
  refresh: () => void;
}

const IDLE_GRACE_MS = 5_000;

/** Exponential with ±25% jitter, capped. */
function backoffDelay(failures: number, base: number, max: number): number {
  const exponential = Math.min(base * 2 ** (failures - 1), max);
  return Math.round(exponential * (0.75 + Math.random() * 0.5));
}

function startPoll(
  run: (signal: AbortSignal) => Promise<void>,
  { intervalMs, timeoutMs, baseDelayMs, maxDelayMs }: Required<PollOptions>,
) {
  let alive = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let inFlight = false;
  let rerun = false; // a refresh arrived mid-flight
  let failures = 0;

  const schedule = (ms: number) => {
    clearTimeout(timer);
    if (alive) timer = setTimeout(tick, ms);
  };

  async function tick(): Promise<void> {
    if (!alive || inFlight) return;
    // Hidden tab: stop the chain. The visibility handler restarts it.
    if (document.hidden) return;

    inFlight = true;
    const controller = new AbortController();
    const abortTimer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      await run(controller.signal);
      failures = 0;
      schedule(intervalMs);
    } catch {
      failures += 1;
      schedule(backoffDelay(failures, baseDelayMs, maxDelayMs));
    } finally {
      clearTimeout(abortTimer);
      inFlight = false;
      if (rerun) {
        rerun = false;
        schedule(0);
      }
    }
  }

  const refresh = () => {
    failures = 0;
    if (inFlight) rerun = true;
    else schedule(0);
  };
  const onVisibility = () => {
    if (!document.hidden) refresh();
  };
  document.addEventListener("visibilitychange", onVisibility);
  void tick();

  return {
    refresh,
    stop: () => {
      alive = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}

/** `fetcher` should THROW to signal failure, so the poller backs off. */
export function liveResource<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  { timeoutMs = 10_000, baseDelayMs = 5_000, maxDelayMs = 60_000, intervalMs }: PollOptions,
): LiveResource<T> {
  let value: T | undefined;
  const listeners = new Set<() => void>();
  let poll: ReturnType<typeof startPoll> | null = null;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;

  return {
    subscribe(listener) {
      listeners.add(listener);
      clearTimeout(idleTimer);
      poll ??= startPoll(
        async (signal) => {
          value = await fetcher(signal);
          listeners.forEach((notify) => notify());
        },
        { intervalMs, timeoutMs, baseDelayMs, maxDelayMs },
      );
      return () => {
        listeners.delete(listener);
        if (listeners.size > 0) return;
        idleTimer = setTimeout(() => {
          poll?.stop();
          poll = null;
        }, IDLE_GRACE_MS);
      };
    },
    get: () => value,
    refresh: () => poll?.refresh(),
  };
}

const noServerValue = () => undefined;

/** Read a live resource. undefined until its first fetch lands. */
export function useLiveResource<T>(resource: LiveResource<T>): T | undefined {
  return useSyncExternalStore(resource.subscribe, resource.get, noServerValue);
}
