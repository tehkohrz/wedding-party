"use client";

/**
 * RSVP step 1 of 4 — who's attending?
 *
 * Event details + schedule up top, then one bouquet-colored row per group
 * member with an explicit yes/no choice (adapted from the check-in
 * GroupCheckin pattern, but two-state instead of a single toggle — food
 * counts need a definite answer for every person).
 *
 * Continue is enabled once EVERYONE has an answer:
 *   - anyone attending  → menu step
 *   - all declining     → decline-confirm step (skips menu/after-party)
 */
import { Check, X } from "lucide-react";
import { ChoiceChip } from "./ChoiceChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRsvpStore, EMPTY_ANSWER } from "@/lib/rsvpStore";
import { RSVP_STEPS_COPY } from "@/lib/content";
import { ScheduleBlock } from "@/components/ScheduleBlock";
import { BOUQUET_COLORS } from "@/lib/groups";
import type { RsvpMember } from "./types";

export function StepAttendance({ members }: { members: RsvpMember[] }) {
  const answers = useRsvpStore((s) => s.answers);
  const setAttending = useRsvpStore((s) => s.setAttending);
  const setName = useRsvpStore((s) => s.setName);
  const goTo = useRsvpStore((s) => s.goTo);

  const allAnswered = members.every(
    (m) => (answers[m.id] ?? EMPTY_ANSWER).attending !== null
  );
  const anyAttending = members.some(
    (m) => (answers[m.id] ?? EMPTY_ANSWER).attending === true
  );

  function handleContinue() {
    goTo(anyAttending ? "menu" : "decline-confirm", 1);
  }

  return (
    <div className="space-y-6">
      {/* Schedule — same styling as the landing page (shared component),
          no maps link here (the intro view carries the full location).
          Hidden on phones: the party list is the point of this screen,
          and the intro one tap away still carries the full schedule. */}
      <div className="hidden sm:block">
        <ScheduleBlock />
      </div>

      {/* Heading */}
      <div className="text-center space-y-1">
        <h2 className="font-display font-bold text-3xl">
          {RSVP_STEPS_COPY.attendanceHeading}
        </h2>
        <p className="font-sans text-sm text-muted-foreground">
          {RSVP_STEPS_COPY.attendanceInstruction}
        </p>
      </div>

      {/* Member rows */}
      <div className="space-y-2">
        {members.map((m, i) => {
          const color = BOUQUET_COLORS[i % BOUQUET_COLORS.length];
          // The "attending" chip highlights in the bouquet palette walked in
          // REVERSE, so the chip accent differs from the member's row color
          // (row 0 = lavender row / peach chip, row 1 = rose row / sky chip …).
          const chipColor =
            BOUQUET_COLORS[
              BOUQUET_COLORS.length - 1 - (i % BOUQUET_COLORS.length)
            ];
          const answer = answers[m.id] ?? EMPTY_ANSWER;
          const attending = answer.attending;
          return (
            <div
              key={m.id}
              className="rounded-card border px-4 py-3 space-y-2 transition-colors"
              style={{
                borderColor: `hsl(var(--${color}))`,
                backgroundColor:
                  attending === null
                    ? undefined
                    : `hsl(var(--${color}) / 0.10)`,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: `hsl(var(--${color}))` }}
                />
                <span className="font-display text-2xl leading-none">
                  {/* Plus-one rows ask a question instead of naming the
                      placeholder ("Peter's Plus One"). */}
                  {m.is_plus_one ? RSVP_STEPS_COPY.plusOneQuestion : m.name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ChoiceChip
                  selected={attending === true}
                  onSelect={() => setAttending(m.id, true)}
                  icon={<Check className="size-4" />}
                  label={
                    m.is_plus_one
                      ? RSVP_STEPS_COPY.plusOneYesLabel
                      : RSVP_STEPS_COPY.attendingLabel
                  }
                  accentColor={chipColor}
                />
                <ChoiceChip
                  selected={attending === false}
                  onSelect={() => setAttending(m.id, false)}
                  icon={<X className="size-4" />}
                  label={
                    m.is_plus_one
                      ? RSVP_STEPS_COPY.plusOneNoLabel
                      : RSVP_STEPS_COPY.decliningLabel
                  }
                  muted
                />
              </div>
              {/* A coming plus-one can be given their real name (optional —
                  leaving it keeps the placeholder from the guest list). */}
              {m.is_plus_one && attending === true && (
                <label className="block space-y-1 pt-1">
                  <span className="font-sans text-xs text-muted-foreground">
                    {RSVP_STEPS_COPY.plusOneNameLabel}
                  </span>
                  <Input
                    value={answer.name ?? ""}
                    onChange={(ev) => setName(m.id, ev.target.value)}
                    placeholder={RSVP_STEPS_COPY.plusOneNamePlaceholder}
                    maxLength={80}
                    className="h-11"
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>

      {/* Continue */}
      <Button
        onClick={handleContinue}
        disabled={!allAnswered}
        className="w-full h-13 rounded-pill text-base"
      >
        {RSVP_STEPS_COPY.continueLabel}
      </Button>

      {/* Escape hatch back to the invitation page (intro). */}
      <Button
        variant="ghost"
        onClick={() => goTo("intro", -1)}
        className="w-full h-11 rounded-pill"
      >
        {RSVP_STEPS_COPY.attendanceBackLabel}
      </Button>
    </div>
  );
}

