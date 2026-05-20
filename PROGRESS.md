# SitWhereAh — Progress

Tick each session as it's done. Add a one-line note (date + what was decided/skipped).

## Milestone 0 — Foundations
- [x] Session 1 — Project scaffold + Claude memory  *(2026-04-28 — Next 16, React 19, Tailwind v4, Turbopack)*
- [x] Session 2 — Theme architecture  *(2026-04-28 — Fraunces + DM Sans, garden-bouquet palette in 4 variants, /sandbox showcase)*
- [x] Session 3 — shadcn/ui setup + primitives  *(2026-04-28 — Button/Input/Card/Dialog; shadcn tokens shimmed onto our theme; components.json.md sidecar)*

## Milestone 1 — Data layer
- [x] Session 4 — CSV → typed data, build script  *(2026-04-28 — Zod schemas, PapaParse, tsx; predev/prebuild auto-regen lib/data.json)*
- [x] Session 5 — Attendance store with Dexie  *(2026-04-28 — IndexedDB via Dexie, useLiveQuery cross-tab sync; demo on /sandbox)*

## Milestone 2 — Wizard shell & Welcome (Screen 1)
- [x] Session 6 — Wizard shell + routing  *(2026-04-28 — 4 routes, Zustand store, idle-timer hook, Back/Home controls)*
- [x] Session 7 — Welcome layout + name input  *(2026-04-28 — equation layout, lib/content.ts with [input] convention, h-dvh locked viewport, responsive split. Theme parked: bride-1/bride-2/garden-electric all on the table, bride still deciding.)*
- [x] Session 8 — Fuzzy name search  *(2026-04-28 — Fuse.js multi-key search, useGuestSearch hook with debounce, NameSearch component wired to wizard store)*

## Milestone 3 — Transitions & Group (Screen 2)
- [x] Session 9 — Slide transitions with Framer Motion  *(2026-04-28 — enter-only slide via app/template.tsx, direction from Zustand store; AnimatePresence sidestepped due to App Router exit-anim limitations)*
- [x] Session 10 — Conditional routing to Group screen  *(2026-04-28 — lib/groups helpers, solo guests skip to /lunch, useRequireGuest guard)*
- [x] Session 11 — Group toggle UI + attendance write  *(2026-04-28 — color-circle selection per bouquet color, role=switch rows, markArrivedMany batch write)*

## Milestone 4 — Lunch seating map
(Consolidated from 4 sessions → 3 after solemnization was removed.)
- [ ] Session 12 — SeatingMap component + venue layout rendering
- [ ] Session 13 — Seat overlay, highlight your seat + arrived seats, SeatCallout
- [ ] Session 14 — Pinch-zoom, pan, polish

### Deferred — Path B: Figma SVG background
We chose Path A: the SeatingMap is generated purely from layout.csv (a clean
schematic diagram). Path B — compositing a Figma-designed venue SVG behind the
data-driven seat overlay — is deferred until the SVG asset exists. When ready:
drop the SVG in public/, add it as a background layer in SeatingMap, keep the
data-driven seat overlay on top. Path A does not block Path B.

## Milestone 5 — Admin
- [ ] Session 15 — Admin PIN gate + dashboard
- [ ] Session 16 — Export JSON + reset

## Milestone 6 — PWA & polish
- [ ] Session 17 — PWA shell with Serwist
- [ ] Session 18 — Visual polish
- [ ] Session 19 — Real data + dry run
