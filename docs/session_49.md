# Session 49 — r28: the optimizer re-encodes, the rail cards' type scale, and the dev badge

Date: 2026-09-27 · Round 28 · Session doc continuation of session_47/48
(r27 complete and pushed at caf5222 + aeca092; the user committed the raw
r27 narration as session_48.md).

## What this round set out to do

1. `git clone` (the workspace had been reset), re-review the core docs,
   validate against the codebase, run the baseline gates.
2. A fresh live-vs-clone survey with the r27 paired-capture methodology
   (pre-capture state verification on both sides), targeting the residuals
   the steady-state batteries had been carrying: the 0.2-0.5% "accepted"
   bands on every desktop view and the mobile login's 0.61% (the r27
   record was 0.14% — a regression-looking number worth explaining).
3. Remediate anything found, TDD-first; align docs; re-shoot the
   reference screenshots; commit and push to main.

## Baseline state on the pulled tree

- Tree clean at aeca092; lint ✓, typecheck ✓, vitest 362/362 ✓, build ✓;
  production CSS 151,058 bytes (the r26 record, exactly); 0
  forced-colors, 0 selection — hygiene clean.

## The survey (12 paired capture sets + DOM probes)

Desktop (1280×800) and mobile (390×844) batteries over the four views,
login, and both drawers — every capture preceded by the state check
(scrim DOM presence, drawer translate-x, scrollY, visible h1) on both
sides. First-pass numbers: desktop 0.14-0.55%, mobile 0.27-0.94%,
chat-drawer 5.09%.

The 5.09% chat drawer was traced to the live's SIXTH chat message
("Hello from clone test", posted by the account itself on Sep 16 — the
r27 session's own "one extra live chat message" data-only note). The
drawer's content container: live 619px vs clone 541px — exactly the
78px of that card. Data-only, no action (the seed pins the original
five; the live stays pristine).

Three real signal bands survived after the data-only subtractions —
all three turned out to be distinct defects:

## The findings

**r28-F1 (HIGH): three `next/image` usages render through the Next
image optimizer — re-encoded assets instead of original bytes.** The
live serves its asset files as ORIGINAL bytes from S3/CloudFront
(md5-verified identical to `public/assets/*`). Three of the clone's
`next/image` usages lacked `unoptimized`, so they served
`/_next/image?url=…&w=…&q=75` — sharp's re-encode (JPEG q75 / PNG
resample) — a double resample against the live's single decode:

- the login page's ArtDeadline badge (212×56 at 1:1 — ±1-3 RGB drift
  across the badge, ±12 on glyph edges; the mobile login capture's
  y403-450 band);
- the header AST logo (1068×269 intrinsic served at w=3840&q=75, then
  browser-scaled to 159×40 — the y0-79 band, 2.4%, on EVERY desktop
  capture);
- the dashboard's Studio Spotlight portrait (served w=128&q=75 at 1:1 —
  the y722-802 band, 2.5%, desktop dashboard).

Every OTHER image usage in the repo already carried `unoptimized`
(ADR-06's data-URL contract, the feed's measured parity). These three
were the stragglers. Fix: `unoptimized` on all three (the width/height
layout attributes stay — no CLS change).

**r28-F2 (MEDIUM): the inspiration view's Partners card body rendered
10px — the live's inspiration-view copy uses 11px.** The live renders
the inspiration rail TWICE at different type scales (its twin-copy
split: the sidebar drawer's rail at text-xs/10px, the inspiration
view's rail at text-sm/11px — two real components in the clone,
mirroring the split). The clone's inspiration-view Partners body P
carried `text-[10px]` (lh 13.75) where the live's copy computes
`text-[11px]` (lh 15.125). The 2.75px shorter body made the card's
vertically-centered P-stack sit 1.375px lower (measured: P1's gap from
the card top 24.4375 live vs 25.8125 clone — exactly half the height
delta), shifting every text row in the card. Fix: `text-[11px]` —
after, P1 y556.4375 on both sides, byte-exact.

