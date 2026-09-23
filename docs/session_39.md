# Session 39 — r23: the completed markdown-exclusion audit and the parity re-verification

**Scope:** workspace re-clone (main @ `0ccfd1e`, the interrupted r22
commit), core docs re-read (AGENTS/CLAUDE/README/PAD, session_36/37/38),
baseline gates on the pulled tree (lint ✓ typecheck ✓ vitest 333/334 —
ONE RED: the docs-token pin flagging the committed session_38.md
narration itself), then the completion of the interrupted r22 CSS-drop
audit, a full parity battery against the live, and the documentation
alignment.

## The round in brief

**Completing the interrupted r22 audit (r23-M0).** Session 38 stopped
mid-investigation: the markdown exclusion had dropped 1,241 bytes MORE
than the three known dead rules, and the accounting was open. This
round rebuilt BOTH trees (the r21 tree at `f49975e` in a git worktree —
152,035 bytes in this environment — and the r22 tree at 150,821) and
diffed them at the rule level (selector multiset + custom-property
emissions):

- **6 rules dropped** beyond the three session_37 regrown ones: the
  bare display-contents utility, the bare table-row-collapse utility, a
  bare coral-background utility (the opacity-modified variants that the
  style maps actually use all survive), a bare ring-color utility (only
  its focus-visible variant compiles, from the unused-but-scanned
  scaffold — present in both builds), the bare 8px backdrop utility
  (every real surface uses the -xl variant, which survives), and a
  garbage arbitrary-property rule that had compiled from CLAUDE.md's
  own error-log example (`[area:op]` → a literal `area: op` declaration
  — the repo's own operating doc had been emitting a fake CSS property
  into production for many rounds).
- **10 theme-variable emissions dropped** (all `:root` emissions with
  zero consumers): the body-font variable (harmless — it is declared in
  an inline theme block, so the utility inlines the stack verbatim; the
  rule is byte-identical in both builds), two legacy canvas-accent
  colors (kept in the token table for reference; no utility consumer),
  the six glow-shadow variables (their utility rules exist in BOTH
  builds with literal fallbacks — nothing references the variables),
  and the dead backdrop variable.
- **0 rules added, 0 emissions added.**

**Every dropped item was verified dead against src.** No rendered
surface uses any of them, and every utility the app DOES render
compiles from a literal class string in src — the status/condition
style maps in `studio-domain.ts` and the component ternaries are all
TW4-visible literals (the template-literal interpolations all trace to
those literals). The r22 markdown exclusion is therefore VERIFIED SAFE,
and the production CSS (150,821 bytes, 0 forced-colors, 0 selection, 0
doc-derived rules) is cleaner than any prior record — including the r21
"clean" baseline, which had silently carried ~1.2 KB of doc-derived
dead weight that no round had audited (the earlier remediations only
chased the two token families they stripped).

## Findings

| ID | Finding | Class | Action |
|---|---|---|---|
| **r23-F1** | The docs-token pin was RED on main: the committed session_38.md narration (inside the r22 commit) quoted the transparent-outline token verbatim on two lines — the exact recurring class the pin guards, breaking the verify-gate on main. | HIGH — RED gate | The two lines reworded to descriptive references; pin GREEN; 334/334. |
| **r23-F2** | The r22 commit's comments overclaimed the build diff ("drops exactly those dead rules and nothing else") — an unverified claim committed mid-audit. The audited truth: nine dead rules + ten dead var emissions dropped, all verified consumerless. | MEDIUM — evidence discipline | Both comments (globals.css + css-hygiene.test.ts) corrected to the audited accounting; rebuild verified byte-identical at 150,821 (the new comments compile nothing — same content hash). |
| **r23-F3** | `.env.example` referenced `docs/DEPLOYMENT.md §4` — the file did not exist (a dangling pointer since the r16 env rework). | LOW — docs alignment | `docs/DEPLOYMENT.md` created: build, database setup, environment variables (incl. the absolute-path production guidance the pointer targeted), running, and the pre-exposure security checklist — every claim verifiable against package.json / next.config.ts / db-path.ts. |
| **r23-F4** | The docs inventory was stale after the interrupted r22: AGENTS/CLAUDE/README said 333 tests (334 now), the r22-F2 markdown-exclusion contract was absent from AGENTS/CLAUDE, README lacked r22/r23 status rows, and the PAD lacked R22/R23 revisions. | MEDIUM — docs alignment | Full alignment: AGENTS (334 + the rewritten markdown quirk), CLAUDE (334 + the Tailwind exclusion note + the css-hygiene bullet), README (334 + r22/r23 status rows + the refreshed Verification row), PAD (R22/R23 revision entries, §7.1 306+28+25, four §10 resolved rows), and this session record. |
| **r23-M0** | The interrupted r22 audit (the -1,241-byte unaccounted CSS drop). | Methodology | Completed — see "The round in brief". The audit scripts live outside the repo (`/home/z/my-project/scripts/`); the accounting is recorded in the globals.css comment, the css-hygiene test comment, and the PAD R23 entry. |

