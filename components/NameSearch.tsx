"use client";

/**
 * Name search input + results list, used on the welcome screen.
 *
 * Behavior:
 *   - User types in the input.
 *   - Fuzzy matches appear below (top 5).
 *   - Tapping a match writes the guest to the wizard store, marks the
 *     direction as forward, and pushes to /group.
 *
 * Session 10 will add the conditional skip-past-/group for solo guests.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
  const reduceMotion = useReducedMotion();

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

  const showResults = query.trim().length > 0;
  const showEmptyState = showResults && matches.length === 0;

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      <Input
        type="search"
        inputMode="text"
        autoComplete="off"
        autoFocus
        placeholder={WELCOME_COPY.inputPlaceholder}
        // focus:placeholder:opacity-0 hides the placeholder the moment the
        // input is focused (vs the default "only fade when text is typed").
        className="text-lg h-14 rounded-pill text-center placeholder:transition-opacity placeholder:duration-150 focus:placeholder:opacity-0"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {showResults && (
        <div className="space-y-2" role="listbox">
          {/* Results cascade in — each card 50ms after the last. Reduced
              motion: rendered instantly with no offset. */}
          {matches.map((g, i) => (
            <motion.div
              key={g.id}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.22, delay: i * 0.05, ease: "easeOut" }
              }
            >
              <Card
                role="option"
                tabIndex={0}
                onClick={() => handleSelect(g)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(g);
                  }
                }}
                className="
                  cursor-pointer
                  px-5 py-3
                  flex items-center
                  hover:bg-muted active:bg-muted/70
                  focus-visible:ring-2 focus-visible:ring-ring
                  transition
                "
              >
                <span className="font-display text-xl">{g.name}</span>
              </Card>
            </motion.div>
          ))}

          {showEmptyState && (
            <p className="font-sans text-sm text-muted-foreground text-center pt-2">
              No matches yet — try a different spelling or a nickname.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
