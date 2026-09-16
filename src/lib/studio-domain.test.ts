import { describe, expect, it } from "vitest";

import {
  MAX_PHOTO_DATA_URL_LENGTH,
  NEW_BADGE_WINDOW_MS,
  PROJECT_STATUSES,
  SUPPLY_CATEGORIES,
  SUPPLY_CONDITIONS,
  SUPPLY_TYPE_LISTS,
  isNewItem,
  parseQuantityValue,
  subcategoryOptionsFor,
  supplyConditionLabel,
  supplyTypeListFor,
} from "@/lib/studio-domain";

/**
 * Vocabulary pinned to the live app's pickers and category sub-views
 * (extracted from studiobeta.artsupplytracker.com on 2026-09-16).
 * The Zod schemas and the UI pickers derive from these lists — drift here
 * breaks the single-source contract, so the shape is pinned by tests.
 *
 * Values verified against the live app's DOM (select option `value`
 * attributes captured 2026-09-16): categories are the singular tokens
 * (Paint, Brush, Pastel, Paper, Canvas, Medium, Other), conditions are
 * ok/low/critical, and Paint subcategories are capitalized.
 */
describe("studio-domain vocabulary", () => {
  it("keeps the four project statuses with live labels", () => {
    expect(PROJECT_STATUSES.map((s) => s.label)).toEqual([
      "Planned",
      "In Progress",
      "On Hold",
      "Completed",
    ]);
  });

  it("uses the live app's singular category values", () => {
    expect(SUPPLY_CATEGORIES.map((c) => c.value)).toEqual([
      "Paint",
      "Brush",
      "Pastel",
      "Paper",
      "Canvas",
      "Medium",
      "Other",
    ]);
  });

  it("keeps the live category labels", () => {
    expect(SUPPLY_CATEGORIES.map((c) => c.label)).toEqual([
      "Paint",
      "Brushes & Tools",
      "Pastels",
      "Paper",
      "Canvas & Board",
      "Mediums",
      "Other",
    ]);
  });

  it("keeps the seven supply categories with live type counts", () => {
    expect(SUPPLY_CATEGORIES.map((c) => c.typeCount)).toEqual([6, 7, 4, 5, 5, 6, 0]);
  });

  it("uses the live condition values (critical, not critical-out)", () => {
    expect(SUPPLY_CONDITIONS.map((c) => c.value)).toEqual(["ok", "low", "critical"]);
    expect(SUPPLY_CONDITIONS.map((c) => c.label)).toEqual(["OK", "Low", "Critical / Out"]);
  });

  it("provides a type list for every category", () => {
    for (const category of SUPPLY_CATEGORIES) {
      const list = SUPPLY_TYPE_LISTS[category.value];
      expect(Array.isArray(list), `missing list for ${category.value}`).toBe(true);
      expect(list.length).toBe(category.typeCount);
    }
  });

  it("lists the live Paint subcategories with capitalized values", () => {
    expect(SUPPLY_TYPE_LISTS.Paint.map((t) => t.value)).toEqual([
      "Watercolor",
      "Acrylic",
      "Oil",
      "Gouache",
      "Ink",
      "Encaustic",
    ]);
  });

  it("lists the live Brushes & Tools subcategories", () => {
    expect(SUPPLY_TYPE_LISTS.Brush.map((t) => t.value)).toEqual([
      "Watercolor brushes",
      "Acrylic brushes",
      "Oil brushes",
      "Detail brushes",
      "Palette knives",
      "Palette",
      "Easel",
    ]);
  });

  it("lists the live Pastels subcategories", () => {
    expect(SUPPLY_TYPE_LISTS.Pastel.map((t) => t.value)).toEqual([
      "Oil pastel",
      "Soft pastel",
      "Chalk pastel",
      "Pan pastel",
    ]);
  });

  it("lists the live Paper subcategories", () => {
    expect(SUPPLY_TYPE_LISTS.Paper.map((t) => t.value)).toEqual([
      "Watercolor paper",
      "Drawing paper",
      "Mixed media",
      "Bristol",
      "Sketchbook",
    ]);
  });

  it("lists the live Canvas & Board subcategories", () => {
    expect(SUPPLY_TYPE_LISTS.Canvas.map((t) => t.value)).toEqual([
      "Stretched canvas",
      "Canvas board",
      "Linen",
      "Wood panel",
      "Gessoed board",
    ]);
  });

  it("lists the live Mediums subcategories", () => {
    expect(SUPPLY_TYPE_LISTS.Medium.map((t) => t.value)).toEqual([
      "Gels",
      "Varnishes",
      "Solvents",
      "Pastes",
      "Gesso",
      "Fixative",
    ]);
  });

  it("gives Other an empty subcategory list", () => {
    expect(SUPPLY_TYPE_LISTS.Other).toEqual([]);
  });

  it("resolves a category's type list with a safe fallback", () => {
    expect(supplyTypeListFor("Paint").length).toBe(6);
    expect(supplyTypeListFor("unknown-category")).toEqual([]);
  });

  it("resolves condition labels", () => {
    expect(supplyConditionLabel("ok")).toBe("OK");
    expect(supplyConditionLabel("critical")).toBe("Critical / Out");
    expect(supplyConditionLabel("weird")).toBe("weird");
  });

  it("builds the modal's picker options per category (None + list + Other/Custom)", () => {
    expect(subcategoryOptionsFor("Paint")).toEqual([
      { value: "", label: "— None —" },
      { value: "Watercolor", label: "Watercolor" },
      { value: "Acrylic", label: "Acrylic" },
      { value: "Oil", label: "Oil" },
      { value: "Gouache", label: "Gouache" },
      { value: "Ink", label: "Ink" },
      { value: "Encaustic", label: "Encaustic" },
      { value: "__other__", label: "Other / Custom…" },
    ]);
    expect(subcategoryOptionsFor("Brush").length).toBe(9);
    expect(subcategoryOptionsFor("Other")).toEqual([]);
  });
});

