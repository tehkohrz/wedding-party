"use client";

/**
 * Guest list editor — the database's front door. Every field the couple
 * might need to fix lives here:
 *
 *   Line 1 (identity):  name · side · rsvp group · seating group · kid ·
 *                       seat assignment (row/section/seat)
 *   Line 2 (response):  attending · main course · after-party · dietary
 *                       comment — for phone-in RSVPs and corrections.
 *
 * Response reset logic:
 *   - setting Attending to "—" clears the WHOLE response (food, comment,
 *     after-party, responded_at) → the guest counts as "no response" again
 *   - setting yes/no on a never-responded guest stamps responded_at, so
 *     admin-recorded responses count in the overview totals
 *
 * Saves via PATCH /api/admin/guests/[id] (new group ids auto-create and
 * personal links retarget — see the route handler).
 *
 * Also exports the personal-links CSV (name → absolute URL) for WhatsApp.
 */
import { useCallback, useEffect, useState } from "react";
import { Download, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MENU } from "@/lib/content";

interface AdminGuest {
  id: number;
  name: string;
  search_aliases: string;
  side: "bride" | "groom";
  rsvp_group_id: string | null;
  seating_group_id: string | null;
  is_kid: boolean;
  is_plus_one: boolean;
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

/** The in-progress "new guest" row before it's saved to the database. */
interface GuestDraft {
  name: string;
  side: "bride" | "groom";
  rsvp_group_id: string;
  seating_group_id: string;
  is_kid: boolean;
  is_plus_one: boolean;
  search_aliases: string;
  row_num: number | null;
  section: string | null;
  seat: number | null;
}

const EMPTY_DRAFT: GuestDraft = {
  name: "",
  side: "bride",
  rsvp_group_id: "",
  seating_group_id: "",
  is_kid: false,
  is_plus_one: false,
  search_aliases: "",
  row_num: null,
  section: null,
  seat: null,
};

/** Grid template shared by the header and row line 1. */
const ROW_GRID =
  "sm:grid-cols-[2.5rem_1fr_5.5rem_6rem_6rem_5.5rem_9rem_4.5rem]";

export function GuestsTab() {
  const [guests, setGuests] = useState<AdminGuest[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("");
  const [edits, setEdits] = useState<Record<number, Partial<AdminGuest>>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  // Draft "new guest" row at the bottom of the list (null = button shown).
  const [draft, setDraft] = useState<GuestDraft | null>(null);
  const [adding, setAdding] = useState(false);

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
      // Declining clears attendee-only fields.
      ...(attending
        ? {}
        : { food_choice: null, after_party: null, baby_seat: null }),
      // Recording a response on a never-responded guest stamps the time.
      ...(g.responded_at ? {} : { responded_at: new Date().toISOString() }),
    });
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
      alert("Save failed — please try again.");
    } finally {
      setSavingId(null);
    }
  }

  /** One click wipes a guest's RSVP answers (back to "no response") —
      for clearing test submissions without touching identity/seating.
      Staged (unsaved) edits are discarded too. */
  async function resetResponse(g: AdminGuest) {
    // Nothing saved on the server → just drop the staged edits.
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
      setEdits((e) => {
        const next = { ...e };
        delete next[g.id];
        return next;
      });
    } catch {
      alert("Reset failed — please try again.");
    } finally {
      setSavingId(null);
    }
  }

  /** POST the draft row. The database assigns the id; the API auto-creates
      any groups, gives solo guests a SOLO group, and generates the
      personal link (unless the new guest is a plus-one). */
  async function saveDraft() {
    if (!draft || !draft.name.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          side: draft.side,
          rsvp_group_id: draft.rsvp_group_id.trim() || null,
          seating_group_id: draft.seating_group_id.trim() || null,
          is_kid: draft.is_kid,
          is_plus_one: draft.is_plus_one,
          search_aliases: draft.search_aliases,
          row_num: draft.row_num,
          section: draft.section,
          seat: draft.seat,
        }),
      });
      if (!res.ok) throw new Error();
      const { guest } = await res.json();
      setGuests((gs) => [...gs, guest]);
      setDraft(null);
    } catch {
      alert("Couldn't add the guest — please try again.");
    } finally {
      setAdding(false);
    }
  }

  /** Remove a guest entirely — their personal link, attendance and (if
      they were the last member) their RSVP group go with them. */
  async function deleteGuest(g: AdminGuest) {
    if (
      !window.confirm(
        `Delete ${g.name}? This removes their personal link and any response.`
      )
    )
      return;
    setSavingId(g.id);
    try {
      const res = await fetch(`/api/admin/guests/${g.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setGuests((gs) => gs.filter((x) => x.id !== g.id));
    } catch {
      alert("Delete failed — please try again.");
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

  // A name match pulls in the guest's WHOLE rsvp group — searching "wes"
  // shows everyone answering on the same invitation.
  const q = filter.trim().toLowerCase();
  const matchedGroups = new Set(
    guests
      .filter((g) => g.name.toLowerCase().includes(q))
      .map((g) => g.rsvp_group_id)
      .filter(Boolean)
  );
  const visible = q
    ? guests.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          (g.rsvp_group_id && matchedGroups.has(g.rsvp_group_id))
      )
    : guests;

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

      <div className="flex-1 overflow-y-auto px-6 pb-3">
        <div className="max-w-5xl mx-auto space-y-1.5 pt-3 sm:pt-0">
          {/* Column headers for row line 1 — hidden on small screens where
              the grid collapses and stops aligning. */}
          <div
            className={cn(
              "hidden sm:grid items-end gap-2 px-3 pt-3 pb-1",
              ROW_GRID,
              "font-sans text-[10px] uppercase tracking-wider text-muted-foreground",
              "sticky top-0 bg-background z-10"
            )}
          >
            <span>#</span>
            <span>Name</span>
            <span>Side</span>
            <span>RSVP grp</span>
            <span>Seat grp</span>
            <span>Kid · +1</span>
            <span>Row · Sec · Seat</span>
            <span className="text-right">Save</span>
          </div>

          {visible.map((g) => {
            const e = edits[g.id] ?? {};
            const merged = { ...g, ...e };
            const dirty = Object.keys(e).length > 0;
            return (
              <div
                key={g.id}
                className={cn(
                  "rounded-card border px-3 py-2 space-y-2",
                  dirty ? "border-primary" : "border-border bg-surface"
                )}
              >
                {/* ── Line 1: identity + seating ── */}
                <div
                  className={cn("grid gap-2 items-center grid-cols-2", ROW_GRID)}
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
                      stage(g.id, {
                        side: ev.target.value as "bride" | "groom",
                      })
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
                      stage(g.id, {
                        seating_group_id: ev.target.value || null,
                      })
                    }
                    className="h-9 text-sm"
                    aria-label="Seating group"
                    placeholder="seat grp"
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 font-sans text-xs">
                      <input
                        type="checkbox"
                        checked={merged.is_kid}
                        onChange={(ev) =>
                          stage(g.id, { is_kid: ev.target.checked })
                        }
                      />
                      kid
                    </label>
                    {/* Plus-one: no personal link; named by the main guest
                        inside their RSVP. */}
                    <label className="flex items-center gap-1 font-sans text-xs">
                      <input
                        type="checkbox"
                        checked={merged.is_plus_one}
                        onChange={(ev) =>
                          stage(g.id, { is_plus_one: ev.target.checked })
                        }
                      />
                      +1
                    </label>
                  </div>
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
                          seat: ev.target.value
                            ? Number(ev.target.value)
                            : null,
                        })
                      }
                      className="h-9 w-12 text-sm text-center"
                      aria-label="Seat"
                      placeholder="S"
                    />
                  </div>
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      disabled={!dirty || savingId === g.id}
                      onClick={() => save(g.id)}
                      aria-label={`Save ${g.name}`}
                    >
                      <Save />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={savingId === g.id}
                      onClick={() => deleteGuest(g)}
                      aria-label={`Delete ${g.name}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>

                {/* ── Line 2: the RSVP response ── */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-muted/40 px-3 py-2">
                  <label className="flex items-center gap-1.5 font-sans text-xs text-muted-foreground">
                    Attending
                    <select
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
                      className="h-8 rounded-lg border border-input bg-surface px-2 font-sans text-xs text-foreground"
                    >
                      <option value="none">— no response</option>
                      <option value="yes">yes</option>
                      <option value="no">no</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-1.5 font-sans text-xs text-muted-foreground">
                    Main
                    <select
                      value={merged.food_choice ?? ""}
                      onChange={(ev) =>
                        stage(g.id, {
                          food_choice: (ev.target.value || null) as
                            | "A"
                            | "B"
                            | "K"
                            | null,
                        })
                      }
                      disabled={merged.attending !== true}
                      className="h-8 rounded-lg border border-input bg-surface px-2 font-sans text-xs text-foreground disabled:opacity-40"
                    >
                      <option value="">—</option>
                      {MENU.mains.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.id}. {m.name}
                        </option>
                      ))}
                      <option value="K">{MENU.kidsMeal.name}</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-1.5 font-sans text-xs text-muted-foreground">
                    After-party
                    <select
                      value={
                        merged.after_party === true
                          ? "yes"
                          : merged.after_party === false
                            ? "no"
                            : ""
                      }
                      onChange={(ev) =>
                        stage(g.id, {
                          after_party:
                            ev.target.value === ""
                              ? null
                              : ev.target.value === "yes",
                        })
                      }
                      disabled={merged.attending !== true}
                      className="h-8 rounded-lg border border-input bg-surface px-2 font-sans text-xs text-foreground disabled:opacity-40"
                    >
                      <option value="">—</option>
                      <option value="yes">yes</option>
                      <option value="no">no</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-1.5 font-sans text-xs text-muted-foreground">
                    Aliases
                    <Input
                      value={merged.search_aliases}
                      onChange={(ev) =>
                        stage(g.id, { search_aliases: ev.target.value })
                      }
                      placeholder="nicknames; a;b"
                      title="Extra names the day-of search matches (semicolon-separated)"
                      className="h-8 text-xs w-36"
                      aria-label="Search aliases"
                    />
                  </label>

                  {merged.is_kid && (
                    <label className="flex items-center gap-1.5 font-sans text-xs text-muted-foreground">
                      Baby seat
                      <select
                        value={
                          merged.baby_seat === true
                            ? "yes"
                            : merged.baby_seat === false
                              ? "no"
                              : ""
                        }
                        onChange={(ev) =>
                          stage(g.id, {
                            baby_seat:
                              ev.target.value === ""
                                ? null
                                : ev.target.value === "yes",
                          })
                        }
                        disabled={merged.attending !== true}
                        className="h-8 rounded-lg border border-input bg-surface px-2 font-sans text-xs text-foreground disabled:opacity-40"
                      >
                        <option value="">—</option>
                        <option value="yes">yes</option>
                        <option value="no">no</option>
                      </select>
                    </label>
                  )}

                  <Input
                    value={merged.dietary_comment ?? ""}
                    onChange={(ev) =>
                      stage(g.id, {
                        dietary_comment: ev.target.value || null,
                      })
                    }
                    disabled={merged.attending !== true}
                    placeholder="dietary comment…"
                    className="h-8 text-xs flex-1 min-w-40 disabled:opacity-40"
                    aria-label="Dietary comment"
                  />

                  <span className="font-sans text-[10px] text-muted-foreground ml-auto">
                    {merged.responded_at
                      ? `responded ${new Date(merged.responded_at).toLocaleDateString("en-SG")}`
                      : "no response yet"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 font-sans text-xs"
                    title="Clear this guest's RSVP response (and any unsaved edits)"
                    disabled={
                      savingId === g.id ||
                      (!dirty &&
                        g.responded_at === null &&
                        g.attending === null)
                    }
                    onClick={() => resetResponse(g)}
                  >
                    <RotateCcw className="size-3" /> Reset
                  </Button>
                </div>
              </div>
            );
          })}

          {/* ── Add guest: button → editable draft row → Save inserts ── */}
          {draft ? (
            <div className="rounded-card border border-primary px-3 py-2 space-y-2">
              <div
                className={cn("grid gap-2 items-center grid-cols-2", ROW_GRID)}
              >
                <span className="font-sans text-xs text-muted-foreground">
                  new
                </span>
                <Input
                  autoFocus
                  value={draft.name}
                  onChange={(ev) =>
                    setDraft({ ...draft, name: ev.target.value })
                  }
                  placeholder="Guest name…"
                  className="h-9 text-sm"
                  aria-label="New guest name"
                />
                <select
                  value={draft.side}
                  onChange={(ev) =>
                    setDraft({
                      ...draft,
                      side: ev.target.value as "bride" | "groom",
                    })
                  }
                  className="h-9 rounded-lg border border-input bg-surface px-2 font-sans text-sm"
                  aria-label="Side"
                >
                  <option value="bride">bride</option>
                  <option value="groom">groom</option>
                </select>
                <Input
                  value={draft.rsvp_group_id}
                  onChange={(ev) =>
                    setDraft({ ...draft, rsvp_group_id: ev.target.value })
                  }
                  className="h-9 text-sm"
                  aria-label="RSVP group"
                  placeholder="rsvp grp"
                />
                <Input
                  value={draft.seating_group_id}
                  onChange={(ev) =>
                    setDraft({ ...draft, seating_group_id: ev.target.value })
                  }
                  className="h-9 text-sm"
                  aria-label="Seating group"
                  placeholder="seat grp"
                />
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 font-sans text-xs">
                    <input
                      type="checkbox"
                      checked={draft.is_kid}
                      onChange={(ev) =>
                        setDraft({ ...draft, is_kid: ev.target.checked })
                      }
                    />
                    kid
                  </label>
                  <label className="flex items-center gap-1 font-sans text-xs">
                    <input
                      type="checkbox"
                      checked={draft.is_plus_one}
                      onChange={(ev) =>
                        setDraft({ ...draft, is_plus_one: ev.target.checked })
                      }
                    />
                    +1
                  </label>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    value={draft.row_num ?? ""}
                    onChange={(ev) =>
                      setDraft({
                        ...draft,
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
                    value={draft.section ?? ""}
                    onChange={(ev) =>
                      setDraft({ ...draft, section: ev.target.value || null })
                    }
                    className="h-9 w-12 text-sm text-center"
                    aria-label="Section"
                    placeholder="Sec"
                  />
                  <Input
                    value={draft.seat ?? ""}
                    onChange={(ev) =>
                      setDraft({
                        ...draft,
                        seat: ev.target.value ? Number(ev.target.value) : null,
                      })
                    }
                    className="h-9 w-12 text-sm text-center"
                    aria-label="Seat"
                    placeholder="S"
                  />
                </div>
                <div className="flex justify-end gap-1">
                  <Button
                    size="sm"
                    disabled={!draft.name.trim() || adding}
                    onClick={saveDraft}
                    aria-label="Save new guest"
                  >
                    <Save />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={adding}
                    onClick={() => setDraft(null)}
                    aria-label="Cancel new guest"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <p className="font-sans text-[10px] text-muted-foreground px-1">
                Save inserts the guest — the id and personal link are
                generated automatically (plus-ones get no link).
              </p>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setDraft(EMPTY_DRAFT)}
              className="w-full h-11 rounded-card border-dashed"
            >
              <Plus /> Add guest
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
