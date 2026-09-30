"use client";

// Screen 3 (final) — Lunch seating map.
//
// "use client" + useRequireGuest: needs a selected guest. Reached either
// from /group (grouped guests) or straight from / (solo guests).
//
// Display rules:
//   - Colour means "has arrived", whether this round or an earlier one.
//     Arrived members get a coloured name box and a solid coloured seat.
//   - "This round" = the guests just checked in via this wizard flow
//     (tracked in lib/store as `checkedInThisRound`). Only their seats pulse.
//   - Members not here yet (toggled off) get the standby taupe box and seat.
//   - Every member's name sits beside their seat on the map.

import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ForwardLink } from "@/components/WizardShell";
import { SeatingMap, type SeatHighlight } from "@/components/SeatingMap";
import { seatOf, tableName, type SeatRef } from "@/lib/floorPlan";
import { useRequireGuest } from "@/hooks/useRequireGuest";
import { useDbGuests } from "@/hooks/useDbGuests";
import { useAttendance } from "@/hooks/useAttendance";
import { useWizardStore } from "@/lib/store";
import { getMemberColorAssignments } from "@/lib/groups";
import { celebrate } from "@/lib/confetti";
import { LUNCH_COPY } from "@/lib/content";
import { cn } from "@/lib/utils";

export default function LunchPage() {
  const guest = useRequireGuest();
  const allGuests = useDbGuests();
  const checkedInThisRound = useWizardStore((s) => s.checkedInThisRound);
  const arrived = useAttendance();
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
  const arrivedIds = new Set((arrived ?? []).map((r) => r.guest_id));
  // This round counts before the attendance poll catches up with it.
  const hasArrived = (id: number) => thisRound.has(id) || arrivedIds.has(id);

  // Stable color per member (current guest first, companions in CSV order).
  const assignments = getMemberColorAssignments(guest, allGuests ?? [guest]);
  const isGroup = assignments.length > 1;

  // Sort: this-round first (stable sort preserves CSV order within each
  // bucket).
  const sortedAssignments = [...assignments].sort((a, b) => {
    const aIn = thisRound.has(a.guest.id) ? 0 : 1;
    const bIn = thisRound.has(b.guest.id) ? 0 : 1;
    return aIn - bIn;
  });

  // Members without a seat on the plan can't be shown on the map. Every
  // attending guest has one, so this filter is a no-op on the day.
  const seated = assignments.flatMap(({ guest: m, color }) => {
    const seat = seatOf(m);
    return seat ? [{ m, color, seat }] : [];
  });

  const highlights: SeatHighlight[] = seated.map(({ m, color, seat }) => ({
    seat,
    name: m.name,
    color,
    state: hasArrived(m.id) ? ("arrived" as const) : ("pending" as const),
  }));

  // Only this-round members pulse.
  const pulseAt: SeatRef[] = seated
    .filter(({ m }) => thisRound.has(m.id))
    .map(({ seat }) => seat);

  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col">
      {/* Header — pt-20 clears the WizardShell Back/Home buttons */}
      <header className="shrink-0 px-6 pt-20 pb-3 text-center">
        <h1 className="font-display text-3xl">
          {isGroup ? LUNCH_COPY.headingGroup : LUNCH_COPY.headingSolo}
        </h1>
      </header>

      {/* Name boxes — this round first; arrived colored, others on standby */}
      <section className="shrink-0 px-6 pb-3">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-2">
          {sortedAssignments.map(({ guest: m, color }, i) => {
            const isHere = hasArrived(m.id);
            const seat = seatOf(m);
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
                  // Not here yet: standby (taupe) treatment — matches the
                  // seat's pending-state color so the name box and the map
                  // seat read as the same "in-group, on standby" pair.
                  !isHere && "bg-standby/25 border-standby"
                )}
                style={
                  isHere
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
                    !isHere && "bg-standby"
                  )}
                  style={
                    isHere
                      ? { backgroundColor: `hsl(var(--${color}))` }
                      : undefined
                  }
                />
                <span
                  className={cn(
                    "font-display text-base leading-none",
                    !isHere && "text-foreground/70"
                  )}
                >
                  {m.name}
                </span>
                {seat && (
                  <span className="font-sans text-xs text-muted-foreground leading-none">
                    {tableName(seat.table)}
                  </span>
                )}
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
      {/* The plan keeps a minimum width, so on phones it scrolls sideways
          instead of shrinking past legibility. On tablets it fits. */}
      <main className="flex-1 min-h-0 overflow-auto px-6 py-2">
        <SeatingMap
          highlights={highlights}
          pulseAt={pulseAt}
          className="h-full w-full min-w-[720px]"
        />
      </main>

      {/* Footer — done */}
      <footer className="shrink-0 px-6 py-5">
        <div className="max-w-md mx-auto">
          <ForwardLink
            href="/checkin"
            className="flex items-center justify-center bg-primary text-primary-foreground rounded-pill h-14 font-sans font-medium text-lg hover:opacity-90 transition"
          >
            {LUNCH_COPY.doneLabel}
          </ForwardLink>
        </div>
      </footer>
    </div>
  );
}
