/**
 * Client-safe RSVP types — the member shape the /r/[slug] server component
 * passes into the client stepper.
 *
 * Deliberately NOT imported from lib/db.ts: that module is server-only
 * (service-role client) and would fail the build if pulled into "use client"
 * code. This mirrors just the fields the flow needs.
 */
export interface RsvpMember {
  id: number;
  name: string;
  is_kid: boolean;
  attending: boolean | null;
  food_choice: "A" | "B" | null;
  dietary_comment: string | null;
  after_party: boolean | null;
  responded_at: string | null;
}

export interface RsvpGroup {
  id: string;
  label: string;
}
