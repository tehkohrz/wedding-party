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
 * Scheduling is delegated to useBackoffPoll: no overlapping requests, a
 * hard timeout per attempt, exponential backoff while the API is failing,
 * and nothing at all while the tab is hidden. It previously used a raw
 * setInterval, which piled up in-flight requests during an outage.
 *
 * Returns undefined until the first fetch lands (same contract as
 * useLiveQuery), then the full record list. Failed polls keep the last
 * good data — a WiFi blip shouldn't blank the dashboard.
 */
import { useCallback, useEffect, useState } from "react";
import {
  getAllArrived,
  subscribeAttendance,
  type AttendanceRecord,
} from "@/lib/attendance";
import { useBackoffPoll } from "./useBackoffPoll";

export function useAttendance(pollMs = 4000): AttendanceRecord[] | undefined {
  const [records, setRecords] = useState<AttendanceRecord[] | undefined>();

  const load = useCallback(async (signal: AbortSignal) => {
    // Throwing is how the scheduler learns to back off, so no catch here.
    setRecords(await getAllArrived(signal));
  }, []);

  const { refresh } = useBackoffPoll(load, { intervalMs: pollMs });

  // A write on THIS device should show immediately rather than waiting
  // out the interval (or an accumulated backoff).
  useEffect(() => subscribeAttendance(refresh), [refresh]);

  return records;
}
