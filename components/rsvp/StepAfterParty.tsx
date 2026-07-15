"use client";

/**
 * RSVP step 3 of 4 — the after-party.
 *
 * Details paragraph, then a yes/no per ATTENDING member (a family can send
 * 2 of 4). Continue enables once every attending member has an answer.
 */
import { PartyPopper, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChoiceChip } from "./ChoiceChip";
import { useRsvpStore, EMPTY_ANSWER } from "@/lib/rsvpStore";
import { AFTER_PARTY } from "@/lib/content";
import { BOUQUET_COLORS } from "@/lib/groups";
import type { RsvpMember } from "./types";

export function StepAfterParty({ members }: { members: RsvpMember[] }) {
  const answers = useRsvpStore((s) => s.answers);
  const setAfterParty = useRsvpStore((s) => s.setAfterParty);
  const goTo = useRsvpStore((s) => s.goTo);

  const attending = members.filter(
    (m) => (answers[m.id] ?? EMPTY_ANSWER).attending === true
  );
  const allAnswered = attending.every(
    (m) => (answers[m.id] ?? EMPTY_ANSWER).afterParty !== null
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-display text-3xl">{AFTER_PARTY.heading}</h2>
      </div>

      <div className="rounded-card border border-border bg-surface px-5 py-4">
        <p className="font-sans text-sm leading-relaxed">
          {AFTER_PARTY.description}
        </p>
      </div>

      <p className="font-sans text-sm text-muted-foreground text-center">
        {AFTER_PARTY.question}
      </p>

      <div className="space-y-2">
        {attending.map((m, i) => {
          const color = BOUQUET_COLORS[i % BOUQUET_COLORS.length];
          const going = (answers[m.id] ?? EMPTY_ANSWER).afterParty;
          return (
            <div
              key={m.id}
              className="rounded-card border px-4 py-3 space-y-2"
              style={{ borderColor: `hsl(var(--${color}))` }}
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
                  selected={going === true}
                  onSelect={() => setAfterParty(m.id, true)}
                  icon={<PartyPopper className="size-4" />}
                  label={AFTER_PARTY.yesLabel}
                  accentColor={color}
                />
                <ChoiceChip
                  selected={going === false}
                  onSelect={() => setAfterParty(m.id, false)}
                  icon={<X className="size-4" />}
                  label={AFTER_PARTY.noLabel}
                  muted
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <Button
          onClick={() => goTo("confirm", 1)}
          disabled={!allAnswered}
          className="w-full h-13 rounded-pill text-base"
        >
          {AFTER_PARTY.continueLabel}
        </Button>
        <Button
          variant="ghost"
          onClick={() => goTo("menu", -1)}
          className="w-full h-11 rounded-pill"
        >
          {AFTER_PARTY.backLabel}
        </Button>
      </div>
    </div>
  );
}
