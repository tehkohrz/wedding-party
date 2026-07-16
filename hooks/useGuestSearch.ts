"use client";

/**
 * Fuzzy name search hook.
 *
 * Pass in the query string; get back the top 5 matching guests.
 *
 * Three things bundled here so callers don't worry about them:
 *   1. Fuse.js instance — built once via useMemo (it indexes the guest list,
 *      which would be wasteful to redo on every keystroke).
 *   2. Debounce — 150ms wait after typing stops before searching. Stops us
 *      from running Fuse on every single character.
 *   3. Multi-field search — Fuse looks at both `name` and `search_aliases`,
 *      ranking results by combined relevance.
 *
 * Returns:
 *   - matches: top 5 Guest objects, best first. Empty array if query is empty.
 *
 * Fuzziness knob: `threshold` below.
 *   0   = exact match only
 *   0.4 = our sweet spot for names — "Jhon" finds "John"
 *   1   = matches anything
 */
import Fuse from "fuse.js";
import { useMemo } from "react";
import { SEARCH_CONFIG } from "@/lib/content";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { Guest } from "@/lib/schema";

const MAX_RESULTS = 5;
const DEBOUNCE_MS = 150;

export function useGuestSearch(
  query: string,
  // Since Stage 6 the guest list comes from the database (useDbGuests) —
  // pass it in; undefined-while-loading simply yields no matches.
  guests: readonly Guest[] | undefined
): Guest[] {
  // Guests hidden from the day-of searches (see SEARCH_CONFIG in content),
  // then the Fuse index — rebuilt only when the list itself changes.
  const fuse = useMemo(() => {
    const searchable = (guests ?? []).filter(
      (g) =>
        !SEARCH_CONFIG.hiddenGuestIds.includes(g.id) &&
        !(
          g.seating_group_id !== null &&
          SEARCH_CONFIG.hiddenSeatingGroupIds.includes(g.seating_group_id)
        )
    );
    return new Fuse(searchable, {
      keys: ["name", "search_aliases"],
      threshold: 0.3, // tightened: fewer loose matches
      minMatchCharLength: 2,
      ignoreLocation: true, // don't penalize matches near end of string
    });
  }, [guests]);

  // Debounce the query so Fuse runs after the user pauses.
  const debouncedQuery = useDebouncedValue(query.trim(), DEBOUNCE_MS);

  // Run the search. useMemo so we don't rebuild the result array on
  // unrelated re-renders (e.g. parent state changes).
  const matches = useMemo(() => {
    // Below the minimum, return nothing — stops one-letter queries from
    // matching half the guest list.
    if (debouncedQuery.length < SEARCH_CONFIG.minQueryLength) return [];
    return fuse
      .search(debouncedQuery, { limit: MAX_RESULTS })
      .map((r) => r.item);
  }, [debouncedQuery, fuse]);

  return matches;
}
