# `components.json` — annotated reference

shadcn/ui's config file. The CLI reads it every time you run
`pnpm dlx shadcn@latest add <component>` to know **where** to put files,
**what style** to pull from, and **which imports** to generate.

JSON itself doesn't allow comments, and shadcn's CLI uses strict JSON
parsing — that's why this documentation lives in a sidecar instead of
inline comments.

---

## Field-by-field

### `$schema`
JSON Schema URL for IDE autocomplete and validation in editors that support
it (VS Code does, out of the box).

### `style`
Which design preset to pull components from.
- `"radix-nova"` — modern preset (smaller radii, OKLCH-friendly). What we use.
- `"new-york"` — classic shadcn look.
- `"default"` — older default.

Rarely worth changing once you have a few components installed; variants
and class names differ between styles.

### `rsc`
React Server Components support.
- `true` — generated files use `"use client"` only where needed (Next.js App Router).
- `false` — emit plain client components.

### `tsx`
- `true` — output `.tsx` (TypeScript).
- `false` — output `.jsx`.

### `tailwind`

#### `tailwind.config`
Path to `tailwind.config.{js,ts}`. Empty (`""`) because Tailwind v4 has no
config file — theme tokens live in CSS via `@theme inline` in
`app/globals.css`.

#### `tailwind.css`
Where `shadcn init` injects its CSS variables. Must match the actual
globals.css path or `shadcn init` writes to the wrong place. Future
re-runs read this to know where your theme lives.

#### `tailwind.baseColor`
Default palette **if** `cssVariables` is false. Ignored in our setup since
we override every shadcn token with our garden-bouquet theme.
Options: `slate` / `gray` / `zinc` / `neutral` / `stone`.

#### `tailwind.cssVariables`
- `true` — components reference CSS variables (`--primary`, `--background`,
  etc.) so our theme files can override them.
- `false` — components hardcode hex colors and our theme work is bypassed.

**Never flip this to false.**

#### `tailwind.prefix`
Optional class prefix (e.g. `"tw-bg-primary"` instead of `"bg-primary"`).
Empty = no prefix, the standard.

### `iconLibrary`
Icon library used by components that include icons (Dialog's close X,
DropdownMenu chevrons, etc.).
- `"lucide"` — shadcn default. We use this.
- `"radix-icons"` — alternative.

### `rtl`
Right-to-left language support. `false` — we're English-only.

### `aliases`
Path aliases the CLI uses when generating import statements in new
components. These must match `tsconfig.json`'s `paths` config (which maps
`@/*` to `./*`).

| Key | Path | What lands here |
|---|---|---|
| `components` | `@/components` | Business-logic components (WizardShell, NameSearch, etc.) |
| `utils`      | `@/lib/utils`  | The `cn()` class-merging helper |
| `ui`         | `@/components/ui` | shadcn-managed primitives (Button, Dialog, etc.) |
| `lib`        | `@/lib`        | Non-UI helpers (data, attendance, search) |
| `hooks`      | `@/hooks`      | React hooks (created lazily, e.g. `use-mobile`) |

### `menuColor`
Color preset for Dropdown/ContextMenu primitives. `"default"` keeps them
neutral-toned.

### `menuAccent`
Hover/active emphasis on menu items.
- `"subtle"` — quiet hover backgrounds.
- `"default"` — bolder.

### `registries`
Third-party component registries beyond shadcn's official one. Empty =
only use https://ui.shadcn.com. Add entries here to pull from community
registries (e.g. magicui, aceternity).

---

## When to edit this file

| Change | Field |
|---|---|
| Reorganize folder structure | `aliases.*` |
| Switch icon library | `iconLibrary` |
| Add a community component registry | `registries` |
| Move globals.css somewhere else | `tailwind.css` |

## When NOT to edit this file

- `style` — changes after install would create inconsistency across components
- `cssVariables` — flipping to false breaks our theme
- `rsc` / `tsx` — set once at project start

Think of this file like `.eslintrc` or `tsconfig.json` — config the tooling
reads but you rarely touch after initial setup.
