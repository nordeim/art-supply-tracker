"use client";

/**
 * Projects view — "PROJECTS / Projects": utility row (Import JSON, Export
 * Data, + New Project), the All Projects / Series / Groups grouping tiles,
 * and the status tiles (Planned, In Progress, On Hold, Completed, Needs
 * Sorting) — all clickable, mirroring the live app's 4-column tinted tile
 * grid. Tiles navigate to breadcrumb sub-views ("Projects › Planned") that
 * filter the project list; Series / Groups show the live app's "coming
 * soon" copy. Project chips open the project detail panel in place, below
 * the chip's 3-column row — matching the live app's interaction model.
 */
import { useMemo, useState } from "react";

import type { ProjectDto, SupplyDto } from "@/lib/dto";
import {
  PROJECT_STATUSES,
  isNewItem,
  projectChipStatusClasses,
  projectStatusLabel,
  projectStatusPillClasses,
} from "@/lib/studio-domain";
import { ProjectDetailPanel } from "@/components/studio/project-detail-panel";
import { ProjectEditPanel } from "@/components/studio/project-edit-panel";

interface ProjectsViewProps {
  projects: ProjectDto[];
  supplies: SupplyDto[];
  onExport: () => void;
  onImportClick: () => void;
  onNewProject: () => void;
  onProjectSaved: (project: ProjectDto) => void;
  onProjectDeleted: (projectId: string) => void;
  onSupplyAssignmentChanged: (supply: SupplyDto) => void;
}

type ProjectsSubView =
  | { kind: "all" }
  | { kind: "series" }
  | { kind: "groups" }
  | { kind: "status"; status: string }
  | { kind: "unsorted" };

const SERIES_COPY =
  "Series will let you organize bodies of work, studies, or collections. Coming in the next project organization pass.";
const GROUPS_COPY =
  "Groups will let you organize projects for shows, collectors, website updates, grants, or working collections. Coming in the next project organization pass.";

