/**
 * Inspiration detail domain — the typed payload behind the live app's
 * inspiration overlay panels (QUOTE OF THE DAY, STUDIO SPOTLIGHT, TODAY IN
 * ART HISTORY, PARTNERS). Stored as JSON in `InspirationEntry.detailJson`
 * (same pattern as `Project.photos`) and parsed defensively at the DTO
 * boundary: corrupt or invalid JSON degrades to `null`, never throws.
 */
import { z } from "zod";

const detailText = (max: number) =>
  z.string().max(max).nullable().optional();

export const inspirationDetailSchema = z.object({
  /** Panel headline, e.g. "Mary Cassatt on Solitude, Independence, and Work". */
  title: detailText(200),
  /** Secondary line, e.g. "@kevinlewisart · Kevin Lewis Studio". */
  subtitle: detailText(200),
  /** The quoted sentence for artist_quote entries. */
  quote: detailText(600),
  /** Long-form body copy (art-history essays, spotlight bios). */
  body: detailText(6000),
  /** Artwork caption, e.g. "The Child's Bath (1893) · Mary Cassatt". */
  artwork: detailText(300),
  /** Provenance line for the artwork citation. */
  citation: detailText(600),
  /** r35: the citation's external href (the live renders the citation as
   * an underlined target=_blank link — e.g. artic.edu for the Cassatt
   * quote, rijksmuseum.nl for the Rembrandt history entry). */
  citationUrl: detailText(600),
  /** Rights / public-domain notice. */
  rights: detailText(600),
  /** Tag chips rendered under the panel body. The quote/history panels
   * render them as uppercase lavender pills (capped at four); the
   * spotlight panels render them MIXED CASE with per-tag colors from
   * the parallel tagColors array (r36 — the live's data contract). */
  tags: z.array(z.string().max(60)).max(12).optional(),
  /** r36: the spotlight panels' per-tag pill colors — a parallel array
   * of class fragments (e.g. "text-ast-pink bg-ast-pink/20"), one per
   * tag, with a faint-on-lavender/10 fallback when absent (the live's
   * bundle: `${e.tagColors[n] ?? 'text-ast_faint bg-ast_lavender/10'}`).
   * Hyphenated spellings — the clone's token family. */
  tagColors: z.array(z.string().max(120)).max(12).optional(),
  /** r37: the artwork image's alt text (the live's image_alt_text) —
   * used by the timeline tile thumbs and the history panel artwork
   * images (the Van Gogh + Monet entries' wikimedia artworks). */
  imageAlt: detailText(300),
  /** Attribution notice, e.g. "Artwork by Kevin Lewis. Used with artist permission." */
  attribution: detailText(300),
  /** External link label (the live's websiteLabel — e.g. "kimwyatt.art";
   * the view appends the arrow). */
  linkLabel: detailText(120),
  /** External link target (https or bare host). */
  linkUrl: detailText(300),
  /** r35/r36: the spotlight panel's artwork gallery — {url, alt} objects
   * (the live's data carries per-artwork alts: "Kevin Lewis — artwork 1"
   * .. "Kevin Lewis's studio"; the alt falls back to the entry name).
   * The live renders a full-width main image plus a thumbnail selector
   * whenever the entry carries more than one artwork (Kevin Lewis's
   * five app-CDN pieces; Kim Wyatt's single external wixstatic image
   * renders without the thumb strip). */
  gallery: z
    .array(
      z.object({
        url: z.string().max(600),
        alt: z.string().max(200).optional(),
      }),
    )
    .max(12)
    .optional(),
});

export type InspirationDetail = z.infer<typeof inspirationDetailSchema>;

export function parseInspirationDetail(raw: string | null): InspirationDetail | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const result = inspirationDetailSchema.safeParse(parsed);
  return result.success ? result.data : null;
}

/**
 * Picks the "today" art-history entry: the most recent dated entry on or
 * before the current date, falling back to the first upcoming entry so the
 * Today feed never renders empty while the timeline has content.
 *
 * Precondition: `history` must already be sorted ascending by date (the
 * inspiration view and the sidebar rail both sort before calling).
 */
