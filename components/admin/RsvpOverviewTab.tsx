"use client";

/**
 * RSVP overview — the numbers for the event manager: response progress,
 * attending by side, food totals (adults / kids' meals), after-party
 * headcount, and a per-group response table with dietary comments.
 */
import { useCallback, useEffect, useState } from "react";
import { Check, X, RefreshCw, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MENU } from "@/lib/content";

interface Overview {
  guests: {
    total: number;
    responded: number;
    attending: number;
    declined: number;
    pending: number;
    kidsAttending: number;
  };
  side: Record<"bride" | "groom", { total: number; attending: number }>;
  food: Record<"A" | "B", { adults: number; kids: number }>;
  afterParty: number;
  groups: Array<{
    id: string;
    label: string;
    responded: boolean;
    members: Array<{
      name: string;
      is_kid: boolean;
      attending: boolean | null;
      food_choice: "A" | "B" | null;
      after_party: boolean | null;
      dietary_comment: string | null;
    }>;
  }>;
}

export function RsvpOverviewTab() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    fetch("/api/admin/overview")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  useEffect(load, [load]);

  if (error) {
    return (
      <div className="h-full grid place-items-center">
        <div className="text-center space-y-2">
          <p className="font-sans text-sm text-destructive">
            Couldn&apos;t load the overview.
          </p>
          <Button variant="outline" size="sm" onClick={load}>
            Retry
          </Button>
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="h-full grid place-items-center">
        <p className="font-sans text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const g = data.guests;
  const mainName = (id: "A" | "B") =>
    MENU.mains.find((m) => m.id === id)?.name ?? id;

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Headline stats */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">RSVP overview</h2>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Responded" value={`${g.responded} / ${g.total}`} />
          <StatCard
            label="Attending"
            value={String(g.attending)}
            sub={`${g.kidsAttending} kids`}
          />
          <StatCard label="Declined" value={String(g.declined)} />
          <StatCard label="No response" value={String(g.pending)} />
        </div>

        {/* Response progress */}
        <div className="h-3 rounded-pill bg-muted overflow-hidden">
          <div
            className="h-full bg-arrived transition-all"
            style={{
              width: `${g.total ? Math.round((g.responded / g.total) * 100) : 0}%`,
            }}
          />
        </div>

        {/* Side + food + after-party — the caterer numbers */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-card border border-border bg-surface px-4 py-3 space-y-1.5">
            <p className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
              Attending by side
            </p>
            <p className="font-sans text-sm">
              Bride: <strong>{data.side.bride.attending}</strong> /{" "}
              {data.side.bride.total} · Groom:{" "}
              <strong>{data.side.groom.attending}</strong> /{" "}
              {data.side.groom.total}
            </p>
            <p className="font-sans text-sm flex items-center gap-1.5">
              <PartyPopper className="size-4" />
              After-party: <strong>{data.afterParty}</strong>
            </p>
          </div>
          <div className="rounded-card border border-border bg-surface px-4 py-3 space-y-1.5">
            <p className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
              Food totals
            </p>
            {(["A", "B"] as const).map((id) => (
              <p key={id} className="font-sans text-sm">
                {id}. {mainName(id)}:{" "}
                <strong>{data.food[id].adults}</strong> adults
                {data.food[id].kids > 0 && (
                  <> + <strong>{data.food[id].kids}</strong> kids</>
                )}
              </p>
            ))}
          </div>
        </div>

        {/* Per-group table */}
        <div className="space-y-2">
          <h3 className="font-display text-lg">By invitation</h3>
          {data.groups.map((grp) => (
            <div
              key={grp.id}
              className={cn(
                "rounded-card border px-4 py-3",
                grp.responded ? "border-border bg-surface" : "border-dashed border-input bg-muted/30"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-sans text-sm font-semibold truncate">
                  {grp.label}
                </p>
                <span
                  className={cn(
                    "font-sans text-xs shrink-0",
                    grp.responded ? "text-arrived" : "text-muted-foreground"
                  )}
                >
                  {grp.responded ? "Responded" : "Pending"}
                </span>
              </div>
              <div className="mt-1.5 space-y-0.5">
                {grp.members.map((m) => (
                  <div
                    key={m.name}
                    className="flex items-center gap-2 font-sans text-xs text-muted-foreground"
                  >
                    {m.attending === true ? (
                      <Check className="size-3 text-arrived shrink-0" />
                    ) : m.attending === false ? (
                      <X className="size-3 shrink-0" />
                    ) : (
                      <span className="size-3 shrink-0" />
                    )}
                    <span className="text-foreground">{m.name}</span>
                    {m.is_kid && <span>(kid)</span>}
                    {m.food_choice && <span>· {m.food_choice}</span>}
                    {m.after_party && <PartyPopper className="size-3" />}
                    {m.dietary_comment && (
                      <span className="italic truncate">
                        “{m.dietary_comment}”
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-card border border-border bg-surface px-4 py-3">
      <p className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="font-display text-2xl leading-tight">{value}</p>
      {sub && <p className="font-sans text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
