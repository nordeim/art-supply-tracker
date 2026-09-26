---
name: art-supply-tracker
description: "AST Studio — a pixel-perfect, behavior-exact clone of studiobeta.artsupplytracker.com: Next.js 16 + React 19 + Tailwind v4 CSS-first + Prisma/SQLite + Server Actions + scrypt cookie auth, verified by 362 vitest + 28 Playwright E2E specs and 27 rounds of live-site parity audits"
version: 1.0.0
last_updated: 2026-09-26
project_state: "r27 login-chrome pass verified (362 vitest + 28 E2E green); visual + functional parity with the live site re-confirmed (the create modals at 390x844 byte-exact, the duplicate-email alert byte-exact, the steady-state battery 0.22-0.97% mobile / 0.35-0.54% desktop); the login inputs' 16px/24px-on-8/16px font contract, the eye toggle's constant-name + sr-only aria-live contract, the reset EMAIL view's content-sized card, the reset forms' uniform p-8, and the below-md 357px card cap (the r10-accepted 0.5px centering reproduced byte-exact) all pinned; the paired-capture state-verification rule hardened"
audience: "engineers + AI agents extending, debugging, onboarding, or replicating the Art Supply Tracker clone"
tags: [nextjs16, react19, tailwind-v4, prisma, sqlite, server-actions, playwright, vitest, parity-clone, aws-amplify-ui]
---

# Art Supply Tracker — Master Engineering Skill

> **How to use this document.** You are an agent about to work on AST Studio. **Do not guess** — this file is the single source of every hard-won lesson that the codebase will not tell you by reading one file.
> - Building or styling UI → **§4 Design System + §5 Components + §17 Breakpoints + §19 Colors**
> - Database / seed / path problems → **§3 Bootstrapping + §9 Anti-Patterns + §10 Debugging**
> - Test failures (vitest or Playwright) → **§10 Debugging Guide** (the E2E failure taxonomy)
> - Shipping a change → **§11 Pre-Ship Checklist** (gates as bash, in order)
> - New feature or data shape → **§5 Architecture + §15 Patterns + §20 Interfaces**
> - Onboarding or "why this stack?" → **§1 Identity + §2 Stack + Appendix A**
> Every claim cites a file, a command, or a measured value that was executed. If it is not cited, treat it as unverified.

---

## Table of Contents

