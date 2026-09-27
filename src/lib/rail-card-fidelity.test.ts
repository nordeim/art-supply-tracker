/**
 * Rail-card fidelity (r28) — pins the PARTNERS rail card's text chrome in
 * BOTH of its renderings.
 *
 * The live renders the inspiration rail TWICE with DIFFERENT type scales
 * (its twin-copy structure — the sidebar drawer's rail and the
 * inspiration view's rail are separate components there; the clone has
 * two real components too, mirroring the split):
 *
 *  - SIDEBAR/DRAWER copy (measured 2026-09-27 at 390×844, drawer open):
 *    the Partners card's title P is `text-xs font-semibold text-[#8D5CFF]`
 *    with NO leading class — text-xs's own 12px/16px pair (line-height
 *    16px). The QUOTE and ART-HISTORY cards DO carry leading-snug
 *    (16.5px) on their titles — the live's own inconsistency, faithfully
 *    cloned — but the Partners card does not. The clone had added
 *    `leading-snug` there (16.5px), pushing its body line 0.5px down and
 *    re-anti-aliasing both text rows (the sidebar-drawer capture's
 *    y700-780 band, 4.5% concentrated in the text rows).
 *
 *  - INSPIRATION-VIEW copy (measured the same session, Feed tab, mobile):
 *    the Partners card's body P is `text-[11px] … leading-snug` —
 *    11px/15.125px. The ART-HISTORY card's author P already used
 *    text-[11px]; the clone's Partners body had text-[10px] (13.75px
 *    line). The 2.75px shorter body made the vertically-centered P-stack
 *    sit 1.375px lower (measured: P1 gap from card top 24.4375 live vs
 *    25.8125 clone — exactly half the height delta), shifting EVERY text
 *    row in the card (the inspiration-mobile capture's y560-660 band).
 *
 * Both defects are invisible to any steady-state battery that doesn't
 * diff the rail cards at text-row tolerance — pinned here so they cannot
 * drift again.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const libDir = dirname(fileURLToPath(import.meta.url));

function read(relative: string): string {
  return readFileSync(join(libDir, relative), "utf8");
}

describe("sidebar rail Partners-card pins (r28: the live's 12px/16px title)", () => {
  const sidebar = read("../components/studio/studio-sidebar.tsx");

  it("renders the Partners title at text-xs's own 16px line-height — no leading-snug", () => {
    // The live's drawer copy: `text-xs font-semibold text-[#8D5CFF]` —
    // the ONLY rail title without a leading class (its own quirk; the
    // Quote/Art-History titles DO carry leading-snug on both sides).
    const title = sidebar.match(
      /className="(text-xs font-semibold[^"]*text-\[#8D5CFF\][^"]*)"/,
    )?.[1];
    expect(title).toBeDefined();
    expect(title).not.toContain("leading-snug");
    expect(title).toContain("text-xs");
    expect(title).toContain("font-semibold");
    expect(title).toContain("text-[#8D5CFF]");
  });

  it("keeps the Partners body at the live's 10px/13.75px pair", () => {
    const body = sidebar.match(
      /className="(mt-1 text-\[10px\][^"]*text-ast-body\/55[^"]*)"/,
    )?.[1];
    expect(body).toBeDefined();
    expect(body).toContain("leading-snug");
    expect(body).toContain("text-[10px]");
  });
});

describe("inspiration-view rail Partners-card pins (r28: the live's 11px body)", () => {
  const view = read("../components/studio/inspiration-view.tsx");

  it("renders the Partners body at the live's 11px/15.125px pair", () => {
    // The live's inspiration-view copy: `text-[11px] text-ast_body/55
    // mt-1 leading-snug` — the same scale as the Art-History card's
    // author line. The 10px variant is negative-pinned: it shortens the
    // centered stack 2.75px and drops every row 1.375px.
    const body = view.match(
      /className="(mt-1 text-\[(\d+)px\] leading-snug text-ast-body\/55)"/,
    );
    expect(body).toBeDefined();
    expect(body?.[2]).toBe("11");
    // The Art-History author line keeps the same 11px scale.
    const author = view.match(
      /className="(mt-1 text-\[11px\] leading-snug text-ast-body\/55 line-clamp-1)"/,
    )?.[1];
    expect(author).toBeDefined();
  });

  it("renders the Partners title at the live's text-sm/19.25px pair", () => {
    const title = view.match(
      /className="(text-sm font-semibold leading-snug text-\[#8D5CFF\] line-clamp-2)"/,
    )?.[1];
    expect(title).toBeDefined();
  });
});
