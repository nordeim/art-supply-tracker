/**
 * Focus & keyboard-contract fidelity — r15 file-content pins.
 *
 * Why a file-content test (the drawer-fidelity pattern): the keyboard
 * parity contract lives in source-level facts that captures cannot see.
 * The live app was probed on 2026-09-19 at DOM, computed-style, and
 * rendered-pixel level (the r15 keyboard/focus sweep — the probe class
 * that found r13-F1's hovers, extended to keyboard state):
 *
 * - FOCUS OUTLINE COLOR (r15-F1): the live's compiled CSS carries NO
 *   universal outline-color rule (its only outline rules are the TW3
 *   transparent `focus:outline-none` utility and Amplify's login chrome),
 *   so every button/tile/link renders the BROWSER DEFAULT focus ring —
 *   computed `rgb(16, 16, 16)` in this Chromium, a near-black band. The
 *   clone's shadcn scaffold shipped `* { @apply border-border
 *   outline-ring/50 }`, which AUTHORS the outline color as the
 *   turquoise `--color-ring` token at 50% — every keyboard-focused
 *   element rendered a bright turquoise ring the live never shows
 *   (canvas-verified: ring band 150,225,218 → 25,98,95 = #2ec4b6/50
 *   over the #050009 canvas, vs the live's near-black band). The fix
 *   removes the authored color so the UA default renders, byte-identical
 *   to the live. The `border-border` half of the base rule stays — it
 *   only sets the border-color default for bare `border` classes, which
 *   no element uses (inert, r14-verified), and the live's preflight
 *   carries its own inert default too.
 *
 * - MODAL KEYBOARD CONTRACT (r15-F2): the live's create modals have NO
 *   keyboard affordances — measured on the live, opening "New Project"
 *   leaves focus on the trigger button (no focus management), and
 *   pressing Escape does nothing (the overlay stays; only the ✕ button
 *   and the scrim click dismiss it). The clone's modals had added an
 *   Escape keydown handler AND an initial focus steal into the first
 *   input — behavioral divergences a keyboard user directly experiences
 *   (the same class as r13-F2's hover semantics). The fix removes both.
 *   The modals KEEP `role="dialog"` + `aria-modal="true"` — invisible
 *   semantics, the same deliberate-WCAG-improvement class as the
 *   sidebar drawer's nav landmark (kept per the r11 precedent).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const libDir = dirname(fileURLToPath(import.meta.url));
const globalsCssRaw = readFileSync(join(libDir, "../app/globals.css"), "utf8");
// Strip CSS comments so docblocks that DOCUMENT a removed rule do not
// satisfy (or trip) the negative pins — the pins target live declarations.
const globalsCss = globalsCssRaw.replace(/\/\*[\s\S]*?\*\//g, "");
const projectModal = readFileSync(
  join(libDir, "../components/studio/project-modal.tsx"),
  "utf8",
);
const supplyModal = readFileSync(
  join(libDir, "../components/studio/supply-modal.tsx"),
  "utf8",
);

describe("focus outline color (r15-F1 — UA default, no authored ring)", () => {
  it("the base layer does not author an outline color (outline-ring/50 removed)", () => {
    expect(globalsCss).not.toContain("outline-ring/50");
  });

  it("the base layer still carries the inert border-color default", () => {
    expect(globalsCss).toContain("border-border");
  });

  it("documents the UA-default focus-ring parity contract", () => {
    expect(globalsCssRaw).toContain("r15 focus-ring parity");
  });
});

describe("modal keyboard contract (r15-F2 — the live's no-affordance behavior)", () => {
  it("project modal has no Escape keydown handler", () => {
    expect(projectModal).not.toContain('"Escape"');
  });

  it("supply modal has no Escape keydown handler", () => {
    expect(supplyModal).not.toContain('"Escape"');
  });

  it("project modal has no window keydown listener", () => {
    expect(projectModal).not.toContain("window.addEventListener");
  });

  it("supply modal has no window keydown listener", () => {
    expect(supplyModal).not.toContain("window.addEventListener");
  });

  it("project modal does not steal focus into the first input", () => {
    expect(projectModal).not.toContain(')?.focus()');
  });

  it("supply modal does not steal focus into the first input", () => {
    expect(supplyModal).not.toContain(')?.focus()');
  });

  it("project modal keeps the dialog semantics (the kept WCAG improvement)", () => {
    expect(projectModal).toContain('role="dialog"');
    expect(projectModal).toContain('aria-modal="true"');
  });

  it("supply modal keeps the dialog semantics (the kept WCAG improvement)", () => {
    expect(supplyModal).toContain('role="dialog"');
    expect(supplyModal).toContain('aria-modal="true"');
  });
});
