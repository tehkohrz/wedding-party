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
- [x] Session 12 — SeatingMap component + venue layout rendering  *(2026-04-28 — Path A schematic from layout.csv, multi-color highlights with arrived/pending states, name boxes per member, /find lookup mode added (browse-only))*
- [x] Session 13 — Seat overlay, highlight, polish + interactions  *(2026-04-28 — pulse on this-round seats (5s), tap-a-seat popover, /find lookup shows full map, this-round vs arrived state split, standby taupe color, sky-blue buttons, seat/input visibility. Zoom/pan built but default OFF.)*
- [ ] Session 14 — (mostly absorbed into S13) leftover polish if testing surfaces any

### Deferred — Path B: Figma SVG background
We chose Path A: the SeatingMap is generated purely from layout.csv (a clean
schematic diagram). Path B — compositing a Figma-designed venue SVG behind the
data-driven seat overlay — is deferred until the SVG asset exists. When ready:
drop the SVG in public/, add it as a background layer in SeatingMap, keep the
data-driven seat overlay on top. Path A does not block Path B.

## Milestone 5 — Admin
- [x] Session 15 — Admin PIN gate + dashboard  *(2026-04-28 — /admin route, optional PIN gate (NEXT_PUBLIC toggle), live stats + bride/groom split, name filter + All/Arrived/Pending tabs, manual mark/unmark override, "Attendance" entry link)*
- [x] Session 16 — Export JSON + restore + reset  *(2026-04-28 — Blob download backup, Zod-validated restore from file, transaction replace, dialog confirms; fixed missing --popover/--card tokens)*

## Milestone 6 — PWA & polish
- [x] Session 17 — PWA shell (offline + installable)  *(2026-04-28 — manifest, generated placeholder icons (pnpm icons), hand-written runtime-cache service worker + registrar, Apple/kiosk viewport meta, README install docs. Chose hand-rolled SW over Serwist for Next16/Turbopack robustness.)*
- [x] Session 18 — Visual polish  *(2026-04-28 — confetti on check-in (4 upward emitters, slowed floaty physics, hue-normalized vivid colors), staggered entrances (equation, search results, group rows, lunch name boxes), color-circle spring pop, global button press feedback, prefers-reduced-motion throughout, larger wizard Back/Home buttons, admin Home button (far-right, labeled). Also fixed the dev service-worker caching trap: sw.js now self-destructs on localhost.)*
- [ ] Session 19 — Real data + dry run  *(remaining: deploy to GitHub+Vercel, drop in real guest CSV, gather real assets, rehearse with a few people)*

---

# v2 — RSVP + Hosted Database

Full plan: `~/.claude/plans/i-would-like-to-wiggly-brooks.md`. Key decisions:
Supabase (DB) + Vercel (hosting); day-of check-in online-only multi-device;
name-slug personal links (`/r/john-tan`, one per guest, resolving to the
group); RSVP editable until deadline; seats assigned after RSVP closes;
single atomic submit with sessionStorage draft.

