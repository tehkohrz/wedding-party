// RSVP landing — the main public URL guests receive.
//
// Layout mirrors the check-in welcome: photo side + content side, split in
// landscape/desktop, stacked on portrait phones (RSVP links open from
// WhatsApp on phones, so the stacked layout is the primary experience).
//
// The name search routes a found guest to their personal link (/r/[slug]),
// where the RSVP stepper takes over (Stage 2). Guests arriving directly via
// their personal link skip this page entirely.
//
// Day-of check-in lives at /checkin.

import { EVENT_DETAILS, RSVP_COPY } from "@/lib/content";
import { WelcomeEquation } from "@/components/WelcomeEquation";
import { PhotoSlideshow } from "@/components/PhotoSlideshow";
import { RsvpNameSearch } from "@/components/RsvpNameSearch";
import { EventCountdown } from "@/components/EventCountdown";

export default function RsvpLandingPage() {
  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col landscape:flex-row">
      {/* Photo side — slideshow (gradient placeholder until photos exist) */}
      <PhotoSlideshow className="h-[32%] landscape:h-full landscape:w-[45%] shrink-0" />

      {/* Content side */}
      <section className="relative flex-1 overflow-y-auto bg-background flex flex-col items-center justify-center px-6 py-8">
        <div className="text-center space-y-6 max-w-xl w-full">
          <p className="font-sans text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {RSVP_COPY.eyebrow}
          </p>

          <WelcomeEquation />

          {/* Event date + venue + countdown */}
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="font-sans text-base text-foreground">
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
            <h2 className="font-display text-2xl">{RSVP_COPY.searchHeading}</h2>
            <p className="font-sans text-sm text-muted-foreground">
              {RSVP_COPY.searchInstruction}
            </p>
          </div>
          <RsvpNameSearch />
        </div>
      </section>
    </div>
  );
}
