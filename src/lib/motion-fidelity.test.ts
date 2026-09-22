/**
 * Motion-contract fidelity — r17 file-content pins.
 *
 * Why a file-content test (the focus-fidelity pattern): the motion parity
 * contract lives in source-level facts that steady-state captures cannot
 * see. The live app was probed on 2026-09-23 at CSSOM, computed-style, and
 * animating-element level (the r17 motion sweep — the probe dimension first
 * suggested in session 26's close-out):
 *
 * - ENTRY ANIMATIONS (r17-F1): the live's compiled CSS carries NO studio
 *   animations — its CSSOM holds exactly five @keyframes, ALL Amplify-
 *   internal (amplify-loader-circular / -linear, amplify-placeholder-
 *   loading, amplify-liveness-animation-fadeout, TW3 spin), none targeting
 *   a studio surface. Its view wrappers, detail panels, modals, and login
 *   card all compute `animation: none`, and a steady-state sweep finds ZERO
 *   animating elements. The clone's scaffold had shipped `@keyframes
 *   studio-fade-in` + `.studio-fade` (300ms fade + translateY(8px),
 *   cubic-bezier(0.22, 1, 0.36, 1)) on THIRTEEN surfaces — every view
 *   switch, chip-panel open, edit-panel swap, modal mount, and the login
 *   card played a fade-and-slide the live never shows (present since the
 *   initial scaffold commit, invisible in every prior steady-state pixel
 *   diff — the same "invisible in captures" class as r13-F1's hovers and
 *   r15-F1's focus ring). The clone even carried a prefers-reduced-motion
 *   guard for an animation the live does not have. The fix removes the
 *   keyframes, the utility rule, the reduced-motion guard, and all 13
 *   usage-site class references — views render instantly, like the live.
 *
 * - WHAT STAYS (the live's real motion contract): the drawers' 0.3s slide
 *   (`transition-transform duration-300` — pinned by the E2E mobile
 *   suite and probed at parity again this session: both drawers animate
 *   out over 0.3s with identical geometry) and the TW3/TW4 `transition`
 *   utility's 0.15s color/bg/border hover tints (the visible subset is
 *   identical on both sides). The positive pins below guard the drawer
 *   classes against over-removal.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const libDir = dirname(fileURLToPath(import.meta.url));
const globalsCssRaw = readFileSync(join(libDir, "../app/globals.css"), "utf8");
// Strip CSS comments so docblocks that DOCUMENT a removed rule do not
// satisfy (or trip) the negative pins — the pins target live declarations.
const globalsCss = globalsCssRaw.replace(/\/\*[\s\S]*?\*\//g, "");

const studioDir = join(libDir, "../components/studio");
const studioApp = readFileSync(join(studioDir, "studio-app.tsx"), "utf8");
const studioSidebar = readFileSync(join(studioDir, "studio-sidebar.tsx"), "utf8");

/** Every studio component that had carried the studio-fade class (r17 census). */
const fadedSurfaces: Array<[name: string, file: string]> = [
  ["dashboard view", "dashboard-view.tsx"],
  ["projects view", "projects-view.tsx"],
  ["supplies view", "supplies-view.tsx"],
  ["inspiration view (wrapper)", "inspiration-view.tsx"],
  ["studio view container", "studio-app.tsx"],
  ["project detail panel", "project-detail-panel.tsx"],
  ["project edit panel", "project-edit-panel.tsx"],
  ["project create modal", "project-modal.tsx"],
  ["supply detail panel", "supply-detail-panel.tsx"],
  ["supply edit panel", "supply-edit-panel.tsx"],
  ["supply create modal", "supply-modal.tsx"],
  ["login card", "login-screen.tsx"],
];

describe("entry animations (r17-F1 — the live renders studio surfaces instantly)", () => {
  it("globals.css declares no @keyframes (the live's five are all Amplify-internal)", () => {
    expect(globalsCss).not.toContain("@keyframes");
  });

  it("globals.css declares no .studio-fade utility rule", () => {
    expect(globalsCss).not.toContain(".studio-fade");
  });

  it("globals.css carries no prefers-reduced-motion guard (nothing left to guard)", () => {
    expect(globalsCss).not.toContain("prefers-reduced-motion");
  });

  it("documents the motion-parity contract", () => {
    expect(globalsCssRaw).toContain("r17 motion parity");
  });
});

describe("usage sites (all 13 scaffold references stripped)", () => {
  for (const [name, file] of fadedSurfaces) {
    it(`the ${name} (${file}) carries no studio-fade class`, () => {
      const source = readFileSync(join(studioDir, file), "utf8");
      expect(source).not.toContain("studio-fade");
    });
  }
});

describe("the live's real motion contract stays intact", () => {
  it("the sidebar drawer keeps its 0.3s slide transition", () => {
    expect(studioSidebar).toContain("transition-transform duration-300");
  });

  it("the chat drawer keeps its 0.3s slide transition", () => {
    expect(studioApp).toContain("transition-transform duration-300");
  });
});
