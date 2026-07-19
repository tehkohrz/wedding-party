"use client";

/**
 * The RSVP stepper — mounted by /r/[slug] with the group + members fetched
 * server-side.
 *
 * A single-route stepper (state in lib/rsvpStore, not URLs). Steps slide
 * in with an ENTER-ONLY animation, keyed by step — the same pattern as
 * app/template.tsx. (An earlier AnimatePresence mode="wait" version hung:
 * its exit callback never fired under React 19 + motion 12, freezing the
 * stepper on whatever step was showing. Enter-only has no exit phase to
 * get stuck on.) Forward = slide from the right, back = from the left.
 *
 * Flow: intro → attendance → menu → afterparty → confirm →(atomic POST)→ thanks
 *            └→ decline-confirm → declined-thanks   (everyone said no)
 *
 * Responded groups open straight on the thanks/summary view (init() in the
 * store decides); editing re-enters at step 1, prefilled. Past the RSVP
 * deadline: responses are view-only, and un-responded links see the
 * closed notice.
 */
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useRsvpStore, type RsvpStep } from "@/lib/rsvpStore";
import { EVENT_DETAILS, RSVP_STEPS_COPY, RSVP_CONFIRM } from "@/lib/content";
import { rsvpDeadlinePassed } from "@/lib/rsvpDeadline";
import { cn } from "@/lib/utils";
import { EventCountdown } from "@/components/EventCountdown";
import { StepIntro } from "./StepIntro";
import { StepAttendance } from "./StepAttendance";
import { StepMenu } from "./StepMenu";
import { StepAfterParty } from "./StepAfterParty";
import { StepConfirm } from "./StepConfirm";
import { StepThanks } from "./StepThanks";
import { StepDeclineConfirm } from "./StepDeclineConfirm";
import { StepDeclinedThanks } from "./StepDeclinedThanks";
import type { RsvpGroup, RsvpMember } from "./types";

/** Which progress dot lights up for each step (null = dots hidden). */
const DOT_INDEX: Record<RsvpStep, number | null> = {
  intro: null,
  attendance: 0,
  menu: 1,
  afterparty: 2,
  confirm: 3,
  thanks: null,
  "decline-confirm": null,
  "declined-thanks": null,
};

export function RsvpFlow({
  slug,
  group,
  members,
  greeting,
}: {
  slug: string;
  group: RsvpGroup;
  members: RsvpMember[];
  /** The link owner's name — personalizes the intro + step header. */
  greeting?: string;
}) {
  const reduceMotion = useReducedMotion();
  const step = useRsvpStore((s) => s.step);
  const direction = useRsvpStore((s) => s.direction);
  const submitted = useRsvpStore((s) => s.submitted);
  const answers = useRsvpStore((s) => s.answers);
  const init = useRsvpStore((s) => s.init);

  // True only within the visit where the POST happened — drives the
  // "Thank you!" vs "Your RSVP" heading.
  const [justSubmitted, setJustSubmitted] = useState(false);

  // Seed / prefill the draft store for this group (no-op if in progress).
  useEffect(() => {
    init(group.id, members);
  }, [group.id, members, init]);

  // Each step starts at the top — without this, entering a step keeps the
  // previous step's scroll position (the <section> is the scroll container,
  // e.g. after scrolling down the intro to reach the RSVP button).
  const shellRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    shellRef.current?.closest("section")?.scrollTo({ top: 0 });
  }, [step]);

  // Deadline gate: no response on file + deadline passed → closed notice.
  if (rsvpDeadlinePassed() && !submitted) {
    return (
      <div className="space-y-3 text-center px-6 py-16">
        <h2 className="font-display text-3xl">{RSVP_CONFIRM.tooLateHeading}</h2>
        <p className="font-sans text-sm text-muted-foreground max-w-md mx-auto">
          {RSVP_CONFIRM.tooLateBody}
        </p>
      </div>
    );
  }

  // The intro is a full-page mirror of the public landing (its own layout,
  // no dots/header) — everything after it uses the compact stepper shell.
  // Its RSVP button sends fresh groups into the flow and responded groups
  // to their summary (or decline note).
  if (step === "intro") {
    const allDeclined = members.every(
      (m) => answers[m.id]?.attending === false
    );
    return (
      <StepIntro
        greeting={greeting}
        nextStep={
          submitted
            ? allDeclined
              ? "declined-thanks"
              : "thanks"
            : "attendance"
        }
      />
    );
  }

  const dotIndex = DOT_INDEX[step];
  const enterX = reduceMotion ? 0 : direction * 48;

  return (
    <div ref={shellRef} className="w-full max-w-xl mx-auto space-y-6 px-6 py-8">
      {/* Compact header — the intro carries the full hero. On phones the
          date + countdown hide so the step's actual content (party list,
          menu…) owns the screen. */}
      <header className="text-center space-y-2 sm:space-y-3">
        <h1 className="font-display text-3xl sm:text-4xl leading-tight">
          {greeting
            ? RSVP_STEPS_COPY.introGreeting.replace("{name}", greeting)
            : EVENT_DETAILS.date}
        </h1>
        {greeting && (
          <p className="hidden sm:block font-display italic text-2xl text-foreground">
            {EVENT_DETAILS.date}
          </p>
        )}
        <div className="hidden sm:block">
          <EventCountdown />
        </div>
      </header>
      {/* Progress dots */}
      {dotIndex !== null && (
        <ol
          className="flex items-center justify-center gap-2"
          aria-label="RSVP steps"
        >
          {RSVP_STEPS_COPY.stepLabels.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span
                aria-current={i === dotIndex ? "step" : undefined}
                className={cn(
                  "flex items-center gap-1.5 font-sans text-xs rounded-pill px-2.5 py-1 transition-colors",
                  i === dotIndex
                    ? "bg-primary text-primary-foreground font-semibold"
                    : i < dotIndex
                      ? "bg-muted text-foreground"
                      : "bg-muted/50 text-muted-foreground"
                )}
              >
                {label}
              </span>
            </li>
          ))}
        </ol>
      )}

      {/* The current step. key={step} remounts the div on every step
          change, replaying the enter animation (old step vanishes
          instantly — see header comment). */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: enterX }}
        animate={{ opacity: 1, x: 0 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 0.28, ease: [0.32, 0.72, 0, 1] }
        }
      >
        {renderStep()}
      </motion.div>
    </div>
  );

  function renderStep() {
    switch (step) {
      case "intro":
        return null; // handled by the early return above
      case "attendance":
        return <StepAttendance members={members} />;
      case "menu":
        return <StepMenu members={members} />;
      case "afterparty":
        return <StepAfterParty members={members} />;
      case "confirm":
        return (
          <StepConfirm
            slug={slug}
            members={members}
            onSubmitted={() => setJustSubmitted(true)}
          />
        );
      case "thanks":
        return <StepThanks members={members} justSubmitted={justSubmitted} />;
      case "decline-confirm":
        return <StepDeclineConfirm slug={slug} members={members} />;
      case "declined-thanks":
        return <StepDeclinedThanks />;
    }
  }
}
