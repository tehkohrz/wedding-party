/**
 * The day's programme — one component, one style, used by BOTH the landing
 * details section and the RSVP "your party" step so they can never drift.
 * Open editorial treatment: small-caps label, display-font items.
 * Server-safe (no hooks).
 */
import { Clock } from "lucide-react";
import { EVENT_DETAILS } from "@/lib/content";

export function ScheduleBlock() {
  return (
    <div className="text-center">
      <p
        className="flex items-center justify-center gap-2.5 font-display font-bold text-xl sm:text-2xl uppercase tracking-[0.25em]"
        style={{ color: "hsl(var(--invite-olive-text))" }}
      >
        <Clock className="size-6" />
        Schedule
      </p>
      <ul className="inline-block mt-3 space-y-1">
        {EVENT_DETAILS.schedule.map((row) => (
          <li
            key={row.time}
            className="flex items-baseline gap-4 text-left leading-relaxed"
          >
            <span className="font-display tabular-nums text-xl sm:text-2xl text-muted-foreground w-20 shrink-0">
              {row.time}
            </span>
            <span className="font-display text-2xl sm:text-3xl">{row.item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
