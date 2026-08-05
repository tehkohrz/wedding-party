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
import { Input } from "@/components/ui/input";
import { StepNav } from "./StepNav";
import { cn } from "@/lib/utils";
import { useRsvpStore, EMPTY_ANSWER } from "@/lib/rsvpStore";
import { MENU, RSVP_STEPS_COPY } from "@/lib/content";
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
          : "bg-surface border-input text-muted-foreground hover:bg-muted",
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
  const setBabySeat = useRsvpStore((s) => s.setBabySeat);
  const setComment = useRsvpStore((s) => s.setComment);
  const goTo = useRsvpStore((s) => s.goTo);

  const attending = members.filter(
    (m) => (answers[m.id] ?? EMPTY_ANSWER).attending === true,
  );
  // Adults: a main chosen. Kids: kids-meal AND baby-seat answered.
  // Where Continue leads — the after-party only exists for parties with
  // an invited, attending member.
  const nextStep = members.some(
    (m) =>
      m.after_party_invited === true &&
      (answers[m.id] ?? EMPTY_ANSWER).attending === true,
  )
    ? ("afterparty" as const)
    : ("confirm" as const);

  const allChosen = attending.every((m) => {
    const a = answers[m.id] ?? EMPTY_ANSWER;
    return a.food !== null && (!m.is_kid || a.babySeat !== null);
  });

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="text-center space-y-1">
        <h2 className="font-display font-bold text-3xl">{MENU.heading}</h2>
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
          <p
            className="font-display font-bold text-base uppercase tracking-[0.25em]"
            style={{ color: "hsl(var(--invite-olive-text))" }}
          >
            {MENU.mainsChoiceLabel}
          </p>
          {/* ONE menu panel fenced by olive hairlines, both dishes inside
              it. A card with a blue border and rounded corners read as two
              tap targets and competed with the real selectors below; a
              printed-menu frame lifts the mains without offering to be
              pressed. */}
          <div
            className="max-w-md mx-auto py-4 space-y-1"
            style={{
              borderTop: "1px solid hsl(var(--invite-frame))",
              borderBottom: "1px solid hsl(var(--invite-frame))",
            }}
          >
            {MENU.mains.map((main, i) => (
              <div key={main.id} className="space-y-1">
                {i > 0 && (
                  <p className="font-display italic text-base text-muted-foreground py-2">
                    or
                  </p>
                )}
                {main.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={main.image}
                    alt={main.name}
                    className="w-full max-w-sm mx-auto h-36 object-cover rounded-card mb-2"
                  />
                )}
                <p className="font-display text-xl leading-tight">
                  {main.name}
                </p>
                <p className="font-sans text-sm text-muted-foreground">
                  {main.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {MENU.coursesAfterMains.map((c) => (
          <FixedCourse key={c.course} {...c} />
        ))}

        {/* Kids' meal — shown only when a child in this party is actually
            attending, and separated from the adults' menu by the rule
            ornament so it reads as its own little menu. */}
        {attending.some((m) => m.is_kid) && (
          <>
            <div
              className="flex items-center justify-center gap-2.5 pt-2"
              aria-hidden
              style={{ color: "hsl(var(--invite-frame))" }}
            >
              <span className="h-px w-10 bg-current" />
              <span className="size-1 rounded-full bg-current" />
              <span className="h-px w-10 bg-current" />
            </div>
            <div className="space-y-1">
              <p className="font-sans text-base uppercase tracking-[0.25em] text-muted-foreground">
                For the kids
              </p>
              <p className="font-display text-xl leading-tight">
                {MENU.kidsMeal.name}
              </p>
              {MENU.kidsMeal.courses.map((line) => (
                <p
                  key={line}
                  className="font-sans text-sm text-muted-foreground"
                >
                  {line}
                </p>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Per-attending-member selectors */}
      <div className="space-y-2">
        {attending.map((m, i) => {
          const color = BOUQUET_COLORS[i % BOUQUET_COLORS.length];
          const answer = answers[m.id] ?? EMPTY_ANSWER;
          // Plus-ones show the typed name, else a generic label — the DB
          // placeholder name is never displayed.
          const displayName =
            (answer.name ?? "").trim() ||
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
                {m.is_kid && (
                  <span className="font-sans text-[10px] uppercase tracking-wider text-muted-foreground">
                    kid
                  </span>
                )}
              </div>

              {m.is_kid ? (
                /* Kids don't pick a main — they answer the kids'-meal and
                   baby-seat questions instead. */
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
                  <p className="font-sans text-xs text-muted-foreground pt-1">
                    {MENU.babySeatQuestion}
                  </p>
                  <div
                    className="grid grid-cols-2 gap-2"
                    role="radiogroup"
                    aria-label={`Baby seat for ${displayName}`}
                  >
                    <FoodOption
                      selected={answer.babySeat === true}
                      onSelect={() => setBabySeat(m.id, true)}
                      label={MENU.babySeatYes}
                      color={color}
                    />
                    <FoodOption
                      selected={answer.babySeat === false}
                      onSelect={() => setBabySeat(m.id, false)}
                      label={MENU.babySeatNo}
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
      {/* Forward names the next step: the after-party when someone in the
          party is invited to it, otherwise straight to the summary. */}
      <StepNav
        onBack={() => goTo("attendance", -1)}
        backLabel={MENU.backLabel}
        onForward={() => goTo(nextStep, 1)}
        forwardDisabled={!allChosen}
        forwardLabel={
          nextStep === "afterparty"
            ? RSVP_STEPS_COPY.stepLabels[2]
            : RSVP_STEPS_COPY.stepLabels[3]
        }
      />
    </div>
  );
}
