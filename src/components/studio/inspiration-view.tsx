"use client";

/**
 * Inspiration view — "INSPIRATION / Feed": the three feed tabs (Today,
 * Art History, Inspire Me). The Today tab mirrors the live app's interactive
 * rails: a grid of quote gradient tiles (each opens the QUOTE OF THE DAY
 * panel with artwork, citation link, rights, and tags), gradient-framed
 * Studio Spotlight portrait tiles (bio, handle, tags, attribution, link —
 * and, when the entry carries an artwork gallery, the full-width main
 * image with its thumbnail selector), the Today-in-Art-History card with
 * its gradient thumb, and the Partners card. Art History lists the dated
 * timeline in a 2-column grid; Inspire Me renders the live "Discovery
 * Mode" placeholder. Panels render inline below their section, exactly
 * like the beta.
 *
 * r35: the four detail panels were re-measured live (2026-09-29) and
 * rebuilt to the live's per-type contracts — each family carries its own
 * border/padding chrome (turquoise/40 p-5, purple/50 p-4, lavender/40,
 * blue/40), its own mount point (the quote panel nests inside the Artist
 * Quotes section with NO gap; the spotlight panel mounts after the whole
 * spotlight section with mt-3 and scrolls into view; the history/partner
 * panels mount as children of the feed container after their grids), and
 * its own inner layout (the quote's flex row + citation stack, the
 * spotlight's gallery + flat text column, the history's notice + essay,
 * the partner's flat title+body card). See inspiration-view-fidelity.test.ts
 * for the pinned class strings.
 */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { InspirationEntryDto } from "@/lib/dto";
import { pickToday, quoteKey, spotlightKey } from "@/lib/inspiration";

type FeedTab = "today" | "history" | "inspire";

interface InspirationViewProps {
  inspiration: InspirationEntryDto[];
  /** The rail navigation section (the live app's location state):
   * r37 — the section is a RAW STRING key consumed verbatim by the Feed
   * (the live's useEffect(() => { e && i(e) }, [e])). "art-history-today" /
   * "partner" expand their detail panels; "spotlight-kevin-lewis" (the
   * DASHBOARD card) opens the Kevin Lewis spotlight panel + scrolls;
   * "featured-artist" (the SIDEBAR RAIL's spotlight card) and "quote"
   * (the rail's quote card) match no panel key — inert by design. Null
   * sections — plain stat-tile navigation — never touch the current key. */
  initialSection: string | null;
}

