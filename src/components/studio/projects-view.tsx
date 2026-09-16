"use client";

/**
 * Projects view — "PROJECTS / Projects": utility row (Import JSON, Export
 * Data, + New Project), the All Projects / Series / Groups grouping tiles,
 * and the status tiles (Planned, In Progress, On Hold, Completed, Needs
 * Sorting) — all clickable, mirroring the live app. Tiles navigate to
 * breadcrumb sub-views ("Projects › Planned") that filter the project list;
 * Series / Groups show the live app's "coming soon" copy. Project chips
 * open the project detail panel (with supply assignment and delete),
 * matching the live app's interaction model.
 */
import { useMemo, useState } from "react";

import type { ProjectDto, SupplyDto } from "@/lib/dto";
import {
  PROJECT_STATUSES,
  projectStatusLabel,
} from "@/lib/studio-domain";
import { ProjectDetailPanel } from "@/components/studio/project-detail-panel";
import { NewBadge } from "@/components/studio/supply-detail-panel";

interface ProjectsViewProps {
  projects: ProjectDto[];
  supplies: SupplyDto[];
  onExport: () => void;
  onImportClick: () => void;
  onNewProject: () => void;
  onEditProject: (project: ProjectDto) => void;
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
  onEditProject,
  onProjectDeleted,
  onSupplyAssignmentChanged,
}: ProjectsViewProps) {
  const [subView, setSubView] = useState<ProjectsSubView | null>(null);
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);

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

  function tileClass() {
    return "rounded-2xl border border-ast-purple/30 bg-[#120724] p-5 text-left transition hover:border-ast-purple/50";
  }

  return (
    <div className="studio-fade">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-ast-lavender">Projects</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Projects</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onImportClick}
            className="rounded-lg border border-ast-blue/50 px-3.5 py-2 text-xs font-medium text-ast-cyan transition hover:bg-ast-blue/20"
          >
            Import JSON
          </button>
          <button
            type="button"
            onClick={onExport}
            className="rounded-lg border border-ast-blue/50 px-3.5 py-2 text-xs font-medium text-ast-cyan transition hover:bg-ast-blue/20"
          >
            Export Data
          </button>
          <button
            type="button"
            onClick={onNewProject}
            className="rounded-lg bg-gradient-to-r from-ast-turquoise to-ast-blue px-3.5 py-2 text-xs font-semibold text-white transition hover:opacity-90"
          >
            + New Project
          </button>
        </div>
      </div>

      {subView === null && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <button type="button" onClick={() => setSubView({ kind: "all" })} className={tileClass()}>
              <p className="text-xs uppercase tracking-widest text-ast-lavender">
                All Projects
              </p>
              <p className="mt-2 text-2xl font-bold text-white">{projects.length}</p>
              <p className="mt-1 text-xs text-ast-faint">
                {projects.length === 1 ? "project" : "projects"} in your studio
              </p>
            </button>

            <button type="button" onClick={() => setSubView({ kind: "series" })} className={tileClass()}>
              <p className="text-xs uppercase tracking-widest text-ast-lavender">Series</p>
              <p className="mt-3 text-xs leading-relaxed text-ast-body/60">
                Bodies of work, studies, collections &amp; themes
              </p>
            </button>

            <button type="button" onClick={() => setSubView({ kind: "groups" })} className={tileClass()}>
              <p className="text-xs uppercase tracking-widest text-ast-lavender">Groups</p>
              <p className="mt-3 text-xs leading-relaxed text-ast-body/60">
                Shows, collectors, grants, &amp; working collections
              </p>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {PROJECT_STATUSES.map((status) => {
              const count = byStatus.groups.get(status.value)?.length ?? 0;
              return (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => setSubView({ kind: "status", status: status.value })}
                  className={tileClass()}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-ast-lavender">
                    {status.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-white">{count}</p>
                  <p className="mt-1 text-[11px] text-ast-faint">
                    {count === 1 ? "project" : "projects"}
                  </p>
                </button>
              );
            })}
            <button type="button" onClick={() => setSubView({ kind: "unsorted" })} className={tileClass()}>
              <p className="text-xs font-semibold uppercase tracking-widest text-ast-coral">
                Needs Sorting
              </p>
              <p className="mt-2 text-2xl font-bold text-white">{byStatus.unsorted.length}</p>
              <p className="mt-1 text-[11px] text-ast-faint">
                Projects with missing or unrecognized status
              </p>
            </button>
          </div>
        </>
      )}

      {subView !== null && (
        <ProjectsSubViewPanel
          subView={subView}
          projects={projects}
          supplies={supplies}
          byStatus={byStatus}
          openProjectId={openProjectId}
          onOpenProject={(id) => setOpenProjectId((current) => (current === id ? null : id))}
          onBack={() => {
            setSubView(null);
            setOpenProjectId(null);
          }}
          onEditProject={onEditProject}
          openProject={openProject}
          onCloseProject={() => setOpenProjectId(null)}
          onProjectDeleted={(id) => {
            onProjectDeleted(id);
            setOpenProjectId(null);
          }}
          onSupplyAssignmentChanged={onSupplyAssignmentChanged}
        />
      )}
    </div>
  );
}

