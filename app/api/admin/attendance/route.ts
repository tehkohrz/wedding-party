/**
 * /api/admin/attendance — corrective attendance operations (PIN-gated).
 *
 * DELETE {guest_id}  → unmark one arrival (admin tapped an arrived row)
 * DELETE {all: true} → wipe the table ("Reset all", double-confirmed in UI)
 * PUT    {attendance: [{guest_id, arrived_at-ms}]}
 *                    → replace the whole table (restore from a backup file)
 */
import { z } from "zod";
import { db } from "@/lib/db";
import { isAuthed, unauthorized } from "@/lib/adminAuth";

const DeleteSchema = z
  .object({
    guest_id: z.number().int().positive().optional(),
    all: z.literal(true).optional(),
  })
  .refine((o) => o.guest_id !== undefined || o.all, {
    message: "guest_id or all required",
  });

export async function DELETE(req: Request) {
  if (!isAuthed(req)) return unauthorized();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = DeleteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const q = db().from("attendance").delete();
  const { error } = parsed.data.all
    ? await q.gte("guest_id", 0) // PostgREST refuses DELETE with no filter
    : await q.eq("guest_id", parsed.data.guest_id!);
  if (error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }
  return Response.json({ ok: true });
}

const ReplaceSchema = z.object({
  attendance: z
    .array(
      z.object({
        guest_id: z.number().int().positive(),
        arrived_at: z.number().int().nonnegative(),
      })
    )
    .max(500),
});

export async function PUT(req: Request) {
  if (!isAuthed(req)) return unauthorized();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = ReplaceSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const client = db();
  const wipe = await client.from("attendance").delete().gte("guest_id", 0);
  if (wipe.error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }
  if (parsed.data.attendance.length > 0) {
    const ins = await client.from("attendance").insert(
      parsed.data.attendance.map((r) => ({
        guest_id: r.guest_id,
        arrived_at: new Date(r.arrived_at).toISOString(),
      }))
    );
    if (ins.error) {
      return Response.json({ error: "Database error" }, { status: 500 });
    }
  }
  return Response.json({ ok: true });
}
