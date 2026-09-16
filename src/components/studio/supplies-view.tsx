"use client";

/**
 * Supplies view — "INVENTORY / Art Supplies": utility row (Import JSON,
 * Export Data, + Add Supply) and the category grid with per-category counts
 * (Paint · 6 types, Brushes & Tools · 7 types, …). Clicking a category
 * navigates to a breadcrumb sub-view ("Art Supplies › Paint") listing the
 * live app's type tiles ("All Paint", Watercolor, Acrylic…); clicking a type
 * tile filters to that type's supply list ("Art Supplies › Paint ›
 * Watercolor"). Categories without types (Other) open the list directly.
 */
import { useMemo, useState } from "react";

import type { ProjectDto, SupplyDto } from "@/lib/dto";
import {
  SUPPLY_CATEGORIES,
  SUPPLY_TYPE_LISTS,
  supplyCategoryLabel,
  supplyConditionLabel,
  supplyTypeLabel,
  supplyTypeListFor,
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

type SuppliesSubView =
  | { kind: "category"; category: string }
  | { kind: "type"; category: string; typeValue: string; typeLabel: string };

export function SuppliesView({
  supplies,
  onExport,
  onImportClick,
  onNewSupply,
  onEditSupply,
}: SuppliesViewProps) {
  const [subView, setSubView] = useState<SuppliesSubView | null>(null);

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

  const byCategoryAndType = useMemo(() => {
    const counts = new Map<string, number>();
    for (const supply of supplies) {
      const key = `${supply.category}::${supply.type ?? ""}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [supplies]);

  function openCategory(category: string) {
    if ((SUPPLY_TYPE_LISTS[category] ?? []).length === 0) {
      setSubView({ kind: "category", category });
      return;
    }
    setSubView({ kind: "category", category });
  }

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

      {subView === null && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SUPPLY_CATEGORIES.map((category) => {
            const items = byCategory.get(category.value) ?? [];
            return (
              <button
                key={category.value}
                type="button"
                onClick={() => openCategory(category.value)}
                className="rounded-2xl border border-ast-purple/25 bg-[#120724] p-5 text-left transition hover:border-ast-purple/50"
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
            );
          })}
        </div>
      )}

      {subView !== null && (
        <SuppliesSubViewPanel
          subView={subView}
          supplies={supplies}
          byCategory={byCategory}
          byCategoryAndType={byCategoryAndType}
          onBack={() => setSubView(null)}
          onOpenCategory={(category) => setSubView({ kind: "category", category })}
          onOpenType={(category, typeValue, typeLabel) =>
            setSubView({ kind: "type", category, typeValue, typeLabel })
          }
          onNewSupply={onNewSupply}
          onEditSupply={onEditSupply}
        />
      )}
    </div>
  );
}

function SuppliesSubViewPanel({
  subView,
  supplies,
  byCategory,
  byCategoryAndType,
  onBack,
  onOpenCategory,
  onOpenType,
  onNewSupply,
  onEditSupply,
}: {
  subView: SuppliesSubView;
  supplies: SupplyDto[];
  byCategory: Map<string, SupplyDto[]>;
  byCategoryAndType: Map<string, number>;
  onBack: () => void;
  onOpenCategory: (category: string) => void;
  onOpenType: (category: string, typeValue: string, typeLabel: string) => void;
  onNewSupply: () => void;
  onEditSupply: (supply: SupplyDto) => void;
}) {
  const categoryLabel = supplyCategoryLabel(subView.category);
  const categoryItems = byCategory.get(subView.category) ?? [];
  const typeList = supplyTypeListFor(subView.category);

  const listedItems =
    subView.kind === "type"
      ? subView.typeValue === "__all__"
        ? categoryItems
        : supplies.filter(
            (s) =>
              s.category === subView.category && (s.type ?? "") === subView.typeValue,
          )
      : categoryItems;

  const listHeading =
    subView.kind === "type"
      ? subView.typeValue === "__all__"
        ? categoryLabel
        : subView.typeLabel
      : categoryLabel;

  return (
    <section className="rounded-2xl border border-ast-purple/30 bg-[#120724] p-5 studio-fade">
      <nav aria-label="Supplies breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg px-2 py-1 text-ast-cyan transition hover:bg-white/5"
        >
          Art Supplies
        </button>
        <span aria-hidden="true" className="text-ast-faint">›</span>
        {subView.kind === "type" && (
          <>
            <button
              type="button"
              onClick={() => onOpenCategory(subView.category)}
              className="rounded-lg px-2 py-1 text-ast-cyan transition hover:bg-white/5"
            >
              {categoryLabel}
            </button>
            <span aria-hidden="true" className="text-ast-faint">›</span>
          </>
        )}
        <span className="text-ast-body/80">{listHeading}</span>
      </nav>

      {subView.kind === "category" && typeList.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            onClick={() =>
              onOpenType(subView.category, "__all__", `All ${categoryLabel}`)
            }
            className="rounded-2xl border border-ast-purple/25 bg-[#0f0722] p-4 text-left transition hover:border-ast-purple/50"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-ast-lavender">
              All {categoryLabel}
            </p>
            <p className="mt-2 text-2xl font-bold text-white">{categoryItems.length}</p>
            <p className="mt-1 text-[11px] text-ast-faint">view all</p>
          </button>
          {typeList.map((type) => {
            const count =
              type.value === "__all__"
                ? categoryItems.length
                : byCategoryAndType.get(`${subView.category}::${type.value}`) ?? 0;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => onOpenType(subView.category, type.value, type.label)}
                className="rounded-2xl border border-ast-purple/25 bg-[#0f0722] p-4 text-left transition hover:border-ast-purple/50"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-ast-lavender">
                  {type.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-white">{count}</p>
                <p className="mt-1 text-[11px] text-ast-faint">items</p>
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          <p className="text-sm font-semibold text-white">{listHeading}</p>
          {listedItems.length === 0 ? (
            <div className="mt-3">
              <p className="text-sm text-ast-faint">No supplies here yet.</p>
              <button
                type="button"
                onClick={onNewSupply}
                className="mt-4 rounded-lg bg-gradient-to-r from-ast-turquoise to-ast-blue px-3.5 py-2 text-xs font-semibold text-white transition hover:opacity-90"
              >
                + Add Supply
              </button>
            </div>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {listedItems.map((supply) => (
                <li key={supply.id}>
                  <SupplyChip supply={supply} onEditSupply={onEditSupply} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function SupplyChip({
  supply,
  onEditSupply,
}: {
  supply: SupplyDto;
  onEditSupply: (supply: SupplyDto) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onEditSupply(supply)}
      className="w-full rounded-xl border border-ast-purple/25 bg-[#161030] p-3 text-left transition hover:border-ast-purple/50"
    >
      <p className="truncate text-sm font-medium text-ast-body">{supply.name}</p>
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
  );
}
