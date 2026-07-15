"use client";

/**
 * Decline confirmation — reached when EVERY member was marked "regretfully
 * decline" on the attendance step. A gentle double-check, and then the
 * decline is SUBMITTED (a whole-party "no" is a real response — the same
 * atomic POST as the happy path, with attending:false for everyone and no
 * food/after-party fields).
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRsvpStore } from "@/lib/rsvpStore";
import { RSVP_STEPS_COPY, RSVP_CONFIRM } from "@/lib/content";
import type { RsvpMember } from "./types";

export function StepDeclineConfirm({
  slug,
  members,
}: {
  slug: string;
  members: RsvpMember[];
}) {
  const goTo = useRsvpStore((s) => s.goTo);
  const markSubmitted = useRsvpStore((s) => s.markSubmitted);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    setError(false);
    try {
      const res = await fetch(`/api/rsvp/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: members.map((m) => ({
            guest_id: m.id,
            attending: false,
            food_choice: null,
            dietary_comment: null,
            after_party: null,
          })),
        }),
      });
      if (!res.ok) throw new Error();
      markSubmitted();
      goTo("declined-thanks", 1);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

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

      {error && (
        <p className="font-sans text-sm text-destructive">
          {RSVP_CONFIRM.submitError}
        </p>
      )}

      <div className="space-y-2 max-w-sm mx-auto">
        <Button
          onClick={handleConfirm}
          disabled={submitting}
          className="w-full h-13 rounded-pill text-base"
        >
          {submitting ? "Sending…" : RSVP_STEPS_COPY.declineConfirmLabel}
        </Button>
        <Button
          variant="ghost"
          onClick={() => goTo("attendance", -1)}
          disabled={submitting}
          className="w-full h-11 rounded-pill"
        >
          {RSVP_STEPS_COPY.declineBackLabel}
        </Button>
      </div>
    </div>
  );
}
