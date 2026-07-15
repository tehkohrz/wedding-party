"use client";

/**
 * Decline confirmation — reached when EVERY member was marked "can't make
 * it" on the attendance step. A gentle double-check before the flow ends:
 * declines skip menu/after-party entirely (no food choices for people who
 * aren't coming).
 *
 * Stage 4 wires the actual submission; until then confirming just advances
 * to the declined-thanks screen.
 */
import { Button } from "@/components/ui/button";
import { useRsvpStore } from "@/lib/rsvpStore";
import { RSVP_STEPS_COPY } from "@/lib/content";

export function StepDeclineConfirm() {
  const goTo = useRsvpStore((s) => s.goTo);

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h2 className="font-display text-3xl">
          {RSVP_STEPS_COPY.declineHeading}
        </h2>
        <p className="font-sans text-sm text-muted-foreground max-w-md mx-auto">
          {RSVP_STEPS_COPY.declineBody}
        </p>
      </div>

      <div className="space-y-2 max-w-sm mx-auto">
        <Button
          onClick={() => goTo("declined-thanks", 1)}
          className="w-full h-13 rounded-pill text-base"
        >
          {RSVP_STEPS_COPY.declineConfirmLabel}
        </Button>
        <Button
          variant="ghost"
          onClick={() => goTo("attendance", -1)}
          className="w-full h-11 rounded-pill"
        >
          {RSVP_STEPS_COPY.declineBackLabel}
        </Button>
      </div>
    </div>
  );
}
