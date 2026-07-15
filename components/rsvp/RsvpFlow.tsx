"use client";

/**
 * The RSVP stepper — mounted by /r/[slug] with the group + members fetched
 * server-side.
 *
 * A single-route stepper (state in lib/rsvpStore, not URLs) so steps can
 * slide with proper enter+exit animations via AnimatePresence — something
 * route-per-step can't do in the App Router. Forward = slide left, back =
 * slide right, mirroring the check-in wizard's feel.
 *
 * Flow: attendance → menu → afterparty → confirm →(one atomic POST)→ thanks
 *            └→ decline-confirm → declined-thanks   (everyone said no)
 *
 * Responded groups open straight on the thanks/summary view (init() in the
 * store decides); editing re-enters at step 1, prefilled. Past the RSVP
 * deadline: responses are view-only, and un-responded links see the
 * closed notice.
 */
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRsvpStore, type RsvpStep } from "@/lib/rsvpStore";
import { RSVP_STEPS_COPY, RSVP_CONFIRM } from "@/lib/content";
import { rsvpDeadlinePassed } from "@/lib/rsvpDeadline";
import { cn } from "@/lib/utils";
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
}: {
  slug: string;
  group: RsvpGroup;
  members: RsvpMember[];
}) {
  const reduceMotion = useReducedMotion();
  const step = useRsvpStore((s) => s.step);
  const direction = useRsvpStore((s) => s.direction);
  const submitted = useRsvpStore((s) => s.submitted);
  const init = useRsvpStore((s) => s.init);

  // True only within the visit where the POST happened — drives the
  // "Thank you!" vs "Your RSVP" heading.
  const [justSubmitted, setJustSubmitted] = useState(false);

  // Seed / prefill the draft store for this group (no-op if in progress).
  useEffect(() => {
    init(group.id, members);
  }, [group.id, members, init]);

  // Deadline gate: no response on file + deadline passed → closed notice.
  if (rsvpDeadlinePassed() && !submitted) {
    return (
      <div className="space-y-3 text-center py-8">
        <h2 className="font-display text-3xl">{RSVP_CONFIRM.tooLateHeading}</h2>
        <p className="font-sans text-sm text-muted-foreground max-w-md mx-auto">
          {RSVP_CONFIRM.tooLateBody}
        </p>
      </div>
    );
  }

  const dotIndex = DOT_INDEX[step];
  const enterX = reduceMotion ? 0 : direction * 48;

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
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

      {/* The current step, sliding in/out. mode="wait": old step animates
          out before the new one animates in. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: enterX }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -enterX }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.28, ease: [0.32, 0.72, 0, 1] }
          }
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  function renderStep() {
    switch (step) {
      case "attendance":
        return <StepAttendance group={group} members={members} />;
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
