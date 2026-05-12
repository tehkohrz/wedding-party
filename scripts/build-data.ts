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
  GroupSchema,
  LayoutSectionSchema,
  type Guest,
  type LayoutSection,
  type Phase,
} from "../lib/schema";

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
const groups = parseCsv("groups.csv", GroupSchema);
const layout = parseCsv("layout.csv", LayoutSectionSchema);

// ---------------------------------------------------------------------------
// 2) Cross-reference validation — catches data integrity issues that no
//    single-row schema can catch.
// ---------------------------------------------------------------------------

// Every guest's group_id must point to a real group.
const groupIds = new Set(groups.map((g) => g.id));
for (const g of guests) {
  if (g.group_id && !groupIds.has(g.group_id)) {
    fail(`Guest ${g.id} (${g.name}) references unknown group: ${g.group_id}`);
  }
}

// Every guest's seat must fall within a layout section's range.
function findSection(
  phase: Phase,
  row: number,
  section: string | null,
  seat: number
): LayoutSection | undefined {
  return layout.find(
    (l) =>
      l.phase === phase &&
      l.row === row &&
      l.section === section &&
      seat >= l.start_seat &&
      seat <= l.end_seat
  );
}

for (const g of guests) {
  checkSeat(g, "solemn", g.solemn_row, g.solemn_section, g.solemn_seat);
  checkSeat(g, "lunch", g.lunch_row, g.lunch_section, g.lunch_seat);
}

function checkSeat(
  g: Guest,
  phase: Phase,
  row: number,
  section: string | null,
  seat: number
): void {
  if (!findSection(phase, row, section, seat)) {
    fail(
      `Guest ${g.id} (${g.name}): ${phase} seat row=${row} section=${section ?? "(none)"} seat=${seat} doesn't fall within any layout section`
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
