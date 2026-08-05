/**
 * The "when" block of the invitation, shared by the public landing page
 * and the personal-link intro (they were drifting as separate copies):
 *
 *     ——— • ———           olive rule + dot, the stationery frame
 *   31 October 2026        the date, stripe blue, semibold italic
 *   [86] [20] [41]         the countdown beneath
 *
 * The rule fences the date structurally so the date doesn't have to shout
 * to feel important; the blue ties it to the countdown below and the
 * ampersand above.
 */
import { EVENT_DETAILS } from "@/lib/content";
import { EventCountdown } from "@/components/EventCountdown";

export function EventWhen() {
  return (
    <div className="space-y-3">
      <div
        className="flex items-center justify-center gap-2.5"
        aria-hidden
        style={{ color: "hsl(var(--invite-frame))" }}
      >
        <span className="h-px w-8 sm:w-12 bg-current" />
        <span className="size-1 rounded-full bg-current" />
        <span className="h-px w-8 sm:w-12 bg-current" />
      </div>

      <p
        className="font-display font-semibold italic text-3xl sm:text-5xl text-balance"
        style={{ color: "hsl(var(--invite-blue))" }}
      >
        {EVENT_DETAILS.date}
      </p>

      <EventCountdown />
    </div>
  );
}
