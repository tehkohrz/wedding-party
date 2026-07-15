/** GET /api/admin/session — is a PIN required, and is this browser in? */
import { isAuthed, pinRequired } from "@/lib/adminAuth";

export async function GET(req: Request) {
  return Response.json({
    pinRequired: pinRequired(),
    authed: isAuthed(req),
  });
}
