# Session 45 — r26: the modal button-row + detail-heading chrome

Date: 2026-09-26 · Round 26 · Session doc continuation of session_43/44
(r25 complete and pushed at 65c87a2; the user committed the raw r25
narration as session_44.md — token-clean, so the docs-token pin stayed
GREEN on pulled main).

## What this round set out to do

1. `git clone` (the workspace had been reset), re-review the core docs,
   validate against the codebase, run the baseline gates.
2. A fresh live-vs-clone survey WITH MATCHED TEST DATA on both sides —
   the prior rounds' batteries covered the pristine steady-state
   surfaces; the create/detail/edit surfaces need real rows to exercise,
   so both studios carried one test supply + one test project through
   the survey (both deleted through the UI afterward — the live's
   pristine contract holds: 0 projects / 0 supplies / 15 inspo at
   session end).
3. Remediate anything found, TDD-first; align docs; re-shoot the
   reference screenshots; commit and push to main.

## Baseline state on the pulled tree

- Tree clean at 8c243d6; lint ✓, typecheck ✓, vitest 348/348 ✓, build ✓;
  production CSS 151,058 bytes (the r25 record's 151,043 ± 15 bytes of
  build metadata; 0 forced-colors, 0 selection — hygiene clean).
- E2E 28/28 ✓; smoke 23/23 ✓.

## The findings — both in the chrome the steady-state batteries never measured

**r26-F1 (HIGH): the create modals' Cancel buttons carried `text-sm`.**
Measured on the live (both modals): the Cancel and the gradient submit
compute `font-size: 16px; line-height: 24px` — NO font-size utility in
their class strings. The bordered Cancel (1px border + py-2) is the
flex-stretch row's tallest child at 42px, and the row's default
`align-items: stretch` sizes BOTH buttons to 42. The clone's Cancel
carried `text-sm` (14px/20px → 38px natural), so its row rendered 40px,
its modal card 542 vs the live's 544 (desktop) and 792 vs 794 (supply),
and the Cancel text rendered 2px smaller than the live's. The 1px
centering shift (y 151 vs 150) rippled the turquoise border and glow
across the modal in paired captures.

