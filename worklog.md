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
