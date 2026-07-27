"use client";

/**
 * RSVP step 3 of 4 — the after-party. INVITE-ONLY.
 *
 * The after-party is a separate celebration for a chosen few, so this step
 * is dressed as a SECOND invitation: its own dusk-toned card with a gold
 * wavy frame and script title (the evening twin of the cream daytime
 * invitation), then a yes/no per invited + attending member.
 *
 * Guests reach this step only when someone in their party is flagged
 * after_party_invited; uninvited members never see the question, and the
 * API refuses to store an answer for them.
 */
import { PartyPopper, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChoiceChip } from "./ChoiceChip";
import { useRsvpStore, EMPTY_ANSWER } from "@/lib/rsvpStore";
import { AFTER_PARTY, RSVP_STEPS_COPY } from "@/lib/content";
import { BOUQUET_COLORS } from "@/lib/groups";
import type { RsvpMember } from "./types";

export function StepAfterParty({ members }: { members: RsvpMember[] }) {
  const answers = useRsvpStore((s) => s.answers);
  const setAfterParty = useRsvpStore((s) => s.setAfterParty);
  const goTo = useRsvpStore((s) => s.goTo);

  // Invite-only: the step reaches here only if someone is invited, and
  // only invited members get the question.
  const attending = members.filter(
    (m) =>
      m.after_party_invited === true &&
      (answers[m.id] ?? EMPTY_ANSWER).attending === true
  );
  const allAnswered = attending.every(
    (m) => (answers[m.id] ?? EMPTY_ANSWER).afterParty !== null
  );

  return (
    <div className="space-y-6">
      {/* ── The second invitation ── */}
      <div className="invite-card-night p-1.5 sm:p-2">
        <div className="invite-card-night-inner px-5 py-8 sm:px-8 sm:py-10 text-center space-y-4">
          <p
            className="font-display font-bold uppercase tracking-[0.28em] text-xs sm:text-sm"
            style={{ color: "hsl(var(--invite-night-accent))" }}
          >
            {AFTER_PARTY.eyebrow}
          </p>

          <p
            className="text-4xl sm:text-6xl leading-tight"
            style={{
              fontFamily: "var(--font-script)",
              color: "hsl(var(--invite-night-accent))",
            }}
          >
            {AFTER_PARTY.scriptTitle}
          </p>

          {/* Rule + dot ornament, echoing the paper invite's dividers */}
          <div
            className="flex items-center justify-center gap-3"
            aria-hidden
            style={{ color: "hsl(var(--invite-night-frame))" }}
          >
            <span className="h-px w-10 bg-current opacity-70" />
            <span className="size-1.5 rounded-full bg-current" />
            <span className="h-px w-10 bg-current opacity-70" />
          </div>

          <div
            className="space-y-1 font-display uppercase tracking-[0.2em] text-sm sm:text-base"
            style={{ color: "hsl(var(--invite-night-text))" }}
          >
            <p>{AFTER_PARTY.timeLine}</p>
            <p>{AFTER_PARTY.venueLine}</p>
          </div>

          <p
            className="font-sans text-sm leading-relaxed max-w-sm mx-auto"
            style={{ color: "hsl(var(--invite-night-text) / 0.82)" }}
          >
            {AFTER_PARTY.description}
          </p>
        </div>
      </div>

      <p className="font-sans text-sm text-muted-foreground text-center">
        {AFTER_PARTY.question}
      </p>

      <div className="space-y-2">
        {attending.map((m, i) => {
          const color = BOUQUET_COLORS[i % BOUQUET_COLORS.length];
          const a = answers[m.id] ?? EMPTY_ANSWER;
          const going = a.afterParty;
          // Typed plus-one name, else a generic label (never the DB
          // placeholder).
          const displayName =
            (a.name ?? "").trim() ||
            (m.is_plus_one ? RSVP_STEPS_COPY.plusOneFallbackName : m.name);
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
                <span className="font-display text-2xl leading-none">
                  {displayName}
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
