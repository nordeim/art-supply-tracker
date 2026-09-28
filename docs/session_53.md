# Session 53 — r30: the sub-390 band, the tab wrap, and the never-measured photo family

Date: 2026-09-28 · Round 30 · Session doc continuation of session_51/52
(r29 complete and pushed at 11c3953 + the session-log commit 9c85541).

## What this round set out to do

1. `git pull` the workspace (fresh clone at 9c85541), re-verify the
   baseline gates on the pulled tree.
2. The probe session_51 queued: the **sub-390 viewport audit** — the
   320px reflow was verified locally in the README battery but never
   measured against the live since r11 (the pinned matrix stopped at
   375).
3. Meticulously walk EVERY interactive surface the prior rounds' paired
   captures cannot reach with an empty studio — the photo flows (the
   live account ships 0 projects / 0 supplies, so no prior round had
   ever driven a photo upload on either side).
4. Remediate anything found, TDD-first; re-shoot the reference
   screenshots; align docs; commit and push to main.

## Baseline state on the pulled tree

Tree clean at 9c85541; deps and db intact; lint ✓, typecheck ✓,
vitest 374/374 ✓, build ✓ (the r29-complete state).

## The 320px survey

A paired-capture battery at 320×844 (login, dashboard, projects,
supplies, inspiration, both drawers) with the r27 pointer-parking rule
enforced — the first pass caught a hover artifact on the ☰ toggle (the
button is byte-identical in isolation; the clone's pointer had been
resting on it, mid-transition, during the capture). The clean battery:

| pair | result |
|---|---|
| login-320 | **SIZE MISMATCH** (live 1069 vs clone 1045) → F1 |
| dashboard-320 | 0.643% (a y1536-1631 band, ~3700 px) → F2 |
| projects-320 | 0.016% (the header email band only) |
| supplies-320 | 0.016% (the header email band only) |
| inspiration-320 | 0.017% (the header email band only) |
| sidebar-drawer-320 | 0.014% |
| chat-drawer-320 | **0.000%** (byte-identical) |

Both drawers measure 256px at 320 (80vw — the 312 at 390 was 80vw
too); the clone matches. The projects/supplies/inspiration views and
both drawers were already at parity.

## The findings

