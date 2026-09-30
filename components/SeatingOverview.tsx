/**
 * Projector overview for /seating. Every seat takes its group's colour and
 * each group's name sits beside its seats. Guests find their group's area,
 * and the name card on the seat does the rest.
 *
 * Labels are HTML inside <foreignObject> so each pill sizes itself to its
 * text.
 */
import { FloorPlan, SEAT_R, seatCentre } from "@/components/FloorPlan";
import { SEATING_OVERVIEW } from "@/lib/content";
import {
  FLOOR_TABLES,
  PLAN_SEATS,
  seatKey,
  type FloorTable,
  type GroupId,
  type SeatTag,
} from "@/lib/floorPlan";

const LABEL_GAP = 68; // seat row to label centre
const TAG_RING = 6; // tagged seat edge to its outline
const TAG_H = 36;

const ownerColour = (owner: GroupId | "couple") =>
  `hsl(var(--seat-${owner === "couple" ? "couple" : owner.toLowerCase()}))`;

export function SeatingOverview({ className }: { className?: string }) {
  return (
    <FloorPlan
      pad={{ top: 80, bottom: 86 }}
      label="Seating plan. The pool is on the left and the screen is on the right."
      className={className}
    >
      {PLAN_SEATS.map((seat) => {
        const { x, y } = seatCentre(seat);
        return (
          <circle
            key={seatKey(seat)}
            cx={x}
            cy={y}
            r={SEAT_R}
            style={{ fill: ownerColour(seat.owner), stroke: "white", strokeWidth: 3 }}
          />
        );
      })}
      {FLOOR_TABLES.flatMap(groupLabels).map(({ id, x, y }) => (
        <GroupLabel key={id} id={id} x={x} y={y} />
      ))}
      {FLOOR_TABLES.flatMap((table) =>
        (table.tags ?? []).map((tag) => <SeatTagMark key={tag.id} table={table} tag={tag} />),
      )}
    </FloorPlan>
  );
}

/** Each group's name, centred over its seats on the side it picks. */
function groupLabels(table: FloorTable) {
  const spans = new Map<GroupId, { first: number; last: number; y: number }>();
  for (const seat of PLAN_SEATS) {
    if (seat.table !== table.number || seat.owner === "couple") continue;
    const labelSide = table.labels[seat.owner];
    if (!labelSide || seat.side !== (labelSide === "above" ? "top" : "bottom")) continue;
    const { x, y } = seatCentre(seat);
    const span = spans.get(seat.owner);
    spans.set(
      seat.owner,
      span
        ? { ...span, last: x }
        : { first: x, last: x, y: y + (labelSide === "above" ? -LABEL_GAP : LABEL_GAP) },
    );
  }
  return [...spans].map(([id, s]) => ({ id, x: (s.first + s.last) / 2, y: s.y }));
}

/** Centres HTML on (x, y) so a pill can size itself to its text. */
function HtmlAt({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <foreignObject x={x - 220} y={y - 30} width={440} height={60}>
      <div className="flex h-full items-center justify-center">{children}</div>
    </foreignObject>
  );
}

function GroupLabel({ id, x, y }: { id: GroupId; x: number; y: number }) {
  return (
    <HtmlAt x={x} y={y}>
      <span
        className="whitespace-nowrap rounded-full px-7 py-2.5 font-signage text-[26px] font-semibold leading-none text-white shadow-md"
        style={{ backgroundColor: ownerColour(id) }}
      >
        {SEATING_OVERVIEW.groups[id]}
      </span>
    </HtmlAt>
  );
}

/**
 * Outlines a few named seats and hangs their name tag off the outline, on
 * the aisle side of the row.
 */
function SeatTagMark({ table, tag }: { table: FloorTable; tag: SeatTag }) {
  const seats = tag.positions.map((position) =>
    PLAN_SEATS.find(
      (s) => s.table === table.number && s.side === tag.side && s.position === position,
    ),
  );
  if (!seats[0]) return null;

  const outward = tag.side === "top" ? -1 : 1;
  const first = seatCentre(seats[0]);
  const last = seatCentre(seats.at(-1) ?? seats[0]);
  const pad = SEAT_R + TAG_RING;
  const tone = ownerColour(seats[0].owner);

  return (
    <>
      <rect
        x={first.x - pad}
        y={first.y - pad}
        width={last.x - first.x + 2 * pad}
        height={2 * pad}
        rx={pad}
        style={{ fill: "none", stroke: tone, strokeWidth: 3 }}
      />
      <HtmlAt x={(first.x + last.x) / 2} y={first.y + outward * (pad + TAG_H / 2)}>
        <span
          className="inline-flex items-center whitespace-nowrap rounded-full border-[3px] bg-white px-4 font-signage text-[22px] font-semibold leading-none shadow-sm"
          style={{ height: TAG_H, borderColor: tone, color: "hsl(var(--foreground))" }}
        >
          {SEATING_OVERVIEW.tags[tag.id]}
        </span>
      </HtmlAt>
    </>
  );
}
