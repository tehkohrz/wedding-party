// Admin dashboard — reception-desk control panel.
//
// NOT in WIZARD_PATHS: no slide transition, no idle-reset, no Back/Home
// buttons. Reached by typing /admin directly; not linked from the guest UI.
//
// The AdminPinGate wraps the dashboard: it renders the PIN form until the
// correct code is entered (or renders straight through if the gate is
// disabled via NEXT_PUBLIC_ADMIN_PIN_ENABLED).

import { AdminPinGate } from "@/components/AdminPinGate";
import { AdminDashboard } from "@/components/AdminDashboard";

export default function AdminPage() {
  return (
    <AdminPinGate>
      <AdminDashboard />
    </AdminPinGate>
  );
}
