/**
 * The landing page's "Details" section — sits below the fold, under the
 * name search. Reached via the pulsing-arrow anchor in the hero.
 *
 * Three cards: Schedule (from EVENT_DETAILS.schedule), Attire, and Location
 * with an embedded Google Map + directions link. The map iframe uses the
 * keyless maps embed (…/maps?q=…&output=embed) — no API key required —
 * driven by EVENT_DETAILS.mapQuery, which also powers the directions URL,
 * so pin and directions always agree.
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
    <div id="details" className="scroll-mt-6 max-w-xl mx-auto space-y-4">
      <h2 className="font-display text-3xl text-center">
        {EVENT_DETAILS.detailsHeading}
      </h2>

      {/* Schedule */}
      <div className="rounded-card border border-border bg-surface px-5 py-4">
        <h3 className="flex items-center gap-2 font-display text-lg mb-2">
          <Clock className="size-4 text-primary" /> Schedule
        </h3>
        <ul className="space-y-1.5">
          {EVENT_DETAILS.schedule.map((row) => (
            <li
              key={row.time}
              className="flex items-baseline gap-3 font-sans text-sm"
            >
              <span className="tabular-nums text-muted-foreground w-12 shrink-0">
                {row.time}
              </span>
              <span>{row.item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Attire */}
      <div className="rounded-card border border-border bg-surface px-5 py-4">
        <h3 className="flex items-center gap-2 font-display text-lg mb-1">
          <Shirt className="size-4 text-primary" /> Attire
        </h3>
        <p className="font-sans text-sm">{EVENT_DETAILS.attire}</p>
      </div>

      {/* Location */}
      <div className="rounded-card border border-border bg-surface px-5 py-4 space-y-3">
        <div>
          <h3 className="flex items-center gap-2 font-display text-lg mb-1">
            <MapPin className="size-4 text-primary" /> Location
          </h3>
          <p className="font-sans text-sm">{EVENT_DETAILS.venueName}</p>
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
          className="w-full aspect-video rounded-lg border border-border"
        />

        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-sans text-sm text-primary hover:underline"
        >
          <ExternalLink className="size-3.5" /> Get directions
        </a>
      </div>
    </div>
  );
}
