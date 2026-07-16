"use client";

/**
 * Seating plan / lookup mode.
 *
 * Search any guest, see where they (and their party) are seated. Pure
 * read-only — NO attendance writes. Reuses the same SeatingMap component
 * and color assignment as the lunch check-in screen, so when someone
 * looks up a friend who hasn't arrived yet, they see the same "pending"
 * outlined seat treatment.
 *
 * Reached from the small "Seating plan →" link bottom-right on Welcome.
 * Back/Home buttons + the WizardShell idle timer apply (it's in WIZARD_PATHS).
 */
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SeatingMap, type SeatHighlight } from "@/components/SeatingMap";
import { useGuestSearch } from "@/hooks/useGuestSearch";
import { useDbGuests } from "@/hooks/useDbGuests";
import { useAttendance } from "@/hooks/useAttendance";
import { getMemberColorAssignments } from "@/lib/groups";
import { LOOKUP_COPY } from "@/lib/content";
import { cn } from "@/lib/utils";
import type { Guest } from "@/lib/schema";

export default function FindPage() {
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState<Guest | null>(null);

  const allGuests = useDbGuests();
  const matches = useGuestSearch(query, allGuests);
  const arrived = useAttendance();
  const arrivedIds = new Set((arrived ?? []).map((r) => r.guest_id));

  // Typing a new query clears the currently-viewed guest so the results
  // come back into focus.
  function handleQueryChange(value: string) {
    setQuery(value);
    if (viewing) setViewing(null);
  }

  function handleSelectGuest(g: Guest) {
    setViewing(g);
    setQuery("");
  }

  // Color assignments for the viewed guest's group (current viewer first,
  // companions after). Same logic as the lunch screen — one color per
  // person, stable across screens. Members without an assigned seat (nullable
  // since v2 — seats are assigned after the RSVP deadline) can't be shown on
  // the map, so they're filtered from the highlights.
  const assignments = viewing
    ? getMemberColorAssignments(viewing, allGuests ?? [viewing])
    : [];
  const highlights: SeatHighlight[] = assignments
    .filter(({ guest: m }) => m.row !== null && m.seat !== null)
    .map(({ guest: m, color }) => ({
      row: m.row as number,
      section: m.section,
      seat: m.seat as number,
      color,
      state: arrivedIds.has(m.id) ? ("arrived" as const) : ("pending" as const),
    }));

  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col">
      {/* Header — pt-20 clears the WizardShell Back/Home buttons */}
      <header className="shrink-0 px-6 pt-20 pb-3 text-center">
        <h1 className="font-display text-3xl">{LOOKUP_COPY.heading}</h1>
        <p className="font-sans text-sm text-muted-foreground mt-1">
          {LOOKUP_COPY.subheading}
        </p>
      </header>

      {/* Search + results */}
      <section className="shrink-0 px-6 pb-3">
        <div className="max-w-md mx-auto space-y-3">
          <Input
            type="search"
            inputMode="text"
            autoComplete="off"
            autoFocus
            placeholder={LOOKUP_COPY.searchPlaceholder}
            className="text-lg h-14 rounded-pill text-center placeholder:transition-opacity placeholder:duration-150 focus:placeholder:opacity-0"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
          />
          {query.trim().length > 0 && (
            <div className="space-y-2" role="listbox">
              {matches.length > 0 ? (
                matches.map((g) => (
                  <Card
                    key={g.id}
                    role="option"
                    tabIndex={0}
                    onClick={() => handleSelectGuest(g)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectGuest(g);
                      }
                    }}
                    className="cursor-pointer px-5 py-3 hover:bg-muted active:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring transition"
                  >
                    <span className="font-display text-xl">{g.name}</span>
                  </Card>
                ))
              ) : (
                <p className="font-sans text-sm text-muted-foreground text-center">
                  {LOOKUP_COPY.noMatches}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Name boxes only appear once a guest is selected. The map below
          is ALWAYS shown — with no highlights at first, then highlights
          fill in when the user confirms a selection. */}
      {viewing && (
        <section className="shrink-0 px-6 pb-3">
          <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-2">
            {assignments.map(({ guest: m, color }) => {
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
        </section>
      )}

      <main className="flex-1 overflow-hidden grid place-items-center px-6 py-2">
        <SeatingMap highlights={highlights} />
      </main>
    </div>
  );
}
