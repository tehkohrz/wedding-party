"use client";

/**
 * Name search on the welcome screen (check-in).
 *
 * Picking a match writes the guest to the wizard store and moves on:
 * to /checkin/group for guests with a party, or straight to
 * /checkin/lunch (marked arrived) for solo guests.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GuestSearchBox } from "@/components/GuestSearchBox";
import { useGuestSearch } from "@/hooks/useGuestSearch";
import { useDbGuests } from "@/hooks/useDbGuests";
import { useWizardStore } from "@/lib/store";
import { hasGroupmates } from "@/lib/groups";
import { markArrived } from "@/lib/attendance";
import { WELCOME_COPY } from "@/lib/content";
import type { Guest } from "@/lib/schema";

export function NameSearch() {
  const router = useRouter();
  const setCurrentGuest = useWizardStore((s) => s.setCurrentGuest);
  const setDirection = useWizardStore((s) => s.setDirection);
  const setCheckedInThisRound = useWizardStore(
    (s) => s.setCheckedInThisRound
  );

  const [query, setQuery] = useState("");
  // The searchable list comes from the DATABASE (Stage 6) — admin edits
  // and plus-one renames are live on the check-in iPad.
  const allGuests = useDbGuests();
  const matches = useGuestSearch(query, allGuests);

  async function handleSelect(guest: Guest) {
    setCurrentGuest(guest);
    setDirection("forward");
    if (hasGroupmates(guest, allGuests ?? [guest])) {
      // Grouped: Confirm on the group screen populates checkedInThisRound.
      // Clear it now so the lunch screen never inherits a stale prior round.
      setCheckedInThisRound([]);
      router.push("/checkin/group");
    } else {
      // Solo: this guest is the entire round.
      await markArrived(guest.id);
      setCheckedInThisRound([guest.id]);
      router.push("/checkin/lunch");
    }
  }

  return (
    <GuestSearchBox
      query={query}
      onQueryChange={setQuery}
      matches={matches}
      onSelect={handleSelect}
      placeholder={WELCOME_COPY.inputPlaceholder}
      emptyText={WELCOME_COPY.noMatches}
    />
  );
}
