/**
 * Header memory-button fidelity — r13 file-content pins.
 *
 * Why a file-content test (the sidebar-tile / drawer-fidelity pattern): the
 * header's "✧ What was I working on?" button's parity contract lives in its
 * class string, and the live's own CSS is the ground truth. Measured
 * 2026-09-19 on the deployed bundle (assets/index-BNZKRdTa.css) and the live
 * DOM (pointer-resting hover state observed directly):
 *
 * - The live app carries TWO parallel Tailwind color families. The
 *   UNDERSCORED utilities (`ast_purple`, `ast_yellow`, …) compile to the
 *   "utility values" our @theme tokens pin (#5a3a8e / #ffd5a8 — used by every
 *   other surface). The HYPHENATED utilities (`ast-purple`, `ast-yellow`)
 *   exist ONLY on this button and resolve to the live `:root` variable
 *   values — the exact 4 rules in the deployed CSS:
 *     .border-ast-purple\/30        { border-color:     #5b3fd34d }
 *     .hover\:border-ast-yellow\/70:hover { border-color:     #f4f27ab3 }
 *     .hover\:bg-ast-yellow\/20:hover     { background-color: #f4f27a33 }
 *     .hover\:text-ast-yellow:hover       { color:            rgb(244 242 122) }
 *   (full-bundle scan: these are the ONLY hyphenated ast-* utilities the
 *   live emits — the memory button is the sole hyphen-family consumer).
 * - r13-F1: the clone copied the button's class string verbatim, so its
 *   hyphenated classes resolved to the UTILITY values (#5a3a8e / #ffd5a8) —
 *   the wrong idle border color (always visible) and all three hover colors
 *   (visible on any real pointer device). The fix: literal arbitrary values
 *   carrying the live's hyphen-family colors (the second sanctioned literal
 *   exception alongside the login card's border-[#5B3FD3]).
 * - r13-F2 (the hover-semantics prerequisite): the live's Tailwind v3
 *   compiles hover: variants as PLAIN `:hover` selectors — no media guard.
 *   Tailwind v4's default wraps them in `@media (hover: hover)`, which never
 *   engages on touch devices (the live's tints apply and stick on tap) and
 *   never renders in headless captures (making hover parity unverifiable).
 *   globals.css overrides the variant: `@custom-variant hover (&:hover);`.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const libDir = dirname(fileURLToPath(import.meta.url));
const studioApp = readFileSync(
  join(libDir, "../components/studio/studio-app.tsx"),
  "utf8",
);
const css = readFileSync(join(libDir, "../app/globals.css"), "utf8");

// The memory button's className line — unique in the tree by its
// `bg-white/5 px-3 py-1.5` run (verified via source scan).
const buttonLine = studioApp
  .split("\n")
  .find((line) => line.includes("bg-white/5 px-3 py-1.5"));
if (!buttonLine) throw new Error("memory button className line not found");

describe("header memory button — the live's hyphenated-family colors (r13-F1)", () => {
  it("renders the idle border with the live's #5b3fd3 purple at /30", () => {
    // Live `.border-ast-purple\/30 { border-color: #5b3fd34d }`.
    expect(buttonLine).toContain("border-[#5b3fd3]/30");
  });

  it("renders the hover border with the live's #f4f27a yellow at /70", () => {
    // Live `.hover\:border-ast-yellow\/70:hover { #f4f27ab3 }`.
    expect(buttonLine).toContain("hover:border-[#f4f27a]/70");
  });

  it("renders the hover background with the live's #f4f27a yellow at /20", () => {
    // Live `.hover\:bg-ast-yellow\/20:hover { #f4f27a33 }`.
    expect(buttonLine).toContain("hover:bg-[#f4f27a]/20");
  });

  it("renders the hover text with the live's solid #f4f27a yellow", () => {
    // Live `.hover\:text-ast-yellow:hover { rgb(244 242 122) }`.
    expect(buttonLine).toContain("hover:text-[#f4f27a]");
  });

  it("keeps every non-color class of the live's button verbatim", () => {
    expect(buttonLine).toContain(
      "flex items-center gap-2 rounded-xl border border-[#5b3fd3]/30 bg-white/5 px-3 py-1.5 text-sm text-pink-300 transition",
    );
  });

  it("does not render the idle border with the UTILITY purple (the r13-F1 bug)", () => {
    // The utility family (#5a3a8e) is every OTHER purple surface's value —
    // the live's button is the hyphen-family exception.
    expect(buttonLine).not.toContain("border-ast-purple/30");
  });

  it("does not render the hover trio with the UTILITY yellow (the r13-F1 bug)", () => {
    expect(buttonLine).not.toContain("hover:border-ast-yellow/70");
    expect(buttonLine).not.toContain("hover:bg-ast-yellow/20");
    expect(buttonLine).not.toContain("hover:text-ast-yellow");
  });
});

describe("hover variant semantics — the live's Tailwind v3 plain :hover (r13-F2)", () => {
  it("overrides Tailwind v4's media-guarded hover variant in globals.css", () => {
    // Without this, hover utilities compile inside
    // `@media (hover: hover)` — never engaging on touch (the live's tints
    // stick on tap) nor in headless captures (hover parity unverifiable).
    expect(css).toContain("@custom-variant hover (&:hover);");
  });

  it("documents the hyphenated families that resolve the :root values", () => {
    // The old comment claimed "no utility or custom rule ever resolves
    // those [ :root values ] — they are dead values" — disproven by r13:
    // the live's hyphenated utilities on the memory button resolve exactly
    // #5b3fd3 / #f4f27a. The corrected comment must keep saying so.
    expect(css).not.toContain("no utility or custom rule ever resolves those");
    expect(css).toContain("HYPHENATED");
  });
});
