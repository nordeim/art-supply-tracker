/**
 * Viewport-band fidelity (r29) — pins the login card's 480px handoff
 * and the document's overflow-x clipping.
 *
 * Measured on the live 2026-09-27 (the 480-768 band the prior rounds
 * never probed — the pinned viewports were 375/390 mobile and 1280
 * desktop, leaving the middle unmeasured; session_49 flagged it):
 *
 *   viewport | live login card | live layout track
 *   ---------+-----------------+-------------------
 *   390      | 357 @ x16.5     | column (358)
 *   414      | 357 @ x28.5     | column (382)
 *   480      | 480 @ x16       | 480px (overflows the 448 column)
 *   560      | 480 @ x40       | 528px (fills, card centered)
 *   640      | 480 @ x80       | 608px
 *   720      | 480 @ x120      | 688px
 *   768      | 480 @ x16 y346  | grid 480px 420px (the 1fr track's
 *                               | auto-min expands to the card's
 *                               | min-content: 480)
 *   1024     | 480 @ x46       | grid 540px 420px
 *   1280     | 480 @ x174      | grid 572px 420px
 *
 * The live's card is EFFECTIVELY fixed-480 from viewport 480 up (its
 * inner amplify grid declares a 480px track at `min-width: 480px`),
 * which does two things a plain max-width cannot:
 *
 * 1. below md, the card's 480 min-content raises the layout grid's
 *    single implicit track to max(480, column) — at exactly 480 the
 *    track overflows the 16px-padded column (card x16, right edge
 *    x496) and the live CLIPS it: its global rule
 *    `html, body, #root { overflow-x: hidden }` keeps
 *    documentElement.scrollWidth at 480 (no horizontal scrollbar);
 * 2. at md+ the `1fr` track (minmax(auto, 1fr)) cannot shrink below
 *    the card section's min-content — at 768 it resolves to 480px
 *    (not 284px), which rewraps the text section (h 416 -> 244),
 *    re-centers the grid (h 877 -> 705, y 40 -> 70) and lands the
 *    card at (16, 346) with the logo panel at x528 — the clone's
 *    284px track rendered the whole page 38.93% off at that viewport.
 *
 * The clone replicates the mechanism with the card class pair
 * `min-[480px]:min-w-[480px] min-[480px]:max-w-[480px]` (a fixed-480
 * width at >=480 over w-full + mx-auto: the min-width supplies the
 * min-content, the max-width caps the filled track, mx-auto centers
 * when the track is wider) plus the live's overflow-x rule in
 * globals.css. Do NOT replace the pair with a plain
 * `md:max-w-[480px]` (the r27 measure — correct at 390 and 1280, but
 * wrong across the entire 480-768 band and broken at exactly 768).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const libDir = dirname(fileURLToPath(import.meta.url));

const login = readFileSync(
  join(libDir, "../components/studio/login-screen.tsx"),
  "utf8",
);
const globals = readFileSync(join(libDir, "../app/globals.css"), "utf8");

describe("viewport-band pins (r29: the 480-768 handoff)", () => {
  it("fixes the login card at 480px from viewport 480 up (the live's min-content handoff)", () => {
    // The pair replicates the live's fixed-480-from-480 card: below 480
    // the unconditional max-w-[357px] holds (390: 357 @ x16.5; 375 fills
    // 343 — the r27 measurements, unchanged), from 480 up the card is
    // exactly 480 (480: 480 @ x16; 560: 480 @ x40; 768: 480 @ x16 with
    // the 1fr track expanded to 480px; 1280: 480 @ x174).
    expect(login).toMatch(
      /mx-auto max-w-\[357px\] min-\[480px\]:min-w-\[480px\] min-\[480px\]:max-w-\[480px\]/,
    );
    // the old handoff capped ONLY at md — the whole 480-767 band
    // rendered the 357 card and exactly-768 collapsed the 1fr track to
    // 284 (text rewrap + 38.93% capture diff).
    expect(login).not.toMatch(/md:max-w-\[480px\]/);
  });

  it("keeps the layout grid's template untouched (the min-content mechanism, not a template change)", () => {
    // The live's own layout div is byte-identical to the clone's
    // (`w-full max-w-5xl grid gap-8 md:grid-cols-[1fr_420px]
    // items-center` — verified on the live at 768/1024/1280). Its 1fr
    // track resolves to 480px at 768 through the item's min-content,
    // NOT through a minmax() in the template — so the clone must not
    // touch the template either.
    expect(login).toContain(
      "md:grid-cols-[1fr_420px]",
    );
  });

  it("clips horizontal overflow exactly like the live (html/body overflow-x hidden)", () => {
    // The live's global rule (found in its CSSOM, selector verbatim):
    // `html, body, #root -> hidden` — overflow-x: hidden on the
    // document keeps the exactly-480 track overflow (card right edge
    // x496 > viewport 480) off the scrollbar (scrollWidth stays 480).
    // The clone has no #root mount (Next.js app router), so html +
    // body carry the rule. Vertical scrolling is unaffected (the
    // live's own desktop shell scrolls the same document).
    expect(globals).toMatch(/html,\s*body\s*\{[^}]*overflow-x:\s*hidden/);
  });
});