export function ProjectsView({
  projects,
  supplies,
  onExport,
  onImportClick,
  onNewProject,
  onProjectSaved,
  onProjectDeleted,
  onSupplyAssignmentChanged,
}: ProjectsViewProps) {
  const [subView, setSubView] = useState<ProjectsSubView | null>(null);
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  // The live app swaps the detail panel for the inline edit form in place.
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  const byStatus = useMemo(() => {
    const groups = new Map<string, ProjectDto[]>();
    for (const status of PROJECT_STATUSES) groups.set(status.value, []);
    const unsorted: ProjectDto[] = [];
    for (const project of projects) {
      const bucket = groups.get(project.status);
      if (bucket) bucket.push(project);
      else unsorted.push(project);
    }
    return { groups, unsorted };
  }, [projects]);

  const openProject = projects.find((p) => p.id === openProjectId) ?? null;

  return (
    <div className="studio-fade">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-ast-turquoise">Projects</p>
          <h1 className="mt-2 bg-[linear-gradient(90deg,#00E6FF_0%,#2E64FF_35%,#8D5CFF_65%,#FF2FB3_100%)] bg-clip-text text-3xl font-bold text-transparent">
            Projects
          </h1>
          {subView !== null && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-ast-muted">
              <button
                type="button"
                onClick={() => {
                  setSubView(null);
                  setOpenProjectId(null);
                }}
                className="transition hover:text-ast-turquoise"
              >
                Projects
              </button>
              <span aria-hidden="true" className="text-ast-faint">
                ›
              </span>
              <span className="text-ast-turquoise">{subViewLabel(subView)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onImportClick}
            className="rounded-lg border border-ast-turquoise/40 px-3 py-1.5 text-xs text-ast-turquoise transition hover:bg-ast-turquoise/10"
          >
            Import JSON
          </button>
          <button
            type="button"
            onClick={onExport}
            className="rounded-lg border border-ast-turquoise/40 px-3 py-1.5 text-xs text-ast-turquoise transition hover:bg-ast-turquoise/10"
          >
            Export Data
          </button>
          <button
            type="button"
            onClick={onNewProject}
            className="rounded-xl border border-ast-turquoise/40 bg-ast-turquoise/10 px-4 py-2 text-sm font-semibold text-ast-turquoise transition hover:bg-ast-turquoise/20"
          >
            + New Project
          </button>
        </div>
      </div>

      {subView === null ? (
        <ProjectsTileGrid
          projects={projects}
          byStatus={byStatus}
          onOpenSubView={(next) => {
            setSubView(next);
            setOpenProjectId(null);
          }}
        />
      ) : (
        <ProjectsSubViewPanel
          subView={subView}
          projects={projects}
          supplies={supplies}
          byStatus={byStatus}
          openProjectId={openProjectId}
          onOpenProject={(id) => {
            setOpenProjectId((current) => (current === id ? null : id));
            setEditingProjectId(null);
          }}
          editingProjectId={editingProjectId}
          onEditProject={(project) => setEditingProjectId(project.id)}
          onProjectEditClosed={() => setEditingProjectId(null)}
          onProjectSaved={(saved) => {
            onProjectSaved(saved);
            setEditingProjectId(null);
          }}
          openProject={openProject}
          onProjectDeleted={(id) => {
            onProjectDeleted(id);
            setOpenProjectId(null);
            setEditingProjectId(null);
          }}
          onSupplyAssignmentChanged={onSupplyAssignmentChanged}
        />
      )}
    </div>
  );
}

function subViewLabel(subView: ProjectsSubView): string {
  switch (subView.kind) {
    case "all":
      return "All Projects";
    case "series":
      return "Series";
    case "groups":
      return "Groups";
    case "unsorted":
      return "Needs Sorting";
    case "status":
      return projectStatusLabel(subView.status);
  }
}

function subViewItems(
  subView: ProjectsSubView,
  projects: ProjectDto[],
  byStatus: { groups: Map<string, ProjectDto[]>; unsorted: ProjectDto[] },
): ProjectDto[] {
  switch (subView.kind) {
    case "all":
      return projects;
    case "unsorted":
      return byStatus.unsorted;
    case "status":
      return byStatus.groups.get(subView.status) ?? [];
    default:
      return [];
  }
}

/** The live app's 4-column tile grid with per-status tinted cards. */
function ProjectsTileGrid({
  projects,
  byStatus,
  onOpenSubView,
}: {
  projects: ProjectDto[];
  byStatus: { groups: Map<string, ProjectDto[]>; unsorted: ProjectDto[] };
  onOpenSubView: (next: ProjectsSubView) => void;
}) {
  const statusTiles: { value: string; label: string; border: string; title: string; count: string }[] = [
    {
      value: "planned",
      label: "Planned",
      border: "border-ast-electric-blue/30 bg-ast-electric-blue/5 hover:border-ast-electric-blue/60 hover:bg-ast-electric-blue/10",
      title: "text-ast-electric-blue",
      count: "text-ast-electric-blue",
    },
    {
      value: "in-progress",
      label: "In Progress",
      border: "border-ast-cyan/30 bg-ast-cyan/5 hover:border-ast-cyan/60 hover:bg-ast-cyan/10",
      title: "text-ast-cyan",
      count: "text-ast-cyan",
    },
    {
      value: "on-hold",
      label: "On Hold",
      border: "border-ast-yellow/30 bg-ast-yellow/5 hover:border-ast-yellow/60 hover:bg-ast-yellow/10",
      title: "text-ast-yellow",
      count: "text-ast-yellow",
    },
    {
      value: "completed",
      label: "Completed",
      border: "border-ast-lavender/25 bg-ast-lavender/5 hover:border-ast-lavender/45 hover:bg-ast-lavender/10",
      title: "text-ast-lavender",
      count: "text-ast-muted",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      <button
        type="button"
        onClick={() => onOpenSubView({ kind: "all" })}
        className="col-span-4 rounded-2xl border border-ast-turquoise/50 bg-ast-turquoise/10 p-5 text-left transition hover:border-ast-turquoise/80 hover:bg-ast-turquoise/15"
      >
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-ast-turquoise">All Projects</p>
        </div>
        <p className="text-4xl font-bold text-[#00E6FF]">{projects.length}</p>
        <p className="mt-1 text-xs text-ast-body/50">
          {projects.length === 1 ? "project" : "projects"} in your studio
        </p>
      </button>

      <button
        type="button"
        onClick={() => onOpenSubView({ kind: "series" })}
        className="col-span-2 rounded-2xl border border-ast-pink/30 bg-ast-pink/5 p-5 text-left transition hover:border-ast-pink/60 hover:bg-ast-pink/10"
      >
        <p className="mb-2 text-sm font-semibold text-ast-pink">Series</p>
        <p className="text-xs leading-relaxed text-ast-body/50">
          Bodies of work, studies,
          <br />
          collections &amp; themes
        </p>
      </button>

      <button
        type="button"
        onClick={() => onOpenSubView({ kind: "groups" })}
        className="col-span-2 rounded-2xl border border-ast-lavender/30 bg-ast-lavender/5 p-5 text-left transition hover:border-ast-lavender/60 hover:bg-ast-lavender/10"
      >
        <p className="mb-2 text-sm font-semibold text-ast-lavender">Groups</p>
        <p className="text-xs leading-relaxed text-ast-body/50">
          Shows, collectors, grants,
          <br />
          &amp; working collections
        </p>
      </button>

      {statusTiles.map((tile) => {
        const count = byStatus.groups.get(tile.value)?.length ?? 0;
        return (
          <button
            key={tile.value}
            type="button"
            onClick={() => onOpenSubView({ kind: "status", status: tile.value })}
            className={`col-span-1 rounded-2xl border p-5 text-left transition ${tile.border}`}
          >
            <p className={`mb-2 text-sm font-semibold ${tile.title}`}>{tile.label}</p>
            <p className={`text-2xl font-bold ${tile.count}`}>{count}</p>
            <p className="mt-1 text-xs text-ast-body/40">
              {count === 1 ? "project" : "projects"}
            </p>
          </button>
        );
      })}

      <NeedsSortingTile
        count={byStatus.unsorted.length}
        onOpen={() => onOpenSubView({ kind: "unsorted" })}
      />
    </div>
  );
}

function NeedsSortingTile({ count, onOpen }: { count: number; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`col-span-4 rounded-2xl border p-5 text-left transition ${
        count > 0
          ? "border-ast-coral/40 bg-ast-coral/5 hover:border-ast-coral/70 hover:bg-ast-coral/10"
          : "border-white/10 bg-white/5 opacity-50 hover:border-white/20"
      }`}
    >
      <div className="flex items-center justify-between">
        <p
          className={`text-sm font-semibold ${
            count > 0 ? "text-ast-coral" : "text-ast-faint"
          }`}
        >
          Needs Sorting
        </p>
        {count > 0 && (
          <span className="rounded bg-ast-coral/20 px-2 py-0.5 text-xs text-ast-coral">
            {count} {count === 1 ? "project" : "projects"}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-xs text-ast-body/40">
        Projects with missing or unrecognized status
      </p>
    </button>
  );
}

function ProjectsSubViewPanel({
  subView,
  projects,
  supplies,
  byStatus,
  openProjectId,
  onOpenProject,
  editingProjectId,
  onEditProject,
  onProjectEditClosed,
  onProjectSaved,
  openProject,
  onProjectDeleted,
  onSupplyAssignmentChanged,
}: {
  subView: ProjectsSubView;
  projects: ProjectDto[];
  supplies: SupplyDto[];
  byStatus: { groups: Map<string, ProjectDto[]>; unsorted: ProjectDto[] };
  openProjectId: string | null;
  onOpenProject: (id: string) => void;
  editingProjectId: string | null;
  onEditProject: (project: ProjectDto) => void;
  onProjectEditClosed: () => void;
  onProjectSaved: (project: ProjectDto) => void;
  openProject: ProjectDto | null;
  onProjectDeleted: (projectId: string) => void;
  onSupplyAssignmentChanged: (supply: SupplyDto) => void;
}) {
  const items = subViewItems(subView, projects, byStatus);
  // The live app lays chips out in rows of three with the detail panel
  // rendered directly below the selected chip's row.
  const rows: ProjectDto[][] = [];
  for (let i = 0; i < items.length; i += 3) rows.push(items.slice(i, i + 3));

  if (subView.kind === "series" || subView.kind === "groups") {
    const isSeries = subView.kind === "series";
    return (
      <div
        className={`rounded-2xl border p-10 text-center ${
          isSeries ? "border-ast-pink/30 bg-ast-pink/5" : "border-ast-lavender/30 bg-ast-lavender/5"
        }`}
      >
        <p
          className={`mb-3 text-base font-semibold ${
            isSeries ? "text-ast-pink" : "text-ast-lavender"
          }`}
        >
          {isSeries ? "Series" : "Groups"}
        </p>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-ast-body/70">
          {isSeries ? SERIES_COPY : GROUPS_COPY}
        </p>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
        <p className="text-xs uppercase tracking-wider text-ast-faint">
          {items.length} {items.length === 1 ? "project" : "projects"}
          {subView.kind === "status" ? (
            <span> · {projectStatusLabel(subView.status)}</span>
          ) : subView.kind === "unsorted" ? (
            <span> · Needs Sorting</span>
          ) : null}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-ast-body/40">No projects here yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row[0]?.id ?? "empty"}>
              <div className="grid grid-cols-3 gap-3">
                {row.map((project) => (
                  <ProjectChip
                    key={project.id}
                    project={project}
                    open={openProjectId === project.id}
                    onOpen={() => onOpenProject(project.id)}
                  />
                ))}
              </div>
              {openProject && row.some((p) => p.id === openProject.id) && (
                editingProjectId === openProject.id ? (
                  <ProjectEditPanel
                    project={openProject}
                    onCancel={onProjectEditClosed}
                    onSaved={onProjectSaved}
                  />
                ) : (
                  <ProjectDetailPanel
                    project={openProject}
                    supplies={supplies}
                    onClose={() => onOpenProject(openProject.id)}
                    onEdit={onEditProject}
                    onDeleted={onProjectDeleted}
                    onSupplyAssignmentChanged={onSupplyAssignmentChanged}
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

/** Project chip — the live app's card: NEW badge, name, status pill. */
function ProjectChip({
  project,
  open,
  onOpen,
}: {
  project: ProjectDto;
  open: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-expanded={open}
      className={`relative rounded-2xl border p-4 text-left transition ${projectChipStatusClasses(
        project.status,
        open,
      )}`}
    >
      {isNewItem(project.createdAt) && (
        <span className="absolute right-2 top-2 rounded-full bg-ast-turquoise/40 px-2 py-0.5 text-xs font-semibold text-ast-turquoise">
          NEW
        </span>
      )}
      <div className="mb-2 flex min-w-0 items-start gap-2">
        <p
          className={`min-w-0 flex-1 truncate pr-10 text-sm font-semibold leading-snug ${
            open ? "text-ast-cyan" : "text-ast-body"
          }`}
        >
          {project.name}
        </p>
      </div>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${projectStatusPillClasses(
          project.status,
        )}`}
      >
        {projectStatusLabel(project.status)}
      </span>
    </button>
  );
}
