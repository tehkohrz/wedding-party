// /r/[slug] — a guest's personal RSVP link (e.g. /r/john-tan).
//
// Server component: resolves the slug to its group + members directly via
// lib/db (no client fetch for the initial load), then mounts the client
// RSVP stepper (components/rsvp/RsvpFlow) with the data as props.
// Unknown slugs render Next's not-found page.
//
// Next 16: `params` is a Promise — must be awaited.

import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { EVENT_DETAILS, RSVP_COPY } from "@/lib/content";
import { PhotoSlideshow } from "@/components/PhotoSlideshow";
import { EventCountdown } from "@/components/EventCountdown";
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
    client.from("groups").select("id, label").eq("id", groupId).single(),
    client
      .from("guests")
      .select(
        "id, name, is_kid, attending, food_choice, dietary_comment, after_party, responded_at"
      )
      .eq("group_id", groupId)
      .order("id"),
  ]);

  if (groupRes.error || membersRes.error) notFound();

  const group = groupRes.data as RsvpGroup;
  const members = (membersRes.data ?? []) as RsvpMember[];
  const linkGuest = members.find((m) => m.id === linkGuestId);

  return (
    <div className="min-h-dvh w-screen flex flex-col landscape:flex-row landscape:h-dvh landscape:overflow-hidden">
      {/* Panel width/height are [input] fields in lib/content.ts. */}
      <PhotoSlideshow />

      {/* Content side — scrollable: the attendance step can be taller than
          the viewport for big groups. */}
      <section className="relative flex-1 landscape:overflow-y-auto bg-background px-6 py-8">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Compact header (the landing page has the full hero) */}
          <header className="text-center space-y-3">
            <p className="font-sans text-xs uppercase tracking-[0.25em] text-muted-foreground">
              {RSVP_COPY.eyebrow}
            </p>
            <h1 className="font-display text-4xl leading-tight">
              {linkGuest ? `Hello, ${linkGuest.name}!` : "Hello!"}
            </h1>
            <div className="space-y-1">
              <p className="font-sans text-base text-foreground">
                {EVENT_DETAILS.date}
              </p>
              <p className="font-sans text-sm text-muted-foreground">
                {EVENT_DETAILS.venueName}
                {EVENT_DETAILS.venueAddress &&
                  ` · ${EVENT_DETAILS.venueAddress}`}
              </p>
            </div>
            <EventCountdown />
          </header>

          <RsvpFlow group={group} members={members} />

          <div className="text-center">
            <Link
              href="/"
              className="inline-block font-sans text-xs text-muted-foreground hover:text-foreground transition"
            >
              ← Not you? Search again
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
