/**
 * Name → URL slug, shared by the DB seed (scripts/seed-db.ts) and the
 * admin guest editor (rename regenerates a personal link) so the two can
 * never drift.
 *
 * "John Tan" → "john-tan" (ASCII-ish kebab; non-alphanumerics collapse
 * to -, diacritics stripped). Collision suffixes ("john-tan-2") are the
 * caller's job — they need visibility of the existing slug set.
 */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
