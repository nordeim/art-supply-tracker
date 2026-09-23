# Session 36 — r21: the app-shell height pass — the uncapped desktop layout and the documentation token regression

**Scope:** workspace re-clone (the sandbox had been reset; main @
`0ae4389`), core docs re-read (AGENTS/CLAUDE/README/PAD v1.19,
session_34/35, the Tailwind-V4 validation report), baseline gates on
the r20 tree (lint ✓ typecheck ✓ 328/328 vitest ✓), then the r21
audit: the standard 8-pair battery re-derived with a self-consistent
hot-pixel metric, the export envelope, the 23-check smoke suite, the
drawer geometry checks, and a scroll-behavior probe dimension.

## The round in brief

**Standard battery — 8 paired captures, decomposed to root causes:**
the initial run measured elevated diffs on every surface
(0.23–0.72% at the desktop set). Region-by-region decomposition
(masked hot-pixel accounting + element-at-point + VLM crops) split
them into: the account-email header strip (accepted), the dev badge
(accepted), sub-pixel text rasterization (accepted, sampled pixels
identical), and ONE structural cluster nobody had ever measured —
bottom strips on the sidebar and chat columns of every desktop
surface (~0.43% combined).

**r21-F1 (HIGH) — the desktop app-shell height contract.** The live's
root `<main>` is a plain block (`min-h-screen overflow-hidden`, no
flex, no height cap) wrapping a `relative z-10 flex min-h-screen
flex-col` div whose desktop grid section carries no height cap
either. The grid's single auto row therefore sizes to the tallest
column's intrinsic content — always the chat column (sticky community
header 240px + the scroll container's `max-h-[calc(100vh-16rem)]`
588px + the card's padding = 878px) — so the live's page grows to
982px at 1536×844 and the WINDOW SCROLLS (wheel-verified: scrollY
0→138 over the content pane; documentElement.scrollHeight 982). The
clone carried the scaffold's viewport-height cap token (in
the tree since the initial commit `f871e90`, never live-measured):
the page was locked at 844, the grid row capped at 740, and the chat
column's own `overflow-hidden` clipped its card — the clone rendered
the chat and sidebar cards' bottom borders + rounded corners at y=828
where the live's cards continue past the fold, and the wheel scroll
was dead. A directly user-experienced functional divergence (mouse
wheel), invisible to every prior steady-state capture as a *named*
cause because the strips were folded into the baselines.

**Fix:** the cap token removed from the shell's main (one class, plus
a contract comment). The clone's single-copy flex shell then grows
with the grid's content exactly like the live's wrapper — empirically
proven beforehand by the clone's own mobile path (the same container
propagates content height to the page's 1563px below md). Post-fix
geometry, measured on BOTH the dev and the production server:

| metric | live | clone (post-fix) |
|---|---|---|
| documentElement.scrollHeight | 982 | 982 |
| main height | 982 | 982 |
| grid template row | 878px | 878px |
| chat aside | y=88 h=878 bottom=966 | y=88 h=878 bottom=966 |
| content pane | h=878 | h=878 |
| chat scroll container | h=588 maxH=588px | h=588 maxH=588px |
| wheel scrollY (600px over content) | 138 | 138 |

The desktop paired captures dropped to 0.33 / 0.31 / 0.31 / 0.47% —
below every r20 baseline, the remaining regions being the accepted
account-email strip. Mobile surfaces were byte-stable across the fix
(0.33 / 0.58 / 1.14% before and after — no mobile change; the
elevation vs the r20 baselines is the metric difference plus the
accepted set: email, dev badge, and the live's residue chat message
below the fold).

