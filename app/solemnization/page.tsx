// Screen 3 — Solemnization seating map.
// Placeholder; real map lands in Sessions 12 & 13.
import { ForwardLink } from "@/components/WizardShell";

export default function SolemnizationPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1 className="font-display text-5xl">Solemnization</h1>
      <p className="font-sans text-muted-foreground">Screen 3 placeholder</p>
      <ForwardLink
        href="/lunch"
        className="inline-flex items-center bg-primary text-primary-foreground rounded-pill px-6 py-3 font-sans font-medium hover:opacity-90 transition"
      >
        Next: Lunch seating →
      </ForwardLink>
    </div>
  );
}
