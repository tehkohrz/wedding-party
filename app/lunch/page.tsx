"use client";

// Screen 3 (final) — Lunch seating map.
//
// "use client" + useRequireGuest: needs a selected guest. Reached either
// from /group (grouped guests) or straight from / (solo guests).
//
// Display rules (round-scoped):
//   - "This round" = the guests just checked in via this wizard flow
//     (tracked in lib/store as `checkedInThisRound`).
//   - Members in this round: fully-colored name box + solid colored seat
//     on the map + brief pulse animation.
//   - Members in the same group but NOT in this round (toggled off, or
//     checked in during a previous round): greyed name box and NO map
//     highlight — their seat blends with all the other unrelated seats.
//   - Solo guests see one colored box and one pulsing highlight.

import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ForwardLink } from "@/components/WizardShell";
import {
  SeatingMap,
  type SeatHighlight,
  type SeatRef,
} from "@/components/SeatingMap";
import { useRequireGuest } from "@/hooks/useRequireGuest";
import { useWizardStore } from "@/lib/store";
import { getMemberColorAssignments } from "@/lib/groups";
import { celebrate } from "@/lib/confetti";
import { LUNCH_COPY } from "@/lib/content";
import { cn } from "@/lib/utils";

export default function LunchPage() {
  const guest = useRequireGuest();
  const checkedInThisRound = useWizardStore((s) => s.checkedInThisRound);
  const reduceMotion = useReducedMotion();

  // Confetti fires once on arrival, and ONLY when someone actually checked
  // in this round. Browsing the map via /find never celebrates, and neither
  // does landing here with an empty round. celebrate() self-guards against
  // reduced-motion too.
  const didCheckIn = checkedInThisRound.length > 0;
  useEffect(() => {
    if (didCheckIn) celebrate();
  }, [didCheckIn]);

  if (!guest) return null;

  const thisRound = new Set(checkedInThisRound);

  // Stable color per member (current guest first, companions in CSV order).
  const assignments = getMemberColorAssignments(guest);
  const isGroup = assignments.length > 1;

  // Sort: this-round first (stable sort preserves CSV order within each
  // bucket).
  const sortedAssignments = [...assignments].sort((a, b) => {
    const aIn = thisRound.has(a.guest.id) ? 0 : 1;
    const bIn = thisRound.has(b.guest.id) ? 0 : 1;
    return aIn - bIn;
  });

  // EVERY group member's seat is highlighted on the map, but with two
  // different visual treatments:
  //   - This round → "arrived" state → solid bouquet color + pulse
  //   - Not this round (toggled off / previous round) → "pending" state →
  //     neutral grey treatment with a visible border, so the seat reads as
  //     "in your party" but distinct from unrelated seats AND from the
  //     people actively checking in.
  const highlights: SeatHighlight[] = assignments.map(({ guest: m, color }) => ({
    row: m.row,
    section: m.section,
    seat: m.seat,
    color,
    state: thisRound.has(m.id) ? ("arrived" as const) : ("pending" as const),
  }));

  // Only this-round members pulse.
  const pulseAt: SeatRef[] = assignments
    .filter(({ guest: m }) => thisRound.has(m.id))
    .map(({ guest: m }) => ({
      row: m.row,
      section: m.section,
      seat: m.seat,
    }));

  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col">
      {/* Header — pt-20 clears the WizardShell Back/Home buttons */}
      <header className="shrink-0 px-6 pt-20 pb-3 text-center">
        <h1 className="font-display text-3xl">
          {isGroup ? LUNCH_COPY.headingGroup : LUNCH_COPY.headingSolo}
        </h1>
      </header>

      {/* Name boxes — this-round first; in-round colored, others greyed */}
      <section className="shrink-0 px-6 pb-3">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-2">
          {sortedAssignments.map(({ guest: m, color }, i) => {
            const isInRound = thisRound.has(m.id);
            return (
              <motion.div
                key={m.id}
                // Boxes pop in, staggered — draws the eye to "here's your group".
                initial={reduceMotion ? false : { opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        duration: 0.3,
                        delay: 0.08 * i,
                        ease: [0.32, 0.72, 0, 1],
                      }
                }
                className={cn(
                  "rounded-card border px-4 py-2 flex items-center gap-3 transition-colors",
                  // Not in this round: standby (taupe) treatment — matches
                  // the seat's pending-state color so the name box and the
                  // map seat read as the same "in-group, on standby" pair.
                  !isInRound && "bg-standby/25 border-standby"
                )}
                style={
                  isInRound
                    ? {
                        backgroundColor: `hsl(var(--${color}) / 0.12)`,
                        borderColor: `hsl(var(--${color}))`,
                      }
                    : undefined
                }
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-3 rounded-full shrink-0",
                    !isInRound && "bg-standby"
                  )}
                  style={
                    isInRound
                      ? { backgroundColor: `hsl(var(--${color}))` }
                      : undefined
                  }
                />
                <span
                  className={cn(
                    "font-display text-base leading-none",
                    !isInRound && "text-foreground/70"
                  )}
                >
                  {m.name}
                </span>
                <span className="font-sans text-xs text-muted-foreground leading-none">
                  R{m.row}
                  {m.section ? m.section : ""} · Seat {m.seat}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Friendly seating note — only for groups */}
        {isGroup && (
          <p className="font-sans text-xs text-muted-foreground text-center mt-3 italic">
            {LUNCH_COPY.groupSeatingNote}
          </p>
        )}
      </section>

      {/* The map — only this-round members' seats are highlighted and pulse */}
      <main className="flex-1 overflow-hidden grid place-items-center px-6 py-2">
        <SeatingMap highlights={highlights} pulseAt={pulseAt} />
      </main>

      {/* Footer — done */}
      <footer className="shrink-0 px-6 py-5">
        <div className="max-w-md mx-auto">
          <ForwardLink
            href="/"
            className="flex items-center justify-center bg-primary text-primary-foreground rounded-pill h-14 font-sans font-medium text-lg hover:opacity-90 transition"
          >
            {LUNCH_COPY.doneLabel}
          </ForwardLink>
        </div>
      </footer>
    </div>
  );
}
