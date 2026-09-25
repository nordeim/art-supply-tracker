"use client";

/**
 * Supply modal — the CREATE dialog with name, photo, category,
 * subcategory (per-category picker + Other/Custom free-form input),
 * quantity, condition, location, notes, barcode, and project assignment,
 * cloned from the live app's form (same option lists, same placeholders).
 * Editing happens in the inline SupplyEditPanel, mirroring the live app.
 *
 * The Subcategory picker mirrors the live app exactly: it renders the
 * chosen category's list between the "— None —" and "Other / Custom…"
 * sentinels (a custom text input appears when Other/Custom is picked),
 * and is hidden entirely for the "Other" category (no subcategories).
 */
import { useState, useTransition } from "react";
import Image from "next/image";

import { createSupply } from "@/actions/studio";
import type { ProjectDto, SupplyDto } from "@/lib/dto";
import {
  SUPPLY_CATEGORIES,
  SUPPLY_CONDITIONS,
  SUBCATEGORY_NONE,
  SUBCATEGORY_OTHER,
  UNASSIGNED_OPTION_CREATE,
  isValidQuantityInput,
  subcategoryOptionsFor,
} from "@/lib/studio-domain";
import { fileToDataUrl } from "@/components/studio/photo-data-url";

interface SupplyModalProps {
  projects: ProjectDto[];
  onClose: () => void;
  onSaved: (supply: SupplyDto) => void;
}

export function SupplyModal({ projects, onClose, onSaved }: SupplyModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Paint");
  const [subcategory, setSubcategory] = useState(SUBCATEGORY_NONE);
  const [customSubcategory, setCustomSubcategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [condition, setCondition] = useState("ok");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [barcode, setBarcode] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [assignedProjectId, setAssignedProjectId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // r15-F2 keyboard parity: the live's create modal has NO keyboard
  // affordances — focus stays on the trigger button (no focus management)
  // and Escape does not dismiss (only ✕ and the scrim click do). No
  // keydown listener, no focus steal (pinned by focus-fidelity.test.ts).

  const subcategoryOptions = subcategoryOptionsFor(category);
  // The live app hides the Subcategory picker for the Other category.
  const showSubcategory = subcategoryOptions.length > 0;
  const isCustomSubcategory = subcategory === SUBCATEGORY_OTHER;

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
    // The live's quantity gate (r11, measured 2026-09-19): empty is
    // ACCEPTED (the supply stores ""), unparseable text is rejected with
    // this exact copy.
    if (!isValidQuantityInput(quantity)) {
      setError("Enter a valid quantity, like 2, 1.5, or 1/2");
      return;
    }
    // The live save path resolves the __other__ sentinel to the custom text
    // (falling back to no subcategory when the field is left blank).
    const resolvedSubcategory = isCustomSubcategory
      ? customSubcategory.trim() || SUBCATEGORY_NONE
      : subcategory;

    const payload = {
      name: name.trim(),
      category,
      subcategory: showSubcategory ? resolvedSubcategory : SUBCATEGORY_NONE,
      quantity: quantity.trim(),
      // The live's create path never stores a status — its Stock Status
      // select is inert (verified on the deployed app: a supply created
      // with "Low" selected still carries no status in the export). The
      // select stays rendered for visual parity; its value is dropped
      // here. Conditions only become explicit through the edit panel.
      condition: null,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      barcode: barcode.trim() || undefined,
      photo: photo ?? undefined,
      assignedProjectId: assignedProjectId || undefined,
    };

    startTransition(async () => {
      const result = await createSupply(payload);
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
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="supply-modal-title"
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-ast-pink/60 bg-ast-deep/95 shadow-ast-pink md:max-w-2xl"
      >
        <div className="flex shrink-0 items-center justify-between px-6 pb-4 pt-6">
          <h2 id="supply-modal-title" className="text-2xl font-bold text-ast-pink">
            Add Supply
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-2xl text-ast-yellow/60 transition hover:text-ast-yellow"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-4 pb-2">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <label htmlFor="supply-name" className={labelClass}>
                Supply Name <span aria-hidden="true">*</span>
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
            <div className="shrink-0">
              <span className={labelClass}>Photo</span>
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
              {photo && (
                <div className="relative mt-2">
                  <Image
                    src={photo}
                    alt="Supply photo"
                    width={56}
                    height={56}
                    unoptimized
                    className="h-14 w-14 rounded-xl border border-ast-pink/30 object-cover"
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

          <div className={showSubcategory ? "grid grid-cols-1 gap-4 md:grid-cols-2" : undefined}>
            <div>
              <label htmlFor="supply-category" className={labelClass}>
                Category
              </label>
              <select
                id="supply-category"
                value={category}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full rounded-lg border border-ast-pink/30 bg-ast-bg-dark/70 px-3 py-2 text-white transition focus:border-ast-pink focus:outline-none focus:ring-2 focus:ring-ast-pink/30"
              >
                {SUPPLY_CATEGORIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {showSubcategory && (
              <div>
                <label htmlFor="supply-subcategory" className={labelClass}>
                  Subcategory
                </label>
                <select
                  id="supply-subcategory"
                  value={subcategoryOptions.some((o) => o.value === subcategory) ? subcategory : SUBCATEGORY_NONE}
                  onChange={(e) => {
                    setSubcategory(e.target.value);
                    setCustomSubcategory("");
                  }}
                  className="w-full rounded-lg border border-ast-pink/30 bg-ast-bg-dark/70 px-3 py-2 text-white transition focus:border-ast-pink focus:outline-none focus:ring-2 focus:ring-ast-pink/30"
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
                    maxLength={60}
                    value={customSubcategory}
                    onChange={(e) => setCustomSubcategory(e.target.value)}
                    placeholder="e.g., Dry brush, Palette knife…"
                    className={`${inputClass} mt-2`}
                  />
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                Stock Status
              </label>
              <select
                id="supply-condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full rounded-lg border border-ast-pink/30 bg-ast-bg-dark/70 px-3 py-2 text-white transition focus:border-ast-pink focus:outline-none focus:ring-2 focus:ring-ast-pink/30"
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
              rows={2}
              maxLength={4000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details about the supply..."
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label htmlFor="supply-barcode" className="mb-2 block text-sm font-semibold text-ast-lavender">
              Barcode / UPC
            </label>
            <input
              id="supply-barcode"
              type="text"
              inputMode="numeric"
              maxLength={120}
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Enter barcode manually"
              className="w-full rounded-lg border border-blue-500/40 bg-black/30 px-3 py-2 text-white transition placeholder:text-white/40 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <div>
            <label htmlFor="supply-project" className={labelClass}>
              Assign to Project
            </label>
            <select
              id="supply-project"
              value={assignedProjectId}
              onChange={(e) => setAssignedProjectId(e.target.value)}
              className="w-full rounded-lg border border-ast-pink/30 bg-ast-bg-dark/70 px-3 py-2 text-white transition focus:border-ast-pink focus:outline-none focus:ring-2 focus:ring-ast-pink/30"
            >
              <option value="">{UNASSIGNED_OPTION_CREATE}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          </div>
          </div>

          {error && (
            <p role="alert" className="px-6 text-sm text-ast-coral">
              {error}
            </p>
          )}

          <div className="flex shrink-0 gap-3 border-t border-white/5 px-6 pb-6 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-ast-yellow/30 bg-transparent px-4 py-2 text-ast-yellow transition hover:bg-ast-yellow/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-lg bg-gradient-to-r from-ast-pink to-ast-purple px-4 py-2 font-semibold text-white shadow-ast-pink transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Saving…" : "Add Supply"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
