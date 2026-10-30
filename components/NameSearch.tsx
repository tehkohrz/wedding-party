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
import { useCheckIn } from "@/hooks/useCheckIn";
import { useWizardStore } from "@/lib/store";
import { hasGroupmates } from "@/lib/groups";
import { cn } from "@/lib/utils";
import { CHECKIN_COPY, WELCOME_COPY } from "@/lib/content";
import type { Guest } from "@/lib/schema";

export function NameSearch() {
  const router = useRouter();
  const setCurrentGuest = useWizardStore((s) => s.setCurrentGuest);
  const setDirection = useWizardStore((s) => s.setDirection);
  const setCheckedInThisRound = useWizardStore(
    (s) => s.setCheckedInThisRound
  );
  const { checkIn, status, clearFailed } = useCheckIn();

  const [query, setQuery] = useState("");
  // The searchable list comes from the DATABASE (Stage 6) — admin edits
  // and plus-one renames are live on the check-in iPad.
  const allGuests = useDbGuests();
  const matches = useGuestSearch(query, allGuests);

  function handleSelect(guest: Guest) {
    // A solo check-in is still saving. Another pick now could land on the
    // lunch screen under the wrong guest once that save returns.
    if (status === "saving") return;
    setCurrentGuest(guest);
    if (hasGroupmates(guest, allGuests ?? [guest])) {
      // Grouped: Confirm on the group screen populates checkedInThisRound.
      // Clear it now so the lunch screen never inherits a stale prior round.
      setCheckedInThisRound([]);
      setDirection("forward");
      router.push("/checkin/group");
    } else {
      // Solo: this guest is the entire round.
      void checkIn([guest.id]);
    }
  }

  return (
    <>
      <GuestSearchBox
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          clearFailed();
        }}
        matches={matches}
        onSelect={handleSelect}
        placeholder={WELCOME_COPY.inputPlaceholder}
        emptyText={WELCOME_COPY.noMatches}
      />
      {status !== "idle" && (
        <p
          role={status === "failed" ? "alert" : "status"}
          className={cn(
            "font-display text-xl italic font-semibold",
            status === "failed" ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {status === "failed" ? CHECKIN_COPY.saveFailed : CHECKIN_COPY.saving}
        </p>
      )}
    </>
  );
}
