Session 30 — the reading-order & a11y-structure pass (r18), continuing from
session 28's motion-contract pass and the user's session_29 transcript (main @
69ad417 — session_29.md and the Tailwind-V4-Validation-Report.md were pulled in
this session's refresh; 301 vitest + 25 Playwright E2E green per docs;
session_28's close-out suggested the unexplored probe dimensions: screen-reader
announcement ORDER, zoom/reflow at 200% and 320px (WCAG 1.4.4/1.4.10), and
forced-colors rendering — this round took all three).

Started from `git pull` (clean fast-forward 8255233 → 69ad417, the remote's
docs-only commit adding exactly those two files): core docs re-read and
validated against the codebase (README / AGENTS / CLAUDE / PAD v1.16 /
session_28 / session_29 / Tailwind-V4-Validation-Report), plus the scandihaven
reference patterns (already absorbed — this repo follows the same
ActionResult/action-layer/Tailwind-v4-CSS-first/CI-gate conventions; the
validation report independently confirms the repo's no-tailwind.config.js,
@theme-literal, @config-compat positioning) and the skills (clone-app-pat-pro's
computed-styles-as-ground-truth doctrine, agent-browser dual sessions, tdd).

The Tailwind-V4-Validation-Report was cross-checked against the codebase: the
repo's `globals.css` is exactly the report's sanctioned v4 shape — CSS-first
`@theme` with literal hex (no `var()` chains except the sanctioned
`@theme inline` font stack), no `tailwind.config.js`, no `@config` bridge, no
`corePlugins`/`safelist`/`separator` usage. No action required; the report is
reference material validating decisions already pinned by
`design-tokens.test.ts`.

Baseline gates on the untouched r17 tree: lint ✓, typecheck ✓, **301/301
vitest** ✓, production build ✓, dev server healthy (`/api` probe 200).

Reconnaissance (live vs clone, 2026-09-23, fresh this session):

