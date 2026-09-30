"use client";

/**
 * SeatingMap — the lunch floor plan for check-in (/checkin/lunch) and the
 * lookup page (/find). The viewer's party lights up in each member's
 * colour with their name beside the seat, and every other seat stays
 * plain. Tap a seat to see whose it is and whether they've arrived.
 */
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FloorPlan, SEAT_R, padToFit, seatCentre } from "@/components/FloorPlan";
import { useDbGuests } from "@/hooks/useDbGuests";
import { useAttendance } from "@/hooks/useAttendance";
import { FLOOR_PLAN_COPY } from "@/lib/content";
import {
  PLAN_SEATS,
  seatKey,
  seatOf,
  tableName,
  type SeatRef,
} from "@/lib/floorPlan";
import type { Guest } from "@/lib/schema";

export interface SeatHighlight {
  seat: SeatRef;
  /** Printed beside the seat. */
  name: string;
  /** Bouquet colour token, such as "rose". */
  color: string;
  /** arrived = solid colour; pending = in the party but not arrived yet. */
  state: "arrived" | "pending";
}

const PULSE_R = SEAT_R * 1.18;
const PULSE = [SEAT_R, ...Array.from({ length: 5 }, () => [PULSE_R, SEAT_R]).flat()];

// Names use the display serif, like the name boxes above the map.
const NAME_SIZE = 28;
const LANE_H = 32; // one line of names
const NAME_GAP = 8; // seat edge to the first lane
const CHAR_W = 0.5; // glyph width as a share of NAME_SIZE (measured 0.45 average, 0.54 widest)

interface NameLabel {
  key: string;
  name: string;
  /** Lead line colour, matching the seat's look. */
  tone: string;
  x: number;
  y: number;
  /** Where a lead line back to the seat starts. */
  seatEdge: number;
  lane: number;
}

/**
 * Places each name on the aisle side of its row. A name that would overlap
 * its neighbour moves out to the next free lane.
 */
function layoutNames(highlights: SeatHighlight[]): NameLabel[] {
  const rows = new Map<string, SeatHighlight[]>();
  for (const h of highlights) {
    const key = `${h.seat.table}|${h.seat.side}`;
    rows.set(key, [...(rows.get(key) ?? []), h]);
  }

  return [...rows.values()].flatMap((row) => {
    const laneEnds: number[] = []; // right edge of the last name in each lane
    return row
      .map((h) => ({ h, ...seatCentre(h.seat) }))
      .sort((a, b) => a.x - b.x)
      .map(({ h, x, y }) => {
        const half = (h.name.length * NAME_SIZE * CHAR_W) / 2 + 6;
        const free = laneEnds.findIndex((end) => end <= x - half);
        const lane = free === -1 ? laneEnds.length : free;
        laneEnds[lane] = x + half;
        const out = h.seat.side === "top" ? -1 : 1;
        const seatEdge = y + out * SEAT_R;
        return {
          key: seatKey(h.seat),
          name: h.name,
          tone: h.state === "arrived" ? `hsl(var(--${h.color}))` : "hsl(var(--standby))",
          x,
          y: seatEdge + out * (NAME_GAP + LANE_H / 2 + lane * LANE_H),
          seatEdge,
          lane,
        };
      });
  });
}

export function SeatingMap({
  highlights = [],
  pulseAt = [],
  className,
}: {
  highlights?: SeatHighlight[];
  /** Seats that pulse once, for the members checked in this round. */
  pulseAt?: SeatRef[];
  className?: string;
}) {
  const highlightByKey = new Map(highlights.map((h) => [seatKey(h.seat), h]));
  const pulseKeys = new Set(pulseAt.map(seatKey));

  // Seat assignments come from the database, so admin edits show up live.
  const dbGuests = useDbGuests();
  const guestBySeat = useMemo(() => {
    const map = new Map<string, Guest>();
    for (const g of dbGuests ?? []) {
      const seat = seatOf(g);
      if (seat) map.set(seatKey(seat), g);
    }
    return map;
  }, [dbGuests]);

  const arrived = useAttendance();
  const arrivedIds = new Set((arrived ?? []).map((r) => r.guest_id));

  // The plan grows only as far as the names need, so it stays as large as
  // possible on screen.
  const names = layoutNames(highlights);
  const pad = padToFit(
    Math.min(...names.map((n) => n.y - LANE_H / 2)),
    Math.max(...names.map((n) => n.y + LANE_H / 2)),
  );

  return (
    <FloorPlan pad={pad} role="group" label="Lunch seating plan" className={className}>
      {PLAN_SEATS.map((seat) => {
        const key = seatKey(seat);
        const guest = guestBySeat.get(key);
        return (
          <Seat
            key={key}
            seat={seat}
            highlight={highlightByKey.get(key)}
            guest={guest}
            isArrived={guest ? arrivedIds.has(guest.id) : false}
            pulse={pulseKeys.has(key)}
          />
        );
      })}
      {/* Lines first, so each name's halo sits over any line crossing it. */}
      {names
        .filter((n) => n.lane > 0)
        .map((n) => (
          <line
            key={`${n.key}-line`}
            x1={n.x}
            y1={n.seatEdge}
            x2={n.x}
            y2={n.y + (n.y < n.seatEdge ? 1 : -1) * (LANE_H / 2 - 6)}
            style={{ stroke: n.tone, strokeWidth: 2.5 }}
            pointerEvents="none"
          />
        ))}
      {names.map((n) => (
        <text
          key={n.key}
          x={n.x}
          y={n.y}
          textAnchor="middle"
          dominantBaseline="central"
          className="font-display"
          style={{
            fontSize: NAME_SIZE,
            fontWeight: 600,
            fill: "hsl(var(--foreground))",
            stroke: "hsl(var(--background))",
            strokeWidth: 6,
            strokeLinejoin: "round",
            paintOrder: "stroke",
          }}
          pointerEvents="none"
        >
          {n.name}
        </text>
      ))}
    </FloorPlan>
  );
}

