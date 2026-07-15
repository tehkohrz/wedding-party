"use client";

/**
 * Crossfading photo slideshow for the RSVP/check-in photo side.
 *
 * Photos come from RSVP_COPY.photos (files in public/photos/, listed in
 * lib/content.ts). Behavior:
 *   - 0 photos  → soft bouquet gradient placeholder (the pre-photo look)
 *   - 1 photo   → static image, no timer
 *   - N photos  → crossfade every slideshowIntervalSeconds
 *   - reduced motion → first photo static, no cycling
 *
 * Images use plain CSS background layers (not next/image) so two stacked
 * layers can crossfade with a single opacity transition — simple and GPU-
 * cheap. object-fit is handled by background-size: cover.
 */
import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { RSVP_COPY } from "@/lib/content";

/** Accept both "/photos/one.jpg" and bare "one.jpg" (auto-prefixed). */
function normalize(src: string): string {
  return src.startsWith("/") ? src : `/photos/${src}`;
}

/**
 * Panel sizing lives HERE (not at the call sites) and is driven by two
 * [input] fields in lib/content.ts:
 *   - RSVP_COPY.photoPanelWidthPercent  (landscape/desktop width)
 *   - RSVP_COPY.photoBannerHeightVh     (portrait-phone banner height)
 *
 * Tailwind's JIT can't build class names from runtime numbers, so the
 * values flow through CSS variables: inline style sets --photo-panel-w /
 * --photo-banner-h, and the (static, JIT-visible) arbitrary-value classes
 * read them with var().
 */
const PANEL_CLASSES =
  "relative overflow-hidden shrink-0 " +
  "h-[var(--photo-banner-h)] landscape:h-full landscape:w-[var(--photo-panel-w)]";

const PANEL_VARS = {
  "--photo-panel-w": `${RSVP_COPY.photoPanelWidthPercent}%`,
  "--photo-banner-h": `${RSVP_COPY.photoBannerHeightVh}vh`,
} as React.CSSProperties;

export function PhotoSlideshow({ className }: { className?: string }) {
  const photos = RSVP_COPY.photos.map(normalize);
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  const cycling = photos.length > 1 && !reduceMotion;

  useEffect(() => {
    if (!cycling) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % photos.length),
      Math.max(2, RSVP_COPY.slideshowIntervalSeconds) * 1000
    );
    return () => clearInterval(id);
  }, [cycling, photos.length]);

  // No photos yet: the soft gradient placeholder.
  if (photos.length === 0) {
    return (
      <div
        className={cn(
          PANEL_CLASSES,
          "bg-gradient-to-br from-rose/30 via-peach/20 to-marigold/20",
          className
        )}
        style={PANEL_VARS}
        aria-hidden
      />
    );
  }

  return (
    <div className={cn(PANEL_CLASSES, className)} style={PANEL_VARS} aria-hidden>
      {photos.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] ease-in-out"
          style={{
            backgroundImage: `url(${src})`,
            opacity: i === index ? 1 : 0,
          }}
        />
      ))}
    </div>
  );
}
