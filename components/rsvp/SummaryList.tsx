"use client";

/**
 * Per-member summary cards — used on the confirm step AND the
 * responded/thank-you view, so the two can never drift apart.
 */
import { Baby, Check, X, PartyPopper } from "lucide-react";
import { useRsvpStore, EMPTY_ANSWER } from "@/lib/rsvpStore";
import { MENU, RSVP_CONFIRM, RSVP_STEPS_COPY } from "@/lib/content";
import { BOUQUET_COLORS } from "@/lib/groups";
import type { RsvpMember } from "./types";

export function SummaryList({ members }: { members: RsvpMember[] }) {
  const answers = useRsvpStore((s) => s.answers);

  return (
    <div className="space-y-2 text-left">
      {members.map((m, i) => {
        const color = BOUQUET_COLORS[i % BOUQUET_COLORS.length];
        const a = answers[m.id] ?? EMPTY_ANSWER;
        // Plus-ones: typed name, else a generic label — the DB placeholder
        // is never shown. A declined plus-one renders as a plain
        // "No plus one" row with no badge at all.
        const declinedPlusOne = m.is_plus_one && a.attending !== true;
        const displayName = declinedPlusOne
          ? RSVP_CONFIRM.noPlusOneBadge
          : (a.name ?? "").trim() ||
            (m.is_plus_one
              ? RSVP_STEPS_COPY.plusOneFallbackName
              : m.name);
        const main = MENU.mains.find((x) => x.id === a.food);
        const foodLabel =
          a.food === "K"
            ? MENU.kidsMeal.name
            : a.food === "NO_MEAL"
              ? "No meal needed"
              : main
                ? `${main.id}. ${main.name}`
                : null;
        return (
          <div
            key={m.id}
            className="rounded-card border px-4 py-3"
            style={{ borderColor: `hsl(var(--${color}))` }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  aria-hidden
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: `hsl(var(--${color}))` }}
                />
                <span className="font-display text-2xl leading-none truncate">
                  {displayName}
                </span>
              </div>
              {a.attending ? (
                <span className="flex items-center gap-1 font-sans text-xs text-arrived shrink-0">
                  <Check className="size-3.5" /> {RSVP_CONFIRM.attendingBadge}
                </span>
              ) : declinedPlusOne ? null : (
                <span className="flex items-center gap-1 font-sans text-xs text-muted-foreground shrink-0">
                  <X className="size-3.5" /> {RSVP_CONFIRM.decliningBadge}
                </span>
              )}
            </div>

            {a.attending && (
              <div className="mt-2 space-y-1 font-sans text-sm">
                {foodLabel && <p>{foodLabel}</p>}
                {a.comment && (
                  <p className="text-muted-foreground italic">“{a.comment}”</p>
                )}
                {m.is_kid && a.babySeat === true && (
                  <p className="flex items-center gap-1 text-xs">
                    <Baby className="size-3.5" />
                    {RSVP_CONFIRM.babySeatBadge}
                  </p>
                )}
                {/* After-party: show the answer BOTH ways — a silent "no"
                    looked like a missing answer on the confirm step. */}
                {a.afterParty !== null && (
                  <p
                    className={
                      a.afterParty
                        ? "flex items-center gap-1 text-xs"
                        : "flex items-center gap-1 text-xs text-muted-foreground"
                    }
                  >
                    {a.afterParty ? (
                      <PartyPopper className="size-3.5" />
                    ) : (
                      <X className="size-3.5" />
                    )}
                    {a.afterParty
                      ? RSVP_CONFIRM.afterPartyBadge
                      : RSVP_CONFIRM.afterPartyNoBadge}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
