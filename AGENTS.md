# AGENTS.md

Instructions for AI coding agents working in this repository. Every line answers: "would you get this wrong without being told?"

## Commands

Run from the repo root. Bun is the package manager — use `bun`, never `npm`/`yarn`/`pnpm`.

| Command | What it does |
|---|---|
| `bun run dev` | Dev server on :3000 |
| `bun run lint` | ESLint (next/core-web-vitals + next/typescript) |
| `bun run typecheck` | `tsc --noEmit`, strict |
| `bun run test` | Vitest — 271 tests: domain vocabulary, bundle-pinned status/condition style maps (incl. the two-state absent-vs-explicit "?"/"OK" pill and "✓ ok" icon branches), design-token literals (incl. the Tailwind-v3 radius scale, the zero-webfont InterVariable stack, and the r14 DEFAULT-palette pins — pink-200/300/400/500, cyan-400, blue-400/500 at the live's v3 values, with a TW4-drift negative and usage-site class-string pins), validation (incl. the normalized import gate, the Cognito password-policy rules, the permissive sign-in schema, and the live's quantity format gate), export/import wire format (incl. the empty-qty `qty:""` slot, the fraction `quantity:null` slot, the absent-vs-explicit status emission, and the empty-qty/explicit-ok import round-trip), rate limiting, the inspiration rail section resolver (incl. the live's inert "quote" / "spotlight-kevin-lewis" quirks), seeded chat-history fidelity (the live's five community messages byte-for-byte — the author's own typos, "KIm"/"brower", pinned so they cannot be silently "corrected"), login/header/chat-panel fidelity (the responsive logo's intrinsic 1068×269 aspect, the Amplify eye-toggle chrome, the invisible-typing input quirk, the tab strip's 2px top border, the sticky community header + scroll-container split, the absence of chat auto-scroll, the pale-pink dismissible Amplify alert box with its exact warning/X icon paths, the Cognito policy-rule stack, the Reset Password confirmation view, the content-width 35px link buttons, and the native-validation attribute set), drawer-scrim fidelity (the mobile drawers' shared `fixed inset-0 z-40 bg-black/60 md:hidden` scrim — no blur, below the z-50 drawers, instant mount/unmount), supply-surface fidelity (the create modal's INERT Stock Status select — it submits `condition: null` — the quantity format gate's exact copy, the edit panel's `?? "ok"` init, the chip's unconditional qty label, the detail panel's raw quantity), sidebar stat-tile fidelity (the ACTIVE view's tile carries its OWN accent pair — electric blue for Projects/Supplies, LAVENDER for Inspo — dropping the `#120724` card bg and hover classes while active, with constant inner text classes), header-button fidelity (the memory button's hyphen-family literal colors — idle border `#5b3fd3/30`, hover trio `#f4f27a` at `/70`/`/20`/solid, negative-pinned against the utility families — plus the `@custom-variant hover (&:hover);` override restoring the live's Tailwind-v3 plain-`:hover` semantics), focus & keyboard-contract fidelity (r15: NO authored outline color — the UA-default focus ring renders like the live's — and the create modals carry no Escape-close and no focus steal, while keeping `role="dialog"` + `aria-modal`), action layer (each action file runs against a throwaway SQLite DB, incl. the mid-import rollback contract and the mid-delete no-strand contract) |
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
URL; relative paths resolve from `prisma/schema.prisma`, so
`file:../db/custom.db` = `./db/custom.db`). The `db/` directory is
gitignored — `bun run db:push && bun run db:seed` recreates it.

## Reference

- `README.md` — human onboarding (quick start, demo account, design tokens).
- `CLAUDE.md` — engineering standards and the implementation workflow.
- `Project_Architecture_Document.md` — full architecture reference (ADRs,
  data model, security model).
- `docs/artsupplytracker-dashboard.png` — the reference screenshot the UI was
  cloned from.
