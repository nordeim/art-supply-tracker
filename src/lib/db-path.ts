import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The SQLite path contract (AGENTS.md "Environment", pinned by
 * src/lib/db-path.test.ts): a RELATIVE `file:` URL in DATABASE_URL resolves
 * against `prisma/schema.prisma` — the documented `file:../db/custom.db`
 * lands at `<repo>/db/custom.db` — regardless of the process working
 * directory or runtime.
 *
 * Why this module exists (r16): Prisma's own resolution is runtime-dependent
 * — the CLI and Node-side server resolve relative `file:` URLs against the
 * CWD (the DB silently lands OUTSIDE the repo when commands run from the
 * repo root), while bun-runtime scripts resolve schema-relative. Two
 * runtimes, two database files, one broken contract. Passing the resolved
 * ABSOLUTE URL as `datasourceUrl` to PrismaClient makes every consumer land
 * on the same file. Absolute `file:` URLs and non-file URLs pass through
 * unchanged (the action-layer tests rely on that).
 */

const SCHEMA_MARKER = join("prisma", "schema.prisma");

/** Directory of prisma/schema.prisma, found without trusting the CWD. */
function schemaDir(): string | null {
  // 1. Explicit escape hatch for exotic deployments (documented in
  //    .env.example) — an absolute path to the prisma directory.
  const override = process.env.AST_PRISMA_DIR;
  if (override && isAbsolute(override)) return override;

  // 2. This module's own location: src/lib/db-path.ts lives two levels under
  //    the repo root, so ../../prisma is the schema directory. Under
  //    `next dev` (Turbopack) import.meta.url still resolves to the source
  //    file; under a bundled server it may not — hence the marker check.
  try {
    const here = fileURLToPath(import.meta.url);
    const candidate = resolve(dirname(here), "..", "..", "prisma");
    if (existsSync(join(candidate, "schema.prisma"))) return candidate;
  } catch {
    // import.meta.url was not a file: URL (bundler-specific) — fall through.
  }

  // 3. Walk up from the CWD looking for prisma/schema.prisma. The dev
  //    server, the standalone production server (`bun run start` from the
  //    repo root), tsx, and the Prisma CLI all run with the repo root as
  //    (or above) the CWD; a bounded walk covers starts from nested dirs.
  let dir = process.cwd();
  for (let i = 0; i < 6; i += 1) {
    if (existsSync(join(dir, SCHEMA_MARKER))) return join(dir, "prisma");
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/**
 * Runtime resolution (src/lib/db.ts, PrismaClient's datasourceUrl): the
 * process environment only — standard precedence, so test isolation
 * (absolute throwaway URLs), CI, and 12-factor deployments keep winning.
 * The app runtimes all load the repo .env into the process environment
 * themselves (@next/env for dev/build/start, bun for direct scripts);
 * repo-tooling that cannot rely on that uses resolveRepoDatabaseUrl.
 * Relative `file:` URLs resolve against prisma/schema.prisma; everything
 * else passes through.
 */
export function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error(
      "DATABASE_URL is not set — copy .env.example to .env and configure the " +
        "SQLite path (file:../db/custom.db resolves to <repo>/db/custom.db).",
    );
  }
  return resolveRawUrl(raw);
}

/** Parse `DATABASE_URL=` out of raw .env content (single-variable .env). */
function envFileValue(content: string): string | undefined {
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    if (trimmed.slice(0, eq).trim() !== "DATABASE_URL") continue;
    let value = trimmed.slice(eq + 1).trim();
    // Strip matched single or double quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return value || undefined;
  }
  return undefined;
}

/** The repo's own .env content, or undefined when it does not exist. */
function repoEnvContent(): string | undefined {
  const base = schemaDir();
  if (!base) return undefined;
  const envPath = join(base, "..", ".env");
  try {
    return readFileSync(envPath, "utf8");
  } catch {
    return undefined; // fresh checkout / CI: only .env.example exists
  }
}

/**
 * Repo-tooling resolution (seed, prisma-url, dev/start script prefixes):
 * the repo's OWN .env wins over an inherited process environment — a
 * workspace shell that exports an absolute DATABASE_URL pointing outside
 * the repo (the r16 sandbox scenario) must not relocate the database. When
 * the repo .env is absent (CI, deployments), the process env applies with
 * standard precedence.
 */
export function resolveRepoDatabaseUrl(envContent?: string): string {
  const fromFile = envFileValue(envContent ?? repoEnvContent() ?? "");
  const raw = fromFile ?? process.env.DATABASE_URL;
  if (!raw) {
    throw new Error(
      "DATABASE_URL is not set — copy .env.example to .env and configure the " +
        "SQLite path (file:../db/custom.db resolves to <repo>/db/custom.db).",
    );
  }
  return resolveRawUrl(raw);
}

/** Resolve a raw URL string with the schema-relative file: contract. */
function resolveRawUrl(raw: string): string {
  if (!raw.startsWith("file:")) return raw; // postgres://… and friends

  const filePath = raw.slice("file:".length);
  if (isAbsolute(filePath)) return raw; // already deterministic

  const base = schemaDir();
  if (!base) {
    // No schema found anywhere (e.g. a standalone deployment without the
    // repo): keep Prisma's own CWD-relative behavior instead of guessing.
    return raw;
  }
  return `file:${resolve(base, filePath)}`;
}
