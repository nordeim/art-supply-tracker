"use client";

/**
 * StudioApp — the authenticated shell: sticky header, studio-tools sidebar
 * (desktop column / mobile drawer), main view area (dashboard, projects,
 * supplies, inspiration), and the community panel with Studio Chat.
 *
 * Layout contract: lg+ renders the original three fixed-height columns with
 * independent scroll; below lg the page flows naturally with the community
 * panel toggled by the header's "Chat ☰" button (the live app's mobile
 * pattern — the panel is hidden until toggled, not stacked under the view).
 * Projects/supplies state is seeded from the server render and mutated
 * exclusively through Server Actions.
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
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [supplyListNavToken, setSupplyListNavToken] = useState(0);
  const [projectModal, setProjectModal] = useState<
    { mode: "create" } | { mode: "edit"; project: ProjectDto } | null
  >(null);
  const [supplyModal, setSupplyModal] = useState<
    { mode: "create" } | { mode: "edit"; supply: SupplyDto } | null
  >(null);
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
    setImportNotice(null);
    file
      .text()
      .then((text) => {
        let payload: unknown;
        try {
          payload = JSON.parse(text);
        } catch {
          setImportNotice("That file is not valid JSON.");
          return;
        }
        startTransition(async () => {
          const result = await importStudioData(payload);
          if (!result.ok) {
            setImportNotice(result.error.message);
            return;
          }
          // Re-read both lists so the UI reflects exactly what was stored.
          const [projectsResult, suppliesResult] = await Promise.all([
            (await import("@/actions/studio")).listProjects(),
            (await import("@/actions/studio")).listSupplies(),
          ]);
          if (projectsResult.ok) setProjectList(projectsResult.data);
          if (suppliesResult.ok) setSupplyList(suppliesResult.data);
          setImportNotice(
            `Import successful — ${result.data.projects} project(s), ${result.data.supplies} suppl(y/ies).`,
          );
        });
      })
      .catch(() => setImportNotice("Could not read that file."));
  }

  function handleSupplySaved(supply: SupplyDto, isEdit: boolean) {
    setSupplyList((list) =>
      isEdit ? list.map((s) => (s.id === supply.id ? supply : s)) : [supply, ...list],
    );
    setSupplyModal(null);
    if (!isEdit) {
      // The live app navigates to the supplies list after creating one.
      setView("supplies");
      setSupplyListNavToken((token) => token + 1);
    }
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

  const sidebarProps = {
    stats,
    navigate,
    currentView: view,
    projects: projectList,
    inspiration,
    onNewProject: () => {
      setSidebarOpen(false);
      setProjectModal({ mode: "create" });
    },
    onCloseSidebar: () => setSidebarOpen(false),
    sidebarOpen,
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#050009] text-white md:h-screen md:overflow-hidden">
      <StudioHeader
        email={user.email}
        memoryOpen={memoryOpen}
        onToggleMemory={() => setMemoryOpen((v) => !v)}
        onCloseMemory={() => setMemoryOpen(false)}
        memoryText={user.lastWorkedOn}
        onSignOut={handleSignOut}
        onOpenSidebar={() => setSidebarOpen(true)}
        chatPanelOpen={chatPanelOpen}
        onToggleChatPanel={() => setChatPanelOpen((v) => !v)}
      />

      <div className="flex flex-1 flex-col md:flex-row md:overflow-hidden">
        <StudioSidebar {...sidebarProps} />

        <div className="min-w-0 flex-1 px-4 pb-10 pt-6 md:overflow-y-auto scrollbar-studio md:px-8">
          {importNotice && (
            <p
              role="status"
              className="mb-4 rounded-xl border border-ast-turquoise/40 bg-ast-turquoise/10 px-4 py-2.5 text-sm text-ast-turquoise"
            >
              {importNotice}
            </p>
          )}

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
              onNewProject={() => setProjectModal({ mode: "create" })}
              onEditProject={(project) => setProjectModal({ mode: "edit", project })}
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
              onNewSupply={() => setSupplyModal({ mode: "create" })}
              onEditSupply={(supply) => setSupplyModal({ mode: "edit", supply })}
              initialSubView={supplyListNavToken > 0 ? "list" : "grid"}
              onSupplyDeleted={handleSupplyDeleted}
            />
          )}
          {view === "inspiration" && <InspirationView inspiration={inspiration} />}

          {/* Mobile community panel — toggled by the header's Chat ☰ button. */}
          {chatPanelOpen && (
            <div className="mt-6 lg:hidden">
              <CommunityContent messages={chatMessages} memoryText={user.lastWorkedOn} />
            </div>
          )}
        </div>

        <aside className="hidden w-80 shrink-0 overflow-y-auto scrollbar-studio px-4 pb-10 pt-6 lg:block">
          <CommunityContent messages={chatMessages} memoryText={user.lastWorkedOn} />
        </aside>
      </div>

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
          initial={projectModal.mode === "edit" ? projectModal.project : null}
          onClose={() => setProjectModal(null)}
          onSaved={(saved, isEdit) => {
            setProjectList((list) =>
              isEdit
                ? list.map((p) => (p.id === saved.id ? saved : p))
                : [saved, ...list],
            );
            setProjectModal(null);
          }}
        />
      )}

      {supplyModal && (
        <SupplyModal
          initial={supplyModal.mode === "edit" ? supplyModal.supply : null}
          projects={projectList}
          onClose={() => setSupplyModal(null)}
          onSaved={handleSupplySaved}
        />
      )}
    </main>
  );
}

