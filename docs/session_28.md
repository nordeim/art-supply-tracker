Session 28 — the motion-contract pass, continuing from session 26's verification
hardening and the user's session_27 transcript (main @ f101abb, 283 vitest +
25 Playwright E2E green per docs; session_26's close-out suggested the unexplored
probe dimensions: screen-reader announcement order, reduced-motion rendering,
print stylesheet parity — this round took all three).

Started from a fresh clone after another workspace reset: core docs re-read and
validated against the codebase (README / AGENTS / CLAUDE / PAD v1.15 /
session_25 / session_26 / session_27), plus the scandihaven reference repo's
patterns (the shared ActionResult/action-layer/Tailwind-v4/CI-gate conventions
this repo already follows) and the skills catalogs (clone-app-pat-pro's
computed-styles-as-ground-truth doctrine shaped the probes; agent-browser drove
both sessions; the tdd skill governed the fix loop).

Environment note (the r16 contract exercised again): the sandbox's ambient
`/home/z/my-project/.env` carries an absolute `DATABASE_URL` pointing outside
the repo — creating the repo's own `.env` (copied from `.env.example`, the
documented quick-start step) restores the documented schema-relative resolution,
verified: `db/custom.db` lands at the repo root for the CLI, the seed, and the
dev server alike.

Baseline gates on the untouched r16 tree: lint ✓, typecheck ✓, **283/283
vitest** ✓, **25/25 Playwright E2E** ✓, dev server healthy.

Reconnaissance (live vs clone, 2026-09-23, fresh this session):

- 8 paired captures with pixel structural diffs at the documented r13–r16
  baselines: dashboard 0.34%, projects 0.34%, supplies 0.34%, inspiration
  0.49%, mobile-dashboard 0.17%, sidebar drawer 0.81% (< the r16 record of
  1.15% — account data, the dev badge, and the drawer-edge text truncation,
  all in the documented accepted set), chat drawer 0.76%, login 0.17%.
  **Visual parity intact.** Two capture-methodology traps re-learned and
  documented: agent-browser screenshots require ABSOLUTE paths (relative
  paths silently save to the daemon's tmp dir), and every capture must be
  preceded by a view-state check — the session's two high readings (12.71%
  projects, 10.95% dashboard) decomposed into a 138px live scroll offset
  (the documented export-click artifact) and an open create-modal on the
  clone; after state resets both pairs returned to exactly their baselines
  (0.34%).
- Drawer geometry byte-identical: both drawers 312×844 at x=0 / chat x=78,
  z-50, `transition-transform duration-300`.
- Export probe: envelope byte-identical modulo the `exportedAt` timestamp.
- 23/23 smoke checks on the dev server.

**The three new probe dimensions:**

1. **Print stylesheets — parity.** 0 `@media print` rules in either CSSOM.
2. **Live regions — parity on the visual contract.** The live's app DOM has
   zero aria-live/role=log/status/alert elements; the clone's chat carries
   `role="log"` (the documented intentional WCAG improvement, the same
   accepted class as the nav-vs-aside drawer landmark), and the login error
   alert chrome (`div[role=alert]`) has been pinned byte-identical since r9.
3. **The motion contract — one real divergence (r17-F1, Medium).** The clone's
   scaffold had shipped `@keyframes studio-fade-in` + `.studio-fade` — a
   300ms fade-and-translate entry animation (cubic-bezier(0.22, 1, 0.36, 1))
   on THIRTEEN surfaces: every view switch, both detail panels, both edit
   panels, both create modals, and the login card — while the live renders
   every studio surface INSTANTLY. Evidence chain: the live's CSSOM holds
   exactly five @keyframes, ALL Amplify-internal (loader-circular/-linear,
   placeholder-loading, liveness-fadeout, TW3 spin); the live's view wrappers,
   Feed wrapper, and modal overlay all compute `animation: none`; a
   steady-state animating-element sweep finds ZERO on the live vs TWO carrying
   `studio-fade-in` on the clone; the clone even shipped a
   `prefers-reduced-motion` guard for an animation the live does not have.
   Present since the initial scaffold commit and invisible in every
   steady-state pixel diff (the same "invisible in captures" class as r13-F1's
   hovers and r15-F1's focus ring — which is why fifteen parity rounds never
   saw it).

