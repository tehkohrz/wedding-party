/**
 * PATCH /api/admin/guests/[id] — edit one guest (rename, regroup, assign a
 * seat, kid flag, or override an RSVP answer). Partial body; Zod-validated.
 *
 * Regrouping is fully supported:
 *   - Assigning a group id that doesn't exist yet AUTO-CREATES the group
 *     (label defaults to the guest's name — rename in Supabase's table
 *     editor if it matters; a CSV re-seed regenerates labels properly).
 *   - Changing rsvp_group_id RETARGETS the guest's personal slug(s), so
 *     /r/their-name always opens their current group's RSVP.
 *
 * Seat assignment after the RSVP deadline happens here (row_num/section/seat).
 * NOTE: seats are NOT validated against layout.csv — the admin is trusted;
 * the day-of map simply won't highlight a seat outside the layout.
 */
import { z } from "zod";
import { db } from "@/lib/db";
import { isAuthed, unauthorized } from "@/lib/adminAuth";

const PatchSchema = z
  .object({
    name: z.string().trim().min(1),
    search_aliases: z.string(),
    side: z.enum(["bride", "groom"]),
    rsvp_group_id: z.string().trim().min(1).nullable(),
    seating_group_id: z.string().trim().min(1).nullable(),
    is_kid: z.boolean(),
    row_num: z.number().int().positive().nullable(),
    section: z.string().trim().min(1).nullable(),
    seat: z.number().int().positive().nullable(),
    attending: z.boolean().nullable(),
    food_choice: z.enum(["A", "B"]).nullable(),
    dietary_comment: z.string().trim().max(500).nullable(),
    after_party: z.boolean().nullable(),
    // Set when the admin records a response on a guest's behalf; nulled
    // when the admin resets a response entirely.
    responded_at: z.string().nullable(),
  })
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, { message: "Empty patch" });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthed(req)) return unauthorized();

  const { id } = await params;
  const guestId = Number(id);
  if (!Number.isInteger(guestId)) {
    return Response.json({ error: "Bad id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid patch" }, { status: 400 });
  }
  const patch = parsed.data;
  const client = db();

  // Auto-create groups referenced by the patch so the FK never rejects a
  // regroup. ignoreDuplicates keeps existing labels intact; brand-new
  // groups get the guest's name as a starter label.
  const starterLabel = async (): Promise<string> => {
    const g = await client
      .from("guests")
      .select("name")
      .eq("id", guestId)
      .maybeSingle();
    return (g.data?.name as string | undefined) ?? "New group";
  };
  if (patch.rsvp_group_id) {
    const up = await client
      .from("rsvp_groups")
      .upsert(
        { id: patch.rsvp_group_id, label: await starterLabel() },
        { onConflict: "id", ignoreDuplicates: true }
      );
    if (up.error) {
      return Response.json({ error: "Database error" }, { status: 500 });
    }
  }
  if (patch.seating_group_id) {
    const up = await client
      .from("seating_groups")
      .upsert(
        { id: patch.seating_group_id, label: await starterLabel() },
        { onConflict: "id", ignoreDuplicates: true }
      );
    if (up.error) {
      return Response.json({ error: "Database error" }, { status: 500 });
    }
  }

  const { data, error } = await client
    .from("guests")
    .update(patch)
    .eq("id", guestId)
    .select()
    .maybeSingle();

  if (error) {
    return Response.json({ error: "Update failed" }, { status: 400 });
  }
  if (!data) return Response.json({ error: "Not found" }, { status: 404 });

  // Keep personal links pointing at the guest's CURRENT rsvp group —
  // without this, a regrouped guest's /r/slug would open their old group.
  if (patch.rsvp_group_id) {
    const slugFix = await client
      .from("rsvp_slugs")
      .update({ group_id: patch.rsvp_group_id })
      .eq("guest_id", guestId);
    if (slugFix.error) {
      return Response.json(
        { error: "Guest saved but link retarget failed — re-save to retry" },
        { status: 500 }
      );
    }
  }

  return Response.json({ guest: data });
}
