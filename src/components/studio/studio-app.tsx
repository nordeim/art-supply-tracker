"use client";

/**
 * StudioApp — the authenticated shell: sticky header, studio-tools sidebar
 * (desktop column / mobile drawer), main view area (dashboard, projects,
 * supplies, inspiration), and the community panel with Studio Chat.
 *
 * Layout contract (mirrors the live app): md+ renders the three glass cards
 * in a 12-column grid — sidebar col-span-3 (turquoise border), main
 * col-span-7 (purple border), chat col-span-2 (pink border), each
 * rounded-3xl on the blurred #0B0018 canvas with internal scrolling. Below
 * md the main card carries the "☰ Studio Tools" / "Chat ☰" toggle bar and
 * the sidebar + chat render as fixed slide-in drawers. Projects/supplies
 * state is seeded from the server render and mutated exclusively through
 * Server Actions.
 */
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { signOutAction } from "@/actions/auth";
import { importStudioData } from "@/actions/studio";
import { buildExportPayload } from "@/lib/export-payload";
import type {
  ChatMessageDto,
  InspirationEntryDto,
  ProjectDto,
  SupplyDto,
  UserDto,
} from "@/lib/dto";
import { StudioSidebar } from "@/components/studio/studio-sidebar";
import { StudioChat } from "@/components/studio/studio-chat";
import { DashboardView } from "@/components/studio/dashboard-view";
import { ProjectsView } from "@/components/studio/projects-view";
import { SuppliesView } from "@/components/studio/supplies-view";
import { InspirationView } from "@/components/studio/inspiration-view";
import { ProjectModal } from "@/components/studio/project-modal";
import { SupplyModal } from "@/components/studio/supply-modal";

export type StudioView = "dashboard" | "projects" | "supplies" | "inspiration";

interface StudioAppProps {
  user: UserDto;
  projects: ProjectDto[];
  supplies: SupplyDto[];
  chatMessages: ChatMessageDto[];
  inspiration: InspirationEntryDto[];
}

