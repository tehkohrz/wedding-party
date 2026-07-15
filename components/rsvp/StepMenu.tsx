"use client";

/**
 * RSVP step 2 of 4 — menu & food choices.
 *
 * Menu preview up top (the two mains from MENU in lib/content.ts), then a
 * selector card for each ATTENDING member: pick main A or B + an optional
 * dietary comment. Declined members never appear here.
 *
 * Continue enables once every attending member has a main chosen.
 */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRsvpStore, EMPTY_ANSWER } from "@/lib/rsvpStore";
import { MENU } from "@/lib/content";
import { BOUQUET_COLORS } from "@/lib/groups";
import type { RsvpMember } from "./types";

export function StepMenu({ members }: { members: RsvpMember[] }) {
  const answers = useRsvpStore((s) => s.answers);
  const setFood = useRsvpStore((s) => s.setFood);
  const setComment = useRsvpStore((s) => s.setComment);
  const goTo = useRsvpStore((s) => s.goTo);

  const attending = members.filter(
    (m) => (answers[m.id] ?? EMPTY_ANSWER).attending === true
  );
  const allChosen = attending.every(
    (m) => (answers[m.id] ?? EMPTY_ANSWER).food !== null
  );

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="text-center space-y-1">
        <h2 className="font-display text-3xl">{MENU.heading}</h2>
        <p className="font-sans text-sm text-muted-foreground">
          {MENU.instruction}
        </p>
      </div>

      {/* Menu preview — the two mains side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MENU.mains.map((main) => (
          <div
            key={main.id}
            className="rounded-card border border-border bg-surface overflow-hidden"
          >
            {main.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={main.image}
                alt={main.name}
                className="w-full h-32 object-cover"
              />
            )}
            <div className="px-4 py-3 space-y-1">
              <p className="font-display text-lg leading-tight">
                <span className="text-muted-foreground mr-1.5">{main.id}.</span>
                {main.name}
              </p>
              <p className="font-sans text-xs text-muted-foreground">
                {main.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Per-attending-member selectors */}
      <div className="space-y-2">
        {attending.map((m, i) => {
          const color = BOUQUET_COLORS[i % BOUQUET_COLORS.length];
          const answer = answers[m.id] ?? EMPTY_ANSWER;
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
                {m.is_kid && MENU.kidsNote && (
                  <span className="font-sans text-[10px] text-muted-foreground">
                    {MENU.kidsNote}
                  </span>
                )}
              </div>

              <div
                className="grid grid-cols-2 gap-2"
                role="radiogroup"
                aria-label={`Main course for ${m.name}`}
              >
                {MENU.mains.map((main) => {
                  const selected = answer.food === main.id;
                  return (
                    <button
                      key={main.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setFood(m.id, main.id)}
                      className={cn(
                        "rounded-pill border px-3 py-2.5 font-sans text-sm transition-colors outline-none",
                        "focus-visible:ring-2 focus-visible:ring-ring",
                        selected
                          ? "font-semibold"
                          : "bg-surface border-input text-muted-foreground hover:bg-muted"
                      )}
                      style={
                        selected
                          ? {
                              backgroundColor: `hsl(var(--${color}) / 0.18)`,
                              borderColor: `hsl(var(--${color}))`,
                            }
                          : undefined
                      }
                    >
                      {main.id}. {main.name}
                    </button>
                  );
                })}
              </div>

              <Input
                value={answer.comment}
                onChange={(e) => setComment(m.id, e.target.value)}
                placeholder={MENU.dietaryPlaceholder}
                maxLength={300}
                className="h-10 text-sm"
              />
            </div>
          );
        })}
      </div>

      {/* Nav */}
      <div className="space-y-2">
        <Button
          onClick={() => goTo("afterparty", 1)}
          disabled={!allChosen}
          className="w-full h-13 rounded-pill text-base"
        >
          {MENU.continueLabel}
        </Button>
        <Button
          variant="ghost"
          onClick={() => goTo("attendance", -1)}
          className="w-full h-11 rounded-pill"
        >
          {MENU.backLabel}
        </Button>
      </div>
    </div>
  );
}
