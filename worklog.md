# Worklog — art-supply-tracker r28 session

---
Task ID: 1
Agent: main (Super Z)
Task: Clone repo, review docs, validate codebase, run baseline gates

Work Log:
- Cloned https://github.com/nordeim/art-supply-tracker.git @ aeca092 (main, clean)
- Cloned https://github.com/nordeim/scandihaven.git for tech-stack pattern reference
- Reviewed AGENTS.md (full), CLAUDE.md, README.md, PAD (ADRs §1.3), art-supply-tracker_SKILL.md structure, session_47.md (r27 record), session_48.md (r27 raw narration)
- Reviewed docs/how-to-git-push-using-ssh-wrapper_SKILL.md + confirmed docs/ssh_git_wrapper_v3.py exists
- Skills considered: skills/clone-app-pat-pro, skills/agent-browser (v0.38.1 installed), skills/tdd
- Setup: bun install (862 pkgs), .env from .env.example, db:push + db:seed (1 user, 5 chat, 15 inspo)
- Baseline gates: lint ✓, typecheck ✓, vitest 362/362 ✓, build ✓

Stage Summary:
- Repo is at r27-complete state (login chrome round done @ caf5222 + session-log commit aeca092)
- All gates green on the pulled tree; codebase structure matches documented architecture (single route, 15 studio components, 2 action files, 24 lib fidelity/domain files)
- Next: live-site survey for r28 candidates (session_47 next-steps: 480-768 viewport band, eye-toggle icon paths, tab-strip type=submit quirk)

---
Task ID: 2
Agent: main (Super Z)
Task: Live-vs-clone r28 survey (paired captures + DOM probes)

