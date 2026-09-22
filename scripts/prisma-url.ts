/**
 * Prints the resolved ABSOLUTE DATABASE_URL (src/lib/db-path.ts contract) so
 * the Prisma CLI — which resolves relative `file:` URLs against the CWD and
 * would otherwise land the database OUTSIDE the repo — targets the same
 * repo-root db/ file the application uses (r16).
 *
 * Used by the db:* scripts in package.json:
 *   DATABASE_URL="$(bun scripts/prisma-url.ts)" prisma db push …
 * A real environment variable takes precedence over .env in the Prisma CLI,
 * so the override is authoritative for that invocation only.
 */
import { resolveRepoDatabaseUrl } from "../src/lib/db-path";

console.log(resolveRepoDatabaseUrl());
