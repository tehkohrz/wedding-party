"use client";

/**
 * Name search on the RSVP landing page.
 *
 * Fetches the guest directory once from /api/rsvp-directory (the database
 * is the source of truth for guests in v2 — NOT the build-time lib/data),
 * fuzzy-matches with the same Fuse config as check-in, and routes a tapped
 * result to the guest's personal link (/r/john-tan). Landing on their own
 * URL doubles as teaching guests their shareable link.
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { motion, useReducedMotion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { RSVP_COPY } from "@/lib/content";

interface DirectoryEntry {
  id: number;
  name: string;
  search_aliases: string; // semicolon-separated
  slug: string;
}

type LoadState = "loading" | "ready" | "error";

export function RsvpNameSearch() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const [directory, setDirectory] = useState<DirectoryEntry[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [query, setQuery] = useState("");
  const [navigating, setNavigating] = useState(false);

  // Fetch the directory once on mount.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/rsvp-directory")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => {
        if (cancelled) return;
        setDirectory(json.directory ?? []);
        setLoadState("ready");
      })
      .catch(() => {
        if (!cancelled) setLoadState("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Same Fuse tuning as the check-in search (aliases pre-split for keys).
  const fuse = useMemo(
    () =>
      new Fuse(
        directory.map((d) => ({
          ...d,
          aliases: d.search_aliases.split(";").map((s) => s.trim()),
        })),
        {
          keys: ["name", "aliases"],
          threshold: 0.4,
          minMatchCharLength: 1,
          ignoreLocation: true,
        }
      ),
    [directory]
  );

  const debouncedQuery = useDebouncedValue(query.trim(), 150);
  const matches = useMemo(() => {
    if (debouncedQuery.length === 0) return [];
    return fuse.search(debouncedQuery, { limit: 5 }).map((r) => r.item);
  }, [debouncedQuery, fuse]);

  function handleSelect(entry: DirectoryEntry) {
    setNavigating(true);
    router.push(`/r/${entry.slug}`);
  }

  const showResults = query.trim().length > 0 && loadState === "ready";

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      <Input
        type="search"
        inputMode="text"
        autoComplete="off"
        placeholder={RSVP_COPY.searchPlaceholder}
        className="text-lg h-14 rounded-pill text-center placeholder:transition-opacity placeholder:duration-150 focus:placeholder:opacity-0"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={loadState === "error" || navigating}
      />

      {loadState === "error" && (
        <p className="font-sans text-sm text-destructive text-center">
          Something went wrong loading the guest list — please refresh.
        </p>
      )}

      {showResults && (
        <div className="space-y-2" role="listbox">
          {matches.map((entry, i) => (
            <motion.div
              key={entry.id}
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
                onClick={() => handleSelect(entry)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(entry);
                  }
                }}
                className="cursor-pointer px-5 py-3 flex items-center hover:bg-muted active:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring transition"
              >
                <span className="font-display text-xl">{entry.name}</span>
              </Card>
            </motion.div>
          ))}

          {matches.length === 0 && (
            <p className="font-sans text-sm text-muted-foreground text-center pt-2">
              {RSVP_COPY.noMatches}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