function ProjectsSubViewPanel({
  subView,
  projects,
  supplies,
  byStatus,
  openProjectId,
  onOpenProject,
  onBack,
  onEditProject,
  openProject,
  onCloseProject,
  onProjectDeleted,
  onSupplyAssignmentChanged,
}: {
  subView: ProjectsSubView;
  projects: ProjectDto[];
  supplies: SupplyDto[];
  byStatus: { groups: Map<string, ProjectDto[]>; unsorted: ProjectDto[] };
  openProjectId: string | null;
  onOpenProject: (id: string) => void;
  onBack: () => void;
  onEditProject: (project: ProjectDto) => void;
  openProject: ProjectDto | null;
  onCloseProject: () => void;
  onProjectDeleted: (projectId: string) => void;
  onSupplyAssignmentChanged: (supply: SupplyDto) => void;
}) {
  const meta = subViewMeta(subView);
  const items = subViewItems(subView, projects, byStatus);

  return (
    <section className="studio-fade">
      <nav aria-label="Projects breadcrumb" className="mb-4 flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg px-2 py-1 text-ast-cyan transition hover:bg-white/5"
        >
          Projects
        </button>
        <span aria-hidden="true" className="text-ast-faint">›</span>
        <span className="text-ast-body/80">{meta.label}</span>
      </nav>

      {subView.kind === "series" || subView.kind === "groups" ? (
        <div className="rounded-2xl border border-ast-purple/30 bg-[#120724] p-5">
          <p className="text-sm font-semibold text-ast-lavender">{meta.label}</p>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ast-body/70">
            {subView.kind === "series" ? SERIES_COPY : GROUPS_COPY}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm font-semibold text-white">
            {items.length} {items.length === 1 ? "PROJECT" : "PROJECTS"}
            {subView.kind !== "all" ? ` · ${meta.label.toUpperCase()}` : ""}
          </p>
          {items.length === 0 ? (
            <p className="mt-3 text-sm text-ast-faint">No projects here yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {items.map((project) => (
                  <ProjectChip
                    key={project.id}
                    project={project}
                    open={openProjectId === project.id}
                    onOpen={() => onOpenProject(project.id)}
                  />
                ))}
              </div>
              {openProject && (
                <ProjectDetailPanel
                  project={openProject}
                  supplies={supplies}
                  onClose={onCloseProject}
                  onEdit={onEditProject}
                  onDeleted={onProjectDeleted}
                  onSupplyAssignmentChanged={onSupplyAssignmentChanged}
                />
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}

function subViewMeta(subView: ProjectsSubView): { label: string } {
  switch (subView.kind) {
    case "all":
      return { label: "All Projects" };
    case "series":
      return { label: "Series" };
    case "groups":
      return { label: "Groups" };
    case "unsorted":
      return { label: "Needs Sorting" };
    case "status":
      return { label: projectStatusLabel(subView.status) };
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
      className={`relative rounded-2xl border p-4 text-left transition ${
        open
          ? "border-ast-electric-blue/70 bg-ast-electric-blue/15 shadow-ast-blue"
          : "border-ast-purple/25 bg-[#120724] hover:border-ast-purple/50"
      }`}
    >
      <NewBadge createdAt={project.createdAt} />
      <div className="mb-2 flex min-w-0 items-start gap-2">
        <p className="min-w-0 flex-1 truncate pr-10 text-sm font-semibold leading-snug text-ast-cyan">
          {project.name}
        </p>
      </div>
      <span className="rounded-full bg-ast-electric-blue/20 px-2 py-0.5 text-xs font-medium text-ast-electric-blue">
        {projectStatusLabel(project.status)}
      </span>
    </button>
  );
}
