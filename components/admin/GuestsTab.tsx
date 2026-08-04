"use client";

/**
 * Guest list — a spreadsheet-style table over the whole guest database.
 * One row per guest, every editable column in its own column, so the list
 * can be read down a column and verified at a glance.
 *
 * Layout: the id + name columns are pinned left and the actions column is
 * pinned right; everything between scrolls horizontally (the table is
 * wider than any screen). The header row is sticky.
 *
 * Editing: cells stage changes locally (row turns highlighted); Save
 * writes that row via PATCH /api/admin/guests/[id], or "Save all" walks
 * every dirty row. Nothing hits the database until a save.
 *
 * Response reset logic (unchanged from the card layout):
 *   - Attending "—" clears the WHOLE response (food, comment, after-party,
 *     baby seat, responded_at) → the guest counts as "no response" again
 *   - yes/no on a never-responded guest stamps responded_at, so
 *     admin-recorded responses count in the overview totals
 *
 * CSV: Export writes EVERY guest and column (responses included, for
 * reading in Sheets); Import applies CONFIG columns only and never
 * deletes — see lib/guestCsv.ts and /api/admin/guests/import.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import { Download, Plus, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MENU } from "@/lib/content";
import { GuestsStats } from "./GuestsStats";
import {
  CSV_COLUMNS,
  csvCell,
  parseBool,
  parseInteger,
  parseText,
} from "@/lib/guestCsv";

interface AdminGuest {
  id: number;
  name: string;
  search_aliases: string;
  side: "bride" | "groom";
  rsvp_group_id: string | null;
  seating_group_id: string | null;
  is_kid: boolean;
  is_plus_one: boolean;
  after_party_invited: boolean;
  row_num: number | null;
  section: string | null;
  seat: number | null;
  attending: boolean | null;
  food_choice: "A" | "B" | "K" | null;
  dietary_comment: string | null;
  after_party: boolean | null;
  baby_seat: boolean | null;
  responded_at: string | null;
}

/** The in-progress "new guest" row at the bottom of the table. */
type GuestDraft = Pick<
  AdminGuest,
  | "name"
  | "side"
  | "rsvp_group_id"
  | "seating_group_id"
  | "is_kid"
  | "is_plus_one"
  | "after_party_invited"
  | "row_num"
  | "section"
  | "seat"
>;

const EMPTY_DRAFT: GuestDraft = {
  name: "",
  side: "bride",
  rsvp_group_id: null,
  seating_group_id: null,
  is_kid: false,
  is_plus_one: false,
  after_party_invited: false,
  row_num: null,
  section: null,
  seat: null,
};

// Spreadsheet-feel cell controls: borderless until hovered/focused.
const CELL =
  "w-full h-8 bg-transparent px-1.5 font-sans text-xs rounded border border-transparent hover:border-input focus:border-primary focus:bg-surface outline-none disabled:opacity-40";
const TH =
  "px-2 py-2 text-left font-sans text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap";

