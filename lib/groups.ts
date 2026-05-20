/**
 * Group helpers — derive group membership from the guest list.
 *
 * Groups aren't a separate lookup at runtime: a guest belongs to a group
 * iff their `group_id` matches. These helpers do that filtering in one
 * place so screens don't each reimplement it.
 */
import { guests } from "@/lib/data";
import type { Guest } from "@/lib/schema";

/**
 * Every guest in the same group as `guest`, including `guest` itself.
 * A solo guest (no group_id) returns just [guest].
 * Order follows the guest list (CSV order).
 */
export function getGroupMembers(guest: Guest): Guest[] {
  if (!guest.group_id) return [guest];
  return guests.filter((g) => g.group_id === guest.group_id);
}

/**
 * True if the guest has at least one OTHER person in their group —
 * i.e. the Group check-in screen would have something to show.
 */
export function hasGroupmates(guest: Guest): boolean {
  return getGroupMembers(guest).length > 1;
}
