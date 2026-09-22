import { afterEach, describe, expect, it } from "vitest";

import { resolveDatabaseUrl, resolveRepoDatabaseUrl } from "@/lib/db-path";

/**
 * The SQLite path contract (AGENTS.md "Environment"): a RELATIVE `file:` URL
 * in DATABASE_URL resolves against `prisma/schema.prisma` — so the documented
 * `file:../db/custom.db` lands at `<repo>/db/custom.db` — regardless of the
 * process working directory or runtime (bun, node, next dev, standalone
 * server, tsx). Without this resolver the Prisma CLI and the Node-side
 * runtime resolve the URL against the CWD (the DB silently lands OUTSIDE the
 * repo) while bun-runtime scripts resolve schema-relative — two runtimes,
 * two databases, one broken contract. Pinned here so it cannot drift again.
 */

const ORIGINAL = process.env.DATABASE_URL;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = ORIGINAL;
});

describe("resolveDatabaseUrl", () => {
  it("resolves the documented relative URL to the repo-root db folder", () => {
    process.env.DATABASE_URL = "file:../db/custom.db";
    const url = resolveDatabaseUrl();
    expect(url.startsWith("file:/")).toBe(true);
    // The repo root is the parent of prisma/ — `../db` from there.
    expect(url.endsWith("/art-supply-tracker/db/custom.db")).toBe(true);
  });

  it("produces an absolute path, independent of the process cwd", () => {
    const before = process.cwd();
    try {
      process.env.DATABASE_URL = "file:../db/custom.db";
      const fromRepo = resolveDatabaseUrl();
      process.chdir("/tmp");
      const fromTmp = resolveDatabaseUrl();
      expect(fromTmp).toBe(fromRepo);
    } finally {
      process.chdir(before);
    }
  });

  it("passes an absolute file URL through unchanged", () => {
    // The action-layer tests set absolute throwaway URLs before importing
    // @/lib/db — those must keep pointing exactly where the test put them.
    const absolute = "file:/tmp/ast-action-test-123.db";
    process.env.DATABASE_URL = absolute;
    expect(resolveDatabaseUrl()).toBe(absolute);
  });

  it("resolves any relative file URL against prisma/, not the cwd", () => {
    process.env.DATABASE_URL = "file:./dev.db";
    const url = resolveDatabaseUrl();
    expect(url.startsWith("file:/")).toBe(true);
    expect(url.endsWith("/art-supply-tracker/prisma/dev.db")).toBe(true);
  });

  it("passes non-file URLs through unchanged", () => {
    const pg = "postgresql://user:password@localhost:5432/art_supply_tracker";
    process.env.DATABASE_URL = pg;
    expect(resolveDatabaseUrl()).toBe(pg);
  });

  it("throws an actionable error when DATABASE_URL is unset", () => {
    delete process.env.DATABASE_URL;
    expect(() => resolveDatabaseUrl()).toThrow(/DATABASE_URL/);
  });
});

describe("resolveRepoDatabaseUrl", () => {
  it("prefers the repo .env over an inherited (polluted) process env", () => {
    // The r16 sandbox scenario: a workspace-level shell exports an absolute
    // DATABASE_URL pointing OUTSIDE the repo. Repo tooling (seed, prisma-url,
    // the dev/start script prefixes) must let the repo's own .env win.
    process.env.DATABASE_URL = "file:/home/z/my-project/db/custom.db";
    const url = resolveRepoDatabaseUrl(
      'DATABASE_URL="file:../db/custom.db"\n',
    );
    expect(url.endsWith("/art-supply-tracker/db/custom.db")).toBe(true);
  });

  it("resolves the repo .env's relative value against prisma/", () => {
    const url = resolveRepoDatabaseUrl("DATABASE_URL=file:./dev.db\n");
    expect(url.endsWith("/art-supply-tracker/prisma/dev.db")).toBe(true);
  });

  it("falls back to the process env when the repo .env has no value", () => {
    const absolute = "file:/tmp/verify-gate.db";
    process.env.DATABASE_URL = absolute;
    expect(resolveRepoDatabaseUrl("# only comments\n")).toBe(absolute);
  });

  it("falls back to the process env when the .env content is absent", () => {
    // CI scenario: fresh checkout has no .env — empty content, process env wins.
    const absolute = "file:/tmp/ci.db";
    process.env.DATABASE_URL = absolute;
    expect(resolveRepoDatabaseUrl("")).toBe(absolute);
  });

  it("passes a non-file repo .env value through unchanged", () => {
    const pg = "postgresql://user:password@localhost:5432/art_supply_tracker";
    expect(resolveRepoDatabaseUrl(`DATABASE_URL=${pg}\n`)).toBe(pg);
  });

  it("throws when neither the repo .env nor the process env defines it", () => {
    delete process.env.DATABASE_URL;
    expect(() => resolveRepoDatabaseUrl("")).toThrow(/DATABASE_URL/);
  });
});
