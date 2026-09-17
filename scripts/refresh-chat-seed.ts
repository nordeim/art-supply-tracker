/**
 * One-off local maintenance (not part of the app): clears the ChatMessage
 * table so the next `bun run db:seed` re-seeds the community history with
 * the live-fidelity texts. Run from the repo root:
 *   bunx tsx scripts/refresh-chat-seed.ts && bun run db:seed
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const n = await db.chatMessage.deleteMany({});
  console.log(`deleted ${n.count} chat messages`);
}

main().finally(() => db.$disconnect());
