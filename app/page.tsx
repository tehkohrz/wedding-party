// Screen 1 — Welcome.
// Name search wired: typing finds matching guests, tap to advance to /group.
//
// Layout strategy:
//   - h-dvh + overflow-hidden = locked to viewport, no scrolling
//   - landscape: split (photo left, form right)
//   - portrait: stacked (photo top, form bottom)
//   - One component, Tailwind `landscape:` modifier handles the swap

import { COUPLE, WELCOME_COPY } from "@/lib/content";
import { NameSearch } from "@/components/NameSearch";
import { Flower2, Leaf } from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col landscape:flex-row">
      <PhotoSide />
      <FormSide />
    </div>
  );
}

// ─── Photo side ──────────────────────────────────────────────────────────────
// Placeholder shown until you drop a real photo into `public/`.
// JPEG, PNG, or WebP all work. To swap in your photo:
//   1. Drop the file at e.g. `public/couple.jpg`.
//   2. Replace the inner content of <PhotoSide /> below with:
//      <Image
//        src="/couple.jpg"
//        alt="The couple"
//        fill
//        priority
//        className="object-cover"
//      />
//   3. Add `import Image from "next/image"` at the top of this file.

function PhotoSide() {
  return (
    <div
      className="
        relative
        h-[40%] landscape:h-full
        landscape:w-[45%]
        bg-gradient-to-br from-rose/30 via-peach/20 to-marigold/20
        flex items-center justify-center
        overflow-hidden
      "
    >
      <div className="text-center p-8 space-y-2">
        <p className="font-sans text-xs uppercase tracking-widest text-foreground/40">
          photo placeholder
        </p>
        <p className="font-display text-2xl text-foreground/60">
          {COUPLE.brideName} & {COUPLE.groomName}
        </p>
        <p className="font-sans text-xs text-foreground/40">
          drop your photo at public/couple.webp
        </p>
      </div>
    </div>
  );
}

// ─── Form side ───────────────────────────────────────────────────────────────
// Plain warm-cream background with content centered both axes.
// Two decorative SVG flourishes in opposing corners — tint-able via text-* colors.
// Swap Flower2/Leaf for your own SVGs when you have them (see CLAUDE.md / docs).

function FormSide() {
  return (
    <section
      className="
        relative flex-1
        bg-background
        flex flex-col items-center justify-center
        px-6 py-8
      "
    >
      {/* Flourishes — swap for custom SVGs later */}
      <Flower2
        className="absolute top-6 left-6 size-12 text-rose/50"
        strokeWidth={1.25}
        aria-hidden
      />
      <Leaf
        className="absolute bottom-6 right-6 size-12 text-sage/60"
        strokeWidth={1.25}
        aria-hidden
      />

      <div className="text-center space-y-6 max-w-xl">
        {/* Names equation — five stacked lines:
              brideName
                  +
              groomName
                  =
              unionWord

            To tweak:
              - Name size:      text-7xl on the name spans
              - Operator size:  text-5xl on the + and = spans
              - Operator color: text-marigold → swap for text-sky, text-rose, etc.
              - Result style:   italic + text-primary; remove italic for a flatter look
        */}
        <header className="space-y-4">
          <h1 className="font-display leading-tight">
            <span className="block text-7xl">{COUPLE.brideName}</span>
            <span className="block text-5xl font-bold text-marigold py-2">
              +
            </span>
            <span className="block text-7xl">{COUPLE.groomName}</span>
            <span className="block text-5xl font-bold text-marigold py-2">
              =
            </span>
            <span className="block text-7xl italic text-primary">
              {COUPLE.unionWord}
            </span>
          </h1>
          <p className="font-sans text-base text-muted-foreground pt-2">
            {COUPLE.weddingDate}
            {COUPLE.venue && ` · ${COUPLE.venue}`}
          </p>
        </header>

        {/* Greeting + instruction */}
        <div className="space-y-1 pt-2">
          <h2 className="font-display text-2xl">{WELCOME_COPY.greeting}</h2>
          <p className="font-sans text-sm text-muted-foreground">
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
