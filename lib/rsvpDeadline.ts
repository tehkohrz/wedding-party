/**
 * RSVP deadline check — shared by the client flow (hide Edit, show closed
 * notice) and the server POST handler (reject late submissions), so the two
 * can never disagree.
 *
 * The deadline DAY is inclusive: responses close at the end of that day,
 * Singapore time.
 */
import { EVENT_DETAILS } from "./content";

export function rsvpDeadlineMs(): number {
  return new Date(`${EVENT_DETAILS.rsvpDeadline}T23:59:59+08:00`).getTime();
}

export function rsvpDeadlinePassed(): boolean {
  return Date.now() > rsvpDeadlineMs();
}

/** Human-readable deadline, e.g. "30 September 2026" (SG time). */
export function rsvpDeadlineLabel(): string {
  return new Date(`${EVENT_DETAILS.rsvpDeadline}T12:00:00+08:00`).toLocaleDateString(
    "en-SG",
    { day: "numeric", month: "long", year: "numeric" }
  );
}
