"use client";

/**
 * Studio sidebar — the "STUDIO TOOLS" column: My Studio shortcut, stat cards
 * (Projects / Supplies / Inspo), Recent Projects, and the Inspiration rail
 * (spotlight, quote of the day, art history, partners).
 *
 * Desktop renders a fixed column; below md the same content renders inside a
 * slide-in drawer (classes lifted from the live app: rounded-r-3xl, blurred
 * #0B0018 canvas, turquoise right border).
 */
import type { InspirationEntryDto, ProjectDto } from "@/lib/dto";
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
  const entries = inspiration.filter((e) => e.type === "art_history" && e.date);
  const today = new Date().toISOString().split("T")[0] ?? "";
  const past = entries
    .filter((e) => (e.date ?? "") <= today)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  if (past[0]) return past[0];
  return [...entries].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))[0];
}

export function StudioSidebar(props: StudioSidebarProps) {
  const { navigate, onNewProject, sidebarOpen, onCloseSidebar } = props;

  const content = <SidebarContent {...props} />;

  return (
    <>
      {/* Desktop column */}
      <nav
        aria-label="Studio tools"
        className="hidden w-72 shrink-0 overflow-y-auto scrollbar-studio px-4 pb-10 pt-6 md:block"
      >
        {content}
      </nav>

      {/* Mobile drawer */}
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
        className={`fixed inset-y-0 left-0 z-50 w-4/5 max-w-xs overflow-y-auto scrollbar-studio rounded-r-3xl border-r border-ast-turquoise/30 bg-[#0B0018] p-4 backdrop-blur-xl transition-transform duration-300 md:hidden ${
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
  const recent = projects.slice(0, 3);

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
            onClick={() => navigate("inspiration")}
          />
        </div>

        <section aria-label="Recent projects">
          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-widest text-ast-turquoise">
            Recent Projects
          </p>
          {recent.length === 0 ? (
            <div className="rounded-xl border border-ast-purple/25 bg-[#0f0722] p-4 text-center">
              <p className="text-sm text-ast-faint">No projects yet</p>
              <button
                type="button"
                onClick={onNewProject}
                className="mt-3 w-full rounded-lg bg-gradient-to-r from-ast-turquoise to-ast-blue px-3 py-2.5 text-xs font-semibold text-white transition hover:opacity-90"
              >
                + Create Project
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {recent.map((project) => (
                <li key={project.id}>
                  <button
                    type="button"
                    onClick={() => navigate("projects")}
                    className="w-full rounded-xl border border-ast-purple/25 bg-[#0f0722] p-3 text-left transition hover:border-ast-purple/50"
                  >
                    <p className="truncate text-sm font-medium text-ast-body">
                      {project.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ast-faint">{project.status}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Inspiration">
          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-widest text-ast-lavender">
            Inspiration
          </p>

          {spotlight && (
            <button
              type="button"
              onClick={() => navigate("inspiration")}
              className="mb-2 w-full rounded-xl bg-gradient-to-r from-[#1e1b4b] to-[#581c87] p-3 text-left transition hover:opacity-85"
            >
              <span className="block text-[9px] uppercase tracking-wider text-ast-lavender/80">
                Studio Spotlight
              </span>
              <span className="block truncate text-sm font-semibold text-white">
                {spotlight.title}
              </span>
              <span className="block truncate text-[11px] text-ast-lavender">
                {spotlight.body}
              </span>
            </button>
          )}

          {quote && (
            <button
              type="button"
              onClick={() => navigate("inspiration")}
              className="mb-2 w-full rounded-xl border border-ast-purple/25 bg-[#0f0722] p-3 text-left transition hover:border-ast-purple/50"
            >
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-ast-turquoise">
                Quote of the Day
              </span>
              <span className="mt-1 block text-xs italic leading-relaxed text-ast-body/80">
                &ldquo;{quote.title}&rdquo;
              </span>
              {quote.author && (
                <span className="mt-1 block text-[11px] text-ast-faint">— {quote.author}</span>
              )}
            </button>
          )}

          {history && (
            <button
              type="button"
              onClick={() => navigate("inspiration")}
              className="mb-2 w-full rounded-xl border border-ast-purple/25 bg-[#0f0722] p-3 text-left transition hover:border-ast-purple/50"
            >
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-ast-pink">
                Today in Art History
              </span>
              <span className="mt-1 block text-xs leading-snug text-ast-body/80">
                {history.title}
              </span>
            </button>
          )}

          {partners && (
            <button
              type="button"
              onClick={() => navigate("inspiration")}
              className="w-full rounded-xl border border-ast-purple/25 bg-[#0f0722] p-3 text-left transition hover:border-ast-purple/50"
            >
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-ast-lavender">
                Partners
              </span>
              <span className="mt-1 block text-xs font-medium text-ast-lavender">
                {partners.title}
              </span>
              <span className="block text-[11px] text-ast-faint">{partners.body}</span>
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

/**
 * Stat tile — mirrors the live app: the active view's tile is highlighted
 * (electric blue border/tint), idle tiles sit on the card canvas with
 * per-card accent colors lifted from the live sidebar.
 */
function StatCard({
  label,
  value,
  sub,
  active,
  labelClass,
  valueClass,
  subClass,
  onClick,
}: {
  label: string;
  value: number;
  sub: string;
  active: boolean;
  labelClass: string;
  valueClass: string;
  subClass: string;
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
          : "rounded-xl border border-ast-purple/30 bg-[#120724] p-2.5 text-left transition hover:border-ast-electric-blue/40 hover:bg-ast-electric-blue/5"
      }
    >
      <p className={`text-[10px] font-bold uppercase tracking-wider ${labelClass}`}>{label}</p>
      <p className={`mt-0.5 text-lg font-bold ${valueClass}`}>{value}</p>
      <p className={`text-[9px] leading-tight ${subClass}`}>{sub}</p>
    </button>
  );
}
