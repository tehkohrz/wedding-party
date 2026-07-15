/**
 * /api/rsvp/[slug] — the RSVP data endpoint for one group.
 *
 * GET  → resolve a personal name-slug (e.g. "john-tan") to its group and
 *        all members, including any previously-submitted responses (powers
 *        both a fresh RSVP and the edit-until-deadline revisit).
 *
 * POST → atomically write the WHOLE group's response (the flow's single
 *        submit). Validates with Zod, requires an answer for every member,
 *        normalizes decliners (no food/after-party), rejects after the
 *        RSVP deadline, and scopes every update to the slug's group so a
 *        request can never write another group's rows.
 *
 * Next 16 note: `params` is a Promise — must be awaited.
 */
import { z } from "zod";
import { db, type DbGuest, type DbGroup } from "@/lib/db";
import { rsvpDeadlinePassed } from "@/lib/rsvpDeadline";

const SubmissionSchema = z.object({
  answers: z
    .array(
      z.object({
        guest_id: z.number().int().positive(),
        attending: z.boolean(),
        food_choice: z.enum(["A", "B"]).nullable(),
        dietary_comment: z.string().trim().max(500).nullable(),
        after_party: z.boolean().nullable(),
      })
    )
    .min(1)
    .max(50),
});

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
    client.from("rsvp_groups").select("id, label").eq("id", groupId).single(),
    client
      .from("guests")
      .select(
        "id, name, side, attending, food_choice, dietary_comment, after_party, responded_at"
      )
      .eq("rsvp_group_id", groupId)
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (rsvpDeadlinePassed()) {
    return Response.json({ error: "RSVP period has closed" }, { status: 403 });
  }

  const { slug } = await params;

  // Validate the body shape before touching the database.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = SubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid submission" }, { status: 400 });
  }

  const client = db();

  // Resolve slug → group, then require an answer for exactly the group's
  // member set (no missing members, no foreign guest_ids).
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

  const membersRes = await client
    .from("guests")
    .select("id")
    .eq("rsvp_group_id", groupId);
  if (membersRes.error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }
  const memberIds = new Set((membersRes.data ?? []).map((m) => m.id as number));

  const answers = parsed.data.answers;
  const answeredIds = new Set(answers.map((a) => a.guest_id));
  const sameSet =
    memberIds.size === answeredIds.size &&
    [...memberIds].every((id) => answeredIds.has(id));
  if (!sameSet) {
    return Response.json(
      { error: "Answers must cover exactly this group's members" },
      { status: 400 }
    );
  }

  // Business rules: attendees need a main; decliners carry no food /
  // after-party (normalized rather than rejected).
  for (const a of answers) {
    if (a.attending && a.food_choice === null) {
      return Response.json(
        { error: `Missing food choice for guest ${a.guest_id}` },
        { status: 400 }
      );
    }
  }

  const now = new Date().toISOString();
  const updates = answers.map((a) =>
    client
      .from("guests")
      .update({
        attending: a.attending,
        food_choice: a.attending ? a.food_choice : null,
        dietary_comment: a.attending ? a.dietary_comment : null,
        after_party: a.attending ? a.after_party : null,
        responded_at: now,
      })
      .eq("id", a.guest_id)
      .eq("rsvp_group_id", groupId) // never write outside this group
  );
  const results = await Promise.all(updates);
  if (results.some((r) => r.error)) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
