"use client";

/**
 * The RSVP hero title — replaces the v1 "equation" on the landing pages:
 *
 *     Jermaine / & / Dong Kun      ← script (Great Vibes), e-invite pink,
 *                                     one line each ("&" smaller)
 *     are getting married!         ← small caps (Cormorant), e-invite olive
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
      {RSVP_COPY.heroTitleLines.map((line) => (
        <motion.span
          key={line}
          variants={lineVariants}
          className={
            line === "&"
              ? "block text-4xl sm:text-6xl leading-tight"
              : "block text-6xl sm:text-8xl leading-tight"
          }
          style={{
            fontFamily: "var(--font-script)",
            color:
              line === "&"
                ? "hsl(var(--invite-blue))"
                : "hsl(var(--invite-pink))",
          }}
        >
          {line}
        </motion.span>
      ))}
      <motion.span
        variants={lineVariants}
        className="block font-display uppercase tracking-[0.28em] text-lg sm:text-2xl pt-4"
        style={{ color: "hsl(var(--invite-olive-text))" }}
      >
        {RSVP_COPY.heroTitleFlourish}
      </motion.span>
    </motion.h1>
  );
}