- [x] Stage 0 — Foundations  *(2026-07 — schema.sql, seed-db (name slugs, groups derived from guests.csv — no groups.csv), lib/db (SUPABASE_SECRET_KEY), /api/guests + /api/rsvp/[slug], check-in moved to /checkin/*, real 93-guest list imported with is_kid, Node 22 via .nvmrc. Vercel deploy still pending.)*
- [x] Stage 1 — RSVP entry  *(2026-07 — PhotoSlideshow (public/photos/ + RSVP_COPY.photos), landing with DB-backed name search → /r/[slug], personal page greets link guest, /api/rsvp-directory, EventCountdown under the date. Seeded + smoke-tested live.)*
- [ ] Stage 2 — Attendance step + decline path (RSVP stepper, progress dots)
- [x] Stage 3 — Menu + per-attendee food choices + dietary comments  *(2026-07 — MENU const (2 mains, images optional), StepMenu with per-attending selectors + dietary comments, kids note)*
- [ ] Stage 4 — After-party, summary/confirm, atomic submit, edit-until-deadline
- [ ] Stage 5 — Admin v2: server-side PIN, RSVP overview tab, guest CRUD,
      link export CSV
- [ ] Stage 6 — Day-of check-in on the database (retire Dexie)
- [ ] Stage 7 — Hardening + full dry run

---

## Art & asset tasks (before the app is "done")

Everything visual currently uses a placeholder. Swap these before the event:

- [ ] **App icon** — replace `assets/icon-source.svg` (keep 512×512 square) with
      real artwork, then run `pnpm icons` to regenerate all PNG sizes in
      `public/icons/`. Also update the two brand colors if the art changes:
      `background_color`/`theme_color` in `public/manifest.webmanifest`, the
      `themeColor` in `app/layout.tsx`, and the `#1FA6EB` background in
      `scripts/generate-icons.mjs` (maskable padding).
- [ ] **Couple photo** — drop a real photo into `public/` (e.g. `couple.jpg`)
      and wire it into `<PhotoSide>` in `app/page.tsx` (instructions are in the
      comment there). Currently a gradient placeholder.
- [ ] **Welcome flourish** — the top-left corner uses a Lucide `Flower2` icon
      as a placeholder (`app/page.tsx`). Swap for a custom floral SVG if wanted.
- [ ] **Final theme/palette** — bride still deciding between bride-1 / bride-2 /
      garden-electric (see `app/globals.css` @import line). Lock before the day.
- [ ] **(Optional) Figma venue SVG** — Path B in Milestone 4: a drawn venue
      background behind the schematic seat map. Only if the schematic isn't
      enough. See the "Deferred — Path B" note in Milestone 4.
- [ ] **(Optional) Fraunces "J" glyph** — the display font's capital J has a big
      descender that looked odd at hero size; parked. Swap the display font in
      `app/layout.tsx` if it bothers you (Playfair Display / Cormorant / DM Serif
      Display are drop-in candidates).
- [ ] **Favicon** — currently the default Next.js favicon (`app/favicon.ico`).
      Replace with something on-brand.

## Future considerations (not yet scheduled)

Ideas that came up during build but haven't been slotted into a session.

### Pre-event messaging (originally from the plan)
Send each guest a personalized message before the event with their seat info,
so the iPad is a backup rather than a bottleneck. Channels: WhatsApp (most
likely for SG), SMS via Twilio, or email. Implementation: a one-off Node
script (`scripts/send-invitations.ts`) that reads `guests.csv` + a message
template and either writes a CSV for bulk-send tooling or calls a service API.
Data implication: add `phone` / `email` columns to `guests.csv`.

### iPad on-screen keyboard accommodation
When the iOS soft keyboard opens, it covers ~40% of the screen (portrait) /
~30% (landscape). We already use `h-dvh` everywhere (dynamic viewport),
which means pages auto-shrink to fit the visible area instead of letting
content slide under the keyboard. That's the foundational fix and it's done.

The Welcome screen is the one place this might still look rough on a real
device — the stacked equation (`text-7xl × 5 lines`: brideName / + / groomName
/ = / unionWord) plus the date/greeting/input is a lot of vertical content
inside a centered flex column. When `h-dvh` shrinks to make room for the
keyboard, the centered content gets compressed and may clip at the edges
because of `overflow-hidden`.

**Fixes to consider when testing on a real iPad reveals it's actually a
problem (not before):**
- Anchor form-side content with `justify-start` instead of `justify-center`
  so the input stays at the top above the keyboard (cheap, robust)
- Use the `visualViewport` API to detect keyboard height and shrink the
  equation font sizes conditionally (more elegant, more code)
- Switch to `overflow-y-auto` on the form side so users can scroll within
  the squeezed area (less elegant but bulletproof)

Other keyboard quirks worth verifying on real hardware:
- Inputs are already 18px (`text-lg`), so no auto-zoom triggers
- `type="search"` shows a Search keyboard return key — currently does
  nothing on Enter; could wire to "select top fuzzy match" if desired
- PWA standalone mode (after Add to Home Screen) behaves differently from
  Safari browser tab — test both
- Split/floating keyboard on iPad is reported correctly by `visualViewport`
- Hard refresh while focused → check no weirdness

### Photo capture during check-in
Allow guests to take a photo of themselves as part of the check-in flow —
a keepsake and a potential live photo wall element. Open design questions:
- **Where in the flow?** After Confirm on the group screen, before /lunch?
  Or on /lunch as an optional action? Probably the former so it feels like
  part of the act of arriving.
- **One photo per group, or one per person?** Per group is faster (one tap
  for the whole party); per person captures everyone individually but adds
  taps when the group is large.
- **Storage**:
  - **Browser-only (IndexedDB)**: photos live on the iPad. Limit ~50–100 MB
    practical before quota nags. Add an `AttendanceRecord.photo_blob` field
    or a sibling `photos` table in Dexie. Zero infra.
  - **Cloud storage (Cloudinary / Supabase Storage / S3 + CDN)**: photos
    leave the iPad immediately. Survives iPad data wipe. Needs network and
    accounts. Suits a live photo wall scenario.
  - **Hybrid**: capture local, sync opportunistically when online.
- **Capture surface**: `<input type="file" accept="image/*" capture="user">`
  is the cheap option (opens the native camera UI on iOS). For more control,
  `getUserMedia` + a custom preview. iOS PWA standalone mode supports both.
- **Privacy**: every guest should be able to skip. Make the photo step
  optional with a clear "No thanks" path.
- **Admin export**: if photos live locally, the JSON export feature
  (Session 16) becomes more important — admin should be able to dump
  photos to the iPad's Files app before the day ends.

Implementation effort estimate: ~2–3 sessions when ready (capture UI,
storage layer, admin export of photo data).
