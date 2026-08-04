"use client";

/**
 * Links tab — the send-out list. Answers "which link do I send to whom?"
 *
 * Grouped by INVITATION (rsvp group), because any member's link opens the
 * whole group's response: message one person per household, or everyone —
 * both work. Each row has a copy-link button and a copy-message button
 * (the WhatsApp text is an [input] template in lib/content.ts).
 *
 * The green/■ marker shows who has already responded, so chasing is easy.
 * Plus-ones don't appear — they have no link by design.
 *
 * CSV export carries the same columns for a spreadsheet mail-merge.
 */
import { useCallback, useEffect, useState } from "react";
import { Check, Download, Link2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ADMIN_COPY, EVENT_DETAILS } from "@/lib/content";
import { rsvpDeadlineLabel } from "@/lib/rsvpDeadline";
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

export function LinksTab() {
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);
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

  /** The ready-to-paste message for one guest. */
  const messageFor = (row: LinkRow) =>
    ADMIN_COPY.linkMessageTemplate
      .replaceAll("{name}", row.name)
      .replaceAll("{link}", urlFor(row.slug))
      .replaceAll("{date}", EVENT_DETAILS.date)
      .replaceAll("{deadline}", rsvpDeadlineLabel());

  async function copy(key: string, text: string) {
    const ok = await writeClipboard(text);
    if (!ok) return alert("Couldn't copy — select the text manually.");
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
  }


  function exportCsv() {
    const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [
      "name,side,invitation,link,responded,after_party_invited,message",
      ...visible.map((l) =>
        [
          q(l.name),
          l.side,
          q(l.group_label),
          urlFor(l.slug),
          l.responded ? "yes" : "no",
          l.after_party_invited ? "yes" : "no",
          q(messageFor(l)),
        ].join(",")
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "rsvp-links.csv";
    a.click();
    URL.revokeObjectURL(url);
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

  const q = filter.trim().toLowerCase();
  const visible = links.filter(
    (l) =>
      (!pendingOnly || !l.responded) &&
      (q === "" ||
        l.name.toLowerCase().includes(q) ||
        l.group_label.toLowerCase().includes(q))
  );

  // Group the visible rows by invitation, preserving guest-id order.
  const groups: Array<{ id: string; label: string; rows: LinkRow[] }> = [];
  for (const l of visible) {
    const last = groups.find((g) => g.id === l.group_id);
    if (last) last.rows.push(l);
    else groups.push({ id: l.group_id, label: l.group_label, rows: [l] });
  }

  const respondedCount = links.filter((l) => l.responded).length;

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="shrink-0 px-6 py-3 border-b border-border flex flex-wrap items-center gap-3">
        <Input
          placeholder="Filter by name or invitation…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-10 max-w-xs"
        />
        <label className="flex items-center gap-1.5 font-sans text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={pendingOnly}
            onChange={(e) => setPendingOnly(e.target.checked)}
          />
          Not yet responded
        </label>
        <span className="font-sans text-xs text-muted-foreground">
          {groups.length} invitations · {visible.length} links ·{" "}
          {respondedCount}/{links.length} responded
        </span>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download /> Export CSV
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="max-w-4xl mx-auto space-y-3 pt-3">
          <p className="font-sans text-xs text-muted-foreground">
            {ADMIN_COPY.linksHint}
          </p>

          {groups.map((grp) => (
            <div
              key={grp.id}
              className="rounded-card border border-border bg-surface px-4 py-3"
            >
              <p className="font-sans text-sm font-semibold">{grp.label}</p>
              <div className="mt-2 space-y-1.5">
                {grp.rows.map((l) => {
                  const url = urlFor(l.slug);
                  return (
                    <div
                      key={l.id}
                      className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 px-3 py-2"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "size-2 rounded-full shrink-0",
                          l.responded ? "bg-arrived" : "bg-standby"
                        )}
                        title={l.responded ? "Responded" : "No response yet"}
                      />
                      <span className="font-sans text-sm min-w-24">
                        {l.name}
                      </span>
                      <code className="font-mono text-xs text-muted-foreground truncate max-w-xs">
                        /r/{l.slug}
                      </code>
                      {l.after_party_invited && (
                        <span className="font-sans text-[10px] uppercase tracking-wider text-primary">
                          after-party
                        </span>
                      )}
                      <div className="flex-1" />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 font-sans text-xs"
                        onClick={() => copy(`u${l.id}`, url)}
                      >
                        {copied === `u${l.id}` ? (
                          <Check className="size-3" />
                        ) : (
                          <Link2 className="size-3" />
                        )}
                        Link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 font-sans text-xs"
                        onClick={() => copy(`m${l.id}`, messageFor(l))}
                      >
                        {copied === `m${l.id}` ? (
                          <Check className="size-3" />
                        ) : (
                          <MessageSquare className="size-3" />
                        )}
                        Message
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {groups.length === 0 && (
            <p className="font-sans text-sm text-muted-foreground text-center py-8">
              No links match that filter.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
