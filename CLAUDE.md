---
IMPORTANT: File is read fresh for every conversation. Be brief and practical.
project_type: nextjs-single-app
version: 1.0.0
last_updated: 2026-09-16
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
5. **VERIFY** — `bun run lint && bun run typecheck`, then browser-test the
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
- The app is permanently dark — shadcn semantic tokens are pinned to the AST
  dark palette in the same `@theme` block. No `.dark` toggling.
- Use the `ast-*` palette classes (`text-ast-lavender`, `border-ast-purple/35`,
  `bg-[#120724]` cards, `bg-[#050009]` canvas) — match the token table in
  README rather than inventing new colors.

### Data layer (Prisma + SQLite)

- Schema: `prisma/schema.prisma`. After edits: `bun run db:push` (dev) —
  there are no migration files; the schema is the migration.
- SQLite has no enums: string fields validated by Zod against
  `studio-domain.ts` lists. Add new vocabulary there first.
- Photos are JSON-encoded data-URL arrays on `Project.photos` / a single
  data URL on `Supply.photo` — client downscales to ≤ 1024px JPEG q0.8,
  ≤ 300 KB encoded; server enforces array/size caps in the Zod schemas.
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
| `bun run lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `bun run db:push` / `db:generate` / `db:seed` | Database lifecycle |
| `bun run build` / `start` | Standalone production build / serve |

### Testing Strategy

No automated test framework is configured yet (flagged honestly — see PAD
§8). The verification contract is the golden-path checklist, exercised in a
browser after every change:

1. Sign in / create account / sign out.
2. Create + edit a project (stats update immediately).
3. Add + edit a supply (category count, condition badge).
4. Chat send (message appears and survives reload — polling works).
5. Export Data → file downloads; Import JSON with it → success notice.
6. Mobile viewport: sidebar drawer opens/closes; community panel stacks.

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
  `role="dialog"` modals with `aria-modal` + Escape close + initial focus),
  visible focus rings via the `--color-ring` token, 44px touch targets on
  primary actions.

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
