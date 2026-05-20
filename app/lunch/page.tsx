"use client";

// Screen 3 (final) — Lunch seating map.
//
// "use client" + useRequireGuest: needs a selected guest. Reached either
// from /group (grouped guests) or straight from / (solo guests).

import { ForwardLink } from "@/components/WizardShell";
import { SeatingMap } from "@/components/SeatingMap";
import { useRequireGuest } from "@/hooks/useRequireGuest";

export default function LunchPage() {
  const guest = useRequireGuest();

  if (!guest) return null;

  const seatLabel = `Row ${guest.row}${
    guest.section ? `, Section ${guest.section}` : ""
  }, Seat ${guest.seat}`;

  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col">
      {/* Header — pt-20 clears the WizardShell Back/Home buttons */}
      <header className="shrink-0 px-6 pt-20 pb-4 text-center">
        <h1 className="font-display text-3xl">Your lunch seat</h1>
        <p className="font-sans text-muted-foreground mt-1">
          {guest.name} — {seatLabel}
        </p>
      </header>

      {/* The map — centered, scrolls if it overflows (zoom comes in S14) */}
      <main className="flex-1 overflow-auto grid place-items-center px-6 py-4">
        <SeatingMap
          highlight={{
            row: guest.row,
            section: guest.section,
            seat: guest.seat,
          }}
        />
      </main>

      {/* Footer — done */}
      <footer className="shrink-0 px-6 py-5">
        <div className="max-w-md mx-auto">
          <ForwardLink
            href="/"
            className="flex items-center justify-center bg-primary text-primary-foreground rounded-pill h-14 font-sans font-medium text-lg hover:opacity-90 transition"
          >
            Done
          </ForwardLink>
        </div>
      </footer>
    </div>
  );
}
