/**
 * Seed the Supabase database from data/guests.csv (the ONLY data file —
 * groups are derived from the guest list's group_id column).
 *
 * Run: pnpm seed:db
 *
 * - Validates the CSV with the same Zod schema as the build pipeline.
 * - Derives groups from distinct group_ids, with auto-generated labels
 *   ("Sonya & Chris", "Justin, Kim & party") — see scripts/derive-groups.ts.
 *   EXISTING groups keep their labels (custom names survive re-seeds); only
 *   new group ids are inserted. Solo guests get a personal SOLO_<id> group
 *   so every guest is reachable by a link.
 * - REFUSES to overwrite group assignments that differ from the database
 *   (admin edits may be newer than the CSV) unless run with --force-groups.
 * - Generates a kebab-case RSVP slug per guest ("John Tan" → "john-tan"),
 *   deduping collisions ("john-tan-2"). Slugs resolve to the guest's GROUP.
 * - UPSERTS guests/groups/slugs (idempotent — safe to re-run after editing
 *   the CSV). Existing RSVP responses on re-seeded guests are PRESERVED
 *   (only identity/seating columns — and group labels — are overwritten).
 * - PRUNES leftovers from previous seeds: groups no guest belongs to any
 *   more (e.g. after renumbering group ids in the CSV) and slugs that no
 *   longer match any current guest name. ⚠ Once links have been SENT,
 *   renaming a guest in the CSV + re-seeding kills their old link — after
 *   send-out, rename via the admin page instead (it ADDS a new slug and
 *   keeps the old one working).
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
import { slugify } from "../lib/slug";
import {
  deriveRsvpGroups,
  deriveSeatingGroups,
  rsvpGroupIdOf,
} from "./derive-groups";

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


async function main() {
  const guests = parseCsv("guests.csv", GuestSchema);

  // Both group kinds are derived from the guest list itself (see
  // scripts/derive-groups.ts): rsvp groups (who responds together; solo
  // guests get SOLO_<id>) and seating groups (who sits/arrives together).
  const rsvpGroupRows = deriveRsvpGroups(guests);
  const seatingGroupRows = deriveSeatingGroups(guests);

  // One slug per guest, deduped, resolving to their RSVP group — EXCEPT
  // plus-ones: they're placeholder rows the main guest answers for, so a
  // personal link would be meaningless (and the name may change anyway).
  const seen = new Map<string, number>();
  const slugRows = guests.filter((g) => !g.is_plus_one).map((g) => {
    const base = slugify(g.name) || `guest-${g.id}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return {
      slug: n === 1 ? base : `${base}-${n}`,
      group_id: rsvpGroupIdOf(g),
      guest_id: g.id,
    };
  });

  // Identity/seating columns only — never clobber RSVP answers on re-seed.
  const guestRows = guests.map((g) => ({
    id: g.id,
    name: g.name,
    search_aliases: g.search_aliases.join(";"),
    side: g.side,
    rsvp_group_id: rsvpGroupIdOf(g),
    seating_group_id: g.seating_group_id,
    is_kid: g.is_kid,
    is_plus_one: g.is_plus_one,
    row_num: g.row ?? null,
    section: g.section,
    seat: g.seat ?? null,
  }));

  // ─── Divergence guard ────────────────────────────────────────────────────
  // The database may hold NEWER group assignments than the CSV (the admin
  // page edits groups live). Re-seeding would silently overwrite them —
  // exactly how a carefully-split RSVP grouping gets lost. Detect the
  // mismatch and stop; pass --force-groups only when the CSV is the truth.
  const force = process.argv.includes("--force-groups");
  const dbGuests = await supabase
    .from("guests")
    .select("id, name, rsvp_group_id, seating_group_id");
  if (!dbGuests.error && (dbGuests.data ?? []).length > 0) {
    const byId = new Map(dbGuests.data.map((g) => [g.id as number, g]));
    const diverged = guestRows.filter((g) => {
      const cur = byId.get(g.id);
      return (
        cur &&
        (cur.rsvp_group_id !== g.rsvp_group_id ||
          cur.seating_group_id !== g.seating_group_id)
      );
    });
    if (diverged.length > 0 && !force) {
      console.error(
        `✗ ${diverged.length} guest(s) have different group assignments in the DATABASE than in the CSV — the database may be newer (admin edits).`
      );
      for (const g of diverged.slice(0, 10)) {
        const cur = byId.get(g.id)!;
        console.error(
          `    #${g.id} ${g.name}: rsvp ${cur.rsvp_group_id} → ${g.rsvp_group_id}, seating ${cur.seating_group_id} → ${g.seating_group_id}`
        );
      }
      if (diverged.length > 10)
        console.error(`    …and ${diverged.length - 10} more`);
      console.error(
        "  If the CSV is correct, re-run with:  pnpm seed:db --force-groups\n  If the database is correct, update the CSV to match first."
      );
      process.exit(1);
    }
  }

  console.log("Seeding Supabase...");

  // ignoreDuplicates: existing groups KEEP their labels (custom names like
  // "Lee Party" set in admin/table editor survive a re-seed); only brand-new
  // group ids are inserted with auto-derived labels.
  const up1 = await supabase
    .from("rsvp_groups")
    .upsert(rsvpGroupRows, { onConflict: "id", ignoreDuplicates: true });
  if (up1.error) fail("rsvp_groups", up1.error.message);

  const up2 = await supabase
    .from("seating_groups")
    .upsert(seatingGroupRows, { onConflict: "id", ignoreDuplicates: true });
  if (up2.error) fail("seating_groups", up2.error.message);

  const up3 = await supabase.from("guests").upsert(guestRows);
  if (up3.error) fail("guests", up3.error.message);

  const up4 = await supabase.from("rsvp_slugs").upsert(slugRows);
  if (up4.error) fail("rsvp_slugs", up4.error.message);

  console.log(
    `✓ Seeded ${rsvpGroupRows.length} rsvp groups, ${seatingGroupRows.length} seating groups, ${guestRows.length} guests, ${slugRows.length} slugs.`
  );

  // ─── Prune leftovers from previous seeds ───────────────────────────────
  // Renumbering group ids or renaming guests in the CSV leaves the OLD
  // rows behind (upsert never deletes) — duplicate-looking groups with no
  // members, and slugs for names that no longer exist. Slugs go first
  // (they hold a foreign key into rsvp_groups). Groups still referenced
  // by any guest in the DB are kept, so guests that were removed from the
  // CSV (but kept in the DB) don't lose their group.
  const keepSlugs = slugRows.map((s) => s.slug);
  const delSlugs = await supabase
    .from("rsvp_slugs")
    .delete()
    .not("slug", "in", `(${keepSlugs.map((s) => `"${s}"`).join(",")})`)
    .select("slug");
  if (delSlugs.error) fail("rsvp_slugs prune", delSlugs.error.message);

  const afterSeed = await supabase
    .from("guests")
    .select("rsvp_group_id, seating_group_id");
  if (afterSeed.error) fail("guests read-back", afterSeed.error.message);
  const keepRsvp = new Set([
    ...rsvpGroupRows.map((g) => g.id),
    ...(afterSeed.data ?? []).map((g) => g.rsvp_group_id).filter(Boolean),
  ]);
  const keepSeating = new Set([
    ...seatingGroupRows.map((g) => g.id),
    ...(afterSeed.data ?? []).map((g) => g.seating_group_id).filter(Boolean),
  ]);

  const pruneGroups = async (table: string, keep: Set<string>) => {
    const res = await supabase
      .from(table)
      .delete()
      .not("id", "in", `(${[...keep].map((s) => `"${s}"`).join(",")})`)
      .select("id");
    if (res.error) fail(`${table} prune`, res.error.message);
    return res.data?.length ?? 0;
  };
  const prunedRsvp = await pruneGroups("rsvp_groups", keepRsvp);
  const prunedSeating = await pruneGroups("seating_groups", keepSeating);

  console.log(
    `✓ Pruned ${delSlugs.data?.length ?? 0} stale slugs, ${prunedRsvp} stale rsvp groups, ${prunedSeating} stale seating groups.`
  );
  console.log("\nPersonal RSVP links:");
  for (const s of slugRows) console.log(`  /r/${s.slug}`);
}

function fail(table: string, msg: string): never {
  console.error(`✗ upsert into ${table} failed: ${msg}`);
  process.exit(1);
}

main();
