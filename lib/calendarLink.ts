/**
 * Google Calendar "add event" link — a plain URL, no API key needed.
 * All event fields are [input]s in lib/content.ts (EVENT_DETAILS.calendar*).
 *
 * Format: calendar.google.com/calendar/render?action=TEMPLATE
 *   dates = <start>/<end> in the event's LOCAL time, ctz names the zone.
 */
import { EVENT_DETAILS } from "@/lib/content";

export function googleCalendarUrl(): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: EVENT_DETAILS.calendarTitle,
    dates: `${EVENT_DETAILS.calendarStart}/${EVENT_DETAILS.calendarEnd}`,
    ctz: EVENT_DETAILS.calendarTimezone,
    location: [EVENT_DETAILS.venueName, EVENT_DETAILS.venueAddress]
      .filter(Boolean)
      .join(", "),
    details: EVENT_DETAILS.calendarDetails,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