export function pickToday<
  T extends { date: string | null },
>(history: T[]): T | null {
  if (history.length === 0) return null;
  const now = new Date().toISOString().split("T")[0] ?? "";
  const past = history.filter((e) => (e.date ?? "") <= now);
  if (past.length > 0) return past[past.length - 1] ?? null;
  return history[0] ?? null;
}

/**
 * r37: the section→panel contract, re-measured against the live's bundle
 * (Feed fn TB) and driven on the deployed app. The live's Feed keys its
 * active panel on a RAW STRING r set directly from location.state.section
 * (useEffect(() => { e && i(e) }, [e])) — NEVER a resolved entry id.
 * Panels mount on per-tab string equality:
 *
 * - quote panels → `quote-<date>` (the quote tiles' key)
 * - spotlight panels → `spotlight-<slug>` — the live's spotlight seed ids
 *   ARE the slugs "kevin-lewis"/"kim-wyatt" (the clone's DB rows use
 *   cuids, so the slug derives from the title — identical strings)
 * - the today panel → "art-history-today" (with the pickToday entry)
 * - the partner panel → "partner"
 * - the timeline panels → the bare entry date
 *
 * The r35/r36 record ("the hardcoded spotlight-kevin-lewis id matches no
 * seeded entry — inert") was a MIS-READING, corrected r37: the DASHBOARD's
 * Studio Spotlight card navigates with "spotlight-kevin-lewis", which
 * MATCHES the live's Kevin Lewis spotlight — the panel opens and the page
 * scrolls (driven: panel y517 h539, scrollY 109). The SIDEBAR RAIL's
 * spotlight card passes "featured-artist" — THAT is the inert string (no
 * panel, no scroll; it does not even start with "spotlight-"). The rail's
 * quote card passes plain "quote" — also inert (no quote-<date> key ever
 * equals "quote"), so an open panel CLOSES on that navigation.
 *
 * inspirationEntryForKey is the inverted lookup — given a raw key, the
 * entry whose panel should render (null = no panel). The view implements
 * the per-tab lookups directly (as the live's JSX does); this helper is
 * the tested single-source spec of the key grammar.
 */
export function inspirationEntryForKey<
  T extends { title: string; type: string; date: string | null },
>(key: string | null, entries: T[]): T | null {
  if (!key) return null;
  if (key === "art-history-today") {
    const history = entries
      .filter((e) => e.type === "art_history" && e.date)
      .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
    return pickToday(history);
  }
  if (key === "partner") {
    return entries.find((e) => e.type === "partner") ?? null;
  }
  if (key.startsWith("spotlight-")) {
    const slug = key.slice("spotlight-".length);
    return (
      entries.find(
        (e) => e.type === "studio_spotlight" && spotlightSlug(e) === slug,
      ) ?? null
    );
  }
  if (key.startsWith("quote-")) {
    const date = key.slice("quote-".length);
    return entries.find((e) => e.type === "artist_quote" && e.date === date) ?? null;
  }
  // A bare date key → the timeline entry with that date (the timeline
  // tiles' key). "quote" / "featured-artist" / anything else matches
  // nothing → null (the live's inert strings).
  return entries.find((e) => e.type === "art_history" && e.date === key) ?? null;
}

/**
 * The live's spotlight slug — its seed ids are the lowercased hyphenated
 * names ("kevin-lewis" / "kim-wyatt"); the clone's DB rows use cuids, so
 * the spotlight tile/panel key derives the slug from the title. The
 * derivation is deterministic and pinned by seed-fidelity (both seeded
 * spotlight titles map to the live's exact slugs).
 */
export function spotlightSlug(entry: { title: string }): string {
  return entry.title.trim().toLowerCase().replace(/\s+/g, "-");
}

/** The spotlight tile/panel key the live's Feed keys on: `spotlight-${e.id}`. */
export function spotlightKey(entry: { title: string }): string {
  return `spotlight-${spotlightSlug(entry)}`;
}

/** The quote tile/panel key the live's Feed keys on: `quote-${e.date}`. */
export function quoteKey(date: string): string {
  return `quote-${date}`;
}
