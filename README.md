# AST Studio — Art Supply Tracker

![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black)
![React](https://img.shields.io/badge/React-19.2.3-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178c6)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.18-38bdf8)
![Prisma](https://img.shields.io/badge/Prisma-6.19.2-2d3748)
![License](https://img.shields.io/badge/license-proprietary-dark)

A studio assistant built by an artist, for artists — a full clone of the
[Art Supply Tracker](https://studiobeta.artsupplytracker.com/dashboard/) artist beta,
rebuilt as a single Next.js application. Track supplies, projects, notes, and
creative workflows so you can spend less time searching and more time creating.

## Overview

Artists lose studio time hunting for supplies, remembering what a project
needed, and re-finding inspiration. AST Studio solves this with three
workspaces — **Projects**, **Supplies**, and **Inspiration** — wrapped in a
community chat panel, all on one dark, neon-accented dashboard. The original
production app is a Vite SPA on AWS Amplify (Cognito auth, AppSync GraphQL);
this clone reproduces its UI and behavior on a self-contained Next.js 16 stack
(Prisma + SQLite, Server Actions, session-cookie auth) so it runs anywhere
Node runs, with zero cloud dependencies.

## Key Features

| Feature | What it does |
|---|---|
| 🔐 Auth gate | Sign In / Create Account tabs, show-password toggles, the live's full Amplify error chrome — server errors (bad credentials, duplicate email, invalid code) in the pale-pink dismissible alert box, client validation inline (the Cognito password-policy rule stack + "Your passwords must match"), native browser validation — scrypt-hashed passwords, httpOnly opaque session cookies, per-IP sign-in rate limiting (5 attempts / minute), and the live's complete Reset Password flow (email view → Code/New Password confirmation view with the live's invalid-code rejection; no mailer exists, so no code can ever be valid — the honest simulation of the deployed behavior) |
| 🏠 Dashboard | "Today in the Studio" — Partner Spotlight, Art History, Artist Quote, Studio Spotlight cards; the Studio Spotlight card navigates to the inspiration Feed (the live's hardcoded section opens no panel); the header's ✧ memory button is inert, exactly like the live app |
| 🎨 Projects | Status columns (Planned / In Progress / On Hold / Completed), Needs Sorting bucket, create/edit modal with budget, notes, and photo attachments |
| 🗂️ Project detail panels | Click a project chip → detail panel with NEW badge, status pill, image well, budget, supply assignment ("Pick supply…" + Assign / × remove), Delete (with confirm), Edit Project — which swaps the panel for the live app's INLINE edit form in the same slot (single column, Planned-first status order, budget defaulting to 0). The sidebar's Recent Projects tiles focus a project the way the live app does: the "All Projects" list opens with that project's panel, and the focus is sticky — every later projects-view entry re-opens it (the live's focusRequest semantics) |
| 🖌️ Supplies | Category grid (Paint, Brushes & Tools, Pastels, Paper, Canvas & Board, Mediums, Other) with per-category counts, low-stock "!" indicators, condition tracking, barcode + location fields, project assignment |
| 🏷️ Per-category subcategories | The supply modal's Subcategory picker follows the category (Paint → Watercolor…, Brushes & Tools → Palette knives…, hidden for Other) with an "Other / Custom…" free-form input — exactly the live app's option lists and custom flow |
| 📋 Supply detail panels | Click a supply chip → detail panel (Category / Subcategory / Quantity / Location) with Delete (with confirm) and Edit Supply — which swaps the panel for the live app's INLINE edit form (pink chrome, Notes as a single-line input, distinct edit placeholders like "e.g., 2 or 1/2" / "e.g., 012345678901", "Add to Project" with the current-assignment chip) |
| 🔍 Stock filters | "All | Low Stock | Out of Stock" tabs on every supply list — Low Stock matches low AND critical, Out of Stock critical only (the live bundle's filter switch) — with the live app's "No supplies match this filter." empty state |
| ✨ Inspiration | Today / Art History / Inspire Me feed tabs, artist quotes, studio spotlights, partner placeholders (15 seeded entries); the sidebar's TODAY IN ART HISTORY and PARTNERS rail buttons auto-expand their detail panels on the Feed (the live's location-state sections), while QUOTE OF THE DAY and STUDIO SPOTLIGHT navigate without a panel — the live's inert sections, pinned by tests |
| 💬 Studio Chat | Community message wall with 5-second polling that pauses on hidden tabs |
| 📦 Import / Export | Round-trip JSON backup in the ORIGINAL app's wire format (`title`, `subcategory`, `quantityValue`/`qty`, `supplyIds`, `isNew`, unset `budget`/`barcode` as `""` — the live app's in-memory defaults) — live-app exports import here and vice versa; the legacy clone format imports too |
| 📱 Responsive | Desktop: three glass cards (sidebar / main / chat) in a 12-column grid, each rounded-3xl on the blurred `#0B0018` canvas with per-panel accent borders and internal scrolling; mobile: slide-in drawers with the "☰ Studio Tools" / "Chat ☰" toggle bar |

## Architecture

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Web framework | Next.js (App Router) | 16.1.3 | Single-route server-rendered shell |
| UI runtime | React | 19.2.3 | RSC-first with client islands |
| Language | TypeScript (strict) | 5.9.3 | Type-safe end to end |
| Styling | Tailwind CSS (CSS-first `@theme`) | 4.1.18 | AST design tokens as theme variables |
| UI primitives | shadcn/ui + Radix | bundled | Dialogs, selects, toasts |
| Database | SQLite via Prisma ORM | 6.19.2 | Zero-config persistence |
| Validation | Zod | 4.3.5 | Every action boundary |
| Runtime | Bun | ≥ 1.3 | Package manager + scripts |

```mermaid
flowchart LR
    Browser -->|RSC payload| NextApp[Next.js App Router - single route]
    NextApp --> Shell[StudioApp client island]
    Shell -->|Server Actions| Actions[auth.ts / studio.ts]
    Actions -->|ActionResult&lt;T&gt;| Shell
    Actions --> Prisma[(Prisma Client)]
    Prisma --> SQLite[(SQLite - db/custom.db)]
    Shell -->|5s poll| Actions
    Shell -->|export| ExportLib[export-payload.ts - live wire format]
```

Mutations flow exclusively through **Server Actions** returning
`ActionResult<T>` unions — there are no REST endpoints for UI operations (the
lone route handler is a `/api` health probe). Export/import payloads are
built and normalized in `src/lib/export-payload.ts`, which emits and accepts
the original app's exact JSON shape.

## File Hierarchy

```
📂 prisma/            schema.prisma — 6 models (User, Session, Project, Supply, ChatMessage, InspirationEntry)
📂 public/assets/     Brand images (logo, portraits, artworks, ADC badge)
📂 scripts/           seed.ts — idempotent demo/bootstrap data
📂 src/
  📂 actions/         Server Actions: auth.ts (rate-limited sign-in), studio.ts (projects/supplies/chat/assignment/import)
  📂 app/             page.tsx (session-aware shell), layout.tsx, globals.css (@theme tokens)
  📂 components/
    📂 studio/        Login, shell, sidebar, 4 views, chat, 2 modals, 2 detail panels
    📂 ui/            shadcn/ui component set
  📂 lib/             db, auth (scrypt + sessions), result (ActionResult), validation (Zod), dto, studio-domain, inspiration, export-payload, rate-limit
📂 docs/              SSH push wrapper + operator runbook, reference prompts
📂 .github/           verify-gate workflow (lint + typecheck + test + build on every push)
```

## Quick Start

Requires Node.js ≥ 20 (or Bun ≥ 1.3).

```bash
bun install                 # or: npm install
cp .env.example .env        # DATABASE_URL for SQLite
bun run db:push             # create the schema in ./db/custom.db
bun run db:seed             # demo account + community content (idempotent)
bun run dev                 # http://localhost:3000
```

**Verify setup:** the login screen renders with "Join the Art Supply Tracker
Artist Beta". Sign in with the demo account below — the dashboard shows
`PROJECTS 0 · SUPPLIES 0 · INSPO 15 entries` and the Studio Chat history.

### Demo Account

| Field | Value |
|---|---|
| Email | `demo@artsupplytracker.com` |
| Password | `StudioDemo2026!` |

The demo account ships with an empty studio (matching the original beta's
fresh state) and the seeded community content. Create your own account via
the **Create Account** tab — registration is fully functional. This is a
documented demo credential, not a real secret; change it or delete the user
before exposing any public deployment.

## Environment Variables

| Variable | Required | Description | Default |
|---|---|---|---|
| `DATABASE_URL` | yes | SQLite file URL — relative paths resolve from `prisma/schema.prisma` | `file:../db/custom.db` |

## Testing & Quality

```bash
bun run lint        # ESLint (next/core-web-vitals + next/typescript)
bun run typecheck   # tsc --noEmit (strict)
bun run test        # Vitest — domain vocabulary, bundle-pinned style maps, validation (incl. the normalized import gate), export/import wire format, rate limiting, action layer (temp SQLite)
bun run dev         # then exercise the flows below (or run the smoke suite)
```

`python3 scripts/smoke_functional.py` drives the golden paths in a real
browser (via the `agent-browser` CLI): sign-in, supply create → list,
away-and-back → category grid, stock filters, chip detail panels,
native-confirm deletes, project CRUD, the Recent Projects focus flow
(rail click → list + panel, sticky across away-and-back — the live
app's focusRequest semantics), the inspiration rail panels, and the
import/export surface — leaving the studio pristine. It doubles as the
regression suite for the post-create navigation contract.

Automated tests (Vitest, 229 tests) pin the studio-domain vocabulary
(per-category supply subcategory lists in the live app's tokens), the
production bundle's status/condition style maps (project status pills,
chip borders with per-status hover/selected treatments, supply condition
pills incl. the two-state absent-vs-explicit "?"/"OK" rendering, the
detail-panel condition icon ternary incl. the "✓ ok" branch, and the
stock-filter switch where Low Stock matches low AND critical), the
design-token literals (the live bundle's compiled utility ground truth),
the Zod boundary contracts (photo data-URL caps, the Other/Custom
free-form subcategory flow, the normalized import gate, the Cognito
password-policy rules, the permissive sign-in schema, and the live's
quantity format gate with its exact error copy), the export/import wire
format (live-app shape with `title`/`subcategory`/`supplyIds`/numeric
quantities — incl. the empty-qty `qty:""` slot, the fraction
`quantity:null` slot, and the absent-vs-explicit status emission — plus
the legacy clone shape and the empty-qty/explicit-ok import round-trip),
the sign-in rate limiter, the inspiration rail section resolver
("art-history-today" / "partner" expand their panels; "quote"
and the hardcoded "spotlight-kevin-lewis" are the live's inert
sections), the seeded community-chat fidelity (the live history's five
messages pinned byte-for-byte — the live author's own typos, "KIm" and
"brower", included and guarded against silent "correction"), the login +
header + chat panel fidelity (file-content pins on the live's measured
Amplify geometry: the responsive logo's intrinsic 1068×269 aspect, the
Tailwind-v3 radius scale, the zero-webfont InterVariable stack, the sticky
community header + scroll-container split, the eye-toggle's
input-segment chrome and near-invisible #0d1a26 icons, the invisible-typing
input quirk, the tab strip's 2px gray/turquoise top border, the
pale-pink dismissible Amplify alert box with its exact warning/X icon
paths, the Cognito policy-rule stack, the Reset Password confirmation
view, the content-width 35px link buttons, and the native-validation
attribute set), the drawer-scrim fidelity, the supply-surface fidelity
(the create modal's inert Stock Status select, the quantity format
gate's exact copy, the edit panel's `?? "ok"` condition init, the
chip's unconditional qty label, and the detail panel's raw quantity
rendering), and the full action surface
against a throwaway SQLite database (CRUD, ownership/IDOR checks,
assignment, import — including the mid-import failure that must roll back
without emptying the studio and the mid-delete failure that must not
strand supplies).

Manual verification checklist (the golden paths):
1. Sign in / create an account / sign out (6 rapid bad logins → throttled).
2. Create a project → sidebar stats update immediately ("active" counts
   In Progress only, matching the live app).
3. Add a supply (per-category subcategory picker) → the view switches to
   the supply list with "All | Low Stock | Out of Stock" tabs; category
   tiles show the "!" indicator for low/critical stock. Navigating away
   and back returns to the category grid (only the immediate post-create
   transition shows the flat list — the live app's behavior).
4. Click a supply chip → detail panel; Delete with confirm; Edit Supply.
5. Click a project chip → detail panel; assign supplies ("Pick supply…" →
   Assign / × remove); Delete with confirm; Edit Project.
6. Send a chat message → it appears and survives reload.
7. Export Data → downloads the original app's JSON shape; Import that file
   (or a live-app export) → "Import successful" and data restored with
   project↔supply assignments intact.
8. Projects tiles → breadcrumb sub-views (Series / Groups / status filters /
   Needs Sorting) with back navigation and singular/plural counts.
9. Supplies tiles → "Art Supplies › Paint" type tiles → type-filtered list.
10. Inspiration → quote carousel, spotlight / art-history / partner detail
    panels with artwork, citations, rights, and tags.
11. Mobile viewport: sidebar drawer opens/closes; "Chat ☰" toggles the
    community panel.

## Design System

| Token | Hex | Usage |
|---|---|---|
| `ast-turquoise` | `#2ec4b6` | Studio Tools label, projects chrome, Need help? card |
| `ast-cyan` | `#00e6ff` | My Studio heading, links, selected chip names |
| `ast-lavender` | `#b78bff` | Section eyebrows, muted headings, field labels |
| `ast-pink` | `#ff4db8` | Supplies chrome, community accents, primary CTAs |
| `ast-purple` | `#5a3a8e` | Card borders (25–40% opacity) — the live *utility* value (its `:root` `#5b3fd3` is vestigial) |
| `ast-blue` | `#4a69d6` | Utility buttons, quote text |
| `ast-electric-blue` | `#2e64ff` | Planned status, active tile states, quote text |
| `ast-coral` | `#ff7a7a` | Needs Sorting bucket, unknown-status fallback (the live *utility* value; `:root` `#ffe0cc` is vestigial) |
| `ast-yellow` | `#ffd5a8` | On Hold status, low-condition icon, Close/Cancel/Delete buttons (the live *utility* value; `:root` `#f4f27a` is vestigial) |
| `ast-orange` | `#ffb85c` | Warm accents |
| `ast-body` | `#fff4d6` | Body text (at 60–90% opacity) |
| `ast-faint` | `#9f7fd6` | Placeholders, timestamps |
| `ast-muted` | `#dcc7ff` | Secondary text |
| `ast-deep` / `ast-bg-dark` | `#0f1230` / `#14182b` | Panel wells, field surfaces |
| `ast-bg-primary` / `ast-bg-secondary` | `#121a5a` / `#1822a8` | Legacy canvas accents |
| Canvas / cards / drawer | `#050009` / `#120724` / `#0B0018` | Fixed surfaces (literal classes) |

Panel glow shadows (`shadow-ast-pink` / `-turquoise` / `-blue` / `-cyan` /
`-lavender` / `-warm`) reproduce the production bundle's 28px radial
blobs; two themed scrollbar rails (turquoise→blue for left panels,
pink→purple for right) ship as `.scrollbar-left` / `.scrollbar-right`.

**Typography:** ZERO webfonts ship (r8) — the live app's
`document.fonts` is empty and its `InterVariable, "Inter var", Inter,
-apple-system, …` stack resolves to system fonts on every machine, so the
clone's `--font-sans` mirrors that exact stack verbatim in an
`@theme inline` block. Do NOT re-introduce `next/font`: its self-hosted
Inter build has wider advance widths than the live's resolution and
visibly re-wraps text (pinned by `design-tokens.test.ts`).
Headline gradient: `linear-gradient(90deg, #00E6FF, #2E64FF, #8D5CFF,
#FF2FB3)`.

## Project Status

| Phase | Status | Key Deliverables |
|---|---|---|
| Clone build | ✅ Complete | Login, dashboard, projects, supplies, inspiration, chat, import/export |
| Parity remediation (r1) | ✅ Complete | Breadcrumb sub-views (projects/supplies), quote carousel + detail panels, live 15-entry seed with citations/rights/tags, modal label parity, Vitest suite |
| Parity remediation (r2) | ✅ Complete | Live data vocabulary (Paint/Brush/… categories, ok/low/critical conditions, per-category subcategories), supply + project detail panels with Delete, "All/Low Stock/Out of Stock" filters, supply assignment from the project panel, byte-compatible export/import with the original app's wire format, photo validation fix, active-stat fix, mobile "Chat ☰" toggle, sign-in rate limiting, action-layer tests, CI verify-gate workflow |
| Visual parity (r3) | ✅ Complete | Glass-card 12-column shell with per-panel accent borders, corrected brand tokens (purple/yellow/coral/orange + bg + glow shadows), per-view chrome (turquoise projects, pink supplies), bundle-pinned status pill/chip/condition style maps, rows-of-3 chip grids with in-row detail panels, gradient quote tiles, plain-purple chat avatars, native-alert import feedback, Inter via `@theme inline`, themed scrollbar rails (97 tests) |
| Parity remediation (r4) | ✅ Complete | Corrected brand tokens to the live *utility* values (purple #5a3a8e, yellow #ffd5a8, coral #ff7a7a — pinned by a new design-tokens test), inline Edit Project/Edit Supply panels replacing edit modals, Amplify-chrome login restyle (sharp #5B3FD3-bordered card, text tabs, 4px inputs, #FE5FA7 button, eye-icon switch), Other/Custom free-form subcategory flow, live unassigned-option copy, unset budget/barcode exported as "", chat-input and ✧-button accessible-name parity (109 tests) |
| Robustness remediation (r5) | ✅ Complete | Post-create supplies navigation parity (away-and-back → category grid; re-click keeps the sub-view), import hardening — `normalizedImportPayloadSchema` enforcement (array caps, string lengths, vocabulary enums) and single-transaction atomicity (a failed restore never empties the studio), "All <Category>" breadcrumb + empty-state parity (tabs hidden on empty lists, no create button in the filtered-empty state), `inert` on closed drawers, one chat poller per viewport, `pickToday` dedupe, import-alert refresh fallback, committed `scripts/smoke_functional.py` |
| Focus-flow parity (r6) | ✅ Complete | Recent Projects rail focuses a project like the live app ("All Projects" list + detail panel, sticky across away-and-back — the live focusRequest semantics, bundle-extracted and DOM-verified), the sidebar's TODAY IN ART HISTORY / PARTNERS rail buttons auto-expand their Feed panels (`resolveInspirationFocus` with the live's inert "quote" / "spotlight-kevin-lewis" quirks pinned by tests), the dashboard Studio Spotlight card navigates to the Feed; live account restored to the reference pristine state (131 tests, 23 smoke checks) |
| Seed-fidelity pass (r7) | ✅ Complete | Fresh full-surface recon (four-view + mobile VLM comparison of live vs clone — parity; all 15 inspiration entries, chat timestamps, and detail-panel content byte-verified against the live DOM; 23/23 smoke + all gates green) found one residual gap: the seeded chat history had silently "corrected" the live author's two typos. The seed now mirrors the live messages byte-for-byte ("KIm", "brower" — pinned by the new seed-fidelity test so they cannot drift again), local demo DB re-seeded and browser-verified (134 tests, 23 smoke checks) |
| Pixel-parity pass (r8) | ✅ Complete | Post-hydration DOM recon (the live renders different pre-hydration markup — steady-state measurements are the only ground truth) closed the last visual gaps: responsive header logo (intrinsic 1068×269 aspect, h-10/12/14 classes — header 88px desktop / 126px mobile, logo 222×56 / 159×40), Tailwind-v3 radius scale (rounded-lg/xl = 8/12px, not the scaffold's 16/20px — card histograms identical), zero-webfont font parity (the live ships no webfont; its InterVariable stack resolves to system fonts — the clone's self-hosted Inter had wider metrics that re-wrapped the Studio Memory text), the chat panel's sticky-header + scroll-container split (community rows at the live's exact coordinates), login Amplify chrome fidelity (equal-width tabs with the 2px gray/turquoise top strip, the eye toggle as the input's right segment with near-invisible #0d1a26 icons, #89949f borders, #9ca3af placeholders, the invisible-typing #0d1a26 input quirk, mobile h1 leading 1.25, Confirm-Password signup, Reset Password view, Amplify error copy), mobile chat drawer scrollbar parity, chat auto-scroll removal (the live has none) — 180 tests, 23 smoke checks, VLM parity on all views + login at both viewports |
| Error-state pass (r9) | ✅ Complete | Fresh full-surface recon (17 VLM comparisons + DOM spot-checks all PARITY — desktop/mobile views, sidebar drawer, login at both viewports) then an error-state deep-dive closed the auth-error chrome: server errors render in the live's Amplify alert box (bg #FCE9E9, 24px warning icon, 50×34 "Dismiss alert" button — byte-identical at (527,702) 414×58, wrapping to 72px, mobile (49,778) 292×72); the signup Cognito password-policy stack (every violated rule as its own contiguous 24px line — "Password must have at least 8 characters" / upper / lower / numbers / special — coexisting with the "Your passwords must match" line, both stacks DOM-identical incl. the card re-centering shift); the duplicate-email copy ("User already exists"); the complete Reset Password confirmation flow (Send code → Code * / New Password / Confirm / Submit / Resend Code view — card 480×485 with every element at the live's coordinates; Submit answers with the live's "Invalid verification code provided, please try again." — no mailer exists so no code can ever be valid, the honest simulation; Resend is a silent no-op); native form validation (no suppressed validation; password inputs required-only like the live); content-width 35px link buttons (Forgot 182px, Back to Sign In 127px, Resend Code 115px — the r8 51px forgot pin was a pre-hydration artifact). 202 tests, 23 smoke checks, all gates green |
| Drawer-scrim pass (r10) | ✅ Complete | Fresh recon on the r9 tree (9 VLM comparisons + DOM spot-checks + a live export-payload capture — all steady-state surfaces at parity; desktop chat structure, memory popover, and login card byte-identical) surfaced one residual chrome gap: the mobile drawer scrim. The live renders ONE shared scrim (`fixed inset-0 z-40 bg-black/60 md:hidden` — plain dim, NO backdrop blur, below the z-50 drawers, instant mount/unmount measured at click-time while the drawer still animates); the clone blurred the page behind the scrim (backdrop-blur-sm), floated it at z-50, and faded the sidebar's scrim. Fixed in `studio-app.tsx` + `studio-sidebar.tsx` and pinned by the new `drawer-fidelity.test.ts` (7 pins). Also re-confirmed as accepted: the mobile login card's 0.5px fractional offset (live 357px centered in its 358px column — Amplify internal responsive layout) and the live chat's prior-agent residue message. 209 tests, 23 smoke checks, all gates green |
| Supply-contract pass (r11) | ✅ Complete | A deep functional dive against the live (create/edit/export/import probes, every probe supply deleted, live left pristine) closed two HIGH-severity gaps in the supply contracts. QUANTITY: the live accepts an EMPTY quantity (stores "", chip renders the bare "qty" label, detail panel blank, export `qty:""` / `quantity:null` / `quantityValue:null`), validates the FORMAT (unparseable text is rejected with the exact copy "Enter a valid quantity, like 2, 1.5, or 1/2"), and its fraction exports carry `quantity:null` (plain-Number parse only) — the clone now mirrors all of it (`isValidQuantityInput`, wire-format fixes, import round-trips "" verbatim). CONDITION: the live's create-modal Stock Status select is INERT (created supplies carry no status, whatever the select showed — verified by creating one with "Low" selected), an ABSENT status renders the "?" pill + unlabeled "⚠️" detail glyph + status omitted in export, while an EXPLICIT "ok" saved through the edit panel renders the cyan "OK" pill + "✓ ok" icon + `status:"ok"` in export — the schema now models the two states (`condition String?`, null = absent; the modal submits null, the edit panel saves explicit values; import preserves the distinction). Also: `deleteProject` became atomic (detach + delete in one transaction), the README's stale `next/font` Typography paragraph was corrected to the zero-webfont contract, and the r10 accepted divergences were re-confirmed (nav-vs-aside drawer tag documented; the dev-mode Next.js badge + Geist font faces verified absent in the production build). Pinned by 20 new/adjusted tests incl. the new `supply-fidelity.test.ts` (6 source pins). 229 tests, 23 smoke checks, all gates green |
| Verification | ✅ Complete | Lint + typecheck + 229 tests + production build clean; VLM screenshot comparison of all four views (plus the mobile views, the sidebar drawer, and the login page at both viewports — including the error states and the reset-confirmation view) vs the live app (parity); 23-check functional smoke suite (CRUD, filters, panels, modals, navigation regression, focus flows) |
| Documentation | ✅ Complete | README, AGENTS.md, CLAUDE.md, Project_Architecture_Document.md |

Known intentional gaps (mirroring the original beta's placeholders): the
Partner Spotlight card and Inspire Me tab render "placeholder / coming soon"
states exactly like the production app.
