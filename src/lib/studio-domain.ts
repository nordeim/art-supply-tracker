/**
 * Studio domain vocabulary — single source of truth for statuses, supply
 * categories, subcategories, condition levels, and shared display rules.
 * Shared by the Zod schemas (server boundary) and the UI pickers so the
 * two can never drift.
 *
 * Values below are extracted verbatim from the live app's DOM
 * (studiobeta.artsupplytracker.com, captured 2026-09-16): category and
 * subcategory option `value` attributes, condition tokens, and the
 * export payload's field vocabulary. The live app stores the singular
 * category tokens ("Brush", not "brushes-tools") and capitalised Paint
 * subcategories ("Watercolor"), so the clone matches those exactly to
 * keep exports byte-compatible.
 */

export const PROJECT_STATUSES = [
  { value: "planned", label: "Planned" },
  { value: "in-progress", label: "In Progress" },
  { value: "on-hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]["value"];

export const SUPPLY_CATEGORIES = [
  { value: "Paint", label: "Paint", typeCount: 6 },
  { value: "Brush", label: "Brushes & Tools", typeCount: 7 },
  { value: "Pastel", label: "Pastels", typeCount: 4 },
  { value: "Paper", label: "Paper", typeCount: 5 },
  { value: "Canvas", label: "Canvas & Board", typeCount: 5 },
  { value: "Medium", label: "Mediums", typeCount: 6 },
  { value: "Other", label: "Other", typeCount: 0 },
] as const;

export type SupplyCategory = (typeof SUPPLY_CATEGORIES)[number]["value"];

/**
 * Per-category subcategory lists, extracted verbatim from the live app's
 * pickers and category sub-views. `Supply.type` stores these values; the
 * modal's picker renders them between the "— None —" and "Other / Custom…"
 * sentinel options (see subcategoryOptionsFor).
 */
export const SUPPLY_TYPE_LISTS: Record<string, readonly { value: string; label: string }[]> = {
  Paint: [
    { value: "Watercolor", label: "Watercolor" },
    { value: "Acrylic", label: "Acrylic" },
    { value: "Oil", label: "Oil" },
    { value: "Gouache", label: "Gouache" },
    { value: "Ink", label: "Ink" },
    { value: "Encaustic", label: "Encaustic" },
  ],
  Brush: [
    { value: "Watercolor brushes", label: "Watercolor brushes" },
    { value: "Acrylic brushes", label: "Acrylic brushes" },
    { value: "Oil brushes", label: "Oil brushes" },
    { value: "Detail brushes", label: "Detail brushes" },
    { value: "Palette knives", label: "Palette knives" },
    { value: "Palette", label: "Palette" },
    { value: "Easel", label: "Easel" },
  ],
  Pastel: [
    { value: "Oil pastel", label: "Oil pastel" },
    { value: "Soft pastel", label: "Soft pastel" },
    { value: "Chalk pastel", label: "Chalk pastel" },
    { value: "Pan pastel", label: "Pan pastel" },
  ],
  Paper: [
    { value: "Watercolor paper", label: "Watercolor paper" },
    { value: "Drawing paper", label: "Drawing paper" },
    { value: "Mixed media", label: "Mixed media" },
    { value: "Bristol", label: "Bristol" },
    { value: "Sketchbook", label: "Sketchbook" },
  ],
  Canvas: [
    { value: "Stretched canvas", label: "Stretched canvas" },
    { value: "Canvas board", label: "Canvas board" },
    { value: "Linen", label: "Linen" },
    { value: "Wood panel", label: "Wood panel" },
    { value: "Gessoed board", label: "Gessoed board" },
  ],
  Medium: [
    { value: "Gels", label: "Gels" },
    { value: "Varnishes", label: "Varnishes" },
    { value: "Solvents", label: "Solvents" },
    { value: "Pastes", label: "Pastes" },
    { value: "Gesso", label: "Gesso" },
    { value: "Fixative", label: "Fixative" },
  ],
  Other: [],
} as const;

/** Sentinel values the modal picker uses; both store as "no subcategory". */
export const SUBCATEGORY_NONE = "";
export const SUBCATEGORY_OTHER = "__other__";

export const SUPPLY_CONDITIONS = [
  { value: "ok", label: "OK" },
  { value: "low", label: "Low" },
  { value: "critical", label: "Critical / Out" },
] as const;

export type SupplyCondition = (typeof SUPPLY_CONDITIONS)[number]["value"];

/**
 * The live app's two "no project" option strings. The CREATE modal renders
 * "Unassigned — Studio inventory" while the EDIT panel renders
 * "— Studio inventory (unassigned) —" — both extracted verbatim from the
 * deployed bundle (verified 2026-09-17 via the live DOM).
 */
export const UNASSIGNED_OPTION_CREATE = "Unassigned — Studio inventory";
export const UNASSIGNED_OPTION_EDIT = "— Studio inventory (unassigned) —";

/**
 * Budget value for the edit panel's number input. The live edit form mounts
 * with value="0" when the project has no budget (its state model uses 0 for
 * unset), so the clone renders the same default rather than an empty field.
 */
export function budgetEditValue(budget: number | null): string {
  return budget === null ? "0" : String(budget);
}

/**
 * Inverse of budgetEditValue for the edit panel's submit: blank or invalid
 * input means "no budget" (null), matching the create modal's optional field.
 */
export function budgetFromEditInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Server-side cap for photo data URLs. The modals reject anything above
 * 300 * 1024 characters after client-side downscaling; this cap adds
 * headroom so the boundary never rejects what the client contract allows.
 */
export const MAX_PHOTO_DATA_URL_LENGTH = 400_000;

/**
 * Items created within this window render the "NEW" badge (live-app
 * behavior: fresh items are badged and exported with `isNew: true`).
 * The live threshold is not observable without waiting days out; seven
 * days is the documented assumption.
 */
export const NEW_BADGE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function isNewItem(createdAt: string | Date, now: number = Date.now()): boolean {
  const created = typeof createdAt === "string" ? Date.parse(createdAt) : createdAt.getTime();
  if (!Number.isFinite(created)) return false;
  return now - created < NEW_BADGE_WINDOW_MS;
}

/**
 * Parse a quantity string the way the live app treats quantities: plain
 * numbers win, simple "a/b" fractions resolve, anything else has no
 * numeric value (returns null). Never evaluates expressions.
 */
export function parseQuantityValue(raw: string | number | null | undefined): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;

  const plain = Number(trimmed);
  if (Number.isFinite(plain)) return plain;

  const fraction = /^(\d+)\/(\d+)$/.exec(trimmed);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    if (denominator > 0) return numerator / denominator;
  }
  return null;
}

