/**
 * SEATING-group helpers for the day-of check-in app — who sits and arrives
 * together. (RSVP groups — who responds together — are a separate, smaller
 * grouping handled by the RSVP flow via the database.)
 *
 * Groups aren't a separate lookup at runtime: a guest belongs to a group
 * iff their `seating_group_id` matches. These helpers do that filtering in
 * one place so screens don't each reimplement it.
 */
import { guests } from "@/lib/data";
import type { Guest } from "@/lib/schema";

/**
 * Every guest in the same SEATING group as `guest` (who sits/arrives
 * together — the day-of check-in unit), including `guest` itself.
 * A guest without a seating group returns just [guest].
 * Order follows the guest list (CSV order).
 */
export function getGroupMembers(guest: Guest): Guest[] {
  if (!guest.seating_group_id) return [guest];
  return guests.filter(
    (g) => g.seating_group_id === guest.seating_group_id
  );
}

/**
 * True if the guest has at least one OTHER person in their group —
 * i.e. the Group check-in screen would have something to show.
 */
export function hasGroupmates(guest: Guest): boolean {
  return getGroupMembers(guest).length > 1;
}

// ─── Bouquet color assignment ────────────────────────────────────────────────
// Each group member is assigned a bouquet color. The same assignment is used
// on the group check-in screen AND the lunch seating screen, so each person's
// name box and their highlighted seat share a color.
//
// Ordering: the current guest always gets the first color; companions follow
// in CSV order. This keeps every guest's color stable regardless of who has
// already arrived (vs deriving from the pending-after-filter list).

export const BOUQUET_COLORS = [
  "lavender",
  "rose",
  "marigold",
  "sage",
  "sky",
  "peach",
] as const;

export type BouquetColor = (typeof BOUQUET_COLORS)[number];

/**
 * Returns an ordered assignment of bouquet colors to every member of the
 * guest's group (current guest first, then companions in CSV order). For
 * a solo guest this is just `[{ guest, color: BOUQUET_COLORS[0] }]`.
 */
export function getMemberColorAssignments(
  guest: Guest
): Array<{ guest: Guest; color: BouquetColor }> {
  const others = getGroupMembers(guest).filter((m) => m.id !== guest.id);
  const result: Array<{ guest: Guest; color: BouquetColor }> = [
    { guest, color: BOUQUET_COLORS[0] },
  ];
  others.forEach((m, i) => {
    result.push({
      guest: m,
      color: BOUQUET_COLORS[(i + 1) % BOUQUET_COLORS.length],
    });
  });
  return result;
}
