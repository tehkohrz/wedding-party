/**
 * GET /api/guests — the guest list for the day-of check-in app.
 *
 * Returns every guest with their group + seat. Stage 6 will point the
 * check-in flow's search at this instead of the build-time lib/data.json.
 * (Names on a wedding guest list are not sensitive within the event's
 * audience; this endpoint is unauthenticated by design.)
 */
import { db, type DbGuest } from "@/lib/db";

export async function GET() {
  const { data, error } = await db()
    .from("guests")
    .select(
      "id, name, search_aliases, side, group_id, row_num, section, seat"
    )
    .order("id");

  if (error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }

  return Response.json({ guests: (data ?? []) as Partial<DbGuest>[] });
}
