"use client";

/**
 * Inspiration view — "INSPIRATION / Feed": the three feed tabs (Today,
 * Art History, Inspire Me). The Today tab mirrors the live app's interactive
 * rails: a quote carousel (each quote opens a QUOTE OF THE DAY panel with
 * artwork, citation, rights, and tags), clickable Studio Spotlight cards
 * (bio, handle, tags, attribution, link), a Today-in-Art-History card that
 * opens the long-form essay panel, and the Partners card. Art History lists
 * the dated timeline; Inspire Me renders the live "Discovery Mode"
 * placeholder. Panels render inline with a ✕ close, exactly like the beta.
 */
import Image from "next/image";
import { useState } from "react";

import type { InspirationEntryDto } from "@/lib/dto";
import { pickToday } from "@/lib/inspiration";

type FeedTab = "today" | "history" | "inspire";

interface InspirationViewProps {
  inspiration: InspirationEntryDto[];
}

export function InspirationView({ inspiration }: InspirationViewProps) {
  const [tab, setTab] = useState<FeedTab>("today");
  const [activeEntry, setActiveEntry] = useState<InspirationEntryDto | null>(null);

  const quotes = inspiration.filter((e) => e.type === "artist_quote");
  const spotlights = inspiration.filter((e) => e.type === "studio_spotlight");
  const history = inspiration
    .filter((e) => e.type === "art_history" && e.date)
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  const partners = inspiration.filter((e) => e.type === "partner");
  const today = pickToday(history);

  return (
    <div className="studio-fade">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.35em] text-ast-lavender">Inspiration</p>
        <h2 className="mt-2 text-3xl font-bold text-white">Feed</h2>
      </div>

      <div
        role="tablist"
        aria-label="Inspiration feed"
        className="flex flex-wrap gap-2"
      >
        {(
          [
            { value: "today", label: "Today" },
            { value: "history", label: "Art History" },
            { value: "inspire", label: "Inspire Me" },
          ] as const
        ).map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            onClick={() => {
              setTab(item.value);
              setActiveEntry(null);
            }}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              tab === item.value
                ? "bg-ast-lavender/20 text-ast-lavender"
                : "text-ast-faint hover:text-ast-body/80"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "today" && (
          <div className="space-y-8">
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ast-turquoise">
                Artist Quotes
              </h3>
              <div className="flex flex-wrap gap-3">
                {quotes.map((quote) => (
                  <button
                    key={quote.id}
                    type="button"
                    onClick={() => setActiveEntry(quote)}
                    aria-label={`Quote by ${quote.author ?? quote.title}`}
                    className="max-w-xs rounded-2xl border border-ast-turquoise/25 bg-[#120724] p-4 text-left transition hover:border-ast-turquoise/60"
                  >
                    <p className="truncate text-sm font-medium text-ast-blue">
                      {quote.detail?.quote ? `“${quote.detail.quote}”` : `“${quote.title}”`}
                    </p>
                    <p className="mt-1 truncate text-xs text-ast-faint">
                      — {quote.author ?? "Unknown"}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ast-pink">
                Studio Spotlight
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {spotlights.map((spotlight) => (
                  <button
                    key={spotlight.id}
                    type="button"
                    onClick={() => setActiveEntry(spotlight)}
                    className="flex items-center gap-3 rounded-2xl border border-ast-pink/30 bg-[#120724] p-5 text-left transition hover:border-ast-pink/60"
                  >
                    {spotlight.imageUrl && (
                      <Image
                        src={spotlight.imageUrl}
                        alt={spotlight.title}
                        width={56}
                        height={56}
                        className="h-14 w-14 rounded-full border-2 border-ast-purple/50 object-cover"
                      />
                    )}
                    <span className="min-w-0">
                      <span className="block text-lg font-semibold text-ast-pink">
                        {spotlight.title}
                      </span>
                      <span className="block truncate text-[13px] text-ast-body/60">
                        {spotlight.detail?.subtitle ?? spotlight.body}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ast-pink">
                Today in Art History
              </h3>
              {today ? (
                <button
                  type="button"
                  onClick={() => setActiveEntry(today)}
                  className="w-full rounded-2xl border border-ast-purple/25 bg-[#120724] p-5 text-left transition hover:border-ast-purple/50"
                >
                  <p className="text-sm font-semibold text-ast-body">{today.title}</p>
                  {today.author && (
                    <p className="mt-1 text-xs text-ast-lavender">{today.author}</p>
                  )}
                </button>
              ) : (
                <p className="rounded-2xl border border-ast-purple/25 bg-[#120724] p-6 text-sm text-ast-faint">
                  The daily digest is on its way.
                </p>
              )}
            </section>

            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ast-lavender">
                Partners
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {partners.map((partner) => (
                  <button
                    key={partner.id}
                    type="button"
                    onClick={() => setActiveEntry(partner)}
                    className="rounded-2xl border border-ast-purple/25 bg-[#120724] p-5 text-left transition hover:border-ast-purple/50"
                  >
                    <p className="text-sm font-medium text-ast-lavender">{partner.title}</p>
                    {partner.body && (
                      <p className="mt-1 text-xs text-ast-faint">{partner.body}</p>
                    )}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === "history" && (
          <ol className="space-y-3">
            {history.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => setActiveEntry(entry)}
                  className="w-full rounded-2xl border border-ast-purple/25 bg-[#120724] p-4 text-left transition hover:border-ast-purple/50"
                >
                  <p className="text-xs text-ast-faint">{entry.date}</p>
                  <p className="mt-1 text-sm font-semibold text-ast-body">{entry.title}</p>
                  {entry.author && (
                    <p className="mt-1 text-xs text-ast-lavender">{entry.author}</p>
                  )}
                </button>
              </li>
            ))}
            {history.length === 0 && (
              <li className="rounded-2xl border border-ast-purple/25 bg-[#120724] p-6 text-sm text-ast-faint">
                The art history timeline is empty.
              </li>
            )}
          </ol>
        )}

        {tab === "inspire" && (
          <div className="rounded-2xl border border-ast-purple/25 bg-[#120724] p-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-ast-lavender">
              Discovery Mode
            </p>
            <p className="mt-2 text-sm text-ast-body/60">
              Random inspiration coming soon.
            </p>
          </div>
        )}
      </div>

      {activeEntry && (
        <InspirationDetailPanel
          entry={activeEntry}
          onClose={() => setActiveEntry(null)}
        />
      )}
    </div>
  );
}

const PANEL_HEADER: Record<InspirationEntryDto["type"], string> = {
  artist_quote: "QUOTE OF THE DAY",
  studio_spotlight: "STUDIO SPOTLIGHT",
  art_history: "TODAY IN ART HISTORY",
  partner: "PARTNERS",
};

function InspirationDetailPanel({
  entry,
  onClose,
}: {
  entry: InspirationEntryDto;
  onClose: () => void;
}) {
  const detail = entry.detail;

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-label={PANEL_HEADER[entry.type]}
      className="relative mt-6 rounded-2xl border border-ast-purple/35 bg-[#120724] p-6 shadow-2xl studio-fade"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-ast-lavender">
          {PANEL_HEADER[entry.type]}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close detail panel"
          className="rounded-lg p-1.5 text-ast-faint transition hover:bg-white/5 hover:text-white"
        >
          ✕
        </button>
      </div>

      {entry.type === "art_history" && !entry.imageUrl && (
        <div className="mb-4 flex h-40 items-center justify-center rounded-xl border border-ast-purple/25 bg-[#0B0018] px-4 text-center">
          <p className="text-xs text-ast-faint">
            Image unavailable · rights protected — search the web to discover this
            artist&apos;s work.
          </p>
        </div>
      )}

      {entry.type === "studio_spotlight" && entry.imageUrl && (
        <Image
          src={entry.imageUrl}
          alt={entry.title}
          width={64}
          height={64}
          className="h-16 w-16 rounded-full border-2 border-ast-purple/50 object-cover"
        />
      )}

      {(detail?.title ?? (entry.type === "artist_quote" ? undefined : entry.title)) && (
        <h3 className="mt-3 text-lg font-bold text-white">
          {entry.type === "artist_quote" ? detail?.title : entry.title}
        </h3>
      )}

      {entry.type === "studio_spotlight" && (detail?.subtitle ?? entry.body) && (
        <p className="mt-1 text-sm text-ast-lavender">
          {detail?.subtitle ?? entry.body}
        </p>
      )}

      {(detail?.quote ?? (entry.type === "artist_quote" ? entry.title : null)) && (
        <blockquote className="mt-3 border-l-2 border-ast-blue/50 pl-4">
          <p className="text-lg font-semibold leading-snug text-ast-electric-blue">
            &ldquo;{detail?.quote ?? entry.title}&rdquo;
          </p>
          {entry.author && (
            <footer className="mt-2 text-sm text-ast-body/60">— {entry.author}</footer>
          )}
        </blockquote>
      )}

      {detail?.body && entry.type !== "studio_spotlight" && (
        <p className="mt-4 text-[13px] leading-relaxed text-ast-body/75">
          {detail.body}
        </p>
      )}

      {detail?.body && entry.type === "studio_spotlight" && (
        <p className="mt-3 text-[13px] leading-relaxed text-ast-body/75">
          {detail.body}
        </p>
      )}

      {entry.type === "partner" && entry.body && !detail?.body && (
        <p className="mt-3 text-[13px] leading-relaxed text-ast-body/75">
          {entry.body}
        </p>
      )}

      {detail?.artwork && (
        <p className="mt-4 text-sm font-medium text-ast-lavender">{detail.artwork}</p>
      )}

      {detail?.citation && (
        <p className="mt-2 text-xs italic leading-relaxed text-ast-faint">
          {detail.citation}
        </p>
      )}

      {detail?.rights && (
        <p className="mt-2 text-[11px] leading-relaxed text-ast-faint/80">
          {detail.rights}
        </p>
      )}

      {detail?.tags && detail.tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
          {detail.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-ast-purple/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-ast-lavender"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      {detail?.attribution && (
        <p className="mt-4 text-[11px] text-ast-faint">{detail.attribution}</p>
      )}

      {detail?.linkLabel && detail.linkUrl && (
        <a
          href={
            detail.linkUrl.startsWith("http") ? detail.linkUrl : `https://${detail.linkUrl}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm font-medium text-ast-cyan underline-offset-4 hover:underline"
        >
          {detail.linkLabel}
        </a>
      )}
    </section>
  );
}
