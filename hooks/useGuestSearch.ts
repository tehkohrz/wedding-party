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
import { guests } from "@/lib/data";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { Guest } from "@/lib/schema";

const MAX_RESULTS = 5;
const DEBOUNCE_MS = 150;

export function useGuestSearch(query: string): Guest[] {
  // Build the Fuse index once. `guests` is a build-time constant so the
  // dependency array is effectively [] — this runs once on mount.
  const fuse = useMemo(
    () =>
      new Fuse(guests as Guest[], {
        keys: ["name", "search_aliases"],
        threshold: 0.4,
        minMatchCharLength: 1,
        ignoreLocation: true, // don't penalize matches near end of string
      }),
    []
  );

  // Debounce the query so Fuse runs after the user pauses.
  const debouncedQuery = useDebouncedValue(query.trim(), DEBOUNCE_MS);

  // Run the search. useMemo so we don't rebuild the result array on
  // unrelated re-renders (e.g. parent state changes).
  const matches = useMemo(() => {
    if (debouncedQuery.length === 0) return [];
    return fuse
      .search(debouncedQuery, { limit: MAX_RESULTS })
      .map((r) => r.item);
  }, [debouncedQuery, fuse]);

  return matches;
}
