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
import { ChoiceChip } from "./ChoiceChip";
import { StepNav } from "./StepNav";
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
      (answers[m.id] ?? EMPTY_ANSWER).attending === true,
  );
  const allAnswered = attending.every(
    (m) => (answers[m.id] ?? EMPTY_ANSWER).afterParty !== null,
  );

  return (
    <div className="space-y-6">
      {/* ── The second invitation ──
          A 3.30pm beach club, so this card is daylight, not dusk: seafoam
          ground, coral frame and script from the pigeon's party hat, and
          the bird itself leaning in past the frame (the card clips it, so
          it reads as gate-crashing rather than as a pasted sticker). */}
      <div className="invite-card-party p-1.5 sm:p-2">
        <div className="invite-card-party-inner px-5 py-8 sm:px-8 sm:py-10 text-center space-y-4">
          <p
            className="font-sans font-medium uppercase tracking-[0.26em] text-xs sm:text-sm"
            style={{ color: "hsl(var(--afterparty-text))" }}
          >
            {AFTER_PARTY.eyebrow}
          </p>

          <p
            className="font-party italic font-semibold text-3xl sm:text-5xl leading-tight"
            style={{ color: "hsl(var(--afterparty-accent))" }}
          >
            {AFTER_PARTY.scriptTitle}
          </p>

          <div
            className="flex items-center justify-center gap-3"
            aria-hidden
            style={{ color: "hsl(var(--afterparty-frame))" }}
          >
            <span className="h-px w-10 bg-current opacity-70" />
            <span className="size-1.5 rounded-full bg-current" />
            <span className="h-px w-10 bg-current opacity-70" />
          </div>

          {/* Details and the sentence below share the title's face (upright,
              not italic) so the card reads as one piece of stationery
              rather than a poster headline over app UI. */}
          <div
            className="space-y-1 font-party font-semibold uppercase tracking-[0.13em] sm:tracking-[0.2em] text-xs sm:text-sm"
            style={{ color: "hsl(var(--afterparty-text))" }}
          >
            <p>{AFTER_PARTY.timeLine}</p>
            <p>{AFTER_PARTY.venueLine}</p>
          </div>

          {/* Bottom padding keeps the copy clear of the flock below —
              just enough to clear the tallest hat, so the birds sit close
              under the text rather than across a gap. */}
          <p
            className="font-party text-[15px] leading-relaxed max-w-sm mx-auto pb-8 sm:pb-10"
            style={{ color: "hsl(var(--afterparty-text) / 0.85)" }}
          >
            {AFTER_PARTY.description}
          </p>
        </div>

        {/* A flock peeking over the bottom edge, each in a different hat
            colour (the same painting, hue-rotated on the hat + streamers
            only — the eyes and plumage are untouched).
            The artwork is cropped to the head: the illustration runs off
            its own frame at the neck, so a full bird ends in a hard
            vertical line. Cropping above that leaves ONE straight edge —
            the bottom — and every bird is anchored below the card edge so
            that edge is clipped away. Widths are percentages (never fixed
            px) so the row can't overflow and clip a head's right side. */}
        <div
          aria-hidden
          className="pointer-events-none select-none absolute inset-x-0 -bottom-1 flex items-end px-5 sm:px-10"
        >
          {/* eslint-disable @next/next/no-img-element */}
          <img
            src="/pigeon-head-teal.png"
            alt=""
            className="w-[24%] shrink-0 translate-y-1"
          />
          <img
            src="/pigeon-head-yellow.png"
            alt=""
            className="w-[20%] shrink-0 -ml-[5.5%] translate-y-2"
          />
          <img
            src="/pigeon-head-violet.png"
            alt=""
            className="w-[28%] shrink-0 -ml-[5.5%]"
          />
          <img
            src="/pigeon-head-pink.png"
            alt=""
            className="w-[22%] shrink-0 -ml-[5.5%] translate-y-2"
          />
          <img
            src="/pigeon-head.png"
            alt=""
            className="w-[28%] shrink-0 -ml-[5.5%]"
          />
          {/* eslint-enable @next/next/no-img-element */}
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

      <StepNav
        onBack={() => goTo("menu", -1)}
        backLabel={AFTER_PARTY.backLabel}
        onForward={() => goTo("confirm", 1)}
        forwardDisabled={!allAnswered}
        forwardLabel={RSVP_STEPS_COPY.stepLabels[3]}
      />
    </div>
  );
}
