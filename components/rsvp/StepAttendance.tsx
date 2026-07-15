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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRsvpStore, EMPTY_ANSWER } from "@/lib/rsvpStore";
import { EVENT_DETAILS, RSVP_STEPS_COPY } from "@/lib/content";
import { BOUQUET_COLORS } from "@/lib/groups";
import type { RsvpGroup, RsvpMember } from "./types";

export function StepAttendance({
  group,
  members,
}: {
  group: RsvpGroup;
  members: RsvpMember[];
}) {
  const answers = useRsvpStore((s) => s.answers);
  const setAttending = useRsvpStore((s) => s.setAttending);
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
      {/* Schedule */}
      <div className="rounded-card border border-border bg-surface px-5 py-4">
        <ul className="space-y-1.5">
          {EVENT_DETAILS.schedule.map((row) => (
            <li
              key={row.time}
              className="flex items-baseline gap-3 font-sans text-sm"
            >
              <span className="tabular-nums text-muted-foreground w-12 shrink-0">
                {row.time}
              </span>
              <span>{row.item}</span>
            </li>
          ))}
        </ul>
        {EVENT_DETAILS.mapsUrl && (
          <a
            href={EVENT_DETAILS.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block font-sans text-xs text-primary hover:underline mt-2"
          >
            Open in Maps →
          </a>
        )}
      </div>

      {/* Heading */}
      <div className="text-center space-y-1">
        <h2 className="font-display text-3xl">
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
          const attending = (answers[m.id] ?? EMPTY_ANSWER).attending;
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
                <span className="font-display text-lg leading-none">
                  {m.name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ChoiceChip
                  selected={attending === true}
                  onSelect={() => setAttending(m.id, true)}
                  icon={<Check className="size-4" />}
                  label={RSVP_STEPS_COPY.attendingLabel}
                  accentColor={chipColor}
                />
                <ChoiceChip
                  selected={attending === false}
                  onSelect={() => setAttending(m.id, false)}
                  icon={<X className="size-4" />}
                  label={RSVP_STEPS_COPY.decliningLabel}
                  muted
                />
              </div>
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

      <p className="font-sans text-xs text-muted-foreground text-center">
        Responding for {group.label}
      </p>
    </div>
  );
}

function ChoiceChip({
  selected,
  onSelect,
  icon,
  label,
  muted = false,
  accentColor,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  label: string;
  muted?: boolean;
  /** Bouquet token for the selected state (runtime value → inline style,
   *  since Tailwind's JIT can't see dynamic class names). */
  accentColor?: string;
}) {
  const accentStyle =
    selected && accentColor
      ? {
          backgroundColor: `hsl(var(--${accentColor}) / 0.22)`,
          borderColor: `hsl(var(--${accentColor}))`,
        }
      : undefined;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      style={accentStyle}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-pill border px-3 py-2.5",
        "font-sans text-sm transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? muted
            ? "bg-standby/30 border-standby font-semibold"
            : accentColor
              ? "font-semibold" // colors come from accentStyle
              : "bg-arrived/15 border-arrived font-semibold"
          : "bg-surface border-input text-muted-foreground hover:bg-muted"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
