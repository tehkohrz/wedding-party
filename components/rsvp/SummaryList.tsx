"use client";

/**
 * Per-member summary cards — used on the confirm step AND the
 * responded/thank-you view, so the two can never drift apart.
 */
import { Check, X, PartyPopper } from "lucide-react";
import { useRsvpStore, EMPTY_ANSWER } from "@/lib/rsvpStore";
import { MENU, RSVP_CONFIRM } from "@/lib/content";
import { BOUQUET_COLORS } from "@/lib/groups";
import type { RsvpMember } from "./types";

export function SummaryList({ members }: { members: RsvpMember[] }) {
  const answers = useRsvpStore((s) => s.answers);

  return (
    <div className="space-y-2 text-left">
      {members.map((m, i) => {
        const color = BOUQUET_COLORS[i % BOUQUET_COLORS.length];
        const a = answers[m.id] ?? EMPTY_ANSWER;
        const main = MENU.mains.find((x) => x.id === a.food);
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
                <span className="font-display text-lg leading-none truncate">
                  {m.name}
                </span>
              </div>
              {a.attending ? (
                <span className="flex items-center gap-1 font-sans text-xs text-arrived shrink-0">
                  <Check className="size-3.5" /> {RSVP_CONFIRM.attendingBadge}
                </span>
              ) : (
                <span className="flex items-center gap-1 font-sans text-xs text-muted-foreground shrink-0">
                  <X className="size-3.5" /> {RSVP_CONFIRM.decliningBadge}
                </span>
              )}
            </div>

            {a.attending && (
              <div className="mt-2 space-y-1 font-sans text-sm">
                {main && (
                  <p>
                    <span className="text-muted-foreground">{main.id}.</span>{" "}
                    {main.name}
                  </p>
                )}
                {a.comment && (
                  <p className="text-muted-foreground italic">“{a.comment}”</p>
                )}
                {a.afterParty && (
                  <p className="flex items-center gap-1 text-xs">
                    <PartyPopper className="size-3.5" />
                    {RSVP_CONFIRM.afterPartyBadge}
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
