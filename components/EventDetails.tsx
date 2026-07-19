/**
 * The landing page's details section — below the fold, under the name
 * search, reached via the big "Details" anchor in the hero.
 *
 * Design: OPEN EDITORIAL — no containing boxes. Sections are typographic
 * (small-caps labels echoing the menu step's course treatment), separated
 * by small bouquet-colored dot dividers. Only the map keeps a frame, being
 * a functional widget rather than text. Matches the airy invitation feel
 * of the hero above.
 *
 * The map embed is keyless (…/maps?q=…&output=embed — no API key), driven
 * by EVENT_DETAILS.mapQuery, which also powers the directions URL so the
 * pin and directions always agree.
 *
 * Server component — no hooks, renders to static HTML.
 */
import { Shirt, MapPin, ExternalLink } from "lucide-react";
import { EVENT_DETAILS } from "@/lib/content";
import { ScheduleBlock } from "@/components/ScheduleBlock";
import { PigeonSignoff } from "@/components/PigeonSignoff";

export function EventDetails() {
  const q = encodeURIComponent(EVENT_DETAILS.mapQuery);
  const embedSrc = `https://www.google.com/maps?q=${q}&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${q}`;

  return (
    <div id="details" className="scroll-mt-10 max-w-xl mx-auto text-center">
      {/* Schedule — shared with the RSVP flow (components/ScheduleBlock) */}
      <ScheduleBlock />

      <DotDivider />

      {/* Attire */}
      <SectionLabel icon={<Shirt className="size-5" />} label="Dress Code" />
      <p className="font-display text-2xl sm:text-3xl mt-3">{EVENT_DETAILS.attire}</p>

      <DotDivider />

      {/* Location */}
      <SectionLabel icon={<MapPin className="size-5" />} label="Location" />
      <div className="mt-3 space-y-1">
        <p className="font-display text-2xl sm:text-3xl">{EVENT_DETAILS.venueName}</p>
        {EVENT_DETAILS.venueAddress && (
          <p className="font-display uppercase tracking-[0.15em] text-base sm:text-lg text-muted-foreground">
            {EVENT_DETAILS.venueAddress}
          </p>
        )}
      </div>

      <iframe
        src={embedSrc}
        title={`Map of ${EVENT_DETAILS.venueName}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="w-full aspect-video rounded-card border border-border mt-4"
      />

      <a
        href={directionsUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 font-sans text-base text-primary hover:underline mt-3"
      >
        <ExternalLink className="size-3.5" /> Get directions
      </a>

      {/* The pigeon pair signs off the invitation content. */}
      <PigeonSignoff />
    </div>
  );
}

/** Small-caps section label — echoes the menu step's course treatment. */
function SectionLabel({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <p
      className="flex items-center justify-center gap-2.5 font-display font-bold text-xl sm:text-2xl uppercase tracking-[0.25em]"
      style={{ color: "hsl(var(--invite-olive-text))" }}
    >
      {icon}
      {label}
    </p>
  );
}

/** Three bouquet-colored dots between sections — a quiet ornament. */
function DotDivider() {
  return (
    <div className="flex items-center justify-center gap-2 my-8" aria-hidden>
      {["rose", "marigold", "sky"].map((c) => (
        <span
          key={c}
          className="size-1.5 rounded-full"
          style={{ backgroundColor: `hsl(var(--${c}) / 0.6)` }}
        />
      ))}
    </div>
  );
}
