"use client";

/**
 * The personal link's landing view — a mirror of the PUBLIC landing page
 * (app/page.tsx): hero equation, date + countdown, then the Details anchor
 * pinned to the bottom of the first screenful with the full event details
 * below. The one difference: where the public page says "RSVP by personal
 * invite", this shows a personalized greeting and the actual RSVP button.
 *
 * Tapping RSVP enters the "your party" attendance step.
 * Keep the layout in sync with app/page.tsx if either changes.
 */
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRsvpStore, type RsvpStep } from "@/lib/rsvpStore";
import { EVENT_DETAILS, RSVP_COPY, RSVP_STEPS_COPY } from "@/lib/content";
import { WelcomeEquation } from "@/components/WelcomeEquation";
import { EventCountdown } from "@/components/EventCountdown";
import { EventDetails } from "@/components/EventDetails";

export function StepIntro({
  greeting,
  nextStep = "attendance",
}: {
  greeting?: string;
  /** Where RSVP leads: fresh groups → attendance; responded → summary. */
  nextStep?: RsvpStep;
}) {
  const goTo = useRsvpStore((s) => s.goTo);

  return (
    <>
      {/* First screenful — hero centered (my-auto), Details anchor pinned
          to the fold bottom, exactly like the public landing page. */}
      <div className="min-h-full flex flex-col items-center px-6 pt-5 sm:pt-8 pb-3 sm:pb-4">
        <div className="my-auto text-center space-y-3 sm:space-y-6 max-w-xl w-full">
          <p className="font-sans text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {RSVP_COPY.eyebrow}
          </p>

          <WelcomeEquation />

          {/* Event date + venue + countdown */}
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="font-display italic text-2xl sm:text-4xl text-balance text-foreground">
                {EVENT_DETAILS.date}
              </p>
            </div>
            <EventCountdown />
          </div>

          {/* Where the public page explains "personal invite only",
              the personal link greets the guest and offers the button. */}
          <div className="space-y-3 pt-2">
            {greeting && (
              <h2 className="font-display italic text-2xl sm:text-4xl">
                {RSVP_STEPS_COPY.introGreeting.replace("{name}", greeting)}
              </h2>
            )}
            <Button
              onClick={() => goTo(nextStep, 1)}
              className="mx-auto inline-flex h-12 sm:h-14 rounded-pill px-10 sm:px-12 text-lg"
            >
              {RSVP_STEPS_COPY.respondLabel}
              <ChevronRight className="size-5" />
            </Button>
          </div>
        </div>

        {/* Invitation to scroll — this anchor IS the details title. */}
        <a
          href="#details"
          className="shrink-0 inline-flex flex-col items-center gap-1 pt-3 sm:pt-6 font-display text-2xl sm:text-3xl text-foreground hover:text-primary transition-colors"
        >
          {EVENT_DETAILS.detailsHeading}
          <ChevronDown
            className="size-6 sm:size-8 animate-bounce motion-reduce:animate-none"
            aria-hidden
          />
        </a>
      </div>

      {/* Below the fold */}
      <div className="px-6 pb-16 pt-4">
        <EventDetails />
      </div>
    </>
  );
}
