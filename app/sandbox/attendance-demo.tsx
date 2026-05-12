"use client";

/**
 * Attendance demo for /sandbox.
 *
 * "use client" because:
 *   1. Dexie/IndexedDB only exist in the browser.
 *   2. We use React state and onClick handlers.
 *
 * useLiveQuery subscribes to the table — anywhere in the app that writes
 * to db.attendance will trigger this component to re-render with fresh data.
 */
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { guests } from "@/lib/data";
import { db, markArrived, unmark, resetAll } from "@/lib/attendance";

export function AttendanceDemo() {
  // useLiveQuery returns:
  //   - undefined while the query is loading (first render only)
  //   - the result, and re-runs whenever the table changes
  const arrived = useLiveQuery(() => db.attendance.toArray()) ?? [];
  const arrivedIds = new Set(arrived.map((r) => r.guest_id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-sans">
          <span className="font-display text-2xl">
            {arrived.length} / {guests.length}
          </span>
          <span className="text-muted-foreground"> arrived</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => resetAll()}
          disabled={arrived.length === 0}
        >
          Reset all
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Guest list</CardTitle>
        </CardHeader>
        <CardContent className="font-sans text-sm space-y-2">
          {guests.map((g) => {
            const isArrived = arrivedIds.has(g.id);
            return (
              <div
                key={g.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-block w-2 h-2 rounded-pill ${
                      isArrived ? "bg-arrived" : "bg-pending"
                    }`}
                  />
                  <span className={isArrived ? "" : "text-muted-foreground"}>
                    {g.name}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    · {g.side}
                  </span>
                </div>
                <Button
                  variant={isArrived ? "ghost" : "default"}
                  size="sm"
                  onClick={() =>
                    isArrived ? unmark(g.id) : markArrived(g.id)
                  }
                >
                  {isArrived ? "Mark away" : "Mark arrived"}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <p className="font-sans text-sm text-muted-foreground">
        Refresh the page — the arrived state persists. Open this page in a
        second tab and watch them stay in sync via useLiveQuery.
      </p>
    </div>
  );
}
