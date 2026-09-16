/**
 * Studio domain vocabulary — single source of truth for statuses, supply
 * categories, paint types, and condition levels. Shared by the Zod schemas
 * (server boundary) and the UI pickers so the two can never drift.
 */

export const PROJECT_STATUSES = [
  { value: "planned", label: "Planned" },
  { value: "in-progress", label: "In Progress" },
  { value: "on-hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]["value"];

export const SUPPLY_CATEGORIES = [
  { value: "paint", label: "Paint", typeCount: 6 },
  { value: "brushes-tools", label: "Brushes & Tools", typeCount: 7 },
  { value: "pastels", label: "Pastels", typeCount: 4 },
  { value: "paper", label: "Paper", typeCount: 5 },
  { value: "canvas-board", label: "Canvas & Board", typeCount: 5 },
  { value: "mediums", label: "Mediums", typeCount: 6 },
  { value: "other", label: "Other", typeCount: 0 },
] as const;

export type SupplyCategory = (typeof SUPPLY_CATEGORIES)[number]["value"];

export const SUPPLY_TYPES = [
  { value: "none", label: "— None —" },
  { value: "watercolor", label: "Watercolor" },
  { value: "acrylic", label: "Acrylic" },
  { value: "oil", label: "Oil" },
  { value: "gouache", label: "Gouache" },
  { value: "ink", label: "Ink" },
  { value: "encaustic", label: "Encaustic" },
  { value: "other", label: "Other / Custom…" },
] as const;

export type SupplyType = (typeof SUPPLY_TYPES)[number]["value"];

export const SUPPLY_CONDITIONS = [
  { value: "ok", label: "OK" },
  { value: "low", label: "Low" },
  { value: "critical-out", label: "Critical / Out" },
] as const;

export type SupplyCondition = (typeof SUPPLY_CONDITIONS)[number]["value"];

/**
 * Per-category type lists, extracted verbatim from the live app's category
 * sub-views (studiobeta.artsupplytracker.com). `Supply.type` stores these
 * free-form labels — the picker offers the flat `SUPPLY_TYPES` paint list for
 * the modal, while the Supplies view navigates these lists as type tiles.
 */
export const SUPPLY_TYPE_LISTS: Record<string, readonly { value: string; label: string }[]> = {
  paint: [
    { value: "watercolor", label: "Watercolor" },
    { value: "acrylic", label: "Acrylic" },
    { value: "oil", label: "Oil" },
    { value: "gouache", label: "Gouache" },
    { value: "ink", label: "Ink" },
    { value: "encaustic", label: "Encaustic" },
  ],
  "brushes-tools": [
    { value: "Watercolor brushes", label: "Watercolor brushes" },
    { value: "Acrylic brushes", label: "Acrylic brushes" },
    { value: "Oil brushes", label: "Oil brushes" },
    { value: "Detail brushes", label: "Detail brushes" },
    { value: "Palette knives", label: "Palette knives" },
    { value: "Palette", label: "Palette" },
    { value: "Easel", label: "Easel" },
  ],
  pastels: [
    { value: "Oil pastel", label: "Oil pastel" },
    { value: "Soft pastel", label: "Soft pastel" },
    { value: "Chalk pastel", label: "Chalk pastel" },
    { value: "Pan pastel", label: "Pan pastel" },
  ],
  paper: [
    { value: "Watercolor paper", label: "Watercolor paper" },
    { value: "Drawing paper", label: "Drawing paper" },
    { value: "Mixed media", label: "Mixed media" },
    { value: "Bristol", label: "Bristol" },
    { value: "Sketchbook", label: "Sketchbook" },
  ],
  "canvas-board": [
    { value: "Stretched canvas", label: "Stretched canvas" },
    { value: "Canvas board", label: "Canvas board" },
    { value: "Linen", label: "Linen" },
    { value: "Wood panel", label: "Wood panel" },
    { value: "Gessoed board", label: "Gessoed board" },
  ],
  mediums: [
    { value: "Gels", label: "Gels" },
    { value: "Varnishes", label: "Varnishes" },
    { value: "Solvents", label: "Solvents" },
    { value: "Pastes", label: "Pastes" },
    { value: "Gesso", label: "Gesso" },
    { value: "Fixative", label: "Fixative" },
  ],
  other: [],
} as const;

export function supplyTypeListFor(category: string): readonly { value: string; label: string }[] {
  return SUPPLY_TYPE_LISTS[category] ?? [];
}

export const PROJECT_STATUS_VALUES = PROJECT_STATUSES.map((s) => s.value);
export const SUPPLY_CATEGORY_VALUES = SUPPLY_CATEGORIES.map((c) => c.value);
export const SUPPLY_TYPE_VALUES = SUPPLY_TYPES.map((t) => t.value);
export const SUPPLY_CONDITION_VALUES = SUPPLY_CONDITIONS.map((c) => c.value);

export function projectStatusLabel(value: string): string {
  return PROJECT_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function supplyCategoryLabel(value: string): string {
  return SUPPLY_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function supplyTypeLabel(value: string | null): string {
  if (!value) return "— None —";
  return SUPPLY_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function supplyConditionLabel(value: string): string {
  return SUPPLY_CONDITIONS.find((c) => c.value === value)?.label ?? value;
}
