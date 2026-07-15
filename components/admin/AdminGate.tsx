"use client";

/**
 * Server-verified admin gate (replaces the v1 client-side AdminPinGate).
 *
 * On mount, asks /api/admin/session whether a PIN is required and whether
 * this browser already holds a valid session cookie. If needed, shows the
 * PIN form, which POSTs to /api/admin/login — the server compares against
 * ADMIN_PIN (never shipped to the client) and sets an httpOnly cookie.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { House } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ADMIN_COPY } from "@/lib/content";

type GateState = "checking" | "locked" | "open";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>("checking");
  const [entry, setEntry] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((s) => {
        if (cancelled) return;
        setState(!s.pinRequired || s.authed ? "open" : "locked");
      })
      .catch(() => {
        if (!cancelled) setState("locked");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: entry }),
      });
      if (!res.ok) throw new Error();
      setState("open");
    } catch {
      setError(true);
      setEntry("");
    } finally {
      setSubmitting(false);
    }
  }

  if (state === "open") return <>{children}</>;
  if (state === "checking") {
    return (
      <div className="h-dvh grid place-items-center">
        <p className="font-sans text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col items-center justify-center gap-6 px-6">
      <Button
        variant="outline"
        asChild
        className="fixed top-4 right-4 z-50 h-11 px-5 gap-2 text-base rounded-pill"
      >
        <Link href="/">
          <House className="size-5" />
          {ADMIN_COPY.homeLabel}
        </Link>
      </Button>

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
          maxLength={8}
          value={entry}
          onChange={(e) => {
            setEntry(e.target.value.replace(/\D/g, ""));
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
        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-12 rounded-pill"
        >
          Unlock
        </Button>
      </form>
    </div>
  );
}
