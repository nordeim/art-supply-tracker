/**
 * Seed — idempotent studio bootstrap.
 *
 * Seeds the community content that every account sees (chat history,
 * inspiration entries) plus a demo account so the clone is explorable
 * immediately. Chat/demo-user blocks are existence-guarded by natural key;
 * inspiration entries are global editorial content and are deterministically
 * replaced on every run (delete + re-create — the live app's 15-entry feed
 * reproduced verbatim, including the detail payloads behind the overlay
 * panels: quotes, citations, rights notices, and tags).
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

type SeedEntry = {
  type: string;
  date?: string;
  title: string;
  body?: string;
  author?: string;
  imageUrl?: string;
  detail?: Record<string, unknown>;
  sortOrder: number;
};

// The live app's 15-entry inspiration feed (8 art history + 4 artist quotes +
// 2 studio spotlights + 1 partner), captured verbatim from
// studiobeta.artsupplytracker.com on 2026-09-16 — bodies, citations, rights
// notices, and tags included.
const INSPIRATION_ENTRIES: SeedEntry[] = [
  // ── Art history timeline (8) ──────────────────────────────────────────────
  {
    type: "art_history",
    date: "2026-05-30",
    title: "Carmen Herrera: A Century of Work, Finally Seen",
    author: "Carmen Herrera",
    sortOrder: 1,
    detail: {
      body:
        "Carmen Herrera was born on May 30, 1915, in Havana, Cuba, and spent more than six decades making paintings that almost no one bought. Trained in Havana and later at the Art Students League in New York, Herrera developed a precise, uncompromising geometric abstraction in the late 1940s and 1950s — hard-edged forms in two-color pairings that reduced painting to its most irreducible logic. She exhibited in Paris during the postwar years alongside Ellsworth Kelly, whose career the art market would eventually reward handsomely; hers it would not, for decades. Herrera sold her first painting at the age of 89. By the time the Whitney Museum of American Art gave her a full retrospective in 2016, she was 101 years old. She continued painting into her final years, working with an assistant who helped execute the compositions she could no longer physically complete. She died on February 12, 2022, at 106. Her story is not simply one of delayed recognition — it is a precise diagnosis of which artists the 20th-century market was structured to ignore.",
      artwork: "Blanco y Verde (1959) · Carmen Herrera",
      citation:
        "Whitney Museum of American Art — Carmen Herrera: Lines of Sight, 2016",
      rights:
        "Carmen Herrera died February 12, 2022. Works are under copyright administered by the Carmen Herrera Estate / Lisson Gallery. Image URL withheld.",
      tags: ["GEOMETRIC ABSTRACTION", "HERRERA", "CUBAN-AMERICAN ART", "20TH CENTURY"],
    },
  },
  {
    type: "art_history",
    date: "2026-05-31",
    title: "Van Gogh Completes The Starry Night",
    author: "Vincent van Gogh",
    sortOrder: 2,
    detail: {
      body:
        "In June 1889, Vincent van Gogh completed The Starry Night while voluntarily committed at the Saint-Paul-de-Mausole asylum in Saint-Rémy-de-Provence. Painted from memory rather than direct observation — van Gogh rarely painted at night — it depicts a swirling nocturnal sky over a village, with a luminous crescent moon and a cypress tree dominating the foreground. Van Gogh himself was ambivalent about the work, calling it an 'exaggeration' in a letter to his brother Theo. He sent it to Theo in Paris, where it passed through several hands before entering the collection of the Museum of Modern Art in New York in 1941. It is now one of the most recognized paintings in Western art.",
      artwork: "The Starry Night (1889) · Vincent van Gogh",
      citation: "Vincent van Gogh, Public domain, via Wikimedia Commons",
      rights:
        "Vincent van Gogh died July 29, 1890. The Starry Night (1889) is in the public domain. Image sourced from Wikimedia Commons via the Google Art Project.",
      tags: ["POST-IMPRESSIONISM", "VAN GOGH", "DUTCH ART", "19TH CENTURY"],
    },
  },
  {
    type: "art_history",
    date: "2026-06-08",
    title: "Gustave Courbet and the Birth of Realism",
    author: "Gustave Courbet",
    sortOrder: 3,
    detail: {
      body:
        "On June 10, 1819, Gustave Courbet was born in Ornans, France. Rejecting the Romantic idealization of his contemporaries, Courbet insisted on painting only what he could see and know directly. His monumental canvas 'The Stone Breakers' (1849) depicted common laborers with a gravity previously reserved for mythological heroes, scandalizing the Paris Salon. Courbet later organized a private 'Pavilion of Realism' in 1855 to exhibit his rejected works on his own terms—an act of artistic defiance that prefigured the independent exhibition movements that followed.",
      artwork: "The Stone Breakers (1849) · Gustave Courbet",
      citation: "Wikimedia Commons",
      rights:
        "Public domain. Gustave Courbet died December 31, 1877; work created 1849. Image sourced from Wikimedia Commons.",
      tags: ["REALISM", "COURBET", "FRENCH ART", "19TH CENTURY"],
    },
  },
  {
    type: "art_history",
    date: "2026-06-17",
    title: "The First Impressionist Exhibition, 1874",
    author: "Claude Monet",
    sortOrder: 4,
    detail: {
      body:
        "On April 15, 1874, a group of French artists including Claude Monet, Edgar Degas, Camille Pissarro, Berthe Morisot, and Pierre-Auguste Renoir opened an independent exhibition at the studio of photographer Nadar in Paris. Dismissed by critics—one derided Monet's 'Impression, Sunrise' (1872) as a mere 'impression'—the show nonetheless changed art history permanently. The eight Impressionist exhibitions held between 1874 and 1886 dismantled the stranglehold of the Paris Salon and established the model of the independent artist-organized show.",
      artwork: "Impression, Sunrise (1872) · Claude Monet",
      citation: "Musée Marmottan Monet / Wikimedia Commons",
      rights:
        "Public domain. Claude Monet died December 5, 1926; work created 1872. Image sourced from Wikimedia Commons.",
      tags: ["IMPRESSIONISM", "MONET", "FRENCH ART", "19TH CENTURY"],
    },
  },
  {
    type: "art_history",
    date: "2026-06-22",
    title: "Edward Hopper: Painter of American Solitude",
    author: "Edward Hopper",
    sortOrder: 5,
    detail: {
      body:
        "Edward Hopper was born on July 22, 1882, in Nyack, New York. Trained under Robert Henri in New York, Hopper developed a uniquely American visual language built on sharp light, geometric architecture, and human figures caught in moments of quiet isolation. His 1942 painting 'Nighthawks'—depicting three customers and a counter attendant in a late-night diner—became an enduring icon of urban loneliness and the alienation of modern life. Hopper once said the diner was 'unconsciously a painting of loneliness,' though he disputed that interpretation publicly.",
      artwork: "Nighthawks (1942) · Edward Hopper",
      citation: "Art Institute of Chicago",
      rights:
        "Public domain in the United States. Edward Hopper died May 15, 1967; 'Nighthawks' (1942) was published before 1978 without copyright renewal. Open access image courtesy of the Art Institute of Chicago via Wikimedia Commons.",
      tags: ["AMERICAN ART", "HOPPER", "REALISM", "20TH CENTURY"],
    },
  },
  {
    type: "art_history",
    date: "2026-07-04",
    title: "The Guerrilla Girls: Unmasking Bias in the Art World",
    author: "Guerrilla Girls",
    sortOrder: 6,
    detail: {
      body:
        "Founded in New York City in 1985, the Guerrilla Girls emerged in direct response to the Museum of Modern Art's exhibition 'An International Survey of Recent Painting and Sculpture,' which featured only 13 women among 169 artists. The anonymous collective — whose members adopt the names of deceased female artists and wear oversized gorilla masks in public — began postering Manhattan with stark, fact-driven indictments of the gallery and museum system. Their 1989 billboard poster posed the now-iconic question: 'Do women have to be naked to get into the Met. Museum?' It documented that fewer than 5% of the artists in the Metropolitan Museum's modern art sections were women, while 85% of the nudes were female. The collective expanded their critique to Hollywood, publishing, and politics, building a body of activist work that remains a foundational reference for any discussion of representation, equity, and power in the arts. Still active today, they have exhibited at the Tate Modern, the Whitney, and the Venice Biennale.",
      artwork: "Do Women Have to Be Naked to Get into the Met. Museum? (1989) · Guerrilla Girls",
      citation: "Guerrilla Girls official website; MoMA Collection record",
      rights:
        "The Guerrilla Girls are an active collective; all poster and print works are under copyright. Image URL withheld — no public domain or open-license reproduction available. See guerrillagirls.com or MoMA Collection (moma.org/collection/works/133975) for authorized reference.",
      tags: ["POLITICAL ART", "FEMINISM", "ACTIVISM", "GUERRILLA GIRLS"],
    },
  },
  {
    type: "art_history",
    date: "2026-07-08",
    title: "Käthe Kollwitz: Printmaking as Social Conscience",
    author: "Käthe Kollwitz",
    sortOrder: 7,
    detail: {
      body:
        "Käthe Kollwitz was born on July 8, 1867, in Königsberg, Prussia (now Kaliningrad, Russia). A master printmaker, draftsman, and sculptor, Kollwitz devoted her career to bearing witness to poverty, hunger, war, and grief — the lived reality of Germany's working class in the late 19th and early 20th centuries. Her series 'A Weavers' Revolt' (1893–97) and 'The Peasants' War' (1902–08) brought monumental moral weight to the suffering of ordinary people. The death of her son Peter on the Western Front in 1914 transformed her work irrevocably. Her subsequent prints, drawings, and sculptures — most powerfully the granite figures of 'The Grieving Parents' (1932), installed at the German military cemetery in Vladslo, Belgium, where Peter is buried — stand among the most profound anti-war monuments ever created. Kollwitz was the first woman elected to the Prussian Academy of Arts in 1919, and in 1936 the Nazi regime forced her resignation and banned public exhibition of her work.",
      artwork: "A Weavers' Revolt — The March of the Weavers (1897) · Käthe Kollwitz",
      citation: "Wikimedia Commons; Käthe Kollwitz Museum Köln",
      rights:
        "Käthe Kollwitz died April 22, 1945. Works created before 1928 are in the public domain in the United States; all works entered the public domain in Germany in 2016 (70 years post-mortem). Portrait photograph is in the public domain. Image sourced from Wikimedia Commons.",
      tags: ["EXPRESSIONISM", "KOLLWITZ", "GERMAN ART", "PRINTMAKING"],
    },
  },
  {
    type: "art_history",
    date: "2026-07-15",
    title: "Rembrandt van Rijn: The Autobiography of Light",
    author: "Rembrandt van Rijn",
    sortOrder: 8,
    detail: {
      body:
        "Rembrandt Harmenszoon van Rijn was born on July 15, 1606, in Leiden, in the Dutch Republic. The preeminent master of the Dutch Golden Age, Rembrandt transformed portraiture through his unmatched command of chiaroscuro, his penetrating psychological insight, and a lifelong fascination with the human face — above all his own. Over four decades he produced nearly 100 self-portraits in oil, etching, and drawing, creating the most sustained visual autobiography in Western art. His monumental civic group portrait 'The Night Watch' (1642), with its radical use of dramatic illumination and its sense of arrested movement, broke every convention of the genre. His late works — characterized by loose, impastoed paint and unflinching confrontation with mortality and time — were undervalued in his own day but proved deeply influential on Impressionism, Expressionism, and virtually every tradition of painterly realism that followed.",
      artwork: "The Night Watch (1642) · Rembrandt van Rijn",
      citation: "Rijksmuseum, Amsterdam / Wikimedia Commons",
      rights:
        "Public domain. Rembrandt van Rijn died October 4, 1669; work created 1642. High-resolution image sourced from Wikimedia Commons, courtesy of the Rijksmuseum open-access program.",
      tags: ["DUTCH GOLDEN AGE", "REMBRANDT", "BAROQUE", "17TH CENTURY"],
    },
  },

  // ── Artist quotes (4) ─────────────────────────────────────────────────────
  {
    type: "artist_quote",
    title: "I am independent! I can live alone and I love to work.",
    author: "Mary Cassatt",
    sortOrder: 9,
    detail: {
      title: "Mary Cassatt on Solitude, Independence, and Work",
      quote: "I am independent! I can live alone and I love to work.",
      artwork: "The Child's Bath (1893) · Mary Cassatt",
      citation:
        "Letter from Mary Cassatt to Louisine Havemeyer, c. 1911; cited in Mathews, Nancy Mowll. 'Mary Cassatt: A Life.' Yale University Press, 1994.",
      rights:
        "Public domain. Mary Cassatt died June 14, 1926; 'The Child's Bath' created 1893. Open-access image courtesy of the Art Institute of Chicago via Wikimedia Commons.",
      tags: ["IMPRESSIONISM", "CASSATT", "AMERICAN ART", "WOMEN ARTISTS"],
    },
  },
  {
    type: "artist_quote",
    title: "Painting is easy when you don't know how, but very difficult when you do.",
    author: "Edgar Degas",
    sortOrder: 10,
    detail: {
      title: "Edgar Degas on the Paradox of Mastery",
      quote: "Painting is easy when you don't know how, but very difficult when you do.",
      artwork: "The Dance Class (1874) · Edgar Degas",
      citation:
        "Widely attributed to Edgar Degas; cited in Musée d'Orsay exhibition scholarship and multiple academic monographs on Impressionism",
      rights:
        "Public domain. Edgar Degas died September 27, 1917; 'The Dance Class' created 1874. Image sourced from Wikimedia Commons via Google Art Project.",
      tags: ["IMPRESSIONISM", "DEGAS", "FRENCH ART", "BALLET"],
    },
  },
  {
    type: "artist_quote",
    title: "I want to do something that will have repercussions in my time.",
    author: "Käthe Kollwitz",
    sortOrder: 11,
    detail: {
      title: "Käthe Kollwitz on Making Art That Matters",
      quote: "I want to do something that will have repercussions in my time.",
      artwork: "Woman with Dead Child (1903) · Käthe Kollwitz",
      citation:
        "Kollwitz, Käthe. 'The Diary and Letters of Kaethe Kollwitz.' Edited by Hans Kollwitz, translated by Richard and Clara Winston. Northwestern University Press, 1988.",
      rights:
        "Käthe Kollwitz died April 22, 1945. 'Woman with Dead Child' (1903) is in the public domain in the United States and Germany. Image sourced from Wikimedia Commons.",
      tags: ["EXPRESSIONISM", "KOLLWITZ", "GERMAN ART", "PRINTMAKING"],
    },
  },
  {
    type: "artist_quote",
    title: "A drawing is simply a line going for a walk.",
    author: "Paul Klee",
    sortOrder: 12,
    detail: {
      title: "Paul Klee on Drawing as an Active Line",
      quote: "A drawing is simply a line going for a walk.",
      artwork: "Twittering Machine (1922) · Paul Klee",
      citation:
        "Paul Klee, 'Pedagogical Sketchbook' (Pädagogisches Skizzenbuch), Bauhaus Books Vol. 2, 1925",
      rights:
        "Paul Klee died June 29, 1940. Works by Paul Klee are under copyright administered by the Paul Klee Estate / VG Bild-Kunst. Image reproduced for educational reference only under fair use. Full rights reserved.",
      tags: ["BAUHAUS", "KLEE", "GERMAN ART", "DRAWING"],
    },
  },

  // ── Studio spotlights (2) ─────────────────────────────────────────────────
  {
    type: "studio_spotlight",
    title: "Kim Wyatt",
    body: "Studio Art Labs",
    imageUrl: "/assets/kim-wyatt.jpg",
    sortOrder: 14,
    detail: {
      subtitle: "@kims_studio_labs · Kim Wyatt Studio Art Labs",
      body:
        "Artist and founder behind AST Studio. Kim Wyatt Studio Art Labs is the real-world studio practice this app was built to support.",
      tags: ["Founder", "Studio Artist", "Beta"],
      attribution:
        "Artwork by Kim Wyatt. Used with artist permission for Art Supply Tracker beta testing.",
      linkLabel: "kimwyatt.art →",
      linkUrl: "kimwyatt.art",
    },
  },
  {
    type: "studio_spotlight",
    title: "Kevin Lewis",
    body: "Mixed media & textile artist",
    imageUrl: "/assets/portrait-01.jpg",
    sortOrder: 13,
    detail: {
      subtitle: "@kevinlewisart · Kevin Lewis Studio",
      body:
        "Kevin Lewis is a San Diego artist whose work is vivid, intense, and sometimes frightening. His imagery carries forward the ideas, moods, and theatrical instincts he developed while working in makeup and costume design on horror movie sets.",
      tags: ["Mixed Media", "Textile", "Spotlight"],
      attribution: "Artwork by Kevin Lewis. Used with artist permission.",
    },
  },

  // ── Partner (1) ───────────────────────────────────────────────────────────
  {
    type: "partner",
    title: "Retailer & Manufacturer Picks",
    body: "Supply deals & partner inspiration.",
    sortOrder: 15,
    detail: {
      body: "Product demos, supply deals, and partner inspiration live here.",
    },
  },
];

async function seedInspiration() {
  // Global editorial content: deterministic replace, so the feed always
  // matches the source-of-truth list above (rerunning is a no-op by result).
  await db.inspirationEntry.deleteMany();
  for (const e of INSPIRATION_ENTRIES) {
    await db.inspirationEntry.create({
      data: {
        type: e.type,
        date: e.date ?? null,
        title: e.title,
        body: e.body ?? null,
        author: e.author ?? null,
        imageUrl: e.imageUrl ?? null,
        detailJson: e.detail ? JSON.stringify(e.detail) : null,
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
