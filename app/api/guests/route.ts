/**
 * GET /api/guests — the guest list for the day-of check-in app.
 *
 * Returns every guest with their group + seat + RSVP attending flag —
 * the check-in flow's data source since Stage 6 (declined guests are
 * filtered client-side in hooks/useDbGuests).
 * (Names on a wedding guest list are not sensitive within the event's
 * audience; this endpoint is unauthenticated by design.)
 */
import { db, type DbGuest } from "@/lib/db";

export async function GET() {
  const { data, error } = await db()
    .from("guests")
    .select(
      "id, name, search_aliases, side, seating_group_id, is_kid, is_plus_one, attending, row_num, section, seat"
    )
    .order("id");

  if (error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }

  return Response.json({ guests: (data ?? []) as Partial<DbGuest>[] });
}
