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
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useGuestSearch } from "@/hooks/useGuestSearch";
import { useWizardStore } from "@/lib/store";
import { WELCOME_COPY } from "@/lib/content";
import type { Guest } from "@/lib/schema";

export function NameSearch() {
  const router = useRouter();
  const setCurrentGuest = useWizardStore((s) => s.setCurrentGuest);
  const setDirection = useWizardStore((s) => s.setDirection);

  const [query, setQuery] = useState("");
  const matches = useGuestSearch(query);

  function handleSelect(guest: Guest) {
    setCurrentGuest(guest);
    setDirection("forward");
    router.push("/group");
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
        className="text-lg h-14 rounded-pill text-center"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {showResults && (
        <div className="space-y-2" role="listbox">
          {matches.map((g) => (
            <Card
              key={g.id}
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
