/**
 * Server-only Supabase client + database row types.
 *
 * SERVER ONLY: this module reads SUPABASE_SECRET_KEY (the sb_secret_... key;
 * the legacy service_role JWT also works), which bypasses RLS entirely. It
 * must only be imported from route handlers (app/api/*) or server components
 * — never from a "use client" file. The `import "server-only"` guard turns
 * an accidental client import into a build error.
 *
 * All client-side data access goes through the /api routes; the browser
 * never talks to Supabase directly and never sees any key.
 */
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─── Row types (mirror supabase/schema.sql) ──────────────────────────────────

/** Shape shared by rsvp_groups and seating_groups rows. */
export interface DbGroup {
  id: string;
  label: string;
}

export interface DbRsvpSlug {
  slug: string;
  group_id: string;
  guest_id: number | null;
}

export interface DbGuest {
  id: number;
  name: string;
  search_aliases: string; // semicolon-separated
  side: "bride" | "groom";
  rsvp_group_id: string | null;
  seating_group_id: string | null;
  is_kid: boolean;
  is_plus_one: boolean;
  row_num: number | null;
  section: string | null;
  seat: number | null;
  attending: boolean | null;
  food_choice: "A" | "B" | "K" | null; // K = kids meal
  dietary_comment: string | null;
  after_party: boolean | null;
  responded_at: string | null; // ISO timestamptz
}

export interface DbAttendance {
  guest_id: number;
  arrived_at: string; // ISO timestamptz
}

// ─── Client singleton ────────────────────────────────────────────────────────

let cached: SupabaseClient | null = null;

/**
 * Lazily-created singleton. Lazy so that builds without env vars (e.g. CI
 * type-checks) don't crash at import time — only when a route actually runs.
 */
export function db(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  // SUPABASE_SECRET_KEY is canonical; the old var name is accepted as a
  // fallback so existing .env.local files keep working.
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL / SUPABASE_SECRET_KEY env vars. " +
        "Copy .env.example to .env.local and fill them in (see README)."
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false }, // server-side: no session storage
  });
  return cached;
}
