# Session 51 — r29: the 480-768 band, the card's true handoff, and the prod-mode battery

Date: 2026-09-27 · Round 29 · Session doc continuation of session_49/50
(r28 complete and pushed at 2fe1c2a; the user committed the raw r28
narration as session_50.md and the agent worklog as worklog.md).

## What this round set out to do

1. `git pull` (two new commits: the session_50 narration + the repo
   worklog), re-verify the baseline gates on the pulled tree.
2. The two probes session_49 queued: the **480-768 viewport band**
   (the login card's max-w handoff — unmeasured between the two pinned
   breakpoints 390 and 1280) and the **prod-mode capture battery**
   (dev/prod render equivalence — now answerable since r28 turned the
   dev-tools badge off).
3. Remediate anything found, TDD-first; re-shoot the reference
   screenshots; align docs; commit and push to main.

## Baseline state on the pulled tree

- Tree clean at 91e1bb8; deps and db intact; lint ✓, typecheck ✓,
  vitest 371/371 ✓ (no re-build needed — the pull brought only .md
  files).

## The prod-mode battery (session_49's probe, answered first)

A production server (the standalone build, port 3001) was captured
against the dev server (port 3000) at both canonical viewports:

- login desktop 1280×800: **0.000%** (byte-identical)
- login mobile 390×844: **0.000%**
- dashboard desktop: **0.000%** (a first-pass 2.88%/4.27% was a
  first-load transient — a clean re-capture pair is byte-identical,
  stable across two re-runs)
- dashboard mobile: **0.000%**

**Conclusion: dev and prod render identically.** The dev-tools badge
was the only dev/prod gap (r28-F4); nothing else diverges. The r28
capture methodology (dev-mode captures) is validated against the
production ground truth. No action.

(Sandbox note: the standalone server does not survive between Bash
invocations — the battery ran with server start + captures inside one
invocation; the dev server from the r28 session's double-fork launch
kept running throughout.)

## The 480-768 band survey (the round's finding)

The band was a genuine blind spot: every prior round pinned 375/390
(mobile) and 1024/1280 (desktop) — the middle was never measured.
Sweeping the live's login card across the band:

| viewport | live card | live layout track |
|---|---|---|
| 390 | 357 @ x16.5 | column (358) |
| 414 | 357 @ x28.5 | column (382) |
| 480 | **480 @ x16** | **480px** (overflows the 448 column) |
| 560 | 480 @ x40 | 528px (fills; card centered) |
| 640 | 480 @ x80 | 608px |
| 720 | 480 @ x120 | 688px |
| 768 | **480 @ x16 y346** | **grid 480px 420px** |
| 1024 | 480 @ x46 | grid 540px 420px |
| 1280 | 480 @ x174 | grid 572px 420px |

