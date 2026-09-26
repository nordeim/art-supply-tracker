/**
 * Login-motion fidelity — r20 file-content pins.
 *
 * Why a file-content test (the focus/motion-fidelity pattern): the login
 * card's transition contract is invisible in every steady-state capture —
 * transitions only render during state changes — which is exactly why it
 * survived nineteen parity rounds undetected. The r20 media-rule sweep
 * (the probe dimension queued in session_32) measured the live's login
 * chrome on 2026-09-23 at computed-style level:
 *
 * - BASE SPEC: every Amplify login element computes
 *   `transition: all 0.25s ease 0s` — the INACTIVE tab, every input, the
 *   eye toggle, every submit button, every link button (Forgot / Back to
 *   Sign In / Resend Code), and the alert's Dismiss button. The ACTIVE
 *   tab computes `transition-property: none` (Amplify's active-tab
 *   override; duration/timing stay 0.25s/ease — a no-op either way).
 *   The clone had the TW `transition` utility's 0.15s
 *   cubic-bezier(0.4,0,0.2,1) on the tabs/eye/submits and NOTHING on the
 *   inputs/link buttons/Dismiss — a user-experienced transient divergence
 *   (the live's input focus border fades 250ms; the clone's snapped).
 *
 * - REDUCED-MOTION GUARD: the live carries five prefers-reduced-motion
 *   rules (the r17 inventory, which counted @keyframes only, missed
 *   them). The rendered one: `.amplify-button { transition: none }` —
 *   under emulation the eye toggle, submits, link buttons, and Dismiss
 *   stop transitioning on the live while the clone's kept fading. The
 *   other four are dead on both sides (two loader rules + one placeholder
 *   rule — no loader/placeholder ever renders in the reachable login
 *   flow, measured; one TW3-preflight `html:focus-within` scroll-behavior
 *   guard — no smooth scrolling exists on either side, measured) —
 *   accepted divergences, documented in the PAD. The clone replicates the
 *   rendered guard via the `ast-amplify-button` marker class.
 *
 * - PENDING STATE (r20-F3): the live's submit button holds its label
 *   constant ("Sign In"), stays enabled, and keeps full opacity through
 *   the whole auth round-trip (measured at 120ms intervals: text,
 *   disabled, aria-busy, opacity, cursor all constant). The clone swapped
 *   to "Signing in…" and dimmed to 60% opacity while disabled —
 *   affordances the live does not have (the r15 modal-escape precedent).
 *
 * The studio surfaces are NOT touched by this contract: the live's studio
 * buttons keep the TW3 `transition` utility's 0.15s hover tints on BOTH
 * sides under reduced motion (the live's guard targets .amplify-button
 * only), and the drawers' 0.3s slide is pinned by motion-fidelity.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const libDir = dirname(fileURLToPath(import.meta.url));
const login = readFileSync(
  join(libDir, "../components/studio/login-screen.tsx"),
  "utf8",
);
const globalsCssRaw = readFileSync(join(libDir, "../app/globals.css"), "utf8");
const globalsCss = globalsCssRaw.replace(/\/\*[\s\S]*?\*\//g, "");

/** The live's measured Amplify transition spec as utility classes. */
const SPEC = "transition-all duration-[250ms] ease-[ease]";
/** The active tab's measured override: property none, duration/timing kept. */
const ACTIVE = "transition-none duration-[250ms] ease-[ease]";

