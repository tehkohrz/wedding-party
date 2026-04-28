@AGENTS.md

# SitWhereAh — Wedding Seating & Attendance App

## Project goal

A single-purpose PWA for the wedding reception desk: guests walk up to an iPad, type their name, and step through a 4-screen wizard that shows their solemnization seat, then their lunch seat. The same action marks them arrived. Admin glances at totals on the same iPad.

**Constraints:** ~100 guests max, single iPad, no backend, reliable WiFi (but resilient to drops), nice visuals matter, all data seeded from CSV ahead of time (no live editing).

The full plan lives at `~/.claude/plans/i-would-like-to-wiggly-brooks.md` — read it for details on screens, data model, theme architecture, session breakdown.

## Tech stack

- **Next.js 16** (App Router, Turbopack) + TypeScript — but see `AGENTS.md`: this Next.js has breaking changes from training data, consult `node_modules/next/dist/docs/` before writing routing/data code.
- **Tailwind CSS v4** — utility classes only, semantic tokens (no raw colors in components).
- **shadcn/ui** — copied components, themed via CSS variables.
- **Framer Motion** — slide transitions between wizard screens.
- **Fuse.js** — fuzzy name search.
- **Dexie.js** — IndexedDB wrapper for attendance state.
- **PapaParse + Zod** — build-time CSV parsing with runtime validation.
- **Serwist** — PWA service worker, iPad install.

## Conventions

- **Semantic Tailwind only.** Components write `bg-primary text-primary-fg font-display rounded-card`. Never `bg-amber-200`. Color/font/radius live as CSS variables in `app/globals.css`.
- **CSV is source of truth.** Don't hand-edit `lib/data.json`; edit `data/*.csv` and let `scripts/build-data.ts` regenerate it.
- **One commit per session.** Tick `PROGRESS.md` and commit at the end of each session.
- **Theme experiments are CSS-only.** Swapping themes must never require touching component code.

## Where to look first

- `PROGRESS.md` — current session and what's done.
- `data/*.csv` — guests, groups, layout (when they exist).
- `lib/data.types.ts` — generated types for guest/layout data.
- `themes/*.css` — design tokens to experiment with.
- `app/globals.css` — active theme variables.

## User context

- I'm new to Next.js, Tailwind, and React's modern conventions.
- Explain concepts the first time they're introduced — link to docs when useful.
- Favor small, complete sessions over long sprawling rewrites.
- Sessions run 30–60 min; each ends in a working state.
- I work on this over many days, so be self-contained: don't assume prior conversation context.
