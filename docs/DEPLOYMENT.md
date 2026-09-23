# Deployment Guide

How to run the AST Studio app outside development. Everything here is
verifiable against the repo: `package.json` (scripts), `next.config.ts`
(standalone output), `scripts/prisma-url.ts` (DATABASE_URL resolution),
and `src/lib/db-path.ts` (the path contract, pinned by
`src/lib/db-path.test.ts`).

## 1. Overview

The app is a single-route Next.js server with an embedded SQLite database
— no external services are required. A production deployment is: build
the standalone bundle, point `DATABASE_URL` at a writable SQLite file,
push the schema, (optionally) seed, and start the server. Bun is the
package manager for every command below; Node ≥ 20 can run the built
server directly.

## 2. Build

```bash
bun install
bun run build
```

`bun run build` runs `next build` (with `output: "standalone"` from
`next.config.ts`) and copies `.next/static` + `public/` into
`.next/standalone/`. The result is a self-contained server tree:
`.next/standalone/server.js` plus the static assets it serves.

## 3. Database setup

```bash
bun run db:push     # create/upgrade the SQLite schema (no migration files — the schema IS the migration)
bun run db:seed     # optional: demo user + community content (idempotent, existence-guarded)
```

`db/` is gitignored — a fresh deployment always starts from `db:push`.
For production, decide up front whether you want the seed content (the
demo account + the community chat history); most public deployments
should skip `db:seed` or delete the demo user afterwards (see §6).

## 4. Environment variables

Only one variable is required: `DATABASE_URL`, a SQLite `file:` URL.

- **Relative URLs** resolve against `prisma/schema.prisma`, so the
  recommended dev value `file:../db/custom.db` points at
  `<repo>/db/custom.db` — the same resolution the Prisma CLI, `next
  build`, and the running server all apply (`src/lib/db-path.ts`; pinned
  by `src/lib/db-path.test.ts`).
- **For production, use an ABSOLUTE path** pointing at a location that
  survives restarts and is outside the build tree, e.g.
  `DATABASE_URL="file:/var/lib/ast-studio/custom.db"`. A relative URL
  resolves against the schema directory inside the standalone bundle —
  which is rebuilt on every deploy and may not be writable — so absolute
  paths avoid both the data-wipe-on-redeploy trap and read-only-filesystem
  errors.
- The directory holding the database file must exist and be writable by
  the server process before `db:push`/first boot.
- `AST_PRISMA_DIR` (optional) overrides the directory the resolver
  considers "the schema directory" — only needed for exotic deployments
  where the schema cannot be located from the module tree. Leave unset
  otherwise.

`.env.example` documents the same contract; copy it to `.env` and adjust.
Never commit `.env` or `db/*.db`.

## 5. Running in production

```bash
bun run start
```

This resolves `DATABASE_URL` to an absolute URL (`scripts/prisma-url.ts`),
sets `NODE_ENV=production`, and serves `.next/standalone/server.js` on
port 3000 (override with `PORT`). Behind a reverse proxy, terminate TLS
at the proxy and forward to the app port; the app registers no
middleware, so no extra headers are required.

Health probe: `GET /api` returns a small JSON payload — wire your
monitoring/load-balancer to it.

## 6. Security checklist before public exposure

- **Rotate or delete the demo account** (`demo@artsupplytracker.com`) —
  its credentials are published in the README on purpose; it must not
  survive into a public deployment as-is.
- Keep `.env` and `db/*.db` untracked (`.gitignore` covers both — verify
  with `git status` before pushing).
- The sign-in action is rate-limited in memory (5 attempts/IP/minute);
  if you run multiple instances behind a load balancer, each instance
  counts independently — front it with a shared limiter if brute-force
  protection must be global.
- SQLite suits single-instance deployments. For multi-instance or
  high-concurrency deployments, switch to PostgreSQL (`.env.example`
  documents the switch) so instances share one database.
