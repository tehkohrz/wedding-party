/**
 * POST /api/admin/login — verify the admin PIN server-side and set the
 * httpOnly session cookie. GET /api/admin/session (separate route) reports
 * whether a PIN is required / already satisfied.
 *
 * Rate limited per IP: the PIN is short, so without a cap the whole
 * keyspace is scriptable in minutes. The window is generous enough that a
 * mistyped PIN at the reception desk never locks anyone out.
 */
import { authCookie, pinRequired, verifyPin } from "@/lib/adminAuth";
import { createRateLimiter, clientIp } from "@/lib/rateLimit";

const loginLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

export async function POST(req: Request) {
  if (!pinRequired()) {
    return Response.json({ ok: true });
  }

  // Counted before the PIN is checked, so a correct PIN can't be used to
  // reset the window between guesses.
  if (loginLimiter(clientIp(req))) {
    return Response.json({ error: "Too many attempts" }, { status: 429 });
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