1. [§1 Project Identity & Design Philosophy](#1-project-identity--design-philosophy)
2. [§2 Tech Stack & Environment](#2-tech-stack--environment)
3. [§3 Bootstrapping & Configuration](#3-bootstrapping--configuration)
4. [§4 The Design System (Code-First)](#4-the-design-system-code-first)
5. [§5 Component Architecture & Patterns](#5-component-architecture--patterns)
6. [§6 The State Model (studio-app.tsx)](#6-the-state-model-studio-apptsx)
7. [§7 Content & Seeding](#7-content--seeding)
8. [§8 Accessibility Contracts](#8-accessibility-contracts)
9. [§9 Anti-Patterns & Common Bugs](#9-anti-patterns--common-bugs)
10. [§10 Debugging Guide](#10-debugging-guide)
11. [§11 Pre-Ship Checklist](#11-pre-ship-checklist)
12. [§12 Lessons Learnt & How to Avoid Them](#12-lessons-learnt--how-to-avoid-them)
13. [§13 Pitfalls to Avoid](#13-pitfalls-to-avoid)
14. [§14 Best Practices](#14-best-practices)
15. [§15 Coding Patterns](#15-coding-patterns)
16. [§16 Coding Anti-Patterns](#16-coding-anti-patterns)
17. [§17 Responsive Breakpoint Reference](#17-responsive-breakpoint-reference)
18. [§18 Z-Index Layer Map](#18-z-index-layer-map)
19. [§19 Color Reference (Complete)](#19-color-reference-complete)
20. [§20 The Complete TypeScript Interface Reference](#20-the-complete-typescript-interface-reference)
- [Appendix A — Parity Audit History (r1–r27)](#appendix-a--parity-audit-history-r1r27)
- [Appendix B — The Live-Site Validation Method](#appendix-b--the-live-site-validation-method)
- [Quick Reference Card](#quick-reference-card)

---

## 1. Project Identity & Design Philosophy

**One sentence.** AST Studio is a **production-grade, behavior-exact clone of https://studiobeta.artsupplytracker.com/dashboard/** — the artist's studio assistant (supplies, projects, inspiration feed, community chat) — built as a single-route Next.js App Router client app over Prisma/SQLite Server Actions, where "done" is defined as **measured parity with the live site**, not as a feature list.

**Design thesis.** The live app is an AWS Amplify-deployed SPA with a dark cosmic-glass aesthetic: a blurred `#0B0018` canvas (`backdrop-blur-xl`) behind rounded-3xl glass cards, neon accent families (turquoise/cyan/purple/lavender/pink/electric-blue), 28px neon glow shadows, gradient text headlines (`linear-gradient(90deg,#00E6FF,#2E64FF,#8D5CFF,#FF2FB3)`), and the live's Amplify login chrome reproduced down to its 2px tab strip, near-invisible `#0d1a26` eye-toggle icons, and pale-pink dismissible alert box. The clone pins ALL of it at the **compiled-utility ground truth** — token values were extracted from the live's deployed CSS/JS, never eyeballed (§4, Appendix B).

**The parity discipline (what makes this project unlike a normal app).**

| Rule | Why | Where enforced |
|---|---|---|
| **The live site is the only spec.** No "improvements", no added affordances (no Escape-close, no focus steal, no auto-scroll) | The user asked for a clone; every added behavior is a divergence | 16 fidelity test files in `src/lib/*.test.ts` |
| **Steady-state measurements only** — the live renders different pre-hydration markup; only post-load DOM is ground truth | Pre-hydration probes produce phantom divergences | r8 lesson, Appendix B |
| **Byte-for-byte seeds** — the live chat history includes the author's typos ("KIm", "brower"); correcting them is a regression | The seed mirrors the live data exactly | `seed-fidelity.test.ts` |
| **The ALL-CAPS look is CSS `uppercase`** — accessible names carry the DOM's mixed-case text | Playwright role matching on uppercase names silently fails | `e2e/*.spec.ts`, §10 |
| **Two parallel Tailwind color families on the live** — underscored utilities + hyphenated `ast-purple`/`ast-yellow` (only on the memory button) | The hyphen family resolves different `:root` values | `header-button-fidelity.test.ts` (r13) |
| **Tailwind v3 values, v4 engine** — TW4 re-derived its default palette in oklch; seven default-family tokens are pinned to the live's v3 values | `pink-400` drifted #fb64b6 vs #f472b6 — sub-threshold in captures | `design-tokens.test.ts` (r14) |

**Non-goals (intentional placeholders mirroring the beta):** the Partner Spotlight card and the Inspire Me tab render "placeholder / coming soon" states exactly like the production app; there is no mailer (the Reset Password flow honestly rejects every code — the deployed behavior).

---

## 2. Tech Stack & Environment

> **Lock discipline:** `package.json` + `bun.lock` — install with `bun install` only. Bun is the package manager AND the script runtime; never `npm`/`yarn`/`pnpm`.

| Layer | Pinned | Notes |
|---|---|---|
| Framework | Next.js `^16.1.1` (App Router, Turbopack dev) | Single route `/` renders the whole studio (SPA-style client state, no view routing) |
| UI runtime | React `^19.0.0` | Client components everywhere except the root page (server shell) |
| Styling | Tailwind CSS `^4` + `@tailwindcss/postcss` | **CSS-first config** — no `tailwind.config.js`; all tokens live in `@theme` inside `src/app/globals.css` |
| Data | Prisma `^6.11.1` + SQLite | `prisma/schema.prisma`; `db push` (no migrations dir — `db:migrate`/`db:reset` are vestigial) |
| Auth | hand-rolled: scrypt + httpOnly opaque cookie | `src/lib/auth.ts`; per-IP sign-in rate limit 5/min (`src/lib/rate-limit.ts`) — a PINNED contract |
| Validation | Zod `^4` | `src/lib/validation.ts` — every action input |
| Unit tests | Vitest `^5.0.1` | node env, `@/` alias, `src/**/*.test.ts` — **283 tests** |
| E2E tests | `@playwright/test` `^1.63.0` | chromium-1243; **25 specs**; serial 1-worker |
| Icons | `lucide-react` | |
| Misc | `date-fns`, `sonner`, `clsx` + `tailwind-merge` (`cn`) | The shadcn scaffold (`components/ui/`) is present but DEAD — no primitive is imported; its base rule was partially neutered (r15, §9) |

**Environment surface (one variable):**

| Variable | Required | Contract |
|---|---|---|
| `DATABASE_URL` | yes | SQLite `file:` URL. RELATIVE paths resolve against `prisma/schema.prisma` — `file:../db/custom.db` = `<repo>/db/custom.db` — **regardless of runtime or CWD** (see §3, the r16 contract). Absolute and non-file URLs pass through unchanged. |

No secrets exist at runtime (no mailer, no OAuth, no webhooks). The demo account (`demo@artsupplytracker.com` / `StudioDemo2026!`) is documented, seeded, and NOT a secret.

---

## 3. Bootstrapping & Configuration

```bash
bun install                          # deps
cp .env.example .env                 # DATABASE_URL="file:../db/custom.db"
bun run db:push                      # schema → <repo>/db/custom.db
bun run db:seed                      # demo user + 5 chat messages + 15 inspiration entries
bun run dev                          # http://localhost:3000
```

**The SQLite path contract (r16 — read this before touching anything DB-side).**
Prisma's own relative-`file:` resolution is **runtime-dependent**: the CLI and Node-side tooling resolve against the CWD (the DB silently lands OUTSIDE the repo when commands run from elsewhere) while the bun runtime resolves schema-relative. Two runtimes, two database files. The fix is a single resolution layer, `src/lib/db-path.ts`:

- `resolveDatabaseUrl()` — the RUNTIME resolver (`src/lib/db.ts` passes it as PrismaClient's `datasourceUrl`): reads `process.env.DATABASE_URL` only; relative `file:` URLs are anchored to `prisma/schema.prisma` via `schemaDir()` (module-anchored first — `import.meta.url` survives Turbopack dev — then an `AST_PRISMA_DIR` escape hatch, then a bounded CWD walk). Absolute and non-file URLs pass through unchanged (the action-layer temp DBs set absolute throwaway URLs before dynamic import).
- `resolveRepoDatabaseUrl()` — the REPO-TOOLING resolver (seed, `scripts/prisma-url.ts`): prefers the repo's OWN `.env` value over an inherited absolute `DATABASE_URL`, so a workspace shell that exports one cannot relocate the database; falls back to the process env when the repo `.env` is absent (CI).
- The `db:*`/`dev`/`start` scripts in `package.json` prefix the CLI with `DATABASE_URL="$(bun scripts/prisma-url.ts)"` — a real env var beats `.env` in the Prisma CLI, making the override authoritative per-invocation.

Pinned by `src/lib/db-path.test.ts` (12 tests). The `db/` folder is gitignored; `bun run db:push && bun run db:seed` recreates it. The seed runs under **plain `bun`** (`bun scripts/seed.ts` — no tsx, no network fetch; it uses only relative imports).

**Config files:** `next.config.ts` (standalone output), `tsconfig.json` (strict, `@/` → `src/`), `eslint.config.mjs` (next/core-web-vitals + next/typescript), `postcss.config.mjs` (`@tailwindcss/postcss`), `vitest.config.ts`, `playwright.config.ts` (see §11 for the project matrix).

---

## §4 The Design System (Code-First)

All tokens live in ONE place: `src/app/globals.css` `@theme` block. There is no `tailwind.config.js`. The live site's compiled utilities are the ground truth — token values were extracted from the deployed CSS, and the fidelity tests re-pin them on every run.

**Accent families (the `ast-` prefix, from `globals.css:33-50`):**

| Token | Value | Used for |
|---|---|---|
| `--color-ast-turquoise` | `#2ec4b6` | projects chrome, focus borders, sidebar border |
| `--color-ast-cyan` | `#00e6ff` | counts, chip titles, cyan accents |
| `--color-ast-purple` | `#5a3a8e` | main card border, supply chips (the UTILITY value — the live's `:root` `#5b3fd3` is vestigial for this family) |
| `--color-ast-lavender` | `#b78bff` | form labels, Inspo active tile, community accents |
| `--color-ast-pink` | `#ff4db8` | supplies chrome, chat accents, auth button |
| `--color-ast-blue` / `--color-ast-electric-blue` | `#4a69d6` / `#2e64ff` | secondary accents / Projects+Supplies ACTIVE stat tiles |
| `--color-ast-coral` / `--color-ast-yellow` / `--color-ast-orange` | `#ff7a7a` / `#ffd5a8` / `#ffb85c` | On Hold / Completed-adjacent / warnings |
| `--color-ast-body` / `--color-ast-muted` / `--color-ast-faint` | `#fff4d6` / `#dcc7ff` / `#9f7fd6` | text hierarchy |
| `--color-ast-bg-primary` … `--color-ast-deep` | `#121a5a` `#1822a8` `#14182b` `#0f1230` `#1a2a6c` | background layers |
| `--color-background` | `#050009` | THE canvas (body) |

**Glow shadows (`globals.css:53-58`):** six 28px neon rings — `--shadow-ast-pink rgba(255,77,166,.55)`, `--shadow-ast-turquoise rgba(46,196,182,.45)`, `--shadow-ast-blue rgba(46,100,255,.45)`, `--shadow-ast-cyan rgba(0,230,255,.35)`, `--shadow-ast-lavender rgba(183,139,255,.4)`, `--shadow-ast-warm rgba(255,213,168,.35)`.

**Radius scale — Tailwind v3 values, NOT v4's:** the live is a TW3 app; `rounded-sm/md/lg/xl` = **2/6/8/12px** (TW4 would emit 4/8/12/16). Pinned by `design-tokens.test.ts` (r8). `rounded-3xl` (24px) is the glass-card radius; `rounded-2xl` (16px) the inner cards/chips.

**Typography — zero webfonts (r8):** the live ships NO font files; its `InterVariable` stack resolves to system fonts. The clone's `--font-sans` mirrors the stack (`globals.css`); `next/font` must NEVER be reintroduced — a re-introduced webfont re-wraps text (pinned).

**The r14 default-palette pins:** seven DEFAULT-family tokens are pinned to the live's v3 values in `@theme` because TW4 re-derived them in oklch — `pink-200 #fecdd868`… the set covers pink-200/300/400/500, cyan-400, blue-400/500 (usage: Sign Out border/text/hover, memory button text, the email gradient, the barcode focus trio, the chat error alert). A TW4-drift negative test guards them.

**The r13 hyphen-family trap:** the live carries HYPHENATED classes (`ast-purple`, `ast-yellow`) ONLY on the header memory button, resolving the live's `:root` values (idle border `#5b3fd3/30`; hover trio `#f4f27a` at `/70`/`/20`/solid). The clone writes them as literal arbitrary values; the underscored utility values must NOT leak in (negative-pinned).

**The r13 hover variant:** TW4 media-guards `hover:` (`@media (hover: hover)`) while the live's TW3 compiles plain `:hover` — on touch the live's tints stick on tap. `@custom-variant hover (&:hover);` in `globals.css` restores the live's semantics.

**The r15 focus contract:** NO authored outline color — the scaffold's `* { @apply outline-ring/50 }` was removed so every element renders the BROWSER DEFAULT ring like the live (computed `rgb(16,16,16)` in Chromium). `border-border` stays (inert). Inputs carry their own authored focus chrome (turquoise border + ring).

---

## 5. Component Architecture & Patterns

**The layer model (all paths `src/`):**

```
app/page.tsx                    server shell: fetches user + data, renders <StudioApp>
components/studio/studio-app.tsx THE app: layout grid + view state + drawers + community
components/studio/*-view.tsx    dashboard / projects / supplies / inspiration views
components/studio/studio-sidebar.tsx  stat tiles + Recent Projects rail + inspiration rail (desktop aside + mobile nav drawer)
components/studio/studio-chat.tsx    the community message wall (5s poll, role="log")
components/studio/*-modal.tsx   project-modal / supply-modal (create)
components/studio/*-panel.tsx   detail + INLINE edit panels (r4: no edit modals)
components/studio/login-screen.tsx  the Amplify chrome (tabs, eye toggles, reset flow)
actions/studio.ts               ALL mutations (Server Actions, Zod-gated, revalidate)
lib/studio-domain.ts            vocabulary + bundle-pinned style maps
lib/dto.ts, export-payload.ts   shapes + the byte-compatible wire format
lib/db-path.ts, db.ts           the r16 SQLite resolution layer
```

**The single-route model.** `/` is a server page that loads the user, projects, supplies, and inspiration, then hands them to `<StudioApp>` — a client component that owns ALL view state (`currentView`, `projectsSubView`, `suppliesSubView`, `openProjectId`, `sidebarOpen`, `chatPanelOpen`, modals…). There is no view routing, no URL state, no `useSearchParams` — "navigation" is state switches, which is exactly how the live SPA behaves. Server Actions mutate and `revalidatePath("/")`; the client state stays (the away-and-back contracts depend on this).

**The shell (studio-app.tsx:282-403).** `<main>` → header → 12-column grid (`md:grid-cols-12`): sidebar `md:col-span-3` (turquoise border), main card `md:col-span-7` (purple border, carries the "☰ Studio Tools / Chat ☰" toggle bar BELOW md), community aside `md:col-span-2` (pink border). Below md the sidebar and chat become fixed drawers (§18) over ONE shared scrim. The main card's `<section>` holds `<div className="studio-fade">{views}</div>` — every view swap animates through it.

**Golden interaction contracts (each pinned by tests + E2E):**

- **Post-create supplies navigation (r5):** create → the flat supply list; away-and-back → the category GRID; re-click on Supplies KEEPS the sub-view.
- **Recent Projects rail focus (r6):** rail click → the "All Projects" list + that project's detail panel, STICKY across away-and-back (the live's `focusRequest` semantics).
- **The projects view's top level is a TILE GRID** (All Projects / Series / Groups / 4 status tiles / Needs Sorting) — chips live in SUB-VIEWS, not columns; the detail panel renders directly below the selected chip's row (rows of 3).
- **The supplies view:** category grid → type tiles ("All Paint", Watercolor, …) → the filtered list with "All | Low Stock | Out of Stock" tabs (Low = low AND critical; Out = critical only). Tabs show only when the list has items; the filtered-empty state renders "No supplies match this filter." with NO create button.
- **Inline edit (r4):** Edit swaps the detail panel for the edit form IN THE SAME SLOT — no modal.
- **Native confirms:** every delete goes through `window.confirm` with the live's exact copy ("Delete this project? This cannot be undone.").
- **Modals have NO keyboard affordances (r15):** no Escape-close, no initial focus — the live's measured behavior. `role="dialog"` + `aria-modal` stay (invisible semantics).
- **Drawers ignore Escape (r10/r15).**

---

## 6. The State Model (studio-app.tsx)

`studio-app.tsx` is the one big client component (~500 lines). Its state, in rough groups:

- **View state:** `currentView: StudioView` ("dashboard" | "projects" | "supplies" | "inspiration"), `projectsSubView`/`suppliesSubView` unions (tile-grid null vs `all`/`series`/`groups`/`status`/`unsorted` vs `category`/`type`/`list`), `inspirationSection`.
- **Focus state:** `openProjectId`/`openSupplyId` + `editingProjectId`/`editingSupplyId` (the inline-edit swap) + the sticky `focusProject(id)` entry point the rail uses.
- **Chrome state:** `sidebarOpen`, `chatPanelOpen` (the mobile drawers), `projectModal`/`supplyModal`, the import alert text.
- **Data:** `chatMessages` (5s `setInterval` poll → `/api/chat` — ONE poller per viewport, r5) + the server-fetched props.

`navigate(view)` resets sub-views; `focusProject` navigates AND opens (r6). The `studio-fade` wrapper class animates view swaps. When adding a view or sub-view: extend the union in the owning view file, mirror the breadcrumb rendering, and add the E2E coverage — the away-and-back contracts are the regression surface.

---

## 7. Content & Seeding

`scripts/seed.ts` (idempotent, plain `bun`): seeds the demo user (scrypt hash), 5 chat messages, and the 15 inspiration entries (deterministically REPLACED every run — delete + re-create). The chat block and demo user are existence-guarded by natural key.

**Fidelity pins that must never drift (`seed-fidelity.test.ts`):** the live history's five messages byte-for-byte — INCLUDING the live author's own typos ("KIm", "brower app for now"). Correcting them is a regression, not a fix.

The inspiration seed mirrors the live's 15-entry feed verbatim, including the detail payloads behind the overlay panels (quotes, citations, rights notices, tags — `detail` JSON parsed by `parseInspirationDetail` with schema-validated degradation to null). `pickToday` selects the art-history entry (most-recent-on-or-before with future fallback) and dedupes (r5).

The demo account (`demo@artsupplytracker.com` / `StudioDemo2026!`) is what the E2E setup signs in with. The live account (`sepnetflix2023@outlook.com`) is intentionally NOT replicated.

---

## 8. Accessibility Contracts

The live app is an Amplify SPA with modest a11y; the clone matches it EXACTLY — parity over conformance, with the invisible-semantics class kept where it costs nothing:

- **Landmarks:** `nav[aria-label="Studio tools"]` for the mobile sidebar drawer vs `aside` for the desktop column (the live's own tag split — nav-vs-aside is documented parity); `aside[aria-label="Community chat"]` for the chat drawer; the detail panels are `section[aria-label="Project|Supply details for {name}"]` (role=region — the E2E specs scope on these).
- **`inert` on closed drawers (r5):** `aria-hidden` alone leaves focusable children reachable — both drawers carry `inert={!open}`.
- **The chat history is `role="log"`** with the input placeholder-labelled ("Message..." — no `<label>`, the live's markup).
- **Login chrome:** labelled Email/Password fields, `required` native validation, the eye toggle as `role="switch"` "Show password", the error box `role="alert"` "Dismiss alert".
- **Focus (r15):** UA-default focus rings everywhere (no authored outline color); tab order verified 1:1 with the live (24 tabbables, same sequence); inputs' authored turquoise focus borders byte-exact.
- **Modals:** `role="dialog"` + `aria-modal` kept, but NO Escape-close and NO focus steal (the live's measured no-affordance contract).
- **Chips/tiles carry `aria-expanded`** reflecting the open panel.

---

## 9. Anti-Patterns & Common Bugs

Each entry is a real defect class this codebase hit, with its guard.

1. **Prisma relative-path trust (r16-F1).** Never let a consumer resolve `file:../db/custom.db` itself — the CLI is CWD-relative, bun is schema-relative, and an exported absolute `DATABASE_URL` hijacks both. ALWAYS go through `src/lib/db-path.ts` (`resolveDatabaseUrl` runtime / `resolveRepoDatabaseUrl` tooling) or the `prisma-url.ts` script prefix. Guard: `db-path.test.ts`.
2. **Uppercase accessible-name regexes (r16-E2E).** `getByRole("button", { name: /^PROJECTS/ })` finds nothing — the tiles' ALL-CAPS look is CSS `uppercase`; the accessible name is "Projects 0 0 active". Match the DOM text. Guard: the E2E suite.
3. **Role-name substring/case traps.** Playwright role matching is case-insensitive substring: "STUDIO CHAT" hits both the panel's "Studio Chat" h2 and the drawer's "STUDIO CHAT" h2; "Category" ⊂ "Subcategory"; a bare "Projects" regex hits the sub-view breadcrumb back-button. Use `exact: true`, `NEW`-prefix chip patterns, `Projects \d` tile patterns, or scope to a labelled region.
4. **`getByText` vs `getByRole` visibility semantics.** The chat body and the sidebar rail render in BOTH the desktop panel and the `md:hidden` mobile drawer — `getByText` matches both copies (strict violation), `getByRole` filters by visibility. Scope with `:visible` CSS, `getByRole("log")`, or a region.
5. **Geometry assertions before the 0.3s slide settles.** The drawers animate via `transform: translate` — a `boundingBox()` right after the click catches mid-flight values (x=363 vs 78). `waitForTimeout(450)` first, then measure.
6. **Tailwind v4 default-palette drift (r14).** TW4 re-derived the default palette in oklch; `pink-400` resolved `#fb64b6` vs the live's TW3 `#f472b6` — invisible in screenshots (sub-threshold), caught only by computed-style sweeps. The seven used default tokens are pinned in `@theme`. NEVER add an unpinned DEFAULT-family class — pin it first.
7. **Tailwind v4 `hover:` media-guard (r13-F2).** TW4 emits `@media (hover: hover)` guards; the live's TW3 compiles plain `:hover` (touch tints stick on tap). The `@custom-variant hover (&:hover);` override restores it — do not remove.
8. **The `@theme` chain drop.** Semantic tokens as `var()` chains inside `@theme` get dropped by the TW4 build — tokens are literal hex.
9. **Aligning to the live's `:root` variables.** Three of them are VESTIGIAL (the utilities that actually render carry different values). Ground truth = the live's COMPILED utility classes, measured on the steady-state DOM.
10. **Authoring affordances the live lacks (r15-F2 class).** Escape-close, focus steal, chat auto-scroll, backdrop-blur scrims — every "improvement" is a parity regression. Check the live's measured behavior first.
11. **Correcting the seed's "typos".** "KIm" and "brower" are the live author's own — pinned byte-for-byte.
12. **E2E residue cascades (r16-E2E).** A failing spec leaves its created row behind; the next run's `.first()` guards then click the WRONG row and every subsequent assertion rots. Cleanup through the real UI in EVERY spec; after a failed run, re-seed (`db:push + db:seed`) or delete `E2E Probe*` rows before the next.
13. **Turbopack corrupted cache (session_25's trap).** Symptom: pages hang while API routes respond. Fix: stop the server, `rm -rf .next`, restart. Do NOT debug phantom code first.
14. **Running repo scripts from outside the repo under bun.** Bun auto-loads the CWD's `.env` — a workspace-level `.env` with an absolute `DATABASE_URL` silently hijacks. Prefix with `DATABASE_URL="$(bun scripts/prisma-url.ts)"` or run from the repo root with the repo's own `.env`.
15. **Per-test E2E sign-ins.** The sign-in rate limiter (5/IP/min) is a PINNED contract — per-spec sign-ins self-throttle the suite. The setup project signs in ONCE and saves a `storageState`.
16. **`next dev` port drift.** The E2E webServer reuses an existing server on :3000 — make sure a stale server isn't serving an OLD tree when debugging "impossible" failures.

---

## 10. Debugging Guide

**Decision tree — pick the failure class first:**

| Symptom | First suspicion | Procedure |
|---|---|---|
| Page hangs, API routes respond | Turbopack cache corruption | Stop server → `rm -rf .next` → restart (13 in §9) |
| DB "empty" / data vanished | Wrong SQLite file (runtime split) | `ls db/` in the repo vs CWD-relative strays; curl `/api` (health probes the datasource); re-run through the `db:*` scripts |
| Vitest action tests fail with "DATABASE_URL not set" | The temp-DB env var didn't land before dynamic import | Check `beforeAll` sets `process.env.DATABASE_URL` to an ABSOLUTE temp `file:` URL BEFORE `await import()` of the actions |
| E2E "element not found" on a name you can SEE | Uppercase/substring/role trap (§9.2-4) | Dump `page.getByRole('button').all()` or read the error-context.md yaml; match DOM text; scope to a region |
| E2E strict-mode violation | Duplicate DOM copy (drawer/panel) | Scope (`:visible`, `getByRole("log")`, region) or `.first()` with a comment |
| E2E cascade of failures late in the run | Residue rows from an earlier failure | Delete `E2E Probe*` rows or re-seed; fix the FIRST failing spec |
| Pixel diff hot at ~1% | The documented accepted set | Compare against Appendix B baselines BEFORE treating it as real |
| CI never triggers | Workflow YAML | `python3 -c "import yaml; ..."` — the r16 corruption (`branches: ain]`) was invisible for rounds |
| Login E2E fails on 5th attempt | Rate limiter (pinned) | Wait 60s; never weaken the limiter |

**The E2E error-context workflow:** every failure writes `test-results/<spec>/error-context.md` with the full accessibility yaml — read THAT before re-running; it shows the real page state (which view, which drawer, which counts). `test-results/` is gitignored; `rm -rf test-results` between debugging runs keeps it honest.

**The parity-debugging method (Appendix B):** never trust a single capture — steady-state wait, neutral pointer, paired live+clone captures, pixel structural diff, VLM comparison, then DOM/computed-style probes for the flagged cluster. High diffs are usually capture-timing artifacts (live loading states, view mismatch, pointer hover).

**DB inspection one-liner:** `DATABASE_URL="$(bun scripts/prisma-url.ts)" bun -e "const {PrismaClient}=require('@prisma/client'); const db=new PrismaClient({datasourceUrl:process.env.DATABASE_URL}); db.project.count().then(c=>{console.log('projects:',c);return db.supply.count()}).then(c=>{console.log('supplies:',c);return db.\$disconnect()})"`

---

## 11. Pre-Ship Checklist

Run in order, from the repo root, all green before a commit is pushable (CI mirrors this in `.github/workflows/verify-gate.yml`'s two jobs):

```bash
bun run lint          # ESLint — zero errors
bun run typecheck     # tsc --noEmit, strict — zero errors
bun run test          # Vitest — 283/283
bun run db:push && bun run db:seed   # fresh demo studio for the E2E
bun run test:e2e      # Playwright — 25/25 (boots its own dev server)
bun run build         # standalone production build
git status --short    # no .env, no db/, no logs, no keys, no test-results/
```

Plus the browser-layer checklist: golden paths exercised (login → project CRUD → supply CRUD → detail panels → assign supply → delete with confirm → chat → export/import round-trip → breadcrumb sub-views → inspiration panels → mobile drawer); any chrome-level change → re-shoot `docs/screenshots/` (steady-state + neutral pointer); any style change → the fidelity tests already failed you if it drifted, read them.

**Playwright project matrix (playwright.config.ts):** `setup` (signs in once, saves `e2e/.auth/user.json`) → `chromium` (1536×844, storageState, ignores mobile-nav + setup specs) and `mobile-chromium` (390×844, storageState, matches ONLY mobile-navigation.spec.ts). Serial, 1 worker, 30s test timeout, `reuseExistingServer: !process.env.E2E_BASE_URL`. Target the standalone build with `E2E_PORT=3100 E2E_BASE_URL=http://127.0.0.1:3100 bun run test:e2e`.

**Pushing:** main ONLY, via `docs/ssh_git_wrapper_v3.py` (the deploy-key wrapper — key materialized outside the repo, pre-flight `git ls-remote`, push `HEAD:refs/heads/main`, key shredded). See `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`. Never commit a key.

---

## 12. Lessons Learnt & How to Avoid Them

1. **r16-L1 — "Documented" ≠ "implemented".** `.env.example` documented `src/lib/db-path.ts` that never existed; the DB silently landed outside the repo for 15 rounds. Lesson: docs make claims, the tree makes facts — validate doc claims against the code before trusting either.
2. **r16-L2 — Exit codes lie; state doesn't.** `prisma db push` exited 0 while writing the DB to the wrong directory. Verify the artifact's location, not the command's success.
3. **r16-L3 — The E2E suite is executable documentation.** Writing it surfaced six invisible DOM facts (the tile-grid top level, the dual chat copies, the breadcrumb collision, the CSS-uppercase trap) that weeks of manual testing hadn't. Write specs from the DOM, not from intuition.
4. **r15-L1 — Some divergences are invisible to the test method, not to users.** The focus ring, the Escape behavior, the touch-hover semantics — all real, all zero pixels in pointer-driven captures. Rotate probe DIMENSIONS (keyboard, hover, computed styles) when captures go quiet.
5. **r14-L1 — Sub-threshold ≠ zero.** 34/channel color drift summed to visible wrongness on seven surfaces. Computed-style sweeps catch what pixels don't.
6. **r8-L1 — The pre-hydration DOM is a mirage.** Measure steady-state only.
7. **r7-L1 — "Correcting" data is corruption when the spec is the bytes.** The seed typos.
8. **r5-L1 — State leaks across view switches are contracts.** The away-and-back flows pin the live's exact quirks (grid resets, sub-view persists, focus sticks).
9. **r16-L4 — A corrupt CI file fails silently.** `branches: ain]` = the gate never runs = zero protection for 15 rounds. Validate workflow YAML after ANY edit to it.
10. **r16-L5 — Cleanup discipline is a test-suite requirement.** A spec that leaks one row converts every later spec's `.first()` into a wrong-row click. Design the cleanup INTO the spec (through the real UI), and make the residue recoverable (re-seed).

---

## 13. Pitfalls to Avoid

- Do NOT resolve DB paths yourself anywhere — always `db-path.ts` / the script prefixes (§3).
- Do NOT add shadcn primitives into the tree — the scaffold is dead by design; styling is the `ast-` token vocabulary + fidelity pins.
- Do NOT use `tailwind.config.js` — the config IS `globals.css` `@theme`.
- Do NOT add an unpinned Tailwind DEFAULT-family class (§9.6) or a hyphenated `ast-*` class (§9's r13 trap).
- Do NOT weaken the rate limiter to make tests pass — use the storageState pattern.
- Do NOT parallelize the E2E suite — one shared SQLite file, serial by design.
- Do NOT introduce webfonts, `next/font`, Escape handlers, focus management, or chat auto-scroll — all measured live behaviors say no.
- Do NOT treat the live's `:root` CSS variables as the color truth (§9.9).
- Do NOT run `db:seed` via `tsx` — plain `bun`, no network fetch.
- Do NOT commit `.env`, `db/`, `e2e/.auth/`, `test-results/`, `dev.log`, or any `*.key` — all gitignored; keep it that way.

---

## 14. Best Practices

- **Tests-first for domain logic and actions** (red → green), the fidelity files as the pattern: pin the live's exact string/class/behavior, negative-pin the wrong value, strip comments before pinning source text.
- **Scope Playwright locators semantically**: labelled regions (`section[aria-label]`), `getByRole("log")`, `exact: true` for collision-prone names, `NEW`-prefix patterns for fresh chips, settle waits before geometry.
- **One poller per viewport** for the chat; every mutation goes through a Server Action with a Zod schema and `revalidatePath`.
- **Action-layer tests**: absolute temp `file:` URL set in `beforeAll` BEFORE dynamically importing the actions; mock `@/lib/auth`'s `requireUser`.
- **Atomic mutations**: `deleteProject` detaches + deletes in ONE transaction; import restore is single-transaction with rollback (a failed restore never empties the studio).
- **Capture discipline** (Appendix B): steady-state wait, neutral pointer, paired captures, structural diff, VLM, computed-style probes for flagged clusters.
- **Docs alignment on every remediation**: README status row + counts, AGENTS commands, CLAUDE testing strategy, PAD revision block + §7.1, `.env.example`, a session log — the repo's own convention (16 sessions of it).

---

## 15. Coding Patterns

**The Server Action shape** (`actions/studio.ts` — every action follows it):

```ts
"use server";
const parsed = schema.safeParse(input);           // Zod at the boundary
if (!parsed.success) return err(parsed.error);     // Result envelope, never throw
const user = await requireUser();                  // auth seam (mockable in tests)
// ... Prisma mutation(s), ideally $transaction([...]) for multi-step
revalidatePath("/");                               // single revalidate, client state persists
return ok(dto);
```

**The fidelity test pattern** (`src/lib/*-fidelity.test.ts`) — pin source text, comments stripped:

```ts
const source = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
expect(source).toContain("fixed inset-0 z-40 bg-black/60 md:hidden");  // the live's scrim
expect(source).not.toContain("backdrop-blur");                          // negative pin
```

**The E2E spec pattern** (`e2e/*.spec.ts`): `openStudio(page)` (storageState session) → act through accessible names → scope assertions to regions → clean up EVERY created row through the real UI with `acceptConfirms(page)`.

**The drawer contract** (r10/r15, pinned in `drawer-fidelity.test.ts` + `mobile-navigation.spec.ts`): ONE shared scrim `div.fixed.inset-0.z-40.bg-black/60.md:hidden` (plain dim — NO blur, below the z-50 drawers, INSTANT unmount at click-time while the drawer still animates out); drawers `fixed inset-y-0 z-50 w-4/5 max-w-xs` (312px at 390) with `transition-transform duration-300` and `inert={!open}`.

**The wire format** (`lib/export-payload.ts`): the ORIGINAL app's JSON shape — `title` (not name), `subcategory`, `supplyIds`, `qty: ""` slots, fraction `quantity: null`, absent-vs-explicit status emission — byte-compatible round-trip, pinned by `export-payload.test.ts`.

---

## 16. Coding Anti-Patterns

- Throwing from actions instead of the Result envelope (the client renders `result.error.message` in the live's alert chrome).
- Client-side derived truth for counts/totals — the stat tiles read server state post-revalidate.
- `selectOption` with a LABEL when the option VALUES differ (supply subcategory values ARE the labels here — but Category values are "Paint"/"Brush", not "Paint"/"Brushes & Tools").
- Asserting `not.toBeVisible()` on a locator that matches multiple nodes — use `toHaveCount(0)`.
- Measuring drawer geometry without the settle wait (§9.5).
- Reading `test-results/` from a PREVIOUS run while debugging (stale contexts lie) — `rm -rf test-results` first.
- Editing `package.json`/`bun.lock` by hand.
- Adding a view without its away-and-back contract test.

---

## 17. Responsive Breakpoint Reference

One breakpoint rules the app: **`md` (768px)** — everything is desktop-or-drawer.

| Surface | < md | ≥ md |
|---|---|---|
| Sidebar | fixed left drawer, `w-4/5 max-w-xs` (312px @ 390), slides `-translate-x-full` ↔ 0, `inert` closed | `aside` column `md:col-span-3` in the grid |
| Community chat | fixed right drawer (same geometry, `rounded-l-3xl`) | `aside` column `md:col-span-2` |
| Main card | full-width, carries the "☰ Studio Tools / Chat ☰" bar (`md:hidden`) | `md:col-span-7`, no toggle bar |
| Grid | stacked flex column | `md:grid md:grid-cols-12 md:gap-4` |
| Shell height | `min-h-screen` | `min-h-screen` — UNCAPPED like the live's: the grid row sizes to the chat column's intrinsic content (878px), the page grows past the fold and the window scrolls (r21; the scaffold's viewport-cap token is pinned out by `layout-fidelity.test.ts`) |
| Header | 126px, logo 159×40 | 88px, logo 222×56 |

**The parity viewports:** desktop captures/E2E at **1536×844**, mobile at **390×844** — always these; the documented baselines were measured at them.

---

## 18. Z-Index Layer Map

| Layer | Class | Where |
|---|---|---|
| Scrim (ONE shared, both drawers) | `z-40` `fixed inset-0 bg-black/60 md:hidden` | `studio-sidebar.tsx:71`, `studio-app.tsx:341/415` |
| Sidebar drawer | `z-50` | `studio-sidebar.tsx:85` |
| Chat drawer | `z-50` | `studio-app.tsx:354` |
| Modals | `z-[60]` | `project-modal.tsx` / `supply-modal.tsx:135` |

The scrim sits BELOW both drawers (the drawers float over their own dim layer — the live's exact stack, r10). No other z-index values exist in the studio layer.

---

## 19. Color Reference (Complete)

The `@theme` ground truth (`src/app/globals.css`), with the live's rendered checks:

| Token | Value | Live-verified usage |
|---|---|---|
| `ast-turquoise` | `#2ec4b6` | sidebar/main borders, focus borders, "Project" eyebrow |
| `ast-cyan` | `#00e6ff` | counts, panel headings |
| `ast-purple` | `#5a3a8e` | main card border, supply chips (UTILITY family) |
| `ast-lavender` | `#b78bff` | form labels, Inspo ACTIVE tile, "Supply" eyebrow |
| `ast-pink` | `#ff4db8` | supplies chrome, chat header, auth submit |
| `ast-blue` | `#4a69d6` | secondary accents |
| `ast-electric-blue` | `#2e64ff` | Projects/Supplies ACTIVE stat tiles |
| `ast-coral` | `#ff7a7a` | Needs Sorting |
| `ast-yellow` | `#ffd5a8` | Completed chrome, delete buttons |
| `ast-orange` | `#ffb85c` | warnings |
| `ast-body` / `ast-muted` / `ast-faint` | `#fff4d6` / `#dcc7ff` / `#9f7fd6` | text tiers |
| `background` | `#050009` | THE canvas |
| card surfaces | `#120724`, `#0B0018` (blurred glass), `ast-deep #0f1230` | panels |
| Gradient headline | `linear-gradient(90deg,#00E6FF,#2E64FF,#8D5CFF,#FF2FB3)` | view h1s |
| Memory button (hyphen family, r13) | idle `#5b3fd3`/30; hover `#f4f27a` /70 border, /20 bg, solid text | header only |
| Auth chrome | `#5B4FD3` card border, `#FE5FA7` submit, `#89949f` borders, `#9ca8af`→`#9ca3af` placeholders, `#0d1a26` invisible-typing, alert `#FCE9E9` | login |
| r14 DEFAULT pins | pink-200/300/400/500, cyan-400 `#22d3ee`, blue-400/500 | Sign Out, gradients, barcode focus, chat error |
| Glow shadows | six `0 0 28px` rings (§4) | panel chromes |

---

## 20. The Complete TypeScript Interface Reference

The DTO layer (`src/lib/dto.ts`) is the client's whole data surface; the Prisma models (`prisma/schema.prisma`) are its server mirror:

```ts
// dto.ts (client-facing)
type ProjectDto = { id, userId, name, status: "planned"|"in-progress"|"on-hold"|"completed",
  budget: string, notes: string|null, photos: string[], supplyIds: string[], createdAt, updatedAt }
type SupplyDto = { id, userId, name, category: "Paint"|"Brush"|"Pastel"|"Paper"|"Canvas"|"Medium"|"Other",
  subcategory: string|null, quantity: string, condition: "ok"|"low"|"critical"|null,
  location: string|null, notes: string|null, barcode: string|null, photo: string|null, createdAt, updatedAt }
type InspirationEntryDto = { id, type: "artist_quote"|"studio_spotlight"|"art_history"|"partner",
  title, body, sortOrder, detail: InspirationDetail|null, createdAt }
type ChatMessageDto = { id, author, body, createdAt }

// The domain vocabulary (studio-domain.ts)
SUPPLY_CATEGORIES: 7 (Paint 6 / Brush 7 / Pastel 4 / Paper 5 / Canvas 5 / Medium 6 / Other 0 subtypes)
PROJECT_STATUSES: planned | in-progress | on-hold | completed
StockFilter: all | low | out      // Low = low OR critical; Out = critical only
```

**Prisma models:** `User` (email unique, passwordHash scrypt, lastWorkedOn), `Project` (name, status, budget Float?, notes, photos String[] JSON, relation to User, cascade), `Supply` (name, category, subcategory?, quantity String, condition String? — NULL = absent, the r11 two-state contract), `ChatMessage`, `InspirationEntry` (detail String? JSON), `ProjectSupply` (the m:n assignment). `Session` rows back the opaque cookies.

**The wire format** (`export-payload.ts`): `{ app: "AST Studio", version: 1, projects: [{ title, status, budget: "", notes, supplyIds, qty, quantity, quantityValue }], supplies: [{ name, category, subcategory, status, qty, quantity, location, notes, barcode }] }` — the ORIGINAL app's shape (three-slot quantity semantics: `qty: ""`, fraction `quantity: null`, numeric `quantityValue`), byte-compatible round-trip.

---

## Appendix A — Parity Audit History (r1–r27)

Every round: fresh live recon → findings → TDD remediation → all gates → docs aligned. The full narrative lives in `docs/session_*.md`; the one-line ledger:

- **r1–r2** breadcrumbs, vocabulary, detail panels, wire format, rate limiting, action tests, CI gate.
- **r3–r4** glass shell + brand tokens (utility truth), inline edit panels, Amplify login restyle.
- **r5** navigation contracts, import hardening (atomicity), `inert` drawers, smoke suite.
- **r6** Recent Projects focus semantics + inspiration rail panels.
- **r7** seed fidelity (the typos) + full-surface VLM parity.
- **r8** pixel parity: logo aspect, TW3 radius, zero webfonts, login chrome deep-dive.
- **r9** error-state chrome: alert box, Cognito policy stack, reset flow.
- **r10** the shared drawer scrim (no blur, z-40, instant unmount).
- **r11** supply contracts: empty/fraction quantity, INERT Stock Status select, two-state condition.
- **r12** the ACTIVE stat tile's per-view accent pair (lavender for Inspo).
- **r13** hyphen-family colors + plain-`:hover` variant.
- **r14** the seven DEFAULT-palette v3 pins.
- **r15** focus/keyboard: UA-default ring, no modal affordances, 1:1 tab order.
- **r16** verification hardening: the db-path contract, the Playwright E2E suite, the CI repair.
- **r17** motion contract: no entry animations (the scaffold's studio-fade removed).
- **r18** landmark & reading order: the announcement order; the closed drawers' inert+aria-hidden pair kept; single-main structure.
- **r19** CSS compile hygiene: the skills/ exclusion (@source not), the selection/caret contract.
- **r20** login-motion + media contracts: the Amplify transition contract, the reduced-motion guard, the constant pending state, the forced-colors token strip; the Firefox matrix.
- **r21** app-shell height: the UNCAPPED desktop shell (the page grows past the fold and scrolls).
- **r22** the markdown exclusion (@source not "../../**/*.md") — the systemic fix for the every-round docs-token recurrence.
- **r23** the audited markdown-exclusion diff (nine dead rules + ten dead var emissions, all consumerless) + docs/DEPLOYMENT.md.
- **r24** the WebKit engine matrix (user-space GTK stack under Xvfb) + the auth-success scroll reset + slow-network/gradient probes.
- **r25** the sign-up pre-submission state machine (blur-gated per-field validation, the disabled gray chrome, the cursor contract) + the error/reset views pixel-baselined on three engines.
- **r26** the modal button-row + detail-heading chrome (the create modals' Cancel at 16px with the flex-stretch 42px row; the detail H2s as plain blocks with inline 18px NEW badges) + the twin-copy state-instance split documented.
- **r27** the login-chrome pass (the inputs' 16px/24px-on-8/16 metrics, the eye's constant name + sr-only aria-live announcement, the reset email view's content-sized card, the reset forms' p-8, the 357px below-md card cap) + the paired-capture state-verification rule (scrim DOM presence, drawer translate-x, scrollY, visible h1 — offsetParent is null for fixed elements).

Current baselines: pixel diffs 0.148–1.144% per pair on Chromium (the documented accepted set), fresh WebKit baselines 0.87–3.15% (symmetric engine noise), error/reset views 0.125–0.352% Chromium / 1.56–2.19% WebKit, 362 vitest + 28 E2E, 23/23 smoke (the r27 post-fix login captures: desktop 0.04%, mobile 0.14%).

## Appendix B — The Live-Site Validation Method

The method every round used (the template for any future parity work):

1. **Two browser sessions** (live + clone) at 1536×844 and 390×844, both authenticated, live account verified pristine (0/0/15).
2. **Steady-state waits** — the live is an async Amplify SPA; loading skeletons are NOT ground truth.
3. **Neutral pointer parking** — hover tints render since r13; park on a verified non-hoverable spot before every capture.
4. **Paired captures** (9 surfaces: desktop dashboard/projects/supplies/inspiration + the scrolled state, mobile dashboard/sidebar drawer/chat drawer, login).
5. **Pixel structural diff** — classify every hot cluster against the documented accepted set before treating it as real (live residue message, dev badge, oklab compositing, fractional rounding).
6. **VLM comparison** on every pair for semantic parity.
7. **DOM/computed-style probes** for anything flagged or invisible-in-captures (computed colors, tab order, focus styles, hover states).
8. **Functional probes**: export payload byte-identity, the 23-check smoke suite on the clone.
9. **Live left pristine** — every probe row deleted through the real UI.

## Quick Reference Card

```bash
# gates, in order
bun run lint && bun run typecheck && bun run test
bun run db:push && bun run db:seed && bun run test:e2e && bun run build

# the DB always at <repo>/db/custom.db
DATABASE_URL="$(bun scripts/prisma-url.ts)" <any prisma/bun command>

# E2E debugging
rm -rf test-results && bun run test:e2e      # fresh contexts
cat test-results/<spec>/error-context.md    # the real page state

# parity captures
python3 scripts/shoot_screenshots.py        # the 8 docs/screenshots surfaces

# residue recovery (a failed E2E run leaves its rows)
DATABASE_URL="$(bun scripts/prisma-url.ts)" bun -e "…deleteMany({where:{name:{startsWith:'E2E Probe'}}})…"
# or simply: bun run db:push && bun run db:seed
```

| Thing | Where |
|---|---|
| Tokens / design system | `src/app/globals.css` `@theme` |
| The app shell + state | `src/components/studio/studio-app.tsx` |
| Actions (all mutations) | `src/actions/studio.ts` |
| DB path contract | `src/lib/db-path.ts` (+ `scripts/prisma-url.ts`) |
| Wire format | `src/lib/export-payload.ts` |
| E2E specs | `e2e/*.spec.ts` (+ `playwright.config.ts`) |
| Fidelity pins | `src/lib/*-fidelity.test.ts` (10 files) |
| Smoke suite | `scripts/smoke_functional.py` (agent-browser CLI) |
| Session history | `docs/session_*.md` (42 sessions) |
| Push wrapper | `docs/ssh_git_wrapper_v3.py` + its SKILL doc |
