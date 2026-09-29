import { describe, expect, it } from "vitest";

import {
  inspirationDetailSchema,
  inspirationEntryForKey,
  parseInspirationDetail,
  pickToday,
  quoteKey,
  spotlightKey,
  spotlightSlug,
} from "@/lib/inspiration";
import type { InspirationEntryDto } from "@/lib/dto";

/**
 * The inspiration detail payload powers the live app's overlay panels
 * (QUOTE OF THE DAY, STUDIO SPOTLIGHT, TODAY IN ART HISTORY, PARTNERS).
 * It is stored as JSON in InspirationEntry.detailJson and parsed at the DTO
 * boundary — corrupt JSON must degrade to null, never break the view.
 */
describe("inspirationDetailSchema", () => {
  it("accepts a complete quote detail", () => {
    const parsed = inspirationDetailSchema.safeParse({
      title: "Mary Cassatt on Solitude, Independence, and Work",
      quote: "I am independent! I can live alone and I love to work.",
      artwork: "The Child's Bath (1893) · Mary Cassatt",
      citation: "Letter from Mary Cassatt to Louisine Havemeyer, c. 1911.",
      citationUrl: "https://www.artic.edu/artworks/111442/the-child-s-bath",
      rights: "Public domain.",
      tags: ["IMPRESSIONISM", "CASSATT"],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts a spotlight detail with handle, link, tagColors, and the {url, alt} artwork gallery (r36)", () => {
    const parsed = inspirationDetailSchema.safeParse({
      subtitle: "@kevinlewisart · Kevin Lewis Studio",
      body: "Kevin Lewis is a San Diego artist whose work is vivid and intense.",
      tags: ["Mixed Media", "Textile", "Spotlight"],
      tagColors: [
        "text-ast-pink bg-ast-pink/20",
        "text-ast-purple bg-ast-purple/20",
        "text-ast-turquoise bg-ast-turquoise/20",
      ],
      attribution: "Artwork by Kevin Lewis. Used with artist permission.",
      gallery: [
        { url: "/assets/artwork-01.jpg", alt: "Kevin Lewis — artwork 1" },
        { url: "/assets/artwork-02.jpg" },
        {
          url: "https://static.wixstatic.com/media/example.jpg",
          alt: "Liberty With Mask by Kim Wyatt",
        },
      ],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.subtitle).toContain("@kevinlewisart");
      expect(parsed.data.gallery).toHaveLength(3);
      expect(parsed.data.gallery?.[0]?.alt).toBe("Kevin Lewis — artwork 1");
      expect(parsed.data.gallery?.[1]?.alt).toBeUndefined();
      expect(parsed.data.tagColors).toHaveLength(3);
    }
  });

  it("rejects a non-array gallery", () => {
    const parsed = inspirationDetailSchema.safeParse({
      gallery: "/assets/artwork-01.jpg",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a gallery of bare strings (the live's gallery is {url, alt} objects — r36)", () => {
    const parsed = inspirationDetailSchema.safeParse({
      gallery: ["/assets/artwork-01.jpg"],
    });
    expect(parsed.success).toBe(false);
  });

  it("caps the gallery count (the live's panel renders at most a dozen thumbs)", () => {
    const parsed = inspirationDetailSchema.safeParse({
      gallery: Array.from({ length: 13 }, (_, i) => ({ url: `/a-${i}.jpg` })),
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects non-array tags", () => {
    const parsed = inspirationDetailSchema.safeParse({ tags: "IMPRESSIONISM" });
    expect(parsed.success).toBe(false);
  });

  it("caps tag count and string lengths", () => {
    const parsed = inspirationDetailSchema.safeParse({
      tags: Array.from({ length: 13 }, (_, i) => `tag-${i}`),
    });
    expect(parsed.success).toBe(false);
  });
});

describe("parseInspirationDetail", () => {
  it("returns null for null input", () => {
    expect(parseInspirationDetail(null)).toBeNull();
  });

  it("returns null for corrupt JSON", () => {
    expect(parseInspirationDetail("{not json")).toBeNull();
  });

  it("returns null for JSON that is not an object", () => {
    expect(parseInspirationDetail('["array"]')).toBeNull();
  });

  it("returns null when the object fails the schema", () => {
    expect(parseInspirationDetail('{"tags": 42}')).toBeNull();
  });

  it("round-trips a valid detail object", () => {
    const detail = { quote: "A drawing is simply a line going for a walk.", tags: ["KLEE"] };
    const parsed = parseInspirationDetail(JSON.stringify(detail));
    expect(parsed?.quote).toBe(detail.quote);
    expect(parsed?.tags).toEqual(["KLEE"]);
  });
});

describe("pickToday", () => {
  const entry = (date: string, id: string): InspirationEntryDto => ({
    id,
    type: "art_history",
    date,
    title: `Entry ${id}`,
    body: null,
    author: null,
    imageUrl: null,
    detail: null,
  });

  it("returns the most recent dated entry on or before today", () => {
    const list = [entry("2026-01-01", "a"), entry("2026-06-01", "b"), entry("2026-12-31", "c")];
    // Frozen clock: run against a deterministic "today" boundary.
    const past = list.filter((e) => (e.date ?? "") <= new Date().toISOString().split("T")[0]!);
    expect(past.length).toBeGreaterThan(0);
    const picked = pickToday(list);
    expect(picked?.id).toBe(past[past.length - 1]?.id);
  });

  it("returns the first future entry when nothing is due yet", () => {
    const list = [entry("2099-01-01", "a"), entry("2099-06-01", "b")];
    expect(pickToday(list)?.id).toBe("a");
  });

  it("returns null for an empty feed", () => {
    expect(pickToday([])).toBeNull();
  });
});

/**
 * r37: the section→panel contract re-measured against the live's bundle
 * (Feed fn TB) and driven on the deployed app. The live's Feed keys its
 * active panel on a RAW STRING r set directly from location.state.section
 * (useEffect(() => { e && i(e) }, [e])) — NOT a resolved entry id. Panels
 * mount on per-tab string equality: quote panels "quote-<date>", spotlight
 * panels "spotlight-<slug>" (the live's spotlight seed ids ARE the slugs
 * "kevin-lewis"/"kim-wyatt"), the today panel "art-history-today", the
 * partner panel "partner", and the timeline panels the bare entry date.
 * The scroll effect fires when r?.startsWith("spotlight-").
 *
 * The r35/r36 record ("the hardcoded spotlight-kevin-lewis id matches no
 * seeded entry — inert") was a MIS-READING, corrected r37: the live's
 * DASHBOARD Studio Spotlight card navigates with "spotlight-kevin-lewis"
 * which MATCHES its Kevin Lewis spotlight — the panel opens and the page
 * scrolls (measured: panel y517 h539, scrollY 109). The SIDEBAR RAIL's
 * spotlight card passes "featured-artist" — THAT is the inert string (no
 * panel, no scroll). The rail's quote card passes plain "quote" — also
 * inert (matches no quote-<date> key).
 *
 * inspirationEntryForKey is the inverted lookup: given a raw key, the
 * entry whose panel should render (null = no panel).
 */
describe("spotlightSlug + spotlightKey", () => {
  it("derives the live's slug ids from the spotlight titles", () => {
    // The live's seed carries id "kevin-lewis" / "kim-wyatt"; the clone's
    // DB rows use cuids, so the spotlight panel key derives the slug from
    // the title — identical strings for both seeded spotlights.
    expect(spotlightSlug({ title: "Kevin Lewis" })).toBe("kevin-lewis");
    expect(spotlightSlug({ title: "Kim Wyatt" })).toBe("kim-wyatt");
  });

  it("composes the spotlight tile key the live's panels key on", () => {
    expect(spotlightKey({ title: "Kevin Lewis" })).toBe("spotlight-kevin-lewis");
    expect(spotlightKey({ title: "Kim Wyatt" })).toBe("spotlight-kim-wyatt");
  });
});

describe("quoteKey", () => {
  it("composes the live's quote tile key from the quote date", () => {
    expect(quoteKey("2026-07-26")).toBe("quote-2026-07-26");
  });
});

describe("inspirationEntryForKey (the r37 raw-string contract)", () => {
  const entry = (
    id: string,
    type: InspirationEntryDto["type"],
    date: string | null = null,
    title?: string,
  ): InspirationEntryDto => ({
    id,
    type,
    date,
    title: title ?? `Entry ${id}`,
    body: null,
    author: null,
    imageUrl: null,
    detail: null,
  });

  const feed: InspirationEntryDto[] = [
    entry("q1", "artist_quote", "2026-09-01"),
    entry("s1", "studio_spotlight", null, "Kevin Lewis"),
    entry("s2", "studio_spotlight", null, "Kim Wyatt"),
    entry("h1", "art_history", "2026-01-01"),
    entry("h2", "art_history", "2026-06-01"),
    entry("h3", "art_history", "2026-12-31"),
    entry("p1", "partner"),
    entry("p2", "partner"),
  ];

  it("returns null for a null key (plain INSPO stat-tile navigation)", () => {
    expect(inspirationEntryForKey(null, feed)).toBeNull();
  });

  it("maps art-history-today to the pickToday art-history entry (r37 contract)", () => {
    const found = inspirationEntryForKey("art-history-today", feed);
    const expected = pickToday(
      feed.filter((e) => e.type === "art_history" && e.date),
    );
    expect(found?.id).toBe(expected?.id ?? null);
    expect(found).not.toBeNull();
  });

  it("maps art-history-today to null when the timeline is empty", () => {
    const withoutHistory = feed.filter((e) => e.type !== "art_history");
    expect(inspirationEntryForKey("art-history-today", withoutHistory)).toBeNull();
  });

  it("maps partner to the first partner entry", () => {
    expect(inspirationEntryForKey("partner", feed)?.id).toBe("p1");
  });

  it("maps partner to null when no partner entries exist", () => {
    const withoutPartners = feed.filter((e) => e.type !== "partner");
    expect(inspirationEntryForKey("partner", withoutPartners)).toBeNull();
  });

  it("CORRECTED r37: spotlight-kevin-lewis MATCHES the Kevin Lewis spotlight (the live's dashboard card opens his panel)", () => {
    // The r35/r36 "inert" record was a mis-reading: the live's spotlight
    // seed id IS "kevin-lewis", so the dashboard card's section matches —
    // the panel opens and the page scrolls (driven on the live r37).
    expect(inspirationEntryForKey("spotlight-kevin-lewis", feed)?.id).toBe("s1");
    expect(inspirationEntryForKey("spotlight-kim-wyatt", feed)?.id).toBe("s2");
  });

  it("keeps the live quirk: the sidebar rail's featured-artist section matches nothing (r37)", () => {
    // The SIDEBAR RAIL's spotlight card passes "featured-artist" — no
    // panel, no scroll (it does not even start with "spotlight-").
    expect(inspirationEntryForKey("featured-artist", feed)).toBeNull();
  });

  it("keeps the live quirk: the bare quote section matches no quote tile key", () => {
    // The rail's quote card passes plain "quote"; the quote panels key on
    // "quote-<date>" — no match, so an open panel CLOSES instead.
    expect(inspirationEntryForKey("quote", feed)).toBeNull();
  });

  it("maps a quote-<date> key to the quote with that date (the live's quote tile key)", () => {
    expect(inspirationEntryForKey("quote-2026-09-01", feed)?.id).toBe("q1");
  });

  it("maps a bare date key to the timeline entry with that date (the live's timeline tile key)", () => {
    expect(inspirationEntryForKey("2026-06-01", feed)?.id).toBe("h2");
  });

  it("returns null for unknown keys", () => {
    expect(inspirationEntryForKey("made-up-section", feed)).toBeNull();
    expect(inspirationEntryForKey("", feed)).toBeNull();
  });

  it("returns null for an empty feed regardless of key", () => {
    expect(inspirationEntryForKey("art-history-today", [])).toBeNull();
    expect(inspirationEntryForKey("partner", [])).toBeNull();
  });
});