function StudioHeader({
  email,
  memoryOpen,
  onToggleMemory,
  onCloseMemory,
  memoryText,
  onSignOut,
  onOpenSidebar,
  chatPanelOpen,
  onToggleChatPanel,
}: {
  email: string;
  memoryOpen: boolean;
  onToggleMemory: () => void;
  onCloseMemory: () => void;
  memoryText: string;
  onSignOut: () => void;
  onOpenSidebar: () => void;
  chatPanelOpen: boolean;
  onToggleChatPanel: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 shrink-0 bg-[#050009]/90 px-4 py-4 backdrop-blur-xl md:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-fit items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Open studio tools"
            className="rounded-xl border border-ast-purple/30 bg-white/5 p-2 text-ast-lavender transition hover:border-ast-turquoise/50 hover:text-ast-turquoise md:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path
                d="M2 4.5h14M2 9h14M2 13.5h14"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <Image
            src="/assets/ast_logo_horizontal_cropped.png"
            alt="ArtSupplyTracker"
            width={320}
            height={56}
            priority
            style={{ height: "auto", width: "auto", maxWidth: "320px" }}
            className="h-10 object-contain md:h-12 lg:h-14"
          />
        </div>
        <div className="relative flex min-w-fit items-center gap-2 md:gap-3">
          <button
            type="button"
            onClick={onToggleMemory}
            aria-expanded={memoryOpen}
            className="flex items-center gap-2 rounded-xl border border-[#5B3FD3]/30 bg-white/5 px-3 py-1.5 text-sm text-pink-300 transition hover:border-[#FFD5A8]/70 hover:bg-[#FFD5A8]/20 hover:text-[#FFD5A8]"
          >
            <span aria-hidden="true">✧</span>
            <span className="hidden sm:inline">What was I working on?</span>
            <span className="sm:hidden">Memory</span>
          </button>
          <span className="hidden bg-gradient-to-r from-cyan-400 via-blue-500 to-pink-500 bg-clip-text text-sm font-medium text-transparent md:inline">
            {email}
          </span>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-xl border border-pink-400/60 px-4 py-2 text-sm text-pink-200 hover:bg-pink-500/20"
          >
            Sign Out
          </button>

          {memoryOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-ast-purple/35 bg-[#120724] p-4 shadow-xl studio-fade">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-ast-lavender">Studio Memory</p>
                <button
                  type="button"
                  onClick={onCloseMemory}
                  aria-label="Close"
                  className="rounded-lg p-1 text-ast-faint transition hover:bg-white/5 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="mt-1 text-xs text-ast-body/70">
                {memoryText ? `You were working on ${memoryText}.` : "Nothing tracked yet — open a workspace to start."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile chat toggle — the live app's "Chat ☰" header control. */}
      <div className="mt-3 flex justify-end lg:hidden">
        <button
          type="button"
          onClick={onToggleChatPanel}
          aria-expanded={chatPanelOpen}
          className="flex items-center gap-1.5 rounded-xl border border-ast-pink/30 bg-[#120724] px-3 py-2 text-xs font-semibold text-ast-pink transition hover:border-ast-pink/60"
        >
          {chatPanelOpen ? "✕ Close" : "Chat ☰"}
        </button>
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
        <p className="mt-1 text-xs text-ast-body/60 leading-relaxed">
          Ask how to add supplies, track condition, or prep for a show.
        </p>
      </div>
      <StudioChat initialMessages={messages} />
    </div>
  );
}
