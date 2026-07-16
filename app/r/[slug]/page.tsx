// /r/[slug] — a guest's personal RSVP link (e.g. /r/john-tan).
//
// Server component: resolves the slug to its group + members directly via
// lib/db (no client fetch for the initial load), then mounts the client
// RSVP stepper (components/rsvp/RsvpFlow) with the data as props.
// Unknown slugs render Next's not-found page.
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

  if (slugRow.error || !slugRow.data) notFound();

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

  if (groupRes.error || membersRes.error) notFound();

  const group = groupRes.data as RsvpGroup;
  const members = (membersRes.data ?? []) as RsvpMember[];
  const linkGuest = members.find((m) => m.id === linkGuestId);

  return (
    // Same shell as the public landing page (app/page.tsx): photo panel +
    // an internally-scrolling content side.
    <div className="h-dvh w-screen overflow-hidden flex flex-col landscape:flex-row">
      {/* Panel width/height are [input] fields in lib/content.ts. */}
      <PhotoSlideshow />

      <section className="relative flex-1 overflow-y-auto scroll-smooth bg-background">
        <RsvpFlow
          slug={slug.toLowerCase()}
          group={group}
          members={members}
          greeting={linkGuest?.name}
        />
      </section>
    </div>
  );
}