describe("photo data-URL cap", () => {
  it("allows the client-side 300 KB compressed data URL contract", () => {
    // The modals reject data URLs over 300 * 1024 characters; the server cap
    // must be at least that with headroom, or every real photo fails
    // validation (the bug this constant pins).
    expect(MAX_PHOTO_DATA_URL_LENGTH).toBeGreaterThanOrEqual(300 * 1024);
    expect(MAX_PHOTO_DATA_URL_LENGTH).toBeLessThanOrEqual(500_000);
  });
});

describe("NEW badge window", () => {
  it("flags items created within the window", () => {
    const now = Date.now();
    expect(isNewItem(new Date(now - 60_000).toISOString(), now)).toBe(true);
    expect(isNewItem(new Date(now - NEW_BADGE_WINDOW_MS + 1).toISOString(), now)).toBe(true);
  });

  it("does not flag items older than the window", () => {
    const now = Date.now();
    expect(isNewItem(new Date(now - NEW_BADGE_WINDOW_MS - 1).toISOString(), now)).toBe(false);
    expect(isNewItem(new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(), now)).toBe(false);
  });
});

describe("parseQuantityValue", () => {
  it("parses integers and decimals like the live app", () => {
    expect(parseQuantityValue("2")).toBe(2);
    expect(parseQuantityValue("1.5")).toBe(1.5);
    expect(parseQuantityValue(" 3 ")).toBe(3);
  });

  it("parses simple a/b fractions", () => {
    expect(parseQuantityValue("1/2")).toBe(0.5);
    expect(parseQuantityValue("3/4")).toBe(0.75);
  });

  it("returns null for non-numeric input", () => {
    expect(parseQuantityValue("some")).toBeNull();
    expect(parseQuantityValue("")).toBeNull();
    expect(parseQuantityValue("1/0")).toBeNull();
    expect(parseQuantityValue("2/3/4")).toBeNull();
  });
});
