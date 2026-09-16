import { describe, expect, it } from "vitest";

import {
  PROJECT_STATUSES,
  SUPPLY_CATEGORIES,
  SUPPLY_TYPE_LISTS,
  supplyTypeListFor,
  supplyTypeLabel,
} from "@/lib/studio-domain";

/**
 * Vocabulary pinned to the live app's pickers and category sub-views
 * (extracted from studiobeta.artsupplytracker.com on 2026-09-16).
 * The Zod schemas and the UI pickers derive from these lists — drift here
 * breaks the single-source contract, so the shape is pinned by tests.
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

  it("keeps the seven supply categories with live type counts", () => {
    expect(SUPPLY_CATEGORIES.map((c) => c.typeCount)).toEqual([6, 7, 4, 5, 5, 6, 0]);
  });

  it("provides a type list for every category", () => {
    for (const category of SUPPLY_CATEGORIES) {
      const list = SUPPLY_TYPE_LISTS[category.value];
      expect(Array.isArray(list), `missing list for ${category.value}`).toBe(true);
      expect(list.length).toBe(category.typeCount);
    }
  });

  it("lists the live Paint types", () => {
    expect(SUPPLY_TYPE_LISTS.paint.map((t) => t.label)).toEqual([
      "Watercolor",
      "Acrylic",
      "Oil",
      "Gouache",
      "Ink",
      "Encaustic",
    ]);
  });

  it("lists the live Brushes & Tools types", () => {
    expect(SUPPLY_TYPE_LISTS["brushes-tools"].map((t) => t.label)).toEqual([
      "Watercolor brushes",
      "Acrylic brushes",
      "Oil brushes",
      "Detail brushes",
      "Palette knives",
      "Palette",
      "Easel",
    ]);
  });

  it("lists the live Pastels types", () => {
    expect(SUPPLY_TYPE_LISTS.pastels.map((t) => t.label)).toEqual([
      "Oil pastel",
      "Soft pastel",
      "Chalk pastel",
      "Pan pastel",
    ]);
  });

  it("lists the live Paper types", () => {
    expect(SUPPLY_TYPE_LISTS.paper.map((t) => t.label)).toEqual([
      "Watercolor paper",
      "Drawing paper",
      "Mixed media",
      "Bristol",
      "Sketchbook",
    ]);
  });

  it("lists the live Canvas & Board types", () => {
    expect(SUPPLY_TYPE_LISTS["canvas-board"].map((t) => t.label)).toEqual([
      "Stretched canvas",
      "Canvas board",
      "Linen",
      "Wood panel",
      "Gessoed board",
    ]);
  });

  it("lists the live Mediums types", () => {
    expect(SUPPLY_TYPE_LISTS.mediums.map((t) => t.label)).toEqual([
      "Gels",
      "Varnishes",
      "Solvents",
      "Pastes",
      "Gesso",
      "Fixative",
    ]);
  });

  it("gives Other an empty type list", () => {
    expect(SUPPLY_TYPE_LISTS.other).toEqual([]);
  });

  it("resolves a category's type list with a safe fallback", () => {
    expect(supplyTypeListFor("paint").length).toBe(6);
    expect(supplyTypeListFor("unknown-category")).toEqual([]);
  });

  it("resolves free-form supply type labels via the flat picker list", () => {
    expect(supplyTypeLabel("Watercolor brushes")).toBe("Watercolor brushes");
    expect(supplyTypeLabel(null)).toBe("— None —");
    expect(supplyTypeLabel("custom")).toBe("custom");
  });
});
