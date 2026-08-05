"use client";

/**
 * The one navigation row every RSVP step ends with.
 *
 * Two stacked full-width pills gave Back the same visual weight as
 * Continue and ate the bottom of every screen. This is a single row: a
 * square icon-only Back on the left, and a wide forward button that NAMES
 * ITS DESTINATION ("Menu →", "After-party →") rather than saying
 * "Continue", so the button doubles as wayfinding and reinforces the
 * progress pills above. Same shape on phone and desktop; the forward
 * target stays thumb-sized.
 *
 * The forward button uses the invitation's stripe blue, like the RSVP
 * call to action, so every primary action in the flow matches.
 */
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StepNav({
  onBack,
  backLabel,
  onForward,
  forwardLabel,
  forwardDisabled = false,
  showForwardChevron = true,
}: {
  onBack: () => void;
  /** Read by screen readers and shown on hover — the icon has no text. */
  backLabel: string;
  onForward: () => void;
  forwardLabel: string;
  forwardDisabled?: boolean;
  /** Off for terminal actions (submitting) — nothing comes after them. */
  showForwardChevron?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Button
        variant="outline"
        onClick={onBack}
        aria-label={backLabel}
        title={backLabel}
        className="h-13 w-13 shrink-0 rounded-pill p-0"
      >
        <ChevronLeft className="size-5" />
      </Button>

      <Button
        onClick={onForward}
        disabled={forwardDisabled}
        className="btn-invite-blue h-13 flex-1 rounded-pill font-display font-bold uppercase tracking-[0.2em] text-sm sm:text-base"
      >
        {forwardLabel}
        {showForwardChevron && <ChevronRight className="size-5" />}
      </Button>
    </div>
  );
}
