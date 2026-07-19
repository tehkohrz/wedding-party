"use client";

/**
 * RSVP step 4 of 4 — summary + the ONE atomic submit.
 *
 * POSTs the whole group's answers to /api/rsvp/[slug] in a single request;
 * nothing was written to the database before this moment. On success:
 * confetti + thanks. On failure: inline error, draft intact, retry.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SummaryList } from "./SummaryList";
import { useRsvpStore, EMPTY_ANSWER } from "@/lib/rsvpStore";
import { RSVP_CONFIRM } from "@/lib/content";
import { celebrate } from "@/lib/confetti";
import type { RsvpMember } from "./types";

export function StepConfirm({
  slug,
  members,
  onSubmitted,
}: {
  slug: string;
  members: RsvpMember[];
  onSubmitted: () => void;
}) {
  const answers = useRsvpStore((s) => s.answers);
  const goTo = useRsvpStore((s) => s.goTo);
  const markSubmitted = useRsvpStore((s) => s.markSubmitted);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setError(false);
    try {
      const payload = {
        answers: members.map((m) => {
          const a = answers[m.id] ?? EMPTY_ANSWER;
          // "NO_MEAL" is client-side only; the database stores null
          // (kid attending, no meal needed).
          const food = a.food === "NO_MEAL" ? null : a.food;
          return {
            guest_id: m.id,
            attending: a.attending === true,
            food_choice: a.attending ? food : null,
            dietary_comment: a.attending && a.comment ? a.comment : null,
            after_party: a.attending ? a.afterParty : null,
            baby_seat: m.is_kid && a.attending ? a.babySeat : null,
            // Plus-ones: send the typed name only — left blank, the DB
            // keeps its placeholder (which the UI never displays).
            ...(m.is_plus_one && (a.name ?? "").trim()
              ? { name: (a.name ?? "").trim() }
              : {}),
          };
        }),
      };
      const res = await fetch(`/api/rsvp/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      markSubmitted();
      onSubmitted();
      celebrate();
      goTo("thanks", 1);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-display font-bold text-3xl">{RSVP_CONFIRM.heading}</h2>
        <p className="font-sans text-sm text-muted-foreground">
          {RSVP_CONFIRM.instruction}
        </p>
      </div>

      <SummaryList members={members} />

      {error && (
        <p className="font-sans text-sm text-destructive text-center">
          {RSVP_CONFIRM.submitError}
        </p>
      )}

      <div className="space-y-2">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-13 rounded-pill text-base"
        >
          {submitting ? "Sending…" : RSVP_CONFIRM.submitLabel}
        </Button>
        <Button
          variant="ghost"
          onClick={() =>
            goTo(
              members.some(
                (m) =>
                  m.after_party_invited === true &&
                  answers[m.id]?.attending === true
              )
                ? "afterparty"
                : "menu",
              -1
            )
          }
          disabled={submitting}
          className="w-full h-11 rounded-pill"
        >
          {RSVP_CONFIRM.backLabel}
        </Button>
      </div>
    </div>
  );
}
