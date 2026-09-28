# Session 55 — r31: the photo-state battery, the session-scoped badge, and the same-URL trap

Date: 2026-09-28 · Round 31 · Session doc continuation of session_53/54
(r30 complete and pushed at 2823ff3 + the session-log commit 928a385).

## What this round set out to do

1. `git pull` the workspace (fast-forward at 928a385 — the user's
   session_54 narration log), re-verify the baseline gates.
2. The candidates session_53 queued: the **photo-surface capture
   battery** at the canonical viewports (both sides driven to real
   photo states with paired captures), the 320px audit of the
   breadcrumb sub-views, and the periodic prod-mode spot-check.
3. Remediate anything found TDD-first; re-shoot the reference
   screenshots; align docs; commit and push to main.

## The battery (16 paired photo states, both sides driven identically)

A new capture battery drives each side through: the project create
modal with 2 staged photos → the post-create tiles → the "All
Projects" drill-down list (the chip with its photo thumb) → the detail
panel (the photo well + thumb grid) → the edit panel (the photo area
with existing photos); the supply equivalents (modal with the photo
preview, the post-create flat list, the chip with its banner, the
detail, the edit panel); both lists + details at 1280; both details at
320. Strict per-state assertions; both studios returned to the 0/0/15
pristine contract after each side.

The interaction model the battery had to learn (four debug
iterations, all scripted in the workspace `scripts/r31-*` files):

- the live's projects view is a TILES view — "All Projects" is a
  drill-down BUTTON that opens the chip-card list (cards in 3-col
  rows, the detail renders below the selected chip's row), and the
  supplies need the Paint category tile → the "All Paint" type tile;
- `agent-browser`'s `open` on the SAME URL as the SPA's current route
  is a no-op — the live pushes `/projects` and `/supplies` per view,
  so "reloading" `/supplies` directly silently preserved the current
  sub-view state (the **same-URL trap**; the battery now navigates
  via the ROOT first, then the drawer — see the F5 revert below);
- the clone's chip button text is prefixed by its NEW badge
  ("NEWr31 probe…") — the chip click anchors on the name leaf and
  walks up, with the direct on-screen button click as the primary
  path;
- reloads wipe `window.confirm` overrides — the battery re-arms the
  override after every navigation.

## The findings

**r31-F1 (HIGH)** — the project modal + edit panel thumb × buttons
are HOVER-GATED on the live: computed `opacity: 0`, full class
`…text-xs opacity-0 group-hover:opacity-100 transition
hover:bg-ast_pink`. The clone rendered them always-visible. The r30
element-isolation measurement caught the ×'s chrome but not its
interaction gating — isolated element shots bypass the hover state;
full-view paired captures are the ground truth. Fixed in both
surfaces; the r30 × class pins re-measured with the gating tokens
(runtime-constructed negative for the always-visible variant).

**r31-F2 (HIGH)** — the supply EDIT panel's barcode input: the live
uses the panel's standard pink input class; the clone reused the
CREATE modal's blue scanner style (`border-blue-500/40 bg-black/30` —
a scaffold leftover at supply-edit-panel.tsx:346; 10584 hot px, the
round's largest divergence). The live's CREATE modal barcode IS blue
— the clone's create modal matches and stays. Fixed with the panel's
shared `inputClass`; the r14 blue-family pin re-measured (create
keeps blue, edit negative-pinned).

**r31-F3 (HIGH)** — the NEW badge is SESSION-SCOPED on the live, not
window-scoped: an item created during the current SPA session badges
on all four surfaces (project chip, project detail h2, supply chip,
supply detail h2), and a full page reload drops every badge. The
decisive sequence: create → badge true at t+6s in-session; reload →
badge false everywhere; create again → badge true again. A
6-second-old item unbadges on reload while an 8-second-old item
still badges without one — the time-window hypothesis is eliminated
by construction (the clone's `isNewItem` used a 7-day createdAt
window, so its badges persisted across reloads on every post-reload
capture). Replicated with `src/lib/new-badge.ts` — an in-memory
registry of ids created this session (module state survives
client-side navigation and dies on reload, exactly like the live's
SPA state). The four badge surfaces consult `isNewSessionItem(id)`;
the two create flows mark the created id; `NEW_BADGE_WINDOW_MS` and
`isNewItem` are removed from studio-domain. The EXPORT wire format's
`isNew` flag is a separate measured surface (fresh items export
`isNew: true` — live exports 2026-09-17) and keeps its window
computation as a private helper in export-payload.ts.

**r31-F4 (MEDIUM)** — the project chip name's `pr-10` is conditional
on the badge on the live: in-session (badge present) the class is
`min-w-0 flex-1 truncate text-sm font-semibold leading-snug pr-10
text-ast_body`; post-reload (badge absent) the same class with an
empty slot where pr-10 was — the supply chip's established
pr-12/pr-2 pattern. The clone's pr-10 was unconditional. Fixed with
the conditional slot.

**r31-F5 — FOUND, FIXED, THEN REVERTED (the round's methodological
lesson)** — the supply-list captures showed the live's crumb as bare
"Art Supplies" while the clone's read "Art Supplies › Paint". An
early controlled test suggested the live's category tile was
data-dependent (any supplies → the flat list), and a cross-category
probe seemed to confirm it — the F5 fix landed (data-dependent
destination) with its pin. A later clean test (from a GENUINE tiles
state, 1 supply existing) showed the category click opening the TYPE
TILES — and the whole "flat list" reading collapsed: those captures
had hit the same-URL trap (the battery's `open /supplies` on the live
was a no-op that preserved the post-create flat-list state; the
category/All-Paint clicks were no-ops on that state). The canonical
behavior, measured cleanly three times (0 supplies, 1 supply, and
the flip test): **the category tile always opens the type tiles** —
which is what the clone originally did. F5 reverted; the pin replaced
with the corrected contract + the trap documentation so no future
round re-derives the data-dependent rule from same-URL captures.

## Non-findings (measured, no action)

- The live's `ast-img-safe` class on its imgs (an Amplify CSSOM
  artifact: lightningcss vars + `forced-color-adjust: none` inside a
  normal rule) — no visual effect in standard rendering; accepted
  divergence, documented.
