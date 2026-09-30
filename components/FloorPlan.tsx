/**
 * The lunch floor plan as one SVG. It draws the room: the pool and screen
 * as thin bars at the edges, and the tables with their numbers on top.
 * Each page draws its own seats and labels over it as children, placed
 * with seatCentre().
 *
 * Drawn in viewBox units, so it scales to any screen.
 */
import { Fredoka } from "next/font/google";
import { FLOOR_PLAN_COPY } from "@/lib/content";
import {
  FLOOR_TABLES,
  expandRuns,
  tableName,
  type FloorTable,
  type SeatRef,
} from "@/lib/floorPlan";

// Rounded, friendly face for the plan's labels. It loads with the plan,
// so pages without a floor plan never download it.
const signage = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  display: "swap",
});

const VIEW_W = 1600;
const PITCH = 54; // width of one seat
const GRID_LEFT = 152; // x of workbook column N (13), centring columns 13–36
export const SEAT_R = 19;
const SEAT_GAP = 47; // table centre line to each seat row
const TABLE_H = 44;
// Centre line of each row of tables. The aisle between them is wide enough
// for T1's lower labels to read as T1's.
const BAND_Y = [250, 512];
// The pool and screen are thin bars at either edge, spanning the tables.
const SIDE_W = 72;
const SIDE_INSET = 32; // viewBox edge to each bar
const ROOM_TOP = 172;
const ROOM_H = 418;
const WAVE_OFFSETS = [-150, -90, 90, 150]; // from the pool's centre, clear of its label

const TABLE_BY_NUMBER = new Map(FLOOR_TABLES.map((t) => [t.number, t]));
const colX = (col: number) => GRID_LEFT + (col - 13) * PITCH + PITCH / 2;
const colour = (token: string) => `hsl(var(--seat-${token}))`;

/** Space around the room that keeps content spanning minY..maxY in view. */
export function padToFit(minY: number, maxY: number, min = 16) {
  return {
    top: Math.max(min, ROOM_TOP - minY),
    bottom: Math.max(min, maxY - (ROOM_TOP + ROOM_H)),
  };
}

/** Centre of a seat in viewBox units. */
export function seatCentre({ table, side, position }: SeatRef) {
  const t = TABLE_BY_NUMBER.get(table)!;
  return {
    x: colX(t.startCol + position - 1),
    y: BAND_Y[t.band] + (side === "top" ? -SEAT_GAP : SEAT_GAP),
  };
}

export function FloorPlan({
  pad,
  role = "img",
  label,
  className,
  children,
}: {
  /** Space above and below the pool and screen bars, for labels. */
  pad: { top: number; bottom: number };
  /** "img" for a picture; "group" when the seats are interactive. */
  role?: "img" | "group";
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox={`0 ${ROOM_TOP - pad.top} ${VIEW_W} ${ROOM_H + pad.top + pad.bottom}`}
      preserveAspectRatio="xMidYMid meet"
      role={role}
      aria-label={label}
      className={`${signage.variable} ${className ?? ""}`}
    >
      <SideBar
        x={SIDE_INSET}
        rx={24}
        fill={colour("pool")}
        label={FLOOR_PLAN_COPY.poolLabel}
        labelFill="hsl(var(--foreground))"
      >
        <PoolWaves x={SIDE_INSET} />
      </SideBar>
      <SideBar
        x={VIEW_W - SIDE_INSET - SIDE_W}
        rx={14}
        fill={colour("screen")}
        label={FLOOR_PLAN_COPY.screenLabel}
        labelFill="white"
      />
      {FLOOR_TABLES.map((table) => (
        <Table key={table.number} table={table} />
      ))}
      {children}
    </svg>
  );
}

/** A table top with its number written on it. */
function Table({ table }: { table: FloorTable }) {
  const seats = Math.max(expandRuns(table.top).length, expandRuns(table.bottom).length);
  const first = colX(table.startCol);
  const last = colX(table.startCol + seats - 1);
  const cy = BAND_Y[table.band];
  return (
    <g>
      <rect
        x={first - PITCH / 2 + 4}
        y={cy - TABLE_H / 2}
        width={last - first + PITCH - 8}
        height={TABLE_H}
        rx={TABLE_H / 2}
        style={{
          fill: colour("table"),
          stroke: "hsl(var(--invite-frame))",
          strokeWidth: 2,
        }}
      />
      <text
        x={(first + last) / 2}
        y={cy}
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
        {tableName(table.number)}
      </text>
    </g>
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
