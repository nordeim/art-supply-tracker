/**
 * Photo-surface fidelity (r30) — pins the live's measured photo rendering
 * contracts across every surface that displays or manages photos.
 *
 * The whole photo family was UNMEASURED until r30: the live account ships
 * an empty studio (0 projects / 0 supplies), so no prior round ever drove
 * a photo upload on either side. r30 probed both sides with real uploads
 * (temp rows created and deleted through the UI on the live — the 0/0/15
 * pristine contract holds) and measured six divergences; this file pins
 * the four that live in the photo surfaces themselves (the other two are
 * the login tab wrap, pinned in viewport-fidelity, and the 30-photo cap,
 * pinned here + re-measured in validation.test.ts).
 *
 * Measured on the live 2026-09-28 at 320x844:
 *
 *   surface                | live chrome
 *   -----------------------+----------------------------------------------
 *   dashboard Spotlight    | img w-14 h-14 rounded-full object-cover
 *   portrait               |   border-ast_pink/30 + shrink-0 — the
 *                          |   shrink-0 is LOAD-BEARING: without it the
 *                          |   flex row (portrait + gap-3 + the Kevin
 *                          |   Lewis text column) squeezes the portrait
 *                          |   to the text column's min-content leftover
 *                          |   (56 -> 49.59px at 320, 55 at 340, whole
 *                          |   only from 360) — ~3700 hot px on the
 *                          |   paired dashboard capture
 *   supply modal preview   | the add-photo tile is REPLACED by the
 *                          |   preview in the same slot: img w-16 h-16
 *                          |   rounded-xl object-cover border
 *                          |   border-ast_pink/30 (64px, NOT 56) + the
 *                          |   x button absolute -top-1 -right-1 w-5 h-5
 *                          |   rounded-full bg-black/60 text-white
 *                          |   text-xs (glyph x) — not the coral corner
 *                          |   float the clone invented
 *   project modal + edit   | the counter label "Photos (N/30)"; the tile
 *   panel photo area       |   relabels "Add more" once photos exist and
 *                          |   DISAPPEARS at 30/30 (overflow silently
 *                          |   dropped); thumbs render as a
 *                          |   grid grid-cols-5 gap-2 mb-3 of fluid
 *                          |   w-full aspect-square rounded-lg
 *                          |   object-cover border-ast_turquoise/20
 *                          |   imgs in div.relative.group wrappers, the
 *                          |   x INSIDE each thumb (absolute top-0.5
 *                          |   right-0.5, bg-black/60) and a "cover"
 *                          |   badge on the first thumb (absolute
 *                          |   bottom-0.5 left-0.5, text-[9px]
 *                          |   bg-black/60 text-ast-turquoise)
 *   project chip           | img h-10 w-10 shrink-0 rounded-lg
 *                          |   object-cover opacity-85 (40px) inside the
 *                          |   chip's flex min-w-0 items-start gap-2
 *                          |   mb-2 header row, BEFORE the name
 *
 * Verified MATCHING before this round (no pins needed — do not "fix"):
 * the project detail panel's w-24 h-24 well + grid-cols-5 /20 purple
 * thumbs + the Images (N) label rendered only when length > 1; the supply
 * detail panel's w-32 h-32 photo under its "Photo" label; the supply
 * chip's w-full h-16 object-cover rounded-xl mb-2 banner; the fresh
 * modals' geometry and the add-photos tile's own classes.
 *
 * The live's photos are S3 URLs (Amplify storage) and the clone's are
 * data URLs — an accepted architectural divergence (ADR-002's
 * self-contained stack); only the RENDERING is pinned here.
 *
 * The negative-pin tokens below are constructed at runtime from
 * non-utility fragments — TW4's automatic content detection scans test
 * sources too, and a complete class-shaped token in a string would
 * compile the dead utility straight back into the app's CSS (the r20
 * css-hygiene lesson; the coral button token goes dead when the last
 * coral-chrome consumer is removed by this round).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const libDir = dirname(fileURLToPath(import.meta.url));

const dashboard = readFileSync(
  join(libDir, "../components/studio/dashboard-view.tsx"),
  "utf8",
);
const supplyModal = readFileSync(
  join(libDir, "../components/studio/supply-modal.tsx"),
  "utf8",
);
const projectModal = readFileSync(
  join(libDir, "../components/studio/project-modal.tsx"),
  "utf8",
);
const projectEdit = readFileSync(
  join(libDir, "../components/studio/project-edit-panel.tsx"),
  "utf8",
);
const projectsView = readFileSync(
  join(libDir, "../components/studio/projects-view.tsx"),
  "utf8",
);
const studioDomain = readFileSync(join(libDir, "studio-domain.ts"), "utf8");
const validation = readFileSync(join(libDir, "validation.ts"), "utf8");
const nextConfig = readFileSync(
  join(libDir, "../../next.config.ts"),
  "utf8",
);

/** The old coral remove-button chrome, assembled at runtime (docblock). */
const coralBgToken = ["bg", "ast", "coral"].join("-");

