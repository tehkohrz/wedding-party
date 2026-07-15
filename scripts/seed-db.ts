/**
 * Seed the Supabase database from data/guests.csv (the ONLY data file —
 * groups are derived from the guest list's group_id column).
 *
 * Run: pnpm seed:db
 *
 * - Validates the CSV with the same Zod schema as the build pipeline.
 * - Derives groups from distinct group_ids, with auto-generated labels
 *   ("Sonya & Chris", "Justin, Kim & party") — see scripts/derive-groups.ts.
 *   Labels are seed defaults; rename in admin/table editor. Solo guests get
 *   a personal SOLO_<id> group so every guest is reachable by a link.
 * - Generates a kebab-case RSVP slug per guest ("John Tan" → "john-tan"),
 *   deduping collisions ("john-tan-2"). Slugs resolve to the guest's GROUP.
 * - UPSERTS guests/groups/slugs (idempotent — safe to re-run after editing
 *   the CSV). Existing RSVP responses on re-seeded guests are PRESERVED
 *   (only identity/seating columns — and group labels — are overwritten).
 *
 * The CSV is the *initial authoring format*. After seeding, the database
 * is the source of truth — edit guests via the admin page (or Supabase's
 * table editor), not by re-running this against a stale CSV.
 *
 * Env: reads SUPABASE_URL + SUPABASE_SECRET_KEY from .env.local
 * (parsed manually — standalone tsx scripts don't get Next's env loading).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Papa from "papaparse";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { GuestSchema } from "../lib/schema";
import { deriveGroups, groupIdOf } from "./derive-groups";

const ROOT = process.cwd();

// ─── Minimal .env.local loader ───────────────────────────────────────────────
function loadEnvLocal(): void {
  let raw: string;
  try {
    raw = readFileSync(resolve(ROOT, ".env.local"), "utf8");
  } catch {
    return; // fine — vars may come from the shell (CI, etc.)
  }
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnvLocal();

const SUPABASE_URL = process.env.SUPABASE_URL;
// SUPABASE_SECRET_KEY is canonical; old var name accepted as fallback.
const SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SECRET_KEY) {
  console.error(
    "✗ Missing SUPABASE_URL / SUPABASE_SECRET_KEY in .env.local — see README."
  );
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: { persistSession: false },
});

// ─── Parse CSVs (same validation as the old build pipeline) ─────────────────
function parseCsv<T>(filename: string, schema: z.ZodType<T>): T[] {
  const raw = readFileSync(resolve(ROOT, "data", filename), "utf8");
  const parsed = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length > 0) {
    console.error(`[${filename}] CSV parse errors:`);
    parsed.errors.forEach((e) => console.error(`  - ${e.message}`));
    process.exit(1);
  }
  const rows: T[] = [];
  parsed.data.forEach((row, i) => {
    const v = schema.safeParse(row);
    if (!v.success) {
      console.error(`[${filename}] row ${i + 2} failed validation:`);
      console.error(JSON.stringify(v.error.issues, null, 2));
      process.exit(1);
    }
    rows.push(v.data);
  });
  return rows;
}

/** "John Tan" → "john-tan" (ASCII-ish kebab; non-alphanumerics collapse to -) */
function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const guests = parseCsv("guests.csv", GuestSchema);

  // Groups are derived from the guest list itself — every group_id resolves
  // by construction, and solo guests get personal SOLO_<id> groups.
  const groupRows = deriveGroups(guests);

  // One slug per guest, deduped, resolving to their (possibly solo) group.
  // guest_id records whose name the slug is — used by the landing search to
  // route a found guest to their own link.
  const seen = new Map<string, number>();
  const slugRows = guests.map((g) => {
    const base = slugify(g.name) || `guest-${g.id}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return {
      slug: n === 1 ? base : `${base}-${n}`,
      group_id: groupIdOf(g),
      guest_id: g.id,
    };
  });

  // Identity/seating columns only — never clobber RSVP answers on re-seed.
  const guestRows = guests.map((g) => ({
    id: g.id,
    name: g.name,
    search_aliases: g.search_aliases.join(";"),
    side: g.side,
    group_id: groupIdOf(g),
    is_kid: g.is_kid,
    row_num: g.row ?? null,
    section: g.section,
    seat: g.seat ?? null,
  }));

  console.log("Seeding Supabase...");

  const up1 = await supabase.from("groups").upsert(groupRows);
  if (up1.error) fail("groups", up1.error.message);

  const up2 = await supabase.from("guests").upsert(guestRows);
  if (up2.error) fail("guests", up2.error.message);

  const up3 = await supabase.from("rsvp_slugs").upsert(slugRows);
  if (up3.error) fail("rsvp_slugs", up3.error.message);

  console.log(
    `✓ Seeded ${groupRows.length} groups, ${guestRows.length} guests, ${slugRows.length} slugs.`
  );
  console.log("\nPersonal RSVP links:");
  for (const s of slugRows) console.log(`  /r/${s.slug}`);
}

function fail(table: string, msg: string): never {
  console.error(`✗ upsert into ${table} failed: ${msg}`);
  process.exit(1);
}

main();
