/**
 * GET /api/admin/links — every guest's personal RSVP slug, for the
 * WhatsApp-distribution CSV export (the client composes absolute URLs
 * from its own origin).
 */
import { db } from "@/lib/db";
import { isAuthed, unauthorized } from "@/lib/adminAuth";

export async function GET(req: Request) {
  if (!isAuthed(req)) return unauthorized();

  const client = db();
  const [slugsRes, guestsRes] = await Promise.all([
    client.from("rsvp_slugs").select("slug, guest_id"),
    client.from("guests").select("id, name").order("id"),
  ]);
  if (slugsRes.error || guestsRes.error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }

  const slugByGuest = new Map<number, string>();
  for (const s of slugsRes.data ?? []) {
    if (s.guest_id !== null) slugByGuest.set(s.guest_id as number, s.slug);
  }

  return Response.json({
    links: (guestsRes.data ?? [])
      .map((g) => ({ name: g.name as string, slug: slugByGuest.get(g.id) }))
      .filter((l) => l.slug),
  });
}
