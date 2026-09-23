---
IMPORTANT: File is read fresh for every conversation. Be brief and practical.
project_type: nextjs-single-app
version: 1.0.0
last_updated: 2026-09-19
---

# AST Studio — Art Supply Tracker

Full clone of the Art Supply Tracker artist beta (studiobeta.artsupplytracker.com):
a studio assistant for artists — projects, supplies, inspiration feed, and
community chat — rebuilt from the original Vite/Amplify SPA onto a single
Next.js 16 route with Prisma + SQLite and Server Actions.

**Stack**: Bun · Next.js 16.1.3 (App Router) · React 19.2.3 · TypeScript 5.9.3
(strict) · Tailwind CSS 4.1.18 (CSS-first `@theme`) · shadcn/ui + Radix ·
Prisma 6.19.2 + SQLite · Zod 4.3.5 · ESLint 9.

## Foundational Principles

### Workflow for all implementation tasks

1. **ANALYZE** — read the relevant component/action and
   `Project_Architecture_Document.md` §3–§6 before writing. Identify which
   seam owns the change (action, DTO, domain constant, or view).
2. **PLAN** — smallest correct path; name the files touched.
3. **VALIDATE** — anything touching auth, validation schemas, or the
   export/import payload shape needs a second look before coding.
4. **IMPLEMENT** — typed increments; Zod schemas and DTOs updated in the same
   change as the action; UI reads DTOs only.
5. **VERIFY** — `bun run lint && bun run typecheck && bun run test`, then browser-test the
   affected golden path. Claims of "works" require executed evidence.
6. **DELIVER** — note what was verified, what was not, and any deferred work.

### Project-specific principles

- **The server is the source of truth.** First-paint data comes from the RSC
  render; every mutation re-derives state from the action's typed result.
  No client-side copies of authoritative data beyond React state.
- **Nothing throws across the action boundary.** Actions return
  `ActionResult<T>`; unexpected failures are logged with context
  (`console.error("[area:op] failed", { … })`) and flattened to a safe
  `INTERNAL` error — operator detail never reaches the client DOM.
- **Validate at the boundary, trust the types inside.** Every action input is
  parsed by a Zod schema in `src/lib/validation.ts`; the vocabulary lists in
  `src/lib/studio-domain.ts` are the single source for statuses, categories,
  types, and conditions.
- **Faithful-by-default UI.** The clone's contract is visual + behavioral
  parity with the original beta, including its honest placeholders (Partner
  Spotlight, Inspire Me "coming soon"). Don't "improve" copy that was cloned
  deliberately.

## Implementation Standards

### TypeScript (strict, enforced)

- `strict` is on; avoid `any` — use `unknown` and parse with Zod.
- Prefer `interface` for object shapes, `type` for unions.
- Client components receive DTO types from `src/lib/dto.ts` — never Prisma
  row types.

### Next.js 16 specifics

- Single route: everything renders from `src/app/page.tsx` (async server
  component → `LoginScreen` or `StudioApp`). View switching is client state.
  Do not add routes; the deployment contract exposes one route.
- `cookies()` is async — always `await` (see `src/lib/auth.ts`).
- Page files export only `default` + `metadata`/`generateMetadata`/
  `revalidate`/`dynamic`; extra exports fail the build.
- Mutations via Server Actions in `src/actions/*` — never route handlers for
  UI (the `/api` health probe is the only handler).
- `page.tsx` is `force-dynamic` (session-dependent); keep it that way.

### Tailwind v4 (CSS-first)

- Tokens live in the `@theme` block of `src/app/globals.css` — literal hex
  values only (`var()` chains are dropped by the build; `--font-sans` is the
  sole sanctioned var() reference). No `tailwind.config.js` exists; don't add
  one.
