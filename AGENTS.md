# AGENTS.md

Instructions for AI coding agents working in this repository. Every line answers: "would you get this wrong without being told?"

## Commands

Run from the repo root. Bun is the package manager — use `bun`, never `npm`/`yarn`/`pnpm`.

| Command | What it does |
|---|---|
| `bun run dev` | Dev server on :3000 |
| `bun run lint` | ESLint (next/core-web-vitals + next/typescript) |
| `bun run typecheck` | `tsc --noEmit`, strict |
| `bun run test` | Vitest — 82 tests: domain vocabulary, validation, export/import wire format, rate limiting, action layer (each action file runs against a throwaway SQLite DB) |
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
  status/category/subcategory/condition are strings validated against the
  single-source lists in `src/lib/studio-domain.ts`: category tokens are the
  live app's singular values (`Paint`, `Brush`, `Pastel`, `Paper`, `Canvas`,
  `Medium`, `Other`), conditions are `ok | low | critical`, and supply
  subcategories come from the per-category `SUPPLY_TYPE_LISTS` (the supply
  modal's picker is category-scoped; "Other" hides it). Never accept
  free-form values for them.
- **Auth seam:** `src/lib/auth.ts` — scrypt password hashes (`scrypt:salt:hash`
  format), opaque session tokens in the httpOnly `ast_session` cookie,
  `getCurrentUser()` resolves session → user. Actions derive `userId` from
  the session, never from client input. `signInAction` is throttled by the
  in-memory fixed-window limiter in `src/lib/rate-limit.ts` (5 attempts per
  IP per minute).
- **Wire format:** export/import payloads are built and normalized in
  `src/lib/export-payload.ts` to match the ORIGINAL app's JSON shape
  (`title`/`subcategory`/`status`/numeric `qty`/`supplyIds`/`isNew`); the
  legacy clone shape imports through the same normalizer. The live app's
  project→`supplyIds` relation maps onto our internal
  `Supply.assignedProjectId`.
- **DTO discipline:** Prisma rows never reach the client; the mappers in
  `page.tsx` / `studio.ts` convert to the types in `src/lib/dto.ts`.
- **First-paint data** is fetched in `page.tsx` and handed to `StudioApp` as
  typed props; after mutations the client updates React state from action
  results (no global data store).

## Framework quirks (verified the hard way)

- **Next.js 16:** `cookies()` is async — always `await`. Page files may export
  only `default`, `metadata`/`generateMetadata`, `revalidate`, `dynamic`;
  extra exports fail the build.
- **Tailwind v4 CSS-first:** design tokens live in the `@theme` block of
  `src/app/globals.css` as literal hex (`--color-ast-turquoise: #2ec4b6` →
  `text-ast-turquoise`). There is no `tailwind.config.js` — do not add one.
  `var()` chains inside `@theme` are dropped by the build; keep values
  literal (the one exception: `--font-sans` references `--font-inter`).
- **The studio is always dark** — shadcn semantic tokens (`--color-background`
  etc.) are pinned to the dark palette directly in `@theme`; there is no
  `.dark` class toggle.
- **Chat polling** (`studio-chat.tsx`) skips ticks when
  `document.visibilityState !== "visible"` and re-pins to the bottom only if
  the reader was already near the bottom.
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
