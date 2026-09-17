"use client";

/**
 * Studio sidebar — the "STUDIO TOOLS" column: My Studio shortcut, stat cards
 * (Projects / Supplies / Inspo), Recent Projects, and the Inspiration rail
 * (spotlight, quote of the day, art history, partners).
 *
 * Desktop renders the turquoise-bordered glass card (col-span-3 of the
 * studio grid); below md the same content renders inside a slide-in drawer
 * (classes lifted from the live app: rounded-r-3xl, blurred #0B0018 canvas,
 * turquoise right border). Stat tiles carry the live app's per-tile accent
 * borders, and the active view's tile renders highlighted (electric blue).
 */
import type { InspirationEntryDto, ProjectDto } from "@/lib/dto";
import { pickToday } from "@/lib/inspiration";
import type { StudioView } from "@/components/studio/studio-app";

interface StudioSidebarProps {
  stats: { projects: number; active: number; supplies: number; low: number; inspo: number };
  navigate: (view: StudioView) => void;
  /** The currently active main view — its stat tile renders highlighted. */
  currentView: StudioView;
  projects: ProjectDto[];
  inspiration: InspirationEntryDto[];
  onNewProject: () => void;
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
}

function quoteOfTheDay(inspiration: InspirationEntryDto[]) {
  return (
    inspiration.find((e) => e.type === "artist_quote" && e.author === "Mary Cassatt") ??
    inspiration.find((e) => e.type === "artist_quote")
  );
}

function artHistoryToday(inspiration: InspirationEntryDto[]) {
  // Same contract as the inspiration view: pickToday expects its input
  // sorted ascending by date and returns the most recent on-or-before-today
  // entry (falling back to the earliest upcoming one).
  const entries = inspiration
    .filter((e) => e.type === "art_history" && e.date)
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  return pickToday(entries);
}

