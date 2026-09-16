"use client";

/**
 * Inspiration view — "INSPIRATION / Feed": the three feed tabs (Today,
 * Art History, Inspire Me), artist-quote and studio-spotlight rails, and the
 * Today-in-Art-History / Partners blocks — mirroring the live app's
 * /inspiration page including its honest "coming soon" placeholder states.
 */
import Image from "next/image";
import { useState } from "react";

import type { InspirationEntryDto } from "@/lib/dto";

type FeedTab = "today" | "history" | "inspire";

interface InspirationViewProps {
  inspiration: InspirationEntryDto[];
}

export function InspirationView({ inspiration }: InspirationViewProps) {
  const quotes = inspiration.filter((e) => e.type === "artist_quote");
  const spotlights = inspiration.filter((e) => e.type === "studio_spotlight");
  const history = inspiration
    .filter((e) => e.type === "art_history" && e.date)
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  const partners = inspiration.filter((e) => e.type === "partner");

  return (
    <div className="studio-fade">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.35em] text-ast-lavender">Inspiration</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Feed</h1>
      </div>

      <FeedTabs history={history} />

      <section className="mt-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ast-turquoise">
          Artist Quotes
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {quotes.map((quote) => (
            <blockquote
              key={quote.id}
              className="rounded-2xl border border-ast-turquoise/25 bg-[#120724] p-5"
            >
              <p className="text-lg font-semibold leading-snug text-ast-blue">
                &ldquo;{quote.title}&rdquo;
              </p>
              {quote.author && (
                <footer className="mt-2 text-sm text-ast-body/60">— {quote.author}</footer>
              )}
              {quote.body && (
                <p className="mt-2 text-xs text-ast-faint">{quote.body}</p>
              )}
            </blockquote>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ast-pink">
          Studio Spotlight
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {spotlights.map((spotlight) => (
            <article
              key={spotlight.id}
              className="rounded-2xl border border-ast-pink/30 bg-[#120724] p-5"
            >
              <div className="flex items-center gap-3">
                {spotlight.imageUrl && (
                  <Image
                    src={spotlight.imageUrl}
                    alt={spotlight.title}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-full border-2 border-ast-purple/50 object-cover"
                  />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-ast-pink">
                    {spotlight.title}
                  </h3>
                  <p className="text-[13px] text-ast-body/60">{spotlight.body}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ast-pink">
          Today in Art History
        </h2>
        <article className="rounded-2xl border border-ast-purple/25 bg-[#120724] p-5">
          {(() => {
            const today = pickToday(history);
            if (!today) {
              return (
                <p className="text-sm text-ast-faint">The daily digest is on its way.</p>
              );
            }
            return (
              <>
                <p className="text-sm font-semibold text-ast-body">{today.title}</p>
                {today.author && (
                  <p className="mt-1 text-xs text-ast-lavender">{today.author}</p>
                )}
                {today.body && (
                  <p className="mt-2 text-[13px] leading-relaxed text-ast-body/70">
                    {today.body}
                  </p>
                )}
              </>
            );
          })()}
        </article>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ast-lavender">
          Partners
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {partners.map((partner) => (
            <article
              key={partner.id}
              className="rounded-2xl border border-ast-purple/25 bg-[#120724] p-5"
            >
              <p className="text-sm font-medium text-ast-lavender">{partner.title}</p>
              {partner.body && (
                <p className="mt-1 text-xs text-ast-faint">{partner.body}</p>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function FeedTabs({ history }: { history: InspirationEntryDto[] }) {
  const [tab, setTab] = useState<FeedTab>("today");

  return (
    <div>
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
            onClick={() => setTab(item.value)}
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

      <div className="mt-4">
        {tab === "today" && <TodayFeed history={history} />}
        {tab === "history" && <HistoryFeed history={history} />}
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
    </div>
  );
}

function TodayFeed({ history }: { history: InspirationEntryDto[] }) {
  const today = pickToday(history);
  if (!today) {
    return (
      <p className="rounded-2xl border border-ast-purple/25 bg-[#120724] p-6 text-sm text-ast-faint">
        Nothing scheduled for today — open Art History for the full timeline.
      </p>
    );
  }
  return (
    <article className="rounded-2xl border border-ast-purple/25 bg-[#120724] p-5">
      <p className="text-xs text-ast-faint">{today.date}</p>
      <p className="mt-1 text-sm font-semibold text-ast-body">{today.title}</p>
      {today.author && (
        <p className="mt-1 text-xs text-ast-lavender">{today.author}</p>
      )}
      {today.body && (
        <p className="mt-2 text-[13px] leading-relaxed text-ast-body/70">
          {today.body}
        </p>
      )}
    </article>
  );
}

function HistoryFeed({ history }: { history: InspirationEntryDto[] }) {
  if (history.length === 0) {
    return (
      <p className="rounded-2xl border border-ast-purple/25 bg-[#120724] p-6 text-sm text-ast-faint">
        The art history timeline is empty.
      </p>
    );
  }
  return (
    <ol className="space-y-3">
      {history.map((entry) => (
        <li
          key={entry.id}
          className="rounded-2xl border border-ast-purple/25 bg-[#120724] p-4"
        >
          <p className="text-xs text-ast-faint">{entry.date}</p>
          <p className="mt-1 text-sm font-semibold text-ast-body">{entry.title}</p>
          {entry.author && (
            <p className="mt-1 text-xs text-ast-lavender">{entry.author}</p>
          )}
        </li>
      ))}
    </ol>
  );
}

function pickToday(history: InspirationEntryDto[]): InspirationEntryDto | null {
  if (history.length === 0) return null;
  const now = new Date().toISOString().split("T")[0] ?? "";
  const past = history.filter((e) => (e.date ?? "") <= now);
  if (past.length > 0) return past[past.length - 1] ?? null;
  return history[0] ?? null;
}