export function GuestsTab() {
  const [guests, setGuests] = useState<AdminGuest[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("");
  const [edits, setEdits] = useState<Record<number, Partial<AdminGuest>>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<GuestDraft | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  /** Attending changes carry the reset/stamp side-effects (see header). */
  function stageAttending(g: AdminGuest, value: "yes" | "no" | "none") {
    if (value === "none") {
      stage(g.id, {
        attending: null,
        food_choice: null,
        dietary_comment: null,
        after_party: null,
        baby_seat: null,
        responded_at: null,
      });
      return;
    }
    const attending = value === "yes";
    stage(g.id, {
      attending,
      ...(attending
        ? {}
        : { food_choice: null, after_party: null, baby_seat: null }),
      ...(g.responded_at ? {} : { responded_at: new Date().toISOString() }),
    });
  }

  async function saveRow(id: number): Promise<boolean> {
    const patch = edits[id];
    if (!patch) return true;
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
      return true;
    } catch {
      return false;
    } finally {
      setSavingId(null);
    }
  }

  async function saveAll() {
    const ids = Object.keys(edits).map(Number);
    if (ids.length === 0) return;
    setBusy(true);
    let failed = 0;
    for (const id of ids) {
      const ok = await saveRow(id);
      if (!ok) failed += 1;
    }
    setBusy(false);
    if (failed > 0) alert(`${failed} row(s) failed to save — try again.`);
  }

  /** Clear a guest's RSVP answers (and any unsaved edits on that row). */
  async function resetResponse(g: AdminGuest) {
    const hasServerResponse = g.responded_at !== null || g.attending !== null;
    if (!hasServerResponse) {
      setEdits((e) => {
        const next = { ...e };
        delete next[g.id];
        return next;
      });
      return;
    }
    if (!window.confirm(`Reset ${g.name}'s RSVP response?`)) return;
    setSavingId(g.id);
    try {
      const res = await fetch(`/api/admin/guests/${g.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attending: null,
          food_choice: null,
          dietary_comment: null,
          after_party: null,
          baby_seat: null,
          responded_at: null,
        }),
      });
      if (!res.ok) throw new Error();
      const { guest } = await res.json();
      setGuests((gs) => gs.map((x) => (x.id === g.id ? guest : x)));
    } catch {
      alert("Reset failed — please try again.");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteGuest(g: AdminGuest) {
    if (
      !window.confirm(
        `Delete ${g.name}? This removes their personal link and any response.`
      )
    )
      return;
    setSavingId(g.id);
    try {
      const res = await fetch(`/api/admin/guests/${g.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setGuests((gs) => gs.filter((x) => x.id !== g.id));
    } catch {
      alert("Delete failed — please try again.");
    } finally {
      setSavingId(null);
    }
  }

  async function saveDraft() {
    if (!draft || !draft.name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, name: draft.name.trim() }),
      });
      if (!res.ok) throw new Error();
      const { guest } = await res.json();
      setGuests((gs) => [...gs, guest]);
      setDraft(null);
    } catch {
      alert("Couldn't add the guest — please try again.");
    } finally {
      setBusy(false);
    }
  }

  // ─── CSV round-trip ────────────────────────────────────────────────────
  /** Every guest, every column — filters never narrow an export, so a
      round-trip through Sheets can't silently drop people. */
  function exportCsv() {
    const csv = Papa.unparse({
      fields: [...CSV_COLUMNS],
      data: guests.map((g) =>
        CSV_COLUMNS.map((c) => csvCell((g as unknown as Record<string, unknown>)[c]))
      ),
    });
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "guests.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importCsv(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const rows = result.data
          .filter((r) => (r.name ?? "").trim() !== "")
          .map((r) => ({
            id: parseInteger(r.id),
            name: (r.name ?? "").trim(),
            side: (r.side ?? "").trim() === "groom" ? "groom" : "bride",
            rsvp_group_id: parseText(r.rsvp_group_id),
            seating_group_id: parseText(r.seating_group_id),
            is_kid: parseBool(r.is_kid),
            is_plus_one: parseBool(r.is_plus_one),
            after_party_invited: parseBool(r.after_party_invited),
            search_aliases: (r.search_aliases ?? "").trim(),
            row_num: parseInteger(r.row_num),
            section: parseText(r.section),
            seat: parseInteger(r.seat),
          }));
        if (rows.length === 0) return alert("No rows with a name found.");
        if (
          !window.confirm(
            `Import ${rows.length} row(s)?\n\nThis updates names, sides, groups, flags and seats. RSVP responses are never changed, and nobody is deleted.`
          )
        )
          return;
        setBusy(true);
        try {
          const res = await fetch("/api/admin/guests/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows }),
          });
          const j = await res.json();
          if (!res.ok) throw new Error(j.error ?? "");
          load();
          alert(
            [
              `Updated: ${j.updated}`,
              `Created: ${j.created.length}${j.created.length ? ` (${j.created.join(", ")})` : ""}`,
              j.missing.length
                ? `\nIn the database but NOT in your CSV (left untouched):\n${j.missing.join(", ")}`
                : "",
              j.failed.length ? `\nFailed: ${j.failed.join(", ")}` : "",
            ]
              .filter(Boolean)
              .join("\n")
          );
        } catch (e) {
          alert(`Import failed. ${e instanceof Error ? e.message : ""}`);
        } finally {
          setBusy(false);
        }
      },
    });
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
  const visible = q
    ? guests.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          (g.rsvp_group_id ?? "").toLowerCase() === q ||
          (g.seating_group_id ?? "").toLowerCase() === q
      )
    : guests;
  const dirtyCount = Object.keys(edits).length;

  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* ── Toolbar + stats ── */}
      <div className="shrink-0 border-b border-border px-4 py-3 space-y-3">
        <GuestsStats guests={guests} />
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Filter by name or group id…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 max-w-xs"
          />
          <span className="font-sans text-xs text-muted-foreground">
            {visible.length} of {guests.length}
          </span>
          <div className="flex-1" />
          {dirtyCount > 0 && (
            <Button size="sm" disabled={busy} onClick={saveAll}>
              <Save /> Save all ({dirtyCount})
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importCsv(f);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <Upload /> Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download /> Export CSV
          </Button>
        </div>
      </div>

      {/* ── The table ── */}
      <div className="flex-1 overflow-auto">
        <table className="border-separate border-spacing-0 text-xs">
          <thead className="sticky top-0 z-30">
            <tr className="bg-background">
              <th className={cn(TH, "sticky left-0 z-40 w-10 bg-background")}>#</th>
              <th className={cn(TH, "sticky left-10 z-40 bg-background")}>
                Name
              </th>
              <th className={TH}>Side</th>
              <th className={TH}>RSVP grp</th>
              <th className={TH}>Seat grp</th>
              <th className={TH}>Kid</th>
              <th className={TH}>+1</th>
              <th className={TH}>AP inv</th>
              <th className={TH}>Attending</th>
              <th className={TH}>Main</th>
              <th className={TH}>A-party</th>
              <th className={TH}>Baby</th>
              <th className={TH}>Dietary</th>
              <th className={TH}>Aliases</th>
              <th className={TH}>Row</th>
              <th className={TH}>Sec</th>
              <th className={TH}>Seat</th>
              <th className={TH}>Responded</th>
              <th className={cn(TH, "sticky right-0 z-40 bg-background")} />
            </tr>
            <tr>
              <th colSpan={19} className="p-0">
                <div className="h-px w-full bg-border" />
              </th>
            </tr>
          </thead>

          <tbody>
            {visible.map((g) => {
              const e = edits[g.id] ?? {};
              const merged = { ...g, ...e };
              const dirty = Object.keys(e).length > 0;
              const rowBg = dirty ? "bg-primary/10" : "bg-background";
              const td = "px-1 py-0.5 border-b border-border/60";
              return (
                <tr key={g.id} className={cn(rowBg, "hover:bg-muted/40")}>
                  <td
                    className={cn(
                      td,
                      "sticky left-0 z-20 w-10 px-2 text-muted-foreground",
                      rowBg
                    )}
                  >
                    {g.id}
                  </td>
                  <td className={cn(td, "sticky left-10 z-20 min-w-40", rowBg)}>
                    <input
                      className={CELL}
                      value={merged.name}
                      onChange={(ev) => stage(g.id, { name: ev.target.value })}
                      aria-label={`Name of guest ${g.id}`}
                    />
                  </td>
                  <td className={td}>
                    <select
                      className={cn(CELL, "w-20")}
                      value={merged.side}
                      onChange={(ev) =>
                        stage(g.id, {
                          side: ev.target.value as "bride" | "groom",
                        })
                      }
                    >
                      <option value="bride">bride</option>
                      <option value="groom">groom</option>
                    </select>
                  </td>
                  <td className={td}>
                    <input
                      className={cn(CELL, "w-20")}
                      value={merged.rsvp_group_id ?? ""}
                      onChange={(ev) =>
                        stage(g.id, { rsvp_group_id: ev.target.value || null })
                      }
                    />
                  </td>
                  <td className={td}>
                    <input
                      className={cn(CELL, "w-20")}
                      value={merged.seating_group_id ?? ""}
                      onChange={(ev) =>
                        stage(g.id, {
                          seating_group_id: ev.target.value || null,
                        })
                      }
                    />
                  </td>
                  <td className={cn(td, "text-center")}>
                    <input
                      type="checkbox"
                      checked={merged.is_kid}
                      onChange={(ev) =>
                        stage(g.id, { is_kid: ev.target.checked })
                      }
                    />
                  </td>
                  <td className={cn(td, "text-center")}>
                    <input
                      type="checkbox"
                      checked={merged.is_plus_one}
                      onChange={(ev) =>
                        stage(g.id, { is_plus_one: ev.target.checked })
                      }
                    />
                  </td>
                  <td className={cn(td, "text-center")}>
                    <input
                      type="checkbox"
                      checked={merged.after_party_invited}
                      onChange={(ev) =>
                        stage(g.id, { after_party_invited: ev.target.checked })
                      }
                    />
                  </td>
                  <td className={td}>
                    <select
                      className={cn(CELL, "w-24")}
                      value={
                        merged.attending === true
                          ? "yes"
                          : merged.attending === false
                            ? "no"
                            : "none"
                      }
                      onChange={(ev) =>
                        stageAttending(
                          g,
                          ev.target.value as "yes" | "no" | "none"
                        )
                      }
                    >
                      <option value="none">—</option>
                      <option value="yes">yes</option>
                      <option value="no">no</option>
                    </select>
                  </td>
                  <td className={td}>
                    <select
                      className={cn(CELL, "w-28")}
                      value={merged.food_choice ?? ""}
                      disabled={merged.attending !== true}
                      onChange={(ev) =>
                        stage(g.id, {
                          food_choice: (ev.target.value || null) as
                            | "A"
                            | "B"
                            | "K"
                            | null,
                        })
                      }
                    >
                      <option value="">—</option>
                      {MENU.mains.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.id}. {m.name}
                        </option>
                      ))}
                      <option value="K">{MENU.kidsMeal.name}</option>
                    </select>
                  </td>
                  <td className={td}>
                    <select
                      className={cn(CELL, "w-16")}
                      value={
                        merged.after_party === true
                          ? "yes"
                          : merged.after_party === false
                            ? "no"
                            : ""
                      }
                      disabled={
                        merged.attending !== true || !merged.after_party_invited
                      }
                      onChange={(ev) =>
                        stage(g.id, {
                          after_party:
                            ev.target.value === ""
                              ? null
                              : ev.target.value === "yes",
                        })
                      }
                    >
                      <option value="">—</option>
                      <option value="yes">yes</option>
                      <option value="no">no</option>
                    </select>
                  </td>
                  <td className={td}>
                    <select
                      className={cn(CELL, "w-16")}
                      value={
                        merged.baby_seat === true
                          ? "yes"
                          : merged.baby_seat === false
                            ? "no"
                            : ""
                      }
                      disabled={merged.attending !== true || !merged.is_kid}
                      onChange={(ev) =>
                        stage(g.id, {
                          baby_seat:
                            ev.target.value === ""
                              ? null
                              : ev.target.value === "yes",
                        })
                      }
                    >
                      <option value="">—</option>
                      <option value="yes">yes</option>
                      <option value="no">no</option>
                    </select>
                  </td>
                  <td className={td}>
                    <input
                      className={cn(CELL, "w-40")}
                      value={merged.dietary_comment ?? ""}
                      disabled={merged.attending !== true}
                      onChange={(ev) =>
                        stage(g.id, {
                          dietary_comment: ev.target.value || null,
                        })
                      }
                      placeholder="—"
                    />
                  </td>
                  <td className={td}>
                    <input
                      className={cn(CELL, "w-32")}
                      value={merged.search_aliases}
                      onChange={(ev) =>
                        stage(g.id, { search_aliases: ev.target.value })
                      }
                      placeholder="a;b"
                      title="Extra names the day-of search matches (semicolon-separated)"
                    />
                  </td>
                  <td className={td}>
                    <input
                      className={cn(CELL, "w-12 text-center")}
                      value={merged.row_num ?? ""}
                      onChange={(ev) =>
                        stage(g.id, {
                          row_num: ev.target.value
                            ? Number(ev.target.value)
                            : null,
                        })
                      }
                    />
                  </td>
                  <td className={td}>
                    <input
                      className={cn(CELL, "w-12 text-center")}
                      value={merged.section ?? ""}
                      onChange={(ev) =>
                        stage(g.id, { section: ev.target.value || null })
                      }
                    />
                  </td>
                  <td className={td}>
                    <input
                      className={cn(CELL, "w-12 text-center")}
                      value={merged.seat ?? ""}
                      onChange={(ev) =>
                        stage(g.id, {
                          seat: ev.target.value ? Number(ev.target.value) : null,
                        })
                      }
                    />
                  </td>
                  <td className={cn(td, "px-2 whitespace-nowrap text-muted-foreground")}>
                    {merged.responded_at
                      ? new Date(merged.responded_at).toLocaleDateString("en-SG")
                      : "—"}
                  </td>
                  <td className={cn(td, "sticky right-0 z-20 px-1", rowBg)}>
                    <div className="flex items-center gap-0.5">
                      <Button
                        size="sm"
                        className="h-7 w-7 p-0"
                        disabled={!dirty || savingId === g.id}
                        onClick={() => saveRow(g.id)}
                        aria-label={`Save ${g.name}`}
                      >
                        <Save className="size-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        disabled={savingId === g.id}
                        onClick={() => resetResponse(g)}
                        aria-label={`Reset ${g.name}'s response`}
                        title="Clear this guest's RSVP response"
                      >
                        <RotateCcw className="size-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        disabled={savingId === g.id}
                        onClick={() => deleteGuest(g)}
                        aria-label={`Delete ${g.name}`}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* ── New-guest draft row ── */}
            {draft && (
              <tr className="bg-primary/10">
                <td className="px-2 py-0.5 sticky left-0 z-20 bg-primary/10 text-muted-foreground">
                  new
                </td>
                <td className="px-1 py-0.5 sticky left-10 z-20 bg-primary/10">
                  <input
                    autoFocus
                    className={CELL}
                    value={draft.name}
                    onChange={(ev) =>
                      setDraft({ ...draft, name: ev.target.value })
                    }
                    placeholder="Guest name…"
                    aria-label="New guest name"
                  />
                </td>
                <td className="px-1 py-0.5">
                  <select
                    className={CELL}
                    value={draft.side}
                    onChange={(ev) =>
                      setDraft({
                        ...draft,
                        side: ev.target.value as "bride" | "groom",
                      })
                    }
                  >
                    <option value="bride">bride</option>
                    <option value="groom">groom</option>
                  </select>
                </td>
                <td className="px-1 py-0.5">
                  <input
                    className={cn(CELL, "w-20")}
                    value={draft.rsvp_group_id ?? ""}
                    onChange={(ev) =>
                      setDraft({
                        ...draft,
                        rsvp_group_id: ev.target.value || null,
                      })
                    }
                    placeholder="solo"
                  />
                </td>
                <td className="px-1 py-0.5">
                  <input
                    className={cn(CELL, "w-20")}
                    value={draft.seating_group_id ?? ""}
                    onChange={(ev) =>
                      setDraft({
                        ...draft,
                        seating_group_id: ev.target.value || null,
                      })
                    }
                  />
                </td>
                <td className="px-1 py-0.5 text-center">
                  <input
                    type="checkbox"
                    checked={draft.is_kid}
                    onChange={(ev) =>
                      setDraft({ ...draft, is_kid: ev.target.checked })
                    }
                  />
                </td>
                <td className="px-1 py-0.5 text-center">
                  <input
                    type="checkbox"
                    checked={draft.is_plus_one}
                    onChange={(ev) =>
                      setDraft({ ...draft, is_plus_one: ev.target.checked })
                    }
                  />
                </td>
                <td className="px-1 py-0.5 text-center">
                  <input
                    type="checkbox"
                    checked={draft.after_party_invited}
                    onChange={(ev) =>
                      setDraft({
                        ...draft,
                        after_party_invited: ev.target.checked,
                      })
                    }
                  />
                </td>
                <td colSpan={9} className="px-2 py-0.5 text-muted-foreground">
                  Responses and seats can be filled in after saving.
                </td>
                <td className="px-1 py-0.5 sticky right-0 z-20 bg-primary/10">
                  <div className="flex items-center gap-0.5">
                    <Button
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={!draft.name.trim() || busy}
                      onClick={saveDraft}
                      aria-label="Save new guest"
                    >
                      <Save className="size-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0"
                      disabled={busy}
                      onClick={() => setDraft(null)}
                      aria-label="Cancel new guest"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="p-4">
          {!draft && (
            <Button
              variant="outline"
              onClick={() => setDraft(EMPTY_DRAFT)}
              className="h-10 rounded-card border-dashed"
            >
              <Plus /> Add guest
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
