"use client";

/**
 * The RSVP hero title — replaces the v1 "equation" on the landing pages:
 *
 *     Dong Kun and Jermaine        ← display serif (Cormorant Garamond)
 *     are getting married!         ← script flourish (Great Vibes), accent
 *
 * Both lines are [input]s in lib/content.ts (RSVP_COPY.heroTitle*).
 * Lines fade/rise in one after the other, like the old equation did.
 * The day-of check-in welcome still uses WelcomeEquation.
 */
import { motion, useReducedMotion } from "motion/react";
import { RSVP_COPY } from "@/lib/content";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.2, delayChildren: 0.1 } },
};

const line = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] as const },
  },
};

export function HeroTitle() {
  const reduceMotion = useReducedMotion();
  const motionProps = reduceMotion
    ? {}
    : {
        variants: container,
        initial: "hidden" as const,
        animate: "show" as const,
      };
  const lineVariants = reduceMotion ? undefined : line;

  return (
    <motion.h1 className="text-balance" {...motionProps}>
      <motion.span
        variants={lineVariants}
        className="block font-display text-5xl sm:text-6xl leading-tight"
      >
        {RSVP_COPY.heroTitleNames}
      </motion.span>
      <motion.span
        variants={lineVariants}
        className="block text-5xl sm:text-6xl leading-snug text-lavender pt-2"
        style={{ fontFamily: "var(--font-script)" }}
      >
        {RSVP_COPY.heroTitleFlourish}
      </motion.span>
    </motion.h1>
  );
}
