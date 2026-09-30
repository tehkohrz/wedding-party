"use client";

/**
 * Live attendance for the day-of screens — the useLiveQuery replacement
 * now that arrivals live in the database (Stage 6).
 *
 * Two update channels:
 *   - POLLING every 4 seconds — how this device sees check-ins made on
 *     OTHER devices (multi-iPad day-of setup).
 *   - the lib/attendance change bus — writes from THIS device refresh
 *     instantly instead of waiting out the poll interval.
 *
 * One poller and one list are shared by every screen (see
 * useLiveResource). That gives no overlapping requests, a hard timeout per
 * attempt, backoff while the API is failing, and nothing at all while the
 * tab is hidden.
 *
 * Returns undefined until the first fetch lands (same contract as
 * useLiveQuery), then the full record list. Failed polls keep the last
 * good data — a WiFi blip shouldn't blank the dashboard.
 */
import { useEffect } from "react";
import {
  getAllArrived,
  subscribeAttendance,
  type AttendanceRecord,
} from "@/lib/attendance";
import { liveResource, useLiveResource } from "./useLiveResource";

const attendance = liveResource(getAllArrived, { intervalMs: 4000 });

export function useAttendance(): AttendanceRecord[] | undefined {
  // A write on THIS device should show immediately rather than waiting
  // out the interval (or an accumulated backoff).
  useEffect(() => subscribeAttendance(attendance.refresh), []);
  return useLiveResource(attendance);
}
