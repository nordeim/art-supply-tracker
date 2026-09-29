# Session 59 — r33: the list-order and md-crossing pass

Date: 2026-09-29 · Round 33 · Session doc continuation of session_57/58
(r32 complete and pushed at 9d5b9b4 + the session-log commit ae2a361).

## What this round set out to do

1. Refresh the workspace (pull the session-log commit), re-verify the
   baseline gates.
2. The candidates session_57/58 queued: the **stock-filter data states
   as paired captures** (the r31-style pixel battery over POPULATED
   filter states — this round's centerpiece), the **assignment flow
   with photos** on both sides, and the periodic **drift re-check**
   (the live is actively maintained — r31 saw a chip redesign land
   between rounds).
3. Remediate anything found TDD-first; re-shoot the reference
   screenshots; align docs; commit and push to main.

## The drift re-check — a redeploy, not visual drift

The canonical pairs answered **dash-1280 3.708% / dash-390 2.835%**
(was 0.188%/0.089%) — but the character of the change was entirely
different from r31's flake: both sides were perfectly self-stable
(0.000% across re-captures), the asset URLs had been re-hashed
(`portrait-01-BthGA3Kd.jpg` — a redeploy), and every downloaded asset
was **byte-identical** to the clone's copies. The magnitude histogram
settled it: below the top bar, **100% of the changed pixels sit at
anti-aliasing level** (delta ≤ 10/765 per pixel — zero small, medium,
or large deltas), and a VLM side-by-side read found no visual
difference beyond the account-email band. The live redeployed with a
new build whose text rasterization differs at sub-visible level. This
is the new measurement baseline, not a remediation target: paired
captures should expect ~2.5-5.5% "any-pixel" noise with ≤0.35%
visible-level residue (the email band + the documented gradient
rounding family).

## The paired battery — stock filters + assignment with photos

Both sides were driven through the identical seed (the real UI paths
only — modal creates with the shared test photo, edit-panel stock
statuses, create-time project assignment): "R33 Assign Project" (1
photo) + three Paint supplies — "R33 Ok Paint" (qty 2, photo,
assigned), "R33 Low Paint" (qty 1), "R33 Out Paint" (qty 0) — each
edit-panel status set (ok / low / critical). Captured: the Paint list
under **All / Low Stock / Out of Stock** at 1280, the assigned supply
detail, the project detail (assigned list + photo), and the two mobile
filter states at 390. DOM probes rode along for the filter-tab
contracts, the chip pills, and both detail panels. Both studios
returned to pristine (0/0/15) after each side.

### F1 (HIGH) — the list order was inverted on both layers

The battery's first big read: the live rendered the chips **Ok, Low,
Out** (creation order) while the clone rendered **Out, Low, Ok**
(newest first). Three probe families pinned the live's actual contract
— **insertion order, no timestamp sort at all**:

- **Edit probes** (live): editing the first item, the second item, or
  the newest item never floats or sinks anything — every
  updatedAt-keyed sort is ruled out in both directions.
- **Import probes** (live): a payload whose first row carries the
  NEWER payload stamp (2026) and whose second row carries a 2010
  stamp renders **Newer first** — a createdAt sort would have surfaced
  the 2010 row first. The projects list answered the same (insertion),
  so both lists share the no-sort contract.
- **The sidebar exception**: the RECENT PROJECTS rail *does* sort by
  updatedAt descending ("recently touched", r28-measured) — a separate
  contract that already matched and must not be "simplified".

The clone had **two** order-breaking layers: the queries
(`listProjects`/`listSupplies` carried `orderBy: { updatedAt: "desc" }`)
**and** the in-session create handlers (`[supply, ...list]` /
`[saved, ...list]` prepends — so even with a correct query the
just-created item rendered at the top). The fix removed the orderBy
from both queries (natural row order renders verbatim, exactly like
the live's backend) and switched both create handlers to appends.

### F2 (MEDIUM) — the supplies drill-down resets at the md crossing

The battery's mobile pair captured the live's **category grid**
against the clone's **drilled list** — the live's drill-down state had
reset. Resize probes pinned the exact contract:

| crossing | live supplies sub-view | live projects sub-view |
|---|---|---|
| 1280 → 770 (no md) | type list preserved | — |
| 1280 → 760 / 700 / 390 (md-down) | **RESET to category grid** | chip list **preserved** |
| drilled at 390 → 1280 (md-up) | type list **preserved** | — |

The boundary is exactly md (768): 770 preserves, 760 resets. The reset
is one-way (the up-crossing keeps whatever the mobile view held), and
the projects view survives BOTH crossings — an asymmetry verified with
a live data probe (a created project's chip stayed visible through the
700 crossing), not an empty-state read. The clone held all drill-down
state in `SuppliesView`'s own `useState` (it survived viewport
changes), so the reset had to be explicit: a `matchMedia
("(max-width: 767.98px)")` listener that calls the view's own
`navigate(null)` **only when `event.matches`** — the downward
crossing, exactly the live's one-way remount behavior.

### Non-findings (verified clean, no action)

- **The detail-panel DOM contracts all match** — the h2 (`text-lg
  font-bold text-ast-cyan`), the NEW badge spans (pink on supplies,
  turquoise on projects), every DetailField label/value class pair, the
  used-in pill (`bg-ast-lavender/20 text-ast-lavender`), the condition
  chip ("✓ ok" turquoise), the photo class, the project detail's
  supplies block / assigned `<ul>` / remove button / "Pick supply…"
  select / Assign button. Token ORDER differs (cosmetic — identical
  computed styles); the live's `ast-img-safe` img artifact is the
  r31-documented Amplify CSSOM no-op.
- **The Edit Project gradient button** — the largest pd-1280 band
  (647 visible px at y630-690) is the cyan→blue gradient, VLM-verified
  invisible (the r31 TW3-rgba vs TW4-oklab rounding family).
- **The stock-filter tab contracts** — class tokens match (active
  `bg-ast-electric-blue/20 text-ast-electric-blue`); the clone's
  `aria-pressed` attribute is an invisible a11y ADDITION the live's
  tabs don't carry (the test-id family — documented divergence, kept).
- **The chip pills** — OK/Low/Critical/"?" conditions, the NEW badge,
  "qty N", and the "1 project" assignment pill all render identically.

## Measurement artifacts documented (no clone action)

- **The mobile paired-capture methodology**: drill down **after** the
  viewport change — the live's md-down reset makes a drill-then-resize
  sequence capture the live's post-reset grid against the clone's
  preserved list. The battery's mobile pairs were re-taken with the
  corrected order and converged (36.1% → 1.4% / 0.9%).
- **The new AA-noise baseline** (see the drift section): ~3.7%/2.8%
  any-pixel on the dash pairs, sub-visible only.

## The verification battery

- TDD: **5 RED pins → GREEN** on the first run — three behavioral
  action pins (supplies insertion order with mixed non-chronological
  stamps, projects insertion order, updatedAt-edits-never-float) plus
  two viewport-fidelity source pins (the matchMedia one-way guard, the
  reset-stays-local-to-supplies pin). GREEN surfaced the UI-layer half
  of F1 (the browser verification still showed the inverted order on a
  fresh server) — the create-prepend — fixed with 4 more source pins
  in a new `list-order-fidelity.test.ts` (no orderBy, both appends,
  the sidebar rail's separate updatedAt-DESC contract).
  **408/408 vitest** (399 + 9 net-new), lint/typecheck/build clean,
  production CSS **151,532 bytes UNCHANGED** (0 forced-colors / 0
  ::selection — a leaked `.resize` utility from a bare token in a test
  comment was caught by the CSS-size gate and reworded; the r20
  lesson holds).
- E2E 28/28; smoke 23/23 on the pristine seed state.
- Browser verification through the real UI (5/5, agent-browser): three
  supplies created Ok → Low → Out render **Ok, Low, Out**; the md-down
  crossing (1280 → 700) resets the clone's drill-down to the category
  grid; the up-crossing (drilled at 700 → 1280) preserves the list;
  the projects chip list survives both crossings; cleanup pristine.
- The post-fix paired battery re-run on both sides (the corrected
  mobile methodology): all 7 pairs converged — visible-level residue
  ≤0.344% at 1280 / ≤0.176% at 390 (the email band + the documented
  gradient family), everything else sub-visible AA noise; a VLM
  side-by-side of the stock-filter pair reads **visually identical**.
  Both studios left pristine (0/0/15).
- The 9 reference screenshots re-shot with state checks: **all 9
  byte-identical to HEAD** — the r33 fixes are order/state-layer only
  and the empty-studio reference states never exercise them (the
  r31/r32 precedent for logic-only rounds). One screenshot-script bug
  was found and fixed en route: the r32-era "Dashboard" navigation
  (no such button — the tile is "My Studio") had silently captured
  the inspiration view for the mobile dashboard shot in the first
  pass; the re-shot with the correct tile restored the committed
  pixel state exactly.
- `.env.example` re-verified: no new environment variables (the round
  is logic-only; the schema and transport are untouched).

## Suggested next steps

The list-order and viewport-crossing semantics are now pinned
end-to-end on both layers. A future round could drive the **chat
drawer's data states as paired captures** (the community panel under
populated/scroll states — the r28 chat pair was data-only-clean but
the deeper scroll geometry has not been re-measured since the live's
redeploy), re-run the **canonical drift check against the new AA
baseline** to catch the next live redeploy, or extend the battery to
the **import-with-photos pixel pairs** (r32 verified the wire format
functionally; the rendered surfaces of imported photo items have not
been pixel-paired).
