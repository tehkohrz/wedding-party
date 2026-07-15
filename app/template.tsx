"use client";

/**
 * Next.js `template.tsx` — like layout.tsx, but RE-MOUNTED on every
 * navigation instead of persisting. That fresh mount is what lets us run
 * an enter animation each time a route changes.
 *
 * We do enter-only animation (no exit): the App Router unmounts the old
 * route immediately on navigation, so there's nothing to animate out.
 * The incoming screen is full-bleed and covers everything, so an enter-
 * only slide still reads as a clean push/pop transition.
 *
 * Direction comes from the Zustand wizard store:
 *   - "forward" → new screen slides in from the right
 *   - "back"    → new screen slides in from the left
 * Set by NameSearch, ForwardLink, and WizardShell's Back/Home buttons.
 *
 * Non-wizard routes (/sandbox, /admin, ...) render with no animation.
 */
import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useWizardStore } from "@/lib/store";

const WIZARD_PATHS = new Set(["/", "/group", "/lunch", "/find"]);

export default function Template({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const direction = useWizardStore((s) => s.direction);
  const reduceMotion = useReducedMotion();

  // No animation outside the wizard, or when the OS asks for reduced motion.
  if (!WIZARD_PATHS.has(pathname) || reduceMotion) {
    return <>{children}</>;
  }

  // Forward: enter from the right (+x). Back: enter from the left (-x).
  const enterX = direction === "forward" ? 64 : -64;

  return (
    <motion.div
      initial={{ opacity: 0, x: enterX }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.32,
        ease: [0.32, 0.72, 0, 1], // matches --ease-slide in the theme tokens
      }}
    >
      {children}
    </motion.div>
  );
}
