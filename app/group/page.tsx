"use client";

// Screen 2 — Group attendance toggles.
// Placeholder; real UI lands in Session 11.
//
// "use client" + useRequireGuest: this screen needs a selected guest in
// the wizard store. Direct URL hits / refreshes get bounced back to /.

import { ForwardLink } from "@/components/WizardShell";
import { useRequireGuest } from "@/hooks/useRequireGuest";

export default function GroupPage() {
  const guest = useRequireGuest();

  // During the redirect tick (no guest), render nothing.
  if (!guest) return null;

  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col items-center justify-center gap-6">
      <h1 className="font-display text-5xl">Group</h1>
      <p className="font-sans text-muted-foreground">
        Screen 2 placeholder — checking in with {guest.name}
      </p>
      <ForwardLink
        href="/lunch"
        className="inline-flex items-center bg-primary text-primary-foreground rounded-pill px-6 py-3 font-sans font-medium hover:opacity-90 transition"
      >
        Next: Lunch seating →
      </ForwardLink>
    </div>
  );
}
