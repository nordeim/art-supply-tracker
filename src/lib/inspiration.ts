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
  /** Rights / public-domain notice. */
  rights: detailText(600),
  /** Uppercase tag chips rendered under the panel body. */
  tags: z.array(z.string().max(60)).max(12).optional(),
  /** Attribution notice, e.g. "Artwork by Kevin Lewis. Used with artist permission." */
  attribution: detailText(300),
  /** External link label, e.g. "kimwyatt.art →". */
  linkLabel: detailText(120),
  /** External link target (https or bare host). */
  linkUrl: detailText(300),
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
