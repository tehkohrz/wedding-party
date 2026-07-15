/**
 * Derive groups from the guest list — groups.csv no longer exists.
 *
 * A group is every distinct `group_id` in guests.csv; guests without one
 * get a personal SOLO_<id> group so every guest is reachable by an RSVP
 * link. Labels are auto-generated from member names ("wedding party"
 * style) and are just seed DEFAULTS — rename them anytime in the admin
 * guest editor or Supabase table editor. Note: re-running the seed
 * overwrites labels with these defaults again.
 *
 *   1 member  → "Wan Xin"
 *   2 members → "Sonya & Chris"
 *   3+        → "Justin, Kim & party"
 *
 * Used by both scripts/build-data.ts (check-in data) and scripts/seed-db.ts
 * (database seed) so the two derivations can never drift.
 */
import type { Guest } from "../lib/schema";

export interface DerivedGroup {
  id: string;
  label: string;
}

export function groupIdOf(guest: Guest): string {
  return guest.group_id ?? `SOLO_${guest.id}`;
}

export function deriveGroups(guests: Guest[]): DerivedGroup[] {
  const byGroup = new Map<string, Guest[]>();
  for (const g of guests) {
    const id = groupIdOf(g);
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
