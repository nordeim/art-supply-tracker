"use client";

/**
 * Inspiration view — "INSPIRATION / Feed": the three feed tabs (Today,
 * Art History, Inspire Me). The Today tab mirrors the live app's interactive
 * rails: a grid of quote gradient tiles (each opens the QUOTE OF THE DAY
 * panel with artwork, citation, rights, and tags), gradient-framed Studio
 * Spotlight portrait tiles (bio, handle, tags, attribution, link), the
 * Today-in-Art-History card with its gradient thumb, and the Partners
 * card. Art History lists the dated timeline in a 2-column grid; Inspire
 * Me renders the live "Discovery Mode" placeholder. Panels render inline
 * directly below their section, exactly like the beta.
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
  const [activeId, setActiveId] = useState<string | null>(null);

  const quotes = inspiration.filter((e) => e.type === "artist_quote");
  const spotlights = inspiration.filter((e) => e.type === "studio_spotlight");
  const history = inspiration
    .filter((e) => e.type === "art_history" && e.date)
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  const partners = inspiration.filter((e) => e.type === "partner");
  const today = pickToday(history);
  const activeEntry = inspiration.find((e) => e.id === activeId) ?? null;

  return (
    <div className="studio-fade flex h-full flex-col">
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
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            onClick={() => {
              setTab(item.value);
              setActiveId(null);
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
                {quotes.map((quote) => (
                  <button
                    key={quote.id}
                    type="button"
                    onClick={() => setActiveId(activeId === quote.id ? null : quote.id)}
                    aria-label={`Quote by ${quote.author ?? quote.title}`}
                    className="aspect-square w-full overflow-hidden rounded-2xl border-2 border-transparent transition hover:border-ast-turquoise/25"
                  >
                    <div className="h-full w-full bg-gradient-to-br from-ast-turquoise/25 via-ast-lavender/20 to-ast-purple/25" />
                  </button>
                ))}
              </div>
              {activeEntry?.type === "artist_quote" && (
                <InspirationDetailPanel
                  entry={activeEntry}
                  onClose={() => setActiveId(null)}
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
                    className="rounded-2xl bg-gradient-to-br from-ast-electric-blue/70 via-ast-purple/70 to-ast-pink/60 p-1 transition hover:from-ast-electric-blue/90 hover:via-ast-purple/90 hover:to-ast-pink/80"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveId(activeId === spotlight.id ? null : spotlight.id)}
                      aria-label={spotlight.title}
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
              {activeEntry?.type === "studio_spotlight" && (
                <InspirationDetailPanel
                  entry={activeEntry}
                  onClose={() => setActiveId(null)}
                />
              )}
            </div>

            <div />

            <div className="grid grid-cols-2 gap-3">
              {today && (
                <button
                  type="button"
                  onClick={() => setActiveId(activeId === today.id ? null : today.id)}
                  className="w-full rounded-2xl border border-ast-purple/40 bg-[#120724] p-4 text-left transition hover:brightness-110"
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
                    <div
                      aria-hidden="true"
                      className="h-14 w-14 shrink-0 rounded-xl bg-gradient-to-br from-ast-purple/20 via-ast-lavender/15 to-ast-blue/20"
                    />
                  </div>
                </button>
              )}
              {partners.map((partner) => (
                <button
                  key={partner.id}
                  type="button"
                  onClick={() => setActiveId(activeId === partner.id ? null : partner.id)}
                  className="w-full rounded-2xl border border-ast-blue/20 bg-[#120724] p-4 text-left transition hover:brightness-110"
                >
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ast-lavender">
                    Partners
                  </p>
                  <p className="text-sm font-semibold leading-snug text-[#8D5CFF] line-clamp-2">
                    {partner.title}
                  </p>
                  {partner.body && (
                    <p className="mt-1 text-[10px] leading-snug text-ast-body/55">
                      {partner.body}
                    </p>
                  )}
                </button>
              ))}
            </div>
            {(activeEntry?.type === "art_history" || activeEntry?.type === "partner") && (
              <InspirationDetailPanel
                entry={activeEntry}
                onClose={() => setActiveId(null)}
              />
            )}
          </>
        )}

        {tab === "history" && (
          <div className="grid grid-cols-2 gap-3">
            {history.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setActiveId(activeId === entry.id ? null : entry.id)}
                className="w-full rounded-2xl border border-ast-purple/30 bg-[#120724] p-4 text-left transition hover:brightness-110"
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
                  <div
                    aria-hidden="true"
                    className="h-14 w-14 shrink-0 rounded-xl bg-gradient-to-br from-ast-purple/20 via-ast-lavender/15 to-ast-blue/20"
                  />
                </div>
              </button>
            ))}
            {history.length === 0 && (
              <p className="col-span-2 rounded-2xl border border-ast-purple/25 bg-[#120724] p-6 text-sm text-ast-faint">
                The art history timeline is empty.
              </p>
            )}
            {activeEntry?.type === "art_history" && (
              <div className="col-span-2">
                <InspirationDetailPanel
                  entry={activeEntry}
                  onClose={() => setActiveId(null)}
                />
              </div>
            )}
          </div>
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

/** Section accent per entry type — mirrors the live panels' header colors. */
const PANEL_ACCENT: Record<InspirationEntryDto["type"], string> = {
  artist_quote: "text-ast-turquoise",
  studio_spotlight: "text-ast-pink",
  art_history: "text-ast-lavender",
  partner: "text-ast-lavender",
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
      aria-label={PANEL_HEADER[entry.type]}
      className="mt-3 rounded-2xl border border-ast-turquoise/40 bg-[#0d0420] p-5 studio-fade"
    >
      <div className="mb-3 flex items-start justify-between">
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
          aria-label="Close detail panel"
          className="shrink-0 text-sm leading-none text-ast-faint transition hover:text-ast-body"
        >
          ✕
        </button>
      </div>

      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          {entry.type === "artist_quote" && (
            <>
              {detail?.title && (
                <h3 className="mb-2 text-sm font-semibold leading-snug text-ast-body/80">
                  {detail.title}
                </h3>
              )}
              <blockquote className="bg-gradient-to-r from-ast-lavender to-ast-turquoise bg-clip-text text-xl font-medium italic leading-relaxed text-transparent">
                &ldquo;{detail?.quote ?? entry.title}&rdquo;
              </blockquote>
              {entry.author && (
                <p className="mt-2 text-xs text-ast-muted">— {entry.author}</p>
              )}
            </>
          )}

          {entry.type !== "artist_quote" && (
            <h3 className="mb-2 text-sm font-semibold leading-snug text-ast-body/80">
              {entry.title}
            </h3>
          )}

          {entry.type === "studio_spotlight" && (detail?.subtitle ?? entry.body) && (
            <p className="mb-2 text-xs text-ast-body/55">{detail?.subtitle ?? entry.body}</p>
          )}

          {entry.type !== "studio_spotlight" && detail?.body && (
            <p className="mt-2 text-sm leading-relaxed text-ast-body/70">{detail.body}</p>
          )}

          {entry.type === "partner" && !detail?.body && entry.body && (
            <p className="mt-2 text-sm leading-relaxed text-ast-body/70">{entry.body}</p>
          )}

          {detail?.artwork && (
            <p className="mt-3 text-xs text-ast-muted">
              <span className="font-medium text-ast-body/80">{detail.artwork}</span>
            </p>
          )}

          {detail?.citation && (
            <p className="mt-1 text-xs leading-relaxed text-ast-muted">
              {detail.citation}
            </p>
          )}

          {detail?.rights && (
            <p className="mt-1 text-xs leading-relaxed text-ast-muted">{detail.rights}</p>
          )}

          {detail?.tags && detail.tags.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tags">
              {detail.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-ast-purple/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ast-lavender"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}

          {detail?.attribution && (
            <p className="mt-3 text-[11px] text-ast-faint">{detail.attribution}</p>
          )}

          {detail?.linkLabel && detail.linkUrl && (
            <a
              href={
                detail.linkUrl.startsWith("http") ? detail.linkUrl : `https://${detail.linkUrl}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-xs text-ast-turquoise/80 underline underline-offset-2 transition hover:text-ast-turquoise"
            >
              {detail.linkLabel}
            </a>
          )}
        </div>

        {entry.type === "studio_spotlight" && entry.imageUrl && (
          <Image
            src={entry.imageUrl}
            alt={entry.title}
            width={96}
            height={96}
            unoptimized
            className="h-24 w-24 shrink-0 rounded-xl border border-ast-purple/40 object-cover"
          />
        )}
      </div>
    </section>
  );
}
