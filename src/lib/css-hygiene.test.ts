/**
 * CSS-hygiene contract (r19, extended r20) — pins the compile-time
 * exclusion and the selection/caret/forced-colors non-authoring measured
 * on the live app.
 *
 * Three contracts, all measured against the live's CSSOM on 2026-09-23:
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
 * 3. The live's stylesheet authors ZERO `forced-colors` rules (r20). TW4's
 *    forced-colors-aware transparent-outline utility emits `@media
 *    (forced-colors: active)` blocks — the scaffold's class strings
 *    contributed six dead ones. See the r20 pin at the bottom of this file
 *    (the utility's name is deliberately never written out in this file:
 *    TW4's content detection scans test sources too, and a complete
 *    class-shaped token in a comment or regex would compile the utility
 *    straight back into the app's CSS).
 *
 * Why a file-content test: the same precedent as the other fidelity pins
 * (design-tokens, focus-fidelity, motion-fidelity) — the source files are
 * the single authority for what Tailwind emits; a source pin guards the
 * contract against a future "cleanup" deleting the directive or a scaffold
 * refresh re-adding the selection utilities.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const libDir = dirname(fileURLToPath(import.meta.url));
const cssPath = join(libDir, "../app/globals.css");
const cssRaw = readFileSync(cssPath, "utf8");
const inputPath = join(libDir, "../components/ui/input.tsx");
const inputRaw = readFileSync(inputPath, "utf8");
const srcRoot = join(libDir, "..");

/** Recursively collect source files under src/ (the TW4 content-detection
 * corpus — everything Tailwind scans for class strings). */
function collectSources(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectSources(full));
    } else if (/\.(tsx|ts|css)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

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
    // The scaffold default (the selection-variant bg-primary /
    // text-primary-foreground pair) emits styled-selection rules the
    // live never shows — dead while the component is unused, divergent the
    // moment it is consumed. Stripped r19.
    expect(input).not.toMatch(/selection:/);
  });
});

describe("Forced-colors contract: nothing authored (r20)", () => {
  it("no source file under src/ carries the forced-colors outline utility token", () => {
    // The live's CSSOM authors ZERO forced-colors rules (the r20 media-rule
    // sweep, both login and studio, base and emulated). Tailwind v4's
    // forced-colors-aware transparent-outline utility (the one whose name
    // this file never spells out) is the ONLY emitter of `@media
    // (forced-colors: active)` blocks in this codebase — its base,
    // focus-variant, focus-visible-variant, and arbitrary-variant emissions
    // all came from the unused shadcn scaffold's class strings (measured:
    // six dead rules, zero rendered consumers on either side). The token is
    // stripped at source so TW4 stops emitting the blocks; this pin guards
    // against a scaffold refresh (bunx shadcn add) silently re-introducing
    // them.
    //
    // The pattern is CONSTRUCTED at runtime from non-utility fragments:
    // TW4's automatic content detection scans test files too, and a
    // complete class-shaped token written literally in this file would
    // compile the utility straight back into the app's CSS.
    const token = new RegExp(
      `(^|[\\s"'\`])((\\[[^\\]]*\\]|focus-visible|focus):)*${"out" + "line-hidden"}`,
    );
    const offenders: string[] = [];
    for (const file of collectSources(srcRoot)) {
      const text = stripComments(readFileSync(file, "utf8"));
      if (token.test(text)) {
        offenders.push(file.replace(srcRoot + "/", ""));
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("Documentation token hygiene (r21-F2)", () => {
  it("no committed markdown file re-introduces the stripped outline/selection tokens", () => {
    // TW4's automatic content detection scans every non-gitignored file —
    // MARKDOWN INCLUDED. The r19/r20 remediations were regressed by their
    // own session records: the stripped transparent-outline and
    // selection-variant tokens were quoted verbatim in the committed docs
    // (session logs, README, PAD, AGENTS), and the next build compiled the
    // dead rules straight back into the production CSS (measured r21: the
    // r20 tree's "clean" 152,241-byte stylesheet had regrown to 152,390
    // with one forced-colors block and the selection pair). The tokens are
    // assembled at runtime from non-utility fragments — the same discipline
    // this file's own pins use — so this guard cannot leak what it guards.
    const transparentOutline = "out" + "line-hidden";
    const selectionVariant = "selection" + ":";
    const bgPrimary = "bg" + "-primary";
    // r21-F1's stripped scaffold token joins the guarded families: docs
    // quoting it verbatim would recompile the dead viewport-cap rule.
    const viewportCap = ["md", ["h", "screen"].join("-")].join(":");
    const repoRoot = join(libDir, "../..");
    const mdFiles: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        if (entry === "node_modules" || entry === ".next" || entry === ".git" || entry === "skills" || entry === "db") continue;
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.md$/.test(entry)) mdFiles.push(full);
      }
    };
    walk(repoRoot);
    const offenders: string[] = [];
    for (const file of mdFiles) {
      const text = readFileSync(file, "utf8");
      if (
        text.includes(transparentOutline) ||
        text.includes(selectionVariant + bgPrimary) ||
        text.includes(viewportCap)
      ) {
        offenders.push(file.replace(repoRoot + "/", ""));
      }
    }
    expect(offenders).toEqual([]);
  });
});
