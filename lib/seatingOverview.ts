/**
 * Which group sits where, for the projector overview at /seating.
 *
 * Mirrors the Seating Plan tab of the venue workbook. Each table side is a
 * list of runs, pool end first, as [owner, seatCount]. A null owner is an
 * empty seat the venue removes. Columns follow the workbook grid (N = 13),
 * so the stagger between tables matches the floor plan.
 */

export type GroupId = "A" | "B" | "C" | "D" | "E" | "F" | "G";
export type SeatOwner = GroupId | "couple" | null;
type Run = readonly [SeatOwner, number];

export type TagId = "brideParents" | "groomParents";

/** Seats that get an outline and a name card, such as the parents'. */
export interface SeatTag {
  id: TagId;
  side: "top" | "bottom";
  /** Workbook columns of the tagged seats, pool end first. */
  cols: readonly number[];
}

export interface OverviewTable {
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

export const OVERVIEW_TABLES: readonly OverviewTable[] = [
  {
    number: 1,
    startCol: 14,
    band: 0,
    labels: { G: "above", A: "above", B: "below" },
    top: [[null, 1], ["G", 6], ["A", 3], ["B", 11]],
    bottom: [["G", 5], ["A", 3], ["couple", 2], ["B", 10], [null, 1]],
    tags: [
      { id: "groomParents", side: "top", cols: [29, 30] },
      { id: "brideParents", side: "bottom", cols: [19, 20] },
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
