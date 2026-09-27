/**
 * Draws the projector floor plan for /seating. The pool sits on the left,
 * the screen on the right, and every seat takes its group's colour. Guests
 * find their group's area, and the name card on the seat does the rest.
 *
 * Drawn in viewBox units, so it scales to any projector. Labels are HTML
 * inside <foreignObject> so each pill sizes itself to its text.
 */
import { SEATING_OVERVIEW } from "@/lib/content";
import {
  OVERVIEW_TABLES,
  expandRuns,
  type GroupId,
  type SeatOwner,
  type SeatTag,
} from "@/lib/seatingOverview";

// The viewBox hugs the drawing from the top labels to the bottom labels,
// so the plan sits centred under the title.
const VIEW_TOP = 92;
const VIEW_W = 1600;
const VIEW_H = 584;
const PITCH = 54; // width of one seat
const GRID_LEFT = 152; // x of workbook column N (13), centring columns 13–36
const SEAT_R = 19;
const SEAT_GAP = 47; // table centre line to each seat row
const TABLE_H = 44;
// Centre line of each row of tables. The aisle between them is wide enough
// for T1's lower labels to read as T1's.
const BAND_Y = [250, 512];
const LABEL_GAP = 68; // seat row to label centre
const TAG_RING = 6; // tagged seat edge to its outline
const TAG_H = 36;
// The pool and screen are thin bars at either edge, spanning the tables.
const SIDE_W = 72;
const SIDE_INSET = 32; // viewBox edge to each bar
const ROOM_TOP = 172;
const ROOM_H = 418;
const WAVE_OFFSETS = [-150, -90, 90, 150]; // from the pool's centre, clear of its label

const seatX = (col: number) => GRID_LEFT + (col - 13) * PITCH + PITCH / 2;
const colour = (token: string) => `hsl(var(--seat-${token}))`;
const ownerColour = (owner: GroupId | "couple") =>
  colour(owner === "couple" ? "couple" : owner.toLowerCase());

export function SeatingOverview({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 ${VIEW_TOP} ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Seating plan. The pool is on the left and the screen is on the right."
      className={className}
    >
      <SideBar
        x={SIDE_INSET}
        rx={24}
        fill={colour("pool")}
        label={SEATING_OVERVIEW.poolLabel}
        labelFill="hsl(var(--foreground))"
      >
        <PoolWaves x={SIDE_INSET} />
      </SideBar>
      <SideBar
        x={VIEW_W - SIDE_INSET - SIDE_W}
        rx={14}
        fill={colour("screen")}
        label={SEATING_OVERVIEW.screenLabel}
        labelFill="white"
      />
      {OVERVIEW_TABLES.map((table) => {
        const cy = BAND_Y[table.band];
        const top = expandRuns(table.top);
        const bottom = expandRuns(table.bottom);
        const lastCol = table.startCol + Math.max(top.length, bottom.length) - 1;
        // Each group's name is centred over its seats on the side it picks.
        const labels = (["above", "below"] as const).flatMap((side) => {
          const row = side === "above" ? top : bottom;
          const y = side === "above" ? cy - SEAT_GAP - LABEL_GAP : cy + SEAT_GAP + LABEL_GAP;
          return groupCentres(row, table.startCol)
            .filter(({ id }) => table.labels[id] === side)
            .map(({ id, x }) => ({ id, x, y }));
        });

        return (
          <g key={table.number}>
            <rect
              x={seatX(table.startCol) - PITCH / 2 + 4}
              y={cy - TABLE_H / 2}
              width={seatX(lastCol) - seatX(table.startCol) + PITCH - 8}
              height={TABLE_H}
              rx={TABLE_H / 2}
              style={{
                fill: colour("table"),
                stroke: "hsl(var(--invite-frame))",
                strokeWidth: 2,
              }}
            />
            <TableNumber
              x={(seatX(table.startCol) + seatX(lastCol)) / 2}
              y={cy}
              number={table.number}
            />
            <SeatRow owners={top} startCol={table.startCol} y={cy - SEAT_GAP} />
            <SeatRow owners={bottom} startCol={table.startCol} y={cy + SEAT_GAP} />
            {labels.map(({ id, x, y }) => (
              <GroupLabel key={id} id={id} x={x} y={y} />
            ))}
            {table.tags?.map((tag) => {
              const row = tag.side === "top" ? top : bottom;
              const owner = row[tag.cols[0] - table.startCol];
              return owner && <SeatTagMark key={tag.id} tag={tag} owner={owner} cy={cy} />;
            })}
          </g>
        );
      })}
    </svg>
  );
}

