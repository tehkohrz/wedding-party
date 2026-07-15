"use client";

/**
 * The RSVP stepper — mounted by /r/[slug] with the group + members fetched
 * server-side.
 *
 * A single-route stepper (state in lib/rsvpStore, not URLs) so steps can
 * slide with proper enter+exit animations via AnimatePresence — something
 * route-per-step can't do in the App Router (Session 9 lesson). Forward =
 * slide left, back = slide right, mirroring the check-in wizard's feel.
 *
 * Steps land across stages:
 *   Stage 2 (this): attendance + decline path + the shell
 *   Stage 3: menu/food     Stage 4: after-party, confirm, submit, thanks
 */
import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRsvpStore, type RsvpStep } from "@/lib/rsvpStore";
import { RSVP_STEPS_COPY } from "@/lib/content";
import { cn } from "@/lib/utils";
import { StepAttendance } from "./StepAttendance";
import { StepMenu } from "./StepMenu";
import { StepDeclineConfirm } from "./StepDeclineConfirm";
import { StepDeclinedThanks } from "./StepDeclinedThanks";
import { StepPlaceholder } from "./StepPlaceholder";
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
  group,
  members,
}: {
  group: RsvpGroup;
  members: RsvpMember[];
}) {
  const reduceMotion = useReducedMotion();
  const step = useRsvpStore((s) => s.step);
  const direction = useRsvpStore((s) => s.direction);
  const init = useRsvpStore((s) => s.init);

  // Seed the draft store for this group (no-op if already in progress).
  useEffect(() => {
    init(
      group.id,
      members.map((m) => m.id)
    );
  }, [group.id, members, init]);

  const dotIndex = DOT_INDEX[step];
  const enterX = reduceMotion ? 0 : direction * 48;

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Progress dots */}
      {dotIndex !== null && (
        <ol className="flex items-center justify-center gap-2" aria-label="RSVP steps">
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
          {renderStep(step, group, members)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function renderStep(step: RsvpStep, group: RsvpGroup, members: RsvpMember[]) {
  switch (step) {
    case "attendance":
      return <StepAttendance group={group} members={members} />;
    case "menu":
      return <StepMenu members={members} />;
    case "decline-confirm":
      return <StepDeclineConfirm />;
    case "declined-thanks":
      return <StepDeclinedThanks />;
    // Stage 4 replaces these placeholders:
    case "afterparty":
    case "confirm":
    case "thanks":
      return <StepPlaceholder step={step} />;
  }
}
