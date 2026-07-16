/**
 * /api/attendance — day-of arrivals, shared by every check-in device.
 *
 * GET  → all arrival records ({guest_id, arrived_at-in-epoch-ms}) — the
 *        same shape the old Dexie table used, so client code carried over.
 * POST → mark guests arrived (the check-in tap / group confirm). Upsert:
 *        re-marking refreshes the timestamp, never duplicates.
 *
 * Unauthenticated by design, like /api/guests: the check-in iPads run
 * kiosk-style with no login. Unmark/reset live under /api/admin (PIN'd).
 */
import { z } from "zod";
import { db } from "@/lib/db";

export async function GET() {
  const { data, error } = await db()
    .from("attendance")
    .select("guest_id, arrived_at");
  if (error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }
  return Response.json({
    attendance: (data ?? []).map((r) => ({
      guest_id: r.guest_id as number,
      arrived_at: new Date(r.arrived_at as string).getTime(),
    })),
  });
}

const MarkSchema = z.object({
  guest_ids: z.array(z.number().int().positive()).min(1).max(50),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = MarkSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error } = await db()
    .from("attendance")
    .upsert(
      parsed.data.guest_ids.map((id) => ({ guest_id: id, arrived_at: now })),
      { onConflict: "guest_id" }
    );
  if (error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
