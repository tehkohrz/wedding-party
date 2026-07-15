/**
 * Resize/compress slideshow photos for the web, IN PLACE.
 *
 * Run: pnpm photos
 *
 * Any .jpg/.jpeg/.png in public/photos/ larger than ~400KB is rewritten:
 * resized to fit within 2000px (long edge, never upscaled) and re-encoded
 * as progressive JPEG q80 — plenty for a full-bleed background, ~50-100x
 * smaller than camera originals.
 *
 * In-place is deliberate: camera originals don't belong in the repo. Your
 * source-of-truth photos live in your photo library; these are web copies.
 */
import sharp from "sharp";
import { readdirSync, statSync, renameSync } from "node:fs";
import { resolve, extname } from "node:path";

const DIR = resolve(process.cwd(), "public/photos");
const THRESHOLD = 400 * 1024; // skip files already small
const LONG_EDGE = 2000;

let files;
try {
  files = readdirSync(DIR).filter((f) =>
    [".jpg", ".jpeg", ".png"].includes(extname(f).toLowerCase())
  );
} catch {
  console.log("public/photos/ doesn't exist — nothing to do.");
  process.exit(0);
}

for (const file of files) {
  const path = resolve(DIR, file);
  const before = statSync(path).size;
  if (before < THRESHOLD) {
    console.log(`· ${file} — ${kb(before)}, already small, skipped`);
    continue;
  }

  const tmp = path + ".tmp";
  await sharp(path)
    .rotate() // apply EXIF orientation so phones' sideways photos display upright
    .resize(LONG_EDGE, LONG_EDGE, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80, progressive: true, mozjpeg: true })
    .toFile(tmp);
  renameSync(tmp, path);

  const after = statSync(path).size;
  console.log(`✓ ${file} — ${kb(before)} → ${kb(after)}`);
}

function kb(n) {
  return n > 1024 * 1024
    ? (n / 1024 / 1024).toFixed(1) + "MB"
    : Math.round(n / 1024) + "KB";
}
