/**
 * Seed the Supabase database from data/guests.csv + data/groups.csv.
 *
 * Run: pnpm seed:db
 *
 * - Validates the CSVs with the same Zod schemas as the old build pipeline.
 * - Generates a kebab-case RSVP slug per guest ("John Tan" → "john-tan"),
 *   deduping collisions ("john-tan-2"). Slugs resolve to the guest's GROUP.
 *   Solo guests (no group) get a personal group created for them
 *   (id: SOLO_<guestId>) so every guest is reachable by a slug.
 * - UPSERTS guests/groups/slugs (idempotent — safe to re-run after editing
 *   the CSVs). Existing RSVP responses on re-seeded guests are PRESERVED
 *   (only identity/seating columns are overwritten).
 *
 * The CSVs are the *initial authoring format*. After seeding, the database
 * is the source of truth — edit guests via the admin page (or Supabase's
 * table editor), not by re-running this against a stale CSV.
 *
 * Env: reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local
 * (parsed manually — standalone tsx scripts don't get Next's env loading).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Papa from "papaparse";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { GuestSchema, GroupSchema } from "../lib/schema";

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
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "✗ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local — see README."
  );
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
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
  const groups = parseCsv("groups.csv", GroupSchema);

  // Referential check (same as old pipeline).
  const groupIds = new Set(groups.map((g) => g.id));
  for (const g of guests) {
    if (g.group_id && !groupIds.has(g.group_id)) {
      console.error(`✗ Guest ${g.id} (${g.name}) references unknown group ${g.group_id}`);
      process.exit(1);
    }
  }

  // Solo guests get a personal group so their slug has something to resolve to.
  const soloGroups = guests
    .filter((g) => !g.group_id)
    .map((g) => ({ id: `SOLO_${g.id}`, label: g.name }));

  const groupRows = [
    ...groups.map((g) => ({ id: g.id, label: g.label })),
    ...soloGroups,
  ];

  // One slug per guest, deduped, resolving to their (possibly solo) group.
  const seen = new Map<string, number>();
  const slugRows = guests.map((g) => {
    const base = slugify(g.name) || `guest-${g.id}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return {
      slug: n === 1 ? base : `${base}-${n}`,
      group_id: g.group_id ?? `SOLO_${g.id}`,
    };
  });

  // Identity/seating columns only — never clobber RSVP answers on re-seed.
  const guestRows = guests.map((g) => ({
    id: g.id,
    name: g.name,
    search_aliases: g.search_aliases.join(";"),
    side: g.side,
    group_id: g.group_id ?? `SOLO_${g.id}`,
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