function Seat({
  seat,
  highlight,
  guest,
  isArrived,
  pulse,
}: {
  seat: SeatRef;
  highlight: SeatHighlight | undefined;
  guest: Guest | undefined;
  isArrived: boolean;
  pulse: boolean;
}) {
  const [open, setOpen] = useState(false);
  // Honor the OS "reduce motion" setting — no pulsing for those users.
  const reduceMotion = useReducedMotion();
  const shouldPulse = pulse && !reduceMotion;
  const { x, y } = seatCentre(seat);
  const tone = highlight && `hsl(var(--${highlight.color}))`;

  // Three looks. Plain for everyone else's seat, standby taupe for party
  // members not checked in this round, solid bouquet colour for arrivals.
  const look: React.CSSProperties = !highlight
    ? {
        fill: "hsl(var(--muted-foreground) / 0.12)",
        stroke: "hsl(var(--muted-foreground) / 0.35)",
        strokeWidth: 2,
      }
    : highlight.state === "pending"
      ? { fill: "hsl(var(--standby) / 0.25)", stroke: "hsl(var(--standby))", strokeWidth: 3 }
      : { fill: tone, stroke: "white", strokeWidth: 3 };

  // The look sits on the group and the seat inherits it. Motion keeps an
  // animated SVG element's first style, so a look set on the circle itself
  // would never change after the first render.
  return (
    <g style={look}>
      {highlight?.state === "arrived" && (
        <circle
          cx={x}
          cy={y}
          r={SEAT_R + 7}
          style={{ fill: `hsl(var(--${highlight.color}) / 0.3)`, stroke: "none" }}
          pointerEvents="none"
        />
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <motion.circle
            cx={x}
            cy={y}
            role="button"
            tabIndex={0}
            aria-label={guest ? `${guest.name}, ${tableName(seat.table)}` : FLOOR_PLAN_COPY.freeSeat}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setOpen((o) => !o);
              }
            }}
            className="cursor-pointer"
            // Starts at rest so a pulse present on first render still plays.
            initial={{ r: SEAT_R }}
            animate={{ r: shouldPulse ? PULSE : SEAT_R }}
            transition={shouldPulse ? { duration: 5, ease: "easeInOut" } : { duration: 0 }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="center" sideOffset={6}>
          <SeatInfoCard guest={guest} table={seat.table} isArrived={isArrived} />
        </PopoverContent>
      </Popover>
    </g>
  );
}

function SeatInfoCard({
  guest,
  table,
  isArrived,
}: {
  guest: Guest | undefined;
  table: number;
  isArrived: boolean;
}) {
  if (!guest) {
    return (
      <div className="font-sans text-sm text-muted-foreground">
        {FLOOR_PLAN_COPY.freeSeat} · {tableName(table)}
      </div>
    );
  }
  return (
    <div className="space-y-1 min-w-[8rem]">
      <div className="font-display text-base leading-none">{guest.name}</div>
      <div className="font-sans text-xs text-muted-foreground leading-none">
        {tableName(table)}
      </div>
      {isArrived && (
        <div className="flex items-center gap-1 font-sans text-xs text-arrived leading-none pt-1">
          <Check className="size-3" /> {FLOOR_PLAN_COPY.arrived}
        </div>
      )}
    </div>
  );
}
