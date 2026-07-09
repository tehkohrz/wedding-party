/**
 * Attendance store, backed by IndexedDB via Dexie.
 *
 * Database name: "sitwhereah"
 * One table: `attendance`, keyed by guest_id.
 * A row exists for a guest iff they have arrived.
 *
 * Browser-only: IndexedDB doesn't exist on the server, so this module
 * must only be imported from client components ("use client" files).
 * Importing it into a server component will fail at runtime.
 */
import Dexie, { type Table } from "dexie";

export interface AttendanceRecord {
  /** References Guest.id from lib/schema.ts. */
  guest_id: number;
  /** Epoch milliseconds — Date.now() when marked arrived. */
  arrived_at: number;
}

class AttendanceDB extends Dexie {
  attendance!: Table<AttendanceRecord, number>;

  constructor() {
    super("sitwhereah");
    // The string defines the primary key and any secondary indexes.
    // "guest_id" alone means guest_id is the primary key (no other indexes
    // needed — we only ever look up by guest_id or fetch the whole table).
    this.version(1).stores({
      attendance: "guest_id",
    });
  }
}

/**
 * The singleton DB connection. Exported so React components can use
 * dexie-react-hooks' useLiveQuery to subscribe to live updates.
 */
export const db = new AttendanceDB();

/** Mark a guest as arrived. Idempotent — calling twice keeps the latest timestamp. */
export async function markArrived(guestId: number): Promise<void> {
  await db.attendance.put({
    guest_id: guestId,
    arrived_at: Date.now(),
  });
}

/**
 * Mark several guests as arrived in one transaction (group check-in).
 * Uses Dexie's bulkPut — one write op instead of N. All share the same
 * timestamp. Idempotent, like markArrived.
 */
export async function markArrivedMany(guestIds: number[]): Promise<void> {
  if (guestIds.length === 0) return;
  const now = Date.now();
  await db.attendance.bulkPut(
    guestIds.map((id) => ({ guest_id: id, arrived_at: now }))
  );
}

/** Remove a guest's arrival record (admin manual override / reset). */
export async function unmark(guestId: number): Promise<void> {
  await db.attendance.delete(guestId);
}

/** Returns the record if the guest has arrived, otherwise undefined. */
export async function getStatus(
  guestId: number
): Promise<AttendanceRecord | undefined> {
  return db.attendance.get(guestId);
}

/** Every arrival, useful for stats and the map overlay. */
export async function getAllArrived(): Promise<AttendanceRecord[]> {
  return db.attendance.toArray();
}

/** Wipe everything. Used by admin "Reset all" after double-confirm. */
export async function resetAll(): Promise<void> {
  await db.attendance.clear();
}

/**
 * Replace the entire attendance table with the given records (restore from
 * a backup file). Clears first so the result exactly matches the backup —
 * records added since the backup are removed. Runs in one transaction.
 */
export async function replaceAllAttendance(
  records: AttendanceRecord[]
): Promise<void> {
  await db.transaction("rw", db.attendance, async () => {
    await db.attendance.clear();
    if (records.length > 0) await db.attendance.bulkPut(records);
  });
}
