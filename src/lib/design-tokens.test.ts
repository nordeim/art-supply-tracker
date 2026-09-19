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
const layoutPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../app/layout.tsx",
);
const layout = readFileSync(layoutPath, "utf8");

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

/**
 * Tailwind DEFAULT palette pins — r14. The live app runs Tailwind v3, whose
 * default palette values the app uses on seven surfaces (the Sign Out
 * button, the memory button's text, the header email gradient, the barcode
 * fields' focus chrome, the chat error alert). Tailwind v4 re-derived its
 * default palette in oklch and the values drift — pink-400 renders
 * #fb64b6 on TW4 vs the live's #f472b6 (a 14/channel delta on the
 * always-visible Sign Out border), cyan-400 #00d2ef vs #22d3ee (34 in the
 * red channel of the email gradient). The @theme pins below restore the
 * live's v3 values, which makes the emitted utilities byte-identical to
 * the live's compiled rules (`.border-pink-400\/60` → `#f472b699`,
 * measured from studiobeta.artsupplytracker.com/assets/index-BNZKRdTa.css
 * on 2026-09-19: `.text-pink-200{rgb(251 207 232)}`,
 * `.text-pink-300{rgb(249 168 212)}`, `.border-pink-400\/60{#f472b699}`,
 * `.hover\:bg-pink-500\/20:hover{#ec489933}`, `.from-cyan-400{#22d3ee}`,
 * `.via-blue-500{#3b82f6}`, `.to-pink-500{#ec4899}`,
 * `.border-blue-500\/40{#3b82f666}`,
 * `.focus\:border-blue-400:focus{rgb(96 165 250)}`,
 * `.ring-blue-500\/30:focus{#3b82f64d}`).
 */
describe("Tailwind default palette (live Tailwind-v3 values, r14)", () => {
  it("pins pink-200 to the live's #fbcfe8 (Sign Out text)", () => {
    expect(token("color-pink-200")).toBe("#fbcfe8");
  });

  it("pins pink-300 to the live's #f9a8d4 (memory button + chat alert)", () => {
    expect(token("color-pink-300")).toBe("#f9a8d4");
  });

  it("pins pink-400 to the live's #f472b6 (Sign Out idle border)", () => {
    expect(token("color-pink-400")).toBe("#f472b6");
  });

  it("pins pink-500 to the live's #ec4899 (Sign Out hover bg, gradient end)", () => {
    expect(token("color-pink-500")).toBe("#ec4899");
  });

  it("pins cyan-400 to the live's #22d3ee (email gradient start)", () => {
    expect(token("color-cyan-400")).toBe("#22d3ee");
  });

  it("pins blue-400 to the live's #60a5fa (barcode focus border)", () => {
    expect(token("color-blue-400")).toBe("#60a5fa");
  });

  it("pins blue-500 to the live's #3b82f6 (gradient via, barcode ring)", () => {
    expect(token("color-blue-500")).toBe("#3b82f6");
  });

  it("rejects the Tailwind v4 drift values for the pinned families", () => {
    // TW4's re-derived palette (the pre-r14 rendered values) must not
    // reappear as the declared theme values.
    const drifted: Record<string, string> = {
      pink200: "#fccee8",
      pink300: "#fda5d5",
      pink400: "#fb64b6",
      pink500: "#f6339a",
      cyan400: "#00d2ef",
      blue400: "#54a2ff",
      blue500: "#3080ff",
    };
    for (const [name, value] of Object.entries(drifted)) {
      expect(token(`color-${kebab(name)}`)).not.toBe(value);
    }
  });
});

/**
 * Default-palette usage sites (r14). The pins above make the DEFAULT
 * families safe to use, so the app keeps the live's own class strings
 * verbatim (class-string parity with the live DOM — the original cloning
 * intent) instead of converting to literals. These pins guard against
 * someone "fixing" a surface by swapping a class to a literal (or to the
 * ast-* families, which are DIFFERENT colors) and breaking the
 * class-string parity contract.
 */
