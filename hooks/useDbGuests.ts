"use client";

/**
 * The guest list for the day-of screens, fetched from the DATABASE
 * (Stage 6) instead of the build-time lib/data.json — so admin edits
 * (renames, seat assignments, plus-one names typed during RSVP) are what
 * the check-in iPads actually see.
 *
 * Guests who DECLINED (attending === false) are filtered out here: the
 * day-of app never needs them. Not-yet-responded guests stay in — someone
 * who never RSVP'd but shows up anyway can still check in.
 *
 * Returns undefined until loaded. Rows are mapped to the v1 `Guest` shape
 * (lib/schema) so every existing helper keeps working.
 */
import { useEffect, useState } from "react";
import type { Guest } from "@/lib/schema";

interface ApiGuestRow {
  id: number;
  name: string;
  search_aliases: string | null;
  side: "bride" | "groom";
  rsvp_group_id?: string | null;
  seating_group_id: string | null;
  is_kid?: boolean;
  is_plus_one?: boolean;
  attending?: boolean | null;
  row_num: number | null;
  section: string | null;
  seat: number | null;
}

function toGuest(r: ApiGuestRow): Guest {
  return {
    id: r.id,
    name: r.name,
    search_aliases: (r.search_aliases ?? "")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean),
    side: r.side,
    rsvp_group_id: r.rsvp_group_id ?? null,
    seating_group_id: r.seating_group_id,
    is_kid: r.is_kid ?? false,
    is_plus_one: r.is_plus_one ?? false,
    row: r.row_num,
    section: r.section,
    seat: r.seat,
  };
}

export function useDbGuests(): readonly Guest[] | undefined {
  const [guests, setGuests] = useState<Guest[] | undefined>();

  useEffect(() => {
    let alive = true;
    fetch("/api/guests")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json: { guests: ApiGuestRow[] }) => {
        if (!alive) return;
        setGuests(
          json.guests.filter((g) => g.attending !== false).map(toGuest)
        );
      })
      .catch(() => {}); // stays undefined; screens show their loading state
    return () => {
      alive = false;
    };
  }, []);

  return guests;
}
