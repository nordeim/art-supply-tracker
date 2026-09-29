import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * List-order fidelity pins (r33) — the live's insertion-order contract,
 * source-level complements to the behavioral pins in
 * src/actions/studio.test.ts ("list ordering").
 *
 * Measured on the deployed app 2026-09-29 (the r33 paired battery plus
 * the order probes):
 *
 *  - the live renders BOTH chip lists in INSERTION order — no timestamp
 *    sort at all. UI creates Ok -> Low -> Out render Ok, Low, Out (the
 *    newest item LAST);
 *  - edits never float or sink an item (updatedAt-keyed sorts ruled out
 *    in both directions — editing the first, second, or newest item
 *    never moves it);
 *  - an import whose first row carries the NEWER payload stamp renders
 *    that row FIRST — a createdAt sort would have surfaced the 2010
 *    stamp first, so the backend order (natural row order) is rendered
 *    verbatim.
 *
 * Two layers must cooperate: the QUERIES (no orderBy — see the pins in
 * studio.test.ts) and the IN-SESSION create handlers (append, never
 * prepend — this file). The sidebar's "recently touched" rail is a
 * separate updatedAt-DESC contract pinned in sidebar-tile-fidelity.
 */

const root = resolve(__dirname, "../..");

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("list-order source pins (r33: insertion order, both layers)", () => {
  const actions = read("src/actions/studio.ts");
  const app = read("src/components/studio/studio-app.tsx");

  it("the list queries carry NO orderBy — natural row order renders verbatim", () => {
    // The live's backend returns natural order and the app renders it as
    // returned; the r32-era updatedAt-desc inverted every UI-created row
    // relative to the live.
    expect(actions).not.toContain('orderBy: { updatedAt: "desc" }');
  });

  it("a created supply APPENDS — the newest chip renders last", () => {
    // The live's post-create list shows the created item at the END
    // (the battery's live capture: Ok, Low, Out with Out created last).
    expect(app).toContain("setSupplyList((list) => [...list, supply])");
    expect(app).not.toContain("setSupplyList((list) => [supply, ...list])");
  });

  it("a created project APPENDS — the same contract on the projects side", () => {
    expect(app).toContain("setProjectList((list) => [...list, saved])");
    expect(app).not.toContain("setProjectList((list) => [saved, ...list])");
  });

  it("the sidebar's recently-touched rail keeps its own updatedAt-DESC contract", () => {
    // A separate measured surface (r28): the rail sorts by updatedAt
    // descending regardless of the list order — do not "simplify" it to
    // share the insertion-order lists.
    const sidebar = read("src/components/studio/studio-sidebar.tsx");
    expect(sidebar).toContain("(b.updatedAt ?? \"\").localeCompare(a.updatedAt ?? \"\")");
  });
});
