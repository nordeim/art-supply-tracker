/**
 * Landmark & reading-order fidelity — r18 file-content pins.
 *
 * Why a file-content test (the motion-fidelity pattern): the reading-order
 * probe dimension (first suggested in session 28's close-out) lives in
 * source-level facts that pixel captures cannot see. The live app was probed
 * on 2026-09-23 at desktop (1280×800) and mobile (390×844) with a
 * display-filtered DOM walk of landmarks, headings, and live regions:
 *
 * - ANNOUNCEMENT ORDER: identical on both sides at both viewports —
 *   header → sidebar → view content → chat (the mobile bar's toggles sit
 *   inside the content pane, matching the live's placement). Probed on the
 *   dashboard and the inspiration Feed (the most complex view).
 *
 * - r18-F1 (the inert record): the LIVE's closed drawers carry NO `inert`
 *   and NO `aria-hidden` — measured with both drawers closed at 390×844,
 *   the off-screen panes keep 10 (sidebar) and 3 (chat) focusable
 *   descendants tabbable and announced; the live's mobile reading order
 *   walks the closed drawers' content BEFORE the page content. The CLONE's
 *   `inert={!open}` + `aria-hidden={!open}` pair is the r5 KEPT
 *   improvement (the same invisible-semantics class as the chat's
 *   role="log"): aria-hidden alone leaves focusable children keyboard-
 *   reachable, inert alone leaves the pane in the a11y tree — the PAIR is
 *   the contract, pinned here at source level and at runtime by the E2E
 *   mobile suite. Note: session_26's live-behavior paragraph folded this
 *   into "every measured value matches the live exactly" — that was a
 *   misattribution; the r18 measurement above is the corrected record.
 *
 * - r18-F2 (the inner main): the LIVE wraps its desktop content pane in a
 *   nested `<main class="col-span-7">` INSIDE the outer `<main>` — two
 *   "main" landmarks (invalid HTML; a screen reader announces main twice).
 *   The CLONE's content pane is a plain `<section>` — the single-`<main>`
 *   structure is kept as the accepted landmark divergence (the
 *   nav-vs-aside precedent).
 *
 * - r18-F3 (the twin copies): the LIVE renders every view's content TWICE
 *   — a `SECTION hidden md:grid` desktop copy and a `SECTION flex
 *   md:hidden` mobile copy, one always `display:none` (removed from the
 *   a11y tree, so the order above is unaffected). The CLONE renders ONE
 *   responsive copy: the layout container is `flex-col` below md and
 *   `md:grid` at md+ (studio-app.tsx:288), the content pane carries both
 *   the mobile margins and `md:col-span-7` (line 307). Invisible in every
 *   capture (pixel parity proven at both viewports); pinned here so the
 *   twin-copy pattern cannot be introduced without failing the pin.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const libDir = dirname(fileURLToPath(import.meta.url));
const studioDir = join(libDir, "../components/studio");
const studioApp = readFileSync(join(studioDir, "studio-app.tsx"), "utf8");
const studioSidebar = readFileSync(join(studioDir, "studio-sidebar.tsx"), "utf8");

describe("r18-F1 — the closed drawers carry the inert + aria-hidden pair (the kept r5 improvement)", () => {
  it("the sidebar drawer pairs inert with aria-hidden (either alone breaks the contract)", () => {
    expect(studioSidebar).toContain('inert={!sidebarOpen}');
    expect(studioSidebar).toContain('aria-hidden={!sidebarOpen}');
  });

  it("the chat drawer pairs inert with aria-hidden (either alone breaks the contract)", () => {
    expect(studioApp).toContain('inert={!chatPanelOpen}');
    expect(studioApp).toContain('aria-hidden={!chatPanelOpen}');
  });

  it("the drawers keep their accessible names (labeled landmarks — the live's are unlabeled asides)", () => {
    expect(studioSidebar).toContain('aria-label="Studio tools"');
    expect(studioApp).toContain('aria-label="Community chat"');
  });
});

describe("r18-F2 — the content pane is a section, not a nested main", () => {
  it("studio-app declares exactly one <main> (the outer shell)", () => {
    expect(studioApp.match(/<main[\s>]/g)?.length ?? 0).toBe(1);
  });

  it("the content pane is the purple-bordered section with the md:col-span-7 grid seat", () => {
    expect(studioApp).toContain(
      '<section className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-left mx-4 mb-4 rounded-3xl border border-ast-purple/50 bg-[#0B0018] p-6 backdrop-blur-xl md:col-span-7 md:mx-0 md:mb-0">',
    );
  });

  it("the desktop sidebar and chat panes are plain asides, like the live's (no labels)", () => {
    expect(studioSidebar).toContain(
      '<aside className="hidden min-h-0 overflow-y-auto scrollbar-left rounded-3xl border border-ast-turquoise/30 bg-[#0B0018] p-4 backdrop-blur-xl md:col-span-3 md:block">',
    );
    expect(studioApp).toContain(
      '<aside className="hidden min-h-0 overflow-hidden rounded-3xl border border-ast-pink/40 bg-[#0B0018] p-4 backdrop-blur-xl md:col-span-2 md:block">',
    );
  });
});

describe("r18-F3 — one responsive content copy (the live renders two md-toggled copies)", () => {
  it("the layout container switches flex-col → md:grid (the single-copy responsive contract)", () => {
    expect(studioApp).toContain(
      '<div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-12 md:gap-4 md:px-4 md:pb-4">',
    );
  });

  it("studio-app renders exactly one layout-level content section", () => {
    expect(studioApp.match(/<section[\s>]/g)?.length ?? 0).toBe(1);
  });

  it("the twin-copy pattern is absent (no hidden md:grid content pane — the live's structure)", () => {
    expect(studioApp).not.toContain("hidden md:grid");
    expect(studioApp).not.toContain("flex md:hidden");
  });
});
