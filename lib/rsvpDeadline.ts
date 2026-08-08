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

/**
 * Whole days from now until the RSVP deadline (negative once passed).
 * Drives the chase list's urgency line.
 */
export function rsvpDaysRemaining(): number {
  return Math.ceil((rsvpDeadlineMs() - Date.now()) / 86_400_000);
}

/**
 * Short, chatty form of the deadline — "1st Sept" — for WhatsApp messages
 * where the full "1 September 2026" is more formality than a text needs.
 *
 * Derived from EVENT_DETAILS.rsvpDeadline like every other label here, so
 * moving the deadline moves this too. (Hard-coding "1st Sept" into the
 * message template would silently go stale.)
 */
const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  // "Sept" rather than Intl's "Sep" — it's how the date is usually written.
  "Jul", "Aug", "Sept", "Oct", "Nov", "Dec",
] as const;

/* Intl's ordinal plural rules name the categories; English maps
   one→st, two→nd, few→rd and everything else→th (1st, 2nd, 3rd, 4th…11th). */
const ORDINAL_SUFFIX: Partial<Record<Intl.LDMLPluralRule, string>> = {
  one: "st",
  two: "nd",
  few: "rd",
};

function ordinalSuffix(day: number): string {
  const rule = new Intl.PluralRules("en", { type: "ordinal" }).select(day);
  return ORDINAL_SUFFIX[rule] ?? "th";
}

export function rsvpDeadlineShort(): string {
  // Read the parts in SG time so the day can't slip across the timezone.
  const d = new Date(`${EVENT_DETAILS.rsvpDeadline}T12:00:00+08:00`);
  const fmt = new Intl.DateTimeFormat("en-SG", {
    timeZone: "Asia/Singapore",
    day: "numeric",
    month: "numeric",
  }).formatToParts(d);
  const day = Number(fmt.find((p) => p.type === "day")!.value);
  const month = Number(fmt.find((p) => p.type === "month")!.value);
  return `${day}${ordinalSuffix(day)} ${MONTHS_SHORT[month - 1]}`;
}
