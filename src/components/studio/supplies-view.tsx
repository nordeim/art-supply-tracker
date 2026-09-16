"use client";

/**
 * Supplies view — "INVENTORY / Art Supplies": utility row (Import JSON,
 * Export Data, + Add Supply) and the category grid with per-category counts
 * (Paint · 6 types, Brushes & Tools · 7 types, …). Clicking a category
 * navigates to a breadcrumb sub-view ("Art Supplies › Paint") listing the
 * live app's type tiles ("All Paint", Watercolor, Acrylic…); clicking a type
 * tile filters to that type's supply list ("Art Supplies › Paint ›
 * Watercolor"). Categories without types (Other) open the list directly.
 *
 * Supply lists carry the live app's "All | Low Stock | Out of Stock" filter
 * tabs, and chips open the supply detail panel (not the edit modal). After
 * a supply is created the view switches to the flat list, matching the live
 * app's post-create navigation.
 */
import { useMemo, useState } from "react";

import type { ProjectDto, SupplyDto } from "@/lib/dto";
import {
  SUPPLY_CATEGORIES,
  supplyTypeListFor,
} from "@/lib/studio-domain";
import { SupplyDetailPanel } from "@/components/studio/supply-detail-panel";
import { NewBadge } from "@/components/studio/supply-detail-panel";

interface SuppliesViewProps {
  supplies: SupplyDto[];
  projects: ProjectDto[];
  onExport: () => void;
  onImportClick: () => void;
  onNewSupply: () => void;
  onEditSupply: (supply: SupplyDto) => void;
  /** "list" opens straight into the flat supply list (post-create navigation). */
  initialSubView: "grid" | "list";
  onSupplyDeleted: (supplyId: string) => void;
}

type StockFilter = "all" | "low" | "out";

type SuppliesSubView =
  | { kind: "category"; category: string }
  | { kind: "type"; category: string; typeValue: string; typeLabel: string }
  | { kind: "list" };

function matchesStockFilter(supply: SupplyDto, filter: StockFilter): boolean {
  if (filter === "low") return supply.condition === "low";
  if (filter === "out") return supply.condition === "critical";
  return true;
}