- 8 paired captures with pixel structural diffs at the documented r17
  baselines: dashboard 0.53%, projects 0.39%, supplies 0.39%, inspiration
  0.54%, mobile-dashboard 0.17%, sidebar drawer 0.47% (< the 0.81% baseline),
  chat drawer 0.76%, login 0.21%. **Visual parity intact.** The dashboard's
  0.53% (vs r17's 0.34%) fully decomposed via cluster-mapping + VLM crops +
  numeric geometry probes into the documented accepted set: the header
  account-email band, the dev-mode badge, the Artist Quote card's second line
  cut at the viewport's 800px edge (line rects byte-identical on both sides —
  746.6→773.6 and 779.6→806.6; the VLM initially misread the cut line as a
  text difference, disproven by the DOM), and the chat scrollbar-thumb length
  delta (the live's residue chat message sits below the 544px fold — its
  scrollHeight 976 vs the clone's 882, the same class session_25 measured at
  78px; content invisible, only the thumb geometry reflects it). The live's
  residue message re-confirmed: the 6th community message ("Hello from clone
  test", Sep 16, from a prior agent's chat test) is the documented accepted
  live-side residue — the clone's seed keeps the five legitimate messages.
- Navigation discipline: eval-based tile clicks (accessible names carry
  counts); view-state h1 verification before every capture; pointer parked
  neutrally; drawers verified by geometry before/after each drawer capture
  (312×844 z-50, sidebar x=0, chat x=78 — byte-identical).
- Export envelope: byte-identical modulo the `exportedAt` timestamp
  (`{"app":"AST Studio","version":1,"projects":[],"supplies":[]}` — captured
  via a `URL.createObjectURL` hook on both sessions).
- **23/23 smoke checks** (scripts/smoke_functional.py) on the running dev
  server.

New probe dimensions (session_28's suggestions):

1. **Zoom/reflow — PARITY.** 200% zoom equivalent (640×400 CSS px) and
   320×844 (WCAG 1.4.10): ZERO horizontal overflow on either side at either
   viewport (scrollWidth == clientWidth), same visible h1, capture diffs
   0.58% / 0.05% (accepted classes only). Both apps reflow to the mobile
   layout below md identically.
2. **Forced-colors — PARITY.** CSSOM sweep for
   `forced-colors`/`prefers-contrast`/`inverted-colors` media rules: ZERO on
   both sides (the same inventory-level parity class as r17's print probe —
   the browser's default forced-colors translation applies to both alike).
3. **Reading order — three findings, all in the invisible-semantics /
   documentation class** (probed with a display-filtered DOM walk of
   landmarks, headings, and live regions at both viewports, on the dashboard
   and the inspiration Feed):

   - **r18-F1 (Docs, Medium) — the inert record.** The announcement order
     itself (header → sidebar → content → chat) is IDENTICAL on both sides
     at both viewports. But the probe surfaced that session_26's
     live-behavior paragraph had misattributed the closed drawers' `inert`
     as live-measured ("the closed chat drawer carries `inert` ... Every
     measured value matches the live exactly"). Direct measurement with both
     drawers closed at 390×844: the LIVE's off-screen panes carry NEITHER
     `inert` NOR `aria-hidden` (attribute and property both absent) and keep
     10 (sidebar) / 3 (chat) focusable descendants tabbable and announced —
     the live's mobile reading order walks the closed drawers' content
     BEFORE the page content, and Tab reaches invisible off-screen buttons.
     The CLONE's `inert={!open}` + `aria-hidden={!open}` pair (added r5,
     with an explicit code comment) keeps closed drawers out of both the tab
     order and the a11y tree — the same kept-improvement class as the chat's
     `role="log"`. Remediation: NO code change (removing the pair would
     regress the pinned r5 remediation and hurt keyboard/AT users); the
     record corrected in AGENTS.md / README / PAD §10, and the PAIR pinned
     at source level by the new `landmark-fidelity.test.ts` (either
     attribute alone breaks the contract: aria-hidden alone leaves
     focusables keyboard-reachable, inert alone leaves the pane announced).
   - **r18-F2 (accepted) — the inner main.** The LIVE wraps its desktop
     content pane in a nested `<main class="col-span-7">` INSIDE the outer
     `<main>` — two "main" landmarks (invalid HTML; a screen reader
     announces main twice). The CLONE's content pane is a plain `<section>`
     (studio-app.tsx:307) under the single outer `<main>`. Invisible in
     pixels (parity proven at both viewports) and in announcement
     sequencing; the clone's valid-HTML structure kept and documented.
   - **r18-F3 (accepted) — the twin copies.** The LIVE renders every view's
     content TWICE (a `SECTION hidden md:grid` desktop copy + a
     `SECTION flex md:hidden` mobile copy, one always `display:none` —
     measured on the dashboard: two `h1 "Today in the Studio"` elements,
     one visible, one zero-rect). The CLONE renders ONE responsive copy
     (the layout container flips `flex-col` → `md:grid md:grid-cols-12`).
     The hidden copy is removed from the a11y tree, so no announcement
     impact; pixel parity proven at both viewports. Documented as accepted;
     negative pins reject introducing the twin-copy pattern.

Also fixed this round (stale-docs sweep while aligning the PAD): §5.4 Motion
still described the removed `studio-fade-in` keyframe (an r17 miss — the r17
update added the motion-contract paragraph in §5.2 but left §5.4's old bullet)
and §5.3's modal bullet still advertised "Escape-to-close, initial focus" (the
pre-r15 contract, removed in r15). Both rewritten to the current contracts.

The fix (TDD, characterization-first): `src/lib/landmark-fidelity.test.ts`
written first — 9 file-content pins on the motion-fidelity pattern: the
drawers' `inert` + `aria-hidden` PAIR (both drawers), the drawer accessible
names, exactly one `<main>` in studio-app, the content pane's exact `<section>`
class string, the desktop sidebar/chat `<aside>` class strings (matching the
live's unlabeled asides), the responsive container class string, exactly one
layout-level `<section>`, and negative pins on the live's twin-copy patterns
(`hidden md:grid`, `flex md:hidden`). All 9 GREEN on arrival — the
characterization confirmed the audit's source reading (a docs-precision round:
the behavior was already correct; the test guards it against drift).
**310/310 vitest**, lint ✓, typecheck ✓, production build ✓.

All 8 `docs/screenshots/` re-shot with the state-check discipline (visible-h1
verification before every capture; neutral pointer; drawer geometry verified
before the drawer captures) — 0.00% pixel difference vs the r17
parity-verified references on all eight (no code change; deterministic
rendering re-confirmed).

Documentation aligned: README (310-test counts, the landmark & reading-order
fidelity paragraph, the r18 status row, the Verification row's zoom/reflow +
forced-colors additions), AGENTS.md (the 310-test inventory row + TWO new
framework quirks: the corrected inert record and the single-section content
pane), CLAUDE.md (310 count + the landmark-fidelity testing bullet), PAD v1.17
(header, [R18] revision block, §5.3 modal bullet corrected, §5.4 rewritten,
new §5.5 Landmarks & reading order, §7.1 distribution 282 + 28 + 25, §10's
three new accepted rows), and this session record. `.env.example` verified
against the codebase (unchanged — the single `DATABASE_URL` contract).

**Session 30 complete — the UI was already at visual and functional parity on
every standard probe AND on all three new dimensions (zoom/reflow, forced
colors, announcement order); this round corrected the one inaccurate record
the reading-order probe surfaced (the inert misattribution), pinned the
kept-improvement contracts at source level, fixed two stale PAD sections, and
documented the three accepted landmark divergences.**

**Verification:** all claims executed and observed this session; the live
account left pristine (read-only recon — 0 projects / 0 supplies / 15 inspo;
no chat messages posted); the accepted divergences remain documented (dev
badge, account data, the live's residue message, the mobile login card's
0.5px offset, the nav-vs-aside + labeled-drawer landmarks, the chat
role="log" improvement, the closed-drawer inert + aria-hidden pair, the
single-main/single-copy structure, dev-mode-only artifacts, sub-perceptual
oklab-vs-rgba compositing and fractional text-row rounding, the unreachable
modal-scrim z difference, and the TW3/TW4 transition property-list
internals).

**Suggested next steps:** watch the CI verify-gate on the pushed commit;
candidate probe dimensions still unexplored: caret/selection-color rendering,
`prefers-contrast: more` emulation (the inventory probe covered authored
rules; an emulated-rendering capture remains unmeasured), and the
high-DPI/devicePixelRatio capture matrix (1x vs 2x); re-shoot
`docs/screenshots/` after any chrome-level change (pointer parked neutrally,
view state verified).