Work Log:
- Captured 12 paired view sets (desktop 1280x800 + mobile 390x844): dashboard/projects/supplies/inspiration/login + sidebar/chat drawers
- Pixel diffs: desktop 0.14-0.55%, mobile 0.27-0.94%, chat-drawer 5.09% (data-only: live's 6th chat message from sepnetflix2023 "Hello from clone test" Sep 16, 78px taller content)
- Login-mobile 0.61% (r27 record 0.14%) — investigated with band analysis + DOM probes:
  - Band y405-486 (logo): clone serves ADC2 logo via /_next/image?w=640&q=75 (re-encoded); live serves original bytes; files byte-identical (md5 1173c2df)
  - Band y787-861: Next.js dev-tools badge 36x36 @ x20,y788 (NEXTJS-PORTAL shadow DOM, dev-mode only)
- All desktop views show y0-79 band (2.4%): header AST logo renders via /_next/image?w=3840&q=75
- Dashboard y722-802 (2.5%): Kevin Lewis portrait via /_next/image?w=128&q=75
- Inspiration-mobile y560-660 x216-327: Partners card body P — live text-[11px] (lh 15.125) vs clone text-[10px] (lh 13.75); content centers 1.375px lower in clone (verified: gap live 24.4375 = clone 25.8125 - 1.375)
- Sidebar-drawer y700-780: Partners card title P — clone carries leading-snug (lh 16.5px) vs live NO leading class (lh 16px from text-xs)
- Verified sidebar drawer rail cards (Spotlight/Quote/ArtHistory) match live exactly; inspiration-view Art History card matches (11px P3 both sides)
- Confirmed dev badge is ONLY diff at inspiration y773-844 (0 non-badge pixels)

Stage Summary:
- 4 real defects found (r28-F1..F3 + methodology F4):
  F1 (HIGH): 3 next/image usages missing unoptimized (login-screen.tsx:315, dashboard-view.tsx:140, studio-app.tsx:425)
  F2 (MEDIUM): inspiration-view.tsx:234 Partners body P text-[10px] -> should be text-[11px]
  F3 (MEDIUM): studio-sidebar.tsx:271 Partners title P has extra leading-snug (lh 16.5 vs live 16)
  F4 (LOW methodology): Next dev-tools badge pollutes dev-mode captures -> devIndicators: false
- Data-only (no action): live's 6th chat message (r27 precedent, seed pins 5)

---
Task ID: 3
Agent: main (Super Z)
Task: r28 TDD remediation (F1-F5) + full verification battery

Work Log:
- RED: 3 new test files — image-fidelity.test.ts (3 pins: unoptimized contract), rail-card-fidelity.test.ts (4 pins: both rail copies' Partners cards), dev-chrome-fidelity.test.ts (1 pin: devIndicators: false) + login-fidelity/login-motion-fidelity link-button pins re-measured
- GREEN: 6 source edits — unoptimized on login-screen.tsx:315 / dashboard-view.tsx:140 / studio-app.tsx:425; text-[11px] on inspiration-view.tsx Partners body; leading-snug dropped from studio-sidebar.tsx Partners title; link buttons flex h-[35px] -> inline-flex px-3 py-1.5 leading-normal; devIndicators: false in next.config.ts
- F5 discovered during F4 verification: link labels rasterized 1px low (20px line at half-pixel offset vs live's emergent lh 21px)
- Gates: vitest 371/371, lint/typecheck/build clean; E2E 28/28; smoke 23/23
- Browser verification byte-exact: images serve original bytes, Partners P1 y556.4375 both sides, sidebar lh 16px, link lh 21px pad 6/12 box 182.34x35, badge absent
- Paired captures post-fix: login-desktop 0.00% / login-mobile 0.01%; steady-state 0.09-0.20%; chat-drawer 2.27% (data-only 6th live message)
- All 9 reference screenshots re-shot in docs/screenshots/

Stage Summary:
- r28 complete in code: 5 findings fixed TDD-first, 9 net-new pins, all gates green, live left pristine (0/0/15)

---
Task ID: 4
Agent: main (Super Z, continuation session)
Task: Complete r28 documentation alignment + final gates + CSS record correction

Work Log:
- Verified prior session state via git status (18 modified + 4 untracked files, all r28 work intact)
- Wrote session_49.md r28 round record (complete), confirmed AGENTS.md/CLAUDE.md/README.md updates from prior session
- PAD: added [R28] revision entry, unit count 334->343, appended image-fidelity/rail-card-fidelity/dev-chrome-fidelity to the test ledger, updated the dev-mode-artifacts known-issues row (badge now off)
- SKILL.md: description 371 vitest / 28 rounds, last_updated 2026-09-27, project_state r28, Appendix A r28 ledger entry + current-baselines line
- CORRECTED the CSS byte record: measured 151,282 on the final tree (not 151,176 "unchanged" — the mid-round figure was pre-F5; delta +106 = leading-normal rule + --leading-normal var emission new, h-[35px] rule dropped; verified r27 tree used leading-normal nowhere via git grep). Fixed in session_49.md + README r28 row (r23 overclaim-correction precedent)
- Re-ran full gates after doc edits: lint clean, typecheck clean, vitest 371/371, build EXIT=0, production CSS 151,282 bytes with 0 forced-colors / 0 ::selection

Stage Summary:
- All six documents aligned to the remediated codebase; .env.example verified present and matching db-path.ts contract (1352 bytes, DATABASE_URL file:../db/custom.db + AST_PRISMA_DIR comment)
- Ready for commit + push

---
Task ID: 5
Agent: main (Super Z, continuation session)
Task: Commit r28 to main and push via SSH wrapper

Work Log:
- Committed in the repo's two-commit convention: 4af3b56 "fix(parity): r28 — asset bytes, rail type scale, dev badge, link-button chrome" (11 files: next.config.ts, 5 studio components, 2 re-measured test files, 3 new test files) + 2fe1c2a "docs: r28 alignment — asset-fidelity records, SKILL refresh, session log" (15 files: session_49.md, 9 screenshots, 5 core docs)
- Installed paramiko 5.0.0 (no OpenSSH binary in sandbox); deployed the Appendix A paramiko ssh shim to /home/z/my-project/scripts/bin/ssh (outside the repo per the runbook's rule 5)
- Materialized the operator key to /tmp/ast-deploy.key (0600, outside repo), verified it parses (ed25519, SHA256:4rAzu5gC41giPSWmIojTc1isH0FGoGiSgYJkDcMp54g)
- Dry-run: auth OK, remote main @ aeca092 (local base), fast-forward confirmed
- Real push via docs/ssh_git_wrapper_v3.py --remote git@github.com:nordeim/art-supply-tracker.git: aeca092..2fe1c2a HEAD -> main; wrapper verified remote ref == local HEAD; synced origin/main tracking ref
- Shredded the operator key (wrapper had already shredded its own temp copy + sidecar)

Stage Summary:
- r28 fully delivered: remote main @ 2fe1c2a, working tree clean, no new branches (main only), live site left pristine (0/0/15)
- All gates green at push time: lint, typecheck, vitest 371/371, build, E2E 28/28, smoke 23/23, production CSS 151,282 bytes / 0 forced-colors / 0 selection

---
Task ID: 6
Agent: main (Super Z, r29 session)
Task: git pull refresh + docs review + baseline gates

Work Log:
- git pull: 2fe1c2a..91e1bb8 (the user committed session_50.md — the raw r28 narration — and this worklog.md as repo files)
- Read session_50.md (the r28 continuation narration) + the repo worklog; core docs verified current at r28-complete
- Baseline gates on the pulled tree: lint, typecheck, vitest 371/371 (deps + db intact; no build needed — pull brought only .md files)
- Dev server (the r28 double-fork daemon) still running and serving

Stage Summary:
- Project at r28-complete; ready for the r29 survey targeting session_49's queued probes: the 480-768 viewport band and the prod-mode capture battery

---
Task ID: 7
Agent: main (Super Z, r29 session)
Task: r29 survey (480-768 band + prod-mode battery)

Work Log:
- Built the standalone prod server (port 3001; single-invocation runs — the sandbox reaper kills it between invocations, so each battery ran server+captures in one Bash call)
- PROD-MODE BATTERY: login 1280/390 and dashboard 1280/390, dev vs prod: 0.000% on all four probes (a first-pass 2.88%/4.27% was a first-load transient; clean re-captures byte-identical, stable) — dev/prod render equivalence CONFIRMED, the r28 badge fix was the only gap
- BAND SWEEP on the live login (480/560/640/720/768 + regression checks 390/414/1024/1280): the live's auth card is FIXED 480 from viewport 480 up; the clone's r27 md:max-w-[480px] rendered 357 across 480-767 (10.17-17.42% diffs) and collapsed the 1fr track to 284 at 768 (text rewrap h416 vs 244, grid 877 vs 705, card 142px low — 38.93%)
- Traced the live's mechanism: the inner Amplify grid's 480px track at min-width:480 supplies the card's min-content — below md it raises the implicit track to max(480, column) (overflowing at exactly 480, card right edge x496), at md+ it holds the 1fr track at 480
- Found the live's overflow clip by CSSOM rule-sweep: `html, body, #root { overflow-x: hidden }` — scrollWidth stays at the viewport width; the clone had overflow-x: visible

Stage Summary:
- TWO findings: r29-F1 (HIGH) the card's fixed-480-from-480 handoff; r29-F2 (MEDIUM) the html/body overflow-x clip
- The prod-mode probe answered CLEAN (no action)

---
Task ID: 8
Agent: main (Super Z, r29 session)
Task: r29 TDD remediation + verification + screenshots + docs

Work Log:
- RED: new src/lib/viewport-fidelity.test.ts (3 pins: the card pair, the layout-grid template UNCHANGED, the globals overflow-x rule) + the r27 card-cap pin in login-fidelity.test.ts re-measured — exactly 3 intended failures
- GREEN: login-screen.tsx md:max-w-[480px] -> min-[480px]:min-w-[480px] min-[480px]:max-w-[480px]; globals.css the live's `html, body { overflow-x: hidden }`
- Gates: vitest 374/374, lint/typecheck/build clean; production CSS 151,432 bytes (r28's 151,282 + 150), 0 forced-colors / 0 selection
- Browser verification: every band metric byte-exact vs the live (480: 480@x16 track 480px scrollW 480; 560: 480@x40 track 528; 768: grid 480px 420px, text h244, grid y70 h705, card (16,346); 1024/1280 at x46/x174; 390/414 at 357@x16.5/x28.5)
- Paired band captures: 0.002-0.003% at every viewport (was 10.17-38.93%); residuals = 2 sub-perceptual AA pixels (max delta 10)
- Steady-state regression: login 0.001%/0.012% (r28 records hold), dashboard 0.307%/0.168% (profiled to the two documented data-only bands); a mixed-state capture false-alarm (7.9%) was traced to an auth-error alert state and re-captured clean
- E2E 28/28 + smoke 23/23 on a clean re-seeded db
- All 9 reference screenshots re-shot with pre-capture state checks (caught and fixed two drawer-state mistakes mid-shoot)
- Docs: session_51.md (new), AGENTS.md (374 + r29 quirks + card-cap re-measure), CLAUDE.md/README.md (374 + r29 row), PAD (R29 entry + 346 unit + ledger), SKILL.md (description/project_state/Appendix A/baselines); .env.example verified

Stage Summary:
- r29 complete in code and docs; 374 tests, all gates green; the live left pristine (0/0/15)

---
Task ID: 9
Agent: main (Super Z, r30 session)
Task: git clone refresh + docs review + baseline gates

Work Log:
- Cloned https://github.com/nordeim/art-supply-tracker.git @ 9c85541 (main, clean; r29-complete + session log)
- Cloned https://github.com/nordeim/scandihaven.git (shallow) for tech-stack pattern reference
- Reviewed AGENTS.md (full 590 lines), CLAUDE.md (full), README.md, PAD §1/§10/revisions R28-R29, SKILL.md metadata + Appendix A baselines, session_51.md (r29 record), session_52.md (r29 narration), repo worklog.md (tasks 1-8)
- Codebase validation: single route + 15 studio components + 2 action files + 24 lib domain files + 26 test files — matches documented architecture exactly
- Setup: bun install (862 pkgs), .env from .env.example, db:push + db:seed (1 user, 5 chat, 15 inspo)
- Baseline gates: lint ✓, typecheck ✓, vitest 374/374 ✓, build ✓
- Dev server started (setsid daemon, :3000, serving); agent-browser 0.38.1 on PATH

Stage Summary:
- Project at r29-complete; all gates green on the pulled tree
- r30 candidates from session_51: sub-390 viewport audit of the studio views (not measured vs live since r11), the twin-copy state split (accepted divergence, out of scope), prod-mode spot-check
- Next: live-site survey (login + paired sub-390 captures + canonical regression checks)

---
Task ID: 10
Agent: main (Super Z, r30 session)
Task: r30 survey — sub-320px viewport audit + photo-surface probing (live left pristine)

Work Log:
- Built the paired-capture battery (scripts outside the repo: r30-capture-battery.sh + r30-pdiff.py) with the r27 pointer-parking rule — first-pass captures caught a hover artifact on the ☰ toggle (methodology re-learned: pointer MUST be parked; the toggle is byte-identical in isolation)
- 320x844 paired captures (login/dash/projects/supplies/inspiration + both drawers): projects 0.016% / supplies 0.016% / inspiration 0.017% (the header email-glyph data-only residual only); sidebar-drawer 0.014%; chat-drawer 0.000% byte-identical
- Both drawers are 256px at 320 (80vw — matches the clone; no finding)
- F1 FOUND (HIGH): the live's login tab strip WRAPS at <=330px — Amplify tabs are display:block, text-align:center, padding 12px 16px with EMERGENT height (74px two-line at 320-330, 50px single-line at >=335, threshold measured); the clone's flex h-[50px] never wraps -> 24px page-height divergence at 320 (live 1069 vs clone 1045)
- F2 FOUND (HIGH): the dashboard Studio Spotlight portrait lacks shrink-0 — the flex row squeezes it 56 -> 49.59px at 320 (55 at 340, restored 56 at 360+); the live's carries shrink-0 and stays 56 always (~3700 hot px on the dash-320 pair)
- Probed the photo surfaces (modal uploads; live rows created+deleted through the UI, returned to 0/0/15 verified):
  - F3 (MEDIUM): supply modal photo preview — the live REPLACES the add-photo tile with a w-16 h-16 (64px) preview + x button (absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs, glyph x); the clone keeps the tile and appends a 56px preview below with a coral x
  - F4 (HIGH): project modal + edit panel photo area — the live renders a "Photos (N/30)" counter LABEL, relabels the tile "Add more", hides it at 30/30, renders thumbs as div.grid.grid-cols-5.gap-2.mb-3 with div.relative.group wrappers, img w-full aspect-square rounded-lg border-ast_turquoise/20, x INSIDE (top-0.5 right-0.5 bg-black/60), a "cover" badge on the first thumb, and silently drops overflow; the clone renders a static "Photos" span, keeps "Add photos", a flex-wrap ul with fixed 64px /30 thumbs, coral outside-x, no cover badge
  - F5 (MEDIUM): photo cap — the live displays (N/30); the clone caps at 10 (validation.ts 2 schemas + slice(0,10-...) in both panels)
  - F6 (MEDIUM): project chip photo — the live renders img h-10 w-10 shrink-0 rounded-lg object-cover opacity-85 in the chip's flex min-w-0 items-start gap-2 mb-2 header; the clone renders none
- Verified MATCHING (no action): the detail panels (project w-24 h-24 well + grid-cols-5 /20 purple thumbs + Images(N) only when >1; supply w-32 h-32 + "Photo" label), the supply chip's w-full h-16 rounded-xl mb-2 banner, the fresh modals' geometry (byte-equal at 320), the "Add photos"/tile classes fresh (cursor-pointer inline-flex ... px-3 py-2 text-sm), the file inputs (multiple, accept image/*), the post-create navigation (stays on current view both sides)
- Live left pristine: temp project (2 photos -> 1 via edit) + temp supply deleted through the UI with confirm override; tiles verified Projects 0 / Supplies 0 / Inspo 15, no ZZR30 rows

Stage Summary:
- SIX findings (F1-F6); F1/F2 sub-390px render divergences, F3-F6 the never-measured photo-surface family
- Remediation plan: TDD-first fixes in login-screen.tsx (F1 block tabs), dashboard-view.tsx (F2 shrink-0), supply-modal.tsx (F3 tile-swap), project-modal.tsx + project-edit-panel.tsx (F4 live thumb contract), studio-domain.ts + validation.ts (F5 cap 30), projects-view.tsx (F6 chip thumb) + the login-fidelity tab pin re-measured + new photo-surface-fidelity.test.ts

---
Task ID: 11
Agent: main (Super Z, r30 session)
Task: r30 TDD remediation (F1-F6) + full verification battery

Work Log:
- RED: 10 pins across 4 files — new photo-surface-fidelity.test.ts (6 pins), viewport-fidelity.test.ts (+2: the tab chrome + the runtime-constructed fixed-height negative), login-fidelity.test.ts (the tab pin re-measured), validation.test.ts (the two 10-photo caps re-measured to 30 with an exact-30 acceptance) — exactly the 10 intended failures on the first run
- GREEN: 8 source edits — login-screen.tsx both tabs flex h-[50px] items-center justify-center -> block flex-1 px-4 py-3 text-center; dashboard-view.tsx portrait + shrink-0; supply-modal.tsx the tile-swap preview (w-16 h-16, x at -top-1 -right-1 bg-black/60); project-modal.tsx + project-edit-panel.tsx the live's photo area (counter label, 5-col grid, aspect-square /20 thumbs, inside-x, cover badge, Add-more relabel, tile gone at cap); studio-domain.ts MAX_PROJECT_PHOTOS = 30 + validation.ts 3 schemas + both panels' slices; projects-view.tsx the chip thumb AFTER the name (the live's [name, img] order, re-measured mid-round)
- F6 order correction: the first fix placed the img FIRST — a re-measure on the live (temp project created + deleted, pristine restored) showed the live's row is [name P x58, img x106]; swapped and verified byte-exact (name x58 w40 h19, img x106 w37 h40 both sides)
- F5 transport bug found through the real UI: the 30-photo submit answered "Body exceeded 1 MB limit" (Next's default Server Action cap) — a latent bug (10 large photos could hit it too); fixed with experimental.serverActions.bodySizeLimit "12mb" in next.config.ts (30 x 400k chars + JSON slack) + pinned; the 30-photo submit then succeeded end-to-end
- Runtime-constructed negative pins for the dead tokens (the coral bg, the fixed tab height) per the r20 css-hygiene lesson
- Gates: vitest 383/383 (374 + 9 net-new), lint/typecheck/build clean; production CSS 151,532 bytes (r29's 151,432 + 100), 0 forced-colors / 0 selection
- E2E 28/28 + smoke 23/23 on a clean re-seeded db
- Browser verification: login-320 tab strip 74px + docH 1069 (byte-equal the live; was 50/1045); the band 320/330=74, 335+=50 matches the live's measured threshold; login-320 capture 0.001% (was SIZE MISMATCH); dash-320 0.008% (was 0.643% — only the header email band); the portrait 56px constant; the supply preview at the live's exact slot (x215 y117 64px, tile gone); the project thumbs byte-exact (grid mb-3 grid-cols-5 gap-2, thumb x41 y566.89 41.19px, inside-x, cover badge, Add more); the cap behavior 30/30 tile-gone overflow-dropped; the chip thumb [name, img] byte-exact
- Canonical regression: login-390 0.001% / login-1280 0.000% / dash-390 0.089% / dash-1280 0.195% (all residuals = the documented data-only header band: the email glyphs + the memory button's 2px email-width cascade)
- All 9 reference screenshots re-shot with state checks (the two drawer shots re-shot after the first pass captured a stuck-open sidebar drawer — closed via the in-drawer Close button, not the covered page toggle)

Stage Summary:
- r30 complete in code: 6 findings fixed TDD-first, 9 net-new pins, 2 re-measures, 1 latent transport bug fixed, all gates green, live left pristine (0/0/15)
