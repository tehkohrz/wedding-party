"use client";

/**
 * Group check-in screen body.
 *
 * Shows the current guest (locked — they're definitely arriving) plus
 * their groupmates. Each member is assigned a bouquet color; selecting a
 * companion fills their circle and tints their row in that color.
 * Confirm marks the guest + every selected companion as arrived in one
 * batch write, then advances to /lunch.
 *
 * Layout: fixed header + footer, scrollable member list in between — so a
 * large group never breaks the locked viewport.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { db, markArrivedMany } from "@/lib/attendance";
import {
  getGroupMembers,
  getMemberColorAssignments,
  type BouquetColor,
} from "@/lib/groups";
import { useWizardStore } from "@/lib/store";
import { GROUP_COPY } from "@/lib/content";
import type { Guest } from "@/lib/schema";

export function GroupCheckin({ guest }: { guest: Guest }) {
  const router = useRouter();
  const setDirection = useWizardStore((s) => s.setDirection);
  const setCheckedInThisRound = useWizardStore(
    (s) => s.setCheckedInThisRound
  );

  // Everyone in the group except the current guest.
  const others = useMemo(
    () => getGroupMembers(guest).filter((m) => m.id !== guest.id),
    [guest]
  );

  // Stable color per member (matches the lunch screen's name boxes + seat
  // highlights so each person has one color across the whole flow).
  const colorByGuestId = useMemo(() => {
    const map = new Map<number, BouquetColor>();
    for (const { guest: g, color } of getMemberColorAssignments(guest)) {
      map.set(g.id, color);
    }
    return map;
  }, [guest]);

  // Live attendance — undefined on first render, then the rows.
  const arrived = useLiveQuery(() => db.attendance.toArray());
  const arrivedIds = new Set((arrived ?? []).map((r) => r.guest_id));

  // Which companions are toggled on. Default: all of them.
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(others.map((m) => m.id))
  );

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleConfirm() {
    // Already-arrived guests (from a prior round) are NOT in this round —
    // they don't need re-marking, and we want them rendered grey on /lunch.
    const ids = [
      guest.id,
      ...others
        .filter((m) => selected.has(m.id) && !arrivedIds.has(m.id))
        .map((m) => m.id),
    ];
    await markArrivedMany(ids);
    setCheckedInThisRound(ids);
    setDirection("forward");
    router.push("/lunch");
  }

  const pending = others.filter((m) => !arrivedIds.has(m.id));
  const alreadyArrived = others.filter((m) => arrivedIds.has(m.id));

  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col">
      {/* Header — pt-20 clears the WizardShell Back/Home buttons */}
      <header className="shrink-0 px-6 pt-20 pb-4 text-center">
        <h1 className="font-display text-3xl">{GROUP_COPY.heading}</h1>
        <p className="font-sans text-sm text-muted-foreground mt-1">
          {GROUP_COPY.subheading}
        </p>
      </header>

      {/* Scrollable member list */}
      <main className="flex-1 overflow-y-auto px-6">
        <div className="max-w-md mx-auto space-y-2 py-2">
          {/* Current guest — locked, always counted in. */}
          <div
            className="flex items-center justify-between rounded-card border px-5 py-4"
            style={{
              backgroundColor: `hsl(var(--${colorByGuestId.get(guest.id)}) / 0.12)`,
              borderColor: `hsl(var(--${colorByGuestId.get(guest.id)}))`,
            }}
          >
            <span className="font-display text-xl">{guest.name}</span>
            <div className="flex items-center gap-3">
              <span className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                {GROUP_COPY.youLabel}
              </span>
              <ColorCircle color={colorByGuestId.get(guest.id)!} filled />
            </div>
          </div>

          {/* Pending companions — the whole row is the switch.
              role="switch" + click/keydown make the row the single
              interactive control. */}
          {pending.map((m) => {
            const isOn = selected.has(m.id);
            // Each member's color is stable (driven by lib/groups), so
            // marking someone arrived elsewhere doesn't reshuffle colors.
            const color = colorByGuestId.get(m.id)!;
            return (
              <div
                key={m.id}
                role="switch"
                aria-checked={isOn}
                tabIndex={0}
                onClick={() => toggle(m.id)}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    toggle(m.id);
                  }
                }}
                className={cn(
                  "flex items-center justify-between rounded-card border px-5 py-4",
                  "cursor-pointer outline-none transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring",
                  !isOn && "bg-surface border-border"
                )}
                style={
                  isOn
                    ? {
                      backgroundColor: `hsl(var(--${color}) / 0.12)`,
                      borderColor: `hsl(var(--${color}))`,
                    }
                    : undefined
                }
              >
                <span className="font-display text-xl">{m.name}</span>
                <ColorCircle color={color} filled={isOn} />
              </div>
            );
          })}

          {/* Already-arrived companions — greyed, no toggle */}
          {alreadyArrived.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-card bg-muted/50 px-5 py-4"
            >
              <span className="font-display text-xl text-muted-foreground">
                {m.name}
              </span>
              <span className="flex items-center gap-1 font-sans text-xs text-arrived">
                <Check className="size-4" /> checked in
              </span>
            </div>
          ))}
        </div>
      </main>

      {/* Footer — confirm */}
      <footer className="shrink-0 px-6 py-5">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleConfirm}
            className="w-full h-14 rounded-pill text-lg"
          >
            {GROUP_COPY.confirmLabel}
          </Button>
        </div>
      </footer>
    </div>
  );
}

/**
 * A round selection indicator. `color` is a bouquet token name (rose,
 * marigold, ...). Filled = solid in that color; empty = just the colored
 * outline ring. Inline styles are used because Tailwind can't generate
 * class names from a runtime value.
 */
function ColorCircle({
  color,
  filled,
}: {
  color: string;
  filled: boolean;
}) {
  return (
    <span
      aria-hidden
      className="size-8 rounded-full border-2 shrink-0 grid place-items-center transition-colors"
      style={{
        borderColor: `hsl(var(--${color}))`,
        backgroundColor: filled ? `hsl(var(--${color}))` : "transparent",
      }}
    >
      {filled && <Check className="size-4 text-surface" strokeWidth={3} />}
    </span>
  );
}
