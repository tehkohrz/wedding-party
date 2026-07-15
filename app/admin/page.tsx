// Admin — reception-desk & planning control panel.
//
// Tabbed: RSVP overview (response progress, food totals for the caterer,
// per-invitation table) · Attendance (day-of dashboard, still local-Dexie
// until Stage 6) · Guest list (database editor + links CSV export).
//
// The gate is now SERVER-verified: /api/admin/login checks ADMIN_PIN
// (a real secret — not NEXT_PUBLIC) and sets an httpOnly session cookie
// that every /api/admin/* route requires.
//
// NOT in WIZARD_PATHS: no slide transition, no idle-reset.

import { AdminGate } from "@/components/admin/AdminGate";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminShell />
    </AdminGate>
  );
}
