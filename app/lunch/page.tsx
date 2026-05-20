"use client";

// Screen 3 (final) — Lunch seating map.
// Placeholder; real map lands in Session 14.
//
// "use client" + useRequireGuest: needs a selected guest. Reached either
// from /group (grouped guests) or straight from / (solo guests).

import { ForwardLink } from "@/components/WizardShell";
import { useRequireGuest } from "@/hooks/useRequireGuest";

export default function LunchPage() {
  const guest = useRequireGuest();

  if (!guest) return null;

  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col items-center justify-center gap-6">
      <h1 className="font-display text-5xl">Lunch</h1>
      <p className="font-sans text-muted-foreground">
        Screen 3 placeholder — seat for {guest.name}: Row {guest.row}
        {guest.section ? `, Section ${guest.section}` : ""}, Seat {guest.seat}
      </p>
      <ForwardLink
        href="/"
        className="inline-flex items-center bg-surface text-foreground border border-border rounded-pill px-6 py-3 font-sans font-medium hover:bg-muted transition"
      >
        Done
      </ForwardLink>
    </div>
  );
}
