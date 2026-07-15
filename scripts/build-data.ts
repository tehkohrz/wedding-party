/**
 * Build script: parse data/*.csv → validate → write lib/data.json.
 *
 * Run via: pnpm build:data
 * Auto-run: predev / prebuild hooks in package.json.
 *
 * Fails loudly on any CSV/Zod/cross-reference error so you find data
 * problems at build time, not on the iPad at the reception desk.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import Papa from "papaparse";
import { z } from "zod";
import {
  GuestSchema,
  LayoutSectionSchema,
  type LayoutSection,
} from "../lib/schema";
import { deriveGroups } from "./derive-groups";

const ROOT = process.cwd();
const DATA_DIR = resolve(ROOT, "data");
const LIB_DIR = resolve(ROOT, "lib");

function parseCsv<T>(filename: string, schema: z.ZodType<T>): T[] {
  const raw = readFileSync(resolve(DATA_DIR, filename), "utf8");
  const parsed = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    console.error(`[${filename}] CSV parse errors:`);
    parsed.errors.forEach((e) => console.error(`  - ${e.message}`));
    process.exit(1);
  }

  const result: T[] = [];
  parsed.data.forEach((row, i) => {
    const v = schema.safeParse(row);
    if (!v.success) {
      // CSV row 1 = header, so first data row is line 2.
      console.error(`[${filename}] row ${i + 2} failed validation:`);
      console.error(JSON.stringify(v.error.issues, null, 2));
      process.exit(1);
    }
    result.push(v.data);
  });
  return result;
}

// ---------------------------------------------------------------------------
// 1) Parse + validate each CSV through its Zod schema.
// ---------------------------------------------------------------------------
console.log("Building data...");

const guests = parseCsv("guests.csv", GuestSchema);
const layout = parseCsv("layout.csv", LayoutSectionSchema);

// Groups are DERIVED from the guest list's group_id column (there is no
// groups.csv) — every reference resolves by construction. Labels are
// auto-generated; see scripts/derive-groups.ts.
const groups = deriveGroups(guests);

// ---------------------------------------------------------------------------
// 2) Cross-reference validation — catches data integrity issues that no
//    single-row schema can catch.
// ---------------------------------------------------------------------------

// Every guest's seat must fall within a layout section's range.
function findSection(
  row: number,
  section: string | null,
  seat: number
): LayoutSection | undefined {
  return layout.find(
    (l) =>
      l.row === row &&
      l.section === section &&
      seat >= l.start_seat &&
      seat <= l.end_seat
  );
}

for (const g of guests) {
  // Seats are nullable during RSVP season (assigned after the deadline) —
  // only validate guests who actually have a seat assigned.
  if (g.row === null || g.seat === null) continue;
  if (!findSection(g.row, g.section, g.seat)) {
    fail(
      `Guest ${g.id} (${g.name}): seat row=${g.row} section=${g.section ?? "(none)"} seat=${g.seat} doesn't fall within any layout section`
    );
  }
}

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 3) Write the typed JSON artifact.
// ---------------------------------------------------------------------------
mkdirSync(LIB_DIR, { recursive: true });
writeFileSync(
  resolve(LIB_DIR, "data.json"),
  JSON.stringify({ guests, groups, layout }, null, 2) + "\n"
);

console.log(
  `✓ Wrote lib/data.json — ${guests.length} guests, ${groups.length} groups, ${layout.length} layout sections.`
);
