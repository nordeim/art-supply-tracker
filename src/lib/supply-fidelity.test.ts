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
