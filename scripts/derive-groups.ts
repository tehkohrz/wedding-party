/**
 * Derive groups from the guest list — there is no groups CSV.
 *
 * TWO group kinds live on each guest row (they answer different questions):
 *
 *   rsvp_group_id     who RESPONDS together (couple / household). Every
 *                     guest needs one so their personal link resolves —
 *                     solo guests get a personal SOLO_<id> group.
 *   seating_group_id  who SITS + ARRIVES together (the table / circle).
 *                     Nullable — a guest without one simply checks in alone.
 *
 * Labels are auto-generated from member names and are seed DEFAULTS —
 * rename them anytime in the admin editor or Supabase table editor (note:
 * re-running the seed overwrites labels with these defaults again).
 *
 *   1 member  → "Wan Xin"
 *   2 members → "Sonya & Chris"
 *   3+        → "Justin, Kim & party"
 *
 * Used by both scripts/build-data.ts (check-in data → seating groups) and
 * scripts/seed-db.ts (database seed → both kinds) so derivations never drift.
 */
import type { Guest } from "../lib/schema";

export interface DerivedGroup {
  id: string;
  label: string;
}

/** The RSVP group every guest belongs to (personal SOLO group if none). */
export function rsvpGroupIdOf(guest: Guest): string {
  return guest.rsvp_group_id ?? `SOLO_${guest.id}`;
}

export function deriveRsvpGroups(guests: Guest[]): DerivedGroup[] {
  return derive(guests, rsvpGroupIdOf);
}

/** Seating groups: only guests that actually have one (no solo groups). */
export function deriveSeatingGroups(guests: Guest[]): DerivedGroup[] {
  return derive(
    guests.filter((g) => g.seating_group_id !== null),
    (g) => g.seating_group_id as string
  );
}

function derive(guests: Guest[], keyOf: (g: Guest) => string): DerivedGroup[] {
  const byGroup = new Map<string, Guest[]>();
  for (const g of guests) {
    const id = keyOf(g);
    const list = byGroup.get(id) ?? [];
    list.push(g);
    byGroup.set(id, list);
  }

  return [...byGroup.entries()].map(([id, members]) => ({
    id,
    label: labelFor(members.map((m) => m.name)),
  }));
}

function labelFor(names: string[]): string {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names[0]}, ${names[1]} & party`;
}
