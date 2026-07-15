"use client";

/**
 * Wraps every page with Back/Home controls and the idle-reset behavior.
 *
 * Rendered from app/layout.tsx so it applies to all routes. The shell
 * conditionally hides Back/Home on routes where they don't make sense
 * (the welcome screen itself, and any non-wizard route like /sandbox).
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, House } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWizardStore } from "@/lib/store";
import { useIdleTimer } from "@/hooks/useIdleTimer";

// 45s — gives guests comfortable time to read their seat info before
// the screen bounces back to welcome for the next person.
const IDLE_TIMEOUT_MS = 45_000;

/**
 * Paths that participate in the DAY-OF CHECK-IN wizard. The RSVP flow at "/"
 * runs its own internal stepper and doesn't use this shell; /sandbox and
 * /admin don't either.
 */
const WIZARD_PATHS = new Set([
  "/checkin",
  "/checkin/group",
  "/checkin/lunch",
  "/find",
]);

/** The check-in wizard's home screen (idle timer + Home button target). */
const CHECKIN_HOME = "/checkin";

export function WizardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reset = useWizardStore((s) => s.reset);
  const setDirection = useWizardStore((s) => s.setDirection);

  const inWizard = WIZARD_PATHS.has(pathname);
  const onHome = pathname === CHECKIN_HOME;

  // Idle timer: only active inside the wizard. On idle, dump state and
  // route back to the check-in welcome screen.
  useIdleTimer(
    () => {
      if (!onHome && inWizard) {
        reset();
        router.push(CHECKIN_HOME);
      }
    },
    IDLE_TIMEOUT_MS
  );

  function goBack() {
    setDirection("back");
    router.back();
  }

  function goHome() {
    setDirection("back");
    reset();
    router.push(CHECKIN_HOME);
  }

  return (
    <>
      {/* Floating controls — only inside the wizard, not on welcome.
          Large circular targets (56px) with a solid surface + border so they
          stay legible over the seat map. Sized for comfortable iPad taps. */}
      {inWizard && !onHome && (
        <div className="fixed top-4 inset-x-4 flex justify-between z-50 pointer-events-none">
          <Button
            variant="outline"
            onClick={goBack}
            className="pointer-events-auto size-14 rounded-full bg-surface shadow-sm"
            aria-label="Back"
          >
            <ArrowLeft className="size-6" />
          </Button>
          <Button
            variant="outline"
            onClick={goHome}
            className="pointer-events-auto size-14 rounded-full bg-surface shadow-sm"
            aria-label="Home"
          >
            <House className="size-6" />
          </Button>
        </div>
      )}
      {children}
    </>
  );
}

/** Convenience: a Link that flags forward direction in the store. */
export function ForwardLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const setDirection = useWizardStore((s) => s.setDirection);
  return (
    <Link
      href={href}
      onClick={() => setDirection("forward")}
      className={className}
    >
      {children}
    </Link>
  );
}
