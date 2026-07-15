"use client";

/**
 * Temporary stand-in for steps that arrive in later stages:
 *   menu (Stage 3) · afterparty, confirm, thanks (Stage 4)
 * Lets the Stage-2 flow be walked end to end with visible seams.
 */
import { Button } from "@/components/ui/button";
import { useRsvpStore, type RsvpStep } from "@/lib/rsvpStore";

const COMING: Partial<Record<RsvpStep, string>> = {
  menu: "Menu & food choices — coming in Stage 3",
  afterparty: "After-party — coming in Stage 4",
  confirm: "Summary & confirm — coming in Stage 4",
  thanks: "Thank you — coming in Stage 4",
};

export function StepPlaceholder({ step }: { step: RsvpStep }) {
  const goTo = useRsvpStore((s) => s.goTo);

  return (
    <div className="space-y-6 text-center py-10">
      <p className="font-sans text-sm text-muted-foreground">
        {COMING[step] ?? step}
      </p>
      <Button
        variant="ghost"
        onClick={() => goTo("attendance", -1)}
        className="rounded-pill"
      >
        ← Back to your party
      </Button>
    </div>
  );
}
