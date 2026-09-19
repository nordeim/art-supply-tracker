"use client";

/**
 * Supply edit panel — the live app's INLINE edit form, rendered in the
 * detail-panel slot below the selected chip row (not a centered dialog).
 * Structure extracted verbatim from the deployed bundle (`ie` JSX): a
 * `mt-3 rounded-2xl border-ast_pink/60 bg-ast_deep/95 p-6 shadow-astPink`
 * panel with an "Edit Supply" + ✕ header, a Name+Photo row, a 2-column
 * grid (Category, Quantity, Stock Status, Location, Notes-as-input), the
 * conditional Subcategory/Custom-Category block, Barcode, and "Add to
 * Project" with the current assignment chip. Placeholders differ from the
 * create modal (Quantity "e.g., 2 or 1/2", Barcode "e.g., 012345678901").
 */
import { useState, useTransition } from "react";
import Image from "next/image";

import { updateSupply } from "@/actions/studio";
import type { ProjectDto, SupplyDto } from "@/lib/dto";
import {
  SUBCATEGORY_NONE,
  SUBCATEGORY_OTHER,
  SUPPLY_CATEGORIES,
  SUPPLY_CONDITIONS,
  UNASSIGNED_OPTION_EDIT,
  isValidQuantityInput,
  subcategoryOptionsFor,
} from "@/lib/studio-domain";
import { fileToDataUrl } from "@/components/studio/photo-data-url";

interface SupplyEditPanelProps {
  supply: SupplyDto;
  projects: ProjectDto[];
  onCancel: () => void;
  onSaved: (supply: SupplyDto) => void;
}