- The `skills/` folder AND every committed `.md` file are excluded from
  automatic content detection: globals.css carries `@source not
  "../../skills";` (r19) and `@source not "../../**/*.md";` (r22). TW4
  scans every non-gitignored file — the skills corpus's docs carry
  class-like strings that compile into the app's CSS as dead rules
  (measured: a 37% stylesheet inflation and skills-sourced selection
  rules), and the session records themselves quote prior rounds' stripped
  tokens EVERY round (the regression class measured three times:
  r21's own docs, then session_37.md, then session_38.md). Documentation
  is not a render surface — the r23 audited build diff verified the .md
  exclusion drops only dead weight (nine dead rules + ten dead var
  emissions, every one verified consumerless; every rendered utility
  compiles from a literal class string in src). Don't remove either
  directive; `css-hygiene.test.ts` pins the exact exclusion list.
  Likewise: no `::selection` or `caret-color` authoring anywhere — the
  live authors zero of either — and ZERO forced-colors rules (r20): the
  TW4 forced-colors-aware transparent-outline utility is the only emitter
  of forced-colors media blocks; its scaffold tokens were stripped (six
  dead rules; the live's CSSOM carries none). Do not re-introduce the
  token anywhere under src/ (pinned by `css-hygiene.test.ts`). Keep
  referring to stripped tokens descriptively in documentation anyway —
  the docs-token pin scans every repo .md for the guarded families and
  must stay green (defense in depth + documentation hygiene).
- The Tailwind DEFAULT palette is pinned to the live's v3 values (r14):
  `--color-pink-200/300/400/500`, `--color-cyan-400`, and
  `--color-blue-400/500` in the `@theme` block carry the live's TW3 hex
  values, because TW4's re-derived oklch palette drifts (up to 34/channel).
  Default-family classes (`border-pink-400/60` etc.) are SAFE to use and
  match the live DOM's class strings verbatim — do not convert them to
  literals, and pin any NEW default family before using it.
- The hover variant is overridden to the live's semantics:
  `@custom-variant hover (&:hover);` (r13) — the live's Tailwind v3 has no
  `@media (hover: hover)` guard, so its hover tints apply (and stick) on
  touch devices. Do not remove the override; paired screenshot captures
  must park the pointer neutrally now that clone hovers render.
- The app is permanently dark — shadcn semantic tokens are pinned to the AST
  dark palette in the same `@theme` block. No `.dark` toggling.
- Use the `ast-*` palette classes (`text-ast-lavender`, `border-ast-purple/35`,
  `bg-[#120724]` cards, `bg-[#050009]` canvas) — match the token table in
  README rather than inventing new colors. Two sanctioned literal-color
  exceptions come from the live app's own non-utility CSS: the login card's
  `border-[#5B3FD3]` (its custom CSS) and the header memory button's
  hyphen-family values (idle border `border-[#5b3fd3]/30`, hover trio
  `#f4f27a` — the live's `:root` variables, its only hyphenated-utility
  consumer).

### Data layer (Prisma + SQLite)

- Schema: `prisma/schema.prisma`. After edits: `bun run db:push` (dev) —
  there are no migration files; the schema is the migration.
- SQLite has no enums: string fields validated by Zod against
  `studio-domain.ts` lists (category tokens are the live app's singular
  values — Paint/Brush/…; conditions are ok/low/critical — and
  `Supply.condition` is NULLABLE: null is the live's ABSENT status, see
  AGENTS.md's Zod-boundary invariant). Add new vocabulary there first.
- Photos are JSON-encoded data-URL arrays on `Project.photos` / a single
  data URL on `Supply.photo` — client downscales to ≤ 1024px JPEG q0.8,
  ≤ 300 KB encoded; the server cap is `MAX_PHOTO_DATA_URL_LENGTH`
  (400,000 chars) enforced by every Zod schema that touches photos.
- Supply↔project assignment is stored as `Supply.assignedProjectId`
  (single membership — the supply modal's single-valued "Assign to Project"
  select); the export layer derives the live app's project-side
  `supplyIds` arrays from it.
- Seed is idempotent (existence-guarded per natural key). Rerunning
  `bun run db:seed` is always safe.

## Development Workflow

### Environment Setup

```bash
bun install
cp .env.example .env          # DATABASE_URL=file:../db/custom.db
bun run db:push               # create ./db/custom.db from the schema
bun run db:seed               # demo user + community content
bun run dev                   # http://localhost:3000
```

Demo account: `demo@artsupplytracker.com` / `StudioDemo2026!` (documented,
not secret — rotate before any public deployment).

### Build Commands

| Command | Purpose |
|---|---|
| `bun run dev` | Dev server :3000 |
| `bun run lint` / `typecheck` / `test` | ESLint / `tsc --noEmit` / Vitest |
| `bun run test:e2e` | Playwright E2E (boots its own dev server) |
| `bun run db:push` / `db:generate` / `db:seed` | Database lifecycle |
| `bun run build` / `start` | Standalone production build / serve |

### Testing Strategy

Vitest is configured (`vitest.config.ts`, node environment, `@/` alias,
`src/**/*.test.ts`). The suite (334 tests) pins:

- **The SQLite path contract** (`src/lib/db-path.test.ts`) — relative
  `file:` URLs resolve against `prisma/schema.prisma` (so
  `file:../db/custom.db` = `<repo>/db/custom.db`) regardless of the
  calling runtime or CWD; absolute and non-file URLs pass through
  unchanged (the action layer's throwaway temp DBs depend on that), and
  repo tooling prefers the repo's OWN `.env` over an inherited absolute
  `DATABASE_URL` (a workspace shell must not relocate the database).

- **Studio-domain vocabulary** — the per-category `SUPPLY_TYPE_LISTS` in the
  live app's tokens (Paint/Brush/Pastel/Paper/Canvas/Medium/Other categories,
  capitalized Paint subcategories, ok/low/critical conditions), the modal's
  picker option order, the NEW-badge window, quantity parsing (integers,
  decimals, a/b fractions) and the live's quantity FORMAT gate
  (`isValidQuantityInput`: empty is valid; unparseable text is not), the
  edit-panel budget mapping (unset → "0" in the form, blank → null on
  submit), and the two live unassigned-option strings (create vs edit
  surfaces).
- **Design tokens** (`design-tokens.test.ts`) — the `@theme` literal hex
  values, pinned to the live app's *compiled utility classes* (the rendered
  ground truth): purple `#5a3a8e`, yellow `#ffd5a8`, coral `#ff7a7a` plus
  the six glow shadows, the Tailwind-v3 radius scale (rounded-sm/md/lg/xl
  = 2/6/8/12px), and the zero-webfont `--font-sans` stack (the live ships
  no webfont; a re-introduced `next/font` re-wraps text). The live `:root`
  CSS-variable block carries three different (vestigial) values — never
  align to it.
- **Live style maps** (`studio-domain.test.ts`) — the production bundle's
  stock-filter switch ("Low Stock" matches low AND critical; "Out of Stock"
  critical only) and the `jz`/`Mz`/`Jz` status-pill/chip/condition maps,
  extracted verbatim from the deployed JS and re-measured on the live DOM
  (r11: the condition maps carry the two-state contract — absent/null →
  the "?" pill + unlabeled ⚠️ glyph; explicit "ok" → the cyan "OK" pill +
  "✓ ok" icon), so chips and pills cannot drift from the live rendering.
- **Supply-surface fidelity** (`supply-fidelity.test.ts`) — file-content
  pins on the live's measured supply contracts (r11): the create modal's
  INERT Stock Status select (submits `condition: null`), the quantity
  format gate's exact "Enter a valid quantity, like 2, 1.5, or 1/2" copy,
  the edit panel's `?? "ok"` condition init, the chip's unconditional
  "qty" label, and the detail panel's raw (blank-when-empty) quantity
  value — so the measured quirks cannot be silently "fixed".
- **Boundary contracts** (`validation.test.ts`) — photo data-URL caps
  (client 300 KB ↔ server 400k chars), the Other/Custom free-form
  subcategory flow (live parity: the pickers are the vocabulary guard, the
  schema enforces type/trim/length), the import schema's acceptance of
  the live wire shape, the Cognito password-policy rules
  (`passwordPolicyViolations`: every violated rule reported independently,
  in the live's exact copy), the server-side sign-up policy mirror, the
  permissive sign-in schema (a short password submits and fails with
  "Incorrect username or password." — exactly the live behavior), and the
  supply boundary's two-state condition (null = absent, defaulting) plus
  the quantity format gate (empty valid; unparseable text rejected with
  the live's exact copy).
- **Wire format** (`export-payload.test.ts`) — the export payload's exact
  field set (`title`, `subcategory`, `supplyIds`, the three-slot quantity
  semantics — `qty:""` when empty, `quantity:null` for fractions, the
  fraction-aware `quantityValue` — `isNew`, status omitted when ABSENT
  but emitted when explicit, unset `budget`/`barcode` as `""`,
  `imageUrl: null`) and the import normalizer's handling of both live and
  legacy clone shapes, including relation remapping and the empty-qty /
  explicit-ok round-trip verified against the live's own import.
- **Import gate** (`validation.test.ts` + `studio.test.ts`) —
  `normalizedImportPayloadSchema` rejects out-of-vocabulary categories and
  statuses, oversized arrays (500 projects / 1000 supplies), over-length
  strings, and oversized photo payloads; the action layer refuses to store
  them and rolls the studio back when a row fails mid-import (the whole
  restore is one interactive transaction). The delete path follows the
  same atomicity discipline — a mid-delete failure must not strand
  supplies on a still-existing project (pinned by a failure-injection
  test).
- **Rate limiting** (`rate-limit.test.ts`) — fixed-window allow/block,
  rollover, per-key isolation, cooldown reporting, bounded memory.
- **Inspiration detail** — schema acceptance, corrupt-JSON degradation to
  null, today-entry selection, and the rail section resolver
  (`resolveInspirationFocus`: "art-history-today" → the pickToday entry,
  "partner" → the first partner, "spotlight-<id>" only when a seeded
  spotlight carries it, and the live's inert "quote" /
  "spotlight-kevin-lewis" sections resolving to no panel — pinned
  quirks).
- **Seed fidelity** (`seed-fidelity.test.ts`) — the seeded community chat
  mirrors the live app's five messages byte-for-byte, the live author's
  own typos ("KIm", "brower") included; the corrected spellings are
  asserted absent so the demo studio cannot drift from the production
  rendering.
- **Login / header / chat-panel fidelity** (`login-fidelity.test.ts`,
  `chat-fidelity.test.ts`) — file-content pins on the live's measured
  DOM: the header logo's intrinsic 1068×269 dimensions with responsive
  classes (no inline style), the Amplify login chrome (equal-width tabs
  with the 2px gray/turquoise top strip, the eye toggle as the input's
  right segment with near-invisible `#0d1a26` icons, `#89949f` borders,
  `#9ca3af` placeholders, the invisible-typing `#0d1a26` input quirk, the
  mobile h1 leading 1.25), the two-tier error chrome (SERVER errors in the
  pale-pink `#FCE9E9` dismissible alert box with the exact warning/X SVG
  paths; CLIENT validation inline — the Cognito policy-rule stack and the
  mismatch line), the Reset Password confirmation view (Code * / New
  Password / Confirm / Submit / Resend Code; the invalid-code alert copy;
  no support notice), the content-width 35px link buttons, the
  native-validation attribute set, the sticky community header +
  scroll-container split (the sticky `top-4` displacement is load-bearing),
  and the absence of chat auto-scroll (the live has none).
- **Drawer-scrim fidelity** (`drawer-fidelity.test.ts`) — file-content pins
  on the live's measured mobile chrome: both drawer scrims render the
  live's shared `fixed inset-0 z-40 bg-black/60 md:hidden` shape — no
  backdrop blur (the page dims, never blurs), z-40 below the z-50
  drawers, and instant mount/unmount (the live's scrim unmounts at
  click-time while the drawer still animates out — no opacity fade).
- **Sidebar stat-tile fidelity** (`sidebar-tile-fidelity.test.ts`) —
  file-content pins on the live's measured tile contract (r12): the
  ACTIVE view's tile highlights with its OWN accent pair — electric
  blue (`border/bg` at `/60`–`/10`) for Projects and Supplies, LAVENDER
  for Inspo — dropping the `#120724` card background and hover classes
  while active; the inner text classes (label / value / sub) stay
  constant across both states; a negative pin rejects the old
  single-accent hardcode.
- **Header-button fidelity + hover semantics**
  (`header-button-fidelity.test.ts`) — file-content pins on the live's
  measured header button contract (r13): the memory button is the live's
  ONLY hyphenated-family consumer — idle border `border-[#5b3fd3]/30`,
  hover trio `hover:border-[#f4f27a]/70 hover:bg-[#f4f27a]/20
  hover:text-[#f4f27a]` as literal values (negative-pinned against the
  utility families — the r13-F1 bug), plus the
  `@custom-variant hover (&:hover);` override that restores the live's
  Tailwind-v3 plain-`:hover` semantics (r13-F2) and the corrected theme
  comment (the `:root` purple/yellow are NOT dead — the hyphenated
  families resolve them).
- **Default-palette pins** (in `design-tokens.test.ts`, r14) — the seven
  DEFAULT-family tokens (`pink-200/300/400/500`, `cyan-400`,
  `blue-400/500`) pinned to the live's Tailwind-v3 values with a negative
  pin on TW4's drift values, plus usage-site class-string pins (the Sign
  Out button, the memory button's text, the email gradient, the barcode
  focus trio, the chat alert) guarding the class-string parity contract.
- **Focus & keyboard-contract fidelity** (`focus-fidelity.test.ts`, r15) —
  file-content pins on the live's measured keyboard contract: NO authored
  outline color in the base layer (the UA-default focus ring renders,
  matching the live's no-outline-rule CSS), and the create modals carry
  no Escape keydown handler, no focus steal, and no window keydown
  listener — while KEEPING `role="dialog"` + `aria-modal` (the invisible
  semantics). Guards against a future "improvement" re-adding keyboard
  affordances the live does not have.
- **Motion-contract fidelity** (`motion-fidelity.test.ts`, r17) —
  file-content pins on the live's measured motion contract: NO entry
  animations — globals.css declares no `@keyframes`, no `.studio-fade`
  utility, and no `prefers-reduced-motion` guard (the live renders every
  studio surface instantly; its CSSOM keyframes are all Amplify-internal),
  and none of the thirteen surfaces that once carried the scaffold's
  studio-fade class reference it anymore. Positive pins keep the live's
  REAL motion (the drawers' `transition-transform duration-300` slide).
  Guards against a future "polish" re-adding mount animations the live
  does not have.
- **Landmark & reading-order fidelity** (`landmark-fidelity.test.ts`,
  r18) — file-content pins on the reading-order probe's measured
  contracts: the announcement order (header → sidebar → content → chat)
  is identical on both sides at both viewports; the closed drawers carry
  the `inert` + `aria-hidden` PAIR (the kept r5 improvement — the live's
  closed drawers carry NEITHER, so its mobile reading order announces
  the off-screen drawer content before the page; the r18 measurement
  corrected session_26's misattribution) with labeled drawer landmarks
  (`aria-label` "Studio tools" / "Community chat"); and the content pane
  is a single `<section>` under ONE `<main>` (the live's nested inner
  `<main>` and twin md-toggled content copies are accepted divergences —
  invisible in pixels and in the a11y tree). Guards against dropping
  either drawer attribute or introducing the twin-copy structure.
- **CSS compile hygiene** (`css-hygiene.test.ts`, r19, extended r22) —
  file-content pins on the compile-time exclusions and the
  selection/caret non-authoring measured on the live: globals.css
  carries `@source not "../../skills";` AND `@source not
  "../../**/*.md";` (Tailwind v4's automatic content detection scans
  every non-gitignored file — without the directives, the committed
  skills corpus and the session records' own token quotations leak
  class-like strings into the compiled CSS as dead rules; the markdown
  exclusion is the r22 systemic fix for the every-round recurrence, and
  the r23 audited build diff verified it drops only dead weight), the
  exclusion list is EXACTLY those two entries (a broader pattern would
  silently drop real utilities), and the app authors no `::selection`
  rules and no `caret-color` (the live's CSSOM carries zero of either on
  the studio — every selection renders with the UA default and every
  caret inherits the element color, verified input-by-input on both
  sides), and no source file under src/ carries the TW4
  forced-colors-aware transparent-outline token (the live authors ZERO
  forced-colors rules; the scaffold's class strings had contributed six
  dead ones — the pin's matcher is constructed at runtime because TW4
  scans test sources too).
- **Login-motion fidelity** (`login-motion-fidelity.test.ts`, r20) —
  file-content pins on the login chrome's measured transition contract:
  every Amplify login element computes `transition: all 0.25s ease` (the
  inactive tabs, all inputs, the eye toggle, the three submits, the three
  link buttons, the alert's Dismiss — via
  `transition-all duration-[250ms] ease-[ease]`; note the arbitrary-value
  `ease-[ease]`, because TW4 has no bare `ease` utility and silently
  falls back to its cubic-bezier default), the ACTIVE tab carries the
  property-none override (`transition-none duration-[250ms]
  ease-[ease]`), the scoped `.ast-amplify-button` reduced-motion guard
  replicates the live's `.amplify-button` rule (exactly one
  prefers-reduced-motion rule in globals.css; tabs/inputs and every
  studio surface stay UNGUARDED, matching the live), and the submit
  button holds its label/enabled/opacity constant through the auth
  round-trip (no "Signing in…" swap, no disabled dim — the live has no
  pending affordances). Guards against a future "polish" re-adding the
  TW utility's 0.15s fades, an unscoped reduced-motion guard, or
  pending-state affordances the live does not have.
- **Layout-height fidelity** (`layout-fidelity.test.ts`, r21) —
  file-content pins on the desktop app-shell height contract: the live's
  shell is UNCAPPED (its grid row sizes to the chat column's intrinsic
  878px; the page grows to 982 at 1536×844 and the window scrolls —
  wheel-verified), so the scaffold's viewport-height cap token is
  negative-pinned (runtime-constructed — TW4 scans test sources), the
  exact uncapped main class string is pinned, and the chat column's
  row-driving `max-h-[calc(100vh-16rem)]` scroll container is
  cross-pinned. Guards against a future "fix" re-capping the page and
  re-clipping the columns.
- **Documentation token hygiene** (in `css-hygiene.test.ts`, r21) — TW4's
  content detection scans committed markdown too; the r19/r20
  selection/forced-colors remediations were regressed by their own session
  records quoting the stripped tokens verbatim (the production CSS
  regrew the dead rules). The pin scans every .md in the repo for the
  two token families (runtime-constructed matchers) so documentation
  cannot re-introduce what the code stripped.
- **Action layer** (`src/actions/studio.test.ts`) — the mutation surface
  against a throwaway SQLite database with the auth seam mocked: CRUD,
  ownership/IDOR checks, supply assignment, delete-side-effects (incl. the
  mid-delete rollback), the two-state condition round-trips (create →
  absent, edit → explicit), empty-quantity creation, live/legacy import
  (incl. the empty-qty / explicit-ok verbatim restore), chat validation.

Run `bun run test` — new domain logic in `src/lib` and new actions require
tests first (red → green). Golden paths that live in the browser (view
navigation, modals, detail panels) are additionally pinned by two
browser suites: `bun run test:e2e` (Playwright, 25 specs — the
storageState setup signs in once per run so the rate limiter never
self-throttles; the mobile-chromium project pins the drawer contract at
the live's 390×844 viewport; every created row is deleted through the
real UI) and `python3 scripts/smoke_functional.py` (23 checks, needs the
`agent-browser` CLI and a running server) — notably the post-create
supplies navigation contract: create → flat list, away-and-back →
category grid, re-click on Supplies keeps the current sub-view; and the
Recent Projects focus flow: rail click → "All Projects" list + that
project's panel, sticky across away-and-back (the live app's
focusRequest semantics).

The broader verification contract is the golden-path checklist, exercised in
a browser after every change:

1. Sign in / create account / sign out (rate limiting: 6 rapid bad logins →
   throttled, recovers after a minute).
2. Create + edit a project (stats update immediately; "active" counts
   In Progress only).
3. Add + edit a supply (per-category subcategory picker; post-create the
   view switches to the supply list with All/Low Stock/Out of Stock tabs).
4. Project/supply detail panels: chips open panels; assign supplies from
   the project panel; delete with the native confirm; Edit swaps the panel
   for the inline edit form (save returns to the updated detail panel).
5. Chat send (message appears and survives reload — polling works).
6. Export Data → the original app's JSON shape downloads; Import JSON with
   it (or a live-app export) → success notice, assignments intact.
7. Projects tiles → breadcrumb sub-views (Series/Groups/status/Needs
   Sorting) with back navigation and correct filtered counts.
8. Supplies tiles → category → type tiles → type-filtered supply list;
   "!" indicators on categories with low/critical stock.
9. Inspiration → quote carousel + spotlight / art-history / partner detail
   panels (artwork, citations, rights, tags render from the seeded detail).
10. Mobile viewport: sidebar drawer opens/closes; "Chat ☰" toggles the
    community panel.

## Code Quality Standards

- Boundary rules: views import actions; actions import lib; nothing imports
  from `components/` upward. Client components never import `server-only`
  modules (`src/lib/auth.ts`, `src/lib/db.ts`).
- No `console.log` in committed code (warn/error with context are the
  pattern). Caught errors are logged, never silently swallowed.
- Empty/loading/error states are explicit: modals disable submit while
  pending; chat shows "No messages yet."; import failures surface
  actionable copy.
- Accessibility: semantic landmarks (`nav[aria-label]`, `role="log"` chat,
  `role="dialog"` modals with `aria-modal` — the kept invisible-semantics
  class), 44px touch targets on primary actions. The INTERACTIVE keyboard
  contract matches the live exactly (r15): NO authored focus-outline color
  anywhere (the shadcn `outline-ring/50` base rule was removed — the
  browser-default ring renders, byte-identical to the live), and the
  create modals have NO Escape-close and NO focus steal (the live's modal
  leaves focus on the trigger and ignores Escape — only ✕ / scrim click
  dismiss). Do not re-add these affordances; pinned by
  `focus-fidelity.test.ts`.

## Git & Version Control

- Branch `main` only; Conventional Commits with atomic scope
  (`feat(projects): …`, `fix(chat): …`).
- Never commit `.env`, `db/*.db`, keys, or logs.
- Pushes go through `docs/ssh_git_wrapper_v3.py` with an external deploy key
  (operator contract in `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`);
  the wrapper pre-flights auth, pushes `HEAD:refs/heads/main`, and shreds the
  temp key.

## Error Handling & Debugging

- Debug order: reproduce with the exact command → read the dev server log →
  check the action's error path (`console.error` context) → fix the root
  cause. The `ActionResult` error codes (`VALIDATION` / `UNAUTHORIZED` /
  `NOT_FOUND` / `CONFLICT` / `INTERNAL`) tell you which seam failed.
- Auth failures return `UNAUTHORIZED` without leaking whether the email
  exists. Import/export failures name the file problem, not the stack.

## Anti-Patterns to Avoid

- Adding page routes or route handlers for UI mutations.
- Free-form strings for status/category/condition outside
  `studio-domain.ts`.
- Skipping Zod parsing because "the client already validates."
- Changing the export payload shape (the original app's imports must keep
  working — `app`/`version` are load-bearing).
- Hand-editing `bun.lock` — use `bun add`/`bun install`.
- Flipping `typescript.ignoreBuildErrors` or loosening strictness to pass a
  build.
- New colors outside the AST token set (the palette is the clone's contract).
