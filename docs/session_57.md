# Session 57 — r32: the import/export semantics pass

Date: 2026-09-29 · Round 32 · Session doc continuation of session_55/56
(r31 complete and pushed at df9018a + the session-log commit 053776e).

## What this round set out to do

1. Refresh the workspace, re-verify the baseline gates.
2. The candidates session_56 queued: **deeper data states** (the stock
   filters, the supply-assignment flow, the import surface with photos),
   the **320px modal-with-photos audit**, and the periodic **drift
   re-check** (the live demonstrably changed between r30 and r31).
3. Remediate anything found TDD-first; re-shoot the reference
   screenshots; align docs; commit and push to main.

## How this round ran (the interruption and restoration)

The r32 survey ran to completion in the prior session — the drift
re-check, the live probes, the findings, the RED/GREEN implementation,
and the post-fix battery — but the session was interrupted **before the
commit**, and the workspace was reset. This session restored the repo
fresh from `053776e` (r31-complete), re-validated the baseline (394/394
vitest, lint, typecheck), **re-implemented the identical fix set
TDD-first** (7 RED pins across 4 test files → GREEN, 399/399), and
re-verified everything through the full local battery: lint,
typecheck, build, E2E 28/28, smoke 23/23, a 17-check browser
verification through the real import → badge → edit → export flow, and
the 9 reference screenshots re-shot with state checks. The live-side
measurements below are the prior session's probes (the live left
pristine after every one, 0/0/15 verified).

## The drift re-check — a capture flake, not drift

The canonical pairs first answered dash-390 4.809% / dash-1280 2.607%
(was 0.089%/0.188%) — a ~144px hot block on both viewports. Cropping
and DOM probing traced it to the **Art History card's gradient
placeholder**: the live's computed gradient is intact, a viewport-only
screenshot paints it correctly, and a **re-take of the full-page
capture paints it too** — the live's gradient can fail to paint in
`captureBeyondViewport` mode. Both canonical re-captures came back at
the r31 baselines exactly (login 0.001%/0.000%, dashboard
0.089%/0.188%). **Measurement rule: always re-verify a full-page
"drift" with a second capture before acting on it.**

## The survey

The round probed the surfaces no prior round had driven with data:
the **stock-filter tabs** (clean — the counts and empty states match),
the **supply-assignment flow** (clean — the project-detail picker +
Assign + × markup matches the clone token-for-token, measured with an
assigned supply present AND with unassigned supplies existing), the
**import surface with photos** (the live accepts data-URL photos and
renders them as raw data-URL srcs; its export emits S3 signed URLs +
imageKeys — the accepted storage divergence, with the data-URL
equivalent byte-matching the clone's emission), and the **320px
modal-with-photos audit** (clean at 0.029%/0.007%).

## The findings

**r32-F-A (HIGH)** — the live's import **preserves the payload's
`createdAt`/`updatedAt`**: a crafted `03:09` stamp came back VERBATIM
on re-export. The clone's import stamped `now()` on every created row.
The stamp difference also **inverted the chip order** for
identical-timestamp payloads: the live's `updatedAt DESC` sort keeps
the payload's insertion order (three identical-stamp supplies list as
ok > low > crit), while the clone's per-row now() stamps sorted the
LAST created first (crit > low > ok) — the order divergence was a
symptom of F-A, not a separate finding. Fixed: the normalizer always
emits `createdAt`/`updatedAt` per item (a valid ISO string or epoch
number passes through; a bogus stamp degrades to null so the create
falls back to the DB default), and the import action's creates carry
the stamps.

**r32-F-B (MEDIUM)** — the live exports `subcategory: ""` for absent
subcategories, measured on BOTH a UI-created bare supply and an
imported one: the live's in-memory model defaults the picker to ""
exactly like budget and barcode (r11's family). The clone exported
`null`. Fixed: `toExportedSupply` emits `subcategory ?? ""` (DTO
retyped `string | ""`). Round-trip safe either way — the import
normalizer folds "" back to null.

**r32-F-C (HIGH)** — the live's import **honors the payload's `isNew`
flag** for badge rendering. An imported item with `isNew: true`
carries the NEW badge in-session on the chip/detail surfaces; an item
with `isNew: false` never badges — the decisive probe (payload
`isNew: false`) eliminated the first reading that the live marks
imported items unconditionally. The clone's import ignored `isNew`
entirely. Fixed: the normalizer always emits `isNew` per item (only
an explicit true is true), the import action returns
`createdProjects`/`createdSupplies` — each created row's id with its
payload `isNew` flag — and studio-app's import handler marks the
session-badge registry from exactly those.

**r32-F-D (MEDIUM)** — the live's edit panel mounts its Estimated
Budget input **EMPTY** for budget-less projects (`value=""`), measured
for both imported and UI-created budget-less rows. The clone's
`budgetEditValue(null)` returned `"0"` — an early-round pin that had
never been re-measured against a budget-less project. Fixed: `""`;
the pin re-measured.

## Non-findings and measurement artifacts (documented, no action)

- The live's export photo storage class (S3 signed URLs, imageKeys,
  coverImageUrl) — the accepted storage divergence; for data-URL
  photos the live's export emits exactly what the clone emits
  (coverImageUrl = the data URL, imageKeys: [], images = the data
  URLs).
- The live's post-reload projects list stays empty for **imported**
  items for 60+ seconds (a live-side refetch quirk — r31's UI-created
  items repopulated fine; the items exist and are deletable). The
  reloaded pair was dropped from the convergence set; documented as
  live behavior, not clone behavior to replicate.
- The battery's two invalid pairs (a 1280 supplies-list pair that
  compared the live's tiles against the clone's drilled list — the
  live's viewport switch resets its sub-view; and a 320 modal pair
  with a one-off photo-order upload flake) — re-captured correctly.

## The verification battery

- TDD: 7 RED pins across 4 test files → GREEN — exactly the intended
  failures on the first run. Net +5 tests (export-payload: the absent
  subcategory "" pin, the project normalizer three-fields pin, the
  supply normalizer three-fields pin; validation: the gate's declared
  fields + type rejection pin; studio action: the timestamp/isNew
  import pin) plus 2 re-measures (the budgetEditValue null pin, the
  import return-shape pin). **399/399 vitest**, lint/typecheck/build
  clean, production CSS 151,532 bytes (UNCHANGED — the fixes are
  logic-only), 0 forced-colors / 0 ::selection.
- E2E 28/28; smoke 23/23 on the pristine seed state.
- Browser verification through the real UI (17/17, agent-browser):
  the flagged items badge on the drilled-down chip lists while the
  unflagged do not (project + supply); the identical-stamp payload
  order preserves insertion order (New > Old > Crit); the budget-less
  edit input mounts EMPTY; the export blob carries `subcategory: ""`
  and the payload's stamps verbatim; both studios restored to
  pristine after the empty re-import.
- The 9 reference screenshots re-shot with state checks; 7 changed,
  2 byte-identical to HEAD (the r32 fixes touch data-dependent
  surfaces absent from the empty-studio shots — the r31 precedent).
- `.env.example` re-verified: no new environment variables (the round
  is logic-only; the schema and transport are untouched).

## Suggested next steps

The import/export wire semantics are now fully pinned end-to-end. A
future round could drive the **stock-filter data states as paired
captures** (this round verified the filter counts functionally; the
r31-style pixel battery over populated filter states has not run),
or extend the paired battery to the **assignment flow with photos**
(both sides driven to an assigned + photo'd state). The drift check
remains worth repeating every round — the Art History gradient flake
is now a documented trap, but the live's between-round changes (the
r31 chip redesign) show the site is actively maintained.
