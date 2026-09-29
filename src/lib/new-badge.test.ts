/**
 * Session-scoped NEW badges (r31) — pins the live's measured badge
 * lifecycle contract.
 *
 * Until r31 the clone keyed its NEW badges off a 7-day createdAt window
 * (studio-domain's isNewItem). The r31 photo-state battery proved the
 * live's badges are SESSION-SCOPED instead: an item created during the
 * current SPA session badges (chip + detail h2, both families), and a
 * full page reload drops the badge — the live's post-reload chips and
 * detail headings render bare even seconds after the create. Decisive
 * measurements on the live 2026-09-28:
 *
 *   create -> badge true on the chip + detail h2 (t+6s, in-session)
 *   full reload -> badge false on every surface (the session died)
 *   a second in-session create -> badge true again
 *
 * The time-window hypothesis was eliminated: the badge dies with the
 * page session, not with elapsed time (a 6-second-old item unbadges on
 * reload while an 8-second-old item still badges without one).
 *
 * The replication: an in-memory registry of ids created this session
 * (module state — survives client-side navigation, dies on reload,
 * exactly like the live's SPA state). The four badge surfaces consult
 * isNewSessionItem(id); the two create flows mark the created id.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";

import {
  isNewSessionItem,
  markCreatedThisSession,
  resetSessionNewBadges,
} from "./new-badge";

const studioApp = readFileSync(
  join(process.cwd(), "src/components/studio/studio-app.tsx"),
  "utf8",
);
const projectsView = readFileSync(
  join(process.cwd(), "src/components/studio/projects-view.tsx"),
  "utf8",
);
const suppliesView = readFileSync(
  join(process.cwd(), "src/components/studio/supplies-view.tsx"),
  "utf8",
);
const projectDetail = readFileSync(
  join(process.cwd(), "src/components/studio/project-detail-panel.tsx"),
  "utf8",
);
const supplyDetail = readFileSync(
  join(process.cwd(), "src/components/studio/supply-detail-panel.tsx"),
  "utf8",
);

describe("session-scoped NEW badges (the live's badge lifecycle)", () => {
  beforeEach(() => {
    resetSessionNewBadges();
  });

  it("badges an id marked this session", () => {
    markCreatedThisSession("p1");
    expect(isNewSessionItem("p1")).toBe(true);
  });

  it("does not badge unmarked ids (seed rows never badge)", () => {
    markCreatedThisSession("p1");
    expect(isNewSessionItem("p2")).toBe(false);
    expect(isNewSessionItem("")).toBe(false);
  });

  it("drops every badge when the session resets (the live's reload)", () => {
    markCreatedThisSession("p1");
    markCreatedThisSession("s1");
    resetSessionNewBadges();
    expect(isNewSessionItem("p1")).toBe(false);
    expect(isNewSessionItem("s1")).toBe(false);
  });

  it("keeps the badge across (simulated) client-side navigation", () => {
    // Module state persists through client-side nav — no reset happens
    // until the page unloads. A second mark after unrelated traffic
    // must not disturb the first.
    markCreatedThisSession("p1");
    markCreatedThisSession("s1");
    expect(isNewSessionItem("p1")).toBe(true);
  });
});

describe("session badge wiring (the four surfaces + the create flows)", () => {
  it("the project chip keys its badge + pr-10 off the session registry", () => {
    // The chip's badge span gates on isNewSessionItem(project.id) and
    // the name's pr-10 is CONDITIONAL on the same predicate (measured
    // on the live: in-session "…leading-snug pr-10 text-ast_body",
    // post-reload the same class with an empty slot where pr-10 was).
    expect(projectsView).toContain("isNewSessionItem(project.id)");
    expect(projectsView).toMatch(
      /isNewSessionItem\(project\.id\) \? "pr-10 " : ""[\s\S]{0,80}?text-ast-body/,
    );
    // the time-window predicate is gone from the chip surface.
    expect(projectsView).not.toContain("isNewItem(project.createdAt)");
  });

  it("the supply chip keys its badge off the session registry", () => {
    // The supply chip keeps the live's established pr-12/pr-2 name
    // conditional but gates the badge itself on the session registry.
    expect(suppliesView).toContain("isNewSessionItem(supply.id)");
    expect(suppliesView).not.toContain("isNewItem(supply.createdAt)");
  });

  it("the project detail h2 keys its badge off the session registry", () => {
    expect(projectDetail).toContain("isNewSessionItem(project.id)");
    expect(projectDetail).not.toContain("isNewItem(project.createdAt)");
  });

  it("the supply detail h2 keys its badge off the session registry", () => {
    expect(supplyDetail).toContain("isNewSessionItem(supply.id)");
    expect(supplyDetail).not.toContain("isNewItem(supply.createdAt)");
  });

  it("both create flows mark the created id in the session registry", () => {
    // The project create path (the modal's onSaved append) and the
    // supply create path (handleSupplyCreated) each mark the created
    // dto's id — the only way an id enters the registry.
    expect(studioApp).toMatch(
      /onSaved=\{\(saved\) => \{[\s\S]{0,200}?markCreatedThisSession\(saved\.id\)/,
    );
    expect(studioApp).toMatch(
      /function handleSupplyCreated[\s\S]{0,400}?markCreatedThisSession\(supply\.id\)/,
    );
  });

  it("the time-window badge helper is gone from the domain", () => {
    // The live has no time window — the 7-day helper and its constant
    // are dead code once the registry lands and must not return.
    const domain = readFileSync(
      join(process.cwd(), "src/lib/studio-domain.ts"),
      "utf8",
    );
    expect(domain).not.toContain("NEW_BADGE_WINDOW_MS");
    expect(domain).not.toContain("export function isNewItem");
  });
});