describe("login chrome transition spec (r20-F2a — the live's all 0.25s ease)", () => {
  it("both tab buttons carry the Amplify spec — none while active, all while inactive", () => {
    // the active branches (turquoise) hold the property-none override; the
    // inactive branches (gray) hold the full all-0.25s spec
    expect(login).toContain(`border-[#2ec4b6] text-[#047d95] ${ACTIVE}`);
    expect(login).toContain(`border-[#dcdee0] text-[#304050] hover:text-[#3f5266] ${SPEC}`);
    // the old TW utility transition is gone from the tab strip
    expect(login).not.toMatch(/border-t-2 text-base font-bold transition[\s"'`$]/);
  });

  it("every login input carries the Amplify spec (the live's inputs fade focus at 250ms)", () => {
    // r27: the input base classes carry the live's measured font/padding
    // (px-4 py-2 text-base = 16px/24px on 8px/16px padding) — see
    // login-fidelity's input-chrome pin for the measurement record.
    expect(login).toContain(`rounded-[4px] border border-[#89949f] bg-transparent px-4 py-2 text-base text-[#0d1a26] placeholder:text-[#9ca3af] focus:border-[#047d95] focus:outline-none focus:ring-2 focus:ring-[#047d95]/30 ${SPEC}`);
    // the password variant (rounded-l only — the eye toggle continues the
    // group's border) carries the same measured spec
    expect(login).toContain(`rounded-l-[4px] border border-[#89949f] bg-transparent px-4 py-2 text-base text-[#0d1a26] placeholder:text-[#9ca3af] focus:border-[#047d95] focus:outline-none focus:ring-2 focus:ring-[#047d95]/30 ${SPEC}`);
  });

  it("the eye toggle carries the Amplify spec", () => {
    expect(login).toContain(`text-[#0d1a26] ast-amplify-button ${SPEC} hover:text-[#c5cdd6]`);
  });

  it("all three submit buttons carry the Amplify spec", () => {
    const submits = login.match(
      /h-\[42px\] w-full rounded-\[4px\] bg-\[#FE5FA7\][^"]*/g,
    ) ?? [];
    expect(submits.length).toBe(3);
    for (const cls of submits) {
      expect(cls).toContain(SPEC);
    }
  });

  it("the link buttons (Forgot / Back to Sign In / Resend Code) carry the Amplify spec", () => {
    const links = login.match(
      /flex h-\[35px\] items-center justify-center border border-transparent px-3 text-sm font-bold text-\[#047d95\][^"]*/g,
    ) ?? [];
    expect(links.length).toBeGreaterThanOrEqual(3);
    for (const cls of links) {
      expect(cls).toContain(SPEC);
    }
  });

  it("the alert's Dismiss button carries the Amplify spec (it is an amplify-button--link on the live)", () => {
    expect(login).toContain(`h-[34px] shrink-0 items-center justify-center rounded-[4px] border border-transparent px-4 font-bold text-[#660000] ast-amplify-button ${SPEC}`);
  });
});

describe("reduced-motion guard (r20-F2b — the live's .amplify-button rule)", () => {
  it("globals.css guards exactly the ast-amplify-button class under prefers-reduced-motion: reduce", () => {
    expect(globalsCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(globalsCss).toMatch(
      /\.ast-amplify-button\s*\{\s*transition:\s*none;\s*\}/,
    );
  });

  it("the guard is scoped — no universal or animation-targeting reduced-motion rule", () => {
    const guards = [
      ...globalsCss.matchAll(/@media \(prefers-reduced-motion[^)]*\)\s*\{[^@]*?\}\s*\}/g),
    ];
    expect(guards.length).toBe(1);
    expect(globalsCss).not.toMatch(/prefers-reduced-motion[^{]*\{[^}]*animation/);
  });

  it("every element the live guards carries the ast-amplify-button marker", () => {
    // eye toggle + 3 submits + 3 link buttons + Dismiss = 8 occurrences
    const markers = login.match(/ast-amplify-button/g) ?? [];
    expect(markers.length).toBe(8);
  });

  it("the tabs and inputs are NOT guarded (the live's guard targets .amplify-button only)", () => {
    // tab strip and inputs must not carry the marker
    expect(login).not.toMatch(/border-t-2[^"]*ast-amplify-button/);
    expect(login).not.toMatch(/focus:ring-\[#047d95\]\/30[^"]*ast-amplify-button/);
  });
});

describe("amplify button cursor contract (r25 — the live's pointer rule)", () => {
  // Measured on the live 2026-09-24: every .amplify-button element (the
  // three submits, both eye toggles, the three link buttons, the alert's
  // Dismiss) computes cursor: pointer — Amplify's own button rule — while
  // the clone's equivalents computed default. The tab strip carries
  // cursor: auto on the live (an equivalent non-pointer rendering — no
  // action). One globals rule covers the clone's whole marker set.
  it("globals.css pins the marker set to the live's pointer cursor", () => {
    // The rule is :not(:disabled)-scoped — TW4 emits utilities inside
    // @layer and an unlayered rule would otherwise outrank the sign-up
    // submit's disabled:cursor-not-allowed utility (the cascade-layers
    // trap caught by the E2E spec).
    expect(globalsCss).toMatch(
      /\.ast-amplify-button:not\(:disabled\)\s*\{\s*cursor:\s*pointer;\s*\}/,
    );
  });

  it("the disabled sign-up submit overrides the pointer with not-allowed (utility specificity)", () => {
    expect(login).toContain("disabled:cursor-not-allowed");
  });
});

describe("login pending state (r20-F3 — the live's constant submit button)", () => {
  it("the submit label stays constant — no pending text swap", () => {
    expect(login).not.toContain("Signing in…");
    expect(login).not.toContain("Creating account…");
  });

  it("the submit button is never disabled by pending state", () => {
    expect(login).not.toMatch(/disabled=\{pending\}/);
    expect(login).not.toMatch(/disabled:opacity-60/);
    // r25 refinement: the sign-UP submit now carries a VALIDATION-keyed
    // disabled chrome (the live's blur-gated state machine — measured
    // 2026-09-24: gray #EFF0F0/#89949F + not-allowed exactly while a
    // policy/mismatch line renders). That is measured parity, not a
    // pending affordance; the r20 matchers that forbade the literal
    // disabled: utilities were written against the sign-in round-trip
    // only and are superseded by login-fidelity's r25 disabled-chrome
    // pins. The pending contract itself stands: no isPending-consumed
    // disabled, no opacity dim, no label swap.
  });
});
