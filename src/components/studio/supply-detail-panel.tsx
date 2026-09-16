"use client";

/**
 * Supply detail panel — the card that opens when a supply chip is clicked
 * (the live app renders the panel in place, below the list — it does not
 * open the edit modal). Shows the supply's fields read-only with Delete
 * (native confirm, exact live copy) and Edit Supply actions.
 *
 * Classes mirror the live app's panel: rounded-2xl border-ast_pink/60
 * bg-ast_deep/95 p-6, "⚠️ status" pill, grid-cols-3 field rows.
 */
import { useState, useTransition } from "react";

import { deleteSupply } from "@/actions/studio";
import type { SupplyDto } from "@/lib/dto";
import { isNewItem, supplyConditionLabel } from "@/lib/studio-domain";

interface SupplyDetailPanelProps {
  supply: SupplyDto;
  onClose: () => void;
  onEdit: (supply: SupplyDto) => void;
  onDeleted: (supplyId: string) => void;
}

export function SupplyDetailPanel({
  supply,
  onClose,
  onEdit,
  onDeleted,
}: SupplyDetailPanelProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    // Native confirm with the live app's exact copy.
    if (!window.confirm("Delete this supply? This cannot be undone.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteSupply(supply.id);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      onDeleted(supply.id);
    });
  }

  return (
    <section
      aria-label={`Supply details for ${supply.name}`}
      className="mt-3 rounded-2xl border border-ast-pink/60 bg-ast-deep/95 p-6 shadow-ast-pink studio-fade"
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wider text-ast-pink">Supply</p>
          <h2 className="flex flex-wrap items-center gap-2 text-lg font-bold text-ast-cyan">
            {supply.name}
            <NewBadge createdAt={supply.createdAt} />
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-ast-pink/20 px-2 py-1 text-xs text-ast-pink">
            ⚠️ {supply.condition === "ok" ? "" : supplyConditionLabel(supply.condition).toLowerCase()}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close supply details"
            className="rounded-lg p-1 text-ast-faint transition hover:bg-white/5 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-x-6 gap-y-3">
        <DetailField label="Category" value={supply.category} />
        {supply.subcategory && (
          <DetailField label="Subcategory" value={supply.subcategory} />
        )}
        <DetailField label="Quantity" value={supply.quantity} />
        <DetailField label="Location" value={supply.location ?? "—"} />
      </div>

      {supply.barcode !== null && supply.barcode !== "" && (
        <div className="mb-4">
          <p className="mb-1 text-xs font-medium text-ast-lavender">Barcode / UPC</p>
          <p className="font-mono text-sm text-ast-body">{supply.barcode}</p>
        </div>
      )}

      {error && (
        <p role="alert" className="mb-3 text-sm text-ast-coral">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="rounded-lg border border-ast-yellow/30 bg-transparent px-4 py-2 text-sm text-ast-yellow transition hover:bg-ast-yellow/10 disabled:opacity-50"
        >
          Delete
        </button>
        <button
          type="button"
          onClick={() => onEdit(supply)}
          className="flex-1 rounded-lg bg-gradient-to-r from-ast-turquoise to-ast-blue px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Edit Supply
        </button>
      </div>
    </section>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-ast-lavender">{label}</p>
      <p className="text-sm text-ast-body">{value}</p>
    </div>
  );
}

export function NewBadge({ createdAt }: { createdAt: string }) {
  if (!isNewItem(createdAt)) return null;
  return (
    <span className="ml-1 rounded-full bg-ast-turquoise/40 px-2 py-0.5 align-middle text-xs font-semibold text-ast-turquoise">
      NEW
    </span>
  );
}