export function SupplyEditPanel({ supply, projects, onCancel, onSaved }: SupplyEditPanelProps) {
  const [name, setName] = useState(supply.name);
  const [category, setCategory] = useState(supply.category);
  const [subcategory, setSubcategory] = useState(supply.subcategory ?? SUBCATEGORY_NONE);
  const [customSubcategory, setCustomSubcategory] = useState("");
  const [quantity, setQuantity] = useState(supply.quantity);
  // An absent status (null — the create modal's inert-select result) opens
  // the edit form on "OK": the live's edit select shows OK for such
  // supplies, and saving stores the explicit "ok" (r11, measured).
  const [condition, setCondition] = useState(supply.condition ?? "ok");
  const [location, setLocation] = useState(supply.location ?? "");
  const [notes, setNotes] = useState(supply.notes ?? "");
  const [barcode, setBarcode] = useState(supply.barcode ?? "");
  const [photo, setPhoto] = useState<string | null>(supply.photo);
  const [assignedProjectId, setAssignedProjectId] = useState(supply.assignedProjectId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isOtherCategory = category === "Other";
  const subcategoryOptions = subcategoryOptionsFor(category);
  const showSubcategory = subcategoryOptions.length > 0;
  const isCustomSubcategory = subcategory === SUBCATEGORY_OTHER;
  const assignedProject = projects.find((p) => p.id === assignedProjectId) ?? null;

  function onCategoryChange(next: string) {
    setCategory(next);
    // A subcategory from another category's list is invalid for the new
    // category — reset to None unless the value is still offered.
    const stillValid = subcategoryOptionsFor(next).some((o) => o.value === subcategory);
    if (!stillValid) setSubcategory(SUBCATEGORY_NONE);
    setCustomSubcategory("");
  }

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
    // The live's quantity gate (r11): empty is accepted (stored as ""),
    // unparseable text is rejected with the create form's exact copy.
    if (!isValidQuantityInput(quantity)) {
      setError("Enter a valid quantity, like 2, 1.5, or 1/2");
      return;
    }
    const resolvedSubcategory = isOtherCategory
      ? SUBCATEGORY_NONE
      : isCustomSubcategory
        ? customSubcategory.trim() || SUBCATEGORY_NONE
        : subcategory;

    startTransition(async () => {
      const result = await updateSupply(supply.id, {
        name: name.trim(),
        category,
        subcategory: showSubcategory ? resolvedSubcategory : SUBCATEGORY_NONE,
        quantity: quantity.trim(),
        condition,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        barcode: barcode.trim() || undefined,
        photo: photo ?? undefined,
        assignedProjectId: assignedProjectId || undefined,
      });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      onSaved(result.data);
    });
  }

  const inputClass =
    "w-full rounded-lg border border-ast-pink/30 bg-ast-bg-dark/70 px-3 py-2 text-white transition placeholder:text-white/40 focus:border-ast-pink focus:outline-none focus:ring-2 focus:ring-ast-pink/30";
  const labelClass = "mb-2 block text-sm font-medium text-ast-lavender";

  return (
    <section
      aria-label={`Edit supply ${supply.name}`}
      className="mt-3 rounded-2xl border border-ast-pink/60 bg-ast-deep/95 p-6 shadow-ast-pink studio-fade"
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ast-pink">Edit Supply</h2>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close edit form"
          className="text-xl text-ast-yellow/60 transition hover:text-ast-yellow"
        >
          ✕
        </button>
      </div>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <label htmlFor="edit-supply-name" className={labelClass}>
              Name
            </label>
            <input
              id="edit-supply-name"
              type="text"
              maxLength={160}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="shrink-0">
            <span className={labelClass}>Photo</span>
            {photo ? (
              <div className="relative">
                <Image
                  src={photo}
                  alt="Supply photo"
                  width={64}
                  height={64}
                  unoptimized
                  className="h-16 w-16 rounded-xl border border-ast-pink/30 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  aria-label="Remove photo"
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white transition hover:bg-ast-pink"
                >
                  ×
                </button>
                <label className="mt-2 block cursor-pointer text-center text-[10px] text-ast-muted transition hover:text-ast-body">
                  Change photo
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
              </div>
            ) : (
              <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-xl border border-ast-pink/30 bg-ast-bg-dark/70 text-ast-muted transition hover:border-ast-pink/60 hover:text-ast-body">
                <span aria-hidden="true" className="text-lg leading-none">
                  📷
                </span>
                <span className="mt-1 text-[9px]">Add photo</span>
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
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-supply-category" className={labelClass}>
              Category
            </label>
            <select
              id="edit-supply-category"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className={inputClass}
            >
              {SUPPLY_CATEGORIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="edit-supply-quantity" className={labelClass}>
              Quantity
            </label>
            <input
              id="edit-supply-quantity"
              type="text"
              inputMode="decimal"
              maxLength={40}
              placeholder="e.g., 2 or 1/2"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="edit-supply-condition" className={labelClass}>
              Stock Status
            </label>
            <select
              id="edit-supply-condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className={inputClass}
            >
              {SUPPLY_CONDITIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="edit-supply-location" className={labelClass}>
              Location
            </label>
            <input
              id="edit-supply-location"
              type="text"
              maxLength={200}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="edit-supply-notes" className={labelClass}>
              Notes
            </label>
            <input
              id="edit-supply-notes"
              type="text"
              maxLength={4000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {isOtherCategory ? (
          <div>
            <label htmlFor="edit-supply-custom-category" className={labelClass}>
              Custom Category
            </label>
            <input
              id="edit-supply-custom-category"
              type="text"
              placeholder="e.g., Colored Pencil, Charcoal"
              value={customSubcategory}
              onChange={(e) => setCustomSubcategory(e.target.value)}
              className={inputClass}
            />
          </div>
        ) : (
          showSubcategory && (
            <div>
              <label htmlFor="edit-supply-subcategory" className={labelClass}>
                Subcategory
              </label>
              <select
                id="edit-supply-subcategory"
                value={subcategory}
                onChange={(e) => {
                  setSubcategory(e.target.value);
                  setCustomSubcategory("");
                }}
                className={inputClass}
              >
                {subcategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {isCustomSubcategory && (
                <input
                  type="text"
                  placeholder="e.g., Dry brush, Palette knife…"
                  value={customSubcategory}
                  onChange={(e) => setCustomSubcategory(e.target.value)}
                  className={`${inputClass} mt-2`}
                />
              )}
            </div>
          )
        )}

        <div>
          <label htmlFor="edit-supply-barcode" className={`${labelClass} font-semibold`}>
            Barcode / UPC
          </label>
          <input
            id="edit-supply-barcode"
            type="text"
            inputMode="numeric"
            maxLength={120}
            placeholder="e.g., 012345678901"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="w-full rounded-lg border border-blue-500/40 bg-black/30 px-3 py-2 text-white transition placeholder:text-white/40 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        <div>
          <label htmlFor="edit-supply-project" className={labelClass}>
            Add to Project
          </label>
          {assignedProject && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              <span className="rounded bg-ast-lavender/20 px-2 py-0.5 text-xs text-ast-lavender">
                {assignedProject.name}
              </span>
            </div>
          )}
          <select
            id="edit-supply-project"
            value={assignedProjectId}
            onChange={(e) => setAssignedProjectId(e.target.value)}
            className={inputClass}
          >
            <option value="">{UNASSIGNED_OPTION_EDIT}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-ast-pink/50 bg-ast-pink/10 px-3 py-2 text-sm text-ast-pink"
          >
            {error}
          </p>
        )}

        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="flex-1 rounded-lg border border-ast-yellow/30 bg-transparent px-4 py-2 text-ast-yellow transition hover:bg-ast-yellow/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-lg bg-gradient-to-r from-ast-pink to-ast-purple px-4 py-2 font-semibold text-white shadow-ast-pink transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </section>
  );
}
