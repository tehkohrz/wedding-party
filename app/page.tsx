// RSVP landing — the main public URL guests receive.
//
// Stage 0 placeholder: establishes the route and the photo/content split.
// Stage 1 replaces the right side with the real RSVP entry (event details +
// name search) and the left side with the photo slideshow.
//
// Day-of check-in now lives at /checkin.

import { COUPLE } from "@/lib/content";
import { WelcomeEquation } from "@/components/WelcomeEquation";

export default function RsvpLandingPage() {
  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col landscape:flex-row">
      {/* Photo side — Stage 1 swaps in the slideshow component. */}
      <div
        className="
          relative
          h-[40%] landscape:h-full landscape:w-[45%]
          bg-gradient-to-br from-rose/30 via-peach/20 to-marigold/20
          flex items-center justify-center overflow-hidden
        "
      >
        <p className="font-sans text-xs uppercase tracking-widest text-foreground/40">
          photo slideshow — coming in stage 1
        </p>
      </div>

      {/* Content side */}
      <section className="relative flex-1 bg-background flex flex-col items-center justify-center px-6 py-8">
        <div className="text-center space-y-6 max-w-xl">
          <WelcomeEquation />
          <p className="font-sans text-base text-muted-foreground">
            {COUPLE.weddingDate}
            {COUPLE.venue && ` · ${COUPLE.venue}`}
          </p>
          <p className="font-sans text-sm text-muted-foreground">
            RSVP flow coming in Stage 1 — check-in has moved to{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded">/checkin</code>.
          </p>
        </div>
      </section>
    </div>
  );
}
