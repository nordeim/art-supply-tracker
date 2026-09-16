"use client";

/**
 * Dashboard view — "Today in the Studio": the four content cards (Partner
 * Spotlight, Art History, Artist Quote, Studio Spotlight) plus the Import
 * JSON / Export Data utilities, matching the live app's default landing.
 */
import Image from "next/image";

interface DashboardViewProps {
  onExport: () => void;
  onImportClick: () => void;
}

export function DashboardView({
  onExport,
  onImportClick,
}: DashboardViewProps) {
  return (
    <div className="studio-fade">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.35em] text-ast-lavender">Studio</p>
        <h1 className="mt-2 bg-[linear-gradient(90deg,#00E6FF_0%,#2E64FF_35%,#8D5CFF_65%,#FF2FB3_100%)] bg-clip-text text-3xl font-bold text-transparent">
          Today in the Studio
        </h1>
        <p className="mt-2 text-sm text-ast-body/60">
          Open a workspace from the left, or explore what&apos;s on today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PartnerSpotlightCard />
        <ArtHistoryCard />
        <ArtistQuoteCard />
        <StudioSpotlightCard onExport={onExport} onImportClick={onImportClick} />
      </div>
    </div>
  );
}

function PartnerSpotlightCard() {
  return (
    <section className="rounded-2xl border border-ast-blue/40 bg-[#120724] p-6">
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.25em] text-ast-lavender">
          Partner Spotlight
        </p>
        <span className="rounded bg-ast-lavender/20 px-2 py-0.5 text-xs text-ast-lavender/70">
          Sponsored
        </span>
      </div>
      <h2 className="mb-2 text-lg font-bold text-[#00E6FF]">
        Partner name placeholder
      </h2>
      <p className="text-sm leading-relaxed text-ast-body/70">
        Partner description placeholder. Real partner content, demos, and
        product launches will appear here once partner integrations are
        confirmed.
      </p>
      <p className="mt-4 text-xs italic text-ast-faint">
        Partner content — placeholder for MVP
      </p>
    </section>
  );
}

function ArtHistoryCard() {
  return (
    <section className="rounded-2xl border border-ast-purple/35 bg-[#120724] p-6">
      <p className="mb-3 text-xs uppercase tracking-[0.25em] text-ast-lavender">
        Art History
      </p>
      <div
        aria-hidden="true"
        className="mb-4 h-28 rounded-lg bg-gradient-to-br from-[#141031] via-[#221a4d] to-[#2e1d5c]"
      />
      <h2 className="mb-2 text-base font-semibold text-ast-lavender">The Starry Night</h2>
      <p className="text-[13px] leading-relaxed text-ast-body/70">
        Vincent van Gogh completed <em>The Starry Night</em> in June 1889 while a
        patient at Saint-Paul-de-Mausole in Saint-Rémy-de-Provence. Painted
        from memory rather than direct observation, it is now one of the most
        recognised works in Western art.
      </p>
      <p className="mt-3 text-[11px] text-ast-faint">
        Daily art history — curated feed coming in a future release
      </p>
    </section>
  );
}

function ArtistQuoteCard() {
  return (
    <section className="rounded-2xl border border-ast-turquoise/25 bg-[#120724] p-6">
      <p className="mb-3 text-xs uppercase tracking-[0.25em] text-ast-turquoise">
        Artist Quote
      </p>
      <blockquote className="text-xl font-semibold leading-snug text-ast-electric-blue">
        Famous artist quote placeholder.
      </blockquote>
      <p className="mt-4 text-xs text-ast-faint">
        Verified quote feed coming in a future release.
      </p>
    </section>
  );
}

function StudioSpotlightCard({
  onExport,
  onImportClick,
}: {
  onExport: () => void;
  onImportClick: () => void;
}) {
  return (
    <section className="rounded-2xl border border-ast-pink/30 bg-[#120724] p-6">
      <p className="mb-4 text-xs uppercase tracking-[0.25em] text-ast-pink">
        Studio Spotlight
      </p>
      <div className="flex items-center gap-3">
        <Image
          src="/assets/portrait-01.jpg"
          alt="Kevin Lewis"
          width={56}
          height={56}
          className="h-14 w-14 rounded-full border-2 border-ast-purple/50 object-cover"
        />
        <div>
          <h2 className="text-lg font-semibold text-ast-pink">Kevin Lewis</h2>
          <p className="text-[13px] text-ast-body/60">Mixed media &amp; textile artist</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ast-body/70">
        Vivid, intense, and sometimes frightening work rooted in makeup and
        costume design for horror film.
      </p>
      <p className="mt-3 text-[11px] text-ast-faint">
        Artwork by Kevin Lewis. Used with artist permission.
      </p>
      <div className="mt-4 flex justify-end gap-4">
        <button
          type="button"
          onClick={onImportClick}
          className="text-xs text-indigo-400 underline-offset-4 transition hover:text-indigo-300 hover:underline"
        >
          Import JSON
        </button>
        <button
          type="button"
          onClick={onExport}
          className="text-xs text-indigo-400 underline-offset-4 transition hover:text-indigo-300 hover:underline"
        >
          Export Data
        </button>
      </div>
    </section>
  );
}
