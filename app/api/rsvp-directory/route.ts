/**
 * GET /api/rsvp-directory — the searchable guest directory for the RSVP
 * landing page.
 *
 * Returns every guest's name + aliases + their personal slug, so the
 * client-side fuzzy search (Fuse.js, same as check-in) can route a found
 * guest straight to /r/[their-slug]. ~100 rows — fetched once per visit.
 *
 * Deliberately excludes sides, seats, and RSVP responses: the landing
 * search needs only what's required to find and route a person.
 */
import { db } from "@/lib/db";

export async function GET() {
  const client = db();

  const [guestsRes, slugsRes] = await Promise.all([
    client.from("guests").select("id, name, search_aliases").order("id"),
    client.from("rsvp_slugs").select("slug, guest_id"),
  ]);

  if (guestsRes.error || slugsRes.error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }

  const slugByGuestId = new Map<number, string>();
  for (const s of slugsRes.data ?? []) {
    if (s.guest_id !== null) slugByGuestId.set(s.guest_id, s.slug);
  }

  const directory = (guestsRes.data ?? [])
    .map((g) => ({
      id: g.id as number,
      name: g.name as string,
      search_aliases: (g.search_aliases as string) ?? "",
      slug: slugByGuestId.get(g.id) ?? null,
    }))
    // A guest without a slug can't be routed — shouldn't happen after
    // seeding, but filter defensively rather than render a dead result.
    .filter((g) => g.slug !== null);

  return Response.json({ directory });
}
