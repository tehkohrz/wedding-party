/**
 * Attendance client — Stage 6: arrivals live in the DATABASE (via
 * /api/attendance), shared across every check-in device. This module kept
 * the same function names as the old Dexie version so screens barely
 * changed; Dexie itself is retired.
 *
 * Reactivity: useLiveQuery is replaced by hooks/useAttendance (polling +
 * the local `subscribeAttendance` bus below, which fires immediately after
 * any write from THIS device so the UI never waits a poll interval).
 *
 * Writes THROW on failure (network down, server error or timeout). The
 * check-in screens catch it through hooks/useCheckIn, which keeps the guest
 * on the screen with a message to try again.
 */

export interface AttendanceRecord {
  /** References Guest.id. */
  guest_id: number;
  /** Epoch milliseconds. */
  arrived_at: number;
}

// ─── Local change bus (this-device reactivity between polls) ────────────────

type Listener = () => void;
const listeners = new Set<Listener>();

/** Subscribe to "attendance changed on this device" events. */
export function subscribeAttendance(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(): void {
  listeners.forEach((fn) => fn());
}

// ─── Reads ───────────────────────────────────────────────────────────────────

/** Every arrival — stats, map overlay, admin dashboard. */
export async function getAllArrived(
  // Optional so callers that don't care keep working; the polling hook
  // passes one so a hung request can be aborted instead of stacking up.
  signal?: AbortSignal,
): Promise<AttendanceRecord[]> {
  const res = await fetch("/api/attendance", { signal });
  if (!res.ok) throw new Error("attendance fetch failed");
  const json = (await res.json()) as { attendance: AttendanceRecord[] };
  return json.attendance;
}

// ─── Writes (check-in devices) ───────────────────────────────────────────────

// A check-in that hasn't answered by now has hit dead WiFi. Giving up lets
// the screen say so instead of leaving the guest at a frozen button.
const WRITE_TIMEOUT_MS = 8_000;

/**
 * Mark several guests as arrived in one request (group check-in).
 * Idempotent — re-marking refreshes the timestamp, so a retry after a
 * timeout that did reach the server is harmless.
 */
export async function markArrivedMany(guestIds: number[]): Promise<void> {
  if (guestIds.length === 0) return;
  const res = await fetch("/api/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guest_ids: guestIds }),
    signal: AbortSignal.timeout(WRITE_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error("mark arrived failed");
  notify();
}

/** Mark a single guest as arrived. */
export async function markArrived(guestId: number): Promise<void> {
  await markArrivedMany([guestId]);
}

// ─── Writes (admin only — the PIN cookie authorizes these) ──────────────────

/** Remove a guest's arrival record (admin manual override). */
export async function unmark(guestId: number): Promise<void> {
  const res = await fetch("/api/admin/attendance", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guest_id: guestId }),
  });
  if (!res.ok) throw new Error("unmark failed");
  notify();
}

/** Wipe everything. Used by admin "Reset all" after double-confirm. */
export async function resetAll(): Promise<void> {
  const res = await fetch("/api/admin/attendance", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ all: true }),
  });
  if (!res.ok) throw new Error("reset failed");
  notify();
}

/** Replace the entire attendance table (restore from a backup file). */
export async function replaceAllAttendance(
  records: AttendanceRecord[]
): Promise<void> {
  const res = await fetch("/api/admin/attendance", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attendance: records }),
  });
  if (!res.ok) throw new Error("restore failed");
  notify();
}
