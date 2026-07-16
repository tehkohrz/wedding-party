"use client";

/**
 * SeatingMap — renders the venue from layout.csv (Path A) and adds:
 *   1. Pulse animation on a designated seat (the viewer's own seat on /lunch).
 *   2. Popover on each seat — tap to see whose seat it is + arrival ✓.
 *   3. Pinch-zoom + pan via react-zoom-pan-pinch, so the map handles real
 *      data scale (wider rows than test data) and iPad guests can zoom in.
 *
 * Path B (Figma SVG background) is deferred — see PROGRESS.md.
 */
import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { groups, layout } from "@/lib/data";
import { useDbGuests } from "@/hooks/useDbGuests";
import { useAttendance } from "@/hooks/useAttendance";
import type { Guest, Group, LayoutSection } from "@/lib/schema";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SeatHighlight {
  row: number;
  section: string | null;
  seat: number;
  color: string;
  state: "arrived" | "pending";
}

export interface SeatRef {
  row: number;
  section: string | null;
  seat: number;
}

// ─── Lookups ─────────────────────────────────────────────────────────────────

function seatKey(row: number, section: string | null, seat: number): string {
  return `${row}|${section ?? ""}|${seat}`;
}

// Seating-group labels stay build-time (layout.csv pipeline).
const GROUP_BY_ID = new Map<string, Group>();
for (const grp of groups) {
  GROUP_BY_ID.set(grp.id, grp);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SeatingMap({
  highlights = [],
  pulseAt,
  showSeatInfo = true,
  zoomable = false,
}: {
  highlights?: SeatHighlight[];
  /** Seats to pulse once on mount — used on /lunch to celebrate every
   *  member checked in *this* round. Empty/undefined = no pulse. */
  pulseAt?: SeatRef[];
  /** Tap a seat → popover with guest info. Default on. */
  showSeatInfo?: boolean;
  /**
   * Wrap the map in a pinch-zoom + pan container. Default OFF — turn on
   * only when the map needs to be wider than the iPad viewport. Currently
   * disabled site-wide; the TransformWrapper code is preserved here so we
   * can flip this on if the real guest list pushes the map past the screen.
   */
  zoomable?: boolean;
}) {
  // Highlight lookup: O(1) per seat
  const highlightMap = new Map<string, SeatHighlight>();
  for (const h of highlights) {
    highlightMap.set(seatKey(h.row, h.section, h.seat), h);
  }

  // Guests from the database (Stage 6): seat assignments and renames made
  // in admin are live here. Seat → guest lookup rebuilt when the list lands.
  const dbGuests = useDbGuests();
  const guestBySeatKey = useMemo(() => {
    const map = new Map<string, Guest>();
    for (const g of dbGuests ?? []) {
      // Seats are nullable (assigned after the RSVP deadline) — unseated
      // guests simply have no seat to be looked up from.
      if (g.row === null || g.seat === null) continue;
      map.set(seatKey(g.row, g.section, g.seat), g);
    }
    return map;
  }, [dbGuests]);

  // Live attendance — drives the ✓ in the popover.
  const arrived = useAttendance();
  const arrivedIds = new Set((arrived ?? []).map((r) => r.guest_id));

  // Pulse lookup — Set of seat keys that should pulse on mount.
  const pulseSet = new Set<string>(
    (pulseAt ?? []).map((p) => seatKey(p.row, p.section, p.seat))
  );

  // Group layout sections by row.
  const byRow = new Map<number, LayoutSection[]>();
  for (const section of layout) {
    const list = byRow.get(section.row) ?? [];
    list.push(section);
    byRow.set(section.row, list);
  }
  const rows = [...byRow.entries()].sort(([a], [b]) => a - b);

  const mapContent = (
    <div className="flex flex-col gap-10 items-center py-4">
      {rows.map(([rowNum, sections]) => (
        <div key={rowNum} className="flex flex-col items-center gap-2">
          <div className="font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Row {rowNum}
          </div>
          <div className="flex items-start gap-6">
            {sections
              .slice()
              .sort((a, b) => a.start_seat - b.start_seat)
              .map((section) => (
                <SectionBlock
                  key={`${rowNum}-${section.section ?? "_"}`}
                  section={section}
                  highlightMap={highlightMap}
                  guestBySeatKey={guestBySeatKey}
                  arrivedIds={arrivedIds}
                  pulseSet={pulseSet}
                  showSeatInfo={showSeatInfo}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (!zoomable) return mapContent;

  // react-zoom-pan-pinch wraps the content. Pinch on iPad → zoom; drag → pan.
  // Tap-events still pass through to the seat triggers (no conflict with
  // popover open).
  return (
    <TransformWrapper
      initialScale={1}
      minScale={0.5}
      maxScale={3}
      centerOnInit
      doubleClick={{ disabled: false, step: 0.5 }}
      wheel={{ step: 0.1 }}
    >
      <TransformComponent
        wrapperClass="!w-full !h-full"
        contentClass="!w-full"
      >
        {mapContent}
      </TransformComponent>
    </TransformWrapper>
  );
}

// ─── A row's section block ───────────────────────────────────────────────────

function SectionBlock({
  section,
  highlightMap,
  guestBySeatKey,
  arrivedIds,
  pulseSet,
  showSeatInfo,
}: {
  section: LayoutSection;
  highlightMap: Map<string, SeatHighlight>;
  guestBySeatKey: Map<string, Guest>;
  arrivedIds: Set<number>;
  pulseSet: Set<string>;
  showSeatInfo: boolean;
}) {
  const seats: number[] = [];
  for (let n = section.start_seat; n <= section.end_seat; n++) seats.push(n);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex gap-1.5">
        {seats.map((n) => {
          const key = seatKey(section.row, section.section, n);
          return (
            <Seat
              key={n}
              number={n}
              keyStr={key}
              highlight={highlightMap.get(key)}
              guest={guestBySeatKey.get(key)}
              arrivedIds={arrivedIds}
              pulse={pulseSet.has(key)}
              showInfo={showSeatInfo}
            />
          );
        })}
      </div>
      {section.section && (
        <div className="font-sans text-[10px] text-muted-foreground">
          {section.label}
        </div>
      )}
    </div>
  );
}

// ─── A single seat ───────────────────────────────────────────────────────────

function Seat({
  number,
  highlight,
  guest,
  arrivedIds,
  pulse,
  showInfo,
}: {
  number: number;
  keyStr: string;
  highlight: SeatHighlight | undefined;
  guest: Guest | undefined;
  arrivedIds: Set<number>;
  pulse: boolean;
  showInfo: boolean;
}) {
  // Honor the OS "reduce motion" setting — no pulsing for those users.
  const reduceMotion = useReducedMotion();
  const shouldPulse = pulse && !reduceMotion;
  // Visual classes/styles depending on state. Three buckets:
  //   1. no highlight   → plain muted (the venue's default)
  //   2. highlight + pending → standby (taupe) — in your group, not this round
  //   3. highlight + arrived → handled via inline style above (bouquet)
  const visualClasses = cn(
    "size-9 rounded-full grid place-items-center",
    "font-sans text-xs transition-colors outline-none",
    "focus-visible:ring-2 focus-visible:ring-ring",
    // Unselected seat: subtle filled disc + thin visible border so the
    // seat reads as a distinct shape against the page background. Previously
    // bg-muted alone was nearly invisible (muted ≈ page background).
    !highlight &&
      "bg-muted-foreground/10 border border-muted-foreground/35 text-muted-foreground",
    highlight?.state === "pending" &&
      "bg-standby/25 border-2 border-standby text-foreground font-semibold"
  );

  // Visual state derives from `highlight`. We use Tailwind classes for the
  // static "pending" treatment (uses the --standby token) and inline style
  // only for the dynamic "arrived" treatment (bouquet color varies per
  // person at runtime, which Tailwind's JIT can't see).
  const inlineStyle: React.CSSProperties | undefined =
    highlight?.state === "arrived"
      ? {
          backgroundColor: `hsl(var(--${highlight.color}))`,
          boxShadow: `0 0 0 4px hsl(var(--${highlight.color}) / 0.3)`,
          color: "white",
          fontWeight: 700,
        }
      : undefined;

  // The seat element — a motion.button so it can both pulse and be a tap target.
  const seatEl = (
    <motion.button
      type="button"
      className={visualClasses}
      style={inlineStyle}
      // Pulse plays ONCE on mount when `pulse` is true: scale up, down, up,
      // down. Keyframes finish at 1.0 (back to normal size).
      initial={false}
      // 5-second pulse, 5 cycles of up-down. Plays once on mount per the
      // keyframes array; lands back at scale 1 when finished.
      animate={
        shouldPulse
          ? { scale: [1, 1.18, 1, 1.18, 1, 1.18, 1, 1.18, 1, 1.18, 1] }
          : { scale: 1 }
      }
      transition={
        shouldPulse ? { duration: 5, ease: "easeInOut" } : { duration: 0 }
      }
      aria-label={guest ? `Seat ${number}, ${guest.name}` : `Seat ${number}`}
    >
      {number}
    </motion.button>
  );

  if (!showInfo) return seatEl;

  // Wrap in a Popover so tapping the seat reveals the guest info card.
  return (
    <Popover>
      <PopoverTrigger asChild>{seatEl}</PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="center" sideOffset={6}>
        <SeatInfoCard number={number} guest={guest} arrivedIds={arrivedIds} />
      </PopoverContent>
    </Popover>
  );
}

// ─── Popover content ─────────────────────────────────────────────────────────

function SeatInfoCard({
  number,
  guest,
  arrivedIds,
}: {
  number: number;
  guest: Guest | undefined;
  arrivedIds: Set<number>;
}) {
  if (!guest) {
    return (
      <div className="font-sans text-sm text-muted-foreground">
        Seat {number} · empty
      </div>
    );
  }
  const group = guest.seating_group_id
    ? GROUP_BY_ID.get(guest.seating_group_id)
    : null;
  const isArrived = arrivedIds.has(guest.id);
  return (
    <div className="space-y-1 min-w-[10rem]">
      <div className="font-display text-base leading-none">{guest.name}</div>
      {group && (
        <div className="font-sans text-xs text-muted-foreground leading-none">
          {group.label}
        </div>
      )}
      {isArrived && (
        <div className="flex items-center gap-1 font-sans text-xs text-arrived leading-none pt-1">
          <Check className="size-3" /> Arrived
        </div>
      )}
    </div>
  );
}
