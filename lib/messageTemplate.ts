/**
 * Fills the WhatsApp message templates in ADMIN_COPY.
 *
 * One implementation for both the Links tab (invitation) and the Chase tab
 * (reminder) — they were substituting the same placeholders separately, so
 * a new placeholder had to be added in two places or one tab silently
 * rendered it as literal text.
 *
 * Placeholders:
 *   {name}          the guest the link is addressed to
 *   {link}          their personal RSVP URL
 *   {date}          the wedding date, long form ("31 October 2026, Saturday")
 *   {deadline}      RSVP deadline, long form ("1 September 2026")
 *   {deadlineShort} RSVP deadline, chatty form ("1st Sept")
 *   {days}          whole days left until the deadline (never negative)
 *
 * Unknown placeholders are left untouched, so a typo shows up in the copied
 * message rather than vanishing.
 */
import { EVENT_DETAILS } from "./content";
import {
  rsvpDaysRemaining,
  rsvpDeadlineLabel,
  rsvpDeadlineShort,
} from "./rsvpDeadline";

export function fillMessageTemplate(
  template: string,
  vars: { name: string; link: string },
): string {
  return (
    template
      .replaceAll("{name}", vars.name)
      .replaceAll("{link}", vars.link)
      .replaceAll("{date}", EVENT_DETAILS.date)
      // Longest placeholder first is not required ("{deadline}" is not a
      // substring of "{deadlineShort}"), but keep them adjacent so the
      // relationship is obvious to the next reader.
      .replaceAll("{deadlineShort}", rsvpDeadlineShort())
      .replaceAll("{deadline}", rsvpDeadlineLabel())
      .replaceAll("{days}", String(Math.max(0, rsvpDaysRemaining())))
  );
}
