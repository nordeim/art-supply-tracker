/**
 * CSS-hygiene contract (r19) — pins the compile-time exclusion and the
 * selection/caret non-authoring measured on the live app.
 *
 * Two contracts, both measured against the live's CSSOM on 2026-09-23:
 *
 * 1. The live's stylesheet authors ZERO `::selection` rules and ZERO
 *    studio-surface `caret-color` rules — every text selection renders with
 *    the UA default and every caret inherits the element color (the one
 *    caret-color rule the live DOES carry is Amplify's internal
 *    `[class*="amplify"]` reset, which never applies inside the studio).
 *    The clone must not author them either: rendered caret/selection
 *    parity was probed input-by-input on both sides (caret
 *    `rgb(255,255,255)`, ::selection transparent → UA default,
 *    placeholder white at 40% — the clone's oklab serializations resolve
 *    to the identical sRGB values, the documented compositing class).
 *
 * 2. Tailwind v4's automatic content detection scans every non-gitignored
 *    file in the project — including the committed skills/ folder, whose
 *    docs and tools carry class-like strings in their examples (measured:
 *    the gift-evaluator skill's HTML template contributed two dead
 *    red-tinted ::selection rules to the compiled stylesheet, and
 *    skills-scanned candidates inflated it by 37%). The task contract
 *    excludes skills/ from compilation; the `@source not` directive in
 *    globals.css is what enforces it. Without it the CSSOM rule count
 *    drifts (3147 rules measured with skills/ scanned vs 1442 on the
 *    live) and any future skill edit can leak arbitrary utilities into
 *    the production CSS.
 *
 * Why a file-content test: the same precedent as the other fidelity pins
 * (design-tokens, focus-fidelity, motion-fidelity) — the source files are
 * the single authority for what Tailwind emits; a source pin guards the
 * contract against a future "cleanup" deleting the directive or a scaffold
 * refresh re-adding the selection utilities.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const libDir = dirname(fileURLToPath(import.meta.url));
const cssPath = join(libDir, "../app/globals.css");
const cssRaw = readFileSync(cssPath, "utf8");
const inputPath = join(libDir, "../components/ui/input.tsx");
const inputRaw = readFileSync(inputPath, "utf8");

/** Strip block and line comments so the pins match AUTHORED rules only —
 * comments are free to discuss the very contract they guard. */
function stripComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

const css = stripComments(cssRaw);
const input = stripComments(inputRaw);

describe("CSS compile hygiene: skills/ excluded from content detection (r19)", () => {
  it("globals.css excludes the skills folder from TW4 automatic content detection", () => {
    // The directive is load-bearing: paths are stylesheet-relative
    // (src/app/globals.css → ../../ = the repo root).
    expect(css).toContain('@source not "../../skills";');
  });

  it("does not exclude any source directory the app actually compiles", () => {
    // Negative pin: only skills/ is excluded — a broader pattern (e.g.
    // ../../src) would silently drop real utilities and break the UI.
    const sources = [...css.matchAll(/@source not "([^"]+)";/g)].map(
      (m) => m[1],
    );
    expect(sources).toEqual(["../../skills"]);
  });
});

describe("Selection & caret contract: nothing authored (r19)", () => {
  it("globals.css authors no ::selection rules", () => {
    // The live's CSSOM carries zero ::selection rules; every selection on
    // both sides renders with the UA default (measured transparent
    // computed ::selection backgrounds on every input probed).
    expect(css).not.toMatch(/::selection/);
  });

  it("globals.css authors no caret-color declarations", () => {
    // Caret color inherits the element color on both sides (white on the
    // studio inputs, #0d1a26 on the login inputs' invisible-typing quirk).
    expect(css).not.toMatch(/caret-color/);
  });

  it("the shadcn Input scaffold carries no selection: utility classes", () => {
    // The scaffold default (selection:bg-primary
    // selection:text-primary-foreground) emits styled-selection rules the
    // live never shows — dead while the component is unused, divergent the
    // moment it is consumed. Stripped r19.
    expect(input).not.toMatch(/selection:/);
  });
});
