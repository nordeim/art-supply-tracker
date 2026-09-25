import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Project-surface fidelity pins (r26) — file-content pins in the established
 * pattern (design-tokens / login-fidelity / supply-fidelity).
 *
 * Every pin encodes a live-app behavior measured on
 * studiobeta.artsupplytracker.com on 2026-09-26:
 *  - the create modal's Cancel button computes 16px/24px (no text-sm);
 *    with its 1px border + py-2 it is the flex row's tallest child at 42px
 *    and the default align-items (stretch) sizes BOTH buttons to 42 — the
 *    text-sm variant renders a 40px row and a modal card 2px short
 *    (542 vs the live's 544);
 *  - the detail panel's H2 is a plain block (`text-lg font-bold
 *    text-ast_cyan` on the live) whose NEW badge flows INLINE — the badge's
 *    own ml-2 supplies the 8px title gap and the inline box renders 18px
 *    tall; a flex-wrap/gap-2 row doubles the gap to 16px (gap-2 + ml-2),
 *    inflates the badge to 20px and shifts it 2px up.
 *
 * These pins exist so the measured chrome cannot drift from the live.
 */

const root = resolve(__dirname, "../..");

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("project modal button-row pins (r26: the live's 16px chrome)", () => {
  const modal = read("src/components/studio/project-modal.tsx");

  it("renders the Cancel button at the live's base font — no text-sm", () => {
    const cancelCls = modal.match(/className="([^"]*border-ast-yellow\/30[^"]*)"/)?.[1];
    expect(cancelCls).toBeDefined();
    expect(cancelCls).not.toContain("text-sm");
    expect(cancelCls).toContain("px-4 py-2");
    expect(cancelCls).toContain("text-ast-yellow");
  });

  it("renders the Create Project submit at the base font with font-semibold", () => {
    const submitCls = modal.match(/className="([^"]*from-ast-turquoise[^"]*)"/)?.[1];
    expect(submitCls).toBeDefined();
    expect(submitCls).not.toContain("text-sm");
    expect(submitCls).toContain("font-semibold");
  });

  it("keeps the live's button-row layout (flex gap-3, top border, padding)", () => {
    // The live's row: `shrink-0 flex gap-3 px-6 pt-4 pb-6 border-t border-white/5`
    // — the default align-items (stretch) is what carries the 42px parity.
    expect(modal).toContain("flex shrink-0 gap-3 border-t border-white/5 px-6 pb-6 pt-4");
  });
});

describe("project detail heading pins (r26: the live's plain-block H2)", () => {
  const detail = read("src/components/studio/project-detail-panel.tsx");

  it("renders the detail H2 as a plain block exactly like the live", () => {
    const h2 = detail.match(/<h2\s+className="([^"]+)"/)?.[1];
    expect(h2).toBe("text-lg font-bold text-ast-cyan");
  });

  it("keeps the badge as an inline span with its own ml-2 spacing", () => {
    const badge = detail.match(
      /className="(ml-2 [^"]*bg-ast-turquoise\/40[^"]*)"/,
    )?.[1];
    expect(badge).toBeDefined();
    expect(badge).toContain("ml-2");
    expect(badge).toContain("align-middle");
    expect(badge).not.toContain("flex");
  });
});