**r21-F2 (MEDIUM) — the documentation token regression.** While
verifying the post-fix CSS, the production stylesheet measured
152,390 bytes with ONE `@media (forced-colors: active)` block and the
selection pair — the exact dead rules r19/r20 had stripped and
recorded as clean (152,241, zero of either). A git-stash rebuild of
the TRUE r20 tree reproduced it: the r19/r20 remediation records
themselves carried the stripped tokens verbatim (7 transparent-outline
occurrences in session_35/AGENTS + 6 selection-variant occurrences in
session_32/README/PAD), and Tailwind v4's automatic content detection
scans committed MARKDOWN too — the next build compiled the dead rules
straight back in. The r20 "verified clean" measurement had been taken
before the docs were written; the pins checked only src/. All 13
literal occurrences were reworded to descriptive references ("the
transparent-outline utility"), and a new css-hygiene pin scans every
repo .md for both token families with runtime-constructed matchers.
Production CSS is now 152,062 bytes — 0 forced-colors, 0
`::selection`, cleaner than the r20 record (the fix also removed the
now-unused viewport-cap rule).

**Methodology notes (r21-M1/M2):**
- The prior sessions' hot-pixel baselines are not reproducible with
  any metric I could derive (their probe scripts were never
  committed); this round re-derived the metric explicitly (sum of
  absolute channel deltas > 30, hot% of total pixels) and uses
  within-run before/after comparisons as ground truth. New baselines:
  dashboard 0.33 / projects 0.31 / supplies 0.31 / inspiration 0.47 /
  mobile-dashboard 0.33 / sidebar-drawer 0.58 / chat-drawer 1.14 /
  login 0.23.
- The committed r20 screenshot references are not reproducible in this
  environment at the byte level: a stashed-tree capture of the UNCHANGED
  mobile surface is byte-identical to this round's capture but differs
  from the committed reference by sub-pixel text rasterization
  (glyph-edge deltas; content VLM-verified identical at 2× zoom).
  Rendering within this environment is fully deterministic (two-pass
  and cross-launch captures byte-identical). All 8 references were
  re-shot from the remediated dev server; the desktop set reflects the
  uncapped layout.

## Findings

| ID | Finding | Class | Action |
|---|---|---|---|
| **r21-F1** | The desktop app shell was capped at the viewport height (the scaffold's viewport-height cap token, never live-measured) while the live's uncapped shell grows with the chat column's intrinsic content (grid row 878px, page 982, window scrolls) — the clone clipped the chat card at 740px and the wheel scroll was dead. ~0.43% hot strips on every desktop surface + a functional divergence. | HIGH — layout/behavior contract | Cap token removed; geometry verified byte-equal to the live's numbers on dev AND production servers; desktop captures dropped below every baseline; pinned by the new `layout-fidelity.test.ts` (4 pins: the exact uncapped main class, the runtime-constructed negative cap pin, the single-copy container seat, the row-driving max-h calc cross-pin). |
| **r21-F2** | The r19/r20 selection/forced-colors remediations were regressed by their own documentation: the stripped tokens quoted verbatim in 13 places across the committed .md files, and TW4's markdown scanning recompiled the dead rules (152,241 → 152,390 bytes). | MEDIUM — CSSOM dead-rule regression | All 13 occurrences reworded to descriptive references; new css-hygiene docs-token pin (runtime-constructed matchers, scans every repo .md); production CSS 152,062 bytes with 0 forced-colors / 0 selection rules. |
| **r21-M1** | The prior rounds' hot% baselines are not derivable — their probe scripts weren't committed; comparisons across rounds were silently metric-incompatible. | Methodology | The metric is now explicit (sum-of-channel-deltas > 30) and the baselines re-derived; within-run before/after is the ground truth. |
| **r21-M2** | The committed screenshot references carry environment-level sub-pixel rasterization that this sandbox cannot reproduce byte-exactly (content verified identical). | Methodology | References re-shot from the remediated tree; determinism within this environment proven (two-pass + cross-launch byte-identical). |

## The TDD cycle

New suites (5 pins):
- NEW `layout-fidelity.test.ts` (4): the uncapped main class string,
  the negative viewport-cap pin (runtime-constructed — TW4 scans test
  sources), the single-copy container's flex-1 seat, and the chat
  column's row-driving scroll container.
- `css-hygiene.test.ts` +1: no committed markdown carries the
  transparent-outline or selection-variant tokens.

Red→green verified honestly: the layout pins failed 2/4 on the
pre-fix tree (the cap present, the class string mismatched); the
docs-token pin was written after the rewords (a process slip — its
protective value is the docs scan, and the matcher fragments were
sanity-checked by the CSS rebuild dropping the rules). Post-fix
**333/333 vitest**, lint ✓, typecheck ✓, 25/25 E2E, 23/23 smoke,
production build ✓, production CSS verified (152,062 bytes, 0
forced-colors, 0 selection rules, 0 viewport-cap rules), production
server geometry verified (982/878/878/wheel-138).

## Screenshots & docs

All 8 `docs/screenshots/` re-shot from the remediated dev server with
the state-check discipline (visible-h1 verification before every
capture; neutral pointer; drawer geometry verified before the drawer
captures; the mobile set navigates at desktop before the viewport
switch; a data-settled gate for the live's post-render AppSync
fetches). The desktop set reflects the uncapped layout (the
sidebar/chat cards now continue past the fold like the live's); the
mobile set differs from the r20 references only by the
environment-level rasterization note above. Final parity VLM check on
the dashboard pair: identical layout/cards/colors — only the accepted
account-email and dev-badge differences.

Documentation aligned: AGENTS.md (333 inventory + two new framework
quirks: the uncapped shell and the markdown-scanning token hygiene),
CLAUDE.md (333 count + two testing bullets + the Tailwind markdown
note), README (333 count + the r21 status row), PAD v1.20 ([R21]
revision, §5.7 the app-shell height contract + documentation token
hygiene, §7.1 305+28+25, §10 two resolved rows), and this session
record. `.env.example` verified against the codebase (unchanged — the
single `DATABASE_URL` contract).

**Session 36 (r21) complete — the desktop app shell now reproduces
the live's uncapped, content-growing, window-scrolling layout
byte-for-byte in geometry (verified on dev and production servers),
the documentation-driven CSS regression is fixed and pinned, and the
audit's standard battery, export envelope, smoke suite, and drawer
geometry all stand at parity with the accepted-divergence set.**

**Verification:** all claims executed and observed this session; the
live account left pristine (read-only recon — 0 projects / 0 supplies
/ 15 inspo; no chat messages posted; every probe view reached by
navigation only); the accepted divergences remain documented (dev
badge, account email, the live's residue chat message, the mobile
login card's 0.5px offset, the nav-vs-aside + labeled-drawer
landmarks, the chat role="log" improvement, the closed-drawer inert +
aria-hidden pair, the single-main/single-copy structure, sub-perceptual
oklab-vs-rgba compositing and fractional text-row rounding, the
TW3/TW4 gradient-interpolation and transition property-list internals,
the live's four dead reduced-motion rules, WebKit unmeasurable in
this sandbox, and the documented dead-scaffold CSS state).

**Suggested next steps:** watch the CI verify-gate on the pushed
commit; candidate probe dimensions still unexplored: the WebKit
engine matrix (needs a host with GTK system libraries), `scripting:
none` / media-capability emulated rendering, a slow-network
first-paint capture matrix (the live's async style application,
characterized only at settle), and — newly relevant after r21-F1 — a
scrolled-state capture pair (both pages at scrollY=138) plus a
short-viewport matrix (the uncapped shell's breakpoints, e.g. 982px
where the page stops scrolling).
