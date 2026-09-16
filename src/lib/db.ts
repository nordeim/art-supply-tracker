import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Query logging is dev-noise; errors still surface via action-level
    // console.error with context.
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