describe("photo-surface pins (r30: the never-measured photo family)", () => {
  it("keeps shrink-0 on the dashboard Spotlight portrait (the flex-squeeze guard)", () => {
    // Measured on the live at 320: the portrait renders a CONSTANT 56px
    // (w-14) because it carries shrink-0 — the live's own utility. The
    // clone's flex row shares the r14 sizing with the live but omitted
    // the guard, so at <=355px viewports the text column's min-content
    // claims the portrait's width.
    expect(dashboard).toContain(
      'className="h-14 w-14 shrink-0 rounded-full border border-ast-pink/30 object-cover"',
    );
  });

  it("replaces the supply modal's add-photo tile with the preview (the live's tile-swap)", () => {
    // The live does NOT keep the tile next to a separate preview: with a
    // photo attached, the tile's slot renders the preview directly —
    // img w-16 h-16 (64px; the 56px h-14 was an unmeasured guess) with
    // the x button floating at -top-1 -right-1 in bg-black/60.
    expect(supplyModal).toMatch(
      /\{photo \? \(\s*<div className="relative">[\s\S]{0,600}?w-16 h-16 rounded-xl border border-ast-pink\/30 object-cover/,
    );
    expect(supplyModal).toContain(
      '"absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white text-xs"',
    );
    // the old chrome is negative-pinned: the 56px below-the-tile preview
    // and the coral corner float were clone inventions.
    expect(supplyModal).not.toContain(
      '"h-14 w-14 rounded-xl border border-ast-pink/30 object-cover"',
    );
    expect(supplyModal).not.toContain(coralBgToken);
  });

  it("renders the project modal's photo area as the live's counter + 5-col grid", () => {
    // The counter label + the tile's relabel/disappear contract.
    expect(projectModal).toContain(
      "Photos ({photos.length}/{MAX_PROJECT_PHOTOS})",
    );
    expect(projectModal).toContain(
      '{photos.length === 0 ? "Add photos" : "Add more"}',
    );
    expect(projectModal).toContain("{photos.length < MAX_PROJECT_PHOTOS && (");
    // the thumbs: a 5-column grid (not a flex-wrap list) of fluid
    // aspect-square thumbs at the live's /20 border, x INSIDE each thumb.
    expect(projectModal).toContain('className="mb-3 grid grid-cols-5 gap-2"');
    expect(projectModal).toContain(
      '"aspect-square w-full rounded-lg border border-ast-turquoise/20 object-cover"',
    );
    expect(projectModal).toContain(
      '"absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white text-xs"',
    );
    // the first thumb's "cover" badge.
    expect(projectModal).toContain(
      '"absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 text-[9px] leading-tight text-ast-turquoise"',
    );
    expect(projectModal).toMatch(/text-ast-turquoise">\s*cover\s*<\/span>/);
  });

  it("renders the project edit panel's photo area with the same contract", () => {
    // The live's edit panel renders the identical photo area (measured
    // with 2 photos: the counter label, "Add more" tile, the 5-col grid
    // with the inside-x thumbs).
    expect(projectEdit).toContain(
      "Photos ({photos.length}/{MAX_PROJECT_PHOTOS})",
    );
    expect(projectEdit).toContain(
      '{photos.length === 0 ? "Add photos" : "Add more"}',
    );
    expect(projectEdit).toContain("{photos.length < MAX_PROJECT_PHOTOS && (");
    expect(projectEdit).toContain('className="mb-3 grid grid-cols-5 gap-2"');
    expect(projectEdit).toContain(
      '"aspect-square w-full rounded-lg border border-ast-turquoise/20 object-cover"',
    );
    expect(projectEdit).toContain(
      '"absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white text-xs"',
    );
  });

  it("renders the project chip's photo thumbnail (the live's 40px header thumb)", () => {
    // The live's project chip (the grid-cols-3 card) renders the first
    // photo as an h-10 w-10 rounded-lg thumb at 85% opacity AFTER the
    // name in the chip's flex min-w-0 items-start gap-2 mb-2 header row
    // (measured on the live: name x58 w40, img x106 — the thumb is the
    // row's SECOND child). The clone rendered no thumb at all.
    expect(projectsView).toContain(
      '"h-10 w-10 shrink-0 rounded-lg object-cover opacity-85"',
    );
    // the ORDER: the row renders the name first, then the thumb (the
    // img is the row's SECOND child — name x58, img x106 on the live).
    expect(projectsView).toMatch(
      /leading-snug \$\{[\s\S]{0,120}?\{project\.name\}[\s\S]{0,600}?h-10 w-10 shrink-0 rounded-lg object-cover opacity-85/,
    );
  });

  it("caps project photos at the live's 30 (the (N/30) contract)", () => {
    // The live's own counter displays (N/30) and its tile disappears at
    // 30/30 — the cap is 30, not the clone's 10. The constant lives in
    // studio-domain.ts (the single-source pattern) and every consumer
    // (both Zod schemas, both panels' slice) reads it.
    expect(studioDomain).toContain("MAX_PROJECT_PHOTOS = 30");
    expect(validation).toContain(".max(MAX_PROJECT_PHOTOS)");
    expect(projectModal).toContain(
      "slice(0, MAX_PROJECT_PHOTOS - photos.length)",
    );
    expect(projectEdit).toContain(
      "slice(0, MAX_PROJECT_PHOTOS - photos.length)",
    );
  });

  it("raises the Server Action body cap to carry 30 data-URL photos (the live has no such limit)", () => {
    // Found the hard way (r30): a 30-photo submit through the real UI
    // answered "Body exceeded 1 MB limit" — Next's default action body
    // cap. The live uploads its photos to S3 OUTSIDE the form save, so
    // it never hits a transport limit; the clone carries the same
    // photos as data URLs inside the action payload, so the transport
    // must cover the full pinned contract: 30 x MAX_PHOTO_DATA_URL_
    // LENGTH (400k chars) + JSON slack -> 12mb.
    expect(nextConfig).toContain('bodySizeLimit: "12mb"');
  });
});