**r30-F1 (HIGH): the live's login tabs WRAP their labels at ≤330px.**
The live's `amplify-tabs__item` is `display: block; text-align: center;
padding: 12px 16px` with an EMERGENT height — at viewport 320-330 the
"Create Account" label (16px bold, ~118px) no longer fits the padded
tab (143px tab − 32px padding = 111px content) and wraps to two 24px
lines: the strip computes 74px (2 border + 12 + 24 + 24 + 12) and the
whole login page renders 1069px tall. From viewport 335 up the label
fits and the strip computes 50px (measured threshold: 74 at 320/330, 50
at 335/340/360/375/390). The clone's `flex h-[50px] items-center
justify-center` tab had no padding to overcome and a FIXED height —
the label never wrapped and the page rendered 24px short (1045).
Fix: `block flex-1 px-4 py-3 text-center` on both tabs — the height
emerges (50px single-line — the label's y-offset is IDENTICAL to the
old flex centering: top 2+12 = 14 on both), the equal widths stay via
flex-1 (the tablist is the flex container, like the live's
`--equal` modifier). Pinned in `viewport-fidelity.test.ts` (the chrome
+ a runtime-constructed fixed-height negative) and the r9 tab pin in
`login-fidelity.test.ts` re-measured.

**r30-F2 (HIGH): the dashboard Studio Spotlight portrait lacked
`shrink-0`.** The live's portrait carries `shrink-0` and renders a
CONSTANT 56px; the clone's flex row (portrait + gap-3 + the Kevin
Lewis text column) squeezed it to the text column's min-content
leftover — 49.59px at 320, 55 at 340, restored only from 360
(~3700 hot pixels on the paired capture). Fix: the live's own
utility on the img.

**The photo family (F3-F6) — measured by driving real uploads on both
sides** (temp rows created and deleted through the UI on the live; the
0/0/15 pristine contract verified after):

- **r30-F3 (MEDIUM): the supply modal's photo preview.** The live
  REPLACES the add-photo tile with the preview in the same slot — img
  `w-16 h-16 rounded-xl object-cover border border-ast_pink/30` (64px,
  at the tile's exact x/y) with the × button floating at
  `-top-1 -right-1` in `bg-black/60`. The clone kept the tile AND
  appended a 56px preview below it with a coral corner ✕ — both clone
  inventions.
- **r30-F4 (HIGH): the project modal + edit panel photo area.** The
  live renders a counter label **"Photos (N/30)"**, relabels the tile
  "Add more" once photos exist, HIDES it at 30/30 (overflow uploads
  silently dropped — measured to the cap with 30 uploads), and renders
  the thumbs as `grid grid-cols-5 gap-2 mb-3` of fluid
  `w-full aspect-square rounded-lg object-cover
  border-ast_turquoise/20` imgs in `div.relative.group` wrappers with
  the × INSIDE each thumb (`top-0.5 right-0.5`, `bg-black/60`) and a
  **"cover" badge** on the first (`bottom-0.5 left-0.5`, `text-[9px]`,
  `bg-black/60`, `text-ast_turquoise`). The clone rendered a static
  "Photos" span, kept "Add photos", and used a flex-wrap list of fixed
  64px `/30` thumbs with coral outside-corner ✕s.
- **r30-F5 (MEDIUM): the photo cap is 30, not 10.** The live's own
  counter displays (N/30); the clone's schemas and both panels capped
  at 10 (validation.ts ×3 schemas, both `slice(0, 10 − …)` calls).
  Fixed with a single-source `MAX_PROJECT_PHOTOS = 30` in
  studio-domain.ts.
- **r30-F6 (MEDIUM): the project chip's photo thumbnail.** The live's
  chip renders the first photo as an `h-10 w-10 shrink-0 rounded-lg
  object-cover opacity-85` thumb AFTER the name in the
  `flex min-w-0 items-start gap-2 mb-2` header row (measured: name
  x58 w40, img x106 w37 h40). The clone rendered no thumb at all. (The
  first fix placed the img FIRST — a re-measure on the live caught the
  order; swapped.)

**Verified MATCHING before the fixes (no action)**: the project detail
panel's `w-24 h-24` well + `grid-cols-5` `/20` purple thumbs + the
"Images (N)" label rendered only when length > 1 (the 1-photo state
measured on the live via the edit panel); the supply detail panel's
`w-32 h-32` photo under its "Photo" label; the supply chip's
`w-full h-16 object-cover rounded-xl mb-2` banner; the sidebar rail's
recent-project photo card; the fresh modals' geometry (byte-equal at
320); the add-photos tile's own classes; both file inputs
(`multiple`, `accept="image/*"`); the post-create navigation (stays on
the current view on both sides).

## The latent transport bug (found through the real UI)

The 30-photo submit through the real modal answered
**"Body exceeded 1 MB limit"** — Next.js's default Server Action body
cap. The live never hits a transport limit (its photos upload to S3
OUTSIDE the form save); the clone carries the same photos as data URLs
inside the action payload, so the transport must cover the full pinned
contract: 30 × MAX_PHOTO_DATA_URL_LENGTH (400k chars) + JSON slack.
Fixed with `experimental.serverActions.bodySizeLimit: "12mb"` in
next.config.ts + pinned; the 30-photo submit then succeeded end-to-end
(the project rendered with all 30 photos and the chip thumb, then was
deleted through the UI). NOTE: this bug pre-dates r30 — the old 10-cap
could exceed 1MB with ten ~100KB+ photos too; no prior round had ever
submitted a photo.

## The fix (TDD)

RED: 10 pins across 4 files — the new
`src/lib/photo-surface-fidelity.test.ts` (6 pins: the shrink-0 guard,
the supply tile-swap, the project modal + edit panel contracts, the
chip thumb + its ORDER, the 30 cap, the body-size limit), 2 new pins
in `viewport-fidelity.test.ts` (the tab chrome + the runtime-built
fixed-height negative), and 2 re-measures (the r9 tab pin in
`login-fidelity.test.ts`; the two 10-photo caps in
`validation.test.ts`, re-measured to 30 with an exact-30 acceptance
assertion). Exactly the 10 intended pins failed on the first run.

GREEN: 8 source edits — the two tab buttons, the portrait, the supply
modal photo block, both project photo areas, the domain constant +
3 schema bounds + 2 slices, the chip thumb, and next.config.ts.

## Post-fix verification

- vitest 383/383 (374 + 9 net-new); lint ✓ typecheck ✓ build ✓;
  production CSS 151,532 bytes (r29's 151,432 + 100 — the new
  utilities minus the dead coral/h-[50px] rules), 0 forced-colors,
  0 selection.
- E2E 28/28 and smoke 23/23 on a clean re-seeded database.
- Band re-verification at 320: the tab strip 74px and docH 1069 —
  byte-equal the live (was 50/1045); the threshold matches across the
  band (74 at 320/330, 50 at 335+); login-320 capture **0.001%**
  (was SIZE MISMATCH); dash-320 **0.008%** (was 0.643% — only the
  documented header email band).
- Photo surfaces in the browser: the supply preview at the live's
  exact slot (x215 y117 64px, tile gone, black/60 ×); the project
  thumbs byte-exact (counter "Photos (2/30)", grid
  `mb-3 grid grid-cols-5 gap-2`, thumb x41 y566.89 41.19×41.19,
  inside-×, cover badge, "Add more"); the cap verified to 30/30
  (tile gone, overflow dropped) and the full-cap submit succeeding
  end-to-end; the chip thumb byte-exact after the order swap
  (name x58 w40 h19, img x106 w37 h40 — identical to the live).
- Canonical regression: login-390 **0.001%** / login-1280 **0.000%**
  / dash-390 **0.089%** / dash-1280 **0.195%** — every residual in the
  documented data-only class (the account-email glyphs and the memory
  button's 2px email-width cascade; the r29 records were
  0.012%/0.001%/0.168%/0.307%).
- All 9 reference screenshots re-shot with pre-capture state checks
  (the two drawer shots needed a second pass — the first chat-drawer
  capture caught a stuck-open sidebar drawer; the lesson repeated: the
  page's toggle buttons are COVERED by the open drawer, so closing
  must go through the in-drawer ✕ Close button).
- The live left pristine (0/0/15; the two temp projects and the temp
  supply created for measurement were deleted through the UI with the
  confirm override, tile counts verified back to 0/0/15).

## Remediation summary

| ID | Finding | Resolution |
|---|---|---|
| F1 (HIGH) | The login tabs could not wrap — the live's Amplify tabs are block+padding with emergent height; at ≤330px the "Create Account" label wraps to a 74px strip (the clone's fixed h-[50px] rendered the page 24px short at 320) | `block flex-1 px-4 py-3 text-center` on both tabs; pinned in viewport-fidelity + the r9 tab pin re-measured |
| F2 (HIGH) | The Spotlight portrait lacked shrink-0 — the flex row squeezed it 56 → 49.59px at 320 (55 at 340) | the live's own utility on the img; pinned |
| F3 (MEDIUM) | The supply modal kept its add-photo tile next to a 56px below-tile preview with a coral ✕ — the live swaps the tile for a 64px preview with a black/60 × | the tile-swap ternary at the live's slot/chrome; pinned |
| F4 (HIGH) | The project modal + edit panel photo area: no counter, no relabel, flex-wrap 64px /30 thumbs, coral outside-✕, no cover badge | the live's full contract (counter label, 5-col grid, aspect-square /20, inside-×, cover badge, Add-more, tile gone at cap); pinned in both files |
| F5 (MEDIUM) | The photo cap was 10; the live's is 30 (its counter displays (N/30)) | `MAX_PROJECT_PHOTOS = 30` single-source; 3 schemas + 2 slices; the validation pins re-measured with an exact-30 acceptance |
| F6 (MEDIUM) | The project chip rendered no photo thumbnail; the live renders a 40px opacity-85 thumb AFTER the name | the thumb added at the measured position/order (the order re-measured mid-round); pinned |
| — (latent) | The Server Action body cap (1MB) rejected many-photo submits — unreachable for the live (S3 uploads) but a real clone defect since the first photo support | `bodySizeLimit: "12mb"` + pinned; the 30-photo submit verified end-to-end |

## Verification

All claims executed and observed this session. The live account was
left pristine (the 0/0/15 contract holds; sign-in only besides the
measured create→delete cycles).

## Suggested next steps

The viewport matrix now covers 320-330 (wrap band) / 335-360 / 375 /
390 / 414 / 480-768 / 1024 / 1280 / 1536 on the login and the studio
views at 320. Future candidates: a photo-surface capture battery now
that both sides can be driven to the photo states (the modal thumbs at
the canonical viewports), the 320px audit of the breadcrumb sub-views
(the studio views were measured at 320 in their top-level state only),
and the periodic prod-mode spot-check (clean at r29; re-run whenever a
dev-mode-only artifact is suspected).
