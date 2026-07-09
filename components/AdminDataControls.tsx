"use client";

/**
 * Admin data controls: Export (backup), Restore (recover), Reset (wipe).
 *
 * Export/restore protect against the "iPad site-data wipe = lost attendance"
 * risk. Attendance is the only mutable state; the guest list is static
 * (built from CSV), so a backup only needs the attendance records.
 */
import { useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Download, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { guests } from "@/lib/data";
import {
  db,
  resetAll,
  replaceAllAttendance,
  type AttendanceRecord,
} from "@/lib/attendance";
import { AttendanceExportSchema } from "@/lib/schema";
import { ADMIN_COPY } from "@/lib/content";

export function AdminDataControls() {
  const arrived = useLiveQuery(() => db.attendance.toArray());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resetOpen, setResetOpen] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<
    AttendanceRecord[] | null
  >(null);
  const [restoreError, setRestoreError] = useState(false);

  // ── Export ───────────────────────────────────────────────────────────────
  function handleExport() {
    const records = arrived ?? [];
    const arrivedMap = new Map(records.map((r) => [r.guest_id, r.arrived_at]));

    const payload = {
      app: "sitwhereah",
      version: 1,
      exported_at: new Date().toISOString(),
      // Source of truth for restore:
      attendance: records,
      // Human-readable extra (ignored on restore) — open in any text/JSON
      // viewer to read the full roll-call.
      guests_snapshot: guests.map((g) => ({
        id: g.id,
        name: g.name,
        side: g.side,
        group_id: g.group_id,
        row: g.row,
        section: g.section,
        seat: g.seat,
        arrived: arrivedMap.has(g.id),
        arrived_at: arrivedMap.has(g.id)
          ? new Date(arrivedMap.get(g.id)!).toISOString()
          : null,
      })),
    };

    // Blob + object URL is the standard no-server download trick: wrap the
    // string in a Blob, mint a temporary URL, click a hidden <a download>.
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sitwhereah-attendance-${stamp()}.json`;
    a.click();
    URL.revokeObjectURL(url); // free the memory once the click is dispatched
  }

  // ── Restore ────────────────────────────────────────────────────────────────
  async function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so picking the same file again re-fires
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = AttendanceExportSchema.parse(JSON.parse(text));
      // Keep only records for guests that exist in the current list (the
      // guest list may have changed since the backup was made).
      const knownIds = new Set(guests.map((g) => g.id));
      const valid = parsed.attendance.filter((r) => knownIds.has(r.guest_id));
      setPendingRestore(valid);
    } catch {
      setRestoreError(true);
    }
  }

  async function confirmRestore() {
    if (pendingRestore) await replaceAllAttendance(pendingRestore);
    setPendingRestore(null);
  }

  // ── Reset ────────────────────────────────────────────────────────────────
  async function confirmReset() {
    await resetAll();
    setResetOpen(false);
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download /> {ADMIN_COPY.exportLabel}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload /> {ADMIN_COPY.restoreLabel}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleFilePicked}
      />

      <Button
        variant="destructive"
        size="sm"
        onClick={() => setResetOpen(true)}
      >
        <Trash2 /> {ADMIN_COPY.resetLabel}
      </Button>

      {/* Reset confirmation */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {ADMIN_COPY.resetConfirmTitle}
            </DialogTitle>
            <DialogDescription>{ADMIN_COPY.resetConfirmBody}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              {ADMIN_COPY.resetConfirmCancel}
            </Button>
            <Button variant="destructive" onClick={confirmReset}>
              {ADMIN_COPY.resetConfirmAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore confirmation */}
      <Dialog
        open={pendingRestore !== null}
        onOpenChange={(open) => !open && setPendingRestore(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {ADMIN_COPY.restoreConfirmTitle.replace(
                "{n}",
                String(pendingRestore?.length ?? 0)
              )}
            </DialogTitle>
            <DialogDescription>
              {ADMIN_COPY.restoreConfirmBody}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingRestore(null)}>
              {ADMIN_COPY.restoreConfirmCancel}
            </Button>
            <Button onClick={confirmRestore}>
              {ADMIN_COPY.restoreConfirmAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore error */}
      <Dialog open={restoreError} onOpenChange={setRestoreError}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              Restore failed
            </DialogTitle>
            <DialogDescription>{ADMIN_COPY.restoreError}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setRestoreError(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Filename-safe timestamp: YYYY-MM-DD-HHMM (local time). */
function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(
    d.getHours()
  )}${p(d.getMinutes())}`;
}
