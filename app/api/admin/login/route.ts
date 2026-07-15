/**
 * POST /api/admin/login — verify the admin PIN server-side and set the
 * httpOnly session cookie. GET /api/admin/session (separate route) reports
 * whether a PIN is required / already satisfied.
 */
import { authCookie, pinRequired, verifyPin } from "@/lib/adminAuth";

export async function POST(req: Request) {
  if (!pinRequired()) {
    return Response.json({ ok: true });
  }

  let pin = "";
  try {
    const body = await req.json();
    pin = typeof body?.pin === "string" ? body.pin : "";
  } catch {
    // fall through to the failure response
  }

  if (!verifyPin(pin)) {
    return Response.json({ error: "Incorrect PIN" }, { status: 401 });
  }

  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": authCookie() } }
  );
}