Smaller motion-sweep findings, accepted-documented (no action):
- The clone's modal scrim floats at `z-[60]` (the live's overlay is z-50) —
  unreachable in every reachable state: clicking the drawer's Create button
  CLOSES the drawer and opens the modal on both sides (probed), so the two
  never stack.
- TW3 and TW4 compile the same `transition` utility to different property
  lists (the clone's includes outline-color, gradient vars, translate/scale/
  rotate, display, …) — internal-only: every property that actually changes
  on hover (color/background-color/border-color, box-shadow, opacity) is in
  BOTH lists, so the rendered hover animations are identical (probed on
  Sign Out, Create Project, Export Data, the stat tiles, rails, and Send).

**The fix (TDD, red → green):** `src/lib/motion-fidelity.test.ts` written
first — 18 file-content pins on the focus-fidelity pattern: globals.css
declares no `@keyframes`, no `.studio-fade` rule, and no
`prefers-reduced-motion` guard (comment-stripped, so the documenting docblock
cannot trip the negative pins); none of the thirteen surfaces reference the
class; positive pins keep the drawers' `transition-transform duration-300`
slide (guards against over-removal). RED confirmed (16 failed / 3 passed),
then the GREEN change: the three CSS blocks replaced by a documenting comment
in globals.css and the class stripped from all 13 usage sites (12 files —
inspiration-view carried two). **301/301 vitest, lint ✓, typecheck ✓.**

Browser verification on the dev server: zero animating elements at mount AND
steady state (the view switch renders instantly, like the live); the create
modal computes `animationName: none` / `duration: 0s`; no `.studio-fade`
element in the DOM (the remaining CSSOM keyframes are TW4's built-in dead
defaults — spin/ping/pulse/bounce/enter/exit/accordion/caret-blink —
referenced by nothing, the same inert class as the documented
`outline-ring/50` emission). Post-fix paired dashboard capture at **0.34%**
(exactly the pre-fix baseline — the fix changes only the 300ms transient).
23/23 smoke re-run on the remediated tree. **25/25 Playwright E2E** (the
mobile drawer contract — geometry, scrim, inert, Escape no-op, Chat toggle —
re-verified intact). Production build clean.

All 8 `docs/screenshots/` re-shot with the state-check discipline (visible-h1
verification before every capture; neutral pointer): **0.00% pixel difference
vs the r16 parity-verified references on all eight** — deterministic rendering
confirmed, and independent evidence that the motion fix changed nothing in
steady state.

Documentation aligned: README (301-test counts, the motion-contract fidelity
paragraph, the r17 status row, the Verification row), AGENTS.md (the test-row
inventory + the new "The studio has NO entry animations (r17)" framework
quirk, incl. the accepted z-[60] note), CLAUDE.md (the 301 count + the
motion-fidelity testing bullet), PAD v1.16 (header, [R17] revision block, §5
motion contract, §7.1 distribution 273 + 28 + 25, §10 the resolved r17-F1 row
+ the accepted z-index row), and this session record. `.env.example` verified
against the codebase (unchanged — the single `DATABASE_URL` contract, which
this session exercised end-to-end).

**Session 28 complete — the UI was already at visual parity on every standard
probe (re-confirmed on fresh paired evidence); this round closed the one real
gap the new motion-contract dimension surfaced: the clone's scaffold-era entry
animation, removed with TDD and pinned so it cannot return.**

**Verification:** all claims executed and observed this session; the live
account left pristine (read-only recon — 0 projects / 0 supplies / 15 inspo);
the accepted divergences remain documented (dev badge, account data, the
live's residue message, the mobile login card's 0.5px offset, the nav-vs-aside
landmark, the chat role="log" improvement, dev-mode-only artifacts,
sub-perceptual oklab-vs-rgba compositing and fractional text-row rounding, the
unreachable modal-scrim z difference, and the TW3/TW4 transition
property-list internals).

**Suggested next steps:** watch the CI verify-gate on the pushed commit (the
`e2e` job now runs against the motion-fixed tree); candidate probe dimensions
still unexplored: screen-reader announcement ORDER (this round probed the
live-region inventory — the announcement sequencing remains unmeasured), zoom/
reflow at 200% and 320px (WCAG 1.4.4/1.4.10), and forced-colors rendering;
re-shoot `docs/screenshots/` after any chrome-level change (pointer parked
neutrally, view state verified).
