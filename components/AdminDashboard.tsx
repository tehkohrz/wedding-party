"use client";

/**
 * Admin dashboard — live attendance overview + manual override.
 *
 * Reads guests from the build-time data and attendance from Dexie via
 * useLiveQuery, so stats and statuses update in real time as guests check
 * in on the same iPad. Tapping a guest row toggles their arrival (for
 * corrections / marking someone who couldn't use the iPad).
 */
import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { guests } from "@/lib/data";
import { db, markArrived, unmark } from "@/lib/attendance";
import { ADMIN_COPY } from "@/lib/content";
import { AdminDataControls } from "@/components/AdminDataControls";

type Filter = "all" | "arrived" | "pending";

export function AdminDashboard() {
  const arrived = useLiveQuery(() => db.attendance.toArray());
  const arrivedMap = useMemo(() => {
    const m = new Map<number, number>(); // guest_id → arrived_at
    for (const r of arrived ?? []) m.set(r.guest_id, r.arrived_at);
    return m;
  }, [arrived]);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  // ── Stats ──────────────────────────────────────────────────────────────
  const total = guests.length;
  const arrivedCount = arrivedMap.size;
  const pct = total > 0 ? Math.round((arrivedCount / total) * 100) : 0;

  const brideTotal = guests.filter((g) => g.side === "bride").length;
  const groomTotal = guests.filter((g) => g.side === "groom").length;
  const brideArrived = guests.filter(
    (g) => g.side === "bride" && arrivedMap.has(g.id)
  ).length;
  const groomArrived = guests.filter(
    (g) => g.side === "groom" && arrivedMap.has(g.id)
  ).length;

  // ── Filtered list ──────────────────────────────────────────────────────
  const visible = guests.filter((g) => {
    const isArrived = arrivedMap.has(g.id);
    if (filter === "arrived" && !isArrived) return false;
    if (filter === "pending" && isArrived) return false;
    if (query.trim()) {
      return g.name.toLowerCase().includes(query.trim().toLowerCase());
    }
    return true;
  });

  function toggle(guestId: number) {
    if (arrivedMap.has(guestId)) unmark(guestId);
    else markArrived(guestId);
  }

  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col">
      {/* Header + stats (fixed) */}
      <header className="shrink-0 px-6 pt-6 pb-4 border-b border-border">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h1 className="font-display text-3xl">
              {ADMIN_COPY.dashboardHeading}
            </h1>
            <div className="flex items-center gap-4">
              <div className="font-sans text-sm text-muted-foreground">
                {arrivedCount} / {total} · {pct}%
              </div>
              <AdminDataControls />
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="h-3 rounded-pill bg-muted overflow-hidden">
            <div
              className="h-full bg-arrived transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Bride / groom split */}
          <div className="grid grid-cols-2 gap-4">
            <SplitStat
              label="Bride's side"
              arrived={brideArrived}
              total={brideTotal}
              colorVar="--rose"
            />
            <SplitStat
              label="Groom's side"
              arrived={groomArrived}
              total={groomTotal}
              colorVar="--sky"
            />
          </div>
        </div>
      </header>

      {/* Filter controls (fixed) */}
      <div className="shrink-0 px-6 py-3 border-b border-border">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
          <Input
            placeholder={ADMIN_COPY.filterPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 h-10 placeholder:transition-opacity focus:placeholder:opacity-0"
          />
          <div className="flex gap-1">
            {(["all", "arrived", "pending"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f === "all"
                  ? ADMIN_COPY.filterAll
                  : f === "arrived"
                    ? ADMIN_COPY.filterArrived
                    : ADMIN_COPY.filterPending}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable guest list */}
      <main className="flex-1 overflow-y-auto px-6 py-3">
        <div className="max-w-2xl mx-auto space-y-1.5">
          {visible.length === 0 && (
            <p className="font-sans text-sm text-muted-foreground text-center py-8">
              {ADMIN_COPY.noMatches}
            </p>
          )}
          {visible.map((g) => {
            const arrivedAt = arrivedMap.get(g.id);
            const isArrived = arrivedAt !== undefined;
            return (
              <div
                key={g.id}
                className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-2.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={cn(
                      "inline-block size-2.5 rounded-full shrink-0",
                      isArrived ? "bg-arrived" : "bg-pending"
                    )}
                  />
                  <span className="font-display text-lg truncate">
                    {g.name}
                  </span>
                  <span className="font-sans text-xs text-muted-foreground shrink-0">
                    {g.side} · R{g.row}
                    {g.section ?? ""} S{g.seat}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {isArrived && (
                    <span className="flex items-center gap-1 font-sans text-xs text-arrived">
                      <Check className="size-3" />
                      {formatTime(arrivedAt)}
                    </span>
                  )}
                  <Button
                    variant={isArrived ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggle(g.id)}
                  >
                    {isArrived ? "Unmark" : "Mark"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function SplitStat({
  label,
  arrived,
  total,
  colorVar,
}: {
  label: string;
  arrived: number;
  total: number;
  colorVar: string;
}) {
  const pct = total > 0 ? Math.round((arrived / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between font-sans text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span>
          {arrived} / {total}
        </span>
      </div>
      <div className="h-2 rounded-pill bg-muted overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: `hsl(var(${colorVar}))` }}
        />
      </div>
    </div>
  );
}

/** Format an epoch-ms timestamp as HH:MM (24h, local). */
function formatTime(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}
