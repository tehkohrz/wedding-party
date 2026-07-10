/**
 * Generate PWA PNG icons from assets/icon-source.svg.
 *
 * Run: pnpm icons
 * Re-run whenever you replace icon-source.svg with real artwork.
 *
 * Outputs into public/icons/:
 *   icon-192.png            Android / general
 *   icon-512.png            Android / general (splash)
 *   icon-maskable-512.png   Android maskable (safe-zone padded)
 *   apple-touch-icon.png    iOS home-screen icon (180x180)
 */
import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const SRC = resolve(ROOT, "assets/icon-source.svg");
const OUT = resolve(ROOT, "public/icons");
mkdirSync(OUT, { recursive: true });

const svg = readFileSync(SRC);

async function render(size, filename) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(resolve(OUT, filename));
  console.log(`✓ ${filename} (${size}x${size})`);
}

// Maskable: Android crops icons to various shapes, so the meaningful art must
// sit within an ~80% "safe zone". We add padding by rendering the art smaller
// on a full-bleed background of the same brand color.
async function renderMaskable(size, filename) {
  const inner = Math.round(size * 0.72);
  const pad = Math.round((size - inner) / 2);
  const art = await sharp(svg, { density: 384 })
    .resize(inner, inner)
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: "#1FA6EB", // must match the icon background color
    },
  })
    .composite([{ input: art, top: pad, left: pad }])
    .png()
    .toFile(resolve(OUT, filename));
  console.log(`✓ ${filename} (${size}x${size}, maskable)`);
}

await render(192, "icon-192.png");
await render(512, "icon-512.png");
await render(180, "apple-touch-icon.png");
await renderMaskable(512, "icon-maskable-512.png");
console.log("Done.");
