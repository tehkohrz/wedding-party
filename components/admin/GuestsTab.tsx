"use client";

/**
 * Guest list editor — the database is the source of truth, this is its
 * front door: rename guests, fix groups, flag kids, assign seats after the
 * RSVP deadline, or override an RSVP answer. Each row edits locally and
 * saves via PATCH /api/admin/guests/[id].
 *
 * Also exports the personal-links CSV (name → absolute URL) for WhatsApp
 * distribution.
 */
import { useCallback, useEffect, useState } from "react";
import { Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AdminGuest {
  id: number;
  name: string;
  search_aliases: string;
  side: "bride" | "groom";
  rsvp_group_id: string | null;
  seating_group_id: string | null;
  is_kid: boolean;
  row_num: number | null;
  section: string | null;
  seat: number | null;
  attending: boolean | null;
  food_choice: "A" | "B" | null;
  responded_at: string | null;
}

export function GuestsTab() {
  const [guests, setGuests] = useState<AdminGuest[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("");
  const [edits, setEdits] = useState<Record<number, Partial<AdminGuest>>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(() => {
    setError(false);
    fetch("/api/admin/guests")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => {
        setGuests(j.guests);
        setLoaded(true);
        setEdits({});
      })
      .catch(() => setError(true));
  }, []);
  useEffect(load, [load]);

  function stage(id: number, patch: Partial<AdminGuest>) {
    setEdits((e) => ({ ...e, [id]: { ...e[id], ...patch } }));
  }

  async function save(id: number) {
    const patch = edits[id];
    if (!patch) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/guests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      const { guest } = await res.json();
      setGuests((gs) => gs.map((g) => (g.id === id ? guest : g)));
      setEdits((e) => {
        const next = { ...e };
        delete next[id];
        return next;
      });
    } catch {
      alert("Save failed — check the group ids exist, then try again.");
    } finally {
      setSavingId(null);
    }
  }

  async function exportLinks() {
    const res = await fetch("/api/admin/links");
    if (!res.ok) return alert("Couldn't fetch links.");
    const { links } = await res.json();
    const origin = window.location.origin;
    const csv = [
      "name,link",
      ...links.map(
        (l: { name: string; slug: string }) =>
          `"${l.name.replace(/"/g, '""')}",${origin}/r/${l.slug}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
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

  const visible = guests.filter((g) =>
    g.name.toLowerCase().includes(filter.trim().toLowerCase())
  );

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="shrink-0 px-6 py-3 border-b border-border flex flex-wrap items-center gap-3">
        <Input
          placeholder="Filter by name…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-10 max-w-xs"
        />
        <span className="font-sans text-xs text-muted-foreground">
          {visible.length} of {guests.length}
        </span>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={exportLinks}>
          <Download /> Links CSV
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-3">
        <div className="max-w-5xl mx-auto space-y-1.5">
          {visible.map((g) => {
            const e = edits[g.id] ?? {};
            const merged = { ...g, ...e };
            const dirty = Object.keys(e).length > 0;
            return (
              <div
                key={g.id}
                className={cn(
                  "rounded-card border px-3 py-2 grid gap-2 items-center",
                  "grid-cols-2 sm:grid-cols-[2.5rem_1fr_5.5rem_6rem_6rem_4rem_9rem_5.5rem]",
                  dirty ? "border-primary" : "border-border bg-surface"
                )}
              >
                <span className="font-sans text-xs text-muted-foreground">
                  #{g.id}
                </span>
                <Input
                  value={merged.name}
                  onChange={(ev) => stage(g.id, { name: ev.target.value })}
                  className="h-9 text-sm"
                  aria-label="Name"
                />
                <select
                  value={merged.side}
                  onChange={(ev) =>
                    stage(g.id, { side: ev.target.value as "bride" | "groom" })
                  }
                  className="h-9 rounded-lg border border-input bg-surface px-2 font-sans text-sm"
                  aria-label="Side"
                >
                  <option value="bride">bride</option>
                  <option value="groom">groom</option>
                </select>
                <Input
                  value={merged.rsvp_group_id ?? ""}
                  onChange={(ev) =>
                    stage(g.id, { rsvp_group_id: ev.target.value || null })
                  }
                  className="h-9 text-sm"
                  aria-label="RSVP group"
                  placeholder="rsvp grp"
                />
                <Input
                  value={merged.seating_group_id ?? ""}
                  onChange={(ev) =>
                    stage(g.id, { seating_group_id: ev.target.value || null })
                  }
                  className="h-9 text-sm"
                  aria-label="Seating group"
                  placeholder="seat grp"
                />
                <label className="flex items-center gap-1.5 font-sans text-xs">
                  <input
                    type="checkbox"
                    checked={merged.is_kid}
                    onChange={(ev) => stage(g.id, { is_kid: ev.target.checked })}
                  />
                  kid
                </label>
                <div className="flex items-center gap-1">
                  <Input
                    value={merged.row_num ?? ""}
                    onChange={(ev) =>
                      stage(g.id, {
                        row_num: ev.target.value
                          ? Number(ev.target.value)
                          : null,
                      })
                    }
                    className="h-9 w-12 text-sm text-center"
                    aria-label="Row"
                    placeholder="R"
                  />
                  <Input
                    value={merged.section ?? ""}
                    onChange={(ev) =>
                      stage(g.id, { section: ev.target.value || null })
                    }
                    className="h-9 w-12 text-sm text-center"
                    aria-label="Section"
                    placeholder="Sec"
                  />
                  <Input
                    value={merged.seat ?? ""}
                    onChange={(ev) =>
                      stage(g.id, {
                        seat: ev.target.value ? Number(ev.target.value) : null,
                      })
                    }
                    className="h-9 w-12 text-sm text-center"
                    aria-label="Seat"
                    placeholder="S"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <span
                    className={cn(
                      "font-sans text-[10px]",
                      g.attending === true
                        ? "text-arrived"
                        : g.attending === false
                          ? "text-muted-foreground"
                          : "text-standby"
                    )}
                  >
                    {g.attending === true
                      ? `yes${g.food_choice ? ` · ${g.food_choice}` : ""}`
                      : g.attending === false
                        ? "no"
                        : "—"}
                  </span>
                  <Button
                    size="sm"
                    disabled={!dirty || savingId === g.id}
                    onClick={() => save(g.id)}
                  >
                    <Save />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