## The parity re-verification (all executed this round)

The standard battery, rebuilt for this environment with the accumulated
methodology (neutral pointer parked before navigation, data-settled
gates, role-based toggle selectors after the off-screen-drawer trap, a
gradient-paint guard after the r22-M1 compositor race, poll-based
sign-in after two transient live round-trip timeouts):

| surface | hot% | r21/r22 baseline |
|---|---|---|
| login-desktop | 0.232 | 0.23 |
| dashboard-desktop | 0.333 | 0.33 |
| projects-desktop | 0.305 | 0.31 |
| supplies-desktop | 0.305 | 0.31 |
| inspiration-desktop | 0.466 | 0.47 |
| scrolled-desktop | 0.148 | 0.148 (r22) |
| dashboard-mobile | 0.328 | 0.33 |
| sidebar-drawer-mobile | 0.577 | 0.58 |
| chat-drawer-mobile | 1.144 | 1.14 (the live's residue message) |

Geometry byte-equal on both sides: docH 982, scrollMax 138, mainH 982
(the uncapped r21 shell contract holds); drawers at 312px/x=0 (tools)
and 312px/x=78 (chat). E2E 25/25, smoke 23/23, export envelope parity
(app "AST Studio", version 1, identical key sets — the live account left
pristine: 0 projects / 0 supplies, navigation + export only). Dev CSS
clean (186,780 bytes, 0 forced-colors, 0 selection); production CSS
clean (150,821, 0/0, same content hash after the comment fixes).

## The TDD cycle

The round's RED test already existed on main: the docs-token pin
failing on session_38.md (r23-F1) — the reword is the fix (RED → GREEN
observed: 333/334 → 334/334). No new pins: the audit's safety property
("every rendered utility compiles from src") is enforced by the
battery + E2E + smoke at parity, and a source-level "no doc-derived
tokens" pin would forbid the README/PAD token tables' legitimate
reference documentation — a false-positive generator, rejected. The
comment corrections (r23-F2) are behavior-neutral by construction and
were verified so (the rebuild produced the byte-identical stylesheet).

## Screenshots & docs

All 8 `docs/screenshots/` re-shot from the remediated dev server with
the state-check discipline (visible-heading verification before every
capture, neutral pointer, drawer geometry verified before the drawer
captures, the mobile set navigated at desktop before the viewport
switch, data-settled gates for the live's post-render fetches — plus
the scrolled-state reference from the r22 probe dimension).

Documentation aligned: AGENTS.md (334 inventory + the rewritten
markdown-exclusion quirk), CLAUDE.md (334 + the Tailwind note + the
css-hygiene bullet), README (334 + r22/r23 status rows + the refreshed
Verification row), PAD (R22/R23 revisions, §7.1 306+28+25, four §10
resolved rows), `docs/DEPLOYMENT.md` (new), and this record.
`.env.example` verified against the codebase (the app reads
`DATABASE_URL` + the optional `AST_PRISMA_DIR` only; the deployment
pointer now resolves).

**Session 39 (r23) complete — the interrupted r22 audit is finished
with a full rule-level accounting of the markdown exclusion (verified
safe: nine dead rules + ten dead emissions dropped, nothing real lost),
main is green again (334/334, verify-gate restored), the overclaiming
comments now state the audited truth, the missing deployment doc
exists, the documentation is aligned, and the full parity battery
stands at the documented baselines with the accepted-divergence set
unchanged.**

**Verification:** all claims executed and observed this session; the
live account left pristine (read-only recon — 0 projects / 0 supplies /
15 inspo; no chat messages posted; every probe view reached by
navigation only); the accepted divergences remain documented (dev
badge, account email, the live's residue chat message, the mobile
login card's 0.5px offset, the nav-vs-aside + labeled-drawer landmarks,
the chat role="log" improvement, the closed-drawer inert +
aria-hidden pair, the single-main/single-copy structure, sub-perceptual
oklab-vs-rgba compositing and fractional text-row rounding, the
TW3/TW4 gradient-interpolation and transition property-list internals,
the live's four dead reduced-motion rules, the TW3-emits-all-theme-vars
vs TW4-tree-shakes variable-emission difference (invisible — zero
rendered consumers read the dropped variables), WebKit unmeasurable in
this sandbox, and the documented dead-scaffold CSS state).

**Suggested next steps:** watch the CI verify-gate on the pushed
commit; the queued probe dimensions remain the WebKit engine matrix
(needs a host with GTK system libraries), a slow-network first-paint
capture matrix, and a repeated-capture reliability study of the live's
gradient-layer compositor race (r22-M1 — the flat-window artifact was
not observed in this round's captures).
