"use client";

/**
 * PIN gate wrapper for /admin.
 *
 * Route gating pattern: this component wraps the protected content and
 * conditionally renders it. If the gate is disabled (env toggle) or the
 * correct PIN was already entered this browser session, it renders
 * `children`. Otherwise it renders the PIN entry form instead.
 *
 * "Session" unlock: we remember success in sessionStorage so a glance away
 * and back doesn't re-prompt. sessionStorage clears when the tab closes —
 * so a fresh launch re-locks. (localStorage would persist across launches;
 * sessionStorage is the safer default for a gate.)
 *
 * This is a SOFT gate. The PIN ships in the client bundle (see
 * lib/adminConfig.ts) — it deters casual taps, not determined inspection.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ADMIN_PIN, ADMIN_PIN_ENABLED } from "@/lib/adminConfig";
import { ADMIN_COPY } from "@/lib/content";

const SESSION_KEY = "sitwhereah-admin-unlocked";

export function AdminPinGate({ children }: { children: React.ReactNode }) {
  // Initial unlocked state, computed once:
  //   - gate disabled       → always unlocked
  //   - previously unlocked → stays unlocked (sessionStorage)
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    if (!ADMIN_PIN_ENABLED) return true;
    if (typeof window === "undefined") return false; // SSR guard
    return sessionStorage.getItem(SESSION_KEY) === "true";
  });

  const [entry, setEntry] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (entry === ADMIN_PIN) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setUnlocked(true);
    } else {
      setError(true);
      setEntry("");
    }
  }

  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col items-center justify-center gap-6 px-6">
      <div className="text-center space-y-1">
        <h1 className="font-display text-4xl">{ADMIN_COPY.pinHeading}</h1>
        <p className="font-sans text-sm text-muted-foreground">
          {ADMIN_COPY.pinPrompt}
        </p>
      </div>

      <form onSubmit={submit} className="w-full max-w-xs space-y-3">
        <Input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          maxLength={4}
          value={entry}
          onChange={(e) => {
            setEntry(e.target.value.replace(/\D/g, "")); // digits only
            setError(false);
          }}
          className={cn(
            "text-center text-2xl tracking-[0.5em] h-14 rounded-pill",
            error && "border-destructive"
          )}
          placeholder="••••"
        />
        {error && (
          <p className="font-sans text-sm text-destructive text-center">
            {ADMIN_COPY.pinError}
          </p>
        )}
        <Button type="submit" className="w-full h-12 rounded-pill">
          Unlock
        </Button>
      </form>
    </div>
  );
}
