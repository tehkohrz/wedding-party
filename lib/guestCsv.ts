/**
 * The guest-list CSV contract, shared by the admin export and import so
 * the two can never drift.
 *
 * ROUND-TRIP RULE — the export carries EVERY column (responses included,
 * so you can read and verify them in Google Sheets), but the import only
 * applies the CONFIG columns. RSVP responses are the guests' own words:
 * they change through the RSVP flow or the admin editor, never through a
 * spreadsheet that may be hours stale.
 *
 * Matching is by `id`. A row with a blank id is treated as a NEW guest
 * (the database assigns the id and a personal link is generated).
 */

/** Columns the import will write. Everything else is export-only. */
export const CONFIG_COLUMNS = [
  "name",
  "side",
  "rsvp_group_id",
  "seating_group_id",
  "is_kid",
  "is_plus_one",
  "after_party_invited",
  "search_aliases",
  "row_num",
  "section",
  "seat",
] as const;

/** Read-only in a CSV round-trip: exported for reference, never imported.
    `food_label` is derived from food_choice (the raw code stays too, so a
    re-import is still unambiguous) — it just makes the sheet readable. */
export const RESPONSE_COLUMNS = [
  "attending",
  "food_choice",
  "food_label",
  "after_party",
  "baby_seat",
  "dietary_comment",
  "responded_at",
] as const;

/** Full export header, in order. */
export const CSV_COLUMNS = [
  "id",
  ...CONFIG_COLUMNS,
  ...RESPONSE_COLUMNS,
] as const;

export type CsvColumn = (typeof CSV_COLUMNS)[number];

/** CSV cell text for one guest field ("" for null/undefined). */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

/** "true"/"yes"/"1" → true (blank → false). Tolerant of Sheets' casing. */
export function parseBool(raw: string | undefined): boolean {
  const v = (raw ?? "").trim().toLowerCase();
  return v === "true" || v === "yes" || v === "y" || v === "1";
}

/** Blank cell → null; otherwise the trimmed text. */
export function parseText(raw: string | undefined): string | null {
  const v = (raw ?? "").trim();
  return v === "" ? null : v;
}

/** Blank / non-numeric → null; otherwise a positive integer. */
export function parseInteger(raw: string | undefined): number | null {
  const v = (raw ?? "").trim();
  if (v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}
