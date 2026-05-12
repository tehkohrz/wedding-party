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

export const PhaseSchema = z.enum(["solemn", "lunch"]);

export const GuestSchema = z.object({
  id: z.string().min(1),
  display_name: z.string().min(1),
  /** Semicolon-separated in CSV; split into an array here. */
  search_aliases: z.string().transform((s) =>
    s
      .split(";")
      .map((x) => x.trim())
      .filter(Boolean)
  ),
  group_id: nullableString,
  lunch_row: z.coerce.number().int().positive(),
  lunch_section: nullableString,
  lunch_seat: z.coerce.number().int().positive(),
  solemn_row: z.coerce.number().int().positive(),
  solemn_section: nullableString,
  solemn_seat: z.coerce.number().int().positive(),
});

export const GroupSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export const LayoutSectionSchema = z.object({
  phase: PhaseSchema,
  row: z.coerce.number().int().positive(),
  section: nullableString,
  start_seat: z.coerce.number().int().positive(),
  end_seat: z.coerce.number().int().positive(),
  label: z.string().min(1),
});

export type Phase = z.infer<typeof PhaseSchema>;
export type Guest = z.infer<typeof GuestSchema>;
export type Group = z.infer<typeof GroupSchema>;
export type LayoutSection = z.infer<typeof LayoutSectionSchema>;