function SeatRow({
  owners,
  startCol,
  y,
}: {
  owners: SeatOwner[];
  startCol: number;
  y: number;
}) {
  return (
    <>
      {owners.map((owner, i) =>
        owner ? (
          <circle
            key={i}
            cx={seatX(startCol + i)}
            cy={y}
            r={SEAT_R}
            style={{ fill: ownerColour(owner), stroke: "white", strokeWidth: 3 }}
          />
        ) : null,
      )}
    </>
  );
}

/** Centre of each group's run of seats, for placing its label. */
function groupCentres(owners: SeatOwner[], startCol: number) {
  const spans = new Map<GroupId, [number, number]>();
  owners.forEach((owner, i) => {
    if (!owner || owner === "couple") return;
    const x = seatX(startCol + i);
    const span = spans.get(owner);
    spans.set(owner, span ? [span[0], x] : [x, x]);
  });
  return [...spans].map(([id, [first, last]]) => ({ id, x: (first + last) / 2 }));
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

/** Table number, written on the table top. */
function TableNumber({ x, y, number }: { x: number; y: number; number: number }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      className="font-signage"
      style={{
        fontSize: 28,
        fontWeight: 600,
        letterSpacing: 1,
        fill: "hsl(var(--invite-olive-text))",
      }}
    >
      {`${SEATING_OVERVIEW.tablePrefix}${number}`}
    </text>
  );
}

/**
 * Outlines a few named seats and hangs their name tag off the outline, on
 * the aisle side of the row.
 */
function SeatTagMark({
  tag,
  owner,
  cy,
}: {
  tag: SeatTag;
  owner: GroupId | "couple";
  cy: number;
}) {
  const outward = tag.side === "top" ? -1 : 1;
  const rowY = cy + outward * SEAT_GAP;
  const first = seatX(tag.cols[0]);
  const last = seatX(tag.cols[tag.cols.length - 1]);
  const pad = SEAT_R + TAG_RING;
  const tone = ownerColour(owner);

  return (
    <>
      <rect
        x={first - pad}
        y={rowY - pad}
        width={last - first + 2 * pad}
        height={2 * pad}
        rx={pad}
        style={{ fill: "none", stroke: tone, strokeWidth: 3 }}
      />
      <HtmlAt x={(first + last) / 2} y={rowY + outward * (pad + TAG_H / 2)}>
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

/** A thin bar at one edge of the room, labelled along its length. */
function SideBar({
  x,
  rx,
  fill,
  label,
  labelFill,
  children,
}: {
  x: number;
  rx: number;
  fill: string;
  label: string;
  labelFill: string;
  children?: React.ReactNode;
}) {
  const cx = x + SIDE_W / 2;
  const cy = ROOM_TOP + ROOM_H / 2;
  return (
    <g>
      <rect x={x} y={ROOM_TOP} width={SIDE_W} height={ROOM_H} rx={rx} style={{ fill }} />
      {children}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        transform={`rotate(-90 ${cx} ${cy})`}
        className="font-display"
        style={{
          fontSize: 30,
          fontWeight: 600,
          letterSpacing: 6,
          textTransform: "uppercase",
          fill: labelFill,
        }}
      >
        {label}
      </text>
    </g>
  );
}

function PoolWaves({ x }: { x: number }) {
  const cy = ROOM_TOP + ROOM_H / 2;
  return (
    <>
      {WAVE_OFFSETS.map((dy) => (
        <path
          key={dy}
          d={`M ${x + 16} ${cy + dy} q 10 -8 20 0 t 20 0`}
          style={{ fill: "none", stroke: colour("pool-wave"), strokeWidth: 4, strokeLinecap: "round" }}
        />
      ))}
    </>
  );
}