**r28-F3 (MEDIUM): the sidebar drawer's Partners card title carried an
extra `leading-snug`.** The live's drawer copy renders the Partners
title at `text-xs font-semibold text-[#8D5CFF]` — NO leading class
(text-xs's own 12px/16px pair). The live's Quote and Art-History titles
DO carry leading-snug — the live's own inconsistency, faithfully
cloned — but the Partners title does not. The clone's extra
`leading-snug` (16.5px) pushed its body line 0.5px down and
re-anti-aliased both text rows (the sidebar-drawer capture's y700-780
band, 4.5% concentrated in the glyph rows). Fix: drop `leading-snug`
from that one class string — after, all three P metrics byte-exact
(y671.25 / 690.25 / 710.25, lh 15/16/13.75).

**r28-F4 (methodology): the Next.js dev-tools indicator badge polluted
every dev-mode capture.** The badge (36×36, dark gray, fixed
bottom-left — x20, y788 at 390×844) renders into every `next dev`
screenshot; the live carries no badge. It contributed 0.1-0.5% to every
capture (the mobile inspiration capture's whole y773-844 band was
badge-only — probed pixel-by-pixel, 0 non-badge diff pixels). The
r27-era low login residuals imply it went unnoticed then (it appears in
the NEXTJS-PORTAL's shadow DOM, invisible to DOM probes that don't look
there). Fix: `devIndicators: false` in next.config.ts — the badge never
renders in dev; the dev overlay itself still functions on runtime
errors; production output unchanged.

**r28-F5 (found during F4's verification): the login link buttons'
labels rasterized 1px low.** The live's `amplify-button--link` chrome:
inline-flex, padding 6px 12px, line-height 21px (1.5 × the 14px label),
the 35px height EMERGENT (6+21+6+2). The clone's `flex h-[35px] … px-3
text-sm` kept the box right (182.34×35 byte-exact) but centered a 20px
line (text-sm's own) at a HALF-pixel offset (843.5 vs the live's
integer 843) — Chromium's glyph raster snapped the label one pixel
lower on all three link buttons (Forgot / Back to Sign In / Resend
Code). Fix: the live's own emergent chrome — `inline-flex … px-3
py-1.5 text-sm font-bold leading-normal` (py-1.5 = 6px, leading-normal
= 21px at 14px): the height still emerges to 35px, every computed
metric matches (lh 21, pad 6px 12px), and the label raster matches.
The alert's Dismiss button was probed for the same pattern: its box,
font (16px/24px), and text position already match — no change (its
h-[34px] cap + the fixed line 24px center identically; the live's own
8px vertical padding is absorbed by its capped height the same way).

## The fix (TDD)

1. RED: three new test files + one updated pin family —
   `image-fidelity.test.ts` (3 pins: the unoptimized contract on each
   usage, with the r8 logo-contract attributes re-verified),
   `rail-card-fidelity.test.ts` (4 pins: both Partners cards' title and
   body class contracts in BOTH rail copies),
   `dev-chrome-fidelity.test.ts` (1 pin: devIndicators: false), and the
   r9/r20 link-button pins in `login-fidelity.test.ts` +
   `login-motion-fidelity.test.ts` re-measured for the emergent chrome
   (h-[35px] negative-pinned; py-1.5/leading-normal pinned; +1 net-new
   pin giving every link the 21px line). Exactly the intended pins
   failed on the first run (6 + 4 = 10 RED).
2. GREEN: six source edits — `unoptimized` on three Image usages
   (`login-screen.tsx`, `dashboard-view.tsx`, `studio-app.tsx`),
   `text-[11px]` on the inspiration-view Partners body,
   `leading-snug` dropped from the sidebar Partners title, the three
   link-button class strings, and `devIndicators: false` in
   `next.config.ts`. No layout logic touched anywhere.

## Post-fix verification

- vitest 371/371 (362 + 9 net new); lint ✓ typecheck ✓ build ✓;
  production CSS 151,282 bytes (r27 record 151,176 + 106 — measured on
  the final tree, post-F5: the link buttons' `leading-normal` utility
  rule + its `--leading-normal:1.5` var emission are NEW to the
  stylesheet (~+128 bytes, the r27 tree used `leading-normal` nowhere)
  and the dropped `h-[35px]` rule gives back ~22; the text-[10px]→
  text-[11px] swap traded already-compiled utilities — genuinely
  net-zero); 0 forced-colors, 0 selection. (The 151,176 "unchanged"
  figure recorded mid-round was a pre-F5 measurement carried forward —
  corrected here against the built artifact.)
- E2E 28/28 and smoke 23/23 on a clean re-seeded database.
- Browser-metric verification, all byte-exact against the live: the
  three images serve original bytes (`/assets/…`, no `/_next/image`);
  the inspiration Partners P1/P2/P3 at y556.4375/577.4375/619.9375
  (lh 15/19.25/15.125); the sidebar Partners P2 at lh 16px; the link
  buttons at lh 21px, pad 6px 12px, box 182.34×35 @ (103.83, 836); the
  dev badge absent from the DOM and the pixels.
- Paired captures after the fix: **login-desktop 0.00%, login-mobile
  0.01%** (was 0.14%/0.61%); dashboard/projects/supplies/inspiration
  desktop all 0.20% and mobile 0.09-0.17% (the chat-6th-message and
  account-email data-only residuals); sidebar-drawer 0.14% (the
  gradient email glyph row — different account emails, same chrome);
  chat-drawer 2.27% (the 78px extra live message).
- One capture-methodology trap resolved this round: a state-mismatched
  drawer battery (My Studio active on the clone vs INSPO active on the
  live) false-diffed 3.09% — the r27 state-verification rule caught it
  (re-captured with matching view states → 0.14%). The rule works.
- All 9 reference screenshots re-shot on the remediated tree (4
  desktop views + scrolled + login at 1536×844, dashboard + both
  drawers at 390×844).
- The live left pristine: zero projects / zero supplies / 15 inspo
  entries (no rows created or deleted; no chat messages posted; the
  duplicate-email / bad-credential probes create nothing).

## Remediation summary

| ID | Finding | Resolution |
|---|---|---|
| F1 (HIGH) | 3 static-asset `next/image` usages served optimizer re-encodes (q75) vs the live's original bytes — measurable drift on every view | `unoptimized` on the ADC2 badge, the Spotlight portrait, and the header logo; 3 new pins (`image-fidelity.test.ts`) |
| F2 (MEDIUM) | Inspiration-view Partners body at text-[10px] vs the live copy's 11px (content centers 1.375px low, every row shifts) | `text-[11px]`; pinned in `rail-card-fidelity.test.ts` |
| F3 (MEDIUM) | Sidebar Partners title carried an extra leading-snug (16.5px vs the live's 16px) | Class dropped; pinned (with the Quote/Art-History counter-examples documented) |
| F4 (methodology) | The Next dev-tools badge (36×36 fixed bottom-left) polluted every dev capture | `devIndicators: false`; pinned in `dev-chrome-fidelity.test.ts` |
| F5 | The login link buttons' 20px lines centered at a half-pixel — labels rasterized 1px low | The live's emergent chrome (py-1.5 + leading-normal 21px); r9/r20 pins re-measured |
| — | The live's 6th chat message (data-only) | No action — the seed pins the original five (r27 precedent) |

## Verification

All claims executed and observed this session. The live account was
left pristine (the 0/0/15 contract holds; its chat history now carries
six messages — five seeded + the account's own Sep 16 test post).

## Suggested next steps

Watch the CI verify-gate on the pushed commit. Future candidates: the
twin-copy state-instance split (the live's desktop/mobile copies hold
separate view-state — documented, only reachable mid-session at a
viewport crossing), the login inputs at the 480-768 viewport band (the
max-w handoff — unmeasured between the two pinned breakpoints), and a
prod-mode (`bun run start`) capture battery to confirm the dev/prod
render equivalence now that the badge no longer forces the question.
