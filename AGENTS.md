# AGENTS.md

Instructions for AI coding agents working in this repository. Every line answers: "would you get this wrong without being told?"

## Commands

Run from the repo root. Bun is the package manager — use `bun`, never `npm`/`yarn`/`pnpm`.

| Command | What it does |
|---|---|
| `bun run dev` | Dev server on :3000 |
| `bun run lint` | ESLint (next/core-web-vitals + next/typescript) |
| `bun run typecheck` | `tsc --noEmit`, strict |
| `bun run test` | Vitest — 459 tests: the SQLite path contract (src/lib/db-path.ts — relative `file:` URLs resolve against `prisma/schema.prisma` regardless of runtime/CWD; absolute and non-file URLs pass through for the action-layer temp DBs), domain vocabulary, bundle-pinned status/condition style maps (incl. the two-state absent-vs-explicit "?"/"OK" pill and "✓ ok" icon branches), design-token literals (incl. the Tailwind-v3 radius scale, the zero-webfont InterVariable stack, and the r14 DEFAULT-palette pins — pink-200/300/400/500, cyan-400, blue-400/500 at the live's v3 values, with a TW4-drift negative and usage-site class-string pins), validation (incl. the normalized import gate, the Cognito password-policy rules, the permissive sign-in schema, and the live's quantity format gate), export/import wire format (incl. the empty-qty `qty:""` slot, the fraction `quantity:null` slot, the absent-vs-explicit status emission, the empty-qty/explicit-ok import round-trip, and the r32 pair — the absent subcategory's `""` emission and the import's payload-timestamp preservation + payload-isNew badge honoring with the created-id return shape), rate limiting, the inspiration rail section resolver (incl. the live's inert "quote" / "spotlight-kevin-lewis" quirks), seeded chat-history fidelity (the live's five community messages byte-for-byte — the author's own typos, "KIm"/"brower", pinned so they cannot be silently "corrected"; r34: the live renders every message wrapper as a plain `<div class="flex gap-2">` — the scaffold-era `<article>` was re-pinned to div, the list's role="log" staying the documented a11y addition), login/header/chat-panel fidelity (the responsive logo's intrinsic 1068×269 aspect, the Amplify eye-toggle chrome, the invisible-typing input quirk, the tab strip's 2px top border, the sticky community header + scroll-container split, the absence of chat auto-scroll, the pale-pink dismissible Amplify alert box with its exact warning/X icon paths, the Cognito policy-rule stack, the Reset Password confirmation view, the content-width 35px link buttons, the native-validation attribute set, the r24 auth-success scroll reset — the live's view swap lands the dashboard at scrollTop 0, so router.refresh() is followed by an explicit window.scrollTo — and the r25 sign-up/reset pre-submission validation machine: the live's blur-gated per-field engagement (pw blur renders the policy stack and live-updates it, confirm blur renders the mismatch line), the touch-all submit path, the sign-up submit's disabled-exactly-while-a-line-renders gray chrome, and the amplify-button cursor-pointer contract), plus the r27 login-input/eye/reset chrome: the inputs' 16px/24px font on 8px/16px padding (px-4 py-2 text-base — the live's amplify-input metrics, measured on every view at both viewports; text-sm/px-3 is negative-pinned), the eye toggle's CONSTANT "Show password" name + its sr-only aria-live="polite" "Password is hidden/shown" announcement span (the live's a11y contract — the label never flips to "Hide password"), the reset forms' uniform p-8 (the r9 pb-5 pin was a bad measure — 12px card shortfall), the reset EMAIL view's content-sized card (mode==="reset" → w-fit md:w-full — the h3 at 32px drives the 307px max-content; the confirmation view stays full-width), and the below-480 card cap max-w-[357px] — the live's auth card is content-sized at 357px below 480, so at 390 it centers with 0.5px margins (x16.5) and at 375 it fills the column; r29 re-measured: from viewport 480 up the card is FIXED at 480 (min-[480px]:min-w/max-w — the min-content holds the layout grid's 1fr track open at 768 and the exactly-480 track overflow is clipped by the live's html/body overflow-x: hidden, replicated in globals.css) — the r27 md: handoff was correct only at the two pinned viewports. The r29 viewport-fidelity.test.ts pins the whole band (the card pair, the UNTOUCHED layout-grid template, and the overflow-x rule), and r30 added the sub-335 tab-wrap pins (the live's Amplify tabs are block+padding with EMERGENT height — the "Create Account" label wraps to a 74px strip at viewport ≤330; a fixed h-[50px] renders the page 24px short at 320). r33 added the md-crossing pins to viewport-fidelity.test.ts — the supplies drill-down's ONE-WAY reset at the 768 boundary (a `matchMedia("(max-width: 767.98px)")` listener whose `event.matches`-guarded `navigate(null)` fires only on the DOWNWARD crossing; the up-crossing preserves the mobile-drilled state, and the projects view keeps its sub-view across BOTH crossings — a live-measured asymmetry, negative-pinned so the reset cannot be "helpfully" extended to projects-view). The r30 photo-surface-fidelity.test.ts pins the never-measured photo family (the supply modal's tile-swap preview at w-16 h-16 with the black/60 ×, the project modal + edit panel's "Photos (N/30)" counter + 5-col aspect-square /20 thumb grid with the inside-× and the first thumb's "cover" badge + the Add-more relabel that disappears at the 30/30 cap, the project chip's 40px opacity-85 thumb AFTER the name, the single-source MAX_PROJECT_PHOTOS = 30, and the 12mb Server Action body cap that carries 30 data-URL photos — the live uploads to S3 outside the form save and never hits a transport limit; r31 added the ×'s hover-gating — `opacity-0 group-hover:opacity-100 transition hover:bg-ast-pink`, invisible until the thumb is hovered — and the edit-panel barcode's pink class, the blue scanner style being create-modal-only). The r31 new-badge.test.ts pins the live's SESSION-SCOPED NEW badges (an in-memory created-this-session registry in src/lib/new-badge.ts — badges live and die with the SPA session; a reload drops them; the four badge surfaces consult `isNewSessionItem(id)`, both create flows mark the created id, and the 7-day window helper is gone from studio-domain — the EXPORT wire format's `isNew` keeps its window as a private helper in export-payload.ts, a separate measured surface; r32: the IMPORT path also marks the registry, keyed off the payload's `isNew` flag returned per created id by the action) plus the project chip name's conditional pr-10 (present only while the badge shows). The r28 login link-button chrome (the live's amplify-button--link computes lh 21px on 6px/12px padding with the 35px height EMERGENT — py-1.5 + leading-normal; an h-[35px] cap centers a 20px line at a HALF-pixel and rasterizes the label 1px low), the r28 static-asset image contract (every public-asset next/image carries `unoptimized` — the login ADC2 badge, the Spotlight portrait, the header logo; the optimizer's /_next/image re-encode (q75) drifts ±1-3 RGB against the live's original CDN bytes), the r28 rail-card type scale (the inspiration-view Partners body at text-[11px]/15.125 — the live's TWO rail copies differ: the drawer's rail at text-xs/10px, the view's rail at text-sm/11px; the sidebar Partners title at text-xs's own 16px line — NO leading-snug, unlike the live's own Quote/Art-History titles which DO carry it), and the r28 dev-chrome contract (devIndicators: false — the dev-tools badge is 36×36 of fixed-position capture pollution the live never carries), drawer-scrim fidelity (the mobile drawers' shared `fixed inset-0 z-40 bg-black/60 md:hidden` scrim — no blur, below the z-50 drawers, instant mount/unmount), supply-surface fidelity (the create modal's INERT Stock Status select — it submits `condition: null` — the quantity format gate's exact copy, the edit panel's `?? "ok"` init, the chip's unconditional qty label, the detail panel's raw quantity, and the r26 button-row + detail-heading chrome: both create modals' Cancel buttons render at the live's base 16px font — NO text-sm, the bordered Cancel is the flex-stretch row's tallest child at 42px and sizes BOTH row buttons, a text-sm variant renders a 40px row and a modal card 2px short — and both detail panels' H2s render as plain blocks — the NEW badge flows inline at 18px with its own ml-2 8px gap, a flex-wrap/gap-2 row doubles the gap to 16px and inflates the badge to 20px; pinned by `supply-fidelity.test.ts` + the r26 `project-fidelity.test.ts`), sidebar stat-tile fidelity (the ACTIVE view's tile carries its OWN accent pair — electric blue for Projects/Supplies, LAVENDER for Inspo — dropping the `#120724` card bg and hover classes while active, with constant inner text classes), header-button fidelity (the memory button's hyphen-family literal colors — idle border `#5b3fd3/30`, hover trio `#f4f27a` at `/70`/`/20`/solid, negative-pinned against the utility families — plus the `@custom-variant hover (&:hover);` override restoring the live's Tailwind-v3 plain-`:hover` semantics), focus & keyboard-contract fidelity (r15: NO authored outline color — the UA-default focus ring renders like the live's — and the create modals carry no Escape-close and no focus steal, while keeping `role="dialog"` + `aria-modal`), motion-contract fidelity (r17: NO entry animations — no authored `@keyframes`, no `.studio-fade`, no `prefers-reduced-motion` guard; the drawers' `transition-transform duration-300` slide stays as the live's only studio motion), landmark & reading-order fidelity (r18: the announcement order — header → sidebar → content → chat — verified identical on both sides at both viewports; the closed drawers' `inert` + `aria-hidden` PAIR as the kept r5 improvement, with labeled drawer landmarks; the content pane as a single `<section>` under ONE `<main>` — the live's nested inner `<main>` and twin md-toggled content copies are accepted divergences), CSS compile hygiene (r19: the `@source not "../../skills";` directive keeping the skills corpus out of TW4's automatic content detection — skills/ is excluded from compilation per the task contract — plus the nothing-authored selection/caret contract: globals.css declares no `::selection` rules and no `caret-color`, matching the live's CSSOM, and the shadcn Input carries no selection utilities), forced-colors compile hygiene (r20: no source file under src/ carries the TW4 transparent-outline utility token — the only emitter of `@media (forced-colors: active)` blocks; the live's CSSOM authors zero), login-motion fidelity (r20: the login chrome's Amplify transition contract — `all 0.25s ease` on the inactive tabs, inputs, eye toggle, submits, link buttons, and the alert's Dismiss; `transition-property: none` on the ACTIVE tab; the scoped `.ast-amplify-button` reduced-motion guard replicating the live's `.amplify-button` rule; and the pending-state contract — the live's submit label/enabled/opacity stay constant through the auth round-trip), layout-height fidelity (r21: the desktop app shell is UNCAPPED like the live's — the scaffold's viewport-height cap token is negative-pinned, the exact uncapped main class string is pinned, and the chat column's row-driving scroll container is cross-pinned), documentation token hygiene (r21: no committed markdown file carries the stripped transparent-outline / selection-variant tokens — TW4 scans .md files too, and the r19/r20 remediation records had re-introduced the dead rules they documented; r22 excludes every committed .md from content detection entirely — the systemic fix for the every-round recurrence — and the docs-token pin stays as defense in depth; r23 audited the exclusion's build diff: nine dead rules + ten dead var emissions dropped, all verified consumerless, every rendered utility still compiles from src literals), action layer (each action file runs against a throwaway SQLite DB, incl. the mid-import rollback contract and the mid-delete no-strand contract, and the r33 list-order pins — insertion order with mixed non-chronological stamps, and updatedAt-edits-never-float: the live renders BOTH chip lists in natural row order with NO timestamp sort) plus the r33 list-order-fidelity.test.ts (the no-orderBy source pin, both create handlers' APPEND contracts — a created item renders LAST like the live — and the sidebar rail's separate updatedAt-DESC contract), and the r35 inspiration-view-fidelity.test.ts (the four detail panels' PER-TYPE chrome — turquoise/40 p-5 quote with NO top margin, purple/50 p-4 mt-3 spotlight, lavender/40 history, blue/40 partner — their plain div tags, the per-type mounts (the quote panel inside the quotes section at gap 0, the spotlight panel after the whole spotlight section with scrollIntoView, the history/partner panels as feed-container children after their grids, no col-span-2 nesting), the spotlight artwork gallery (the max-h-16rem main image + the w-12 h-12 thumb selector with the turquoise/60 selected border), the image-unavailable notice, the partner flat structure with the #8D5CFF literal, the soft-pill tag spans, the underlined external citation link with citationUrl, the three-span artwork caption split, the SELECTED-STATE family (the open tile's turquoise border, the full-opacity spotlight gradient, the lavender/60+ring cards), the plain feed-tab buttons (the orphan tab role removed), and the kept a11y additions (the quote tiles' + close buttons' aria-labels); the r35 chat pins (the composer input's NO maxLength — the live accepts 600-char sends — the schema's removed 500-char cap, and the action catch's live copy "Could not send message.") |
| `bun run test:e2e` | Playwright E2E — 28 specs against the running app (boots its own dev server, or `E2E_BASE_URL`): auth gate, dashboard, project/supply CRUD through the real UI, import/export, the sign-up pre-submission validation machine (zero auth requests), and the mobile navigation menu at the live's 390×844 viewport (drawer geometry, shared scrim, inert, Escape no-op, Chat toggle). One storageState sign-in per run (the rate limiter is a pinned contract); every created row is deleted through the UI. Prereq: `bun run db:push && bun run db:seed`. CI runs it in the `e2e` job |
| `python3 scripts/smoke_functional.py` | Browser-driven smoke suite (needs `agent-browser` CLI + running server) — 23 golden-path checks incl. the post-create supplies navigation regression and the Recent Projects sticky-focus flow; leaves the studio pristine |
| `bun run db:push` | Push `prisma/schema.prisma` to SQLite (`db/custom.db`) — required after schema edits |
| `bun run db:generate` | Regenerate Prisma Client |
| `bun run db:seed` | Idempotent seed: demo user, 5 chat messages, 15 inspiration entries |
| `bun run db:migrate` / `db:reset` | Dev migration / drop+recreate |
| `bun run build` / `bun run start` | Production build (standalone) / serve it |

Order for a clean check: `bun run lint && bun run typecheck && bun run test`,
then `bun run build`, then exercise the golden paths in a browser (login →
create project → add supply → detail panels → assign supply → delete with
confirm → chat → export/import round-trip → breadcrumb sub-views →
stock filters → mobile drawer + "Chat ☰"). `.github/workflows/verify-gate.yml`
runs the same gate on every push.

## Architecture invariants

- **Single route.** The entire app is `src/app/page.tsx` (a server component that
  reads the session). The original SPA's views (`/dashboard`, `/projects`,
  `/supplies`, `/inspiration`) are client-side view state inside
  `StudioApp`. Do NOT add page routes.
- **Mutations are Server Actions only** (`src/actions/auth.ts`,
  `src/actions/studio.ts`) returning `ActionResult<T>` from
  `src/lib/result.ts` — never throw across the client boundary; unexpected
  errors are logged server-side and flattened to a safe `INTERNAL` error.
  The only route handler is the `/api` health probe.
- **Zod at every boundary** (`src/lib/validation.ts`). SQLite has no enums —
  status/category/condition are strings validated against the single-source
  lists in `src/lib/studio-domain.ts`: category tokens are the live app's
  singular values (`Paint`, `Brush`, `Pastel`, `Paper`, `Canvas`, `Medium`,
  `Other`), conditions are `ok | low | critical` — but the column is NULLABLE:
  null is the live's ABSENT status (the create modal's Stock Status select
  is INERT — it submits `condition: null` and the select is pure visual
  chrome; conditions only become explicit through the edit panel, whose
  form initializes an absent status onto "ok" before the first save). The
  two states render differently: absent → "?" pill + unlabeled "⚠️"
  detail glyph + `status` omitted in export; explicit "ok" → cyan "OK"
  pill + "✓ ok" icon + `status:"ok"` exported. Supply subcategories come
  from the per-category `SUPPLY_TYPE_LISTS` (the picker is category-scoped;
  "Other" hides it) — but the "Other / Custom…" flow stores free-form text
  (≤ 60 chars), so the schema enforces type/trim/length only, exactly like
  the live app whose pickers are the vocabulary guard. Never accept
  free-form values for category. Supply QUANTITY is the live's format
  contract: empty is valid (stored as `""` — the chip renders the bare
  "qty" label, the detail panel renders a blank, the export emits
  `qty:""` / `quantity:null` / `quantityValue:null`), and only plain
  numbers / simple `a/b` fractions pass the format gate (`isValidQuantityInput`,
  rejected with the live's exact "Enter a valid quantity, like 2, 1.5,
  or 1/2" copy). Do not "fix" the empty quantity or the inert select —
  both are measured live behavior, pinned by `supply-fidelity.test.ts`.
- **Auth seam:** `src/lib/auth.ts` — scrypt password hashes (`scrypt:salt:hash`
  format), opaque session tokens in the httpOnly `ast_session` cookie,
  `getCurrentUser()` resolves session → user. Actions derive `userId` from
  the session, never from client input. `signInAction` is throttled by the
  in-memory fixed-window limiter in `src/lib/rate-limit.ts` (5 attempts per
  IP per minute).
- **Wire format:** export/import payloads are built and normalized in
  `src/lib/export-payload.ts` to match the ORIGINAL app's JSON shape
  (`title`/`subcategory`/`status`/numeric `qty`/`supplyIds`/`isNew`; unset
  `budget`/`barcode` export as `""` — the live app's in-memory defaults).
  The quantity trio has THREE distinct slots, all measured on live exports:
  `qty` is the in-memory value (`""` when the quantity is empty, the parsed
  number otherwise), `quantity` is the PLAIN `Number()` parse (null for
  fractions AND empty), and `quantityValue` is the fraction-aware parse
  (`"1/2"` → 0.5). `status` is emitted whenever one is stored — including
  an explicit `"ok"` — and omitted for the ABSENT (null) state. The legacy
  clone shape imports through the same normalizer, and `qty:""` round-trips
  verbatim (the live's own import restores the empty quantity). The live
  app's project→`supplyIds` relation maps onto our internal
  `Supply.assignedProjectId`. The normalizer is deliberately lenient —
  `normalizedImportPayloadSchema` (`src/lib/validation.ts`) is the gate
  that enforces the documented bounds (≤500 projects / ≤1000 supplies,
  string lengths, photo caps, status/category/condition enums) before
  anything is stored, and the whole import (delete + re-create) runs in
  ONE interactive `db.$transaction` so a failed restore rolls back
  instead of emptying the studio. `deleteProject` follows the same
  atomicity discipline (detach + delete in one transaction — a mid-delete
  failure must not strand supplies on a live project).
- **DTO discipline:** Prisma rows never reach the client; the mappers in
  `page.tsx` / `studio.ts` convert to the types in `src/lib/dto.ts`.
- **First-paint data** is fetched in `page.tsx` and handed to `StudioApp` as
  typed props; after mutations the client updates React state from action
  results (no global data store).
- **Rail focus flows (the live app's focusRequest / location-state
  sections):** a Recent Projects rail click stores a sticky
  `{ id, key }` focus token in `StudioApp` — every projects-view mount
  re-opens the "All Projects" list with that project's detail panel
  (away-and-back included) until the session ends; the inspiration rail
  carries a per-navigation section (`"art-history-today"` / `"partner"`
  expand their Feed panels via `resolveInspirationFocus`, while
  `"quote"` and the hardcoded `"spotlight-kevin-lewis"` are the live's
  inert sections — the quirks are pinned by tests, do not "fix" them).
  A plain INSPO stat-tile click travels WITHOUT a section (never expands
  a panel) and never collapses one that is already open.

## Framework quirks (verified the hard way)

- **Next.js 16:** `cookies()` is async — always `await`. Page files may export
  only `default`, `metadata`/`generateMetadata`, `revalidate`, `dynamic`;
  extra exports fail the build.
- **Tailwind v4 CSS-first:** design tokens live in the `@theme` block of
  `src/app/globals.css` as literal hex (`--color-ast-turquoise: #2ec4b6` →
  `text-ast-turquoise`), pinned to the live app's *compiled utility*
  values by `src/lib/design-tokens.test.ts` (purple `#5a3a8e`, yellow
  `#ffd5a8`, coral `#ff7a7a` — the live `:root` variables for these three
  are vestigial and must NOT be copied; the radius scale is the live's
  Tailwind-v3 defaults — `rounded-lg`/`xl` = 8/12px — do NOT restore the
  shadcn scaffold's larger values). There is no `tailwind.config.js` —
  do not add one.
  `var()` chains inside `@theme` are dropped by the build; keep values
  literal (the one exception: `@theme inline` for `--font-sans`).
- **The skills/ folder is excluded from Tailwind's content detection
  (r19)** — globals.css carries `@source not "../../skills";` because TW4's
  automatic detection scans every non-gitignored file, and the committed
  skills corpus carries class-like strings in its docs/tools (the
  gift-evaluator skill's HTML template alone contributed two dead
  red-tinted `::selection` rules and inflated the compiled stylesheet by
  37% with skills-scanned candidates). Do NOT remove the directive — the
  repo's task contract excludes skills/ from compilation, and any new
  `@source not` line changes the pinned sources list
  (`css-hygiene.test.ts`). Related: the app authors NO `::selection`
  rules and no `caret-color` (the live's CSSOM carries zero of either on
  the studio — every selection renders with the UA default and every
  caret inherits the element color); do not add selection/caret styling
  anywhere, including the shadcn ui components.
- **The app authors ZERO forced-colors rules (r20)** — the live's CSSOM
  carries none, and TW4's forced-colors-aware transparent-outline utility
  is the only emitter of `@media
  (forced-colors: active)` blocks in this codebase. Its 29 class-string
  occurrences across the 13 scaffold files that carried them were stripped
  (they contributed six dead rules — zero rendered consumers on either
  side); the token must not come back, including via a `bunx shadcn add`
  scaffold refresh (pinned by `css-hygiene.test.ts`, whose matcher is
  deliberately constructed at runtime because TW4 scans test sources too
  and a literal token in a comment or regex would compile the utility
  straight back into the CSS).
- **The desktop app shell is UNCAPPED (r21)** — the live's root `<main>`
  is a plain block (`min-h-screen overflow-hidden`, no flex, no height
  cap) wrapping a `relative z-10 flex min-h-screen flex-col` div, so the
  desktop grid's single auto row sizes to the TALLEST column's intrinsic
  content — always the chat column (sticky community header 240px + the
  scroll container's `max-h-[calc(100vh-16rem)]` 588px + card padding =
  878px). The page therefore grows past the fold (982px at 1536×844) and
  the WINDOW SCROLLS (wheel-verified: scrollY 0→138; the sticky header
  rides the scroll). The clone's single-copy shell keeps its flex column
  but must NOT cap it: the scaffold's viewport-height token (present
  since the initial commit, never live-measured) locked the page at 844,
  clipped the chat card at 740px (its bottom border + rounded corners
  rendered where the live's card continues past the fold), and killed
  the wheel scroll. Below md nothing changes — both shells grow to the
  same 1563px. Pinned by `layout-fidelity.test.ts`; do NOT re-add a
  viewport cap, and note the capture consequence: full-page parity
  comparisons must account for the live's scrollable document (the
  sidebar/chat cards' bottom borders sit below the fold).
- **TW4 scans MARKDOWN too — every committed .md is now EXCLUDED from
  content detection (r21 finding, r22 systemic fix, r23 audit)** — the
  r19/r20 selection/forced-colors remediations were undone by their own
  session records: the stripped tokens were quoted verbatim in the
  committed .md files, and the next build compiled the dead rules back
  into the production CSS (measured: the "clean" 152,241-byte stylesheet
  had regrown to 152,390 with one forced-colors block and the selection
  pair; the r22 pull then brought session_37.md quoting them again —
  152,474). Because the class recurs EVERY round (raw narrations
  naturally quote prior-session tokens), globals.css now carries
  `@source not "../../**/*.md";` — documentation is not a render surface.
  The r23 audited build diff proves the exclusion safe: it dropped NINE
  dead rules + TEN dead theme-variable emissions (152,035 → 150,821
  bytes — the three regrown rules plus six older doc-derived ones,
  including a garbage arbitrary-property rule that had compiled from
  CLAUDE.md's own error-log example, and ten consumerless :root
  emissions), every one verified dead against src (no rendered surface
  uses them; every utility the app renders compiles from a literal class
  string in src — the style maps and component ternaries are all
  TW4-visible). Keep referring to stripped tokens descriptively anyway
  ("the transparent-outline utility") — the docs-token pin in
  `css-hygiene.test.ts` still scans every .md for the guarded families
  as defense in depth, and it MUST stay green: it is the repo's
  canary for the pin-vs-exclusion contract (r22's own committed
  narration tripped it once — fixed in r23).
- **The login chrome's transition contract is Amplify's, not the TW
  utility's (r20)** — the live's login elements compute
  `transition: all 0.25s ease`: the INACTIVE tab, every input, the eye
  toggle, all three submits, the three link buttons, and the alert's
  Dismiss button carry `transition-all duration-[250ms] ease-[ease]`;
  the ACTIVE tab carries `transition-none duration-[250ms] ease-[ease]`
  (Amplify's active-tab override — property none, duration/timing kept).
  Note `ease-[ease]`, not `ease`: TW4 has NO bare `ease` utility (the
  token is silently ignored and the cubic-bezier(0.4,0,0.2,1) default
  kicks in — measured). Under `prefers-reduced-motion: reduce` the live
  guards `.amplify-button` — replicated via the scoped
  `.ast-amplify-button` marker (8 elements) and ONE rule in globals.css;
  the tabs/inputs stay UNGUARDED on both sides (the live's rule targets
  .amplify-button only), as do the studio surfaces. The login submit
  holds its label/enabled/opacity CONSTANT through the auth round-trip
  (measured on the live at 120ms intervals) — no pending text swap, no
  disabled dim. All pinned by `login-motion-fidelity.test.ts` (and the
  refined r17 pin in `motion-fidelity.test.ts` — its "no
  prefers-reduced-motion guard" claim was based on an inventory that
  counted @keyframes only; the live carries five reduced-motion MEDIA
  rules, four of them dead on both sides and documented in the PAD).
- **Auth success resets the document scroll (r24)** — the live's SPA
  swaps the login view for the dashboard on successful sign-in/sign-up
  and the document lands scrolled to TOP; the clone's `router.refresh()`
  re-renders in place and the browser would otherwise PRESERVE the
  pre-submit offset (measured on both engines: WebKit mobile pre 201 →
  live 0 / clone 201; Chromium forced-wheel pre 128 → live 0 / clone
  128). Reachable whenever the mobile login card exceeds the fold —
  every real phone (the submit sits at y=851 against the 844-fold under
  WebKit metrics; Chromium's tighter metrics keep it at 778, which is
  why the Chromium-only battery never saw it). The login screen's
  auth-success handler therefore calls `window.scrollTo(0, 0)` right
  after `router.refresh()` — do NOT remove it (pinned by
  `login-fidelity.test.ts` + the E2E sign-in round-trip spec).
- **The sign-up/reset forms validate on BLUR, per field (r25)** — the
  live's Amplify signUp and reset-confirmation forms render their
  client validation PRE-SUBMISSION, gated per field: the password
  field's first blur renders the Cognito policy stack (empty pw = all
  five lines) and live-updates it on every later keystroke; the confirm
  field's first blur renders the mismatch line (confirm !== pw,
  including an emptied confirm). Pristine forms (no blur yet) render
  NOTHING regardless of content, and the sign-IN form has NO
  pre-submission validation at all (the blur handler is mode-gated). A
  submit (click or Enter) validates every field at once. Do NOT
  "simplify" this into submit-only validation or add cross-field
  short-circuits (the mismatch renders regardless of pw validity once
  the confirm has blurred) — every rule was measured keystroke-level on
  the live. Pinned by `login-fidelity.test.ts` + the E2E
  signup-validation spec.
- **The sign-up submit disables exactly while a validation line renders
  (r25)** — measured on the live: with the form engaged and invalid, the
  Create Account button flips to the disabled chrome (bg `#EFF0F0`,
  text `#89949F`, cursor not-allowed, label/height/opacity constant);
  it re-enables (pink, pointer) when the form cleans up. The email
  format is IRRELEVANT to the disabled state (bad email + valid
  matching pw stays enabled while `form.checkValidity()` is false). The
  sign-IN submit and BOTH reset-view submits never disable (measured in
  every state) — do not add disabled states to them. The r20-F3
  "constant submit" pin was measured on the SIGN-IN round-trip only;
  the pending contract (no isPending disable, no opacity dim, no label
  swap) still stands everywhere.
- **The amplify-button chrome carries cursor: pointer (r25)** — the
  live's `.amplify-button` rule sets `cursor: pointer` on all eight
  chrome elements (three submits, both eye toggles, three link buttons,
  the alert's Dismiss; the tab strip carries `auto` — an equivalent
  non-pointer rendering). The clone's one globals rule
  `.ast-amplify-button:not(:disabled) { cursor: pointer; }` covers the
  same marker set; the `:not(:disabled)` scope is LOAD-BEARING — TW4
  emits utilities inside `@layer`, and an unlayered rule outranks every
  layered one, so without the scope the sign-up submit's
  `disabled:cursor-not-allowed` utility would lose (the cascade-layers
  trap, caught by the E2E spec). Pinned by
  `login-motion-fidelity.test.ts`.
- **The login inputs' font metrics are Amplify's (r27)** — the live's
  `amplify-input` computes 16px/24px on 8px/16px padding on every view
  (sign-in, create, both reset views) at both viewports; the 42px box
  height emerges from 8+24+8+2borders. The clone's input constants carry
  `px-4 py-2 text-base` with the deterministic `h-[42px]` (its 24px
  content box exactly fits the 24px line). Do NOT reintroduce `text-sm`
  or `px-3` on the login inputs (pinned by `login-fidelity.test.ts` +
  `login-motion-fidelity.test.ts`; the studio's own modal inputs are a
  DIFFERENT contract and stay at their measured values).
- **The eye toggle's name never flips and it announces its state (r27)**
  — the live's show-password button keeps `aria-label="Show password"`
  constant (role=switch + aria-checked carries the state) and renders an
  sr-only `aria-live="polite"` span reading "Password is hidden" /
  "Password is shown" (verified by clicking the live's eye). The clone's
  former "Hide password" relabel was an invented affordance — do not
  bring it back.
- **The reset EMAIL view's card is content-sized below md (r27)** —
  the live's mobile copy shrinks the reset email card to its content
  (307px at 390: the h3 "Reset Password" at 32px drives the max-content,
  so the email input and Send code render 241px) while the confirmation
  view and md+ stay full-width. The clone's card carries the
  `mode === "reset" ? "w-fit md:w-full" : "w-full"` ternary — the live's
  twin copies disagree with each other here; the single copy renders
  both behaviors. Both reset forms pad `p-8` (the r9 `pb-5` pin was a
  bad measurement — the live computes 32px on all four sides, measured
  three times on both views at both viewports).
- **The auth card is content-driven at 357px below md (r27)** — the
  live's mobile auth card sizes to its own max-content (357px), so at
  390 the 358px column centers it with 0.5px margins (card x16.5, form
  x17.5, inputs x49.5) and at 375 the narrower column makes it fill
  (343px — measured identical on both sides). The clone's card carries
  `max-w-[357px] md:max-w-[480px]` over its base width classes; at md+
  both sides render 480.00 @ x174.00 y323.50 byte-exact. Do NOT
  "simplify" this to a bare max-w-[480px] — the half-pixel centering is
  the live's own layout (pinned by `login-fidelity.test.ts`).
- **Paired captures MUST verify state equality BEFORE shooting (r27)** —
  the first-pass projects capture diffed 13.38% purely because the live's
  chat drawer was still open. `offsetParent` is null for
  `position: fixed` elements (both drawers AND the scrim), so a
  visibility probe built on it silently passes while a drawer is open.
  Assert instead: the scrim's DOM presence (`div.fixed.inset-0.z-40`),
  each drawer's translate-x (closed = -312 / 390), window.scrollY, and
  the visible view's h1 — on BOTH sides, before every capture.

- **Static-asset images are NEVER optimizer-served (r28)** — the live
  serves its asset files as original bytes (S3/CloudFront, md5-identical
  to `public/assets/*`); a default `next/image` usage re-encodes them
  through `/_next/image?…&q=75` (sharp) and drifts ±1-3 RGB per pixel
  (measured on the ADC2 badge at 1:1 scale and visible as a 2.4% band
  on every desktop capture through the double-resampled header logo).
  Every `next/image` that renders a `public/` asset carries
  `unoptimized` (the width/height layout attributes stay — no CLS);
  pinned by `image-fidelity.test.ts`. Do not "optimize" these images —
  byte-identity with the live's CDN assets is the contract.
- **The dev-tools indicator is OFF (r28)** — `devIndicators: false` in
  next.config.ts. The badge (36×36 fixed bottom-left, rendered inside
  the `nextjs-portal` shadow DOM) pollutes every dev-mode capture with
  a 0.1-0.5% diff the live never carries; it is invisible to DOM
  probes that do not walk shadow roots. The dev overlay still
  functions on runtime errors; production output is unchanged. Pinned
  by `dev-chrome-fidelity.test.ts`.
- **The login link buttons' line pair is Amplify's 21px (r28)** — the
  live's `amplify-button--link` computes line-height 21px (1.5 × the
  14px label) on 6px/12px padding, its 35px height EMERGENT
  (6+21+6+2). The clone renders `inline-flex … px-3 py-1.5 text-sm
  font-bold leading-normal` — do NOT re-add `h-[35px]` (the cap keeps
  the box right but centers text-sm's 20px line at a HALF-pixel
  offset, and Chromium rasterizes the label one pixel low). Pinned by
  `login-fidelity.test.ts` + `login-motion-fidelity.test.ts`.
- **The login card is FIXED at 480px from viewport 480 up (r29)** — not
  an md-conditional max-width. The live's card carries
  `min-[480px]:min-w-[480px] min-[480px]:max-w-[480px]` over `w-full
  mx-auto max-w-[357px]`: the min-width supplies the MIN-CONTENT that
  holds the layout grid's `1fr` track open (at 768 the track resolves
  to 480px, not 284 — the text section rewraps h244, the grid
  re-centers h705, the card lands at (16,346)); below 480 the
  unconditional max-w-[357px] holds (390: 357 @ x16.5 — the r27
  record). Do NOT simplify the pair to `md:max-w-[480px]` (the r27
  form — correct only at 390 and 1280, wrong across the whole 480-768
  band). Pinned by `viewport-fidelity.test.ts`.
- **The document clips horizontal overflow (r29)** — globals.css
  carries the live's own rule `html, body { overflow-x: hidden }` (the
  live's CSSOM: `html, body, #root`; the clone has no #root mount).
  It keeps the login layout's exactly-480 track overflow (card right
  edge x496 against the 480 viewport) off the scrollbar — scrollWidth
  stays at the viewport width. Vertical scrolling is unaffected (the
  live's own uncapped desktop shell scrolls the same clipped
  document). Do NOT remove it as "unusual" — it is the live's global.
  Pinned by `viewport-fidelity.test.ts`.
- **The login tabs WRAP their labels below viewport ~332px (r30)** —
  the live's Amplify tab is `display: block; text-align: center` with
  `padding: 12px 16px` and an EMERGENT height: at viewport 320-330 the
  "Create Account" label (16px bold ≈ 118px) no longer fits the padded
  tab and wraps to two 24px lines (strip 74px; the whole login page
  1069px tall at 320); from viewport 335 up the label fits (50px
  strip). The clone's tabs carry `block flex-1 px-4 py-3 text-center`
  — do NOT re-add a fixed height cap (`h-[50px]`): the label's
  single-line y-offset is identical (top 2+12 on both old and new),
  but the cap renders the page 24px short at 320. Pinned by
  `viewport-fidelity.test.ts` + the re-measured r9 tab pin.
- **The Spotlight portrait never shrinks (r30)** — the dashboard's
  Studio Spotlight portrait carries `shrink-0` (the live's own
  utility): without it the flex row (portrait + gap-3 + the Kevin
  Lewis text column) squeezes the portrait to the text column's
  min-content leftover (56 → 49.59px at 320, 55 at 340). Do not
  remove the guard as redundant. Pinned by
  `photo-surface-fidelity.test.ts`.
- **The photo surfaces follow the live's measured contracts (r30)** —
  the whole family was unmeasured until r30 (the live account ships
  an empty studio, so no prior round had driven a photo upload). The
  supply modal REPLACES its add-photo tile with a `w-16 h-16` preview
  (the × at `-top-1 -right-1` in `bg-black/60`); the project modal and
  edit panel render a "Photos (N/30)" counter label, a
  `grid grid-cols-5 gap-2 mb-3` of `w-full aspect-square` `/20`
  thumbs with the × INSIDE each thumb and a "cover" badge on the
  first, and an "Add photos" → "Add more" tile that DISAPPEARS at
  30/30 (overflow silently dropped); the project chip renders a
  40px `opacity-85` thumb AFTER the name. The cap is the
  single-source `MAX_PROJECT_PHOTOS = 30` (studio-domain.ts) — do not
  "fix" any of these toward simpler chrome; every line was measured
  on the live with real uploads. Pinned by
  `photo-surface-fidelity.test.ts`.
- **The Server Action body cap is 12mb (r30)** —
  `experimental.serverActions.bodySizeLimit: "12mb"` in next.config.ts
  carries the 30-photo contract (30 × 400k-char data URLs + JSON
  slack). The default 1mb cap rejected many-photo submits through the
  real UI ("Body exceeded 1 MB limit") — a latent defect since the
  first photo support (the live never hits a transport limit; its
  photos upload to S3 outside the form save). Do NOT lower it.
  Pinned by `photo-surface-fidelity.test.ts`.
- **The import PRESERVES the payload's timestamps and honors its isNew
  (r32)** — measured on the live: an import's crafted
  `createdAt`/`updatedAt` come back VERBATIM on re-export (the live
  stores the payload's stamps — it does NOT stamp now()), and the
  in-session badges honor the payload's `isNew` flag (`true` items
  badge immediately after import, `false` items never badge — an
  unconditional session marking was the wrong first reading). The
  clone's import now does both: the normalizer always emits
  `createdAt`/`updatedAt`/`isNew` per item (a bogus stamp degrades
  to the DB default), the action's creates carry the stamps, and the
  action returns `{ createdProjects, createdSupplies }` — each
  created id with its payload isNew flag — from which studio-app
  marks the session registry. The stamp preservation also fixes the
  chip ORDER for identical-timestamp payloads (the live's
  `updatedAt DESC` sort keeps insertion order; the clone's old
  now()-stamping inverted it). Pinned by `export-payload.test.ts` +
  `studio.test.ts` + the validation gate's declared fields.
- **The export's absent subcategory is `""`, not null (r32)** —
  measured on live exports: a UI-created supply with no subcategory
  exports `subcategory: ""` (the live's in-memory picker default,
  same family as budget/barcode), and an imported bare supply
  re-exports `""`. The clone previously exported `null`. Round-trip
  safe either way (the import normalizer folds `""` back to null).
  Pinned by `export-payload.test.ts`.
- **The budget-less edit input is EMPTY (r32 re-measure)** — the
  live's edit panel mounts its Estimated Budget number input with
  `value=""` when the project has no budget — measured for BOTH
  imported and UI-created budget-less projects. An early-round pin
  had `"0"`; the re-measure corrected it. `budgetEditValue(null)`
  returns `""`. Pinned by `studio-domain.test.ts`.
- **The thumb × buttons are hover-gated (r31)** — the project modal
  and edit panel's photo-thumb × buttons compute `opacity: 0` until
  the thumb's `group` is hovered (`opacity-0 group-hover:opacity-100
  transition hover:bg-ast-pink`); they are INVISIBLE in paired
  captures. The r30 element-isolation measurement missed the gating
  (isolated element shots bypass interaction state) — full-view
  paired captures are the ground truth for interaction-gated chrome.
  The supply modal's preview × is NOT gated (always visible). Pinned
  by `photo-surface-fidelity.test.ts`.
- **The NEW badges are SESSION-scoped, not time-windowed (r31)** —
  the live badges items created during the current SPA session
  (project chip, project detail h2, supply chip, supply detail h2)
  and drops EVERY badge on a page reload. Replicated by the
  in-memory registry in `src/lib/new-badge.ts` (`markCreatedThisSession`
  in both create flows, `isNewSessionItem(id)` at the four surfaces).
  The window-based `isNewItem`/`NEW_BADGE_WINDOW_MS` are GONE from
  studio-domain — do not reintroduce them; the EXPORT wire format's
  `isNew` flag is a separate measured surface (fresh items export
  `true`) and keeps its window as a private helper in
  export-payload.ts. The project chip name's `pr-10` is conditional
  on the badge (the supply chip's pr-12/pr-2 pattern). Pinned by
  `new-badge.test.ts`.
- **The supply EDIT panel's barcode input is pink (r31)** — the live
  styles its CREATE modal's barcode input blue (the scanner look:
  `border-blue-500/40 bg-black/30`) but its EDIT panel's barcode
  uses the panel's standard pink input class. The clone's edit panel
  originally reused the blue create style (a scaffold leftover;
  10584 hot px on the paired capture). Pinned by
  `photo-surface-fidelity.test.ts` + the re-measured r14 pin.
- **The supplies-view category tile ALWAYS opens the type tiles
  (r31, the F5 revert)** — measured cleanly three times (0 supplies,
  1 supply, and the flip test): the category click's destination is
  data-INDEPENDENT. An earlier "with data it opens the flat list"
  reading was an `agent-browser` same-URL no-op artifact — opening
  `/supplies` on the live (which pushes that route per view)
  silently preserves the current sub-view state. Measurement rule:
  navigate via the ROOT first, then the drawer. The trap is pinned
  in `supply-fidelity.test.ts` so the data-dependent rule cannot be
  re-derived from same-URL captures.
- **The chip lists render INSERTION order (r33)** — measured with
  three probe families on the deployed app: UI creates render creation
  order (newest LAST), edits never float or sink an item (every
  updatedAt-keyed sort ruled out in both directions), and an import
  whose first row carries the NEWER payload stamp renders that row
  FIRST (a createdAt sort would surface the 2010 row first — the
  backend order renders verbatim, no sort at all). The queries carry
  NO orderBy and the create handlers APPEND (never prepend — the
  in-session prepend inverted every UI-created row). The sidebar's
  RECENT rail keeps its own updatedAt-DESC ("recently touched")
  contract — a separate measured surface. Pinned by the behavioral
  action pins + `list-order-fidelity.test.ts`.
- **The supplies drill-down resets on the md-DOWN crossing only
  (r33)** — the boundary is exactly 768 (770 preserves, 760 resets);
  crossing back up preserves the mobile-drilled state; the projects
  view survives BOTH crossings (data-verified with a live chip probe).
  The clone replicates the one-way reset with a guarded matchMedia
  listener in supplies-view. Paired MOBILE captures must drill down
  AFTER the viewport change (a drill-then-resize sequence captures the
  live's post-reset grid against the clone's preserved list — the
  r33 battery's first mobile pairs read 36% apart on exactly this).
  Pinned by viewport-fidelity.test.ts's md-crossing block.
- **The live's post-r32 redeploy re-based the AA noise floor (r33)** —
  new asset hashes (byte-identical contents), dash pairs now measure
  ~3.7% (1280) / ~2.8% (390) any-pixel with 100% of below-topbar
  change at anti-aliasing level (≤10/765) and VLM-verified visual
  identity. Not drift, not a target: paired captures should expect
  ~2.5-5.5% sub-visible noise with ≤0.35% visible residue (the email
  band + the documented gradient rounding family).
- **The inspiration rail exists at TWO type scales (r28)** — the live
  renders its rail cards twice with DIFFERENT chrome: the sidebar
  drawer's copy at text-xs/`text-[10px]` and the inspiration view's
  copy at text-sm/`text-[11px]` (the clone mirrors the split with two
  real components — do not "unify" them). Within the drawer copy the
  live's OWN inconsistency is cloned verbatim: the Quote and
  Art-History titles carry `leading-snug` (16.5px) but the Partners
  title does NOT (text-xs's own 16px). Pinned by
  `rail-card-fidelity.test.ts`.
- **The inspiration detail panels are FOUR per-type contracts (r35)** — the
  live renders each family with its own chrome and structure: the quote
  panel `rounded-2xl border border-ast_turquoise/40 bg-[#0d0420] p-5` (NO
  top margin — it mounts inside the Artist Quotes section flush below the
  tile grid, gap 0), the spotlight panel `...border-ast_purple/50
  bg-[#0d0420] p-4 mt-3` (purple border, p-4, mounts as its own child of
  the feed container AFTER the whole spotlight section — the section's
  header + tiles stay visible — with a scrollIntoView block "nearest" that
  aligns the panel's bottom to the viewport's bottom), the history panel
  `...border-ast_lavender/40 ... p-5` (mounts after the timeline grid as
  a feed-container child, NOT nested in the grid), and the partner panel
  `...border-ast_blue/40 ... p-5` (a FLAT mb-2-header + #8D5CFF-title +
  body card). All four are plain `<div>`s (the r34 article-tag precedent).
  The spotlight panel carries the artwork GALLERY: a full-width main
  image (`w-full rounded-xl object-contain object-center mb-3` + inline
  `max-height: 16rem`) plus a `flex gap-2 mb-3` thumb strip of `w-12
  h-12` border-2 buttons (selected `border-ast_turquoise/60`) whenever
  the entry's `gallery` has more than one artwork — Kevin Lewis's five
  (byte-identical in public/assets since the initial commit, md5-verified
  r35) and Kim Wyatt's single external wixstatic image (no strip). The
  tag chips are SOFT PILLS (`text-[10px] uppercase tracking-wide
  bg-ast-lavender/10 text-ast-muted px-2 py-0.5 rounded-full` spans — NOT
  bordered list items), the citation renders as an underlined external
  link (`text-ast-turquoise/80 underline underline-offset-2`, target
  _blank) carrying the entry's `citationUrl`, the artwork caption
  composes three spans (title / " (year)" / " · author" —
  `splitArtworkCaption`), and the imageless history entries render the
  italic "Image unavailable · rights protected — search the web to
  discover this artist's work." notice. The live MARKS the open tile: the
  quote tile gains `border-ast_turquoise/60`, the spotlight tile's
  gradient goes full-opacity (`from-ast-electric-blue via-ast-purple
  to-ast-pink`, no hover tokens), and the today/timeline/partner cards
  gain `border-ast-lavender/60`/`border-ast-blue/60` + `ring-1
  ring-white/10` while dropping their hover. Pinned by
  `inspiration-view-fidelity.test.ts`; do NOT "unify" the panels or strip
  the selected states.
- **The TW3/TW4 space-y mechanics around INLINE children (r35)** — the
  live's citation stack (`mt-3 space-y-1` with a block P, the INLINE
  citation link, and the rights P) renders only ONE effective margin: the
  rights line's own `mt-1`. TW3's space-y puts margin-top on later
  children, which the inline link IGNORES; TW4's space-y emits
  margin-bottom on the preceding block, which IS effective — a naive
  clone renders the link 4px low. The clone therefore drops the stack's
  space-y entirely and keeps the rights' mt-1 as the measured gap (the
  class string matches the live's rights line exactly). The same family
  explains any future space-y stack that mixes blocks and inlines.
- **The chat send has NO length cap and its own failure copy (r35)** —
  measured on the live: the composer input carries NO maxLength attribute
  and a 600-character message posts VERBATIM (the probe is permanently on
  the live's wall — the AppSync auth rules allow read+create only, no
  delete). The scaffold-era `maxLength={500}` + the schema's
  `.max(500, "Message is too long (500 characters max).")` were initial-
  commit inventions, removed. The send-failure copy is "Could not send
  message." (the live's composer catch, bundle-verified) — the action's
  catch returns it instead of the generic INTERNAL flattening. The error
  `<p>` keeps its role="alert" (the documented a11y addition — the live's
  is a plain p). The live's chat errors CANNOT be driven offline:
  Amplify DataStore queues the mutation locally and the promise stays
  pending — the copy is bundle-pinned, not state-driven.
- **`find --name "Inspiration"` clicks the PARTNER rail card (r35)** —
  agent-browser's fuzzy name matching scores the sidebar rail's partner
  card (its body text contains "partner inspiration") ABOVE the INSPO
  stat tile (whose text is "INSPO 15 entries"). Every prior round's
  inspiration-desktop.png captured the PARTNER PANEL OPEN (the
  section-state navigation auto-expands it). The screenshot script now
  clicks the INSPO tile via a JS probe; any future inspiration
  navigation in a script or spec must do the same (or scope the find to
  the sidebar nav). Related: a load-time section navigation reaches BOTH
  of the live's twin content copies — paired MOBILE captures must drive
  the visible copy's state after crossing down (the r33/r34 methodology,
  re-hit this round at 14.2% on the first mobile pairs).

- **The studio is always dark** — shadcn semantic tokens (`--color-background`
  etc.) are pinned to the dark palette directly in `@theme`; there is no
  `.dark` class toggle.
- **The hover variant is UN-GUARDED (r13)** — globals.css carries
  `@custom-variant hover (&:hover);` because the live app's Tailwind v3
  compiles `hover:` utilities as plain `:hover` selectors (no media guard).
  Tailwind v4's default wraps them in `@media (hover: hover)`, which never
  engages on touch devices (the live's hover tints apply and stick on tap)
  and never renders in headless captures. Do NOT remove the override, and
  note the capture-methodology consequence: with the pointer resting on an
  element, the clone's hover styles now DO render in screenshots — paired
  captures must park the pointer at a neutral spot (or deliberately match
  pointer positions on both sides).
- **The header memory button is the hyphen-family exception (r13)** — the
  live's "✧ What was I working on?" button is the ONLY consumer of its
  HYPHENATED utility families (`ast-purple`/`ast-yellow`), which resolve
  the live's `:root` values, NOT the utility values our tokens pin: idle
  border `border-[#5b3fd3]/30`, hover trio `hover:border-[#f4f27a]/70
  hover:bg-[#f4f27a]/20 hover:text-[#f4f27a]` (literals — the second
  sanctioned exception alongside the login card's `border-[#5B3FD3]`).
  Every OTHER purple/yellow surface uses the utility families; do NOT
  "fix" the button to the utility tokens (pinned by
  `header-button-fidelity.test.ts`).
- **The Tailwind DEFAULT palette is pinned to the live's v3 values (r14)** —
  seven surfaces use DEFAULT-family classes (the Sign Out button's
  `border-pink-400/60`/`text-pink-200`/`hover:bg-pink-500/20`, the memory
  button's `text-pink-300`, the email gradient's `from-cyan-400
  via-blue-500 to-pink-500`, the barcode fields' blue focus trio, the chat
  error alert's `text-pink-300`), and TW4's re-derived oklch palette
  drifts from the live's TW3 values (up to 34/channel). The `@theme`
  block pins `--color-pink-200/300/400/500`, `--color-cyan-400`, and
  `--color-blue-400/500` to the live's v3 hex values, which makes the
  emitted utilities byte-identical to the live's compiled rules. A user
  `@theme` override REPLACES TW4's default emission entirely (no lab()
  re-declaration survives). Do NOT use other default-palette families
  without pinning them to the live's v3 values first, and do NOT convert
  the usage sites to literals — the class strings match the live DOM
  verbatim (pinned by `design-tokens.test.ts`).
- **The keyboard contract matches the live's no-affordance behavior (r15)** —
  the base layer authors NO outline color (the shadcn scaffold's
  `outline-ring/50` was removed): the live's compiled CSS has no
  universal outline-color rule, so every keyboard-focused element renders
  the BROWSER DEFAULT ring (computed `rgb(16,16,16)` in Chromium — a
  near-black band on the dark canvas). Do NOT re-add an authored focus
  ring; it renders a turquoise band the live never shows. Likewise the
  create modals have NO Escape-close and NO focus steal — the live's
  modal leaves focus on the trigger button and ignores Escape (only the
  ✕ button and the scrim click dismiss). `role="dialog"` + `aria-modal`
  stay (invisible semantics — the drawer-landmark precedent). Inputs keep
  their per-element authored focus chrome (the focus borders match the
  live byte-exactly). All pinned by `focus-fidelity.test.ts`.
- **The studio has NO entry animations (r17)** — the live renders every
  view, panel, modal, and the login card INSTANTLY: its CSSOM holds only
  Amplify-internal keyframes (loader/placeholder/liveness/spin), and a
  steady-state sweep finds zero animating elements. The scaffold's
  `@keyframes studio-fade-in` + `.studio-fade` (a 300ms fade-and-slide on
  thirteen surfaces) was removed — invisible in every steady-state pixel
  diff, which is why it survived fifteen parity rounds. Do NOT re-add
  mount/entry animations or a `prefers-reduced-motion` guard for them.
  The live's ONLY studio motion is the drawers' `transition-transform
  duration-300` slide and the TW3/TW4 `transition` utility's 0.15s hover
  tints — both pinned (`motion-fidelity.test.ts`, plus the E2E mobile
  suite's drawer-settle waits). Also accepted-documented: the clone's
  modal scrim floats at `z-[60]` (the live's is z-50) — unreachable in
  every reachable state because the drawer always closes before a modal
  opens (probed on both sides).
- **The app ships ZERO webfonts** (r8): the live's `document.fonts` is empty
  and its `InterVariable, "Inter var", Inter, -apple-system, …` stack
  resolves to system fonts on every machine. Do NOT re-introduce
  `next/font` — the self-hosted Inter build has wider advance widths than
  the live's resolution and visibly re-wraps text (pinned by
  `design-tokens.test.ts`).
- **The header logo must pass its intrinsic dimensions** (1068×269) to
  `next/image` with the `h-10 md:h-12 lg:h-14 w-auto max-w-[320px]
  object-contain` classes and NO inline style — an inline `height:auto`
  defeats the responsive classes and rendered the logo 320×81 at every
  viewport (r8; pinned by `login-fidelity.test.ts`).
- **Auth error chrome is two-tier (r9)**: SERVER errors (bad credentials,
  duplicate email — "User already exists", invalid reset code) render in
  the `AmplifyAlert` box (div[role=alert], flex row, 16px gap, px-4 py-3,
  bg #FCE9E9, the exact 24px warning-icon and 16px X-icon SVG paths, a
  50×34 "Dismiss alert" button that restores the no-error layout);
  CLIENT validation stays inline — the Cognito password-policy stack
  (`passwordPolicyViolations` in `src/lib/validation.ts`: one contiguous
  24px line per violated rule, ALL violations at once) and the
  "Your passwords must match" line. The forms use NATIVE validation
  (no suppressed validation; password inputs carry `required` only — the
  live has no min/maxLength attrs), and `signInSchema` NEVER policy-checks
  the password (the live submits and answers "Incorrect username or
  password."). All pinned by `login-fidelity.test.ts` + `validation.test.ts`.
- **The reset flow mirrors the live's Amplify views (r9)**: Forgot → email
  view; "Send code" with a valid email → the CONFIRMATION view (Code * /
  New Password / Confirm / Submit / Resend Code, content-width 35px link
  buttons). No mailer exists (ADR-003) — no code can ever be valid, so
  Submit answers with the live's exact "Invalid verification code
  provided, please try again." and Resend is a silent no-op. Do NOT
  reintroduce a support-notice dead end (the r8 mistake — the live has
  no such notice).
- **The chat panel is split, not nested** (r8): the community header sits in
  a `sticky top-4 z-10 mb-4 space-y-3` wrapper (its sticky displacement
  is what positions the header 16px into view — a static wrapper renders
  the whole column 16px high), and the chat card lives in a separate
  scroll container (`scrollbar-right max-h-[calc(100vh-16rem)] …` at
  desktop, plain `space-y-4` in the mobile drawer). The live has NO chat
  auto-scroll — do not re-add stickToBottom/scrollTop logic (pinned by
  `chat-fidelity.test.ts`).
- **The mobile drawer scrim is the live's shared chrome (r10)**: both
  drawers dim the page behind ONE scrim shape — `fixed inset-0 z-40
  bg-black/60 md:hidden` — with NO backdrop blur (the page dims, never
  blurs), z-40 (below the z-50 drawers), and instant mount/unmount
  (measured: the live's scrim is gone at click-time while the drawer
  still animates out; no transition-opacity fade). Pinned by
  `drawer-fidelity.test.ts`.
- **The closed drawers' `inert` + `aria-hidden` is the clone's KEPT
  improvement, NOT live parity (r18 correction)**: measured 2026-09-23
  with both drawers closed at 390×844 — the LIVE's off-screen panes carry
  NEITHER attribute and keep 10 (sidebar) / 3 (chat) focusable descendants
  tabbable and announced (its mobile reading order walks the closed
  drawers' content BEFORE the page content; Tab reaches invisible
  buttons). The clone's `inert={!open}` + `aria-hidden={!open}` pair
  (added r5) keeps closed drawers out of both the tab order and the a11y
  tree — the same invisible-semantics class as the chat's `role="log"`.
  Either attribute ALONE breaks the contract (aria-hidden alone leaves
  focusables keyboard-reachable; inert alone leaves the pane announced),
  so the PAIR is pinned (`landmark-fidelity.test.ts`, plus the E2E mobile
  suite's runtime check). Session_26's "matches the live exactly" list
  folded this in by mistake — this note is the corrected record.
- **The content pane is a single `<section>` under ONE `<main>` (r18)**:
  the LIVE nests an inner `<main class="col-span-7">` inside its outer
  `<main>` (two "main" landmarks — invalid HTML) and renders every view's
  content TWICE (a `hidden md:grid` desktop copy + a `flex md:hidden`
  mobile copy, one always `display:none`). The clone renders ONE
  responsive copy (the layout container flips `flex-col` → `md:grid
  md:grid-cols-12`) with the content pane carrying both the mobile
  margins and `md:col-span-7`. The announcement ORDER (header → sidebar →
  content → chat) is identical on both sides at both viewports — probed
  on the dashboard and the inspiration Feed — and the twin-copy/
  nested-main differences are invisible in every capture and in the a11y
  tree (the hidden copy is `display:none`). Accepted divergence, pinned
  by `landmark-fidelity.test.ts`; do NOT "fix" the clone toward the
  live's twin-copy structure. r26 NOTE — the live's two copies hold
  SEPARATE view-state instances (measured 2026-09-26: interactions on
  the desktop copy leave the mobile copy's sub-view at its own last
  state, and vice versa), so a viewport crossing mid-session surfaces
  whatever state THAT copy last held; the clone's single copy keeps one
  state across the crossing. This is a consequence of the accepted
  single-copy divergence (invisible in every steady-state capture —
  paired captures at different viewports must drive each side's visible
  copy to the same state first), not a defect to replicate.
- **Chat polling** (`studio-chat.tsx`) skips ticks when
  `document.visibilityState !== "visible"`; new messages render without
  scrolling anything (the live's behavior).
- **Editing is inline** — the detail panels' Edit buttons swap the panel
  for the edit form in the same chip-row slot (`project-edit-panel.tsx`,
  `supply-edit-panel.tsx`); the centered modals are CREATE-only, mirroring
  the live app's edit-in-place UX.
- **Photos are data URLs**, downscaled client-side to ≤ 1024px JPEG q0.8 and
  rejected if > 300 KB encoded — the server cap is
  `MAX_PHOTO_DATA_URL_LENGTH` (400,000 chars) in `src/lib/studio-domain.ts`,
  shared by the modal contract and every Zod schema that touches photos;
  don't change one side of that contract without the other.
- **Import replaces the studio** (delete + re-create) — it is a restore, not a
  merge. Export must stay byte-compatible with the original app's payload
  (`app: "AST Studio"`, `version: 1`, `title`/`subcategory` field names,
  numeric quantity trio, `supplyIds` relations — captured verbatim from a
  live export; see `src/lib/export-payload.test.ts` for the pinned shape).
- **`next.config.ts` has `ignoreBuildErrors: false`** — never flip it to ship;
  fix the types.

## Conventions that differ from defaults

- Strict TypeScript; `any` is avoided — use `unknown` at boundaries and parse
  with Zod.
- The seed (`scripts/seed.ts`) is existence-guarded per natural key — rerunning
  is a no-op. Demo credentials are documented in README (not secrets, but
  rotate before public deployment).
- Conventional Commits, atomic scope. Never commit `.env`, `db/*.db`,
  `node_modules`, or log files (`.gitignore` covers them; verify with
  `git status` before pushing).

## Pushing (main only, via SSH wrapper)

The canonical push path is `docs/ssh_git_wrapper_v3.py` with an externally
supplied deploy key — see `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`
for the full operator contract:

```bash
# gate first: bun run lint && bun run typecheck
git add -A && git commit -m "feat(scope): ..."
cat /secure/path/to/id_ed25519 | python3 docs/ssh_git_wrapper_v3.py --key-stdin
```

The wrapper materializes the key into a 0600 temp file outside the repo,
pre-flights auth with `git ls-remote`, pushes `HEAD:refs/heads/main`, then
shreds the key. Never commit a key; if one ever lands in the tree, rotate it.

## Environment

`.env.example` documents the single variable (`DATABASE_URL`, SQLite file
URL; relative paths resolve against `prisma/schema.prisma`, so
`file:../db/custom.db` = `<repo>/db/custom.db`). The resolution is
pinned by `src/lib/db-path.ts` (r16): Prisma's own handling is
runtime-dependent — the CLI and Node-side tooling resolve relative
`file:` URLs against the CWD (the DB silently lands outside the repo when
commands run from elsewhere) while bun resolves schema-relative — so the
app passes the resolved ABSOLUTE URL as `datasourceUrl`, and the
`db:*`/`dev`/`start` scripts prefix commands with
`DATABASE_URL="$(bun scripts/prisma-url.ts)"` to give the CLI the same
authoritative path. The `db/` directory is gitignored —
`bun run db:push && bun run db:seed` recreates it.

## Reference

- `README.md` — human onboarding (quick start, demo account, design tokens).
- `CLAUDE.md` — engineering standards and the implementation workflow.
- `Project_Architecture_Document.md` — full architecture reference (ADRs,
  data model, security model).
- `docs/artsupplytracker-dashboard.png` — the reference screenshot the UI was
  cloned from.
- `docs/session_49.md` — the r28 round record (the optimizer re-encode,
  the rail cards' type scale, the dev badge, and the link buttons'
  21px line pair).
- `docs/session_51.md` — the r29 round record (the 480-768 viewport
  band: the login card's fixed-480-from-480 handoff and the html/body
  overflow-x clip; the prod-mode battery verified 0.000% on all four
  probes).
- `docs/session_53.md` — the r30 round record (the sub-390 viewport
  audit: the login tab strip's label wrap at ≤330px and the Spotlight
  portrait's shrink-0 guard; the never-measured photo family — the
  supply modal's tile-swap preview, the project modal/edit panel's
  (N/30) counter + 5-col thumb grid + cover badge, the 30-photo cap,
  the project chip's thumb, and the 12mb Server Action body cap).
- `docs/session_55.md` — the r31 round record (the 16-state photo
  battery: the × hover-gating, the edit barcode's pink class, the
  session-scoped NEW badges with the in-memory registry, the chip
  name's conditional pr-10, and the same-URL navigation trap that
  produced — and then killed — the F5 data-dependent-category-rule
  misreading; the canonical regression and the prod-mode spot-check
  both clean).
- `docs/session_57.md` — the r32 round record (the import/export
  semantics pass: the payload-timestamp preservation that also fixed
  the chip-order inversion, the payload-isNew badge honoring with the
  created-id return shape, the absent subcategory's `""` emission,
  and the budget-less edit input's EMPTY re-measure; the
  full-page-capture flake that masqueraded as dashboard drift — the
  live's Art History gradient can fail to paint in
  captureBeyondViewport mode — and the live's post-reload
  imported-items refetch quirk, both documented as measurement
  artifacts, not clone behavior).
- `docs/session_59.md` — the r33 round record (the list-order and
  md-crossing pass: the insertion-order contract pinned with three
  probe families and fixed on BOTH layers — the queries' removed
  orderBy and the create handlers' prepend-to-append switch — plus
  the supplies drill-down's one-way md-crossing reset with the
  projects-survive asymmetry; the redeploy's new AA-noise baseline
  documented; the corrected mobile paired-capture methodology).
- `docs/session_61.md` — the r34 round record (the import-with-photos
  pixel pairs — all 8 converged, the r32 wire-format work renders
  pixel-identically on every photo-bearing surface — and the chat
  data states: the scroll geometry matching exactly wherever the data
  does, the message-wrapper `<article>`→`<div>` re-pin, the
  fractional-scroll trap with its content-aligned re-take, and the
  re-confirmed 6th-message data band).
- `docs/session_63.md` — the r35 round record (the inspiration overlay
  rebuild: the four per-type panel contracts with their chrome, mounts,
  galleries, selected states, citation links, and soft tag pills; the
  chat send contract's no-cap + failure copy; the TW3/TW4 space-y
  mechanics around the inline citation link; the fuzzy-find navigation
  trap that had every prior inspiration screenshot capturing the partner
  panel; and the 7th live chat message — the 600-char probe, permanent
  like the r27 one).
