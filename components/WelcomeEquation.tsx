"use client";

/**
 * The welcome hero equation, animated:
 *
 *     Jermaine Yeo
 *          +
 *     Koh Dong Kun
 *          =
 *      Happiness
 *
 * Each line fades/rises in, staggered — reads like a wedding invitation
 * writing itself. Client component (motion) kept as a small island so the
 * rest of the welcome page stays a Server Component.
 *
 * To tweak:
 *   - Name size:      text-7xl on the name spans
 *   - Operator size:  text-5xl on the + and = spans
 *   - Operator color: text-marigold
 *   - Result style:   italic + text-lavender
 *   - Stagger speed:  staggerChildren below
 */
import { motion, useReducedMotion } from "motion/react";
import { COUPLE } from "@/lib/content";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.16, delayChildren: 0.1 },
  },
};

const line = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] as const },
  },
};

export function WelcomeEquation() {
  const reduceMotion = useReducedMotion();

  // Reduced motion: render statically, no entrance animation.
  const motionProps = reduceMotion
    ? {}
    : { variants: container, initial: "hidden" as const, animate: "show" as const };
  const lineVariants = reduceMotion ? undefined : line;

  return (
    <motion.h1 className="font-display leading-tight" {...motionProps}>
      <motion.span variants={lineVariants} className="block text-7xl">
        {COUPLE.brideName}
      </motion.span>
      <motion.span
        variants={lineVariants}
        className="block text-5xl font-bold text-marigold py-2"
      >
        +
      </motion.span>
      <motion.span variants={lineVariants} className="block text-7xl">
        {COUPLE.groomName}
      </motion.span>
      <motion.span
        variants={lineVariants}
        className="block text-5xl font-bold text-marigold py-2"
      >
        =
      </motion.span>
      <motion.span
        variants={lineVariants}
        className="block text-7xl italic text-lavender"
      >
        {COUPLE.unionWord}
      </motion.span>
    </motion.h1>
  );
}
