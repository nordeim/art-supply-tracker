"use client";

/**
 * Project edit panel — the live app's INLINE edit form, rendered in the
 * detail-panel slot below the selected chip row (not a centered dialog).
 * Structure extracted verbatim from the deployed bundle: a
 * `mt-3 rounded-2xl border-ast_turquoise/60 bg-ast_deep/95 p-6
 * shadow-astTurquoise` panel with an "Edit Project" + ✕ header and a
 * single-column space-y-4 body (Title, Status, Notes, Budget, Photos).
 * The edit Status select orders Planned first — the opposite of the
 * create modal's In Progress-first order.
 */
import { useState, useTransition } from "react";
import Image from "next/image";

import { updateProject } from "@/actions/studio";
import type { ProjectDto } from "@/lib/dto";
import { PROJECT_STATUSES, budgetEditValue, budgetFromEditInput } from "@/lib/studio-domain";
import { fileToDataUrl } from "@/components/studio/photo-data-url";

interface ProjectEditPanelProps {
  project: ProjectDto;
  onCancel: () => void;
  onSaved: (project: ProjectDto) => void;
}

export function ProjectEditPanel({ project, onCancel, onSaved }: ProjectEditPanelProps) {
  const [name, setName] = useState(project.name);
  const [status, setStatus] = useState(project.status);
  const [notes, setNotes] = useState(project.notes ?? "");
  const [budget, setBudget] = useState(budgetEditValue(project.budget));
  const [photos, setPhotos] = useState<string[]>(project.photos);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
    const budgetValue = budgetFromEditInput(budget);

    startTransition(async () => {
      const result = await updateProject(project.id, {
        name: name.trim(),
        status,
        budget: budgetValue ?? undefined,
        notes: notes.trim() || undefined,
        photos: photos.length > 0 ? photos : undefined,
      });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      onSaved(result.data);
    });
  }

  const inputClass =
    "w-full rounded-lg border border-ast-turquoise/30 bg-ast-bg-dark/70 px-3 py-2 text-white transition placeholder:text-white/40 focus:border-ast-turquoise focus:outline-none focus:ring-2 focus:ring-ast-turquoise/30";
  const labelClass = "mb-2 block text-sm font-medium text-ast-lavender";

  return (
    <section
      aria-label={`Edit project ${project.name}`}
      className="mt-3 rounded-2xl border border-ast-turquoise/60 bg-ast-deep/95 p-6 shadow-ast-turquoise"
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ast-turquoise">Edit Project</h2>
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
        <div>
          <label htmlFor="edit-project-name" className={labelClass}>
            Project Title
          </label>
          <input
            id="edit-project-name"
            type="text"
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="edit-project-status" className={labelClass}>
            Status
          </label>
          <select
            id="edit-project-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputClass}
          >
            {PROJECT_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="edit-project-notes" className={labelClass}>
            Notes
          </label>
          <textarea
            id="edit-project-notes"
            rows={3}
            maxLength={4000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={`${inputClass} resize-none`}
          />
        </div>
        <div>
          <label htmlFor="edit-project-budget" className={labelClass}>
            Estimated Budget
          </label>
          <input
            id="edit-project-budget"
            type="number"
            min={0}
            step="0.01"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <span className={labelClass}>Photos</span>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-ast-turquoise/30 bg-ast-bg-dark/70 px-3 py-2 text-sm text-ast-muted transition hover:border-ast-turquoise/60 hover:text-ast-body">
            Add photos
            <input
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
                    className="h-16 w-16 rounded-lg border border-ast-turquoise/30 object-cover"
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
          <p role="alert" className="rounded-lg border border-ast-turquoise/50 bg-ast-turquoise/10 px-3 py-2 text-sm text-ast-turquoise">
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
            className="flex-1 rounded-lg bg-gradient-to-r from-ast-turquoise to-ast-blue px-4 py-2 font-semibold text-white shadow-ast-turquoise transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </section>
  );
}
