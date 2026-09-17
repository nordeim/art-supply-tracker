/**
 * Design-token contract — pins the literal hex values in globals.css to the
 * live app's *compiled utility classes* (the rendered ground truth), not the
 * live bundle's vestigial `:root` variable block.
 *
 * Why a file-content test: Tailwind v4 `@theme` literals are the single
 * source of every ast-* utility. The live app carries TWO divergent color
 * systems (a `:root` CSS-variable block and the Tailwind utilities compiled
 * from its config); only the utilities are what users see. Session r3
 * mistakenly aligned three tokens to the `:root` values (purple #5b3fd3,
 * yellow #f4f27a, coral #ffe0cc) — the rendered live values are
 * #5a3a8e / #ffd5a8 / #ff7a7a (verified 2026-09-17 against
 * studiobeta.artsupplytracker.com computed styles and the deployed CSS:
 * `.text-ast_purple{color:rgb(90 58 182→142)}`, `.text-ast_yellow{rgb(255
 * 213 168)}`, `.text-ast_coral{rgb(255 122 122)}`, and the scrollbar thumb
 * `linear-gradient(rgb(255,77,184), rgb(90,58,142))`).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const cssPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../app/globals.css",
);
const css = readFileSync(cssPath, "utf8");

function token(name: string): string {
  const match = new RegExp(`--${name}:\\s*([^;]+);`).exec(css);
  if (!match) throw new Error(`Token --${name} not found in globals.css`);
  return match[1].trim();
}

describe("AST palette tokens (live compiled-utility ground truth)", () => {
  it("renders purple as the live utility #5a3a8e", () => {
    // Live `.text-ast_purple` / `.bg-ast_purple` = rgb(90, 58, 142).
    expect(token("color-ast-purple")).toBe("#5a3a8e");
  });

  it("renders yellow as the live utility #ffd5a8", () => {
    // Live `.text-ast_yellow` = rgb(255, 213, 168) — the Cancel/Delete/
    // Close button color, On Hold pills, and low-condition icons.
    expect(token("color-ast-yellow")).toBe("#ffd5a8");
  });

  it("renders coral as the live utility #ff7a7a", () => {
    // Live `.text-ast_coral` = rgb(255, 122, 122) — Needs Sorting bucket.
    expect(token("color-ast-coral")).toBe("#ff7a7a");
  });

  it("keeps the verified tokens that already match the live bundle", () => {
    expect(token("color-ast-turquoise")).toBe("#2ec4b6");
    expect(token("color-ast-cyan")).toBe("#00e6ff");
    expect(token("color-ast-lavender")).toBe("#b78bff");
    expect(token("color-ast-pink")).toBe("#ff4db8");
    expect(token("color-ast-blue")).toBe("#4a69d6");
    expect(token("color-ast-electric-blue")).toBe("#2e64ff");
    expect(token("color-ast-body")).toBe("#fff4d6");
    expect(token("color-ast-muted")).toBe("#dcc7ff");
    expect(token("color-ast-faint")).toBe("#9f7fd6");
    expect(token("color-ast-orange")).toBe("#ffb85c");
  });
});

describe("AST glow shadows (live bundle verbatim)", () => {
  it("keeps the six radial glow blobs", () => {
    expect(token("shadow-ast-pink")).toBe("0 0 28px 0 rgba(255, 77, 166, 0.55)");
    expect(token("shadow-ast-turquoise")).toBe("0 0 28px 0 rgba(46, 196, 182, 0.45)");
    expect(token("shadow-ast-blue")).toBe("0 0 28px 0 rgba(46, 100, 255, 0.45)");
    expect(token("shadow-ast-cyan")).toBe("0 0 28px 0 rgba(0, 230, 255, 0.35)");
    expect(token("shadow-ast-lavender")).toBe("0 0 28px 0 rgba(183, 139, 255, 0.4)");
    expect(token("shadow-ast-warm")).toBe("0 0 24px 0 rgba(255, 213, 168, 0.35)");
  });
});
