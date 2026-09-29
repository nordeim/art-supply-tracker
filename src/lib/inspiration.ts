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
 * Resolves a sidebar/dashboard rail navigation "section" to the Feed entry
 * whose detail panel should auto-expand — mirroring the live app's Feed
 * component (extracted from the deployed bundle):
 *
 * - "art-history-today" → the pickToday art-history entry's id
 * - "partner" → the first partner entry's id
 * - "spotlight-<id>" → that spotlight entry's id when a seeded spotlight
 *   carries it (the live's two callers pass the hardcoded
 *   "spotlight-kevin-lewis", which matches none of its seeded entries —
 *   and none of ours, whose ids are cuids — so nothing expands there)
 * - "quote" is never consumed by the live Feed → no panel (pinned quirk)
 *
 * Precondition: like pickToday, the art-history slice is sorted ascending
 * by date before it reaches this function (the caller passes the view's
 * already-sorted timeline).
 */
export function resolveInspirationFocus<
  T extends { id: string; type: string; date: string | null },
>(section: string | null, entries: T[]): string | null {
  if (!section) return null;
  if (section === "art-history-today") {
    const history = entries
      .filter((e) => e.type === "art_history" && e.date)
      .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
    return pickToday(history)?.id ?? null;
  }
  if (section === "partner") {
    return entries.find((e) => e.type === "partner")?.id ?? null;
  }
  if (section.startsWith("spotlight-")) {
    const id = section.slice("spotlight-".length);
    return entries.some((e) => e.type === "studio_spotlight" && e.id === id)
      ? id
      : null;
  }
  return null;
}
