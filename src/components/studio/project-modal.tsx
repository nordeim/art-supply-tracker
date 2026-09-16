"use client";

/**
 * Project modal — New / Edit Project dialog with name, status select,
 * budget, notes, and photo attachments, cloned from the live app's form.
 * Photos are downscaled client-side to data URLs (≤ 1024px, JPEG q0.8) so
 * uploads work without object storage; the server re-validates bounds.
 */
import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";

import { createProject, updateProject } from "@/actions/studio";
import type { ProjectDto } from "@/lib/dto";
import { PROJECT_STATUSES } from "@/lib/studio-domain";

const MAX_PHOTO_BYTES = 300 * 1024; // 300 KB per encoded photo

// The live app's Status picker orders In Progress first (verified against
// studiobeta.artsupplytracker.com); the tiles keep the Planned-first order.
const STATUS_SELECT_ORDER = ["in-progress", "planned", "on-hold", "completed"] as const;

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

interface ProjectModalProps {
  initial: ProjectDto | null;
  onClose: () => void;
  onSaved: (project: ProjectDto, isEdit: boolean) => void;
}

export function ProjectModal({ initial, onClose, onSaved }: ProjectModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [status, setStatus] = useState(initial?.status ?? "planned");
  const [budget, setBudget] = useState(
    typeof initial?.budget === "number" ? String(initial.budget) : "",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const isEdit = initial !== null;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    // Focus the first field on open for keyboard users.
    dialogRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function onAddPhotos(files: FileList | null) {
    if (!files) return;
    setError(null);
    Array.from(files)
      .slice(0, 10 - photos.length)
      .forEach((file) => {
        if (!file.type.startsWith("image/")) return;
        fileToDataUrl(file)
          .then((dataUrl) => setPhotos((list) => [...list, dataUrl]))
          .catch((reason: unknown) =>
            setError(reason instanceof Error ? reason.message : "Could not read that image."),
          );
      });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }
    const budgetValue = budget.trim() === "" ? undefined : Number(budget);
    if (budgetValue !== undefined && (!Number.isFinite(budgetValue) || budgetValue < 0)) {
      setError("Budget must be a positive number.");
      return;
    }

    const payload = {
      name: name.trim(),
      status,
      budget: budgetValue,
      notes: notes.trim() || undefined,
      photos: photos.length > 0 ? photos : undefined,
    };

    startTransition(async () => {
      const result = isEdit
        ? await updateProject(initial.id, payload)
        : await createProject(payload);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      onSaved(result.data, isEdit);
    });
  }

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
        aria-labelledby="project-modal-title"
        className="w-full max-w-lg rounded-2xl border border-ast-purple/35 bg-[#120724] p-6 shadow-2xl studio-fade max-h-[90vh] overflow-y-auto scrollbar-studio"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="project-modal-title" className="text-lg font-bold text-white">
            {isEdit ? "Edit Project" : "New Project"}
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
            <label htmlFor="project-name" className="mb-1.5 block text-sm font-medium text-ast-lavender">
              Project Title <span aria-hidden="true">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer Exhibition Series"
              className="w-full rounded-xl border border-ast-purple/40 bg-[#0B0018] px-3.5 py-2.5 text-sm text-white placeholder:text-ast-faint focus:border-ast-cyan/60 focus:outline-none focus:ring-2 focus:ring-ast-cyan/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="project-status" className="mb-1.5 block text-sm font-medium text-ast-lavender">
                Status
              </label>
              <select
                id="project-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-ast-purple/40 bg-[#0B0018] px-3.5 py-2.5 text-sm text-white focus:border-ast-cyan/60 focus:outline-none"
              >
                {STATUS_SELECT_ORDER.map((value) => {
                  const option = PROJECT_STATUSES.find((s) => s.value === value);
                  if (!option) return null;
                  return (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label htmlFor="project-budget" className="mb-1.5 block text-sm font-medium text-ast-lavender">
                Estimated Budget
              </label>
              <input
                id="project-budget"
                type="number"
                min={0}
                step="0.01"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g., 150"
                className="w-full rounded-xl border border-ast-purple/40 bg-[#0B0018] px-3.5 py-2.5 text-sm text-white placeholder:text-ast-faint focus:border-ast-cyan/60 focus:outline-none focus:ring-2 focus:ring-ast-cyan/30"
              />
            </div>
          </div>

          <div>
            <label htmlFor="project-notes" className="mb-1.5 block text-sm font-medium text-ast-lavender">
              Notes
            </label>
            <textarea
              id="project-notes"
              rows={4}
              maxLength={4000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add project details, goals, or inspiration..."
              className="w-full resize-none rounded-xl border border-ast-purple/40 bg-[#0B0018] px-3.5 py-2.5 text-sm text-white placeholder:text-ast-faint focus:border-ast-cyan/60 focus:outline-none focus:ring-2 focus:ring-ast-cyan/30"
            />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-ast-lavender">Photos</span>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-ast-purple/40 bg-[#0B0018] px-4 py-2.5 text-sm text-ast-faint transition hover:border-ast-cyan/50 hover:text-ast-body">
              📷 Add photos
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  onAddPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            {photos.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {photos.map((photo, index) => (
                  <li key={index} className="relative">
                    <Image
                      src={photo}
                      alt={`Project photo ${index + 1}`}
                      width={64}
                      height={64}
                      unoptimized
                      className="h-16 w-16 rounded-lg border border-ast-purple/40 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotos((list) => list.filter((_, i) => i !== index))}
                      aria-label={`Remove photo ${index + 1}`}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ast-coral text-[10px] font-bold text-white"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
              {pending ? "Saving…" : isEdit ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
