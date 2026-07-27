/**
 * GET /api/admin/links — the send-out list: every guest's personal RSVP
 * slug plus the context needed to decide who to message.
 *
 * Grouped consumption: one link opens the WHOLE rsvp group's response, so
 * the UI groups by invitation and the couple can message just one person
 * per household (or everyone — both work).
 *
 * Plus-ones are excluded: they have no slug by design (their main guest
 * answers for them). The client composes absolute URLs from its origin.
 */
import { db } from "@/lib/db";
import { isAuthed, unauthorized } from "@/lib/adminAuth";

export async function GET(req: Request) {
  if (!isAuthed(req)) return unauthorized();

  const client = db();
  const [slugsRes, guestsRes, groupsRes] = await Promise.all([
    client.from("rsvp_slugs").select("slug, guest_id"),
    client.from("guests").select("*").order("id"),
    client.from("rsvp_groups").select("id, label"),
  ]);
  if (slugsRes.error || guestsRes.error || groupsRes.error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }

  const slugByGuest = new Map<number, string>();
  for (const s of slugsRes.data ?? []) {
    if (s.guest_id !== null) slugByGuest.set(s.guest_id as number, s.slug);
  }
  const labelByGroup = new Map<string, string>();
  for (const g of groupsRes.data ?? []) {
    labelByGroup.set(g.id as string, g.label as string);
  }

  const links = (guestsRes.data ?? [])
    .filter((g) => !g.is_plus_one && slugByGuest.has(g.id as number))
    .map((g) => ({
      id: g.id as number,
      name: g.name as string,
      side: g.side as "bride" | "groom",
      slug: slugByGuest.get(g.id as number) as string,
      group_id: (g.rsvp_group_id as string | null) ?? "",
      group_label: labelByGroup.get(g.rsvp_group_id as string) ?? "—",
      responded: g.responded_at !== null,
      after_party_invited: g.after_party_invited === true,
    }));

  return Response.json({ links });
}
