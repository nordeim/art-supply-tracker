import { describe, expect, it } from "vitest";

import {
  inspirationDetailSchema,
  parseInspirationDetail,
  pickToday,
  resolveInspirationFocus,
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
      rights: "Public domain.",
      tags: ["IMPRESSIONISM", "CASSATT"],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts a spotlight detail with handle and link", () => {
    const parsed = inspirationDetailSchema.safeParse({
      subtitle: "@kevinlewisart · Kevin Lewis Studio",
      body: "Kevin Lewis is a San Diego artist whose work is vivid and intense.",
      tags: ["Mixed Media", "Textile", "Spotlight"],
      attribution: "Artwork by Kevin Lewis. Used with artist permission.",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.subtitle).toContain("@kevinlewisart");
    }
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
 * resolveInspirationFocus maps a sidebar/dashboard rail navigation "section"
 * to the Feed entry whose detail panel should auto-expand — mirroring the
 * live app's Feed component (extracted from the deployed bundle):
 *   - "art-history-today" → the pickToday art-history entry
 *   - "partner" → the first partner entry
 *   - "spotlight-<id>" → that spotlight entry when the id matches a seeded
 *     one (the live's two callers pass the hardcoded "spotlight-kevin-lewis",
 *     which matches none of its seeded entries → no panel — the live quirk
 *     this suite pins)
 *   - "quote" is never consumed by the live Feed → no panel (pinned quirk)
 */
describe("resolveInspirationFocus", () => {
  const entry = (
    id: string,
    type: InspirationEntryDto["type"],
    date: string | null = null,
  ): InspirationEntryDto => ({
    id,
    type,
    date,
    title: `Entry ${id}`,
    body: null,
    author: null,
    imageUrl: null,
    detail: null,
  });

  const feed: InspirationEntryDto[] = [
    entry("q1", "artist_quote", "2026-09-01"),
    entry("s1", "studio_spotlight"),
    entry("h1", "art_history", "2026-01-01"),
    entry("h2", "art_history", "2026-06-01"),
    entry("h3", "art_history", "2026-12-31"),
    entry("p1", "partner"),
    entry("p2", "partner"),
  ];

  it("returns null for a null section (plain INSPO stat-tile navigation)", () => {
    expect(resolveInspirationFocus(null, feed)).toBeNull();
  });

  it("maps art-history-today to the pickToday art-history entry", () => {
    const focus = resolveInspirationFocus("art-history-today", feed);
    const expected = pickToday(
      feed.filter((e) => e.type === "art_history" && e.date),
    );
    expect(focus).toBe(expected?.id ?? null);
    expect(focus).not.toBeNull();
  });

  it("maps art-history-today to null when the timeline is empty", () => {
    const withoutHistory = feed.filter((e) => e.type !== "art_history");
    expect(
      resolveInspirationFocus("art-history-today", withoutHistory),
    ).toBeNull();
  });

  it("maps partner to the first partner entry", () => {
    expect(resolveInspirationFocus("partner", feed)).toBe("p1");
  });

  it("maps partner to null when no partner entries exist", () => {
    const withoutPartners = feed.filter((e) => e.type !== "partner");
    expect(resolveInspirationFocus("partner", withoutPartners)).toBeNull();
  });

  it("maps spotlight-<id> to the entry only when a seeded spotlight has that id", () => {
    expect(resolveInspirationFocus("spotlight-s1", feed)).toBe("s1");
  });

  it("keeps the live quirk: the hardcoded spotlight-kevin-lewis id matches no seeded entry", () => {
    // The live app's dashboard card and sidebar rail navigate with this
    // hardcoded section; its seed (and ours — cuid ids) has no such entry,
    // so nothing expands. Pinned so the quirk cannot silently "improve".
    expect(resolveInspirationFocus("spotlight-kevin-lewis", feed)).toBeNull();
  });

  it("keeps the live quirk: the quote section is never consumed", () => {
    expect(resolveInspirationFocus("quote", feed)).toBeNull();
  });

  it("returns null for unknown sections", () => {
    expect(resolveInspirationFocus("made-up-section", feed)).toBeNull();
    expect(resolveInspirationFocus("", feed)).toBeNull();
  });

  it("returns null for an empty feed regardless of section", () => {
    expect(resolveInspirationFocus("art-history-today", [])).toBeNull();
    expect(resolveInspirationFocus("partner", [])).toBeNull();
  });
});
