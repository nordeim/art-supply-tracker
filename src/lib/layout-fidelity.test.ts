/**
 * Layout height fidelity — r21 file-content pins.
 *
 * Why a file-content test (the landmark-fidelity pattern): the app-shell
 * height contract lives in source-level facts that steady-state pixel
 * captures only surface as unexplained bottom strips. The live app was
 * probed on 2026-09-23 at 1536×844 (signed in, settled):
 *
 * - THE LIVE'S SHELL IS UNCAPPED. Its root <main> is a plain block
 *   (`min-h-screen overflow-hidden bg-[#050009] text-white`) wrapping a
 *   `relative z-10 flex min-h-screen flex-col` div whose desktop grid
 *   section (`hidden md:grid flex-1 grid-cols-12 gap-4 px-4 pb-4`) has NO
 *   height cap. The grid's single auto row therefore sizes to the tallest
 *   column's intrinsic content — the chat column: sticky community header
 *   (240px) + the scroll container's `max-h-[calc(100vh-16rem)]` (588px)
 *   + the card's own padding/border — 878px total. The page grows to 982px
 *   and the WINDOW SCROLLS (wheel-verified: scrollY 0→138 over the content
 *   pane; documentElement.scrollHeight 982 > 844). The sidebar and chat
 *   cards stretch to the row (their bottom borders land BELOW the fold),
 *   and the content pane rides the row height with no internal scroll of
 *   its own on the dashboard.
 *
 * - r21-F1 (the scaffold cap): the clone's shell carried the scaffold's
 *   viewport-height cap token from the INITIAL scaffold commit (f871e90,
 *   2026-09-16) — never live-measured. The cap locked the page at the
 *   viewport height (844),
 *   forced the grid row down to 740px, and the chat column's own
 *   `overflow-hidden` clipped its card at 740px — so the clone rendered
 *   the chat and sidebar cards' bottom borders + rounded corners at
 *   y=828 where the live's cards continue past the fold, and the wheel
 *   scroll was dead (scrollY stayed 0; documentElement.scrollHeight 844).
 *   Measured as ~0.43% hot strips (sidebar + chat column bottoms) on
 *   every desktop surface of the standard battery.
 *
 * - THE MOBILE SHELL WAS ALREADY RIGHT: below md the clone's main carries
 *   no cap, and the page grows to the live's exact 1563px with the same
 *   wheel-scroll behavior — the single-copy container (`flex min-h-0
 *   flex-1 flex-col md:grid md:grid-cols-12`) propagates its content
 *   height through the uncapped flex column. That mobile path is the
 *   empirical proof the same container grows the desktop grid once the
 *   viewport-height cap is gone; the cap token is pinned out below so it
 *   cannot silently return (the r19 selection / r20 forced-colors
 *   precedent of pinning scaffold tokens the live does not carry).
 *
 * The cap token in the negative pin is constructed at runtime from
 * non-utility fragments — TW4's automatic content detection scans test
 * sources too, and a complete class-shaped token in a comment or string
 * would compile the dead utility straight back into the app's CSS (the
 * r20 css-hygiene lesson).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const libDir = dirname(fileURLToPath(import.meta.url));
const studioDir = join(libDir, "../components/studio");
const studioApp = readFileSync(join(studioDir, "studio-app.tsx"), "utf8");

/** The viewport-height cap token, assembled at runtime (see docblock). */
const viewportHeightCap = ["md", ["h", "screen"].join("-")].join(":");

describe("r21-F1 — the desktop app shell grows with content like the live's (no viewport cap)", () => {
  it("the shell's main carries the live's uncapped min-height contract", () => {
    // The exact post-fix class string: flex column (the single-copy shell),
    // min-h-screen as a MINIMUM (never a cap), overflow-hidden like the live.
    expect(studioApp).toContain(
      '<main className="flex min-h-screen flex-col overflow-hidden bg-[#050009] text-white">',
    );
  });

  it("the scaffold's viewport-height cap token is gone (the live's shell has none)", () => {
    expect(studioApp).not.toContain(viewportHeightCap);
  });

  it("the single-copy container keeps the flex-1 seat that propagates content height at both breakpoints", () => {
    // The r18 single-copy contract (landmark-fidelity pins the structure);
    // the flex-1 + min-h-0 seat is what carries the content height into the
    // uncapped shell — the mobile path proves it (docH 1563 matches the live).
    expect(studioApp).toContain(
      "flex min-h-0 flex-1 flex-col md:grid md:grid-cols-12 md:gap-4 md:px-4 md:pb-4",
    );
  });

  it("the chat column keeps the live's row-driving scroll container (the r8 contract)", () => {
    // The max-h calc caps the chat's scroll container at 100vh-16rem — the
    // constant that, with the uncapped shell, sizes the grid row to the
    // live's measured 878px. Also pinned by chat-fidelity (the scroll split);
    // repeated here because it is now load-bearing for the row height.
    expect(studioApp).toContain(
      "scrollbar-right max-h-[calc(100vh-16rem)] space-y-4 overflow-y-auto pr-1",
    );
  });
});
