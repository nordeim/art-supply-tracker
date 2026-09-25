"use client";

/**
 * Project detail panel — the card that opens when a project chip is clicked
 * (mirrors the live app): PROJECT eyebrow, title + NEW badge, status pill,
 * image (photo or the live app's decorative sketch placeholder), extra
 * image gallery, Notes, Budget (only when set), the Supplies assignment
 * section ("Pick supply…" select + Assign, assigned list with × remove),
 * Delete (native confirm, exact live copy), and Edit Project.
 *
 * Classes mirror the live app's panel: rounded-2xl border-ast_turquoise/60
 * bg-ast_deep/95 p-6 shadow-astTurquoise.
 */
import { useState, useTransition } from "react";
import Image from "next/image";

import { deleteProject, setSupplyAssignment } from "@/actions/studio";
import type { ProjectDto, SupplyDto } from "@/lib/dto";
import { isNewItem, projectStatusPillClasses, projectStatusLabel } from "@/lib/studio-domain";

interface ProjectDetailPanelProps {
  project: ProjectDto;
  supplies: SupplyDto[];
  onClose: () => void;
  onEdit: (project: ProjectDto) => void;
  onDeleted: (projectId: string) => void;
  onSupplyAssignmentChanged: (supply: SupplyDto) => void;
}