export function StudioSidebar(props: StudioSidebarProps) {
  const { onCloseSidebar, sidebarOpen } = props;

  const content = <SidebarContent {...props} />;

  return (
    <>
      {/* Desktop column — the studio grid's turquoise glass card. */}
      <aside className="hidden min-h-0 overflow-y-auto scrollbar-left rounded-3xl border border-ast-turquoise/30 bg-[#0B0018] p-4 backdrop-blur-xl md:col-span-3 md:block">
        {content}
      </aside>

      {/* Mobile drawer — `inert` keeps the closed drawer out of the keyboard
       * tab order (aria-hidden alone leaves focusable children reachable). */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity md:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onCloseSidebar}
        aria-hidden="true"
      />
      <nav
        aria-label="Studio tools"
        aria-hidden={!sidebarOpen}
        inert={!sidebarOpen}
        className={`fixed inset-y-0 left-0 z-50 w-4/5 max-w-xs overflow-y-auto scrollbar-left rounded-r-3xl border-r border-ast-turquoise/30 bg-[#0B0018] p-4 backdrop-blur-xl transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={onCloseSidebar}
          className="mb-4 text-xs text-ast-turquoise/60 transition hover:text-ast-turquoise"
        >
          ✕ Close
        </button>
        {content}
      </nav>
    </>
  );
}

function SidebarContent({
  stats,
  navigate,
  currentView,
  projects,
  inspiration,
  onNewProject,
}: StudioSidebarProps) {
  const quote = quoteOfTheDay(inspiration);
  const history = artHistoryToday(inspiration);
  const spotlight = inspiration.find((e) => e.type === "studio_spotlight" && e.title === "Kim Wyatt");
  const partners = inspiration.find(
    (e) => e.type === "partner" && e.title === "Retailer & Manufacturer Picks",
  );
  // The live rail shows the four most recently touched projects.
  const recent = [...projects]
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
    .slice(0, 4);

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate("dashboard")}
        className="mb-4 w-full text-left transition hover:opacity-75"
      >
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-ast-turquoise">
          Studio Tools
        </p>
        <h2 className="mt-2 text-xl font-semibold text-[#00E6FF]">My Studio</h2>
      </button>

      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-1.5">
          <StatCard
            label="Projects"
            value={stats.projects}
            sub={`${stats.active} active`}
            active={currentView === "projects"}
            labelClass="text-ast-turquoise"
            valueClass="text-[#00E6FF]"
            subClass="text-ast-body/55"
            idleBorder="border-ast-turquoise/30"
            hoverBorder="hover:border-ast-electric-blue/40 hover:bg-ast-electric-blue/5"
            onClick={() => navigate("projects")}
          />
          <StatCard
            label="Supplies"
            value={stats.supplies}
            sub={`${stats.low} low`}
            active={currentView === "supplies"}
            labelClass="text-[#9F6BFF]"
            valueClass="text-[#00E5FF]"
            subClass="text-[#F6B94B]/80"
            idleBorder="border-ast-lavender/30"
            hoverBorder="hover:border-ast-electric-blue/40 hover:bg-ast-electric-blue/5"
            onClick={() => navigate("supplies")}
          />
          <StatCard
            label="Inspo"
            value={stats.inspo}
            sub="entries"
            active={currentView === "inspiration"}
            labelClass="text-ast-lavender"
            valueClass="text-ast-lavender/80"
            subClass="text-ast-body/55"
            idleBorder="border-ast-purple/30"
            hoverBorder="hover:border-ast-lavender/40 hover:bg-ast-lavender/5"
            onClick={() => navigate("inspiration")}
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ast-turquoise">
            Recent Projects
          </p>
          {recent.length === 0 ? (
            <div className="rounded-xl border border-ast-turquoise/15 bg-[#120724] px-4 py-5 text-center">
              <p className="mb-3 text-xs text-ast-body/40">No projects yet</p>
              <button
                type="button"
                onClick={onNewProject}
                className="w-full rounded-lg bg-gradient-to-r from-ast-turquoise to-ast-blue px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
              >
                + Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {recent.map((project) => (
                <RecentProjectTile
                  key={project.id}
                  project={project}
                  onClick={() => navigate("projects")}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ast-lavender">
            Inspiration
          </p>
          <div className="space-y-1.5">
            {spotlight && (
              <button
                type="button"
                onClick={() => navigate("inspiration")}
                className="w-full overflow-hidden rounded-xl border border-ast-purple/30 bg-[#120724] text-left transition hover:border-ast-purple/60"
              >
                <div className="h-9 bg-gradient-to-r from-ast-electric-blue/50 via-ast-purple/50 to-ast-pink/40" />
                <div className="px-3 py-2">
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-ast-faint">
                    Studio Spotlight
                  </p>
                  <p className="text-xs font-semibold text-ast-turquoise">{spotlight.title}</p>
                  <p className="truncate text-[10px] text-ast-muted">{spotlight.body}</p>
                </div>
              </button>
            )}

            {quote && (
              <button
                type="button"
                onClick={() => navigate("inspiration")}
                className="w-full rounded-xl border border-ast-turquoise/20 bg-[#120724] px-3 py-2.5 text-left transition hover:border-ast-turquoise/50"
              >
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ast-turquoise">
                  Quote of the Day
                </p>
                <p className="text-xs italic leading-snug text-ast-body line-clamp-2">
                  &ldquo;{quote.title}&rdquo;
                </p>
                {quote.author && (
                  <p className="mt-1 text-[10px] text-ast-muted">— {quote.author}</p>
                )}
              </button>
            )}

            {history && (
              <button
                type="button"
                onClick={() => navigate("inspiration")}
                className="w-full rounded-xl border border-ast-lavender/20 bg-[#120724] px-3 py-2.5 text-left transition hover:border-ast-lavender/50"
              >
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ast-lavender">
                  Today in Art History
                </p>
                <p className="text-xs font-semibold leading-snug text-ast-body line-clamp-2">
                  {history.title}
                </p>
              </button>
            )}

            {partners && (
              <button
                type="button"
                onClick={() => navigate("inspiration")}
                className="w-full rounded-xl border border-ast-blue/25 bg-[#120724] px-3 py-2.5 text-left transition hover:border-ast-blue/50"
              >
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ast-lavender">
                  Partners
                </p>
                <p className="text-xs font-semibold leading-snug text-[#8D5CFF]">
                  {partners.title}
                </p>
                <p className="mt-1 text-[10px] leading-snug text-ast-body/55">{partners.body}</p>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Recent-project rail tile — the live app's 2×2 photo cards. */
function RecentProjectTile({
  project,
  onClick,
}: {
  project: ProjectDto;
  onClick: () => void;
}) {
  const photo = project.photos[0] ?? null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full overflow-hidden rounded-xl border border-ast-turquoise/20 bg-[#120724] text-left transition hover:border-ast-electric-blue/50"
    >
      {photo ? (
        <img src={photo} alt="" className="block aspect-square w-full object-cover" />
      ) : (
        <div className="aspect-square w-full bg-gradient-to-br from-ast-purple/20 via-ast-lavender/10 to-transparent" />
      )}
      <div className="px-2 py-1.5">
        <p className="truncate text-[10px] font-semibold leading-snug text-ast-body transition-colors group-hover:text-ast-cyan">
          {project.name}
        </p>
        <p className="truncate text-[9px] leading-tight text-ast-muted capitalize">
          {project.status.replace("-", " ")}
        </p>
      </div>
    </button>
  );
}

/**
 * Stat tile — mirrors the live app: the active view's tile is highlighted
 * (electric blue border/tint), idle tiles carry per-card accent borders
 * (turquoise / lavender / purple) with the live app's hover treatments.
 */
function StatCard({
  label,
  value,
  sub,
  active,
  labelClass,
  valueClass,
  subClass,
  idleBorder,
  hoverBorder,
  onClick,
}: {
  label: string;
  value: number;
  sub: string;
  active: boolean;
  labelClass: string;
  valueClass: string;
  subClass: string;
  idleBorder: string;
  hoverBorder: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={
        active
          ? "rounded-xl border border-ast-electric-blue/60 bg-ast-electric-blue/10 p-2.5 text-left transition"
          : `rounded-xl border bg-[#120724] p-2.5 text-left transition ${idleBorder} ${hoverBorder}`
      }
    >
      <p className={`text-[10px] font-bold uppercase tracking-wider ${labelClass}`}>{label}</p>
      <p className={`mt-0.5 text-lg font-bold ${valueClass}`}>{value}</p>
      <p className={`text-[9px] leading-tight ${subClass}`}>{sub}</p>
    </button>
  );
}
