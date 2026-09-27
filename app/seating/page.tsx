// /seating shows the lunch seating overview on the projector after the
// solemnization. It makes no database calls, so it still loads if Supabase
// is down on the day.

import { Fredoka } from "next/font/google";
import { SeatingOverview } from "@/components/SeatingOverview";
import { SEATING_OVERVIEW } from "@/lib/content";

// Rounded, friendly face for the floor plan labels. It loads here rather
// than in the root layout, so only this page downloads it.
const signage = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  display: "swap",
});

// Party pigeons flank the title and lean outward. Each head is cut flat at
// the neck, so its bottom fades out instead of ending in a hard edge.
const PIGEONS = [
  { src: "/pigeon-head.png", place: "right-full mr-6" },
  { src: "/pigeon-head-teal.png", place: "left-full ml-6 -scale-x-100" },
];
const NECK_FADE = "linear-gradient(to bottom, black 60%, transparent 95%)";

export default function SeatingOverviewPage() {
  return (
    <main className={`${signage.variable} invite-stripes h-dvh w-screen overflow-hidden p-5`}>
      <div className="invite-card flex h-full flex-col p-2">
        <div className="invite-card-inner flex min-h-0 flex-1 flex-col items-center px-10 pb-6 pt-8">
          {/* Type matches the invitation hero, with a pink script title
              between olive small caps lines. */}
          <header className="text-center">
            <p
              className="font-display text-xl font-semibold uppercase tracking-[0.3em]"
              style={{ color: "hsl(var(--invite-olive-text))" }}
            >
              {SEATING_OVERVIEW.eyebrow}
            </p>
            {/* The pigeons hang off the title's box, so the title stays centred. */}
            <div className="relative inline-block">
              {PIGEONS.map(({ src, place }) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={src}
                  src={src}
                  alt=""
                  aria-hidden
                  className={`pointer-events-none absolute top-1/2 w-40 -translate-y-1/2 select-none ${place}`}
                  style={{ maskImage: NECK_FADE, WebkitMaskImage: NECK_FADE }}
                />
              ))}
              <h1
                className="text-8xl leading-tight"
                style={{
                  fontFamily: "var(--font-script)",
                  color: "hsl(var(--invite-pink))",
                }}
              >
                {SEATING_OVERVIEW.title}
              </h1>
            </div>
            <p
              className="font-display text-2xl uppercase tracking-[0.28em]"
              style={{ color: "hsl(var(--invite-olive-text))" }}
            >
              {SEATING_OVERVIEW.note}
            </p>
          </header>
          <SeatingOverview className="min-h-0 w-full flex-1" />
        </div>
      </div>
    </main>
  );
}
