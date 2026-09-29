/**
 * Inspiration view fidelity — r35 source pins.
 *
 * The live's four inspiration detail panels were measured on 2026-09-29
 * (1280x800, logged in, DOM-probed + pixel-paired). They had never been
 * paired since the live's r33 redeploy; the round found the clone's
 * single shared panel component diverges from the live's per-type
 * contracts on every axis: chrome class, tag, mount point, inner
 * structure, tag chips, citation links, and the spotlight gallery.
 *
 * Live contracts (all class strings verbatim from the live DOM — the
 * ast_ underscore spellings are the live's; the clone's hyphen spellings
 * compute identical utilities):
 *
 * - QUOTE panel: `rounded-2xl border border-ast_turquoise/40
 *   bg-[#0d0420] p-5` — a plain <div>, NO top margin (it mounts inside
 *   the Artist Quotes section directly below the tile grid, gap 0).
 * - SPOTLIGHT panel: `rounded-2xl border border-ast_purple/50
 *   bg-[#0d0420] p-4 mt-3` — purple border, p-4 padding, mounts as its
 *   own child of the feed scroll container AFTER the whole spotlight
 *   section (the section header + tiles STAY visible), and the document
 *   scrolls the panel into view (scrollIntoView block "nearest").
 * - ART HISTORY panel: `rounded-2xl border border-ast_lavender/40
 *   bg-[#0d0420] p-5` — mounts as a direct child of the scroll container
 *   after the today/partners grid (Today tab) or the timeline grid
 *   (Art History tab) — NOT nested inside the grid.
 * - PARTNER panel: `rounded-2xl border border-ast_blue/40
 *   bg-[#0d0420] p-5` — a flat title+body card.
 * - Tag chips: `text-[10px] uppercase tracking-wide bg-ast_lavender/10
 *   text-ast_muted px-2 py-0.5 rounded-full` spans — the soft pill, not
 *   the scaffold's bordered li chips.
 * - The citation renders as an underlined external link
 *   (`text-xs text-ast-turquoise/80 … underline underline-offset-2`,
 *   target _blank) with the entry's citationUrl.
 * - The artwork caption composes three spans (title / " (year)" /
 *   " · author") from the artwork string.
 * - The spotlight panel carries the artwork gallery: a full-width
 *   object-contain image capped at max-height 16rem + a thumbnail
 *   selector (w-12 h-12 border-2 buttons, the selected one
 *   border-ast-turquoise/60) whenever the entry's gallery has more than
 *   one artwork.
 * - The imageless art-history panel renders the live's notice:
 *   "Image unavailable · rights protected — search the web to discover
 *   this artist's work." (italic text-ast-faint/60).
 * - The feed tabs are PLAIN buttons on the live (no role, no
 *   aria-selected — the clone's orphan role="tab" had no tablist parent
 *   and was invalid ARIA; removed r35).
 * - The quote tiles' aria-label STAYS (the live's gradient tiles are
 *   unnamed without it — the documented a11y addition, the aria-pressed
 *   class); the spotlight tiles' aria-label is GONE (redundant with the
 *   visible name label inside the tile).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const libDir = dirname(fileURLToPath(import.meta.url));
const view = readFileSync(
  join(libDir, "../components/studio/inspiration-view.tsx"),
  "utf8",
);
// Strip block comments so explanatory notes naming removed structures do
// not trip the negative pins.
const viewCode = view.replace(/\/\*[\s\S]*?\*\//g, "");

describe("panel chrome (the live's per-type contracts)", () => {
  it("renders the quote panel with the live's turquoise/40 p-5 chrome and no top margin", () => {
    expect(view).toContain(
      '"rounded-2xl border border-ast-turquoise/40 bg-[#0d0420] p-5"',
    );
  });

  it("renders the spotlight panel with the live's purple/50 p-4 mt-3 chrome", () => {
    expect(view).toContain(
      '"rounded-2xl border border-ast-purple/50 bg-[#0d0420] p-4 mt-3"',
    );
  });

  it("renders the art-history panel with the live's lavender/40 chrome", () => {
    expect(view).toContain(
      '"rounded-2xl border border-ast-lavender/40 bg-[#0d0420] p-5"',
    );
  });

  it("renders the partner panel with the live's blue/40 chrome", () => {
    expect(view).toContain(
      '"rounded-2xl border border-ast-blue/40 bg-[#0d0420] p-5"',
    );
  });

  it("renders every panel as a plain div (the live's DOM — no section/article wrappers)", () => {
    expect(view).toContain("<div className=");
    expect(viewCode).not.toContain("<section");
    expect(viewCode).not.toContain("<article");
  });
});

describe("panel mounts (the live's mount semantics)", () => {
  it("mounts the quote panel inside the Artist Quotes section below the tile grid with no margin class", () => {
    // The quotes section wrapper renders the panel after the tile grid;
    // the live's quote panel carries no mt (gap 0 below the grid).
    expect(view).toMatch(
      /\{activeEntry\?\.type === "artist_quote" && \(\s*<InspirationDetailPanel/,
    );
  });

  it("mounts the spotlight panel inside the section's ALWAYS-RENDERED wrapper div (r36)", () => {
    // Live DOM probe 2026-09-29: the spotlight section = [header P, tile
    // grid, PLAIN wrapper div] — the wrapper renders even when closed
    // (empty) and the panel mounts inside it. The r35 record ("feed-
    // container child after the whole section") was a mis-reading; the
    // difference is layout-neutral (margin collapse through the
    // zero-height wrapper) which is why every pixel pair converged.
    expect(view).toMatch(
      /<div ref=\{spotlightWrapperRef\}>\s*\{activeEntry\?\.type === "studio_spotlight" && \(/,
    );
  });

  it("renders no spacer div between the spotlight section and the today grid (r36)", () => {
    // The live's feed = [quotes-sec, spotlight-sec, today-grid] — no
    // extra empty child. The scaffold's <div /> spacer collapsed to
    // nothing (margins collapse through a zero-height div) but the DOM
    // contract differed.
    expect(viewCode).not.toContain("<div />");
  });

  it("mounts the history-tab panel after the timeline grid, not nested inside it (no col-span-2 wrapper)", () => {
    expect(viewCode).not.toContain('className="col-span-2"');
  });

  it("keeps the timeline grid's empty-state message (the col-span-2 empty state stays)", () => {
    expect(view).toContain("The art history timeline is empty.");
  });
});

describe("panel inner structure (the live's per-type layouts)", () => {
  it("renders the spotlight name as the live's turquoise bold base-size heading", () => {
    expect(view).toContain(
      '"font-bold text-ast-turquoise text-base leading-snug"',
    );
  });

  it("renders the spotlight handle line at the live's 10px muted pair", () => {
    expect(view).toContain(
      '"text-[10px] text-ast-muted mt-0.5 mb-2"',
    );
  });

  it("renders the spotlight bio at the live's text-xs body/65 pair", () => {
    expect(view).toContain('"text-xs text-ast-body/65 mb-2 leading-relaxed"');
  });

  it("renders the spotlight attribution at the live's 8px faint/50 pair", () => {
    expect(view).toContain('"mt-2 text-[8px] text-ast-faint/50 leading-snug"');
  });

  it("renders the art-history title as the live's base-size bold heading", () => {
    expect(view).toContain('"text-base font-bold text-ast-body mb-2 leading-snug"');
  });

  it("renders the art-history body at the live's text-sm body/75 pair", () => {
    expect(view).toContain('"text-sm text-ast-body/75 leading-relaxed"');
  });

  it("renders the live's image-unavailable notice for imageless history entries", () => {
    expect(view).toContain(
      "Image unavailable · rights protected — search the web to discover this artist's work.",
    );
    expect(view).toContain('"text-[10px] text-ast-faint/60 italic mb-3 leading-snug"');
  });

  it("renders the partner title in the live's #8D5CFF literal", () => {
    expect(view).toContain('"text-sm font-semibold text-[#8D5CFF] mb-1"');
  });

  it("renders the partner body at the live's text-xs body/55 pair", () => {
    expect(view).toContain('"text-xs text-ast-body/55 leading-relaxed"');
  });

  it("renders the partner header row with the live's mb-2 (not mb-3)", () => {
    expect(view).toContain('"mb-2 flex items-start justify-between"');
  });

  it("renders quote/history tag chips as the live's lavender soft pills capped at four", () => {
    expect(view).toContain(
      '"text-[10px] uppercase tracking-wide bg-ast-lavender/10 text-ast-muted px-2 py-0.5 rounded-full"',
    );
    // r36: the live's shared quote/history tag row renders
    // e.slice(0, 4) — at most four pills (bundle).
    expect(view).toContain(".slice(0, 4)");
    expect(viewCode).not.toContain("<li");
  });

  it("renders the SPOTLIGHT tag pills as the live's per-tag colored 9px pills (r36)", () => {
    // The live's spotlight tags: base `text-[9px] px-2 py-0.5
    // rounded-full ${tagColors[n]}` from a parallel data array — MIXED
    // CASE (no uppercase class), no tracking-wide, with a
    // faint-on-lavender/10 fallback when the data lacks a color. Kevin:
    // pink/purple/turquoise /20; Kim: turquoise/20, lavender/20,
    // faint lavender/10. The unified lavender family (the quote panels')
    // was the r35 mis-generalization — masked until now because the
    // pills sat below the fold in every prior paired capture.
    expect(view).toMatch(
      /`text-\[9px\] px-2 py-0\.5 rounded-full \$\{/,
    );
    expect(view).toContain('?? "text-ast-faint bg-ast-lavender/10"');
    expect(view).toContain("detail.tagColors");
  });

  it("renders the citation as the live's underlined external link", () => {
    expect(view).toContain(
      '"text-xs text-ast-turquoise/80 hover:text-ast-turquoise transition underline underline-offset-2"',
    );
    expect(view).toContain('target="_blank"');
  });

  it("renders the artwork caption as the live's composed span trio", () => {
    expect(view).toContain('"font-medium text-ast-body/80"');
    expect(view).toContain('splitArtworkCaption');
  });

  it("renders the rights line at the live's 10px muted/70 pair with its mt-1 gap", () => {
    // The live's citation stack carries space-y-1 whose TW3 margin-top on
    // the inline citation link is layout-INEFFECTIVE — the only rendered
    // gap is this line's own mt-1. TW4's space-y emits an effective
    // margin-bottom on the preceding block, so the clone drops the
    // stack's space-y and keeps the mt-1 as the measured 4px gap.
    expect(view).toContain(
      '"text-[10px] text-ast-muted/70 leading-snug mt-1"',
    );
    expect(view).not.toContain('"mt-3 space-y-1"');
  });

  it("renders the spotlight external link without underline at the live's /70 opacity, appending the arrow in JSX (r36)", () => {
    expect(view).toContain(
      '"text-xs text-ast-turquoise/70 hover:text-ast-turquoise transition"',
    );
    // r36: the live's link renders {websiteLabel} with the arrow
    // appended by the JSX (bundle: [e.websiteLabel ?? e.website, ` →`])
    // — the label itself carries no arrow.
    expect(view).toContain("{detail.linkLabel} →");
    expect(view).not.toContain("{detail.linkLabel}\"");
  });
});

describe("the spotlight gallery (r35, r36)", () => {
  it("renders the main artwork image with the live's classes (incl. ast-img-safe) and height cap", () => {
    // r36: the live's main img carries the extra `ast-img-safe` class
    // (a no-op in the clone — TW4 compiles nothing for it — kept for
    // the DOM class-string contract) and the per-artwork alt with the
    // entry-name fallback (bundle: alt: a.alt ?? e.name).
    expect(view).toContain(
      '"ast-img-safe w-full rounded-xl object-contain object-center mb-3"',
    );
    expect(view).toContain('maxHeight: "16rem"');
    expect(view).toMatch(/alt=\{[^\n]*\.alt \?\? entry\.title\}/);
  });

  it("renders the thumbnail selector with the live's button classes and PURPLE hover (r36)", () => {
    // r36: the live's unselected thumb hovers to ast_purple/40 (bundle),
    // not turquoise/40.
    expect(view).toContain(
      "w-12 h-12 shrink-0 rounded-lg overflow-hidden border-2 transition ",
    );
    expect(view).toContain('"border-ast-turquoise/60"');
    expect(view).toContain('"border-transparent hover:border-ast-purple/40"');
  });

  it("renders the thumb strip in the live's flex gap-2 mb-3 row", () => {
    expect(view).toContain('"flex gap-2 mb-3"');
  });

  it("keeps the selected-thumb state client-side (clicking a thumb swaps the artwork)", () => {
    expect(view).toMatch(/useState.*artwork|artwork.*useState/);
    expect(viewCode).not.toContain("scrollTo(");
  });

  it("scrolls the spotlight wrapper via the live's unified 60ms-debounced effect (r36)", () => {
    // The live's bundle: ONE effect keyed on the active id —
    // setTimeout(() => wrapper.scrollIntoView({behavior:'smooth',
    // block:'nearest'}), 60). The 60ms delay lets the artwork image size
    // before `nearest` computes; the clone's synchronous mount-time
    // panel scroll computed against the unsized image and landed 256px
    // short (measured: live scrollY 317 vs clone 63 on the Kim pair).
    // The wrapper always renders, so the INERT spotlight rail
    // navigation (no panel) still scrolls it — the live's own behavior.
    expect(view).toMatch(
      /setTimeout\(\(\) => \{\s*spotlightWrapperRef\.current\?\.scrollIntoView\(\{\s*behavior: "smooth",\s*block: "nearest",\s*\}\);\s*\}, 60\)/,
    );
    expect(viewCode).not.toMatch(/panelRef\.current\?\.scrollIntoView/);
  });
});

describe("feed tabs + tiles DOM contract (r35)", () => {
  it("renders the feed tabs as plain buttons (the live has no role/aria-selected)", () => {
    expect(viewCode).not.toContain('role="tab"');
    expect(viewCode).not.toContain("aria-selected");
  });

  it("keeps the quote tiles' aria-label (the documented a11y addition for unnamed gradient tiles)", () => {
    expect(view).toContain("Quote by");
  });

  it("drops the spotlight tiles' redundant aria-label (the tile's visible text already names it)", () => {
    expect(viewCode).not.toContain("aria-label={spotlight.title}");
  });

  it("keeps the panel close button's aria-label (the documented a11y addition)", () => {
    expect(view).toContain('"Close detail panel"');
  });
});

describe("selected-state contracts (r35 — the live marks the open tile)", () => {
  it("marks the open quote tile with the turquoise/60 border", () => {
    expect(view).toContain('"border-ast-turquoise/60"');
    expect(view).toContain(
      '"border-transparent hover:border-ast-turquoise/25"',
    );
  });

  it("takes the open spotlight tile's gradient to full opacity and drops its hover tokens", () => {
    expect(view).toContain(
      '"from-ast-electric-blue via-ast-purple to-ast-pink"',
    );
  });

  it("marks the open today/timeline card with lavender/60 + the white/10 ring", () => {
    expect(view).toContain('"border-ast-lavender/60 ring-1 ring-white/10"');
  });

  it("marks the open partner card with blue/60 + the white/10 ring", () => {
    expect(view).toContain('"border-ast-blue/60 ring-1 ring-white/10"');
  });

  it("keeps the unselected borders at the live's pairs", () => {
    expect(view).toContain('"border-ast-purple/40 hover:brightness-110"');
    expect(view).toContain('"border-ast-blue/20 hover:brightness-110"');
    expect(view).toContain('"border-ast-purple/30 hover:brightness-110"');
  });
});

describe("header accents (the live's per-type header colors)", () => {
  it("renders the quote header in turquoise", () => {
    expect(view).toContain("text-[10px] font-bold uppercase tracking-wider ");
  });

  it("renders the spotlight header in faint (not pink)", () => {
    expect(view).toContain('"text-ast-faint"');
    expect(viewCode).not.toContain('"text-ast-pink"');
  });
});
