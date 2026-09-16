"use client";

/**
 * Supplies view — "INVENTORY / Art Supplies": utility row (Import JSON,
 * Export Data, + Add Supply) and the category grid with per-category counts,
 * matching the live app (Paint · 6 types, Brushes & Tools · 7 types, …).
 * Each category card opens the filtered list; supplies are editable inline.
 */
import { useMemo, useState } from "react";

import type { ProjectDto, SupplyDto } from "@/lib/dto";
import {
  SUPPLY_CATEGORIES,
  supplyCategoryLabel,
  supplyConditionLabel,
  supplyTypeLabel,
} from "@/lib/studio-domain";

interface SuppliesViewProps {
  supplies: SupplyDto[];
  projects: ProjectDto[];
  onExport: () => void;
  onImportClick: () => void;
  onNewSupply: () => void;
  onEditSupply: (supply: SupplyDto) => void;
}

const CONDITION_STYLES: Record<string, string> = {
  ok: "border-ast-turquoise/40 text-ast-turquoise",
  low: "border-ast-yellow/50 text-ast-yellow",
  "critical-out": "border-ast-coral/50 text-ast-coral",
};

export function SuppliesView({
  supplies,
  onExport,
  onImportClick,
  onNewSupply,
  onEditSupply,
}: SuppliesViewProps) {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const byCategory = useMemo(() => {
    const groups = new Map<string, SupplyDto[]>();
    for (const category of SUPPLY_CATEGORIES) groups.set(category.value, []);
    for (const supply of supplies) {
      const bucket = groups.get(supply.category);
      if (bucket) bucket.push(supply);
      else groups.get("other")?.push(supply);
    }
    return groups;
  }, [supplies]);

  return (
    <div className="studio-fade">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-ast-lavender">Inventory</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Art Supplies</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onImportClick}
            className="rounded-lg border border-ast-blue/50 px-3.5 py-2 text-xs font-medium text-ast-cyan transition hover:bg-ast-blue/20"
          >
            Import JSON
          </button>
          <button
            type="button"
            onClick={onExport}
            className="rounded-lg border border-ast-blue/50 px-3.5 py-2 text-xs font-medium text-ast-cyan transition hover:bg-ast-blue/20"
          >
            Export Data
          </button>
          <button
            type="button"
            onClick={onNewSupply}
            className="rounded-lg bg-gradient-to-r from-ast-turquoise to-ast-blue px-3.5 py-2 text-xs font-semibold text-white transition hover:opacity-90"
          >
            + Add Supply
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SUPPLY_CATEGORIES.map((category) => {
          const items = byCategory.get(category.value) ?? [];
          const isOpen = openCategory === category.value;
          return (
            <section
              key={category.value}
              className="rounded-2xl border border-ast-purple/25 bg-[#120724] p-5"
            >
              <button
                type="button"
                onClick={() => setOpenCategory(isOpen ? null : category.value)}
                aria-expanded={isOpen}
                className="w-full text-left"
              >
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-ast-lavender">
                    {category.label}
                  </p>
                  <p className="text-2xl font-bold text-white">{items.length}</p>
                </div>
                <p className="mt-1 text-[11px] text-ast-faint">
                  items
                  {category.typeCount > 0
                    ? ` · ${category.typeCount} types`
                    : ""}
                </p>
              </button>

              {isOpen && (
                <div className="mt-3 space-y-2 studio-fade">
                  {items.length === 0 && (
                    <p className="rounded-lg border border-ast-purple/20 bg-[#0f0722] p-3 text-center text-xs text-ast-faint">
                      Nothing in this category yet
                    </p>
                  )}
                  {items.map((supply) => (
                    <button
                      key={supply.id}
                      type="button"
                      onClick={() => onEditSupply(supply)}
                      className="w-full rounded-xl border border-ast-purple/25 bg-[#161030] p-3 text-left transition hover:border-ast-purple/50"
                    >
                      <p className="truncate text-sm font-medium text-ast-body">
                        {supply.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ast-faint">
                        Qty {supply.quantity} · {supplyTypeLabel(supply.type)}
                        {supply.location ? ` · ${supply.location}` : ""}
                      </p>
                      <p
                        className={`mt-1.5 inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                          CONDITION_STYLES[supply.condition] ??
                          "border-ast-purple/40 text-ast-lavender"
                        }`}
                      >
                        {supplyConditionLabel(supply.condition)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
