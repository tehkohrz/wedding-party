// RSVP landing — the PUBLIC page (guests who somehow arrive without their
// personal link). No search: RSVPs happen only via /r/[slug] links, so one
// guest can never open another party's response. This page is the pretty
// invitation shell: hero, countdown, details, and a "use your link" note.
//
// Day-of check-in lives at /checkin.

import { ChevronDown } from "lucide-react";
import { EVENT_DETAILS, RSVP_COPY } from "@/lib/content";
import { HeroTitle } from "@/components/HeroTitle";
import { PhotoSlideshow } from "@/components/PhotoSlideshow";
import { EventCountdown } from "@/components/EventCountdown";
import { EventDetails } from "@/components/EventDetails";

export default function RsvpLandingPage() {
  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col landscape:flex-row">
      {/* Photo side — panel width/height are [input] fields in lib/content.ts. */}
      <PhotoSlideshow />

      {/* Content side — scrolls; the hero fills the first screenful.
          Structure: the hero content centers itself in the leftover space
          (my-auto), while the Details anchor pins to the BOTTOM of the
          fold — so scrolling on reveals the details with no dead gap. */}
      <section className="relative flex-1 overflow-y-auto scroll-smooth bg-background">
        <div className="min-h-full flex flex-col items-center px-6 pt-5 sm:pt-8 pb-3 sm:pb-4">
          <div className="my-auto text-center space-y-3 sm:space-y-6 max-w-xl w-full">
            <HeroTitle />

            {/* Event date + venue + countdown */}
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="font-display italic text-2xl sm:text-4xl text-balance text-foreground">
                  {EVENT_DETAILS.date}
                </p>
              </div>
              <EventCountdown />
            </div>

            {/* No public search — RSVP is via personal links only, so
                nobody can open (or edit) another party's response. */}
            <div className="space-y-1 pt-2">
              <h2 className="font-display text-2xl">
                {RSVP_COPY.linkOnlyHeading}
              </h2>
              <p className="font-sans text-sm text-muted-foreground max-w-md mx-auto">
                {RSVP_COPY.linkOnlyNote}
              </p>
            </div>
          </div>

          {/* Invitation to scroll — pinned to the bottom of the first
              screenful (my-auto above centers the hero in the remaining
              space). This anchor IS the details section's title.
              animate-bounce disabled for reduced-motion users. */}
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

        {/* Below the fold — follows the anchor with only a small gap */}
        <div className="px-6 pb-16 pt-4">
          <EventDetails />
        </div>
      </section>
    </div>
  );
}
