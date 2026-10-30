// Screen 1 — Welcome.
// Name search wired: typing finds matching guests, tap to advance to /group.
//
// Layout strategy:
//   - h-dvh + overflow-hidden = locked to viewport, no scrolling
//   - landscape: split (photo left, form right). The photo side is the
//     RSVP pages' slideshow, so both share one photo list.
//   - portrait: stacked (photo top, form bottom)
//   - One component, Tailwind `landscape:` modifier handles the swap

import Link from "next/link";
import { WELCOME_COPY, ADMIN_COPY } from "@/lib/content";
import { EventDate } from "@/components/EventWhen";
import { NameSearch } from "@/components/NameSearch";
import { PhotoSlideshow } from "@/components/PhotoSlideshow";
import { WelcomeEquation } from "@/components/WelcomeEquation";
import { ForwardLink } from "@/components/WizardShell";
import { Flower2 } from "lucide-react";

// The two corner links use the invitation's small caps in the date's blue.
// The bright primary blue is too faint on cream at this size.
const CORNER_LINK =
  "z-40 px-3 py-2 font-display text-xl font-semibold uppercase tracking-[0.2em] underline-offset-4 hover:underline transition";
const CORNER_LINK_STYLE = { color: "hsl(var(--invite-blue))" };

export default function WelcomePage() {
  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col landscape:flex-row">
      <PhotoSlideshow />
      <FormSide />

      {/* Admin entry — bottom-right. PIN-gated (/admin), so a visible link
          is fine; the PIN stops guests. Plain Link (not a wizard route, so
          no slide direction to set). */}
      <Link
        href="/admin"
        className={`fixed bottom-4 right-4 ${CORNER_LINK}`}
        style={CORNER_LINK_STYLE}
      >
        {ADMIN_COPY.entryLabel}
      </Link>
    </div>
  );
}

// ─── Form side ───────────────────────────────────────────────────────────────
// Plain warm-cream background with content centered both axes.
// Two decorative SVG flourishes in opposing corners — tint-able via text-* colors.
// Swap the Flower2 for your own SVG when you have one.

function FormSide() {
  return (
    <section
      className="
        group relative flex-1
        bg-background
        flex flex-col items-center justify-center
        px-6 py-8
      "
    >
      {/* Flourish — top-left corner. */}
      <Flower2
        className="absolute top-6 left-6 size-12 text-rose/50"
        strokeWidth={1.25}
        aria-hidden
      />

      {/* Seating plan — bottom-left of the form area (beside the photo
          side in landscape). Opens the seating overview, with no check-in
          writes. ForwardLink because /find is a wizard route (slide
          transition). */}
      <ForwardLink
        href="/find"
        className={`absolute bottom-4 left-4 ${CORNER_LINK}`}
        style={CORNER_LINK_STYLE}
      >
        {WELCOME_COPY.seatingPlanLink}
      </ForwardLink>

      <div className="text-center space-y-6 max-w-xl">
        {/* Names equation (bride + groom = unionWord), staggered entrance.
            Sizes/colors/stagger are tweakable in components/WelcomeEquation.tsx.
            It hides while search results are open, so five results fit on
            the iPad without pushing the page off screen. */}
        <header className="space-y-6 group-has-[[data-searching]]:hidden">
          <WelcomeEquation />
          {/* The RSVP pages' date block: olive rule, blue italic date. */}
          <EventDate className="text-2xl sm:text-3xl" />
        </header>

        {/* Greeting + instruction, both in the display serif. The
            instruction is the line guests act on, so it keeps the main text
            colour and semibold weight (Cormorant's thin strokes fade
            otherwise). */}
        <div className="space-y-2 pt-2">
          <h2 className="font-display text-4xl sm:text-5xl font-semibold">
            {WELCOME_COPY.greeting}
          </h2>
          <p className="font-display text-xl sm:text-2xl font-semibold text-foreground text-balance">
            {WELCOME_COPY.instruction}
          </p>
        </div>

        {/* Name input — fuzzy search across `name` and `search_aliases`.
            Tapping a result writes to the wizard store and advances to /group. */}
        <NameSearch />
      </div>
    </section>
  );
}
