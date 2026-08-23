// /r/[slug] — a guest's personal RSVP link (e.g. /r/john-tan).
//
// Server component: resolves the slug to its group + members directly via
// lib/db (no client fetch for the initial load), then mounts the client
// RSVP stepper (components/rsvp/RsvpFlow) with the data as props.
// Unknown slugs render Next's not-found page. A DATABASE failure is a
// different thing and renders the "temporarily unavailable" view instead —
// telling a guest their invitation "could not be found" during an outage
// is both wrong and alarming.
//
// The page itself is just the photo/content split — the stepper renders
// the whole content side, opening on an intro view that mirrors the public
// landing page (hero + countdown + RSVP button + details).
//
// Next 16: `params` is a Promise — must be awaited.

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PhotoSlideshow } from "@/components/PhotoSlideshow";
import { RsvpFlow } from "@/components/rsvp/RsvpFlow";
import { RSVP_COPY } from "@/lib/content";
import type { RsvpGroup, RsvpMember } from "@/components/rsvp/types";

export default async function PersonalRsvpPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const client = db();

  const slugRow = await client
    .from("rsvp_slugs")
    .select("group_id, guest_id")
    .eq("slug", slug.toLowerCase())
    .maybeSingle();

  // Database unreachable vs. link genuinely unknown — NOT the same thing.
  if (slugRow.error) return <InvitationUnavailable />;
  if (!slugRow.data) notFound();

  const groupId = slugRow.data.group_id as string;
  const linkGuestId = slugRow.data.guest_id as number | null;

  const [groupRes, membersRes] = await Promise.all([
    client.from("rsvp_groups").select("id, label").eq("id", groupId).single(),
    client
      .from("guests")
      // "*" keeps this working on a DB that predates newer columns
      // (e.g. is_plus_one) — missing fields arrive as undefined.
      .select("*")
      .eq("rsvp_group_id", groupId)
      .order("id"),
  ]);

  if (groupRes.error || membersRes.error) return <InvitationUnavailable />;

  const group = groupRes.data as RsvpGroup;
  const members = (membersRes.data ?? []) as RsvpMember[];
  const linkGuest = members.find((m) => m.id === linkGuestId);

  return (
    // Same shell as the public landing page (app/page.tsx): photo panel +
    // an internally-scrolling content side.
    <div className="h-dvh w-screen overflow-hidden flex flex-col landscape:flex-row">
      {/* Panel width/height are [input] fields in lib/content.ts. */}
      <PhotoSlideshow />

      <section className="relative flex-1 overflow-y-auto scroll-smooth invite-stripes">
        <div className="p-3 sm:p-6 min-h-full flex flex-col">
          <div className="invite-card p-1.5 sm:p-2 flex-1 flex flex-col">
            <div className="invite-card-inner flex-1">
              <RsvpFlow
                slug={slug.toLowerCase()}
                group={group}
                members={members}
                greeting={linkGuest?.name}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Shown when the database can't be reached. Deliberately reassuring and
 * deliberately NOT a 404: the guest's invitation exists, we just can't
 * read it this second.
 */
function InvitationUnavailable() {
  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col landscape:flex-row">
      <PhotoSlideshow />
      <section className="relative flex-1 overflow-y-auto invite-stripes">
        <div className="p-3 sm:p-6 min-h-full flex flex-col">
          <div className="invite-card p-1.5 sm:p-2 flex-1 flex flex-col">
            <div className="invite-card-inner flex-1 grid place-items-center px-6 py-16">
              <div className="text-center space-y-3 max-w-sm">
                <h1 className="font-display text-3xl sm:text-4xl">
                  {RSVP_COPY.linkUnavailableHeading}
                </h1>
                <p className="font-sans text-sm text-muted-foreground">
                  {RSVP_COPY.linkUnavailableBody}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
