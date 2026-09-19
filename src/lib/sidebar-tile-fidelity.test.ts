/**
 * Sidebar stat-tile fidelity — r12 file-content pins.
 *
 * Why a file-content test (the drawer-fidelity / supply-fidelity pattern):
 * the stat tiles' parity contract lives in its class strings. The live DOM
 * was measured post-hydration on 2026-09-19 at BOTH 1536x844 (desktop
 * sidebar) and 390x844 (mobile drawer — the contract is identical), with
 * each of the three views visited so each tile's ACTIVE state was observed:
 *
 * - IDLE tiles (verified byte-identical to the clone's props since r3):
 *   Projects `border-ast_turquoise/30`, Supplies `border-ast_lavender/30`,
 *   Inspo `border-ast_purple/30`, all on `bg-[#120724]`, with the live's
 *   hover treatments (electric-blue for Projects/Supplies, lavender for
 *   Inspo).
 * - The ACTIVE view's tile swaps in that tile's OWN accent pair and DROPS
 *   the card background and hover classes:
 *     ACTIVE Projects: `border-ast_electric_blue/60 bg-ast_electric_blue/10`
 *     ACTIVE Supplies: `border-ast_electric_blue/60 bg-ast_electric_blue/10`
 *     ACTIVE Inspo:    `border-ast_lavender/60 bg-ast_lavender/10`
 *   (computed on the live's active Inspo tile: border rgba(183,139,255,.6),
 *   background rgba(183,139,255,.1), no box-shadow, rect 106x78 @ 257,173).
 *   The clone had ONE hardcoded electric-blue active pair for all three —
 *   visibly wrong on the Inspiration view, where the live highlights the
 *   INSPO tile in lavender (VLM + pixel-diff flagged it as r12-F1).
 * - The inner text classes (label / value / sub) are CONSTANT regardless
 *   of active state — the live reuses the same per-tile text props in both
 *   branches (measured: label `text-ast_lavender`, value
 *   `text-ast_lavender/80`, sub `text-ast_body/55` on the active Inspo
 *   tile — identical to its idle strings).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const libDir = dirname(fileURLToPath(import.meta.url));
const sidebar = readFileSync(join(libDir, "../components/studio/studio-sidebar.tsx"), "utf8");

// The live's active-accent pairs, verbatim from the deployed app (converted
// to the clone's dash-case token names; the live's Tailwind v3 uses
// underscores, the clone's v4 uses dashes — pinned by design-tokens tests).
const LIVE_ACTIVE_ELECTRIC = "border-ast-electric-blue/60 bg-ast-electric-blue/10";
const LIVE_ACTIVE_LAVENDER = "border-ast-lavender/60 bg-ast-lavender/10";

describe("sidebar stat tiles — active accent contract (live-measured r12)", () => {
  it("types StatCard to take a per-tile active accent class", () => {
    expect(sidebar).toContain("activeClass: string");
  });

  it("highlights the ACTIVE Projects tile with the live's electric-blue pair", () => {
    expect(sidebar).toContain(`activeClass="${LIVE_ACTIVE_ELECTRIC}"`);
  });

  it("highlights the ACTIVE Supplies tile with the live's electric-blue pair", () => {
    // Projects and Supplies share the accent, so the prop literal appears
    // on both tiles — pinned by the per-tile call sites below.
    const callSites = sidebar.split("StatCard").filter((chunk) =>
      chunk.includes(`activeClass="${LIVE_ACTIVE_ELECTRIC}"`),
    );
    expect(callSites.length).toBeGreaterThanOrEqual(2);
  });

  it("highlights the ACTIVE Inspo tile with the live's LAVENDER pair (r12-F1)", () => {
    expect(sidebar).toContain(`activeClass="${LIVE_ACTIVE_LAVENDER}"`);
  });

  it("applies the per-tile accent in the active branch (base classes + accent)", () => {
    expect(sidebar).toContain(
      "? `rounded-xl border p-2.5 text-left transition ${activeClass}`",
    );
  });

  it("drops the card background and hover classes while active (live behavior)", () => {
    const activeBranch = sidebar.split("\n").find((line) => line.includes("${activeClass}`"));
    expect(activeBranch).toBeTruthy();
    expect(activeBranch).not.toContain("bg-[#120724]");
    expect(activeBranch).not.toContain("hover:");
  });

  it("keeps the idle branch's card background + per-tile idle/hover classes (regression guard)", () => {
    expect(sidebar).toContain(
      "`rounded-xl border bg-[#120724] p-2.5 text-left transition ${idleBorder} ${hoverBorder}`",
    );
  });

  it("renders the inner text classes identically in both branches (constant props)", () => {
    expect(sidebar).toContain("text-[10px] font-bold uppercase tracking-wider ${labelClass}");
    expect(sidebar).toContain("mt-0.5 text-lg font-bold ${valueClass}");
    expect(sidebar).toContain("text-[9px] leading-tight ${subClass}");
  });

  it("does not hardcode a single active accent for all tiles (the r12-F1 bug)", () => {
    // Strip comments so explanatory notes naming the old behavior do not
    // trip the negative pin.
    const code = sidebar.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    expect(code).not.toContain(
      '"rounded-xl border border-ast-electric-blue/60 bg-ast-electric-blue/10',
    );
  });
});