export function StudioApp({
  user,
  projects,
  supplies,
  chatMessages,
  inspiration,
}: StudioAppProps) {
  const router = useRouter();
  const [view, setView] = useState<StudioView>("dashboard");
  const [projectList, setProjectList] = useState(projects);
  const [supplyList, setSupplyList] = useState(supplies);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatPanelOpen, setChatPanelOpen] = useState(false);
  const [supplyListNavToken, setSupplyListNavToken] = useState(0);
  const [projectModal, setProjectModal] = useState(false);
  const [supplyModal, setSupplyModal] = useState(false);
  const [, startTransition] = useTransition();
  const importInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    // "Active" mirrors the live app: only In Progress projects count
    // (a planned-only studio reports "0 active").
    const active = projectList.filter((p) => p.status === "in-progress").length;
    const low = supplyList.filter(
      (s) => s.condition === "low" || s.condition === "critical",
    ).length;
    return {
      projects: projectList.length,
      active,
      supplies: supplyList.length,
      low,
      inspo: inspiration.length,
    };
  }, [projectList, supplyList, inspiration]);

  const navigate = useCallback((next: StudioView) => {
    setView(next);
    setSidebarOpen(false);
    setChatPanelOpen(false);
  }, []);

  function handleSignOut() {
    startTransition(async () => {
      await signOutAction();
      router.refresh();
    });
  }

  function handleExport() {
    const payload = buildExportPayload(projectList, supplyList);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ast-studio-export-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(file: File) {
    // The live app reports import outcomes through native alerts with this
    // exact copy — the clone keeps the same feedback channel.
    file
      .text()
      .then((text) => {
        let payload: unknown;
        try {
          payload = JSON.parse(text);
        } catch {
          window.alert("Invalid JSON file. Import cancelled.");
          return;
        }
        startTransition(async () => {
          const result = await importStudioData(payload);
          if (!result.ok) {
            window.alert(result.error.message);
            return;
          }
          // Re-read both lists so the UI reflects exactly what was stored.
          const [projectsResult, suppliesResult] = await Promise.all([
            (await import("@/actions/studio")).listProjects(),
            (await import("@/actions/studio")).listSupplies(),
          ]);
          if (projectsResult.ok) setProjectList(projectsResult.data);
          if (suppliesResult.ok) setSupplyList(suppliesResult.data);
          window.alert("Import successful.");
        });
      })
      .catch(() => window.alert("Could not read file. Import cancelled."));
  }

  function handleSupplyCreated(supply: SupplyDto) {
    setSupplyList((list) => [supply, ...list]);
    setSupplyModal(false);
    // The live app navigates to the supplies list after creating one.
    setView("supplies");
    setSupplyListNavToken((token) => token + 1);
  }

  function handleProjectSaved(project: ProjectDto) {
    setProjectList((list) => list.map((p) => (p.id === project.id ? project : p)));
  }

  function handleSupplySaved(supply: SupplyDto) {
    setSupplyList((list) => list.map((s) => (s.id === supply.id ? supply : s)));
  }

  function handleProjectDeleted(projectId: string) {
    setProjectList((list) => list.filter((p) => p.id !== projectId));
    // Supplies assigned to the deleted project revert to studio inventory.
    setSupplyList((list) =>
      list.map((s) => (s.assignedProjectId === projectId ? { ...s, assignedProjectId: null } : s)),
    );
  }

  function handleSupplyDeleted(supplyId: string) {
    setSupplyList((list) => list.filter((s) => s.id !== supplyId));
  }

  const views = (
    <>
      {view === "dashboard" && (
        <DashboardView
          onExport={handleExport}
          onImportClick={() => importInputRef.current?.click()}
        />
      )}
      {view === "projects" && (
        <ProjectsView
          projects={projectList}
          supplies={supplyList}
          onExport={handleExport}
          onImportClick={() => importInputRef.current?.click()}
          onNewProject={() => setProjectModal(true)}
          onProjectSaved={handleProjectSaved}
          onProjectDeleted={handleProjectDeleted}
          onSupplyAssignmentChanged={(supply) =>
            setSupplyList((list) => list.map((s) => (s.id === supply.id ? supply : s)))
          }
        />
      )}
      {view === "supplies" && (
        <SuppliesView
          key={supplyListNavToken}
          supplies={supplyList}
          projects={projectList}
          onExport={handleExport}
          onImportClick={() => importInputRef.current?.click()}
          onNewSupply={() => setSupplyModal(true)}
          onSupplySaved={handleSupplySaved}
          initialSubView={supplyListNavToken > 0 ? "list" : "grid"}
          onSupplyDeleted={handleSupplyDeleted}
        />
      )}
      {view === "inspiration" && <InspirationView inspiration={inspiration} />}
    </>
  );

  return (
    <main className="flex min-h-screen flex-col overflow-hidden bg-[#050009] text-white md:h-screen">
      <StudioHeader
        email={user.email}
        onSignOut={handleSignOut}
      />

      <div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-12 md:gap-4 md:px-4 md:pb-4">
        <StudioSidebar
          stats={stats}
          navigate={navigate}
          currentView={view}
          projects={projectList}
          inspiration={inspiration}
          onNewProject={() => {
            setSidebarOpen(false);
            setProjectModal(true);
          }}
          onCloseSidebar={() => setSidebarOpen(false)}
          sidebarOpen={sidebarOpen}
        />

        {/* Main card — the purple-bordered glass pane holding the active view.
         * Below md it carries the live app's "☰ Studio Tools / Chat ☰" bar. */}
        <section className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-left mx-4 mb-4 rounded-3xl border border-ast-purple/50 bg-[#0B0018] p-6 backdrop-blur-xl md:col-span-7 md:mx-0 md:mb-0">
          <div className="mb-4 flex justify-between md:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-ast-turquoise/30 bg-[#120724] px-3 py-2 text-xs font-semibold text-ast-turquoise transition hover:border-ast-turquoise/60"
            >
              ☰ Studio Tools
            </button>
            <button
              type="button"
              onClick={() => setChatPanelOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-ast-pink/30 bg-[#120724] px-3 py-2 text-xs font-semibold text-ast-pink transition hover:border-ast-pink/60"
            >
              Chat ☰
            </button>
          </div>

          <div className="studio-fade">{views}</div>
        </section>

        {/* Community column — desktop glass card + mobile slide-in drawer. */}
        <aside className="hidden min-h-0 overflow-hidden rounded-3xl border border-ast-pink/40 bg-[#0B0018] p-4 backdrop-blur-xl md:col-span-2 md:block">
          <CommunityContent messages={chatMessages} memoryText={user.lastWorkedOn} />
        </aside>
      </div>

      {/* Mobile chat drawer — the live app's fixed right panel. */}
      {chatPanelOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setChatPanelOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        aria-label="Community chat"
        aria-hidden={!chatPanelOpen}
        className={`fixed inset-y-0 right-0 z-50 w-4/5 max-w-xs overflow-y-auto scrollbar-right rounded-l-3xl border-l border-ast-pink/40 bg-[#0B0018] p-4 backdrop-blur-xl transition-transform duration-300 md:hidden ${
          chatPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => setChatPanelOpen(false)}
          className="mb-4 text-xs text-ast-pink/60 transition hover:text-ast-pink"
        >
          ✕ Close
        </button>
        <CommunityContent messages={chatMessages} memoryText={user.lastWorkedOn} />
      </aside>

      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleImportFile(file);
          event.target.value = "";
        }}
      />

      {projectModal && (
        <ProjectModal
          onClose={() => setProjectModal(false)}
          onSaved={(saved) => {
            setProjectList((list) => [saved, ...list]);
            setProjectModal(false);
          }}
        />
      )}

      {supplyModal && (
        <SupplyModal
          projects={projectList}
          onClose={() => setSupplyModal(false)}
          onSaved={handleSupplyCreated}
        />
      )}
    </main>
  );
}

function StudioHeader({
  email,
  onSignOut,
}: {
  email: string;
  onSignOut: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 shrink-0 bg-[#050009]/90 px-6 py-4 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-6">
        <div className="min-w-fit">
          <Image
            src="/assets/ast_logo_horizontal_cropped.png"
            alt="ArtSupplyTracker"
            width={320}
            height={56}
            priority
            style={{ height: "auto", width: "auto", maxWidth: "320px" }}
            className="inline h-10 object-contain md:h-12 lg:h-14"
          />
        </div>
        <div className="flex min-w-fit items-center gap-3">
          {/* The live app's header button — presentational in production
           * (the Studio Memory content lives in the chat panel's card). */}
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-ast-purple/30 bg-white/5 px-3 py-1.5 text-sm text-pink-300 transition hover:border-ast-yellow/70 hover:bg-ast-yellow/20 hover:text-ast-yellow"
          >
            <span>✧</span>What was I working on?
          </button>
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-pink-500 bg-clip-text text-sm font-medium text-transparent">
            {email}
          </span>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-xl border border-pink-400/60 px-4 py-2 text-sm text-pink-200 hover:bg-pink-500/20"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}

function CommunityContent({
  messages,
  memoryText,
}: {
  messages: ChatMessageDto[];
  memoryText: string;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-ast-pink">Community</p>
        <h2 className="mt-2 text-lg font-semibold text-[#FF2FB3]">Studio Chat</h2>
      </div>
      <div className="rounded-2xl border border-ast-purple/35 bg-[#120724] p-3">
        <p className="text-sm font-semibold text-ast-lavender">Studio Memory</p>
        <p className="mt-1 text-xs text-ast-body/70">
          {memoryText
            ? `You were working on ${memoryText}.`
            : "Your studio history will appear here."}
        </p>
      </div>
      <div className="rounded-2xl border border-ast-turquoise/30 bg-[#120724] p-3">
        <p className="text-sm font-semibold text-ast-turquoise">Need help?</p>
        <p className="mt-1 text-xs text-ast-body/70">
          Ask how to add supplies, track condition, or prep for a show.
        </p>
      </div>
      <StudioChat initialMessages={messages} />
    </div>
  );
}
