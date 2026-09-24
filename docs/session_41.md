# Session 41 — r24: WebKit engine matrix + auth-success scroll reset

Date: 2026-09-24 · Round 24 · Session doc continuation of session_39/40
(r23 complete; the user committed the raw r23 narration as session_40.md
with one quoted token, tripping the docs-token pin on main — the third
occurrence of the documented recurrence class).

## What this round set out to do

1. `git pull` (93448c3 → 7e5d750: session_40.md only), re-review the core
   docs, validate against the codebase, run the baseline gates.
2. Re-verify the full parity battery vs the live site.
3. Close the three queued probe dimensions from session_39/40:
   the **WebKit engine matrix** (blocked since r20 — missing GTK),
   **slow-network first-paint captures**, and the **gradient-compositor
   race reliability study** (r22-M1).
4. Remediate anything found, TDD-first; align docs; re-shoot the
   reference screenshots; commit and push to main.

## Baseline state on the pulled tree

- Tree clean at 7e5d750; the only change vs r23's push is
  docs/session_40.md.
- Lint ✓, typecheck ✓, build ✓, production CSS 150,821 bytes (same
  content hash `de83a4a2` as r23 — byte-identical), 0 forced-colors /
  0 selection rules.
- Vitest 333/334 — **RED pin**: the docs-token scan flags
  session_40.md line 13 (the raw r23 narration quotes the literal
  transparent-outline token while identifying the r22 offender).
  The r22 markdown exclusion keeps the COMPILED CSS immune (verified:
  the build stays at 150,821 bytes), but the pin is the repo's canary
  for the pin-vs-exclusion contract and the CI verify-gate was broken
  on main — **r24-F1**, the third occurrence of the class
  (sessions 37 → 38 → 40).

## The WebKit engine matrix (queued probe #1 — unlocked)

The environment changed since r23: the sandbox now carries GTK3/GTK4
shared libraries and an Xvfb binary. Playwright's WebKit 2359 could
therefore be launched through a **user-space stack assembled without
root**: deb packages (libgtk-4-1, graphene, gstreamer-gl/plugins-bad,
libsoup-3, manette, enchant, secret, glvnd EGL/GLESv2/GL, Mesa
EGL/dri/gbm incl. llvmpipe swrast, glib-networking + gnutls tree,
gsettings-desktop-schemas) extracted into a local root and wired via
LD_LIBRARY_PATH + GIO_MODULE_DIR + GSETTINGS_SCHEMA_DIR + Xvfb :99,
with the two pw minibrowser wrappers patched to APPEND (not overwrite)
the inherited LD_LIBRARY_PATH, and
PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 (the validators' lists
are incomplete for the Xvfb/software-GL path; every binary resolves
100% of its NEEDED libs — verified with ldd before skipping).

Battery results (fresh WebKit baselines; Chromium baselines do not
transfer across engines — the r20 Firefox precedent):

- login-desktop 1.715 / dashboard-desktop 2.726 / projects 0.943 /
  supplies 0.870 / inspiration 1.162 / scrolled 2.440 /
  sidebar-drawer 0.948 / chat-drawer 3.145 / mobile-dashboard 7.642%.
- Same-side determinism (double captures): **0.000% on BOTH sides**.
- Desktop geometry **byte-equal**: docH 998 / scrollMax 154 / mainH 998
  on both sides (WebKit's own text metrics — both sides match each
  other exactly). Chat drawer 312px @ x=78 both sides; sidebar drawer
  312px @ x=0 on the clone (the live probe timed out once — probe
  artifact, capture fine).
- Cross-engine symmetry (per side, Chromium vs WebKit): the shifts
  differ by **≤ 0.04% on every surface** — engine rasterization moves
  both sides equally (the r20 Firefox pattern, larger magnitude under
  software rasterization).
- The mobile dashboard's 7.642% has ONE root cause and it is on the
  LIVE's side: the Partner-Spotlight label row's "Sponsored" badge
  sits at its wrap threshold — the live's row content measures
  178.28px under WebKit vs 178.58px under Chromium (the badge wraps to
  a second line under WebKit only; the row goes 16px → 32px and the
  card 296px → 308px, cascading a 12px shift to every card below).
  The clone is IDENTICAL to the live under Chromium (178.58px, 1-line,
  245px card) and measures 176.70px under WebKit. Every OTHER card
  matches byte-exactly under WebKit (82/472/208/214px). **Accepted
  divergence of the fractional text-row class** — the live is the
  engine-unstable side; matching both engines' flip states would need
  engine-targeted CSS that breaks reference parity.

## r24-F2 (HIGH) — the auth-success scroll divergence

The WebKit battery's mobile sign-in exposed a REAL behavioral
divergence:

