/**
 * Server-side admin authentication — the PIN finally becomes a real secret.
 *
 * v1 compared a NEXT_PUBLIC_ PIN in the browser (soft gate, world-readable).
 * Now: the browser POSTs the PIN to /api/admin/login; the server compares it
 * against ADMIN_PIN (never shipped to the client) and sets an httpOnly
 * session cookie holding sha256(pin). Admin data routes verify that cookie.
 *
 * Still a wedding-grade gate (no rate limiting, single shared PIN) — but the
 * secret no longer rides in the JS bundle, and the cookie can't be read by
 * page scripts.
 *
 * Env (server-only): ADMIN_PIN, ADMIN_PIN_ENABLED. The old NEXT_PUBLIC_*
 * names are accepted as fallbacks so existing .env.local files keep working.
 */
import "server-only";
import { createHash } from "node:crypto";

const COOKIE_NAME = "swa_admin";

function pin(): string {
  return process.env.ADMIN_PIN ?? process.env.NEXT_PUBLIC_ADMIN_PIN ?? "";
}

export function pinRequired(): boolean {
  const flag =
    process.env.ADMIN_PIN_ENABLED ??
    process.env.NEXT_PUBLIC_ADMIN_PIN_ENABLED ??
    "true";
  return flag === "true";
}

function sessionToken(): string {
  return createHash("sha256").update(`swa-admin:${pin()}`).digest("hex");
}

export function verifyPin(candidate: string): boolean {
  return pin() !== "" && candidate === pin();
}

/** Set-Cookie header value for a successful login (12h, httpOnly). */
export function authCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${sessionToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${secure}`;
}

/** Does this request carry a valid admin session (or is the gate off)? */
export function isAuthed(req: Request): boolean {
  if (!pinRequired()) return true;
  const cookies = req.headers.get("cookie") ?? "";
  const m = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return m !== null && m[1] === sessionToken();
}

export function unauthorized(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