**r26-F2 (MEDIUM): the detail panels' H2s carried a flex row.**
Measured on the live (both panels): the H2 is a plain
`text-lg font-bold text-ast_cyan` BLOCK whose NEW badge flows INLINE —
the badge's own `ml-2` supplies the 8px title gap, and the inline box
renders 18px tall at +6.25px into the 28px H2. The clone's H2 carried
`flex flex-wrap items-center gap-2`, which (a) DOUBLED the title→badge
gap to 16px (gap-2 + the badge's ml-2 both applying), (b) inflated the
badge to 20px (a flex item's padding-augmented box vs the live's inline
box), and (c) shifted it 2px up — a measured 8.4%-of-cell pixel diff in
the supply-detail capture and an innerText difference ("Test
ExhibitionNEW" vs "Test Exhibition\nNEW").

Both fixes are class REMOVALS — the live renders these surfaces from
leaner class strings than the scaffold shipped.

## The fix (TDD)

1. RED: 10 new pins — 5 in `supply-fidelity.test.ts` (the supply-modal
   Cancel/submit/row + the supply-detail H2/badge) and 5 in the new
   `project-fidelity.test.ts` (the project-modal Cancel/submit/row + the
   project-detail H2/badge). 4 failed exactly as intended (the Cancel
   text-sm pins + the H2 plain-block pins); the submit/row/badge pins
   were green on arrival (they pin the already-correct neighbors).
2. GREEN: four one-line edits — drop ` text-sm` from both modal Cancel
   class strings; drop `flex flex-wrap items-center gap-2 ` from both
   detail H2 class strings. No layout logic touched: the 42px row
   emerges from the live's own flex-stretch mechanism, and the inline
   badge from the badge's own `ml-2 align-middle`.
3. Post-fix, byte-exact on every measured metric: project modal 544 @
   y=150 with Cancel/Create 42px at 16px/24px; supply modal 794 with
   Cancel/Add 42px; supply-detail H2 193px wide (live 192.69) with the
   badge 18px at +6.25 (live 6.25); project-detail H2 659/28 with the
   badge 18px at +6.25. The supply-detail paired capture returned to
   the accepted header/chat-data-only diff set.

## What the survey confirmed at parity (no action)

The edit panels' Cancel/Save row (42px/16px — the clone's edit panels
never had the text-sm), the detail panels' Close/Delete/Edit action
buttons (38px/14px — the clone's `text-sm` there is live parity), the
chat Send button (34×54/12px both sides), the chips' default AND
selected treatments (border/bg/shadow/text token sets equal; the live
carries no aria-expanded, the clone's is a kept invisible-semantics
addition), the status tiles, the modal fields (labels 14px/20px,
inputs 42px, selects 37px, textareas 66px — identical), the mobile
drawers' geometry and shared scrim, and — after driving both sides'
mobile copies to the same state — the mobile scroll architecture:
page 1362 / section 1220 / scrollHeight 1218 with the edit panel open,
identical on both sides.

## The twin-copy state-instance split (documented, not fixed)

The round's biggest methodological lesson: the live's hidden desktop
copy and visible mobile copy hold SEPARATE React view-state instances.
Interactions on one copy leave the other's supplies sub-view at its own
last value, so a viewport crossing mid-session surfaces that copy's
state — which repeatedly made paired mobile captures compare the live's
category grid against the clone's open edit panel (a 60-90% pixel diff
that decomposes to pure state mismatch). The clone's single responsive
copy (the r18 accepted divergence, pinned by landmark-fidelity) keeps
one state across the crossing. This is a CONSEQUENCE of the accepted
divergence, not a defect: replicating it would require the twin-copy
structure the r18 pin rejects. Documented in AGENTS.md (the r18 quirk
note) and PAD §10 as an accepted divergence with the capture-methodology
rule: paired captures at different viewports must drive each side's
visible copy to the same state first.

## Post-fix verification

- vitest 358/358 (348 + 10 new); lint ✓ typecheck ✓ build ✓; production
  CSS 151,058 bytes unchanged (the removed classes still compile from
  their many other usage sites; 0 forced-colors, 0 selection).
- E2E 28/28 and smoke 23/23 on a clean re-seeded database (the first
  post-fix E2E run failed 4 specs on DATA POLLUTION from this session's
  manual rows — the suite's pristine-seed prerequisite; re-run green
  after `db:push` + `db:seed`).
- All 9 reference screenshots re-shot on the remediated tree.
- `.env.example` re-verified against the codebase (unchanged:
  DATABASE_URL + the AST_PRISMA_DIR escape hatch documented; the
  DEPLOYMENT.md pointer resolves).
- The live left pristine (0 projects / 0 supplies; both test rows
  deleted through the UI with the native confirms; no chat messages
  posted; the one pre-existing live-side message — "Hello from clone
  test", Sep 16 — predates this session).

## Remediation summary

| ID | Finding | Resolution |
|---|---|---|
| F1 (HIGH) | Create-modal Cancel buttons carried text-sm (14px/20px) — row 40px vs the live's 42px, modal card 2px short, smaller Cancel text | Class removal in both modals; 6 pins across supply/project fidelity files (Cancel no-text-sm, submit base-font, the row layout) |
| F2 (MEDIUM) | Detail-panel H2s carried a flex-wrap/gap-2 row — doubled title→badge gap, 20px badge, 2px shift | Class removal in both panels; 4 pins (the H2 exact string + the inline-badge contract) |
| F3 (DOCS) | Twin-copy state-instance split undocumented | AGENTS.md r18-note + PAD §10 accepted-divergence row (the capture-methodology rule) |
| F4 (DOCS) | Docs alignment | AGENTS (358 + the r26 chrome), CLAUDE (358 + supply/project fidelity), README (358 + the r26 row), PAD (R26 revision, §7.1 330+28, the §10 row), SKILL.md (r26 frontmatter + Appendix A), this record |

## Verification

All claims executed and observed this session. The live account was
left pristine. The accepted-divergence set gained one entry (the
twin-copy state-instance split — a consequence, not a new divergence
class).

## Suggested next steps

Watch the CI verify-gate on the pushed commit. Future candidates: the
create-modal fields at the MOBILE viewport (this round measured them at
desktop only), the duplicate-email Create Account alert (a real account
exists to duplicate), and a paired capture battery that drives each
side's visible copy through IDENTICAL interaction scripts before
capturing (the methodology fix this round had to improvise).
