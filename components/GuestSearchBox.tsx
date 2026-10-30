"use client";

/**
 * The kiosk name search box: a large pill input and the matching guests
 * below it. NameSearch decides what picking a guest does.
 *
 * Matching lives in useGuestSearch; this component only displays it.
 */
import { motion, useReducedMotion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { Guest } from "@/lib/schema";

export function GuestSearchBox({
  query,
  onQueryChange,
  matches,
  onSelect,
  placeholder,
  emptyText,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  matches: Guest[];
  onSelect: (guest: Guest) => void;
  placeholder: string;
  /** Shown when the query matches no one. */
  emptyText: string;
}) {
  const reduceMotion = useReducedMotion();
  const showResults = query.trim().length > 0;

  return (
    // data-searching lets a page restyle itself while results are open,
    // e.g. the welcome screen hides its names to make room for the list.
    <div className="w-full max-w-md mx-auto space-y-3" data-searching={showResults || undefined}>
      <Input
        type="search"
        inputMode="text"
        autoComplete="off"
        autoFocus
        placeholder={placeholder}
        // Typed names use the result cards' serif, so a name looks the same
        // in the box and in the list; the placeholder is its italic.
        // The base Input shrinks to md:text-sm on wider screens, so the
        // size is set for md as well or the iPad gets 14px text.
        // focus:placeholder:opacity-0 hides the placeholder as soon as
        // the input is focused, not only once text is typed.
        className="h-16 rounded-pill text-center font-display text-2xl md:text-2xl font-semibold placeholder:italic placeholder:transition-opacity placeholder:duration-150 focus:placeholder:opacity-0"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />

      {showResults && (
        <div className="space-y-2" role="listbox">
          {/* Results cascade in, each card 50ms after the last. Reduced
              motion renders them instantly with no offset. */}
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
                onClick={() => onSelect(g)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(g);
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
                <span className="font-display text-2xl font-semibold">{g.name}</span>
              </Card>
            </motion.div>
          ))}

          {matches.length === 0 && (
            <p className="font-display text-xl italic font-semibold text-muted-foreground text-center pt-2">
              {emptyText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
