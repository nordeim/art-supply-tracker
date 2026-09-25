import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Supply-surface fidelity pins (r11) — file-content pins in the established
 * pattern (design-tokens / login-fidelity / chat-fidelity / drawer-fidelity).
 *
 * Every pin encodes a live-app behavior measured on
 * studiobeta.artsupplytracker.com on 2026-09-19:
 *  - the create modal's Stock Status select is INERT (created supplies
 *    carry no status, whatever the select showed — verified by creating a
 *    supply with "Low" selected and reading the export: status omitted);
 *  - the create/edit quantity gate accepts empty and rejects unparseable
 *    text with the exact copy "Enter a valid quantity, like 2, 1.5, or 1/2";
 *  - the edit form opens an absent status on "OK" and saves it explicitly;
 *  - the chip renders the qty label unconditionally (empty -> bare "qty");
 *  - the detail panel renders an empty quantity as a blank value.
 *
 * These pins exist so the quirks cannot be silently "fixed".
 */

const root = resolve(__dirname, "../..");

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("supply modal source pins (the live's create contract)", () => {
  const modal = read("src/components/studio/supply-modal.tsx");

  it("submits condition: null — the live's create path never stores a status", () => {
    // The live's Stock Status select is inert chrome: the created supply
    // carries no status regardless of the selected value.
    expect(modal).toContain("condition: null");
    expect(modal).toContain("inert");
  });

  it("gates quantity format with the live's exact copy, not a required check", () => {
    expect(modal).toContain('isValidQuantityInput(quantity)');
    expect(modal).toContain('"Enter a valid quantity, like 2, 1.5, or 1/2"');
    expect(modal).not.toContain('"Quantity is required."');
  });
});

describe("supply edit panel source pins (the live's edit contract)", () => {
  const edit = read("src/components/studio/supply-edit-panel.tsx");

  it("initializes the condition select from the absent status onto OK", () => {
    expect(edit).toContain('supply.condition ?? "ok"');
  });

  it("gates quantity format with the same live copy", () => {
    expect(edit).toContain("isValidQuantityInput(quantity)");
    expect(edit).toContain('"Enter a valid quantity, like 2, 1.5, or 1/2"');
    expect(edit).not.toContain('"Quantity is required."');
  });
});

describe("supply chip + detail panel source pins (rendering contract)", () => {
  const view = read("src/components/studio/supplies-view.tsx");
  const detail = read("src/components/studio/supply-detail-panel.tsx");

  it("renders the qty label unconditionally (empty shows the bare label)", () => {
    expect(view).toContain("qty {supply.quantity}");
    expect(view).not.toContain('supply.quantity !== "" && supply.quantity !== null');
  });

  it("renders the raw quantity in the detail panel (blank when empty)", () => {
    expect(detail).toContain('value={supply.quantity}');
    expect(detail).not.toContain('supply.quantity || "—"');
  });
});

describe("supply modal button-row pins (r26: the live's 16px chrome)", () => {
  const modal = read("src/components/studio/supply-modal.tsx");

  it("renders the Cancel button at the live's base font — no text-sm", () => {
    // Measured on the live 2026-09-26: the modal Cancel computes 16px/24px
    // (the class string carries no font-size utility). With its 1px border
    // and py-2 it is the row's tallest child at 42px, and the flex-stretch
    // row sizes BOTH buttons to 42 — the text-sm variant renders 40px and
    // shrinks the whole modal card by 2px (792 vs the live's 794).
    const cancelCls = modal.match(/className="([^"]*border-ast-yellow\/30[^"]*)"/)?.[1];
    expect(cancelCls).toBeDefined();
    expect(cancelCls).not.toContain("text-sm");
    expect(cancelCls).toContain("px-4 py-2");
    expect(cancelCls).toContain("text-ast-yellow");
  });

  it("renders the Add Supply submit at the base font with font-semibold", () => {
    const submitCls = modal.match(/className="([^"]*from-ast-pink[^"]*)"/)?.[1];
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

describe("supply detail heading pins (r26: the live's plain-block H2)", () => {
  const detail = read("src/components/studio/supply-detail-panel.tsx");

  it("renders the detail H2 as a plain block exactly like the live", () => {
    // Measured on the live: the detail H2 is `text-lg font-bold text-ast_cyan`
    // — a plain block whose NEW badge flows inline (the badge's own ml-2
    // supplies the 8px gap; the inline box renders 18px tall). A flex row
    // (flex-wrap/items-center/gap-2) doubles the gap to 16px (gap-2 + ml-2),
    // inflates the badge to 20px and shifts it 2px up.
    const h2 = detail.match(/<h2\s+className="([^"]+)"/)?.[1];
    expect(h2).toBe("text-lg font-bold text-ast-cyan");
  });

  it("keeps the badge as an inline span with its own ml-2 spacing", () => {
    const badge = detail.match(
      /className="(ml-2 [^"]*bg-ast-pink\/40[^"]*)"/,
    )?.[1];
    expect(badge).toBeDefined();
    expect(badge).toContain("ml-2");
    expect(badge).toContain("align-middle");
    expect(badge).not.toContain("flex");
  });
});
