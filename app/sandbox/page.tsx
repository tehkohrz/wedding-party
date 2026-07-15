// Theme sandbox — every visual on this page is driven by tokens in the
// active theme file (see app/globals.css's @import line). To swap themes,
// change that one line — this page reflows automatically.

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { guests, groups, layout } from "@/lib/data";
import { AttendanceDemo } from "./attendance-demo";

export default function SandboxPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-14">
        {/* Hero */}
        <section className="space-y-3">
          <h1 className="font-display text-6xl leading-tight">
            A garden party in bloom
          </h1>
          <p className="font-sans text-lg text-muted-foreground max-w-2xl">
            Theme sandbox. Swap the <code className="bg-muted px-1.5 py-0.5 rounded">@import</code> line
            in <code className="bg-muted px-1.5 py-0.5 rounded">app/globals.css</code> and watch every
            element on this page change without touching any component code.
          </p>
        </section>

        {/* Primary actions */}
        <section className="space-y-4">
          <h2 className="font-display text-3xl">Primary actions</h2>
          <div className="flex flex-wrap gap-3">
            <button className="bg-primary text-primary-foreground rounded-pill px-6 py-3 font-sans font-medium hover:opacity-90 transition">
              Find my seat
            </button>
            <button className="bg-surface text-foreground border border-muted rounded-pill px-6 py-3 font-sans font-medium hover:bg-muted transition">
              View map
            </button>
          </div>
        </section>

        {/* shadcn primitives */}
        <section className="space-y-4">
          <h2 className="font-display text-3xl">shadcn primitives</h2>
          <p className="font-sans text-muted-foreground">
            Button, Input, Card, Dialog — all reading our theme tokens.
            No theme-specific code in any of them.
          </p>

          {/* Button variants */}
          <div className="flex flex-wrap gap-2 items-center">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>

          {/* Input */}
          <div className="max-w-sm">
            <Input placeholder="Enter your name..." />
          </div>

          {/* Card */}
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="font-display text-2xl">Tan Family</CardTitle>
              <CardDescription>4 guests · Row 1, Section A</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-sans text-sm">
                John, Jane, Bobby, Lucy. All seated together.
              </p>
            </CardContent>
          </Card>

          {/* Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">
                  Are these guests with you?
                </DialogTitle>
                <DialogDescription>
                  Sample dialog so you can see how popovers/modals theme up.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost">Cancel</Button>
                <Button>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>

        {/* The bouquet */}
        <section className="space-y-4">
          <h2 className="font-display text-3xl">The bouquet</h2>
          <p className="font-sans text-muted-foreground">
            Six accent colors used contextually — group cards, map sections, decorative flourishes.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Swatch name="Rose" token="--rose" className="bg-rose" />
            <Swatch name="Marigold" token="--marigold" className="bg-marigold" />
            <Swatch name="Lavender" token="--lavender" className="bg-lavender" />
            <Swatch name="Sage" token="--sage" className="bg-sage" />
            <Swatch name="Sky" token="--sky" className="bg-sky" />
            <Swatch name="Peach" token="--peach" className="bg-peach" />
          </div>
        </section>

        {/* Surfaces */}
        <section className="space-y-4">
          <h2 className="font-display text-3xl">Surfaces</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-card p-6 bg-background border border-muted">
              <div className="font-display text-xl">Background</div>
              <div className="font-sans text-sm text-muted-foreground mt-1">
                page canvas
              </div>
            </div>
            <div className="rounded-card p-6 bg-surface border border-muted">
              <div className="font-display text-xl">Surface</div>
              <div className="font-sans text-sm text-muted-foreground mt-1">
                cards, popovers, dialogs
              </div>
            </div>
            <div className="rounded-card p-6 bg-muted">
              <div className="font-display text-xl">Muted</div>
              <div className="font-sans text-sm text-muted-foreground mt-1">
                subtle backdrops, code chips
              </div>
            </div>
          </div>
        </section>

        {/* Status */}
        <section className="space-y-4">
          <h2 className="font-display text-3xl">Attendance status</h2>
          <div className="flex gap-3">
            <span className="bg-arrived text-white rounded-pill px-4 py-1.5 font-sans text-sm font-medium">
              Arrived
            </span>
            <span className="bg-pending text-foreground/70 rounded-pill px-4 py-1.5 font-sans text-sm font-medium">
              Pending
            </span>
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-4">
          <h2 className="font-display text-3xl">Typography</h2>
          <div className="space-y-2">
            <p className="font-display text-5xl">
              Fraunces &mdash; the display
            </p>
            <p className="font-display text-3xl text-muted-foreground italic">
              Lighter weight italic for sub-headers
            </p>
            <p className="font-sans text-base">
              DM Sans &mdash; the body. The quick brown fox jumps over the lazy dog.
              0123456789 &amp; punctuation: , . ! ? &ldquo;quotes&rdquo;.
            </p>
            <p className="font-sans text-sm text-muted-foreground">
              Smaller muted body text for secondary information.
            </p>
          </div>
        </section>

        {/* Data layer demo */}
        <section className="space-y-4">
          <h2 className="font-display text-3xl">Data layer</h2>
          <p className="font-sans text-muted-foreground">
            Imported from <code className="bg-muted px-1.5 py-0.5 rounded">@/lib/data</code>,
            generated by <code className="bg-muted px-1.5 py-0.5 rounded">pnpm build:data</code> from the CSVs.
            Fully typed — hover any property in your editor.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-2xl">
                  {guests.length} guests
                </CardTitle>
                <CardDescription>
                  {guests.filter((g) => g.seating_group_id).length} grouped ·{" "}
                  {guests.filter((g) => !g.seating_group_id).length} solo
                </CardDescription>
              </CardHeader>
              <CardContent className="font-sans text-sm space-y-1">
                {guests.slice(0, 3).map((g) => (
                  <div key={g.id}>
                    {g.name}{" "}
                    <span className="text-muted-foreground">
                      · {g.side} · Row {g.row} Seat {g.seat}
                    </span>
                  </div>
                ))}
                <div className="text-muted-foreground">…</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display text-2xl">
                  {groups.length} groups
                </CardTitle>
                <CardDescription>guests checking in together</CardDescription>
              </CardHeader>
              <CardContent className="font-sans text-sm space-y-1">
                {groups.map((g) => (
                  <div key={g.id}>{g.label}</div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display text-2xl">
                  {layout.length} sections
                </CardTitle>
                <CardDescription>lunch seating sections</CardDescription>
              </CardHeader>
              <CardContent className="font-sans text-sm space-y-1">
                {layout.slice(0, 3).map((l) => (
                  <div key={`${l.row}-${l.section}`}>{l.label}</div>
                ))}
                <div className="text-muted-foreground">…</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Attendance store */}
        <section className="space-y-4">
          <h2 className="font-display text-3xl">Attendance store</h2>
          <p className="font-sans text-muted-foreground">
            Backed by IndexedDB via Dexie. Marks persist across refreshes
            and sync between tabs via useLiveQuery.
          </p>
          <AttendanceDemo />
        </section>

        {/* Footer note */}
        <section className="pt-6 border-t border-muted">
          <p className="font-sans text-sm text-muted-foreground">
            Active theme: see the{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded">@import</code>
            {" "}line at the top of{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded">app/globals.css</code>.
          </p>
        </section>
      </div>
    </main>
  );
}

function Swatch({
  name,
  token,
  className,
}: {
  name: string;
  token: string;
  className: string;
}) {
  return (
    <div className={`rounded-card p-6 ${className}`}>
      <div className="font-display text-xl text-foreground">{name}</div>
      <div className="font-sans text-sm text-foreground/70 mt-1">{token}</div>
    </div>
  );
}
