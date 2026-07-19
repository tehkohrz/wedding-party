"use client";

/**
 * Live countdown to the event — three tiles (days / hours / mins).
 * Sits under the date on the RSVP pages.
 *
 * Hydration note: the server can't know the client's "now", so rendering
 * real numbers during SSR would mismatch the first client render (React
 * hydration error). Standard fix: render em-dash placeholders until the
 * component has mounted in the browser, then start ticking.
 *
 * Once the moment passes, the tiles are replaced with
 * EVENT_DETAILS.countdownDoneLabel.
 */
import { useEffect, useState } from "react";
import { EVENT_DETAILS } from "@/lib/content";

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function remainingUntil(targetMs: number): Remaining | null {
  const diff = targetMs - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1_000) % 60,
  };
}

export function EventCountdown() {
  const targetMs = new Date(EVENT_DETAILS.eventStartISO).getTime();

  // null = not mounted yet (SSR + first client render → placeholders).
  const [remaining, setRemaining] = useState<Remaining | null | "done">(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => setRemaining(remainingUntil(targetMs) ?? "done");
    tick();
    // No seconds tile — a 15s tick keeps the minutes fresh enough.
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, [targetMs]);

  if (mounted && remaining === "done") {
    return (
      <p className="font-display text-xl text-primary">
        {EVENT_DETAILS.countdownDoneLabel}
      </p>
    );
  }

  const r = mounted && remaining !== "done" ? remaining : null;
  const tiles: Array<{ value: string; label: string }> = [
    { value: fmt(r?.days), label: "days" },
    { value: fmt(r?.hours), label: "hours" },
    { value: fmt(r?.minutes), label: "mins" },
  ];

  return (
    <div
      className="flex items-start justify-center gap-3"
      role="timer"
      aria-label="Countdown to the wedding"
    >
      {tiles.map((t) => (
        <div
          key={t.label}
          className="flex flex-col items-center rounded-card bg-muted/60 px-3 py-2 min-w-[3.75rem] sm:px-6 sm:py-4 sm:min-w-[6rem]"
        >
          <span className="font-display text-2xl sm:text-5xl leading-none tabular-nums">
            {t.value}
          </span>
          <span className="font-sans text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground mt-1 sm:mt-1.5">
            {t.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function fmt(n: number | null | undefined): string {
  return n === null || n === undefined ? "—" : String(n).padStart(2, "0");
}
