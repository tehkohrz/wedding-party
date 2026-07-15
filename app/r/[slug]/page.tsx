// /r/[slug] — a guest's personal RSVP link (e.g. /r/john-tan).
//
// Server component: resolves the slug to its group + members directly via
// lib/db (no client fetch needed for the initial load), then hands off to
// the client-side RSVP stepper. Unknown slugs render Next's not-found page.
//
// Stage 1 renders a "invitation found" preview of the group; Stage 2
// replaces the preview with the real stepper (attendance → menu → ...).
//
// Next 16: `params` is a Promise — must be awaited.

import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { EVENT_DETAILS, RSVP_COPY } from "@/lib/content";
import { PhotoSlideshow } from "@/components/PhotoSlideshow";
import { WelcomeEquation } from "@/components/WelcomeEquation";
import { EventCountdown } from "@/components/EventCountdown";

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
      .select("id, name, attending, responded_at")
      .eq("group_id", groupId)
      .order("id"),
  ]);

  if (groupRes.error || membersRes.error) notFound();

  const group = groupRes.data;
  const members = membersRes.data ?? [];
  // The guest whose name is in the URL — greeted personally.
  const linkGuest = members.find((m) => m.id === linkGuestId);

  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col landscape:flex-row">
      <PhotoSlideshow className="h-[32%] landscape:h-full landscape:w-[45%] shrink-0" />

      <section className="relative flex-1 overflow-y-auto bg-background flex flex-col items-center justify-center px-6 py-8">
        <div className="text-center space-y-6 max-w-xl w-full">
          <p className="font-sans text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {RSVP_COPY.eyebrow}
          </p>

          <WelcomeEquation />

          <div className="space-y-3">
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
          </div>

          {/* Stage-1 preview of the resolved invitation. Stage 2 replaces
              this block with the RSVP stepper. */}
          <div className="rounded-card border border-border bg-surface px-6 py-5 space-y-2 text-left">
            <p className="font-display text-2xl text-center">
              {linkGuest ? `Hello, ${linkGuest.name}!` : `Hello!`}
            </p>
            <p className="font-sans text-sm text-muted-foreground text-center">
              This invitation is for {group.label}:
            </p>
            <ul className="font-sans text-base text-center space-y-0.5">
              {members.map((m) => (
                <li key={m.id}>{m.name}</li>
              ))}
            </ul>
            <p className="font-sans text-xs text-muted-foreground text-center pt-2">
              The RSVP steps arrive in Stage 2.
            </p>
          </div>

          <Link
            href="/"
            className="inline-block font-sans text-sm text-muted-foreground hover:text-foreground transition"
          >
            ← Not you? Search again
          </Link>
        </div>
      </section>
    </div>
  );
}
