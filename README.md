# SitWhereAh — Wedding RSVP, Seating & Attendance

The full wedding journey in one app:

- **RSVP** (`/`) — guests respond months ahead via personal links
  (`/r/john-tan`): attendance, food choices, after-party. Backed by Supabase.
- **Day-of check-in** (`/checkin`) — guests sign in at the reception desk and
  see their seat on the map. Runs on any laptop/tablet.
- **Admin** (`/admin`) — RSVP totals, food counts, live attendance,
  guest-list editing.

See `CLAUDE.md` for architecture and `PROGRESS.md` for build status.

## One-time setup: Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Dashboard → **SQL Editor** → paste and run `supabase/schema.sql`.
3. Dashboard → **Project Settings → API keys**: copy the project **URL** and
   the **secret key** (`sb_secret_…`; called `service_role` on older
   dashboards) into `.env.local` (see `.env.example`). Not the
   publishable/anon key. Skip Supabase's Next.js quickstart entirely —
   it's for Supabase-Auth apps; this app uses server-side access only.
4. Seed the guest list: `pnpm seed:db`
   (idempotent; prints every generated personal RSVP link).

After seeding, the **database is the source of truth** for guests/groups —
edit via the admin page or Supabase's table editor. The CSVs remain the
initial authoring format only. `layout.csv` (the physical room) still uses
the build-time pipeline.

## Local development

```bash
pnpm install
cp .env.example .env.local   # fill in Supabase values
pnpm dev                     # http://localhost:3000
```

`pnpm dev` auto-runs `build:data` first (regenerates `lib/data.json` from the
CSVs in `data/`).

Useful scripts:

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server (data regenerated first) |
| `pnpm build` | Production build (data regenerated first) |
| `pnpm start` | Serve the production build locally |
| `pnpm build:data` | Regenerate `lib/data.json` from `data/*.csv` |
| `pnpm seed:db` | Seed/refresh Supabase from `data/guests.csv` (groups auto-derived) |
| `pnpm icons` | Regenerate PWA icons from `assets/icon-source.svg` |
| `pnpm lint` | ESLint |

## Editing the data

- **Guests / groups** — initially authored in `data/*.csv`, pushed to Supabase
  with `pnpm seed:db`. After that the database is the source of truth (admin
  page or Supabase table editor). Re-seeding preserves RSVP responses.
- **Room layout** — edit `data/layout.csv`, then `pnpm build:data`
  (or just restart `pnpm dev`). Validated on build; bad data fails loudly.
- **On-screen text** — everything guests read lives in `lib/content.ts`, each
  field tagged `[input]`. Find them all: `grep -rn "\[input\]" lib/content.ts`.
- **Theme / colors** — one `@import` line at the top of `app/globals.css`
  selects the active theme file from `themes/`.
- **Admin PIN** — `.env.local` (`NEXT_PUBLIC_ADMIN_PIN`, and
  `NEXT_PUBLIC_ADMIN_PIN_ENABLED=true|false` to require it). Restart the dev
  server after changing — `NEXT_PUBLIC_*` vars are baked in at build time.

---

## Deploying + installing on the iPad (the day-of setup)

The app is a **PWA** (Progressive Web App): once loaded over HTTPS, it can be
added to the iPad home screen and runs fullscreen and offline. iOS requires
HTTPS for this — so it must be deployed (or HTTPS-tunneled), not just run on
localhost.

### Step 1 — Deploy (one time, free)

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com), "Add New Project", import the repo.
   Vercel auto-detects Next.js and builds it.
3. **Set environment variables** in the Vercel project settings (Settings →
   Environment Variables) — `.env.local` is NOT committed, so add:
   - `SUPABASE_URL` = your project URL
   - `SUPABASE_SECRET_KEY` = the secret key (`sb_secret_…`)
   - `NEXT_PUBLIC_ADMIN_PIN_ENABLED` = `true` (or `false` to skip the PIN)
   - `NEXT_PUBLIC_ADMIN_PIN` = your 4-digit code (e.g. `0000`)
   Then redeploy so the vars take effect.
4. Vercel gives you an HTTPS URL, e.g. `https://sitwhereah.vercel.app`.

### Step 2 — Install on the iPad (Safari only)

> iOS gives no automatic install prompt — you must add it manually, and it
> **must be Safari** (Chrome/Firefox on iOS cannot install PWAs).

1. Open the deployed URL in **Safari** on the iPad.
2. Tap the **Share** button (square with an up-arrow).
3. Scroll down, tap **Add to Home Screen**, then **Add**.
4. The SitWhereAh icon appears on the home screen. Tap it — it opens
   fullscreen with no address bar.
5. **Open it once while online** so the service worker caches everything.
   After that it works with no internet.

### Step 3 — Lock it down for the reception desk (optional but recommended)

- **Disable auto-lock**: Settings → Display & Brightness → Auto-Lock → Never
  (so the screen doesn't sleep during the event).
- **Guided Access** (locks the iPad to just this app so guests can't wander
  off into other apps): Settings → Accessibility → Guided Access → On. Then
  open the app and triple-click the side/home button to start a session.
- **Rotation lock**: set the orientation you want in Control Center. The app
  works in both portrait and landscape, but locking avoids surprises.

### Android (backup / second station)

The same URL installs on Android too, and more easily: open it in Chrome and
tap the **Install** prompt that appears (or the install icon in the address
bar). Same app, same offline behavior — useful if you want a second check-in
tablet.

### Updating after deploy

Push changes to GitHub → Vercel rebuilds automatically. On the iPad, the
service worker picks up the new version on next launch while online (the
cache version is bumped in `public/sw.js` on meaningful changes). If an
installed app seems stale, close and reopen it while online.

---

## Backup & recovery (day-of safety)

Attendance lives only in the iPad's local storage (IndexedDB). To guard
against an accidental data wipe:

- **Admin dashboard** — the "Attendance" link (welcome screen) → PIN → dashboard.
- **Export** — downloads a JSON backup to the iPad's Files app. Do this
  mid-event and at the end.
- **Restore** — re-import that JSON if the iPad's data is lost (e.g. after a
  Safari data clear or reinstall). The guest list rebuilds from the code; the
  backup only restores who checked in.
