"use client";

// Screen 2 — Group attendance check-in.
//
// "use client" + useRequireGuest: needs a selected guest in the wizard
// store. Direct URL hits / refreshes get bounced back to /.

import { GroupCheckin } from "@/components/GroupCheckin";
import { useRequireGuest } from "@/hooks/useRequireGuest";

export default function GroupPage() {
  const guest = useRequireGuest();

  // During the redirect tick (no guest), render nothing.
  if (!guest) return null;

  return <GroupCheckin guest={guest} />;
}