- The live's edit-panel "Photo" label — present in the clone as a
  `<span>` (a label-tag dump missed it); the photo row renders
  identically.
- The with-photo chip name "text-[10px]" reading — twin-copy
  pollution (the 10px class belongs to the RAIL's name, which the
  clone already matches exactly).
- The live's post-create view-count staleness — a refetch-timing
  artifact; the paired post-create captures diff clean (0.160%,
  header band only) and steady state converges.
- The supply-edit residual (674 hot px at the barcode region
  post-fix) — sub-perceptual color-space rounding (the live's TW3
  rgba vs the clone's TW4 oklab serialization of the same color),
  VLM-verified invisible; the same class as the documented r27
  toggle-button border.

## The verification battery

- TDD: 4 RED pins → GREEN (the two × class re-measures, the hover-
  gating pin, the barcode pin), plus the new-badge registry suite
  (4 semantics + 6 wiring pins), the F4 conditional pin, the r14
  barcode pin re-measure, the F5 pin → corrected-contract pin after
  the revert. 394/394 vitest (383 + 11 net-new + 2 re-measured
  replaces), lint/typecheck/build clean, production CSS 151,532
  bytes (unchanged — the new utilities were already compiled), 0
  forced-colors / 0 ::selection.
- Browser verification: the clone's badge semantics byte-match the
  live's in-session state (badge true, name pr-10, chip img x106)
  AND its post-reload state (badge false, name pr-less, img x78.66);
  the modal × computes opacity 0; the edit barcode computes the pink
  border.
- The 16-pair battery re-run (the fixed navigation, both sides): all
  pairs converged — the pre-fix range 0.007–2.097% collapsed to
  0.007–0.243% with every band beyond the header accounted for as
  the documented data-only/sub-perceptual classes (the supply-edit
  barcode residual and 1-2px noise).
- Canonical regression: login-390 0.001% / login-1280 0.000% /
  dash-390 0.089% / dash-1280 0.188% — the r30 baselines hold.
- Prod-mode spot-check (the standalone build on :3001, the r29
  method): all four probes identical to the dev numbers — dev/prod
  render equivalence holds at r31.
- E2E 28/28, smoke 23/23 on the pristine seed state.
- The 9 reference screenshots re-shot with state checks; 8 captured
  byte-identical to HEAD (the r31 fixes touch data-dependent surfaces
  absent from the empty-studio shots), 1 pixel-identical re-encode.

## Suggested next steps

The battery tooling now knows the drill-down model, the same-URL
trap, and the session-badge semantics — a future round could drive
DEEPER data states (the stock filters, the supply assignment flow,
the import surface with photos) now that both sides can be driven to
identical states reliably. The 320px audit could extend to the
modal-with-photos state (this round measured the sub-views at 320;
the modals were measured at 390 only). The live site changed between
r30 and r31 (the chip redesign was detected through the battery) —
the drift check is worth repeating whenever a round lands.
