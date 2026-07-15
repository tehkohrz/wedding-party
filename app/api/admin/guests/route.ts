/** GET /api/admin/guests — the full guest table for the admin editor. */
import { db } from "@/lib/db";
import { isAuthed, unauthorized } from "@/lib/adminAuth";

export async function GET(req: Request) {
  if (!isAuthed(req)) return unauthorized();

  const { data, error } = await db().from("guests").select("*").order("id");
  if (error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }
  return Response.json({ guests: data ?? [] });
}
