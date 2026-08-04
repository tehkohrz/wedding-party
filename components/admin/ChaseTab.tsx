"use client";

/**
 * Chase tab — who still hasn't responded, ready to nudge.
 *
 * One card per INVITATION (not per guest): a group's RSVP is submitted
 * once for everybody, so chasing is a per-household job. An invitation
 * appears here while any member is unanswered:
 *   - "No response"  — nobody in the party has replied
 *   - "Partial"      — some replied, some didn't (only possible when the
 *                      admin recorded answers by hand)
 *
 * Each card carries the party's names, a copy-link button, and a Remind
 * button that copies a softer follow-up message (a separate [input]
 * template from the first-send one, so a nudge doesn't read like the
 * original invitation).
 *
 * The side filter lets the couple split the chasing between them.
 */
import { useCallback, useEffect, useState } from "react";
import { Check, Download, Link2, MessageSquare, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ADMIN_COPY, EVENT_DETAILS } from "@/lib/content";
import { rsvpDaysRemaining, rsvpDeadlineLabel } from "@/lib/rsvpDeadline";
import { writeClipboard } from "@/lib/clipboard";

interface LinkRow {
  id: number;
  name: string;
  side: "bride" | "groom";
  slug: string;
  group_id: string;
  group_label: string;
  responded: boolean;
  after_party_invited: boolean;
}

interface PendingGroup {
  id: string;
  label: string;
  rows: LinkRow[];
  /** Some members answered, others didn't. */
  partial: boolean;
  sides: Set<"bride" | "groom">;
}

type SideFilter = "all" | "bride" | "groom";

