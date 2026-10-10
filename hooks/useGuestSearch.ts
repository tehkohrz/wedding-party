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
 *   3. Word-start matching — a search matches from the start of any word
 *      in the name or an alias, never from the middle of one. "che" finds
 *      Cheryl, not Michelle; "cy" finds CY, not Nancy.
 *
 * Returns:
 *   - matches: top 5 Guest objects, best first. Empty array if query is empty.
 *
 * Fuzziness: `threshold` 0.2 allows one typo from five letters up
 * ("gladis" finds Gladys) and none in shorter searches.
 */
import Fuse from "fuse.js";
import { useMemo } from "react";
import { SEARCH_CONFIG } from "@/lib/content";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { Guest } from "@/lib/schema";

const MAX_RESULTS = 5;
const DEBOUNCE_MS = 150;

/**
 * Every point a search can start from: the name and each alias from each
 * word onwards, with and without spaces. "kian teck", "teck" and "kianteck"
 * all reach Koh Kian Teck.
 */
function searchTerms(guest: Guest): string[] {
  const terms = new Set<string>();
  for (const name of [guest.name, ...guest.search_aliases]) {
    const words = name.toLowerCase().split(/\s+/).filter(Boolean);
    words.forEach((_, i) => {
      terms.add(words.slice(i).join(" "));
      terms.add(words.slice(i).join(""));
    });
  }
  return [...terms];
}

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
    return new Fuse(
      searchable.map((guest) => ({ guest, terms: searchTerms(guest) })),
      {
        keys: ["terms"],
        threshold: 0.2,
        // A match must begin at the start of a term. With distance 2, a
        // match even one letter in scores past the threshold.
        location: 0,
        distance: 2,
        minMatchCharLength: 2,
      },
    );
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
      .map((r) => r.item.guest);
  }, [debouncedQuery, fuse]);

  return matches;
}
