"use client";

/**
 * Projects view — "PROJECTS / Projects": utility row (Import JSON, Export
 * Data, + New Project), the All Projects / Series / Groups grouping cards,
 * and the status columns (Planned, In Progress, On Hold, Completed) plus
 * Needs Sorting for unknown statuses, mirroring the live app.
 */
import { useMemo } from "react";

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

export function ProjectsView({
  projects,
  onExport,
  onImportClick,
  onNewProject,
  onEditProject,
}: ProjectsViewProps) {
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <section className="rounded-2xl border border-ast-purple/30 bg-[#120724] p-5">
          <p className="text-2xl font-bold text-white">{projects.length}</p>
          <p className="mt-1 text-xs uppercase tracking-widest text-ast-lavender">
            All Projects
          </p>
          <p className="mt-2 text-xs text-ast-faint">
            {projects.length === 1 ? "project" : "projects"} in your studio
          </p>
        </section>

        <section className="rounded-2xl border border-ast-purple/30 bg-[#120724] p-5">
          <p className="text-xs uppercase tracking-widest text-ast-lavender">Series</p>
          <p className="mt-3 text-xs leading-relaxed text-ast-body/60">
            Bodies of work, studies, collections &amp; themes
          </p>
        </section>

        <section className="rounded-2xl border border-ast-purple/30 bg-[#120724] p-5">
          <p className="text-xs uppercase tracking-widest text-ast-lavender">Groups</p>
          <p className="mt-3 text-xs leading-relaxed text-ast-body/60">
            Shows, collectors, grants, &amp; working collections
          </p>
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PROJECT_STATUSES.map((status) => (
          <StatusColumn
            key={status.value}
            title={status.label}
            projects={byStatus.groups.get(status.value) ?? []}
            onEditProject={onEditProject}
          />
        ))}
      </div>

      {byStatus.unsorted.length > 0 && (
        <section className="mt-4 rounded-2xl border border-ast-coral/30 bg-[#120724] p-5">
          <p className="text-xs uppercase tracking-widest text-ast-coral">Needs Sorting</p>
          <p className="mt-1 text-xs text-ast-faint">
            Projects with missing or unrecognized status
          </p>
          <ul className="mt-3 space-y-2">
            {byStatus.unsorted.map((project) => (
              <li key={project.id}>
                <ProjectChip project={project} onEditProject={onEditProject} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatusColumn({
  title,
  projects,
  onEditProject,
}: {
  title: string;
  projects: ProjectDto[];
  onEditProject: (project: ProjectDto) => void;
}) {
  return (
    <section className="rounded-2xl border border-ast-purple/25 bg-[#0f0722] p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-ast-lavender">
          {title}
        </p>
        <p className="text-lg font-bold text-white">{projects.length}</p>
      </div>
      <p className="text-[11px] text-ast-faint">projects</p>
      {projects.length > 0 && (
        <ul className="mt-3 space-y-2">
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectChip project={project} onEditProject={onEditProject} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
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