- The LIVE's SPA swaps the login view for the dashboard on auth
  success and the document lands scrolled to TOP.
- The CLONE's `router.refresh()` re-render PRESERVED the pre-submit
  scroll offset.
- Measured on BOTH engines: WebKit mobile pre-submit 201 → live 0 /
  clone 201; Chromium (forced 300px wheel) pre 128 → live 0 /
  clone 128.
- Reachable whenever the mobile login card exceeds the fold — which is
  every real phone (the submit lands at y=851 against the 844-fold
  under WebKit metrics; Chromium's tighter metrics keep it at y=778,
  which is why the Chromium-only battery and the E2E suite never saw
  it — the r23 mobile battery signed in without scrolling).

TDD cycle:

1. RED: new login-fidelity pin (the auth-success handler must reset
   the window scroll).
2. GREEN: `window.scrollTo(0, 0)` immediately after `router.refresh()`
   in `handleResult` (covers sign-in AND sign-up — both flow through
   it).
3. E2E: the scroll assertion folded into the EXISTING sign-in
   round-trip spec (mobile viewport + forced wheel + post-sign-in
   scrollY === 0) — no new sign-in, keeping the 5/min rate-limiter
   budget (a pinned contract).

Post-fix: the WebKit mobile-dashboard paired diff dropped
27.279% → 7.642% (the residual = the Partner-row knife-edge + engine
raster noise); Chromium mobile re-verified at the documented 0.328%.

## Slow-network first-paint (queued probe #2) — parity

CDP Slow-3G (400ms latency, 400kbps) on both sides, Chromium:

- login first-paint 0.149% / login settled 0.232% (exactly the
  unthrottled baseline) / dashboard 0.548%.

Loading-state parity holds under constrained bandwidth (zero-webfont
contract, local assets, no progressive-loading divergence).

## Gradient-compositor race (queued probe #3, r22-M1) — stable

16 fresh-navigation captures of the inspiration surface (8 per side),
gradient-band color census + drift-vs-first:

- Live: 8/8 identical (0.000% drift, 64 band colors).
- Clone: 8/8 identical (0.000% drift, 66 band colors — the documented
  TW3/TW4 interpolation divergence).
- **No flat-window artifact in any of the 16 captures.** r22-M1 did
  not reproduce (also absent in r23); with two consecutive rounds and
  16 fresh navigations at zero variance, the artifact is rare/ephemeral
  — the study bounds it rather than explaining it.

## Chromium re-verification (post-fix)

Fresh full battery on the remediated tree: all 9 surfaces at the
documented r23 baselines — login 0.232 / dashboard 0.333 / projects
0.305 / supplies 0.305 / inspiration 0.466 / scrolled 0.148 /
mobile 0.328 / sidebar-drawer 0.577 / chat-drawer 1.144%.

## Remediation summary

| ID | Finding | Resolution |
|---|---|---|
| F1 (HIGH) | docs-token pin RED on main (session_40.md:13 quotes the token; verify-gate broken; third occurrence) | Line reworded to a descriptive reference → 335/335 green |
| F2 (HIGH) | Auth-success scroll divergence (live resets to top; clone preserved the offset; both engines) | `window.scrollTo(0, 0)` after `router.refresh()` + login-fidelity pin + E2E scroll assertion |
| F3 (MEDIUM) | Docs alignment: 334→335 counts, README r24 row, PAD R24 revision + §10 rows (scroll divergence resolved; WebKit now MEASURED — the r20 "unmeasurable" acceptance closed), AGENTS scroll quirk, this session record | Done |

Confirmed at parity (no action): the full Chromium battery, the WebKit
battery (8/9 at fresh baselines + 1 documented live-side knife-edge),
slow-network, gradient race, export envelope (r23 record stands — the
live account left pristine again this round: navigation + captures
only), dev + production CSS (150,821 bytes, 0/0).

## Verification

All claims executed and observed this session. The live account was
left pristine (read-only recon: navigation + captures; 0 projects /
0 supplies; no chat messages posted). The accepted-divergence set is
unchanged plus the two new measured entries: the live's
Partner-Spotlight badge wrap (engine-unstable at its threshold, the
clone is Chromium-identical) and the live's chat-drawer residue
message (visible only in the WebKit chat-drawer capture's elevated
3.145%, engine-amplified).

## Suggested next steps

Watch the CI verify-gate on the pushed commit. The queued probe list
is now empty; future candidates: a WebKit capture of the login ERROR
and reset-confirmation views (the battery covers steady-state only),
a Firefox re-run of the scroll and WebKit-mobile flows for a third
engine opinion, and a host with real GPU/libGTK for an
unpatched-wrapper WebKit run (the current stack needs the two wrapper
patches + the skipped validator).
