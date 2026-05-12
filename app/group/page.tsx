// Screen 2 — Group attendance toggles.
// Placeholder; real UI lands in Session 11.
import { ForwardLink } from "@/components/WizardShell";

export default function GroupPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1 className="font-display text-5xl">Group</h1>
      <p className="font-sans text-muted-foreground">Screen 2 placeholder</p>
      <ForwardLink
        href="/solemnization"
        className="inline-flex items-center bg-primary text-primary-foreground rounded-pill px-6 py-3 font-sans font-medium hover:opacity-90 transition"
      >
        Next →
      </ForwardLink>
    </div>
  );
}