describe("default-palette usage sites (class-string parity, r14)", () => {
  const studioApp = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../components/studio/studio-app.tsx"),
    "utf8",
  );
  const studioChat = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../components/studio/studio-chat.tsx"),
    "utf8",
  );
  const supplyModal = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../components/studio/supply-modal.tsx"),
    "utf8",
  );
  const supplyEditPanel = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../components/studio/supply-edit-panel.tsx"),
    "utf8",
  );

  it("sign-out button uses the pinned pink families (live class string)", () => {
    expect(studioApp).toContain(
      "rounded-xl border border-pink-400/60 px-4 py-2 text-sm text-pink-200 hover:bg-pink-500/20",
    );
  });

  it("memory button text uses the pinned pink-300", () => {
    expect(studioApp).toContain("text-sm text-pink-300");
  });

  it("email gradient uses the pinned cyan/blue/pink stops", () => {
    expect(studioApp).toContain(
      "bg-gradient-to-r from-cyan-400 via-blue-500 to-pink-500",
    );
  });

  it("chat error alert uses the pinned pink-300", () => {
    expect(studioChat).toContain('className="mb-2 text-xs text-pink-300"');
  });

  it("barcode fields use the pinned blue families (modal + edit panel)", () => {
    const barcodeClasses =
      "border-blue-500/40 bg-black/30 px-3 py-2 text-white transition placeholder:text-white/40 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30";
    expect(supplyModal).toContain(barcodeClasses);
    expect(supplyEditPanel).toContain(barcodeClasses);
  });
});

function kebab(camel: string): string {
  return camel.replace(/([a-z])(\d)/g, "$1-$2").replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Radius scale — r8. The scaffold's @theme carried shadcn's larger radius
 * tokens (sm/md/lg/xl = 0.75/0.875/1/1.25rem), so every `rounded-lg`/`
 * rounded-xl` surface rendered 16px/20px while the live app (Tailwind v3
 * defaults) renders 8px/12px. Verified against the live's compiled CSS
 * (2026-09-17): `.rounded-lg{border-radius:.5rem}` and
 * `.rounded-xl{border-radius:.75rem}`; the live's DOM histogram shows 12px
 * (24 elements) + 8px (6 elements) on the dashboard where the clone showed
 * 20px + 16px. The tokens are pinned here so the scaffold scale cannot
 * silently return.
 */
describe("radius token scale (live Tailwind-v3 defaults)", () => {
  it("renders rounded-sm at the live's 0.125rem", () => {
    expect(token("radius-sm")).toBe("0.125rem");
  });

  it("renders rounded-md at the live's 0.375rem", () => {
    expect(token("radius-md")).toBe("0.375rem");
  });

  it("renders rounded-lg at the live's compiled .5rem", () => {
    expect(token("radius-lg")).toBe("0.5rem");
  });

  it("renders rounded-xl at the live's compiled .75rem", () => {
    expect(token("radius-xl")).toBe("0.75rem");
  });
});

/**
 * Font resolution parity — r8. The live app (AWS Amplify UI) ships ZERO
 * webfonts: document.fonts is empty and its stack resolves to system
 * fonts on every visitor's machine. The clone had next/font's
 * self-hosted Inter (a different build than InterVariable with slightly
 * wider advance widths), which re-wrapped the Studio Memory text onto a
 * second line and inflated the header pill widths. Parity requires the
 * identical stack so both apps resolve fonts the same way everywhere.
 */
describe("font resolution (live ships no webfont)", () => {
  it("uses the live's exact font stack verbatim", () => {
    expect(token("font-sans")).toBe(
      'InterVariable, "Inter var", Inter, -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Segoe UI", Oxygen, Ubuntu, Cantarell, "Open Sans", sans-serif',
    );
  });

  it("loads no webfont (the live renders with system fonts only)", () => {
    // Strip comments so the explanatory note below the <html> tag (which
    // names next/font as the thing NOT to re-add) does not trip the pin.
    const code = layout.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(code).not.toMatch(/from "next\/font/);
    expect(code).not.toMatch(/Inter\(\{/);
    expect(code).not.toMatch(/inter\.variable/);
  });
});
