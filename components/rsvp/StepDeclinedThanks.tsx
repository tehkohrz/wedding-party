"use client";

/**
 * Final screen of the decline path — warm sign-off after a whole-party
 * decline. (Stage 4 makes the preceding confirm actually persist the
 * decline; this screen is purely presentational.)
 */
import { Heart } from "lucide-react";
import { RSVP_STEPS_COPY } from "@/lib/content";

export function StepDeclinedThanks() {
  return (
    <div className="space-y-4 text-center py-8">
      <Heart className="size-10 mx-auto text-rose" strokeWidth={1.5} />
      <h2 className="font-display font-bold text-3xl">
        {RSVP_STEPS_COPY.declinedThanksHeading}
      </h2>
      <p className="font-sans text-sm text-muted-foreground max-w-md mx-auto">
        {RSVP_STEPS_COPY.declinedThanksBody}
      </p>
    </div>
  );
}
