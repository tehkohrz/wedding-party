"use client";

/**
 * The tabbed admin shell: RSVP overview · day-of Attendance · Guest list.
 * Owns the header (tabs + Home) and gives each tab a full-height pane.
 */
import { useState } from "react";
import Link from "next/link";
import { House } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ADMIN_COPY } from "@/lib/content";
import { AdminDashboard } from "@/components/AdminDashboard";
import { RsvpOverviewTab } from "./RsvpOverviewTab";
import { GuestsTab } from "./GuestsTab";

type Tab = "rsvp" | "attendance" | "guests";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "rsvp", label: "RSVP" },
  { id: "attendance", label: "Attendance" },
  { id: "guests", label: "Guest list" },
];

export function AdminShell() {
  const [tab, setTab] = useState<Tab>("rsvp");

  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col">
      <header className="shrink-0 border-b border-border px-4 py-3 flex items-center justify-between gap-3">
        <nav className="flex gap-1" aria-label="Admin sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={cn(
                "rounded-pill px-4 py-2 font-sans text-sm transition-colors",
                tab === t.id
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <Button
          variant="outline"
          asChild
          className="h-10 px-4 gap-2 rounded-pill"
        >
          <Link href="/">
            <House className="size-4" />
            {ADMIN_COPY.homeLabel}
          </Link>
        </Button>
      </header>

      <main className="flex-1 min-h-0">
        {tab === "rsvp" && <RsvpOverviewTab />}
        {tab === "attendance" && <AdminDashboard />}
        {tab === "guests" && <GuestsTab />}
      </main>
    </div>
  );
}