export function InspirationView({
  inspiration,
  initialSection,
}: InspirationViewProps) {
  const [tab, setTab] = useState<FeedTab>("today");
  // r37: the live's active-key contract — a RAW STRING (the location
  // state's section verbatim, or a tile's key), never a resolved entry
  // id (bundle fn TB: [r, i] = useState(null); useEffect(() => { e &&
  // i(e) }, [e])). Implemented with React's "adjust state during render"
  // pattern (the initializer covers the mount, the comparison updates);
  // the section-string comparison IS the live's [e] dependency, so a
  // same-section re-click does nothing and a null section (the plain
  // stat-tile navigation) never clears the key.
  const [activeKey, setActiveKey] = useState<string | null>(initialSection);
  const [prevSection, setPrevSection] = useState<string | null>(initialSection);
  if (initialSection !== prevSection) {
    setPrevSection(initialSection);
    if (initialSection) setActiveKey(initialSection);
  }
  const spotlightWrapperRef = useRef<HTMLDivElement | null>(null);

  const quotes = inspiration.filter(
    (e) => e.type === "artist_quote" && e.date,
  );
  // r37: the live's quote-tile computation — past quotes date-DESC, then
  // upcoming ASC, capped at four (bundle: l = c.filter(e => e.date <= s)
  // .sort(desc); u = c.filter(e => e.date > s).sort(asc); d = [...l,
  // ...u].slice(0, 4)). The seeded four are all past, so the order equals
  // the seed's insertion order (Cassatt, Degas, Kollwitz, Klee).
  const now = new Date().toISOString().split("T")[0] ?? "";
  const pastQuotes = quotes
    .filter((e) => (e.date ?? "") <= now)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  const upcomingQuotes = quotes
    .filter((e) => (e.date ?? "") > now)
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  const quoteTiles = [...pastQuotes, ...upcomingQuotes].slice(0, 4);
  const spotlights = inspiration.filter((e) => e.type === "studio_spotlight");
  const history = inspiration
    .filter((e) => e.type === "art_history" && e.date)
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  const partners = inspiration.filter((e) => e.type === "partner");
  const today = pickToday(history);

  // r37: the per-tab panel lookups — the live's per-tab string equality
  // (the quote panels key on `quote-${date}`, the spotlight panels on
  // `spotlight-${slug}`, the today panel on "art-history-today", the
  // partner panel on "partner", and the timeline panels on the bare
  // date). A key matching nothing on the current tab renders NO panel
  // (the live's behavior — e.g. the rail's art-history-today click while
  // on the Art History tab opens nothing: no timeline date equals it).
  const activeQuote =
    quoteTiles.find((q) => activeKey === quoteKey(q.date ?? "")) ?? null;
  const activeSpotlight =
    spotlights.find((s) => activeKey === spotlightKey(s)) ?? null;
  const activeTimeline = history.find((e) => activeKey === e.date) ?? null;

  // r36/r37: the live's scroll contract — ONE effect keyed on the active
  // key (the live's `r`), debounced 60ms so the artwork image has sized
  // before `nearest` computes — the clone's old synchronous mount-time
  // panel scroll computed against the unsized image and landed 256px
  // short (measured: live scrollY 317 vs clone 63 on the Kim pair). The
  // wrapper ALWAYS renders (empty when closed), so a spotlight-* key
  // still scrolls it. r37: the condition is the live's RAW PREFIX TEST
  // (r?.startsWith('spotlight-')) — it covers the tile clicks AND the
  // dashboard card's 'spotlight-kevin-lewis' (panel + scroll) and
  // EXCLUDES the sidebar rail's 'featured-artist' (no scroll — the r36
  // "inert rail navigation scrolls" note was based on the wrong section
  // string, corrected r37).
  useEffect(() => {
    if (!activeKey?.startsWith("spotlight-")) return;
    const timer = setTimeout(() => {
      spotlightWrapperRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 60);
    return () => clearTimeout(timer);
  }, [activeKey]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 shrink-0">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-ast-lavender">
          Inspiration
        </p>
        <h2 className="mt-1 text-2xl font-bold text-ast-body">Feed</h2>
      </div>

      <div className="mb-4 flex shrink-0 gap-1.5">
        {(
          [
            { value: "today", label: "Today" },
            { value: "history", label: "Art History" },
            { value: "inspire", label: "Inspire Me" },
          ] as const
        ).map((item) => (
          // r35: the live's feed tabs are PLAIN buttons — no tab role, no
          // selected-state attribute (the clone's scaffold-era orphan tab
          // semantics had no tablist parent and were invalid ARIA; removed).
          <button
            key={item.value}
            type="button"
            onClick={() => {
              setTab(item.value);
              setActiveKey(null);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              tab === item.value
                ? "border border-ast-lavender/40 bg-ast-lavender/15 text-ast-lavender"
                : "border border-transparent text-ast-muted hover:text-ast-body"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="scrollbar-left flex-1 space-y-3 overflow-y-auto pb-2 pr-1">
        {tab === "today" && (
          <>
            <div>
              <p className="mb-2.5 px-0.5 text-sm font-bold uppercase tracking-wider text-ast-turquoise">
                Artist Quotes
              </p>
              <div className="grid grid-cols-4 gap-2">
                {quoteTiles.map((quote) => (
                  <button
                    key={quote.id}
                    type="button"
                    onClick={() => setActiveKey(activeKey === quoteKey(quote.date ?? "") ? null : quoteKey(quote.date ?? ""))}
                    // Kept a11y addition (r35, the aria-pressed class): the
                    // live's gradient tiles carry no text, so this label is
                    // the button's only accessible name.
                    aria-label={`Quote by ${quote.author ?? quote.title}`}
                    // r35: the live marks the tile whose panel is open with
                    // the turquoise/60 border (measured 2026-09-29). r37:
                    // the selected test is the live's quote-<date> key.
                    className={`aspect-square w-full overflow-hidden rounded-2xl border-2 transition ${
                      activeKey === quoteKey(quote.date ?? "")
                        ? "border-ast-turquoise/60"
                        : "border-transparent hover:border-ast-turquoise/25"
                    }`}
                  >
                    <div className="h-full w-full bg-gradient-to-br from-ast-turquoise/25 via-ast-lavender/20 to-ast-purple/25" />
                  </button>
                ))}
              </div>
              {activeQuote && (
                <InspirationDetailPanel
                  key={activeQuote.id}
                  entry={activeQuote}
                  onClose={() => setActiveKey(null)}
                />
              )}
            </div>

            <div>
              <p className="mb-2 px-0.5 text-[10px] font-bold uppercase tracking-wider text-ast-faint">
                Studio Spotlight
              </p>
              <div className="grid grid-cols-4 gap-2">
                {spotlights.map((spotlight) => (
                  <div
                    key={spotlight.id}
                    // r35: the selected spotlight's gradient frame goes
                    // full-opacity and drops its hover tokens (measured).
                    // r37: the selected test is the live's spotlight-<slug>
                    // key.
                    className={`rounded-2xl bg-gradient-to-br p-1 transition ${
                      activeKey === spotlightKey(spotlight)
                        ? "from-ast-electric-blue via-ast-purple to-ast-pink"
                        : "from-ast-electric-blue/70 via-ast-purple/70 to-ast-pink/60 hover:from-ast-electric-blue/90 hover:via-ast-purple/90 hover:to-ast-pink/80"
                    }`}
                  >
                    {/* r35: no aria-label — the tile's visible name label
                        already provides the accessible name (the live's
                        tile carries none either; the label was redundant). */}
                    <button
                      type="button"
                      onClick={() => setActiveKey(activeKey === spotlightKey(spotlight) ? null : spotlightKey(spotlight))}
                      className="relative block aspect-square w-full overflow-hidden rounded-[12px] bg-[#120724]"
                    >
                      {spotlight.imageUrl ? (
                        <Image
                          src={spotlight.imageUrl}
                          alt={spotlight.title}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 25vw, 160px"
                          style={{ objectPosition: "center top" }}
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-ast-turquoise/25 via-ast-lavender/20 to-ast-purple/25" />
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-2.5 py-1.5">
                        <p className="truncate text-[10px] font-bold leading-tight text-white/90">
                          {spotlight.title}
                        </p>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
              {/* r36: the live's spotlight section = [header, tile grid,
                  ALWAYS-RENDERED plain wrapper] — the panel mounts inside
                  the wrapper when open (DOM probe + bundle; the r35 record
                  placed it as a feed-container sibling — a mis-reading,
                  layout-neutral either way). The wrapper is also the
                  scroll target for the unified 60ms effect above. r37: the
                  panel mounts for the spotlight whose spotlight-<slug> key
                  matches (the live's sB.map(e => r === `spotlight-${e.id}`
                  ? panel : null)). */}
              <div ref={spotlightWrapperRef}>
                {activeSpotlight && (
                  <InspirationDetailPanel
                    key={activeSpotlight.id}
                    entry={activeSpotlight}
                    onClose={() => setActiveKey(null)}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {today && (
                <button
                  type="button"
                  onClick={() => setActiveKey(activeKey === "art-history-today" ? null : "art-history-today")}
                  // r35: the selected card carries the lavender/60 border +
                  // a white/10 ring and drops its hover (measured). r37: the
                  // selected test is the live's art-history-today key.
                  className={`w-full rounded-2xl border bg-[#120724] p-4 text-left transition ${
                    activeKey === "art-history-today"
                      ? "border-ast-lavender/60 ring-1 ring-white/10"
                      : "border-ast-purple/40 hover:brightness-110"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ast-lavender">
                        Today in Art History
                      </p>
                      <p className="text-sm font-semibold leading-snug text-ast-body line-clamp-2">
                        {today.title}
                      </p>
                      {today.author && (
                        <p className="mt-1 text-[11px] leading-snug text-ast-body/55 line-clamp-1">
                          {today.author}
                        </p>
                      )}
                    </div>
                    {/* r37: the live's mB thumb contract — the artwork img
                        when the entry carries one, else the gradient
                        fallback div with the INLINE height (the live's
                        fallback carries style={{height:'3.5rem'}}, not an
                        h-14 class; the today entry is imageless so the
                        fallback renders — measured identical). */}
                    <AstImg
                      src={today.imageUrl}
                      alt={today.detail?.imageAlt ?? undefined}
                      className="ast-img-safe shrink-0 w-14 rounded-xl object-contain object-center bg-transparent"
                      style={{ maxHeight: "3.5rem" }}
                      fallback={
                        <div
                          className="shrink-0 w-14 rounded-xl bg-gradient-to-br from-ast-purple/20 via-ast-lavender/15 to-ast-blue/20"
                          style={{ height: "3.5rem" }}
                        />
                      }
                    />
                  </div>
                </button>
              )}
              {partners.map((partner) => (
                <button
                  key={partner.id}
                  type="button"
                  onClick={() => setActiveKey(activeKey === "partner" ? null : "partner")}
                  // r35: the selected partner card carries blue/60 + ring.
                  // r37: the selected test is the live's partner key.
                  className={`w-full rounded-2xl border bg-[#120724] p-4 text-left transition ${
                    activeKey === "partner"
                      ? "border-ast-blue/60 ring-1 ring-white/10"
                      : "border-ast-blue/20 hover:brightness-110"
                  }`}
                >
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ast-lavender">
                    Partners
                  </p>
                  <p className="text-sm font-semibold leading-snug text-[#8D5CFF] line-clamp-2">
                    {partner.title}
                  </p>
                  {partner.body && (
                    <p className="mt-1 text-[11px] leading-snug text-ast-body/55">
                      {partner.body}
                    </p>
                  )}
                </button>
              ))}
            </div>
            {/* r37: the live's per-key mounts — the today panel keys on
                "art-history-today" (with the pickToday entry), the partner
                panel on "partner" (bundle: r === 'art-history-today' && a
                && bB; r === 'partner' && CB). A timeline date key on this
                tab mounts NOTHING (no per-type fallback). */}
            {activeKey === "art-history-today" && today && (
              <InspirationDetailPanel
                key={today.id}
                entry={today}
                onClose={() => setActiveKey(null)}
              />
            )}
            {activeKey === "partner" && partners.length > 0 && (
              <InspirationDetailPanel
                key={partners[0]!.id}
                entry={partners[0]!}
                onClose={() => setActiveKey(null)}
              />
            )}
          </>
        )}

        {tab === "history" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {history.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setActiveKey(activeKey === entry.date ? null : entry.date)}
                  // r35: the selected timeline entry carries the lavender/60
                  // border + ring, like the today card (measured). r37: the
                  // tile keys on the bare DATE — the live's r === e.date
                  // (NOT the entry id or the today key — this is why the
                  // rail's art-history-today click opens nothing here).
                  className={`w-full rounded-2xl border bg-[#120724] p-4 text-left transition ${
                    activeKey === entry.date
                      ? "border-ast-lavender/60 ring-1 ring-white/10"
                      : "border-ast-purple/30 hover:brightness-110"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ast-lavender">
                        {entry.date}
                      </p>
                      <p className="text-sm font-semibold leading-snug text-ast-body line-clamp-2">
                        {entry.title}
                      </p>
                      {entry.author && (
                        <p className="mt-1 text-[11px] leading-snug text-ast-body/55 line-clamp-1">
                          {entry.author}
                        </p>
                      )}
                    </div>
                    {/* r37: the live's mB thumb contract — the artwork img
                        (the Van Gogh + Monet entries' wikimedia images,
                        measured 56×44 / 56×43 object-contain) when the
                        entry carries one, else the gradient fallback div
                        with the INLINE height style. */}
                    <AstImg
                      src={entry.imageUrl}
                      alt={entry.detail?.imageAlt ?? undefined}
                      className="ast-img-safe shrink-0 w-14 rounded-xl object-contain object-center bg-transparent"
                      style={{ maxHeight: "3.5rem" }}
                      fallback={
                        <div
                          className="shrink-0 w-14 rounded-xl bg-gradient-to-br from-ast-purple/20 via-ast-lavender/15 to-ast-blue/20"
                          style={{ height: "3.5rem" }}
                        />
                      }
                    />
                  </div>
                </button>
              ))}
              {history.length === 0 && (
                <p className="col-span-2 rounded-2xl border border-ast-purple/25 bg-[#120724] p-6 text-sm text-ast-faint">
                  The art history timeline is empty.
                </p>
              )}
            </div>
            {/* r35: the live's history-tab panel mounts AFTER the timeline
                grid as its own child of the feed container — not nested
                inside the grid as a col-span-2 row. r37: the panel mounts
                for the timeline entry whose DATE matches the active key
                (the live's o.filter(e => r === e.date)) — the today key
                and any other string mount nothing on this tab. */}
            {activeTimeline && (
              <InspirationDetailPanel
                key={activeTimeline.id}
                entry={activeTimeline}
                onClose={() => setActiveKey(null)}
              />
            )}
          </>
        )}

        {tab === "inspire" && (
          <div className="rounded-2xl border border-ast-lavender/20 bg-ast-lavender/5 px-4 py-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ast-lavender/60">
              Discovery Mode
            </p>
            <p className="text-xs text-ast-body/50">Random inspiration coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const PANEL_HEADER: Record<InspirationEntryDto["type"], string> = {
  artist_quote: "Quote of the Day",
  studio_spotlight: "Studio Spotlight",
  art_history: "Today in Art History",
  partner: "Partners",
};

/** r35: the live's per-type panel chrome — each family carries its own
 * border color and padding (measured 2026-09-29; the clone previously
 * rendered one shared turquoise/40 p-5 class on all four). The spotlight
 * panel's mt-3 is explicit because it mounts outside any space-y flow. */
const PANEL_CHROME: Record<InspirationEntryDto["type"], string> = {
  artist_quote: "rounded-2xl border border-ast-turquoise/40 bg-[#0d0420] p-5",
  studio_spotlight: "rounded-2xl border border-ast-purple/50 bg-[#0d0420] p-4 mt-3",
  art_history: "rounded-2xl border border-ast-lavender/40 bg-[#0d0420] p-5",
  partner: "rounded-2xl border border-ast-blue/40 bg-[#0d0420] p-5",
};

/** Section accent per entry type — the live's measured header colors: the
 * quote header is turquoise, the spotlight header FAINT (not pink — r35
 * re-measure), history and partner are lavender. */
const PANEL_ACCENT: Record<InspirationEntryDto["type"], string> = {
  artist_quote: "text-ast-turquoise",
  studio_spotlight: "text-ast-faint",
  art_history: "text-ast-lavender",
  partner: "text-ast-lavender",
};

/**
 * Splits an artwork caption into the live's composed span trio —
 * "The Child's Bath (1893) · Mary Cassatt" renders as a bold title span,
 * a muted " (1893)" span, and a muted " · Mary Cassatt" span (measured on
 * the live's quote and history panels 2026-09-29). Captions without the
 * year/author separators render whole in the title span.
 */
function splitArtworkCaption(artwork: string): {
  title: string;
  year: string;
  author: string;
} {
  const yearIdx = artwork.indexOf(" (");
  if (yearIdx === -1) return { title: artwork, year: "", author: "" };
  const dotIdx = artwork.indexOf(" · ");
  if (dotIdx === -1 || dotIdx < yearIdx) {
    return { title: artwork.slice(0, yearIdx), year: artwork.slice(yearIdx), author: "" };
  }
  return {
    title: artwork.slice(0, yearIdx),
    year: artwork.slice(yearIdx, dotIdx),
    author: artwork.slice(dotIdx),
  };
}

/**
 * r37: the live's fB image component, mirrored — (!src || errored)
 * ? fallback : <img>. A load error swaps to the fallback element (the
 * live's quote-panel wikimedia images fail → their null fallback renders
 * nothing, which is why the quote panels converge with no image); a
 * missing src renders the fallback immediately. Plain <img> (no
 * next/image) matches the live's DOM — remote wikimedia/wixstatic URLs
 * render without any remotePatterns config.
 */
function AstImg({
  src,
  alt,
  className,
  style,
  fallback = null,
}: {
  src: string | null;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  fallback?: React.ReactNode;
}) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) return fallback;
  return (
    <img
      src={src}
      alt={alt ?? ""}
      className={className}
      style={style}
      onError={() => setErrored(true)}
    />
  );
}

function InspirationDetailPanel({
  entry,
  onClose,
}: {
  entry: InspirationEntryDto;
  onClose: () => void;
}) {
  const detail = entry.detail;
  const gallery = detail?.gallery ?? [];
  const [artworkIdx, setArtworkIdx] = useState(0);
  // r36: the panel no longer scrolls itself — the live's scroll lives in
  // the Feed component as ONE 60ms-debounced effect on the always-
  // rendered spotlight wrapper (see above); the panel's mount-time
  // scroll computed against the unsized image and landed 256px short.

  const caption = detail?.artwork ? splitArtworkCaption(detail.artwork) : null;
  const linkHref = detail?.linkUrl
    ? detail.linkUrl.startsWith("http")
      ? detail.linkUrl
      : `https://${detail.linkUrl}`
    : null;

  return (
    <div className={PANEL_CHROME[entry.type]}>
      <div
        className={
          entry.type === "partner"
            ? "mb-2 flex items-start justify-between"
            : "flex items-start justify-between mb-3"
        }
      >
        <p
          className={`text-[10px] font-bold uppercase tracking-wider ${
            PANEL_ACCENT[entry.type]
          }`}
        >
          {PANEL_HEADER[entry.type]}
        </p>
        <button
          type="button"
          onClick={onClose}
          // Kept a11y addition (r35): the live's ✕ glyph button is unnamed;
          // this label is its only accessible name (the aria-pressed class).
          aria-label="Close detail panel"
          className="shrink-0 text-sm leading-none text-ast-faint transition hover:text-ast-body"
        >
          ✕
        </button>
      </div>

      {entry.type === "artist_quote" && (
        <>
          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              {detail?.title && (
                <h3 className="text-sm font-semibold text-ast-body/80 mb-2 leading-snug">
                  {detail.title}
                </h3>
              )}
              <blockquote className="text-xl font-medium italic leading-relaxed bg-gradient-to-r from-ast-lavender to-ast-turquoise bg-clip-text text-transparent">
                &ldquo;{detail?.quote ?? entry.title}&rdquo;
              </blockquote>
              {entry.author && (
                <p className="mt-2 text-xs text-ast-muted">— {entry.author}</p>
              )}
            </div>
          </div>
          {caption && (
            <div className="mt-3">
              <p className="text-xs text-ast-muted">
                <span className="font-medium text-ast-body/80">{caption.title}</span>
                <span className="text-ast-muted">{caption.year}</span>
                <span className="text-ast-muted">{caption.author}</span>
              </p>
              {detail?.citation && (
                <a
                  href={detail.citationUrl ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-ast-turquoise/80 hover:text-ast-turquoise transition underline underline-offset-2"
                >
                  {detail.citation}
                </a>
              )}
              {/* The live's rights line carries mt-1 — the ONLY
                  effective spacing in its citation stack: the live's TW3
                  space-y puts margin-top on the later children, which the
                  inline citation link IGNORES, so the 4px renders solely
                  on this block. The clone therefore drops the stack's
                  space-y (TW4 would emit an effective margin-bottom on
                  the artwork line, shifting the link 4px low) and keeps
                  this token as the measured gap. */}
              {detail?.rights && (
                <p className="text-[10px] text-ast-muted/70 leading-snug mt-1">
                  {detail.rights}
                </p>
              )}
            </div>
          )}
          {detail?.tags && detail.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {/* r36: the live's shared quote/history tag row renders
                  e.slice(0, 4) — at most four pills (bundle). */}
              {detail.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] uppercase tracking-wide bg-ast-lavender/10 text-ast-muted px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {entry.type === "studio_spotlight" && (
        <>
          {gallery.length > 0 && (
            <>
              {/* The live's main artwork: a plain img, natural aspect,
                  capped at 16rem, letterboxed by object-contain (measured
                  2026-09-29). Plain <img> matches the live's DOM — no
                  intrinsic-dimension attributes to drift the box. r36: the
                  live carries the ast-img-safe class (a no-op here — TW4
                  compiles nothing for it — kept for the class-string
                  contract) and the per-artwork alt with the entry-name
                  fallback (bundle: alt: a.alt ?? e.name). */}
              <img
                src={gallery[Math.min(artworkIdx, gallery.length - 1)]?.url ?? gallery[0]?.url}
                alt={gallery[Math.min(artworkIdx, gallery.length - 1)]?.alt ?? entry.title}
                className="ast-img-safe w-full rounded-xl object-contain object-center mb-3"
                style={{ maxHeight: "16rem" }}
              />
              {gallery.length > 1 && (
                <div className="flex gap-2 mb-3">
                  {gallery.map((artwork, i) => (
                    <button
                      key={artwork.url}
                      type="button"
                      onClick={() => setArtworkIdx(i)}
                      aria-label={`Artwork ${i + 1}`}
                      // r36: the live's unselected thumb hovers to
                      // ast_purple/40 (bundle), not turquoise/40.
                      className={`w-12 h-12 shrink-0 rounded-lg overflow-hidden border-2 transition ${
                        i === artworkIdx
                          ? "border-ast-turquoise/60"
                          : "border-transparent hover:border-ast-purple/40"
                      }`}
                    >
                      <img
                        src={artwork.url}
                        alt={artwork.alt ?? ""}
                        className="ast-img-safe block w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          <h3 className="font-bold text-ast-turquoise text-base leading-snug">
            {entry.title}
          </h3>
          {(detail?.subtitle ?? entry.body) && (
            <p className="text-[10px] text-ast-muted mt-0.5 mb-2">
              {detail?.subtitle ?? entry.body}
            </p>
          )}
          {detail?.body && (
            <p className="text-xs text-ast-body/65 mb-2 leading-relaxed">
              {detail.body}
            </p>
          )}
          {detail?.tags && detail.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {/* r36: the live's spotlight tags are PER-TAG COLORED pills
                  from the parallel tagColors data array — 9px, MIXED CASE
                  (no uppercase class), fallback faint-on-lavender/10
                  (bundle: `${e.tagColors[n] ?? ...}`). The unified
                  lavender family belongs to the quote/history panels. */}
              {detail.tags.map((tag, i) => (
                <span
                  key={tag}
                  className={`text-[9px] px-2 py-0.5 rounded-full ${
                    detail.tagColors?.[i] ?? "text-ast-faint bg-ast-lavender/10"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {detail?.linkLabel && linkHref && (
            <a
              href={linkHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-ast-turquoise/70 hover:text-ast-turquoise transition"
            >
              {detail.linkLabel} →
            </a>
          )}
          {detail?.attribution && (
            <p className="mt-2 text-[8px] text-ast-faint/50 leading-snug">
              {detail.attribution}
            </p>
          )}
        </>
      )}

      {entry.type === "art_history" && (
        <>
          {/* r37: the live's bB artwork image — ast-img-safe w-full
              rounded-xl object-contain object-center mb-4, capped at
              maxHeight 11rem (the Van Gogh panel measures h 565 vs the
              image-less 490). The rights notice is the fB FALLBACK: an
              entry WITH an image renders the artwork instead of the
              notice; an imageless entry renders the notice. */}
          <AstImg
            src={entry.imageUrl}
            alt={detail?.imageAlt ?? undefined}
            className="ast-img-safe w-full rounded-xl object-contain object-center mb-4"
            style={{ maxHeight: "11rem" }}
            fallback={
              <p className="text-[10px] text-ast-faint/60 italic mb-3 leading-snug">
                Image unavailable · rights protected — search the web to discover this artist's work.
              </p>
            }
          />
          <h3 className="text-base font-bold text-ast-body mb-2 leading-snug">
            {entry.title}
          </h3>
          {detail?.body && (
            <p className="text-sm text-ast-body/75 leading-relaxed">{detail.body}</p>
          )}
          {caption && (
            <div className="mt-3">
              <p className="text-xs text-ast-muted">
                <span className="font-medium text-ast-body/80">{caption.title}</span>
                <span className="text-ast-muted">{caption.year}</span>
                <span className="text-ast-muted">{caption.author}</span>
              </p>
              {detail?.citation && (
                <a
                  href={detail.citationUrl ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-ast-turquoise/80 hover:text-ast-turquoise transition underline underline-offset-2"
                >
                  {detail.citation}
                </a>
              )}
              {/* The live's rights line carries mt-1 — the ONLY
                  effective spacing in its citation stack: the live's TW3
                  space-y puts margin-top on the later children, which the
                  inline citation link IGNORES, so the 4px renders solely
                  on this block. The clone therefore drops the stack's
                  space-y (TW4 would emit an effective margin-bottom on
                  the artwork line, shifting the link 4px low) and keeps
                  this token as the measured gap. */}
              {detail?.rights && (
                <p className="text-[10px] text-ast-muted/70 leading-snug mt-1">
                  {detail.rights}
                </p>
              )}
            </div>
          )}
          {detail?.tags && detail.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {/* r36: the live's shared quote/history tag row renders
                  e.slice(0, 4) — at most four pills (bundle). */}
              {detail.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] uppercase tracking-wide bg-ast-lavender/10 text-ast-muted px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {entry.type === "partner" && (
        <>
          <p className="text-sm font-semibold text-[#8D5CFF] mb-1">{entry.title}</p>
          {(detail?.body ?? entry.body) && (
            <p className="text-xs text-ast-body/55 leading-relaxed">
              {detail?.body ?? entry.body}
            </p>
          )}
        </>
      )}
    </div>
  );
}
