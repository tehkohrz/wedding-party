/**
 * PATCH /api/admin/guests/[id] — edit one guest (rename, regroup, assign a
 * seat, kid flag, or override an RSVP answer). Partial body; Zod-validated.
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

  const { data, error } = await db()
    .from("guests")
    .update(parsed.data)
    .eq("id", guestId)
    .select()
    .maybeSingle();

  if (error) {
    // Most likely a foreign-key miss (unknown group id typed in the editor).
    return Response.json(
      { error: "Update failed — do the group ids exist?" },
      { status: 400 }
    );
  }
  if (!data) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ guest: data });
}
