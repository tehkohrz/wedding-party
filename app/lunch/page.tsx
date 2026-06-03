"use client";

// Screen 3 (final) — Lunch seating map.
//
// "use client" + useRequireGuest: needs a selected guest. Reached either
// from /group (grouped guests) or straight from / (solo guests).
//
// Display rules:
//   - Arrived members: fully-colored name box + solid colored seat on the map.
//   - Group members not yet checked in: greyed name box + a "pending" seat
//     (colored outline + light tint) so the seat is still identifiable but
//     visually distinct from arrived seats.
//   - Name boxes are ordered: arrived first, not-arrived after.

import { useLiveQuery } from "dexie-react-hooks";
import { ForwardLink } from "@/components/WizardShell";
import { SeatingMap, type SeatHighlight } from "@/components/SeatingMap";
import { useRequireGuest } from "@/hooks/useRequireGuest";
import { db } from "@/lib/attendance";
import { getMemberColorAssignments } from "@/lib/groups";
import { LUNCH_COPY } from "@/lib/content";
import { cn } from "@/lib/utils";

export default function LunchPage() {
  const guest = useRequireGuest();

  // Live attendance — undefined on first render, then the rows.
  const arrived = useLiveQuery(() => db.attendance.toArray());
  const arrivedIds = new Set((arrived ?? []).map((r) => r.guest_id));

  if (!guest) return null;

  // Stable color per member (current guest first, companions in CSV order).
  const assignments = getMemberColorAssignments(guest);
  const isGroup = assignments.length > 1;

  // Sort: arrived first (preserving original order within each bucket).
  // Modern Array.sort is stable, so members stay in CSV order within
  // arrived / not-arrived sub-lists.
  const sortedAssignments = [...assignments].sort((a, b) => {
    const aArrived = arrivedIds.has(a.guest.id) ? 0 : 1;
    const bArrived = arrivedIds.has(b.guest.id) ? 0 : 1;
    return aArrived - bArrived;
  });

  // EVERY group member's seat is highlighted — state distinguishes arrived
  // vs pending. The map renders them differently (solid vs outlined).
  const highlights: SeatHighlight[] = assignments.map(({ guest: m, color }) => ({
    row: m.row,
    section: m.section,
    seat: m.seat,
    color,
    state: arrivedIds.has(m.id) ? "arrived" : "pending",
  }));

  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col">
      {/* Header — pt-20 clears the WizardShell Back/Home buttons */}
      <header className="shrink-0 px-6 pt-20 pb-3 text-center">
        <h1 className="font-display text-3xl">
          {isGroup ? LUNCH_COPY.headingGroup : LUNCH_COPY.headingSolo}
        </h1>
      </header>

      {/* Name boxes — arrived first; arrived in color, others greyed */}
      <section className="shrink-0 px-6 pb-3">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-2">
          {sortedAssignments.map(({ guest: m, color }) => {
            const isArrived = arrivedIds.has(m.id);
            return (
              <div
                key={m.id}
                className={cn(
                  "rounded-card border px-4 py-2 flex items-center gap-3 transition-colors",
                  !isArrived && "bg-muted/40 border-border opacity-60"
                )}
                style={
                  isArrived
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
                    !isArrived && "bg-muted-foreground/30"
                  )}
                  style={
                    isArrived
                      ? { backgroundColor: `hsl(var(--${color}))` }
                      : undefined
                  }
                />
                <span
                  className={cn(
                    "font-display text-base leading-none",
                    !isArrived && "text-muted-foreground"
                  )}
                >
                  {m.name}
                </span>
                <span className="font-sans text-xs text-muted-foreground leading-none">
                  R{m.row}
                  {m.section ? m.section : ""} · Seat {m.seat}
                </span>
              </div>
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

      {/* The map — every group member's seat is highlighted (arrived solid,
          pending outlined) */}
      <main className="flex-1 overflow-auto grid place-items-center px-6 py-2">
        <SeatingMap highlights={highlights} />
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