export function ProjectDetailPanel({
  project,
  supplies,
  onClose,
  onEdit,
  onDeleted,
  onSupplyAssignmentChanged,
}: ProjectDetailPanelProps) {
  const [pending, startTransition] = useTransition();
  const [pickedSupplyId, setPickedSupplyId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const assigned = supplies.filter((s) => s.assignedProjectId === project.id);
  const unassigned = supplies.filter((s) => s.assignedProjectId !== project.id);

  function onAssign() {
    if (!pickedSupplyId) return;
    setError(null);
    const supplyId = pickedSupplyId;
    startTransition(async () => {
      const result = await setSupplyAssignment(supplyId, project.id);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setPickedSupplyId("");
      onSupplyAssignmentChanged(result.data);
    });
  }

  function onRemoveSupply(supplyId: string) {
    setError(null);
    startTransition(async () => {
      const result = await setSupplyAssignment(supplyId, null);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      onSupplyAssignmentChanged(result.data);
    });
  }

  function onDelete() {
    // Native confirm with the live app's exact copy.
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      onDeleted(project.id);
    });
  }

  return (
    <section
      aria-label={`Project details for ${project.name}`}
      className="mt-3 rounded-2xl border border-ast-turquoise/60 bg-ast-deep/95 p-6 shadow-ast-turquoise"
    >
      <div className="mb-4 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs uppercase tracking-wider text-ast-turquoise">Project</p>
          <h2 className="text-lg font-bold text-ast-cyan">
            {project.name}
            {isNewItem(project.createdAt) && (
              <span className="ml-2 rounded-full bg-ast-turquoise/40 px-2 py-0.5 align-middle text-xs font-semibold text-ast-turquoise">
                NEW
              </span>
            )}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${projectStatusPillClasses(
                project.status,
              )}`}
            >
              {projectStatusLabel(project.status)}
            </span>
          </div>
        </div>
        <ImagePlaceholder photo={project.photos[0] ?? null} name={project.name} />
      </div>

      {project.photos.length > 1 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-ast-lavender">
            Images ({project.photos.length})
          </p>
          <div className="grid grid-cols-5 gap-2">
            {project.photos.map((photo, index) => (
              <Image
                key={index}
                src={photo}
                alt=""
                width={64}
                height={64}
                unoptimized
                className="aspect-square w-full rounded-lg border border-ast-purple/20 object-cover"
              />
            ))}
          </div>
        </div>
      )}

      {project.notes && (
        <div className="mb-4">
          <p className="mb-1 text-xs font-medium text-ast-lavender">Notes</p>
          <p className="text-sm text-ast-body">{project.notes}</p>
        </div>
      )}

      {project.budget !== null && project.budget > 0 && (
        <div className="mb-4">
          <p className="mb-1 text-xs font-medium text-ast-lavender">Budget</p>
          <p className="text-sm text-ast-body">${project.budget}</p>
        </div>
      )}

      <div className="mb-4 border-t border-ast-turquoise/20 pt-4">
        <p className="mb-2 text-xs font-medium text-ast-lavender">Supplies</p>
        {assigned.length > 0 && (
          <ul className="mb-3 space-y-1">
            {assigned.map((supply) => (
              <li
                key={supply.id}
                className="flex items-center justify-between text-sm text-ast-body/75"
              >
                <span>· {supply.name}</span>
                <button
                  type="button"
                  onClick={() => onRemoveSupply(supply.id)}
                  disabled={pending}
                  title="Remove"
                  aria-label={`Remove ${supply.name} from this project`}
                  className="ml-2 shrink-0 text-ast-faint transition hover:text-ast-pink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {pending ? "…" : "×"}
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="mb-2 text-xs text-ast-pink">{error}</p>}
        {unassigned.length === 0 ? (
          <p className="text-xs text-ast-body/50">All supplies assigned</p>
        ) : (
          <div className="flex gap-2">
            <select
              aria-label="Pick supply to assign"
              value={pickedSupplyId}
              onChange={(e) => setPickedSupplyId(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-ast-turquoise/30 bg-ast-bg-dark/70 px-3 py-2 text-sm text-white transition focus:border-ast-turquoise focus:outline-none"
            >
              <option value="">Pick supply…</option>
              {unassigned.map((supply) => (
                <option key={supply.id} value={supply.id}>
                  {supply.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onAssign}
              disabled={pending || pickedSupplyId === ""}
              className="shrink-0 rounded-lg bg-ast-turquoise/20 px-4 py-2 text-sm text-ast-turquoise transition hover:bg-ast-turquoise/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? "Assigning…" : "Assign"}
            </button>
          </div>
        )}
      </div>

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
          onClick={() => onEdit(project)}
          className="flex-1 rounded-lg bg-gradient-to-r from-ast-turquoise to-ast-blue px-4 py-2 text-sm font-semibold text-white shadow-ast-turquoise transition hover:shadow-lg"
        >
          Edit Project
        </button>
      </div>
    </section>
  );
}

/**
 * The live app's 96×96 image well: the project's first photo when present,
 * otherwise a dark gradient with faint rotated accent lines, dots, and the
 * "no image" caption (Pz component in the production bundle).
 */
function ImagePlaceholder({ photo, name }: { photo: string | null; name: string }) {
  if (photo) {
    return (
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-ast-purple/40">
        <Image src={photo} alt={`${name} photo`} fill unoptimized className="object-cover" />
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-ast-purple/40 bg-gradient-to-br from-ast-purple/40 via-ast-blue/20 to-ast-turquoise/20"
    >
      <div className="absolute left-2 top-3 h-px w-14 rotate-12 bg-ast-turquoise/30" />
      <div className="absolute left-1 top-7 h-px w-10 rotate-6 bg-ast-pink/30" />
      <div className="absolute left-4 top-11 h-px w-16 -rotate-3 bg-ast-lavender/25" />
      <div className="absolute left-2 top-14 h-px w-8 rotate-12 bg-ast-turquoise/20" />
      <div className="absolute bottom-5 left-3 h-px w-12 -rotate-6 bg-ast-pink/20" />
      <div className="absolute right-3 top-5 h-1.5 w-1.5 rounded-full bg-ast-yellow/40" />
      <div className="absolute bottom-8 right-4 h-1 w-1 rounded-full bg-ast-turquoise/50" />
      <span className="absolute bottom-1.5 right-1.5 text-[8px] leading-none text-ast-faint">
        no image
      </span>
    </div>
  );
}
