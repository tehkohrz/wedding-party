// Screen 4 — Lunch seating map.
// Placeholder; real map lands in Session 14.
import { ForwardLink } from "@/components/WizardShell";

export default function LunchPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1 className="font-display text-5xl">Lunch</h1>
      <p className="font-sans text-muted-foreground">Screen 4 placeholder</p>
      <ForwardLink
        href="/"
        className="inline-flex items-center bg-surface text-foreground border border-border rounded-pill px-6 py-3 font-sans font-medium hover:bg-muted transition"
      >
        Done
      </ForwardLink>
    </div>
  );
}
