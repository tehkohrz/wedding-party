/**
 * The lunch floor plan: which seats exist, and which group sits in each.
 * The projector overview (/seating) and the check-in seat map
 * (/checkin/lunch, /find) both draw from it.
 *
 * Mirrors the Seating Plan tab of the venue workbook. Each table side is a
 * list of runs, pool end first, as [owner, seatCount]. A null owner is an
 * empty seat the venue removes. Columns follow the workbook grid (N = 13),
 * so the stagger between tables matches the floor plan.
 *
 * A guest's seat lives in three database columns. row_num holds the table
 * number, section the side, and seat the position from the pool end.
 * scripts/import-seats.py fills them from the same workbook.
 */
import { FLOOR_PLAN_COPY } from "./content";

export type GroupId = "A" | "B" | "C" | "D" | "E" | "F" | "G";
export type SeatOwner = GroupId | "couple" | null;
export type Side = "top" | "bottom";
type Run = readonly [SeatOwner, number];

export const SIDES: readonly Side[] = ["top", "bottom"];

export type TagId = "brideParents" | "groomParents";

/** Seats that get an outline and a name tag, such as the parents'. */
export interface SeatTag {
  id: TagId;
  side: Side;
  /** Positions of the tagged seats, counted from the pool end. */
  positions: readonly number[];
}

export interface FloorTable {
  /** Table number on the venue's plan. */
  number: number;
  /** Workbook column of the table's first seat (N = 13). */
  startCol: number;
  /** 0 = the family table's row, 1 = the friends' tables below it. */
  band: 0 | 1;
  /** Side of the table each group's name sits on. */
  labels: Partial<Record<GroupId, "above" | "below">>;
  top: readonly Run[];
  bottom: readonly Run[];
  tags?: readonly SeatTag[];
}

export const FLOOR_TABLES: readonly FloorTable[] = [
  {
    number: 1,
    startCol: 14,
    band: 0,
    labels: { G: "above", A: "above", B: "below" },
    top: [[null, 1], ["G", 6], ["A", 3], ["B", 11]],
    bottom: [["G", 5], ["A", 3], ["couple", 2], ["B", 10], [null, 1]],
    tags: [
      { id: "groomParents", side: "top", positions: [16, 17] },
      { id: "brideParents", side: "bottom", positions: [6, 7] },
    ],
  },
  {
    number: 2,
    startCol: 13,
    band: 1,
    labels: { C: "below", D: "below" },
    top: [["C", 3], ["D", 8]],
    bottom: [["C", 4], ["D", 7]],
  },
  {
    number: 3,
    startCol: 26,
    band: 1,
    labels: { E: "below", F: "below" },
    top: [["E", 7], ["F", 4]],
    bottom: [["E", 7], ["F", 4]],
  },
];

/** One owner per seat, pool end first. */
export function expandRuns(runs: readonly Run[]): SeatOwner[] {
  return runs.flatMap(([owner, count]) => Array<SeatOwner>(count).fill(owner));
}

/** A seat's address. position counts from the pool end, starting at 1. */
export interface SeatRef {
  table: number;
  side: Side;
  position: number;
}

export interface PlanSeat extends SeatRef {
  owner: GroupId | "couple";
}

/** Every seat on the plan, with the venue's removed seats left out. */
export const PLAN_SEATS: readonly PlanSeat[] = FLOOR_TABLES.flatMap((table) =>
  SIDES.flatMap((side) =>
    expandRuns(table[side]).flatMap((owner, i) =>
      owner ? [{ table: table.number, side, position: i + 1, owner }] : [],
    ),
  ),
);

export const seatKey = (s: SeatRef) => `${s.table}|${s.side}|${s.position}`;

const SEAT_KEYS = new Set(PLAN_SEATS.map(seatKey));

/** The guest's seat, or null when it is unassigned or not on the plan. */
export function seatOf(g: {
  row: number | null;
  section: string | null;
  seat: number | null;
}): SeatRef | null {
  if (g.row === null || g.seat === null) return null;
  if (g.section !== "top" && g.section !== "bottom") return null;
  const seat: SeatRef = { table: g.row, side: g.section, position: g.seat };
  return SEAT_KEYS.has(seatKey(seat)) ? seat : null;
}

export const tableName = (table: number) => `${FLOOR_PLAN_COPY.tablePrefix}${table}`;
