/**
 * /api/rsvp/[slug] — the RSVP data endpoint for one group.
 *
 * GET  → resolve a personal name-slug (e.g. "john-tan") to its group and
 *        all members, including any previously-submitted responses (powers
 *        both a fresh RSVP and the edit-until-deadline revisit).
 *
 * POST → (Stage 4) atomically write the whole group's response. Stubbed
 *        here so the shape is established; full validation arrives with
 *        the summary/confirm step.
 *
 * Next 16 note: `params` is a Promise — must be awaited.
 */
import { db, type DbGuest, type DbGroup } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const client = db();

  // Resolve slug → group id.
  const slugRow = await client
    .from("rsvp_slugs")
    .select("group_id")
    .eq("slug", slug.toLowerCase())
    .maybeSingle();

  if (slugRow.error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }
  if (!slugRow.data) {
    return Response.json({ error: "Unknown link" }, { status: 404 });
  }

  const groupId = slugRow.data.group_id as string;

  const [groupRes, membersRes] = await Promise.all([
    client.from("groups").select("id, label").eq("id", groupId).single(),
    client
      .from("guests")
      .select(
        "id, name, side, attending, food_choice, dietary_comment, after_party, responded_at"
      )
      .eq("group_id", groupId)
      .order("id"),
  ]);

  if (groupRes.error || membersRes.error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }

  return Response.json({
    group: groupRes.data as DbGroup,
    members: (membersRes.data ?? []) as Partial<DbGuest>[],
  });
}
