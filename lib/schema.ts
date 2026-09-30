/**
 * Zod schemas for the wedding data files. These are the single source of
 * truth: TypeScript types are *inferred* from them (z.infer), so any change
 * here propagates everywhere automatically.
 *
 * Used by:
 *   - scripts/build-data.ts (validates CSVs at build time)
 *   - any future runtime code that needs to verify imported data
 */
import { z } from "zod";

/** Treat empty strings / whitespace as null (CSV blank cells). */
const nullableString = z.string().transform((s) => {
  const trimmed = s.trim();
  return trimmed.length > 0 ? trimmed : null;
});

export const SideSchema = z.enum(["bride", "groom"]);

export const GuestSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().min(1),
  /**
   * Semicolon-separated in CSV; split into an array here.
   * Aliases supplement `name` — don't repeat the first/last name,
   * Fuse.js already does fuzzy substring matching on `name`.
   * Use for: alternative orderings (Chinese names), maiden names,
   * nicknames, non-Latin characters.
   */
  search_aliases: z.string().transform((s) =>
    s
      .split(";")
      .map((x) => x.trim())
      .filter(Boolean)
  ),
  side: SideSchema,
  /**
   * RSVP group — who RESPONDS together (a couple / household / invite unit).
   * Personal links resolve to this group; one member answers for all of it.
   * Empty = solo (the seed creates a personal group).
   */
  rsvp_group_id: nullableString,
  /**
   * Seating group — who SITS and ARRIVES together (the table / friend
   * circle). Drives the day-of group check-in and the seat-map name boxes.
   * Usually bigger than the RSVP group. Empty = checks in alone.
   */
  seating_group_id: nullableString,
  /**
   * Kid flag — carried to the database so admin food totals can separate
   * kids' meals for the caterer. CSV cell: "true"/"false" (empty = false).
   */
  is_kid: z
    .string()
    .optional()
    .transform((s) => (s ?? "").trim().toLowerCase() === "true"),
  /**
   * Plus-one flag — a placeholder companion row ("Peter's Plus One"). Gets
   * NO personal link; the main guest toggles whether they're bringing one
   * (and can fill in the real name) inside their own RSVP.
   * CSV cell: "true"/"false" (empty = false).
   */
  is_plus_one: z
    .string()
    .optional()
    .transform((s) => (s ?? "").trim().toLowerCase() === "true"),
  /**
   * After-party invite flag — the after-party is invite-only; guests
   * without it never see the after-party step or its progress pill.
   * CSV cell: "true"/"false" (empty = false).
   */
  after_party_invited: z
    .string()
    .optional()
    .transform((s) => (s ?? "").trim().toLowerCase() === "true"),
  /**
   * Lunch seat. row is the table number, section the side ("top" or
   * "bottom"), and seat the position from the pool end; lib/floorPlan.ts
   * reads them with seatOf(). Null until seats are assigned.
   */
  row: z
    .string()
    .transform((s) => (s.trim() === "" ? null : Number(s)))
    .pipe(z.number().int().positive().nullable()),
  section: nullableString,
  seat: z
    .string()
    .transform((s) => (s.trim() === "" ? null : Number(s)))
    .pipe(z.number().int().positive().nullable()),
});

export const GroupSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export type Side = z.infer<typeof SideSchema>;
export type Guest = z.infer<typeof GuestSchema>;
export type Group = z.infer<typeof GroupSchema>;

// ─── Attendance export / restore ─────────────────────────────────────────────
// A backup file read from disk is untrusted input, so we validate it with
// Zod before writing anything to IndexedDB (same principle as the CSV parse).

export const AttendanceRecordSchema = z.object({
  guest_id: z.number().int().positive(),
  arrived_at: z.number().int().nonnegative(),
});

export const AttendanceExportSchema = z.object({
  app: z.literal("sitwhereah"),
  version: z.number().int().positive(),
  exported_at: z.string(),
  attendance: z.array(AttendanceRecordSchema),
  // guests_snapshot is human-readable extra; ignored on restore, so we
  // accept anything (or absent) without failing validation.
  guests_snapshot: z.array(z.unknown()).optional(),
});

export type AttendanceExport = z.infer<typeof AttendanceExportSchema>;
