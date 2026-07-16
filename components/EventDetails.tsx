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
import { Clock, Shirt, MapPin, ExternalLink } from "lucide-react";
import { EVENT_DETAILS } from "@/lib/content";

export function EventDetails() {
  const q = encodeURIComponent(EVENT_DETAILS.mapQuery);
  const embedSrc = `https://www.google.com/maps?q=${q}&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${q}`;

  return (
    <div id="details" className="scroll-mt-10 max-w-xl mx-auto text-center">
      {/* Schedule */}
      <SectionLabel icon={<Clock className="size-3.5" />} label="Schedule" />
      <ul className="inline-block mt-3">
        {EVENT_DETAILS.schedule.map((row) => (
          <li
            key={row.time}
            className="flex items-baseline gap-4 font-sans text-base text-left leading-relaxed"
          >
            <span className="tabular-nums text-muted-foreground w-14 shrink-0">
              {row.time}
            </span>
            <span>{row.item}</span>
          </li>
        ))}
      </ul>

      <DotDivider />

      {/* Attire */}
      <SectionLabel icon={<Shirt className="size-3.5" />} label="Attire" />
      <p className="font-display text-xl mt-3">{EVENT_DETAILS.attire}</p>

      <DotDivider />

      {/* Location */}
      <SectionLabel icon={<MapPin className="size-3.5" />} label="Location" />
      <div className="mt-3 space-y-1">
        <p className="font-display text-xl">{EVENT_DETAILS.venueName}</p>
        {EVENT_DETAILS.venueAddress && (
          <p className="font-sans text-sm text-muted-foreground">
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
        className="inline-flex items-center gap-1.5 font-sans text-sm text-primary hover:underline mt-3"
      >
        <ExternalLink className="size-3.5" /> Get directions
      </a>
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
    <p className="flex items-center justify-center gap-2 font-sans text-xs uppercase tracking-[0.25em] text-muted-foreground">
      <span className="text-primary">{icon}</span>
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