export function ChaseTab() {
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("");
  const [side, setSide] = useState<SideFilter>("all");
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(false);
    fetch("/api/admin/links")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => {
        setLinks(j.links);
        setLoaded(true);
      })
      .catch(() => setError(true));
  }, []);
  useEffect(load, [load]);

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const urlFor = (slug: string) => `${origin}/r/${slug}`;

  const reminderFor = (row: LinkRow) =>
    ADMIN_COPY.reminderMessageTemplate
      .replaceAll("{name}", row.name)
      .replaceAll("{link}", urlFor(row.slug))
      .replaceAll("{date}", EVENT_DETAILS.date)
      .replaceAll("{deadline}", rsvpDeadlineLabel())
      .replaceAll("{days}", String(Math.max(0, rsvpDaysRemaining())));

  async function copy(key: string, text: string) {
    const ok = await writeClipboard(text);
    if (!ok) return alert("Couldn't copy — select the text manually.");
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
  }

  if (error) {
    return (
      <div className="h-full grid place-items-center">
        <Button variant="outline" onClick={load}>
          Retry
        </Button>
      </div>
    );
  }
  if (!loaded) {
    return (
      <div className="h-full grid place-items-center">
        <p className="font-sans text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  // ── Aggregate the per-guest link rows into invitations ──
  const byGroup = new Map<string, PendingGroup>();
  for (const l of links) {
    const g = byGroup.get(l.group_id) ?? {
      id: l.group_id,
      label: l.group_label,
      rows: [],
      partial: false,
      sides: new Set<"bride" | "groom">(),
    };
    g.rows.push(l);
    g.sides.add(l.side);
    byGroup.set(l.group_id, g);
  }
  const allGroups = [...byGroup.values()];
  for (const g of allGroups) {
    const answered = g.rows.filter((r) => r.responded).length;
    g.partial = answered > 0 && answered < g.rows.length;
  }

  // Anything not fully answered is still chaseable.
  const outstanding = allGroups.filter((g) =>
    g.rows.some((r) => !r.responded)
  );

  const q = filter.trim().toLowerCase();
  const visible = outstanding.filter(
    (g) =>
      (side === "all" || g.sides.has(side)) &&
      (q === "" ||
        g.label.toLowerCase().includes(q) ||
        g.rows.some((r) => r.name.toLowerCase().includes(q)))
  );

  const days = rsvpDaysRemaining();
  const guestsPending = visible.reduce(
    (n, g) => n + g.rows.filter((r) => !r.responded).length,
    0
  );

  function exportCsv() {
    const quote = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [
      "invitation,guest,side,status,link,reminder",
      ...visible.flatMap((g) =>
        g.rows
          .filter((r) => !r.responded)
          .map((r) =>
            [
              quote(g.label),
              quote(r.name),
              r.side,
              g.partial ? "partial" : "no response",
              urlFor(r.slug),
              quote(reminderFor(r)),
            ].join(",")
          )
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "rsvp-chase-list.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* ── Toolbar ── */}
      <div className="shrink-0 px-6 py-3 border-b border-border flex flex-wrap items-center gap-3">
        <Input
          placeholder="Filter by name or invitation…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-10 max-w-xs"
        />
        <div className="flex items-center gap-1">
          {(["all", "bride", "groom"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={cn(
                "rounded-pill px-3 py-1.5 font-sans text-xs transition-colors",
                side === s
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {s === "all" ? "Both sides" : s}
            </button>
          ))}
        </div>
        <span className="font-sans text-xs text-muted-foreground">
          {visible.length} invitations · {guestsPending} guests to chase
        </span>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={exportCsv}
          disabled={visible.length === 0}
        >
          <Download /> Export CSV
        </Button>
      </div>

      {/* ── Deadline urgency ── */}
      <div className="shrink-0 px-6 pt-3">
        <div
          className={cn(
            "rounded-card px-4 py-2 font-sans text-sm",
            days < 0
              ? "bg-destructive/10 text-destructive"
              : days <= 14
                ? "bg-standby/20"
                : "bg-muted/60"
          )}
        >
          {days < 0
            ? `RSVP deadline passed ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago (${rsvpDeadlineLabel()}) — ${outstanding.length} invitation(s) never responded.`
            : `${days} day${days === 1 ? "" : "s"} until the RSVP deadline (${rsvpDeadlineLabel()}) · ${outstanding.length} of ${allGroups.length} invitations outstanding`}
        </div>
      </div>

      {/* ── The list ── */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="max-w-4xl mx-auto space-y-3 pt-3">
          {visible.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <PartyPopper className="size-8 mx-auto text-primary" />
              <p className="font-display text-2xl">
                {outstanding.length === 0
                  ? "Everyone has responded!"
                  : "Nothing to chase in this filter."}
              </p>
              <p className="font-sans text-sm text-muted-foreground">
                {outstanding.length === 0
                  ? "Every invitation has an answer on file."
                  : "Try the other side, or clear the search."}
              </p>
            </div>
          ) : (
            <>
              <p className="font-sans text-xs text-muted-foreground">
                {ADMIN_COPY.chaseHint}
              </p>

              {visible.map((g) => (
                <div
                  key={g.id}
                  className="rounded-card border border-border bg-surface px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-sans text-sm font-semibold">{g.label}</p>
                    <span
                      className={cn(
                        "font-sans text-[10px] uppercase tracking-wider rounded-pill px-2 py-0.5",
                        g.partial
                          ? "bg-standby/25 text-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {g.partial ? "Partial" : "No response"}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1.5">
                    {g.rows.map((r) => (
                      <div
                        key={r.id}
                        className={cn(
                          "flex flex-wrap items-center gap-2 rounded-lg px-3 py-2",
                          r.responded ? "bg-muted/20" : "bg-muted/50"
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "size-2 rounded-full shrink-0",
                            r.responded ? "bg-arrived" : "bg-standby"
                          )}
                        />
                        <span
                          className={cn(
                            "font-sans text-sm min-w-24",
                            r.responded && "text-muted-foreground line-through"
                          )}
                        >
                          {r.name}
                        </span>
                        <span className="font-sans text-[10px] uppercase tracking-wider text-muted-foreground">
                          {r.side}
                        </span>
                        <div className="flex-1" />
                        {!r.responded && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 font-sans text-xs"
                              onClick={() => copy(`u${r.id}`, urlFor(r.slug))}
                            >
                              {copied === `u${r.id}` ? (
                                <Check className="size-3" />
                              ) : (
                                <Link2 className="size-3" />
                              )}
                              Link
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 px-2 font-sans text-xs"
                              onClick={() => copy(`m${r.id}`, reminderFor(r))}
                            >
                              {copied === `m${r.id}` ? (
                                <Check className="size-3" />
                              ) : (
                                <MessageSquare className="size-3" />
                              )}
                              Remind
                            </Button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
