/**
 * Mobile drawer scrim fidelity — r10 file-content pins.
 *
 * Why a file-content test (the design-tokens / chat-fidelity pattern): the
 * mobile drawers' parity contract lives in its class strings. The live DOM
 * was measured post-hydration on 2026-09-18 at 390x844:
 *
 * - The live renders ONE shared scrim behind whichever drawer is open:
 *   `fixed inset-0 z-40 bg-black/60 md:hidden` (outerHTML verbatim). It has
 *   NO backdrop blur — the underlying page only DIMS. The clone rendered
 *   `…backdrop-blur-sm`, which BLURS the underlying content and is visibly
 *   different (VLM flagged it unprompted in the mobile chat-drawer pair).
 * - The scrim sits at z-40, BELOW the drawers (both live asides are z-50),
 *   so the open drawer paints above its own scrim while the rest of the
 *   page dims. The clone had the scrim at z-50 (same layer as the drawer).
 * - The scrim appears and disappears INSTANTLY: measured at click-time on
 *   the live, the scrim was already unmounted while the drawer was still
 *   mid-slide (aside at x=-27 of -312). No fade, no transition-opacity.
 * - The scrim UNMOUNTS when both drawers are closed (verified absent from
 *   the DOM in the closed state).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const libDir = dirname(fileURLToPath(import.meta.url));
const shell = readFileSync(join(libDir, "../components/studio/studio-app.tsx"), "utf8");
const sidebar = readFileSync(join(libDir, "../components/studio/studio-sidebar.tsx"), "utf8");

// The live's scrim class string, verbatim from the deployed app.
const LIVE_SCRIM = "fixed inset-0 z-40 bg-black/60 md:hidden";

describe("mobile drawer scrim (live chrome verbatim)", () => {
  it("renders the chat drawer scrim with the live's exact classes", () => {
    expect(shell).toContain(`className="${LIVE_SCRIM}"`);
  });

  it("renders the sidebar drawer scrim with the live's exact classes", () => {
    expect(sidebar).toContain(`className="${LIVE_SCRIM}"`);
  });

  it("does not blur the page behind the drawer scrim (live has no backdrop filter)", () => {
    expect(shell).not.toContain("backdrop-blur-sm md:hidden");
    expect(sidebar).not.toContain("backdrop-blur-sm");
  });

  it("keeps the scrim below the drawers (live: scrim z-40, asides z-50)", () => {
    expect(shell).toContain("fixed inset-y-0 right-0 z-50 w-4/5 max-w-xs");
    expect(sidebar).toContain("fixed inset-y-0 left-0 z-50 w-4/5 max-w-xs");
  });
});

describe("mobile drawer scrim mount behavior (live: instant, unmounts)", () => {
  it("mounts the sidebar scrim only while the drawer is open", () => {
    expect(sidebar).toContain("{sidebarOpen && (");
  });

  it("does not fade the scrim (the live's scrim has no transition)", () => {
    // Strip comments so explanatory notes (which name the removed behaviors)
    // do not trip the negative pins.
    const sidebarCode = sidebar.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    expect(sidebarCode).not.toContain("transition-opacity");
  });

  it("mounts the chat scrim only while the drawer is open", () => {
    expect(shell).toContain("{chatPanelOpen && (");
  });
});
