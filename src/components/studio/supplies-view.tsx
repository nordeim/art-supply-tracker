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
 * tabs (Low Stock includes low AND critical — the live app's filter), and
 * chips open the supply detail panel in place, below the chip's row. After
 * a supply is created the view switches to the flat list, matching the
 * live app's post-create navigation.
 */
import { useMemo, useState } from "react";

import type { ProjectDto, SupplyDto } from "@/lib/dto";
import {
  SUPPLY_CATEGORIES,
  isNewItem,
  matchesStockFilter,
  supplyConditionPill,
  supplyTypeListFor,
} from "@/lib/studio-domain";
import { SupplyDetailPanel } from "@/components/studio/supply-detail-panel";
import { SupplyEditPanel } from "@/components/studio/supply-edit-panel";

interface SuppliesViewProps {
  supplies: SupplyDto[];
  projects: ProjectDto[];
  onExport: () => void;
  onImportClick: () => void;
  onNewSupply: () => void;
  onSupplySaved: (supply: SupplyDto) => void;
  /** "list" opens straight into the flat supply list (post-create navigation). */
  initialSubView: "grid" | "list";
  onSupplyDeleted: (supplyId: string) => void;
}

type StockFilter = "all" | "low" | "out";

type SuppliesSubView =
  | { kind: "category"; category: string }
  | { kind: "type"; category: string; typeValue: string; typeLabel: string }
  | { kind: "list" };

export function SuppliesView({
  supplies,
  projects,
  onExport,
  onImportClick,
  onNewSupply,
  onSupplySaved,
  initialSubView,
  onSupplyDeleted,
}: SuppliesViewProps) {
  const [subView, setSubView] = useState<SuppliesSubView | null>(
    initialSubView === "list" ? { kind: "list" } : null,
  );
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [openSupplyId, setOpenSupplyId] = useState<string | null>(null);
  // The live app swaps the detail panel for the inline edit form in place.
  const [editingSupplyId, setEditingSupplyId] = useState<string | null>(null);

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
    setEditingSupplyId(null);
  }

  const categoryLabel =
    subView && subView.kind !== "list" ? supplyCategoryLabel(subView.category) : "";

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[#9F6BFF]">Inventory</p>
          <h1 className="mt-2 bg-[linear-gradient(90deg,#00E6FF_0%,#2E64FF_35%,#8D5CFF_65%,#FF2FB3_100%)] bg-clip-text text-3xl font-bold text-transparent">
            Art Supplies
          </h1>
          {subView !== null && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-ast-muted">
              <button
                type="button"
                onClick={() => navigate(null)}
                className="transition hover:text-[#00E5FF]"
              >
                Art Supplies
              </button>
              {subView.kind !== "list" && (
                <>
                  <span aria-hidden="true" className="text-ast-faint">
                    ›
                  </span>
                  {/* The "All <Category>" list is breadcrumb-identical to the
                   * category view ("Art Supplies › Paint") — the live app
                   * renders no third segment for it, unlike a specific type
                   * ("Art Supplies › Paint › Watercolor"). */}
                  {subView.kind === "type" && subView.typeValue !== "__all__" ? (
                    <button
                      type="button"
                      onClick={() => navigate({ kind: "category", category: subView.category })}
                      className="transition hover:text-[#00E5FF]"
                    >
                      {categoryLabel}
                    </button>
                  ) : (
                    <span className="text-[#00E5FF]">{categoryLabel}</span>
                  )}
                </>
              )}
              {subView.kind === "type" && subView.typeValue !== "__all__" && (
                <>
                  <span aria-hidden="true" className="text-ast-faint">
                    ›
                  </span>
                  <span className="text-[#00E5FF]">{subView.typeValue}</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onImportClick}
            className="rounded-lg border border-[#9F6BFF]/40 px-3 py-1.5 text-xs text-[#9F6BFF] transition hover:border-[#315CFF]/60 hover:bg-[#315CFF]/10 hover:shadow-[0_0_12px_rgba(49,92,255,0.2)]"
          >
            Import JSON
          </button>
          <button
            type="button"
            onClick={onExport}
            className="rounded-lg border border-[#9F6BFF]/40 px-3 py-1.5 text-xs text-[#9F6BFF] transition hover:border-[#315CFF]/60 hover:bg-[#315CFF]/10 hover:shadow-[0_0_12px_rgba(49,92,255,0.2)]"
          >
            Export Data
          </button>
          <button
            type="button"
            onClick={onNewSupply}
            className="rounded-xl border border-ast-pink/40 bg-ast-pink/10 px-4 py-2 text-sm font-semibold text-ast-pink transition hover:bg-ast-pink/20"
          >
            + Add Supply
          </button>
        </div>
      </div>

      {subView === null && (
        <div className="grid grid-cols-3 gap-3">
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
                className="rounded-2xl border border-[#9F6BFF]/40 bg-[#9F6BFF]/5 p-5 text-left transition hover:border-[#00E5FF]/65 hover:bg-[#00E5FF]/5 hover:shadow-[0_0_20px_rgba(0,229,255,0.12)]"
              >
                <div className="mb-3 flex items-start justify-between">
                  <p className="text-sm font-semibold text-[#9F6BFF]">{category.label}</p>
                  {needsAttention && (
                    <span className="rounded bg-[#F6B94B]/20 px-1.5 py-0.5 text-xs font-semibold text-[#F6B94B]">
                      !
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-[#00E5FF]">{items.length}</p>
                <p className="mt-1 text-xs text-ast-faint">
                  {items.length === 1 ? "item" : "items"}
                  {category.typeCount > 0 && (
                    <span className="ml-1 text-ast-faint">· {category.typeCount} types</span>
                  )}
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
          projects={projects}
          byCategory={byCategory}
          stockFilter={stockFilter}
          onStockFilter={setStockFilter}
          openSupplyId={openSupplyId}
          onOpenSupply={(id) => {
            setOpenSupplyId((current) => (current === id ? null : id));
            setEditingSupplyId(null);
          }}
          onOpenType={(category, typeValue, typeLabel) =>
            navigate({ kind: "type", category, typeValue, typeLabel })
          }
          onNewSupply={onNewSupply}
          editingSupplyId={editingSupplyId}
          onEditSupply={(supply) => setEditingSupplyId(supply.id)}
          onSupplyEditClosed={() => setEditingSupplyId(null)}
          onSupplySaved={(saved) => {
            onSupplySaved(saved);
            setEditingSupplyId(null);
          }}
          openSupply={openSupply}
          onSupplyDeleted={(id) => {
            onSupplyDeleted(id);
            setOpenSupplyId(null);
            setEditingSupplyId(null);
          }}
        />
      )}
    </div>
  );
}

function supplyCategoryLabel(value: string): string {
  return SUPPLY_CATEGORIES.find((c) => c.value === value)?.label ?? value;
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
    <div className="mb-4 flex gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          aria-pressed={filter === tab.value}
          onClick={() => onFilter(tab.value)}
          className={`rounded-lg px-3 py-1 text-xs transition ${
            filter === tab.value
              ? "bg-ast-electric-blue/20 text-ast-electric-blue"
              : "text-ast-muted hover:text-ast-cyan"
          }`}
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
  projects,
  byCategory,
  stockFilter,
  onStockFilter,
  openSupplyId,
  onOpenSupply,
  onOpenType,
  onNewSupply,
  editingSupplyId,
  onEditSupply,
  onSupplyEditClosed,
  onSupplySaved,
  openSupply,
  onSupplyDeleted,
}: {
  subView: SuppliesSubView;
  supplies: SupplyDto[];
  projects: ProjectDto[];
  byCategory: Map<string, SupplyDto[]>;
  stockFilter: StockFilter;
  onStockFilter: (filter: StockFilter) => void;
  openSupplyId: string | null;
  onOpenSupply: (id: string) => void;
  onOpenType: (category: string, typeValue: string, typeLabel: string) => void;
  onNewSupply: () => void;
  editingSupplyId: string | null;
  onEditSupply: (supply: SupplyDto) => void;
  onSupplyEditClosed: () => void;
  onSupplySaved: (supply: SupplyDto) => void;
  openSupply: SupplyDto | null;
  onSupplyDeleted: (supplyId: string) => void;
}) {
  const categoryLabel =
    subView.kind === "list" ? "" : supplyCategoryLabel(subView.category);
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

  const filtered = listedItems.filter((s) => matchesStockFilter(s.condition, stockFilter));

  if (subView.kind === "category" && typeList.length > 0) {
    return (
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => onOpenType(subView.category, "__all__", `All ${categoryLabel}`)}
          className="rounded-2xl border border-[#00D6C9]/80 bg-[linear-gradient(135deg,rgba(0,229,255,0.14),rgba(49,92,255,0.16))] p-5 text-left shadow-[0_0_24px_rgba(0,229,255,0.18)] transition hover:shadow-[0_0_30px_rgba(0,229,255,0.25)]"
        >
          <p className="mb-3 text-sm font-semibold text-[#00D6C9]">All {categoryLabel}</p>
          <p className="text-2xl font-bold text-[#00E5FF]">{categoryItems.length}</p>
          <p className="mt-1 text-xs text-ast-faint">view all</p>
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
              className="rounded-2xl border border-[#9F6BFF]/30 bg-[#9F6BFF]/5 p-5 text-left transition hover:border-[#00E5FF]/65 hover:bg-[#00E5FF]/5 hover:shadow-[0_0_20px_rgba(0,229,255,0.12)]"
            >
              <p className="mb-3 text-sm font-semibold text-[#9F6BFF]/80">{type.value}</p>
              <p className="text-2xl font-bold text-[#00E5FF]">{count}</p>
              <p className="mt-1 text-xs text-ast-faint">{count === 1 ? "item" : "items"}</p>
            </button>
          );
        })}
      </div>
    );
  }

  // The live app lays chips out in rows of three with the detail panel
  // rendered directly below the selected chip's row.
  const rows: SupplyDto[][] = [];
  for (let i = 0; i < filtered.length; i += 3) rows.push(filtered.slice(i, i + 3));

  return (
    <section>
      {/* The live app shows the stock-filter tabs only when the list has
       * supplies to filter (an empty list renders just the empty state), but
       * keeps them once filtering is active — "No supplies match this filter."
       * appears under the tabs. */}
      {listedItems.length > 0 && <StockFilterTabs filter={stockFilter} onFilter={onStockFilter} />}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#9F6BFF]/20 bg-[#9F6BFF]/5 px-6 py-10 text-center">
          <p className="mb-1 text-sm font-medium text-[#9F6BFF]/60">
            {subView.kind === "type" && subView.typeValue !== "__all__"
              ? subView.typeValue
              : subView.kind === "category" ||
                  (subView.kind === "type" && subView.typeValue === "__all__")
                ? categoryLabel
                : ""}
          </p>
          <p className="text-sm text-ast-faint">
            {stockFilter !== "all" ? "No supplies match this filter." : "No supplies here yet."}
          </p>
          {/* The live app's filter-empty state has no create affordance —
           * only the plain empty list offers "+ Add Supply". */}
          {stockFilter === "all" && (
            <button
              type="button"
              onClick={onNewSupply}
              className="mt-4 rounded-xl border border-ast-pink/30 bg-ast-pink/10 px-4 py-2 text-sm text-ast-pink transition hover:bg-ast-pink/20"
            >
              + Add Supply
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row[0]?.id ?? "empty"}>
              <div className="grid grid-cols-3 gap-3">
                {row.map((supply) => (
                  <SupplyChip
                    key={supply.id}
                    supply={supply}
                    projectCount={supply.assignedProjectId ? 1 : 0}
                    open={openSupplyId === supply.id}
                    onOpen={() => onOpenSupply(supply.id)}
                  />
                ))}
              </div>
              {openSupply && row.some((s) => s.id === openSupply.id) && (
                editingSupplyId === openSupply.id ? (
                  <SupplyEditPanel
                    supply={openSupply}
                    projects={projects}
                    onCancel={onSupplyEditClosed}
                    onSaved={onSupplySaved}
                  />
                ) : (
                  <SupplyDetailPanel
                    supply={openSupply}
                    projects={projects}
                    onClose={() => onOpenSupply(openSupply.id)}
                    onEdit={onEditSupply}
                    onDeleted={onSupplyDeleted}
                  />
                )
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Supply chip — the live app's card: NEW badge, optional photo strip, name
 * (cyan when selected), "Category · Subcategory" sub-line, condition pill
 * (OK renders "?"), "qty N", and an "N projects" assignment pill.
 */
function SupplyChip({
  supply,
  projectCount,
  open,
  onOpen,
}: {
  supply: SupplyDto;
  projectCount: number;
  open: boolean;
  onOpen: () => void;
}) {
  const pill = supplyConditionPill(supply.condition);
  const isNew = isNewItem(supply.createdAt);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-expanded={open}
      className={`relative rounded-2xl border p-4 text-left transition ${
        open
          ? "border-ast-electric-blue/60 bg-ast-electric-blue/10 shadow-ast-blue"
          : "border-ast-purple/30 bg-ast-purple/5 hover:border-ast-lavender/40 hover:bg-ast-lavender/5"
      }`}
    >
      {isNew && (
        <span className="absolute right-2 top-2 rounded-full bg-ast-turquoise/40 px-2 py-0.5 text-xs font-semibold text-ast-turquoise">
          NEW
        </span>
      )}
      {supply.photo && (
        <img
          src={supply.photo}
          alt=""
          className="mb-2 h-16 w-full rounded-xl object-cover"
        />
      )}
      <p
        className={`mb-1 text-sm font-semibold leading-snug ${
          isNew ? "pr-12" : "pr-2"
        } ${open ? "text-ast-cyan" : "text-ast-body"}`}
      >
        {supply.name}
      </p>
      <p className="mb-3 text-xs text-ast-body/50">
        {supply.category}
        {supply.subcategory ? ` · ${supply.subcategory}` : ""}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${pill.classes}`}>
          {pill.label}
        </span>
        <div className="flex items-center gap-2">
          {/* The live renders the qty label unconditionally — an empty
           * quantity shows the bare "qty" span (r11, measured). */}
          <span className="text-xs text-ast-body/50">qty {supply.quantity}</span>
          {projectCount > 0 && (
            <span className="rounded bg-ast-lavender/20 px-1.5 py-0.5 text-xs text-ast-lavender">
              {projectCount} {projectCount === 1 ? "project" : "projects"}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
