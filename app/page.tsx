// RSVP landing — the main public URL guests receive.
//
// Layout: photo slideshow + a SCROLLABLE content side. The hero (names,
// countdown, search) fills the first screenful; a "Details" anchor with a
// pulsing arrow invites scrolling to the below-the-fold section (schedule,
// attire, location + map). Personal links (/r/[slug]) skip this page.
//
// Day-of check-in lives at /checkin.

import { ChevronDown } from "lucide-react";
import { EVENT_DETAILS, RSVP_COPY } from "@/lib/content";
import { WelcomeEquation } from "@/components/WelcomeEquation";
import { PhotoSlideshow } from "@/components/PhotoSlideshow";
import { RsvpNameSearch } from "@/components/RsvpNameSearch";
import { EventCountdown } from "@/components/EventCountdown";
import { EventDetails } from "@/components/EventDetails";

export default function RsvpLandingPage() {
  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col landscape:flex-row">
      {/* Photo side — panel width/height are [input] fields in lib/content.ts. */}
      <PhotoSlideshow />

      {/* Content side — scrolls; the hero fills the first screenful. */}
      <section className="relative flex-1 overflow-y-auto scroll-smooth bg-background">
        <div className="min-h-full flex flex-col items-center justify-center px-6 py-8">
          <div className="text-center space-y-6 max-w-xl w-full">
            <p className="font-sans text-xs uppercase tracking-[0.25em] text-muted-foreground">
              {RSVP_COPY.eyebrow}
            </p>

            <WelcomeEquation />

            {/* Event date + venue + countdown */}
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="font-display italic text-2xl text-foreground">
                  {EVENT_DETAILS.date}
                </p>
                <p className="font-sans text-sm text-muted-foreground">
                  {EVENT_DETAILS.venueName}
                  {EVENT_DETAILS.venueAddress &&
                    ` · ${EVENT_DETAILS.venueAddress}`}
                </p>
              </div>
              <EventCountdown />
            </div>

            {/* Name search → /r/[slug] */}
            <div className="space-y-1 pt-2">
              <h2 className="font-display text-2xl">
                {RSVP_COPY.searchHeading}
              </h2>
              <p className="font-sans text-sm text-muted-foreground">
                {RSVP_COPY.searchInstruction}
              </p>
            </div>
            <RsvpNameSearch />

            {/* Invitation to scroll — this anchor IS the section title
                (the details section below has no heading of its own).
                animate-bounce is Tailwind's built-in pulse; disabled for
                reduced-motion users. */}
            <a
              href="#details"
              className="inline-flex flex-col items-center gap-1 pt-4 font-display text-3xl text-foreground hover:text-primary transition-colors"
            >
              {EVENT_DETAILS.detailsHeading}
              <ChevronDown
                className="size-8 animate-bounce motion-reduce:animate-none"
                aria-hidden
              />
            </a>
          </div>
        </div>

        {/* Below the fold */}
        <div className="px-6 pb-16">
          <EventDetails />
        </div>
      </section>
    </div>
  );
}
