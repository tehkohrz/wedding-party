/**
 * Celebration confetti — fired once when a guest successfully checks in.
 *
 * Colors are read from the ACTIVE theme's bouquet CSS variables at call time,
 * so the confetti always matches whatever palette is loaded. The variables
 * hold bare HSL triplets (e.g. "335 100% 62%"). Each is brightened before use
 * (see MIN_LIGHTNESS / MIN_SATURATION) — the deeper theme colors look muddy
 * in flight.
 *
 * Browser-only (reads document / canvas). Call from a client component.
 */
import confetti from "canvas-confetti";

const BOUQUET_VARS = [
  "--lavender",
  "--rose",
  "--marigold",
  "--sage",
  "--sky",
  "--peach",
] as const;

// Confetti vibrancy — applied to the confetti only; the theme's own colors are
// untouched.
//
// We take ONLY THE HUE from each bouquet token and render it at a fixed,
// vivid saturation + lightness. A floor wasn't enough: several tokens are
// deliberately deep (bride-2's --rose is 36% lightness, --sage is 33%), and
// deep hues still read muddy as small, fading, fast-moving particles.
// Normalizing guarantees every piece is equally bright, while the hues keep
// the confetti recognisably "this wedding's palette".
//
// Tune to taste:
//   CONFETTI_LIGHTNESS   50 = purest/most saturated hue; 65–72 = bright and
//                        luminous; past ~78 it washes out toward pastel.
//   CONFETTI_SATURATION  100 = maximum chroma. Lower for a softer look.
const CONFETTI_LIGHTNESS = 90;
const CONFETTI_SATURATION = 100;

/**
 * Turn a bare HSL triplet from a theme variable (e.g. "1 100% 36%") into a
 * bright `hsl(...)` string: hue preserved, saturation and lightness forced to
 * the vivid constants above. Falls back to the raw value if unparseable.
 */
function vivid(triplet: string): string {
  const hue = parseFloat(triplet.split(/\s+/)[0]);
  if (!Number.isFinite(hue)) return `hsl(${triplet})`;
  return `hsl(${hue} ${CONFETTI_SATURATION}% ${CONFETTI_LIGHTNESS}%)`;
}

function bouquetColors(): string[] {
  const root = getComputedStyle(document.documentElement);
  return BOUQUET_VARS.map((v) => {
    const triplet = root.getPropertyValue(v).trim();
    return triplet ? vivid(triplet) : "#cccccc";
  });
}

/** True if the OS asks for reduced motion. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * One celebratory burst from four emitters on the left and right edges — two
 * at mid-height, two at the bottom corners — all firing upward and inward.
 * Slow, floaty physics so the confetti drifts across the screen rather than
 * snapping past.
 *
 * `angle` is degrees, counter-clockwise: 0 = right, 90 = straight up.
 * So 60 = up-and-right (left edge), 120 = up-and-left (right edge).
 *
 * Speed / feel knobs:
 *   startVelocity  launch speed (lower = gentler)
 *   gravity        fall rate (below 1 = floaty, hangs in the air)
 *   decay          air resistance per frame (closer to 1 = travels further)
 *   ticks          lifespan in frames (higher = stays on screen longer)
 *
 * No-ops entirely when reduced motion is requested.
 */
export function celebrate(): void {
  if (prefersReducedMotion()) return;

  const colors = bouquetColors();
  const shared = {
    // 45 x 4 emitters = 180 particles — festive without tanking frame rate.
    particleCount: 40,
    spread: 70,
    startVelocity: 30, // was 45 — gentler launch
    gravity: 0.75, // was 1 (default) — floats down slowly
    decay: 0.95, // slightly less drag, so they travel across
    ticks: 200, // was 220 — stays on screen roughly twice as long
    scalar: 1.25, // larger pieces = more visible color area
    colors,
    disableForReducedMotion: true, // belt-and-braces
  } as const;

  // LEFT edge, both firing up and to the right.
  confetti({ ...shared, angle: 60, origin: { x: 0, y: 1 } }); // bottom corner
  confetti({ ...shared, angle: 20, spread: 120, origin: { x: 0, y: 0.5 } }); // mid height

  // RIGHT edge, both firing up and to the left.
  confetti({ ...shared, angle: 120, origin: { x: 1, y: 1 } }); // bottom corner
  confetti({ ...shared, angle: 160, spread: 120, origin: { x: 1, y: 0.5 } }); // mid height
}
