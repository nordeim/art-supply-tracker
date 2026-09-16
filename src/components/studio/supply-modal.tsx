"use client";

/**
 * Supply modal — Add / Edit Supply dialog with name, photo, category, type,
 * quantity, condition, location, notes, barcode, and project assignment,
 * cloned from the live app's form (same option lists, same placeholders).
 */
import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";

import { createSupply, updateSupply } from "@/actions/studio";
import type { ProjectDto, SupplyDto } from "@/lib/dto";
import {
  SUPPLY_CATEGORIES,
  SUPPLY_CONDITIONS,
  SUPPLY_TYPES,
} from "@/lib/studio-domain";

interface SupplyModalProps {
  initial: SupplyDto | null;
  projects: ProjectDto[];
  onClose: () => void;
  onSaved: (supply: SupplyDto, isEdit: boolean) => void;
}

const MAX_PHOTO_BYTES = 300 * 1024;

async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
  if (dataUrl.length > MAX_PHOTO_BYTES) {
    throw new Error(
      `"${file.name}" is too large after compression — try a smaller image.`,
    );
  }
  return dataUrl;
}

export function SupplyModal({ initial, projects, onClose, onSaved }: SupplyModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "paint");
  const [type, setType] = useState(initial?.type ?? "none");
  const [quantity, setQuantity] = useState(initial?.quantity ?? "");
  const [condition, setCondition] = useState(initial?.condition ?? "ok");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [barcode, setBarcode] = useState(initial?.barcode ?? "");
  const [photo, setPhoto] = useState<string | null>(initial?.photo ?? null);
  const [assignedProjectId, setAssignedProjectId] = useState(
    initial?.assignedProjectId ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);

  const isEdit = initial !== null;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    dialogRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function onAddPhoto(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setError(null);
    fileToDataUrl(file)
      .then(setPhoto)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Could not read that image."),
      );
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Supply name is required.");
      return;
    }
    if (!quantity.trim()) {
      setError("Quantity is required.");
      return;
    }

    const payload = {
      name: name.trim(),
      category,
      type,
      quantity: quantity.trim(),
      condition,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      barcode: barcode.trim() || undefined,
      photo: photo ?? undefined,
      assignedProjectId: assignedProjectId || undefined,
    };

    startTransition(async () => {
      const result = isEdit
        ? await updateSupply(initial.id, payload)
        : await createSupply(payload);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      onSaved(result.data, isEdit);
    });
  }

  const inputClass =
    "w-full rounded-xl border border-ast-purple/40 bg-[#0B0018] px-3.5 py-2.5 text-sm text-white placeholder:text-ast-faint focus:border-ast-cyan/60 focus:outline-none focus:ring-2 focus:ring-ast-cyan/30";
  const labelClass = "mb-1.5 block text-sm font-medium text-ast-lavender";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="supply-modal-title"
        className="w-full max-w-lg rounded-2xl border border-ast-purple/35 bg-[#120724] p-6 shadow-2xl studio-fade max-h-[90vh] overflow-y-auto scrollbar-studio"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="supply-modal-title" className="text-lg font-bold text-white">
            {isEdit ? "Edit Supply" : "Add Supply"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-ast-faint transition hover:bg-white/5 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="supply-name" className={labelClass}>
              Name
            </label>
            <input
              id="supply-name"
              type="text"
              required
              maxLength={160}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Winsor & Newton Cobalt Blue"
              className={inputClass}
            />
          </div>

          <div>
            <span className={labelClass}>Photo</span>
            <div className="flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-ast-purple/40 bg-[#0B0018] px-4 py-2.5 text-sm text-ast-faint transition hover:border-ast-cyan/50 hover:text-ast-body">
                📷 Add photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    onAddPhoto(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
              {photo && (
                <div className="relative">
                  <Image
                    src={photo}
                    alt="Supply photo"
                    width={56}
                    height={56}
                    unoptimized
                    className="h-14 w-14 rounded-lg border border-ast-purple/40 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    aria-label="Remove photo"
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ast-coral text-[10px] font-bold text-white"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="supply-category" className={labelClass}>
                Category
              </label>
              <select
                id="supply-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-ast-purple/40 bg-[#0B0018] px-3.5 py-2.5 text-sm text-white focus:border-ast-cyan/60 focus:outline-none"
              >
                {SUPPLY_CATEGORIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="supply-type" className={labelClass}>
                Type
              </label>
              <select
                id="supply-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-ast-purple/40 bg-[#0B0018] px-3.5 py-2.5 text-sm text-white focus:border-ast-cyan/60 focus:outline-none"
              >
                {SUPPLY_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="supply-quantity" className={labelClass}>
                Quantity
              </label>
              <input
                id="supply-quantity"
                type="text"
                required
                maxLength={40}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g., 2, 1.5, or 1/2"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="supply-condition" className={labelClass}>
                Condition
              </label>
              <select
                id="supply-condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full rounded-xl border border-ast-purple/40 bg-[#0B0018] px-3.5 py-2.5 text-sm text-white focus:border-ast-cyan/60 focus:outline-none"
              >
                {SUPPLY_CONDITIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="supply-location" className={labelClass}>
              Location
            </label>
            <input
              id="supply-location"
              type="text"
              maxLength={200}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Shelf A, Cabinet"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="supply-notes" className={labelClass}>
              Notes
            </label>
            <textarea
              id="supply-notes"
              rows={3}
              maxLength={4000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details about the supply..."
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label htmlFor="supply-barcode" className={labelClass}>
              Barcode
            </label>
            <input
              id="supply-barcode"
              type="text"
              maxLength={120}
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Enter barcode manually"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="supply-project" className={labelClass}>
              Assigned to project
            </label>
            <select
              id="supply-project"
              value={assignedProjectId}
              onChange={(e) => setAssignedProjectId(e.target.value)}
              className="w-full rounded-xl border border-ast-purple/40 bg-[#0B0018] px-3.5 py-2.5 text-sm text-white focus:border-ast-cyan/60 focus:outline-none"
            >
              <option value="">Unassigned — Studio inventory</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p role="alert" className="text-sm text-ast-coral">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-ast-purple/40 px-4 py-2.5 text-sm font-medium text-ast-body/80 transition hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-gradient-to-r from-ast-turquoise to-ast-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Saving…" : isEdit ? "Save Changes" : "Add Supply"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
