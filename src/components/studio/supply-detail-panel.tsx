"use client";

/**
 * Supply detail panel — the card that opens when a supply chip is clicked
 * (the live app renders the panel in place, below the chip's row — it does
 * not open the edit modal). Shows the supply's fields read-only (Category,
 * Subcategory, Quantity, Location, Notes, Used-in-Projects chips, Photo,
 * Barcode) with Close, Delete (native confirm, exact live copy), and Edit
 * Supply actions.
 *
 * Classes mirror the live app's panel: rounded-2xl border-ast_pink/60
 * bg-ast_deep/95 p-6 shadow-astPink, "⚠️ status" condition pill,
 * grid-cols-3 field rows, pink-gradient Edit Supply.
 */
import { useState, useTransition } from "react";

import { deleteSupply } from "@/actions/studio";
import type { ProjectDto, SupplyDto } from "@/lib/dto";
import { isNewItem, supplyDetailConditionIcon } from "@/lib/studio-domain";

interface SupplyDetailPanelProps {
  supply: SupplyDto;
  projects: ProjectDto[];
  onClose: () => void;
  onEdit: (supply: SupplyDto) => void;
  onDeleted: (supplyId: string) => void;
}

export function SupplyDetailPanel({
  supply,
  projects,
  onClose,
  onEdit,
  onDeleted,
}: SupplyDetailPanelProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const condition = supplyDetailConditionIcon(supply.condition);
  const usedInProjects = supply.assignedProjectId
    ? projects.filter((p) => p.id === supply.assignedProjectId)
    : [];

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
            {isNewItem(supply.createdAt) && (
              <span className="ml-2 rounded-full bg-ast-pink/40 px-2 py-0.5 align-middle text-xs font-semibold text-ast-pink">
                NEW
              </span>
            )}
          </h2>
        </div>
        <span className={`rounded px-2 py-1 text-xs ${condition.classes}`}>
          {condition.icon} {condition.label}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-x-6 gap-y-3">
        <DetailField label="Category" value={supply.category} />
        {supply.subcategory && (
          <DetailField label="Subcategory" value={supply.subcategory} />
        )}
        {/* The live renders an empty quantity as a BLANK value (r11,
         * measured) — the "—" fallback belongs to Location only. */}
        <DetailField label="Quantity" value={supply.quantity} />
        <DetailField label="Location" value={supply.location ?? "—"} />
        {supply.notes && (
          <div className="col-span-3">
            <p className="mb-1 text-xs font-medium text-ast-lavender">Notes</p>
            <p className="text-sm text-ast-body">{supply.notes}</p>
          </div>
        )}
      </div>

      {usedInProjects.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-ast-lavender">Used in Projects</p>
          <div className="flex flex-wrap gap-1.5">
            {usedInProjects.map((project) => (
              <span
                key={project.id}
                className="rounded bg-ast-lavender/20 px-2 py-0.5 text-xs text-ast-lavender"
              >
                {project.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {supply.photo && (
        <div className="mb-4">
          <p className="mb-1 text-xs font-medium text-ast-lavender">Photo</p>
          <img
            src={supply.photo}
            alt=""
            className="h-32 w-32 rounded-xl border border-ast-pink/30 object-cover"
          />
        </div>
      )}

      {supply.barcode && (
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
          onClick={onClose}
          className="rounded-lg border border-ast-yellow/30 bg-transparent px-4 py-2 text-sm text-ast-yellow transition hover:bg-ast-yellow/10"
        >
          Close
        </button>
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
          className="flex-1 rounded-lg bg-gradient-to-r from-ast-pink to-ast-purple px-4 py-2 text-sm font-semibold text-white shadow-ast-pink transition hover:shadow-lg"
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
