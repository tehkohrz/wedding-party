/**
 * Build script: parse data/*.csv → validate → write lib/data.json.
 *
 * Run via: pnpm build:data
 * Auto-run: predev / prebuild hooks in package.json.
 *
 * Fails loudly on any CSV or Zod error so you find data
 * problems at build time, not on the iPad at the reception desk.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import Papa from "papaparse";
import { z } from "zod";
import { GuestSchema } from "../lib/schema";
import { deriveSeatingGroups } from "./derive-groups";

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

// The check-in app cares about SEATING groups (who sits/arrives together) —
// derived from the guest list's seating_group_id column. Labels are
// auto-generated; see scripts/derive-groups.ts.
const groups = deriveSeatingGroups(guests);

// ---------------------------------------------------------------------------
// 2) Write the typed JSON artifact.
// ---------------------------------------------------------------------------
mkdirSync(LIB_DIR, { recursive: true });
writeFileSync(
  resolve(LIB_DIR, "data.json"),
  JSON.stringify({ guests, groups }, null, 2) + "\n"
);

console.log(
  `✓ Wrote lib/data.json — ${guests.length} guests, ${groups.length} groups.`
);