The clone (r27's `max-w-[357px] md:max-w-[480px]`) rendered the 357
card across the whole 480-767 band and collapsed at exactly 768: the
`1fr` track resolved to 284 (no min-content to hold it open), the text
section rewrapped (h 416 vs the live's 244), the grid grew (877 vs
705), and the card landed 142px low (y 488 vs 346) — the 768 capture
diffed **38.93%**, and 480/560/640/720 diffed 17.42/12.02/10.51/10.17%.

**r29-F1 (HIGH): the live's auth card is FIXED at 480px from viewport
480 up** — not an md-conditional max-width. The mechanism (traced
through the live's DOM): the inner Amplify grid declares a 480px track
at `min-width: 480px`, so the card's min-content is 480, which (a)
below md raises the layout grid's single implicit track to max(480,
column) — at exactly 480 the track overflows the 16px-padded column
(card x16, right edge x496) and the live CLIPS it, and (b) at md+ the
`1fr` track (minmax(auto, 1fr)) cannot shrink below the card section's
min-content — at 768 it resolves to 480px, which rewraps the text,
re-centers the grid, and lands the card at (16, 346).

**r29-F2 (MEDIUM): the live's document clips horizontal overflow.**
Its CSSOM carries `html, body, #root { overflow-x: hidden }` (found by
a rule-sweep on the live login). That is what keeps the exactly-480
track overflow off the scrollbar (scrollWidth stays at the viewport
width). The clone had `overflow-x: visible` on both.

## The fix (TDD)

1. RED: a new `viewport-fidelity.test.ts` (3 pins: the card's
   min-[480px] pair, the layout grid's template UNCHANGED — the
   min-content mechanism, not a template change — and the globals
   overflow-x rule) + the r27 pin in `login-fidelity.test.ts`
   re-measured (the `md:max-w-[480px]` handoff negative-pinned).
   Exactly the 3 intended pins failed on the first run.
2. GREEN: two source edits —
   `login-screen.tsx`: `md:max-w-[480px]` →
   `min-[480px]:min-w-[480px] min-[480px]:max-w-[480px]` (a fixed-480
   width at >=480 over w-full + mx-auto: the min-width supplies the
   min-content that holds the tracks open, the max-width caps the
   filled track, mx-auto centers when the track is wider; below 480
   the unconditional max-w-[357px] holds — 390/414/375 unchanged), and
   `globals.css`: the live's `html, body { overflow-x: hidden }` (the
   clone has no #root mount). No layout logic touched.

## Post-fix verification

- vitest 374/374 (371 + 3 new); lint ✓ typecheck ✓ build ✓;
  production CSS 151,432 bytes (r28's 151,282 + 150 — the
  min-[480px]:min-w/max-w pair's media rules and the overflow-x rule;
  0 forced-colors, 0 selection).
- E2E 28/28 and smoke 23/23 on a clean re-seeded database.
- Band re-verification, every metric byte-exact against the live:
  480 → card 480 @ x16, track 480px, scrollW 480; 560 → 480 @ x40,
  track 528; 640/720 → 480 @ x80/x120; 768 → grid cols 480px 420px,
  text w480 h244, grid y70 h705, card (16, 346), form y408.5; 1024/1280
  → 480 @ x46/x174 (regression-clean); 390/414 → 357 @ x16.5/x28.5
  (regression-clean).
- Paired captures post-fix: **login-480 0.003%, login-560/640/720
  0.002%, login-768 0.002%** (was 17.42/12.02/10.51/10.17/38.93%); the
  residuals are 2 sub-perceptual AA pixels (max channel delta 10) in
  the submit-button row — the accepted fractional-rasterization class.
- Steady-state regression battery (the canonical pairs): login desktop
  0.001% / mobile 0.012% (the r28 records hold); dashboard desktop
  0.307% / mobile 0.168% — the diff bands profiled to exactly the two
  documented data-only residuals (the header's account-email glyphs
  and the chat column's sixth live message); no regression from the
  global overflow-x rule (the live's own uncapped desktop shell
  scrolls the same clipped document — r21's wheel-verified geometry).
- All 9 reference screenshots re-shot on the remediated tree (each
  capture preceded by a state check: the drawer rects at 390, the
  login form's presence, scrollY for the scrolled shot).
- The live left pristine (0/0/15; sign-in only; no rows touched).

## Remediation summary

| ID | Finding | Resolution |
|---|---|---|
| F1 (HIGH) | The login card's 480 cap applied only at md (768)+ — the live's card is fixed-480 from viewport 480 (min-content 480 holds the layout grid's 1fr track open at 768: text rewrap + 142px card offset, 38.93% at 768; 10-17% across 480-720) | `min-[480px]:min-w-[480px] min-[480px]:max-w-[480px]`; pinned in viewport-fidelity.test.ts + the r27 pin re-measured |
| F2 (MEDIUM) | The live clips horizontal overflow (`html, body, #root { overflow-x: hidden }`); the clone was visible — post-F1, the exactly-480 viewport would gain a horizontal scrollbar | The live's rule in globals.css (html, body); pinned |
| — | Dev/prod render equivalence (session_49's probe) | VERIFIED CLEAN: 0.000% on all four probes — the r28 badge fix was the only dev/prod gap; no action |

## Verification

All claims executed and observed this session. The live account was
left pristine (the 0/0/15 contract holds).

## Suggested next steps

The pinned-viewport matrix now covers 375/390/414/480/560/640/720/768/
1024/1280 on the login — the band is closed. Future candidates: the
twin-copy state-instance split (still only reachable mid-session at a
viewport crossing), a horizontal-overflow audit of the studio views at
sub-390 viewports (320px reflow was verified in the README battery but
not against the live since r11), and the prod-mode battery as a
periodic spot-check whenever a dev-mode-only artifact is suspected.
