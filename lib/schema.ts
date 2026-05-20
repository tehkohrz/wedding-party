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
  group_id: nullableString,
  /** Seat address — there is one seating (the lunch). */
  row: z.coerce.number().int().positive(),
  section: nullableString,
  seat: z.coerce.number().int().positive(),
});

export const GroupSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export const LayoutSectionSchema = z.object({
  row: z.coerce.number().int().positive(),
  section: nullableString,
  start_seat: z.coerce.number().int().positive(),
  end_seat: z.coerce.number().int().positive(),
  label: z.string().min(1),
});

export type Side = z.infer<typeof SideSchema>;
export type Guest = z.infer<typeof GuestSchema>;
export type Group = z.infer<typeof GroupSchema>;
export type LayoutSection = z.infer<typeof LayoutSectionSchema>;
