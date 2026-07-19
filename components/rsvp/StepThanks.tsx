"use client";

/**
 * The thank-you / responded view — doubles as both:
 *   - the screen right after submitting (confetti already fired), and
 *   - what a responded link opens to on later visits (summary + Edit).
 *
 * Edit re-enters the stepper at step 1 with everything prefilled — allowed
 * until the RSVP deadline, after which the summary is view-only.
 */
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SummaryList } from "./SummaryList";
import { useRsvpStore } from "@/lib/rsvpStore";
import { EVENT_DETAILS, RSVP_CONFIRM } from "@/lib/content";
import { googleCalendarUrl } from "@/lib/calendarLink";
import { rsvpDeadlinePassed, rsvpDeadlineLabel } from "@/lib/rsvpDeadline";
import type { RsvpMember } from "./types";

export function StepThanks({
  members,
  justSubmitted,
}: {
  members: RsvpMember[];
  justSubmitted: boolean;
}) {
  const goTo = useRsvpStore((s) => s.goTo);
  const closed = rsvpDeadlinePassed();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-display font-bold text-3xl">
          {justSubmitted
            ? RSVP_CONFIRM.thanksHeading
            : RSVP_CONFIRM.respondedHeading}
        </h2>
      </div>

      <SummaryList members={members} />

      {/* Handy shortcut: drop the wedding into their calendar. Event
          fields are [input]s in lib/content.ts (EVENT_DETAILS.calendar*). */}
      <Button asChild variant="outline" className="w-full h-11 rounded-pill">
        <a href={googleCalendarUrl()} target="_blank" rel="noreferrer">
          <CalendarPlus className="size-4" />
          {EVENT_DETAILS.calendarButtonLabel}
        </a>
      </Button>

      {closed ? (
        <p className="font-sans text-xs text-muted-foreground text-center">
          {RSVP_CONFIRM.deadlinePassedNote}
        </p>
      ) : (
        <div className="space-y-2">
          <Button
            variant="outline"
            onClick={() => goTo("attendance", -1)}
            className="w-full h-11 rounded-pill"
          >
            {RSVP_CONFIRM.editLabel}
          </Button>
          <p className="font-sans text-xs text-muted-foreground text-center">
            {RSVP_CONFIRM.editUntilNote.replace(
              "{deadline}",
              rsvpDeadlineLabel()
            )}
          </p>
        </div>
      )}
    </div>
  );
}
