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
