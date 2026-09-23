I'll start by reviewing the current workspace state and worklog, then proceed with the Session 34/35 task.
The workspace has been reset — the local repo is gone. I'll clone it fresh as instructed.
Repo cloned at `0ae4389`. Many sessions have progressed since Session 28. Let me survey the docs and root files.
Now let me read CLAUDE.md, README.md, and the session docs.
Session 34 (r20) is complete and pushed; session_35.md is its raw narration. This round is effectively **r21**. Let me read the Tailwind-V4 Validation Report next.
Now let me skim the README and PAD key sections.
I now have a full picture of the project state: **r20 complete, 328 tests, full parity** — this round is effectively **r21**. Let me set up the task plan and validate against the codebase.
Now let me validate the environment tooling and codebase structure.
Structure confirmed. Now installing dependencies and running baseline gates.
**Baseline gates all green: lint ✓ typecheck ✓ 328/328 vitest ✓** — the tree matches the r20 record. Now booting the DB and dev server.
The `/dashboard/` path returns 404 — let me check the live root and login behavior.
Live site is reachable (SPA shell at root). Let me check for prior probe tooling and the r19/r20 evidence patterns.
Click selector issue — same class of bug session 35 hit (off-screen drawer matched first). Let me probe the DOM structure precisely before retrying.
Sign-in didn't complete. Let me debug the login flow specifically.
Found it — on the live, the "Sign In" **tab** is also `type=submit` and sits first in DOM order, so my click hit the tab instead of the form submit. Fixing the sign-in selector to `form button[type=submit]`.
Confusing results — let me re-run the focused debug to see full after-submit state on both sides.
The sign-in flow is behaving inconsistently. Let me instrument it properly — poll for dashboard state transitions with logging.
Key discoveries: the live signs in fine (~4s round-trip); the clone fails because it needs the **demo account** (the live account doesn't exist in the local DB). Also need precise visible-element selectors for tiles/drawers. Let me probe the mobile drawer toggles.
Toggles weren't in the y<140 range. Let me widen the probe.
Toggles found on both sides at identical positions. Let me check the repo's own E2E helpers for the established view-switching selectors.
Now I have everything needed. Writing the corrected r21 battery script with per-side credentials, poll-based sign-in, visible-element selectors, and drawer geometry verification.
Let me clean up that script — the drawer section needs proper implementation.
The live's inspiration view has no matching h1. Let me probe what it actually renders.
Both sides render "Feed" as an h2 with no h1 — the state-check needs adjusting. Patching the battery.
Scrim click failed — let me check where we got to and use a coordinate-based click instead.
The toggle matched an off-screen element inside the closed drawer — the exact r20 lesson. Adding bounding-box filters to the toggle clicks.
All 8 pairs captured with verified drawer geometry. Now writing the pixel-diff comparator against baselines.
All surfaces elevated — systematic difference. Let me compare my capture dimensions against the canonical docs/screenshots.
The canonical desktop viewport is **1536×844**, not 1440×900. Re-capturing at the correct viewport.
Persistent elevation with a big hot band in the sidebar region. Let me visually inspect the pairs to understand what changed.
The VLM reveals the core issue: **my captures caught the live site mid-loading** ("Loading projects...", "Loading chat...", missing spotlight text). The r19/r20 discipline had a data-settled gate I need to replicate. Let me add it.
Progress (5.5%→0.72% on dashboard) but persistent bottom-right chat region differences. Let me crop and inspect those exact regions.
The clone's chat card renders taller than the live's. Critical check: does my clone capture match the r20 reference screenshot byte-identically?
My clone captures match the r20 references (0.003% — noise). So the **live site itself changed** since r20's measurements earlier today. Let me probe the live's chat card geometry precisely.
**Major finding**: the live's chat card is 878px tall (bottom=966 — the page itself scrolls at 1536×844), while the clone constrains it to 740px. The live's layout changed since r20. Let me probe the inner structure.
The structural difference is now clear. Let me visually confirm the bottom-right corner difference and check the live's 6th chat message.
Confirmed. Now the key question: is the live's 6th chat message new (which pushed its layout)? Let me extract the live's messages and check the docs for the "residue chat message" note.
The live's residue message is documented as accepted. But the aside-height difference needs code-level investigation. Let me examine the clone's layout container.
The clone's `<main>` carries the viewport-height cap token plus a clip utility — never page-scrolls. Let me probe the live's equivalent containers.
**Root cause found.** The live's `<main>` is `display:block, min-h-screen, no height cap` — its chat column (878px intrinsic) drives the grid row and **the page scrolls** at desktop. The clone's viewport-height cap plus flex sizing locks everything at 844. Let me decompose the remaining diff to see if this alone explains the elevation.
Let me check whether prior sessions left any probe scripts or evidence in the repo, and verify what the live's layout looked like during r20.
This is the central r21 finding. Let me get the live's full grid-children structure to design the fix precisely.
Now let me read the clone's layout code in full to compare against the live's structure.
Let me see the live's mobile structure and verify the page actually scrolls.
Let me verify the live's page actually scrolls (functional behavior test) before designing the fix.
Confirmed: **desktop-only divergence** — the live's desktop page scrolls (138px), the clone's is locked; mobile already matches (both docH=1563). Let me check when the clone's viewport-height cap was introduced.
The live's bundles are UNCHANGED since r14 — so the live always scrolled, and r20's baselines must have included it. My 0.72% vs r20's 0.38% needs explanation. Let me identify exactly what's at each hot region via element inspection.
The arithmetic doesn't close yet. Let me measure the exact contribution of each region by masking.
The numbers suggest the live's chat "Studio Memory" card may be state-dependent. Let me examine it on both sides.
The live's memory card shows "You were working on Watercolor Botanicals." Let me check what the clone's demo user has.
The live's memory text matches the seed — not the cause. The structural finding stands on its own: **the live's desktop page grows and scrolls; the clone's viewport-height cap (a scaffold-era invention, never live-measured) locks it**. Before designing the fix, let me decompose the mobile elevation too.
Mobile's extra diff is just the dev badge + email (both accepted). The desktop structural finding is solid. Let me check the inspiration view's extra elevation — possibly the quote carousel.
The inspiration mid-content diffs are pure antialiasing (sampled pixels identical). The audit is nearly complete. Let me quickly decompose the login elevation, then run the export envelope probe and smoke suite.
Login is at-baseline noise (identical sampled pixels — antialiasing class). Now the export envelope probe.
Export envelope byte-identical ✓. Now the 23-check smoke suite.
**Audit complete: 23/23 smoke, export byte-identical.** One real finding (r21-F1). Now let me validate the remediation plan against the codebase — checking for pin conflicts and other `h-screen` references.
The clone's own mobile behavior (auto-height main growing to 1563 through the same `min-h-0 flex-1` container) empirically proves the fix will propagate. Let me review the established test pattern before writing the red pins.
The plan is validated. Let me check the E2E specs for any scroll/geometry dependencies, and the chat-fidelity pins for overlap.
No conflicts. Presenting the remediation plan, then executing the TDD cycle.

## r21 Remediation Plan (validated against the codebase)

| ID | Finding | Fix |
|---|---|---|
| **r21-F1** (HIGH) | **Desktop app-shell height contract diverges.** Live: `main` is uncapped (`min-h-screen`, block) — the grid row sizes to the chat column's intrinsic content (sticky header 240 + scroll container max-h 588 + padding = **878px**), the page grows to **982** at 1536×844 and the **window scrolls** (wheel-verified 0→138). Clone: the scaffold-era viewport-height cap (initial commit `f871e90`, never live-measured) locks the page at 844 — the chat card clips at 740 with its bottom border visible where the live's continues past the fold, and the wheel scroll is dead. ~0.43% hot strips on every desktop surface. Mobile unaffected (both docH 1563 ✓). | Remove the viewport-height cap token from `main` in `studio-app.tsx:282`. The flex-col + min-h-screen shell then grows with content (empirically proven by the clone's own mobile path). Pin with new `layout-fidelity.test.ts`. |

**Confirmed at parity**: export envelope (byte-identical), smoke 23/23, drawer geometry (312×844, x=0/x=78), login (at-baseline noise), mobile surfaces (email+dev-badge only).

Now the TDD cycle — **RED first**:
**RED verified** — exactly the 2 pre-fix failures. Now applying the fix.
My own comment contains the literal token — the exact TW4-scans-everything lesson. Fixing the comment.
**GREEN: 332/332 (328 + 4 new pins).** Now the browser verification — restarting the dev server cleanly and probing the geometry against the live's measured numbers.
**Exact match with the live's measured numbers** — docH 982, grid row 878px, chat aside 878/966, wheel scroll 0→138. Re-running the full battery.
**Desktop surfaces: all 4 at PARITY** (0.333/0.305/0.305/0.466% — the remaining regions are the accepted email divergence). Mobile unchanged (as designed). Now the E2E suite.
All gates green. Now verifying on the production server (the r15 precedent).
Production verified: identical geometry + scroll. Let me verify the compiled CSS stayed clean (no dead utilities from the test file).
The production CSS gained dead rules from my test file's string fragments! Let me examine exactly what leaked.
All four dead rules leaked from my new test file. Let me locate every offending token in the sources.
String literals in code are scanned; comments aren't. But the transparent-outline utility isn't in any source — let me check whether it was already in the r20 CSS by rebuilding the pre-change tree.
The stash left my untracked test file in place — invalid test. Let me redo it properly.
The counts were line-based on minified CSS — meaningless. Let me count actual occurrences in the true r20 build.
A pre-existing leak in the committed tree. Let me find which committed file carries the tokens.
The rg display is mangling highlighted matches, but the substance is clear: **the session docs themselves carry the literal tokens**. Let me verify byte-exactly.
**r21-F2 confirmed**: the r19/r20 remediation records themselves re-introduced the stripped tokens — the transparent-outline utility ×7 (session_35, AGENTS.md) and the selection-variant background/foreground pair ×6 (session_32, README, PAD, css-hygiene.test.ts) — and TW4 scans every committed file, so the dead rules recompiled. The "verified clean" CSS was measured **before** the docs were written. Let me view each occurrence to reword them.
Now applying the rewords — first the docs, then the test comments, then my own test file.
The existing pin scans `src/` only — docs were the blind spot. Now applying all rewords.
Now fixing my own layout-fidelity test file's leaks (title string, docblock, array fragment).
Now extending css-hygiene.test.ts with the r21-F2 docs pin.
Pin green. Now moving the evidence directory out of the repo (TW4 scans untracked files too) and rebuilding to verify the CSS is actually clean.
**r21-F2 fixed**: CSS now 152,062 bytes — 0 forced-colors, 0 selection rules, cleaner than even the r20 record. Restarting the dev server and running the full gate suite on the final tree.
Dev CSS is stale (Turbopack's persistent cache — the r19 lesson). Clearing and restarting.
Dev CSS clean too (188,277 — below the r20 record). Full gates now.
**All gates green: 333/333 vitest, 25/25 E2E, 23/23 smoke.** Now the final battery + screenshot re-shoot.
Final parity confirmed — all desktop surfaces below baseline; the trailing error was just the moved evidence path. Now updating the screenshots.
Mobile captures changed too — unexpected. Let me quantify the delta against the committed references.
The VLM sees no difference — let me pinpoint the exact hot pixels.
Text content identical — pure sub-pixel rasterization noise. Let me verify it's nondeterministic across capture passes.
Same-launch passes are deterministic. Let me test across browser launches.
Deterministic in my environment. Decisive test: capture from the stashed r20 tree and compare against the committed reference.
**Decisive**: the r20-tree capture in my environment is byte-identical to my fixed-tree capture — the committed references simply aren't reproducible in this environment (sub-pixel rasterization). My captures are internally deterministic. Copying the new references and restarting the dev server on the fixed tree.
**Final parity confirmed** — only the accepted email + dev-badge divergences remain. Now the documentation updates. Let me find the count references.
Updating AGENTS.md — the test inventory and new framework quirks.
Now CLAUDE.md and README.md updates.
Now the PAD updates. Let me check its revision-block and §7.1 structure.
Now writing the session record — docs/session_36.md.
Wait — my own session_36.md may contain the literal cap token. Checking all new docs for token leaks.
My own session record has the leak — fixing it and hardening the pin to cover the cap token family too.
The pin caught a real offender — the repo-root SKILL file. Let me check it.
The SKILL file documents the old capped behavior — now stale after the fix anyway. Updating it.
All expected changes present. Final verification pass — full gates + rebuild + CSS check.
All gates green. Final `.env.example` verification against the codebase.
A real gap: `db-path.ts` claims `AST_PRISMA_DIR` is "documented in .env.example" — but it isn't. Adding it.
Now updating the worklog, then committing. Let me check the r20 commit split precedent first.
The split is clear. Writing the worklog first, then the two commits.
Both commits on main, tree clean. Now the SSH wrapper push — staging the key and checking the wrapper usage.
The SSH shim was lost in the reset. Let me check the wrapper's ssh invocation and recreate it.
Paramiko installed. Now deploying the shim from Appendix A.
Shim deployed. Dry-run preflight with the explicit art-supply-tracker remote (the known default-remote trap).
Dry-run clean — auth OK, fast-forward confirmed. Real push now.
Push verified: remote main = `f49975e` = local HEAD. Shredding my staged key copy (the wrapper only shreds its own temp material).
✅ **Session 36 (r21) complete — pushed and verified** (`0ae4389..f49975e` on main, confirmed via HTTPS, key shredded, no new branches).

**The round in brief:**
- **r21-F1 (HIGH, fixed)**: the live's desktop app shell is *uncapped* — its grid row sizes to the chat column's intrinsic content, the page grows past the fold, and the window scrolls (wheel-verified). The clone's scaffold-era viewport-height cap locked the page, clipped the chat card, and killed the scroll. Removed — geometry now matches the live byte-for-byte on dev **and** production servers; desktop captures dropped below every baseline.
- **r21-F2 (MEDIUM, fixed)**: the r19/r20 CSS remediations had been regressed by their *own documentation* — TW4 scans markdown, and the quoted tokens recompiled as dead rules. All 13 occurrences reworded + pinned; production CSS is now cleaner than the r20 record.
- **Gates**: 333/333 vitest (5 new pins), 25/25 E2E, 23/23 smoke, lint, typecheck, production build + CSS verified; export envelope byte-identical; 8 screenshots re-shot.

**Suggested next steps**: watch the CI verify-gate on `f49975e`; for a future round, the queued probe dimensions are scrolled-state captures, a short-viewport matrix (the uncapped shell's 982px breakpoint), and the WebKit engine matrix (needs GTK libraries).
