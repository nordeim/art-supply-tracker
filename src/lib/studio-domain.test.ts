import { describe, expect, it } from "vitest";

import {
  MAX_PHOTO_DATA_URL_LENGTH,
  NEW_BADGE_WINDOW_MS,
  PROJECT_STATUSES,
  SUPPLY_CATEGORIES,
  SUPPLY_CONDITIONS,
  SUPPLY_TYPE_LISTS,
  UNASSIGNED_OPTION_CREATE,
  UNASSIGNED_OPTION_EDIT,
  budgetEditValue,
  budgetFromEditInput,
  isNewItem,
  isValidQuantityInput,
  matchesStockFilter,
  parseQuantityValue,
  projectChipStatusClasses,
  projectStatusPillClasses,
  subcategoryOptionsFor,
  supplyConditionLabel,
  supplyConditionPill,
  supplyDetailConditionIcon,
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

describe("isValidQuantityInput (the live modal's format gate, r11)", () => {
  // Measured on the live app 2026-09-19: the create modal accepts an EMPTY
  // quantity (the supply stores "") and rejects unparseable text with the
  // exact copy "Enter a valid quantity, like 2, 1.5, or 1/2".
  it("accepts the empty string (the live stores empty quantities)", () => {
    expect(isValidQuantityInput("")).toBe(true);
    expect(isValidQuantityInput("   ")).toBe(true);
  });

  it("accepts plain numbers and simple fractions", () => {
    expect(isValidQuantityInput("2")).toBe(true);
    expect(isValidQuantityInput("1.5")).toBe(true);
    expect(isValidQuantityInput(".5")).toBe(true);
    expect(isValidQuantityInput("1/2")).toBe(true);
    expect(isValidQuantityInput(" 3 ")).toBe(true);
  });

  it("rejects unparseable text the way the live modal does", () => {
    expect(isValidQuantityInput("abc")).toBe(false);
    expect(isValidQuantityInput("2a")).toBe(false);
    expect(isValidQuantityInput("1/2/3")).toBe(false);
    expect(isValidQuantityInput("2,5")).toBe(false);
  });
});

/**
 * Stock filter + status style maps — pinned to the live app's bundle
 * (studiobeta.artsupplytracker.com/assets/index-DMkKcyoM.js, extracted
 * 2026-09-17). The live "Low Stock" filter matches low OR critical
 * (verified in the Yz component's filter switch); the style maps are the
 * live jz/Jz/Mz constants, so chips and pills cannot drift from production.
 */
describe("stock filters", () => {
  it("Low Stock matches low AND critical (live behavior)", () => {
    expect(matchesStockFilter("low", "low")).toBe(true);
    expect(matchesStockFilter("critical", "low")).toBe(true);
    expect(matchesStockFilter("ok", "low")).toBe(false);
  });

  it("Out of Stock matches critical only", () => {
    expect(matchesStockFilter("critical", "out")).toBe(true);
    expect(matchesStockFilter("low", "out")).toBe(false);
    expect(matchesStockFilter("ok", "out")).toBe(false);
  });

  it("All matches every condition", () => {
    expect(matchesStockFilter("ok", "all")).toBe(true);
    expect(matchesStockFilter("low", "all")).toBe(true);
    expect(matchesStockFilter("critical", "all")).toBe(true);
    expect(matchesStockFilter("weird", "all")).toBe(true);
  });
});

describe("project status pill styles (live jz map)", () => {
  it("maps each status to its live pill classes", () => {
    expect(projectStatusPillClasses("planned")).toBe(
      "bg-ast-electric-blue/20 text-ast-electric-blue",
    );
    expect(projectStatusPillClasses("in-progress")).toBe("bg-ast-cyan/20 text-ast-cyan");
    expect(projectStatusPillClasses("on-hold")).toBe("bg-ast-yellow/20 text-ast-yellow");
    expect(projectStatusPillClasses("completed")).toBe("bg-ast-lavender/20 text-ast-lavender");
  });

  it("falls back to coral for unknown statuses", () => {
    expect(projectStatusPillClasses("mystery")).toBe("bg-ast-coral/20 text-ast-coral");
  });
});

describe("project chip status styles (live Mz map)", () => {
  it("maps planned to the electric-blue chip treatment", () => {
    expect(projectChipStatusClasses("planned", false)).toBe(
      "border-ast-electric-blue/30 bg-ast-electric-blue/5 hover:border-ast-electric-blue/55 hover:bg-ast-electric-blue/10",
    );
    expect(projectChipStatusClasses("planned", true)).toBe(
      "border-ast-electric-blue/70 bg-ast-electric-blue/15 shadow-ast-blue",
    );
  });

  it("maps in-progress to the cyan treatment with ast-cyan selected shadow", () => {
    expect(projectChipStatusClasses("in-progress", false)).toBe(
      "border-ast-cyan/30 bg-ast-cyan/5 hover:border-ast-cyan/55 hover:bg-ast-cyan/10",
    );
    expect(projectChipStatusClasses("in-progress", true)).toBe(
      "border-ast-cyan/70 bg-ast-cyan/15 shadow-ast-cyan",
    );
  });

  it("maps on-hold to the yellow treatment with warm selected shadow", () => {
    expect(projectChipStatusClasses("on-hold", true)).toBe(
      "border-ast-yellow/70 bg-ast-yellow/15 shadow-ast-warm",
    );
  });

  it("maps completed to the lavender treatment", () => {
    expect(projectChipStatusClasses("completed", false)).toBe(
      "border-ast-lavender/25 bg-ast-lavender/5 hover:border-ast-lavender/45 hover:bg-ast-lavender/10",
    );
    expect(projectChipStatusClasses("completed", true)).toBe(
      "border-ast-lavender/60 bg-ast-lavender/10 shadow-ast-lavender",
    );
  });

  it("falls back to the neutral purple supply-chip treatment", () => {
    expect(projectChipStatusClasses("mystery", false)).toBe(
      "border-ast-purple/30 bg-ast-purple/5 hover:border-ast-lavender/40 hover:bg-ast-lavender/5",
    );
  });
});

describe("supply condition pill styles (live Jz map)", () => {
  it("renders an explicit ok as the live's OK pill (r11)", () => {
    // Measured on the live DOM 2026-09-19: a supply whose status was set
    // explicitly (the edit panel's Stock Status save) renders the cyan OK
    // pill — bg-ast_cyan/15 text-ast_cyan, label "OK".
    expect(supplyConditionPill("ok")).toEqual({
      label: "OK",
      classes: "bg-ast-cyan/15 text-ast-cyan",
    });
  });

  it("renders an absent status as the fallback ? pill (r11)", () => {
    // Measured on the live DOM: supplies created through the create modal
    // carry NO status (the modal's Stock Status select is inert) and render
    // the Jz fallback — label '?', white/10 bg. null is our absent token.
    expect(supplyConditionPill(null)).toEqual({
      label: "?",
      classes: "bg-white/10 text-ast-faint",
    });
  });

  it("renders low and critical as pink label pills", () => {
    expect(supplyConditionPill("low")).toEqual({
      label: "Low",
      classes: "bg-ast-pink/20 text-ast-pink",
    });
    expect(supplyConditionPill("critical")).toEqual({
      label: "Critical",
      classes: "bg-ast-pink/20 text-ast-pink",
    });
  });
});

describe("supply detail condition icon (live detail header)", () => {
  it("renders an explicit ok as the live's checkmark icon (r11)", () => {
    // Measured on the live DOM 2026-09-19: an explicit ok status renders
    // "✓ ok" in turquoise — bg-ast_turquoise/20 text-ast_turquoise.
    expect(supplyDetailConditionIcon("ok")).toEqual({
      icon: "✓",
      label: "ok",
      classes: "bg-ast-turquoise/20 text-ast-turquoise",
    });
  });

  it("renders an absent status as the pink unlabeled glyph (r11)", () => {
    // Measured on the live DOM: absent status lands in the pink else branch
    // with an empty label — a pink warning glyph only. null is our absent
    // token (created supplies carry no status).
    expect(supplyDetailConditionIcon(null)).toEqual({
      icon: "⚠️",
      label: "",
      classes: "bg-ast-pink/20 text-ast-pink",
    });
  });

  it("renders low as yellow warning with label", () => {
    expect(supplyDetailConditionIcon("low")).toEqual({
      icon: "⚠️",
      label: "low",
      classes: "bg-ast-yellow/20 text-ast-yellow",
    });
  });

  it("renders critical as pink warning with label", () => {
    expect(supplyDetailConditionIcon("critical")).toEqual({
      icon: "⚠️",
      label: "critical",
      classes: "bg-ast-pink/20 text-ast-pink",
    });
  });
});

describe("budget edit-panel value mapping (live edit form)", () => {
  it("renders an unset budget as 0 in the edit input", () => {
    // The live edit panel mounts its budget number input with value="0"
    // when the project has no budget (verified against the deployed app).
    expect(budgetEditValue(null)).toBe("0");
  });

  it("renders a set budget verbatim", () => {
    expect(budgetEditValue(150)).toBe("150");
    expect(budgetEditValue(12.5)).toBe("12.5");
  });

  it("parses the edit input back, treating blank as unset", () => {
    expect(budgetFromEditInput("")).toBeNull();
    expect(budgetFromEditInput("0")).toBe(0);
    expect(budgetFromEditInput("175")).toBe(175);
    expect(budgetFromEditInput("not-a-number")).toBeNull();
  });
});

describe("supply edit-panel assignment option copy", () => {
  it("uses the live edit panel's unassigned option text", () => {
    // The live EDIT panel renders "— Studio inventory (unassigned) —"
    // (bundle: `— Studio inventory (unassigned) —`), while the CREATE
    // modal uses "Unassigned — Studio inventory". Both are pinned so the
    // two surfaces cannot drift.
    expect(UNASSIGNED_OPTION_EDIT).toBe("— Studio inventory (unassigned) —");
    expect(UNASSIGNED_OPTION_CREATE).toBe("Unassigned — Studio inventory");
  });
});
