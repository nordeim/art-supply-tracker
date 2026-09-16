/**
 * Seed — idempotent studio bootstrap.
 *
 * Seeds the community content that every account sees (chat history,
 * inspiration entries) plus a demo account so the clone is explorable
 * immediately. Re-running is a no-op: each block is existence-guarded by a
 * natural key (email, or content hash for the no-key tables).
 *
 * Run: bunx tsx scripts/seed.ts   (or: bun run db:seed)
 */
import { PrismaClient } from "@prisma/client";
import { scryptSync, randomBytes } from "node:crypto";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

// Demo credentials — documented in README; NOT a real secret. The live app
// account is intentionally not replicated here (see README → Demo Account).
const DEMO_EMAIL = "demo@artsupplytracker.com";
const DEMO_PASSWORD = "StudioDemo2026!";

async function seedDemoUser() {
  const existing = await db.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) return existing;
  return db.user.create({
    data: {
      email: DEMO_EMAIL,
      displayName: "Demo Artist",
      passwordHash: hashPassword(DEMO_PASSWORD),
      lastWorkedOn: "Watercolor Botanicals",
    },
  });
}

async function seedChat() {
  const count = await db.chatMessage.count();
  if (count > 0) return;

  // Mirrors the live Studio Chat history (kimsart ↔ kevbo33w, June–July 2026).
  const messages = [
    { username: "kimsart", email: "kimsart@gmail.com", message: "hi This is Kim I hope you love this app", at: new Date("2026-06-13T20:40:00Z") },
    { username: "kevbo33w", email: "kevbo33w@gmail.com", message: "Hey Kim. Dig the app. Like the projects section. Can I download this app on my iPad? I found entering my paints individually to be cumbersome. But I like that I can add a photo.", at: new Date("2026-06-20T02:22:00Z") },
    { username: "kimsart", email: "kimsart@gmail.com", message: "Yes! Yeah! It's a browser app for now, so you can log in from your iPad. You'd have to upload a photo and I will be adding the ability to take pictures this coming week", at: new Date("2026-06-20T05:57:00Z") },
    { username: "kevbo33w", email: "kevbo33w@gmail.com", message: "Nice. Seems to be working", at: new Date("2026-06-20T21:54:00Z") },
    { username: "kimsart", email: "kimsart@gmail.com", message: "testing", at: new Date("2026-07-21T04:37:00Z") },
  ];
  for (const m of messages) {
    await db.chatMessage.create({ data: { username: m.username, email: m.email, message: m.message, createdAt: m.at } });
  }
}

async function seedInspiration() {
  const count = await db.inspirationEntry.count();
  if (count > 0) return;

  // 15 entries — matches the sidebar INSPO count on the live app.
  const entries: Array<{
    type: string;
    date?: string;
    title: string;
    body?: string;
    author?: string;
    imageUrl?: string;
    sortOrder: number;
  }> = [
    // Art history feed (dated, most recent surfaces as "today")
    { type: "art_history", date: "2026-05-30", title: "Carmen Herrera: A Century of Work, Finally Seen", author: "Carmen Herrera", sortOrder: 1 },
    { type: "art_history", date: "2026-05-31", title: "Van Gogh Completes The Starry Night", author: "Vincent van Gogh", sortOrder: 2 },
    { type: "art_history", date: "2026-06-08", title: "Gustave Courbet and the Birth of Realism", author: "Gustave Courbet", sortOrder: 3 },
    { type: "art_history", date: "2026-06-17", title: "The First Impressionist Exhibition, 1874", author: "Claude Monet", sortOrder: 4 },
    { type: "art_history", date: "2026-06-22", title: "Edward Hopper: Painter of American Solitude", author: "Edward Hopper", sortOrder: 5 },
    { type: "art_history", date: "2026-07-04", title: "The Guerrilla Girls: Unmasking Bias in the Art World", author: "Guerrilla Girls", sortOrder: 6 },
    { type: "art_history", date: "2026-07-08", title: "Käthe Kollwitz: Printmaking as Social Conscience", author: "Käthe Kollwitz", sortOrder: 7 },
    { type: "art_history", date: "2026-07-15", title: "Rembrandt van Rijn: The Autobiography of Light", author: "Rembrandt van Rijn", sortOrder: 8 },
    // The Starry Night feature (dashboard Art History card)
    { type: "art_history", date: "2026-05-31", title: "The Starry Night", body: "Vincent van Gogh completed The Starry Night in June 1889 while a patient at Saint-Paul-de-Mausole in Saint-Rémy-de-Provence. Painted from memory rather than direct observation, it is now one of the most recognised works in Western art.", author: "Vincent van Gogh", sortOrder: 9 },
    // Artist quotes
    { type: "artist_quote", title: "I am independent! I can live alone and I love to work.", author: "Mary Cassatt", sortOrder: 10 },
    { type: "artist_quote", title: "Famous artist quote placeholder.", body: "Verified quote feed coming in a future release.", author: "AST Studio", sortOrder: 11 },
    // Studio spotlights
    { type: "studio_spotlight", title: "Kim Wyatt", body: "Studio Art Labs", imageUrl: "/assets/kim-wyatt.jpg", sortOrder: 12 },
    { type: "studio_spotlight", title: "Kevin Lewis", body: "Mixed media & textile artist. Vivid, intense, and sometimes frightening work rooted in makeup and costume design for horror film.", imageUrl: "/assets/portrait-01.jpg", sortOrder: 13 },
    // Partner placeholder
    { type: "partner", title: "Partner name placeholder.", body: "Partner description placeholder. Real partner content, demos, and product launches will appear here once partner integrations are confirmed.", sortOrder: 14 },
    { type: "partner", title: "Retailer & Manufacturer Picks", body: "Supply deals & partner inspiration.", sortOrder: 15 },
  ];

  for (const e of entries) {
    await db.inspirationEntry.create({
      data: {
        type: e.type,
        date: e.date ?? null,
        title: e.title,
        body: e.body ?? null,
        author: e.author ?? null,
        imageUrl: e.imageUrl ?? null,
        sortOrder: e.sortOrder,
      },
    });
  }
}

async function main() {
  await seedDemoUser();
  await seedChat();
  await seedInspiration();
  const [users, chats, entries] = await Promise.all([
    db.user.count(),
    db.chatMessage.count(),
    db.inspirationEntry.count(),
  ]);
  console.log(
    `Seeded: ${users} user(s), ${chats} chat message(s), ${entries} inspiration entries. Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`,
  );
}

main()
  .catch((error) => {
    console.error("[seed] failed", error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