export function supplyTypeListFor(category: string): readonly { value: string; label: string }[] {
  return SUPPLY_TYPE_LISTS[category] ?? [];
}

/**
 * Options for the modal's Subcategory picker for a category: the None
 * sentinel, the category's list, then the Other/Custom sentinel — the
 * exact order the live app renders. Categories without subcategories
 * (Other) get an empty list and the picker is hidden entirely.
 */
export function subcategoryOptionsFor(
  category: string,
): { value: string; label: string }[] {
  const list = supplyTypeListFor(category);
  if (list.length === 0) return [];
  return [
    { value: SUBCATEGORY_NONE, label: "— None —" },
    ...list.map((t) => ({ value: t.value, label: t.label })),
    { value: SUBCATEGORY_OTHER, label: "Other / Custom…" },
  ];
}

export const PROJECT_STATUS_VALUES = PROJECT_STATUSES.map((s) => s.value);
export const SUPPLY_CATEGORY_VALUES = SUPPLY_CATEGORIES.map((c) => c.value);
export const SUPPLY_CONDITION_VALUES = SUPPLY_CONDITIONS.map((c) => c.value);

export function projectStatusLabel(value: string): string {
  return PROJECT_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function supplyCategoryLabel(value: string): string {
  return SUPPLY_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function supplySubcategoryLabel(value: string | null): string {
  if (!value) return "— None —";
  return value;
}

export function supplyConditionLabel(value: string): string {
  return SUPPLY_CONDITIONS.find((c) => c.value === value)?.label ?? value;
}

/**
 * Stock-filter matching, pinned to the live app's bundle (the Yz list
 * component's filter switch): "Low Stock" includes low AND critical;
 * "Out of Stock" is critical only; "All" matches everything.
 */
export function matchesStockFilter(condition: string, filter: "all" | "low" | "out"): boolean {
  if (filter === "low") return condition === "low" || condition === "critical";
  if (filter === "out") return condition === "critical";
  return true;
}

/**
 * Project status pill classes — the live app's `jz` map (bundle-extracted).
 * Unknown statuses fall back to coral, exactly like production.
 */
export function projectStatusPillClasses(status: string): string {
  switch (status) {
    case "planned":
      return "bg-ast-electric-blue/20 text-ast-electric-blue";
    case "in-progress":
      return "bg-ast-cyan/20 text-ast-cyan";
    case "on-hold":
      return "bg-ast-yellow/20 text-ast-yellow";
    case "completed":
      return "bg-ast-lavender/20 text-ast-lavender";
    default:
      return "bg-ast-coral/20 text-ast-coral";
  }
}

/**
 * Project chip card classes — the live app's `Mz` map: a status-tinted
 * border/background with status-matched hover and selected treatments
 * (selected adds the per-status glow shadow). Unknown statuses fall back
 * to the neutral purple treatment the supply chips use.
 */
export function projectChipStatusClasses(status: string, selected: boolean): string {
  switch (status) {
    case "planned":
      return selected
        ? "border-ast-electric-blue/70 bg-ast-electric-blue/15 shadow-ast-blue"
        : "border-ast-electric-blue/30 bg-ast-electric-blue/5 hover:border-ast-electric-blue/55 hover:bg-ast-electric-blue/10";
    case "in-progress":
      return selected
        ? "border-ast-cyan/70 bg-ast-cyan/15 shadow-ast-cyan"
        : "border-ast-cyan/30 bg-ast-cyan/5 hover:border-ast-cyan/55 hover:bg-ast-cyan/10";
    case "on-hold":
      return selected
        ? "border-ast-yellow/70 bg-ast-yellow/15 shadow-ast-warm"
        : "border-ast-yellow/30 bg-ast-yellow/5 hover:border-ast-yellow/55 hover:bg-ast-yellow/10";
    case "completed":
      return selected
        ? "border-ast-lavender/60 bg-ast-lavender/10 shadow-ast-lavender"
        : "border-ast-lavender/25 bg-ast-lavender/5 hover:border-ast-lavender/45 hover:bg-ast-lavender/10";
    default:
      return selected
        ? "border-ast-electric-blue/70 bg-ast-electric-blue/15 shadow-ast-blue"
        : "border-ast-purple/30 bg-ast-purple/5 hover:border-ast-lavender/40 hover:bg-ast-lavender/5";
  }
}

export interface ConditionPill {
  label: string;
  classes: string;
}

/**
 * Supply chip condition pill — the live app's `Jz` map. The live app stores
 * no status string for OK supplies, so production renders the fallback pill
 * ("?" on white/10); our "ok" maps onto that same rendering.
 */
export function supplyConditionPill(condition: string): ConditionPill {
  switch (condition) {
    case "low":
      return { label: "Low", classes: "bg-ast-pink/20 text-ast-pink" };
    case "critical":
      return { label: "Critical", classes: "bg-ast-pink/20 text-ast-pink" };
    default:
      return { label: "?", classes: "bg-white/10 text-ast-faint" };
  }
}

export interface ConditionIcon {
  icon: string;
  label: string;
  classes: string;
}

/**
 * Supply detail header condition icon — the live detail panel's ternary.
 * Live data never carries the string "ok" (it is omitted when OK), so OK
 * supplies land in the pink else-branch with an empty label; that exact
 * rendering (pink glyph, no text) is what users see in production.
 */
export function supplyDetailConditionIcon(condition: string): ConditionIcon {
  switch (condition) {
    case "low":
      return { icon: "⚠️", label: "low", classes: "bg-ast-yellow/20 text-ast-yellow" };
    case "critical":
      return { icon: "⚠️", label: "critical", classes: "bg-ast-pink/20 text-ast-pink" };
    default:
      return { icon: "⚠️", label: "", classes: "bg-ast-pink/20 text-ast-pink" };
  }
}
