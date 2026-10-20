/**
 * Generate the PWA icons from the couple's pigeon artwork (public/pigeons.png).
 *
 * Run: pnpm icons
 *
 * The pair sits on the card cream with the artwork's flat bottom cut on the
 * icon's bottom edge, so the cut never shows. Outputs into public/icons/:
 *   icon-192.png            Android / general, and the browser tab icon
 *   icon-512.png            Android / general (splash)
 *   icon-maskable-512.png   Android maskable (heads inside the safe zone)
 *   apple-touch-icon.png    iOS home-screen icon (180x180)
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const ART = resolve(ROOT, "public/pigeons.png");
const OUT = resolve(ROOT, "public/icons");
mkdirSync(OUT, { recursive: true });

// Matches background_color / theme_color in public/manifest.webmanifest and
// themeColor in app/layout.tsx.
const CREAM = "#FDFBF5";

// Share of the artwork's width that lands on the icon's centre line, which
// puts the two heads in the middle.
const HEADS = 0.5725;

/**
 * The pair on cream at `size` px. `scale` is the pair's width as a share of
 * the icon; above 1 it runs off both sides.
 */
async function compose(size, scale) {
  const width = Math.round(size * scale);
  const { data, info } = await sharp(ART)
    .resize({ width })
    .toBuffer({ resolveWithObject: true });
  const left = Math.round(size / 2 - width * HEADS);
  const top = size - info.height;

  // sharp refuses an overlay that spills past the canvas, so trim the
  // overhang off the artwork first.
  const trimLeft = Math.max(0, -left);
  const trimTop = Math.max(0, -top);
  const visible = await sharp(data)
    .extract({
      left: trimLeft,
      top: trimTop,
      width: Math.min(width - trimLeft, size - Math.max(0, left)),
      height: info.height - trimTop,
    })
    .toBuffer();

  return sharp({ create: { width: size, height: size, channels: 4, background: CREAM } })
    .composite([{ input: visible, left: Math.max(0, left), top: Math.max(0, top) }])
    .flatten({ background: CREAM })
    .png();
}

async function write(size, scale, filename) {
  await (await compose(size, scale)).toFile(resolve(OUT, filename));
  console.log(`✓ ${filename} (${size}x${size})`);
}

// Full icons fill the square edge to edge; iOS and browsers round the corners.
await write(192, 1.075, "icon-192.png");
await write(512, 1.075, "icon-512.png");
await write(180, 1.075, "apple-touch-icon.png");

// Android crops maskable icons to a circle or squircle, keeping only the
// central ~80%. A smaller pair keeps both heads inside that safe zone.
await write(512, 0.88, "icon-maskable-512.png");
console.log("Done.");
