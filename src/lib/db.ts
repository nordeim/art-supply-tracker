import { PrismaClient } from '@prisma/client'
import { resolveDatabaseUrl } from '@/lib/db-path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // The resolved ABSOLUTE file: URL pins the SQLite location to the
    // repo-root db/ folder regardless of runtime/cwd (r16; see
    // src/lib/db-path.ts). Absolute and non-file URLs pass through.
    datasourceUrl: resolveDatabaseUrl(),
    // Query logging is dev-noise; errors still surface via action-level
    // console.error with context.
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
