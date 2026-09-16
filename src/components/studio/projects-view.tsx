"use client";

/**
 * Projects view — "PROJECTS / Projects": utility row (Import JSON, Export
 * Data, + New Project), the All Projects / Series / Groups grouping tiles,
 * and the status tiles (Planned, In Progress, On Hold, Completed, Needs
 * Sorting) — all clickable, mirroring the live app. Tiles navigate to
 * breadcrumb sub-views ("Projects › Planned") that filter the project list;
 * Series / Groups show the live app's "coming soon" copy.
 */
import { useMemo, useState } from "react";

import type { ProjectDto } from "@/lib/dto";
import {
  PROJECT_STATUSES,
  projectStatusLabel,
} from "@/lib/studio-domain";

interface ProjectsViewProps {
  projects: ProjectDto[];
  onExport: () => void;
  onImportClick: () => void;
  onNewProject: () => void;
  onEditProject: (project: ProjectDto) => void;
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
  onExport,
  onImportClick,
  onNewProject,
  onEditProject,
}: ProjectsViewProps) {
  const [subView, setSubView] = useState<ProjectsSubView | null>(null);

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
            {PROJECT_STATUSES.map((status) => (
              <button
                key={status.value}
                type="button"
                onClick={() => setSubView({ kind: "status", status: status.value })}
                className={tileClass()}
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-ast-lavender">
                  {status.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {byStatus.groups.get(status.value)?.length ?? 0}
                </p>
                <p className="mt-1 text-[11px] text-ast-faint">projects</p>
              </button>
            ))}
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
          byStatus={byStatus}
          onBack={() => setSubView(null)}
          onEditProject={onEditProject}
        />
      )}
    </div>
  );
}

function ProjectsSubViewPanel({
  subView,
  projects,
  byStatus,
  onBack,
  onEditProject,
}: {
  subView: ProjectsSubView;
  projects: ProjectDto[];
  byStatus: { groups: Map<string, ProjectDto[]>; unsorted: ProjectDto[] };
  onBack: () => void;
  onEditProject: (project: ProjectDto) => void;
}) {
  const meta = subViewMeta(subView);
  const items = subViewItems(subView, projects, byStatus);

  return (
    <section className="rounded-2xl border border-ast-purple/30 bg-[#120724] p-5 studio-fade">
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
        <div>
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
            <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {items.map((project) => (
                <li key={project.id}>
                  <ProjectChip project={project} onEditProject={onEditProject} />
                </li>
              ))}
            </ul>
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

function ProjectChip({
  project,
  onEditProject,
}: {
  project: ProjectDto;
  onEditProject: (project: ProjectDto) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onEditProject(project)}
      className="w-full rounded-xl border border-ast-purple/25 bg-[#161030] p-3 text-left transition hover:border-ast-purple/50"
    >
      <p className="truncate text-sm font-medium text-ast-body">{project.name}</p>
      <p className="mt-0.5 text-[11px] text-ast-faint">
        {projectStatusLabel(project.status)}
        {typeof project.budget === "number" ? ` · ${project.budget.toFixed(2)}` : ""}
      </p>
    </button>
  );
}
