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
 *   - Renaming a guest ADDS a slug for the new name (collision-suffixed).
 *     Old slugs are kept on purpose: a link already sent over WhatsApp
 *     must keep working. Delete retired slugs in Supabase's table editor
 *     if they bother you.
 *
 * Seat assignment after the RSVP deadline happens here (row_num/section/seat).
 * NOTE: seats are NOT validated against layout.csv — the admin is trusted;
 * the day-of map simply won't highlight a seat outside the layout.
 */
import { z } from "zod";
import { db } from "@/lib/db";
import { isAuthed, unauthorized } from "@/lib/adminAuth";
import { slugify } from "@/lib/slug";

const PatchSchema = z
  .object({
    name: z.string().trim().min(1),
    search_aliases: z.string(),
    side: z.enum(["bride", "groom"]),
    rsvp_group_id: z.string().trim().min(1).nullable(),
    seating_group_id: z.string().trim().min(1).nullable(),
    is_kid: z.boolean(),
    is_plus_one: z.boolean(),
    after_party_invited: z.boolean(),
    row_num: z.number().int().positive().nullable(),
    section: z.string().trim().min(1).nullable(),
    seat: z.number().int().positive().nullable(),
    attending: z.boolean().nullable(),
    food_choice: z.enum(["A", "B", "K"]).nullable(),
    dietary_comment: z.string().trim().max(500).nullable(),
    after_party: z.boolean().nullable(),
    baby_seat: z.boolean().nullable(),
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

  // Renames get a personal link for the NEW name. Existing slugs stay —
  // links already in guests' hands must never die. (Skipped for a guest
  // with no rsvp group — slugs must point at one — and for plus-ones,
  // who never get personal links.)
  const updated = data as {
    rsvp_group_id: string | null;
    is_plus_one: boolean;
  };
  const currentGroupId = updated.rsvp_group_id;
  if (patch.name && currentGroupId && !updated.is_plus_one) {
    const base = slugify(patch.name) || `guest-${guestId}`;
    // One query for every slug starting with the base covers both "is the
    // exact slug taken?" and "which -2/-3 suffix is free?".
    const existing = await client
      .from("rsvp_slugs")
      .select("slug, guest_id")
      .like("slug", `${base}%`);
    if (existing.error) {
      return Response.json(
        { error: "Guest saved but link regeneration failed" },
        { status: 500 }
      );
    }
    const taken = new Set(existing.data.map((s) => s.slug));
    const ownsBase = existing.data.some(
      (s) => s.guest_id === guestId && (s.slug === base || s.slug.startsWith(`${base}-`))
    );
    if (!ownsBase) {
      let slug = base;
      for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
      const ins = await client.from("rsvp_slugs").insert({
        slug,
        group_id: currentGroupId,
        guest_id: guestId,
      });
      if (ins.error) {
        return Response.json(
          { error: "Guest saved but link regeneration failed" },
          { status: 500 }
        );
      }
    }
  }

  return Response.json({ guest: data });
}

/**
 * DELETE /api/admin/guests/[id] — remove a guest entirely.
 *
 * FKs cascade the guest's personal links and attendance row. If their
 * RSVP group is left empty, the group (and any links still pointing at
 * it) is removed too, so the overview never shows ghost invitations.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthed(req)) return unauthorized();

  const { id } = await params;
  const guestId = Number(id);
  if (!Number.isInteger(guestId)) {
    return Response.json({ error: "Bad id" }, { status: 400 });
  }
  const client = db();

  const guest = await client
    .from("guests")
    .select("rsvp_group_id")
    .eq("id", guestId)
    .maybeSingle();
  if (guest.error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }
  if (!guest.data) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const groupId = guest.data.rsvp_group_id as string | null;

  const del = await client.from("guests").delete().eq("id", guestId);
  if (del.error) {
    return Response.json({ error: "Delete failed" }, { status: 500 });
  }

  // Empty group left behind? Remove it and its remaining links.
  if (groupId) {
    const rest = await client
      .from("guests")
      .select("id")
      .eq("rsvp_group_id", groupId)
      .limit(1);
    if (!rest.error && (rest.data ?? []).length === 0) {
      await client.from("rsvp_slugs").delete().eq("group_id", groupId);
      await client.from("rsvp_groups").delete().eq("id", groupId);
    }
  }

  return Response.json({ ok: true });
}
