"use client";

/**
 * SeatingMap — the lunch floor plan for check-in (/checkin/lunch) and the
 * lookup page (/find). The viewer's party lights up in each member's
 * colour, and every other seat stays plain. Tap a seat to see whose it is
 * and whether they've arrived.
 */
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FloorPlan, SEAT_R, seatCentre } from "@/components/FloorPlan";
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
  /** Bouquet colour token, such as "rose". */
  color: string;
  /** arrived = solid colour; pending = in the party but not checked in. */
  state: "arrived" | "pending";
}

const PULSE_R = SEAT_R * 1.18;
const PULSE = [SEAT_R, ...Array.from({ length: 5 }, () => [PULSE_R, SEAT_R]).flat()];

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

  return (
    <FloorPlan pad={{ top: 16, bottom: 16 }} role="group" label="Lunch seating plan" className={className}>
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
