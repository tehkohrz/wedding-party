"use client";

/**
 * Live attendance for the day-of screens — the useLiveQuery replacement
 * now that arrivals live in the database (Stage 6).
 *
 * Two update channels:
 *   - POLLING every `pollMs` — how this device sees check-ins made on
 *     OTHER devices (multi-iPad day-of setup).
 *   - the lib/attendance change bus — writes from THIS device refresh
 *     instantly instead of waiting out the poll interval.
 *
 * Returns undefined until the first fetch lands (same contract as
 * useLiveQuery), then the full record list. Failed polls keep the last
 * good data — a WiFi blip shouldn't blank the dashboard.
 */
import { useEffect, useState } from "react";
import {
  getAllArrived,
  subscribeAttendance,
  type AttendanceRecord,
} from "@/lib/attendance";

export function useAttendance(pollMs = 4000): AttendanceRecord[] | undefined {
  const [records, setRecords] = useState<AttendanceRecord[] | undefined>();

  useEffect(() => {
    let alive = true;
    const load = () => {
      getAllArrived()
        .then((r) => {
          if (alive) setRecords(r);
        })
        .catch(() => {}); // keep last good data on failure
    };
    load();
    const id = setInterval(load, pollMs);
    const unsubscribe = subscribeAttendance(load);
    return () => {
      alive = false;
      clearInterval(id);
      unsubscribe();
    };
  }, [pollMs]);

  return records;
}
