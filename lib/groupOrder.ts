/**
 * Ordering for RSVP / seating group ids.
 *
 * The ids are a TEXT column holding numeric strings ("1", "2", "27"). Any
 * plain string sort — including Postgres `order by id` — puts them in
 * 1, 10, 11, 2 order, which scattered "Lee Party" (group 3) into the
 * middle of the twenties in the admin overview and made it look missing.
 *
 * A numeric-aware collator fixes that and still behaves sensibly if the id
 * scheme ever gains a prefix ("g2" sorts before "g10").
 */
const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

export function compareGroupIds(a: string | null, b: string | null): number {
  // Ungrouped sorts last, whichever direction the caller applies.
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return collator.compare(a, b);
}