export function SuppliesView({
  supplies,
  onExport,
  onImportClick,
  onNewSupply,
  onEditSupply,
  initialSubView,
  onSupplyDeleted,
}: SuppliesViewProps) {
  const [subView, setSubView] = useState<SuppliesSubView | null>(
    initialSubView === "list" ? { kind: "list" } : null,
  );
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [openSupplyId, setOpenSupplyId] = useState<string | null>(null);

  const byCategory = useMemo(() => {
    const groups = new Map<string, SupplyDto[]>();
    for (const category of SUPPLY_CATEGORIES) groups.set(category.value, []);
    for (const supply of supplies) {
      const bucket = groups.get(supply.category);
      if (bucket) bucket.push(supply);
      else groups.get("Other")?.push(supply);
    }
    return groups;
  }, [supplies]);

  const openSupply = supplies.find((s) => s.id === openSupplyId) ?? null;

  function navigate(next: SuppliesSubView | null) {
    setSubView(next);
    setStockFilter("all");
    setOpenSupplyId(null);
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
            const needsAttention = items.some(
              (s) => s.condition === "low" || s.condition === "critical",
            );
            return (
              <button
                key={category.value}
                type="button"
                onClick={() => navigate({ kind: "category", category: category.value })}
                className="rounded-2xl border border-ast-purple/25 bg-[#120724] p-5 text-left transition hover:border-ast-purple/50"
              >
                <div className="mb-3 flex items-start justify-between">
                  <p className="text-sm font-semibold text-ast-lavender">
                    {category.label}
                  </p>
                  {needsAttention && (
                    <span className="rounded bg-[#F6B94B]/20 px-1.5 py-0.5 text-xs font-semibold text-[#F6B94B]">
                      !
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-[#00E5FF]">{items.length}</p>
                <p className="mt-1 text-xs text-ast-faint">
                  {items.length === 1 ? "item" : "items"}
                  {category.typeCount > 0
                    ? <span className="ml-1 text-ast-faint">· {category.typeCount} types</span>
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
          stockFilter={stockFilter}
          onStockFilter={setStockFilter}
          openSupplyId={openSupplyId}
          onOpenSupply={(id) => setOpenSupplyId((current) => (current === id ? null : id))}
          onBack={() => navigate(null)}
          onOpenCategory={(category) => navigate({ kind: "category", category })}
          onOpenType={(category, typeValue, typeLabel) =>
            navigate({ kind: "type", category, typeValue, typeLabel })
          }
          onNewSupply={onNewSupply}
          onEditSupply={onEditSupply}
          openSupply={openSupply}
          onCloseSupply={() => setOpenSupplyId(null)}
          onSupplyDeleted={(id) => {
            onSupplyDeleted(id);
            setOpenSupplyId(null);
          }}
        />
      )}
    </div>
  );
}

function StockFilterTabs({
  filter,
  onFilter,
}: {
  filter: StockFilter;
  onFilter: (filter: StockFilter) => void;
}) {
  const tabs: { value: StockFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "low", label: "Low Stock" },
    { value: "out", label: "Out of Stock" },
  ];
  return (
    <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Stock filters">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          aria-pressed={filter === tab.value}
          onClick={() => onFilter(tab.value)}
          className={
            filter === tab.value
              ? "rounded-lg border border-ast-electric-blue/60 bg-ast-electric-blue/15 px-3.5 py-1.5 text-xs font-semibold text-ast-cyan"
              : "rounded-lg border border-ast-purple/30 bg-[#120724] px-3.5 py-1.5 text-xs font-medium text-ast-body/70 transition hover:border-ast-electric-blue/40 hover:text-ast-cyan"
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function SuppliesSubViewPanel({
  subView,
  supplies,
  byCategory,
  stockFilter,
  onStockFilter,
  openSupplyId,
  onOpenSupply,
  onBack,
  onOpenCategory,
  onOpenType,
  onNewSupply,
  onEditSupply,
  openSupply,
  onCloseSupply,
  onSupplyDeleted,
}: {
  subView: SuppliesSubView;
  supplies: SupplyDto[];
  byCategory: Map<string, SupplyDto[]>;
  stockFilter: StockFilter;
  onStockFilter: (filter: StockFilter) => void;
  openSupplyId: string | null;
  onOpenSupply: (id: string) => void;
  onBack: () => void;
  onOpenCategory: (category: string) => void;
  onOpenType: (category: string, typeValue: string, typeLabel: string) => void;
  onNewSupply: () => void;
  onEditSupply: (supply: SupplyDto) => void;
  openSupply: SupplyDto | null;
  onCloseSupply: () => void;
  onSupplyDeleted: (supplyId: string) => void;
}) {
  const categoryLabel =
    subView.kind === "list" ? "" : supplyCategoryShortLabel(subView.category);
  const categoryItems = subView.kind === "list" ? [] : byCategory.get(subView.category) ?? [];
  const typeList = subView.kind === "list" ? [] : supplyTypeListFor(subView.category);

  const listedItems = useMemo(() => {
    if (subView.kind === "list") return supplies;
    if (subView.kind === "type") {
      if (subView.typeValue === "__all__") return categoryItems;
      return supplies.filter(
        (s) => s.category === subView.category && (s.subcategory ?? "") === subView.typeValue,
      );
    }
    return categoryItems;
  }, [subView, supplies, categoryItems]);

  const filtered = listedItems.filter((s) => matchesStockFilter(s, stockFilter));

  const listHeading =
    subView.kind === "type"
      ? subView.typeValue === "__all__"
        ? categoryLabel
        : subView.typeLabel
      : categoryLabel;

  return (
    <section className="studio-fade">
      <nav aria-label="Supplies breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg px-2 py-1 text-ast-cyan transition hover:bg-white/5"
        >
          Art Supplies
        </button>
        {subView.kind !== "list" && (
          <>
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
          </>
        )}
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
            const count = categoryItems.filter(
              (s) => (s.subcategory ?? "") === type.value,
            ).length;
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
                <p className="mt-1 text-[11px] text-ast-faint">
                  {count === 1 ? "item" : "items"}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          {subView.kind !== "category" && <StockFilterTabs filter={stockFilter} onFilter={onStockFilter} />}
          <p className="text-sm font-semibold text-white">{listHeading}</p>
          {filtered.length === 0 ? (
            <div className="mt-3">
              <p className="text-sm text-ast-faint">
                {subView.kind !== "category" && stockFilter !== "all"
                  ? "No supplies match this filter."
                  : "No supplies here yet."}
              </p>
              <button
                type="button"
                onClick={onNewSupply}
                className="mt-4 rounded-lg bg-gradient-to-r from-ast-turquoise to-ast-blue px-3.5 py-2 text-xs font-semibold text-white transition hover:opacity-90"
              >
                + Add Supply
              </button>
            </div>
          ) : (
            <>
              <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {filtered.map((supply) => (
                  <li key={supply.id}>
                    <SupplyChip
                      supply={supply}
                      open={openSupplyId === supply.id}
                      onOpen={() => onOpenSupply(supply.id)}
                    />
                  </li>
                ))}
              </ul>
              {openSupply && (
                <SupplyDetailPanel
                  supply={openSupply}
                  onClose={onCloseSupply}
                  onEdit={onEditSupply}
                  onDeleted={onSupplyDeleted}
                />
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

/** Chips render the raw category token (the live app shows "Brush", not "Brushes & Tools"). */
function supplyCategoryShortLabel(value: string): string {
  return value;
}

/**
 * Supply chip — the live app's card: NEW badge, name (cyan when the item
 * needs attention, body otherwise), "Category · Subcategory" sub-line,
 * condition pill (OK renders "?"), and "qty N".
 */
function SupplyChip({
  supply,
  open,
  onOpen,
}: {
  supply: SupplyDto;
  open: boolean;
  onOpen: () => void;
}) {
  const needsAttention = supply.condition === "low" || supply.condition === "critical";
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-expanded={open}
      className={`relative w-full rounded-2xl border p-4 text-left transition ${
        open
          ? "border-ast-electric-blue/70 bg-ast-electric-blue/15"
          : "border-ast-purple/25 bg-[#120724] hover:border-ast-purple/50"
      }`}
    >
      <NewBadge createdAt={supply.createdAt} />
      <p
        className={`mb-1 truncate pr-12 text-sm font-semibold leading-snug ${
          needsAttention ? "text-ast-cyan" : "text-ast-body"
        }`}
      >
        {supply.name}
      </p>
      <p className="mb-3 text-xs text-ast-body/50">
        {supply.category}
        {supply.subcategory ? ` · ${supply.subcategory}` : ""}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={
            needsAttention
              ? "rounded-full bg-ast-pink/20 px-2 py-0.5 text-xs font-medium text-ast-pink"
              : "rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-ast-faint"
          }
        >
          {needsAttention ? supplyConditionShort(supply.condition) : "?"}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ast-body/50">qty {supply.quantity}</span>
        </div>
      </div>
    </button>
  );
}

function supplyConditionShort(condition: string): string {
  if (condition === "low") return "Low";
  if (condition === "critical") return "Critical";
  return "?";
}
