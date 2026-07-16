"use client";

/**
 * RSVP step 2 of 4 — menu & food choices.
 *
 * Menu preview up top (full procession from MENU in lib/content.ts), then a
 * selector card for each ATTENDING member: adults pick main A or B; KIDS
 * instead answer whether a kids' meal is required (stored as food "K", or
 * "NO_MEAL" → null at submit). Everyone gets an optional dietary comment.
 * Declined members never appear here.
 *
 * Continue enables once every attending member has an answer.
 */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRsvpStore, EMPTY_ANSWER } from "@/lib/rsvpStore";
import { MENU } from "@/lib/content";
import { BOUQUET_COLORS } from "@/lib/groups";
import type { RsvpMember } from "./types";

/** One food option pill (adult mains, or the kids'-meal yes/no). */
function FoodOption({
  selected,
  onSelect,
  label,
  color,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  color: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
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
      {label}
    </button>
  );
}

/** A course everyone receives (starter / soup / dessert) in the preview. */
function FixedCourse({
  course,
  name,
  description,
}: {
  course: string;
  name: string;
  description: string;
}) {
  return (
    <div className="space-y-1">
      <p className="font-sans text-base uppercase tracking-[0.25em] text-muted-foreground">
        {course}
      </p>
      <p className="font-display text-xl leading-tight">{name}</p>
      <p className="font-sans text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

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

      {/* Menu preview — the full procession, OPEN EDITORIAL (no containing
          box; matches the landing details section). Fixed courses, the
          mains choice in the middle joined by an italic "or", then dessert. */}
      <div className="space-y-7 text-center">
        {MENU.coursesBeforeMains.map((c) => (
          <FixedCourse key={c.course} {...c} />
        ))}

        {/* The choice */}
        <div className="space-y-3">
          <p className="font-sans text-base uppercase tracking-[0.25em] text-primary">
            {MENU.mainsChoiceLabel}
          </p>
          {MENU.mains.map((main, i) => (
            <div key={main.id} className="space-y-3">
              {i > 0 && (
                <p className="font-display italic text-base text-muted-foreground">
                  or
                </p>
              )}
              {/* Each choice sits in its own soft bubble — the one part of
                  the menu guests act on, gently lifted off the page. */}
              <div className="rounded-card border border-primary/40 bg-surface/70 px-5 py-4 space-y-1 max-w-md mx-auto">
                {main.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={main.image}
                    alt={main.name}
                    className="w-full max-w-sm mx-auto h-36 object-cover rounded-card"
                  />
                )}
                <p className="font-display text-xl leading-tight">
                  <span className="text-muted-foreground mr-1.5">
                    {main.id}.
                  </span>
                  {main.name}
                </p>
                <p className="font-sans text-sm text-muted-foreground">
                  {main.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {MENU.coursesAfterMains.map((c) => (
          <FixedCourse key={c.course} {...c} />
        ))}

        {/* Kids' meal note */}
        <div className="space-y-1">
          <p className="font-sans text-base uppercase tracking-[0.25em] text-muted-foreground">
            For the kids
          </p>
          <p className="font-display text-xl leading-tight">
            {MENU.kidsMeal.name}
          </p>
          {MENU.kidsMeal.courses.map((line) => (
            <p key={line} className="font-sans text-sm text-muted-foreground">
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* Per-attending-member selectors */}
      <div className="space-y-2">
        {attending.map((m, i) => {
          const color = BOUQUET_COLORS[i % BOUQUET_COLORS.length];
          const answer = answers[m.id] ?? EMPTY_ANSWER;
          // Plus-ones may have been renamed on the attendance step.
          const displayName = (answer.name ?? "").trim() || m.name;
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
                {m.is_kid && (
                  <span className="font-sans text-[10px] uppercase tracking-wider text-muted-foreground">
                    kid
                  </span>
                )}
              </div>

              {m.is_kid ? (
                /* Kids don't pick a main — they answer the kids'-meal question. */
                <div className="space-y-1.5">
                  <p className="font-sans text-xs text-muted-foreground">
                    {MENU.kidsMealQuestion}
                  </p>
                  <div
                    className="grid grid-cols-2 gap-2"
                    role="radiogroup"
                    aria-label={`Kids' meal for ${displayName}`}
                  >
                    <FoodOption
                      selected={answer.food === "K"}
                      onSelect={() => setFood(m.id, "K")}
                      label={MENU.kidsMealYes}
                      color={color}
                    />
                    <FoodOption
                      selected={answer.food === "NO_MEAL"}
                      onSelect={() => setFood(m.id, "NO_MEAL")}
                      label={MENU.kidsMealNo}
                      color={color}
                    />
                  </div>
                </div>
              ) : (
                <div
                  className="grid grid-cols-2 gap-2"
                  role="radiogroup"
                  aria-label={`Main course for ${displayName}`}
                >
                  {MENU.mains.map((main) => (
                    <FoodOption
                      key={main.id}
                      selected={answer.food === main.id}
                      onSelect={() => setFood(m.id, main.id)}
                      label={`${main.id}. ${main.name}`}
                      color={color}
                    />
                  ))}
                </div>
              )}

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
