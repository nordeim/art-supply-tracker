I'll start by reading the uploaded prompt file and refreshing the workspace with `git pull`.
Workspace is at my r28 push (`2fe1c2a`). The user mentions `docs/session_50.md` — let me pull to fetch the new commits:
The pull brought two new commits — `docs/session_50.md` and a repo-root `worklog.md`. Let me read the new session doc:
session_50.md is the raw narration of my r28 continuation session (committed by the user, following the session_48 precedent). Let me check the repo's new `worklog.md` and verify baseline state:
The repo worklog is my committed agent log — r28 is fully landed. Now starting the **r29 round**. Let me set up the environment and run baseline gates on the pulled tree:
Baseline gates green (371/371). Now let me set up the browser tooling and start the servers for the r29 survey. First, checking the agent-browser skill setup:
agent-browser CLI is on PATH. Let me refresh the command syntax from the skill:
Now starting the dev server with the persistent double-fork approach (the sandbox kills background processes between invocations):
A server is already running on port 3000. Let me verify what mode it's in and check the r28 survey scripts for reuse:
The dev server from r28 survived and serves the current tree. Now let me start the **production server** on port 3001 for the prod-mode battery, and check the package scripts:
Build artifacts are current. Let me write a persistent launcher for the prod server on port 3001:
The launcher's child failed silently. Let me use a simpler direct approach:
Prod server is live on 3001. Now let me open the live site and log in for the r29 survey:
Let me check the actual login form structure:
Logged in. Now **Focus A: the 480-768px viewport band** (the unmeasured login max-w handoff). Let me sign out and measure the live login card across the band:
Now measuring the live login card geometry at 480px:
Interesting — at 480px the live card measures 478px wide (NOT the 357px cap). Let me probe the container structure more precisely:
**Key discovery forming**: the live card at 480px is 480px wide at x=16 (overflowing!), NOT 357px — the live's max-w handoff differs from the clone's `md:` (768px) breakpoint. Let me sweep the whole band:
**Major finding**: the live's card is 480px wide starting at exactly 480px viewport (x=16, filling + overflowing the content column), while the clone's cap switches at `md:` (768px). And at 768 the live card sits at x=16 (layout change). Let me capture the live across the band:
Now measuring the clone at the same band:
**Two divergences confirmed:**
- **480-720px**: live renders the 480px card (centered), clone stays at 357px
- **768px**: live card is 480px @ x=16, but the clone collapses to **284px** @ x=16 — something breaks in the clone's md layout

Let me inspect the clone's login DOM at 768 to find where 284 comes from:
The clone's md grid is `[1fr_420px]` with the card in the left column. Let me trace how the layout behaves at larger viewports and compare with the live:
Now the live at the same large viewports for comparison:
At ≥1024 both match exactly. The divergences are at 768 (clone card 284 vs live 480, y 488 vs 346) and the 480-720 band. Let me probe the live's layout containers at 768 to understand its breakpoint structure:
The live at 768 uses a single-column grid `480px`. Let me see the full container chain and compare with 1024:
**Root cause emerging**: the live's card is a **fixed 480px wide from viewport 480 up** (forcing the `1fr` grid track to expand via min-content at 768), while the clone caps at 357 until `md:`. Let me verify the vertical geometry and second-column content at 768 on both sides:
Both sides share the 3-child grid (text | logo | card). The clone's narrow 284 track rewraps the text (h=416 vs 244) and cascades the y-offset. Let me capture the clone pre-fix for the diff record:
Let me run the pixel diffs on the band captures to quantify the pre-fix divergence:
Massive divergences confirmed (10-39% in the band). Let me do a comprehensive DOM metric comparison to catch everything — not just the card:
I made a labeling error — that probe ran on the clone (browser was still on localhost). The live's key data is from the earlier sweeps. Let me re-run the probe properly on the live:
Now I have the live's true spec: the grid track is **`minmax(480px,1fr)`** from 480 up (below-md too), with the card capped at 480. Let me check the live's overflow handling at exactly 480 and get the clone's full class strings:
The live clips the 480-track overflow with `overflow-x: hidden` on body+html. Let me check the clone's current overflow and the live's exact card/main padding details:
Both mains match (pad 40/16). The clone lacks the live's `overflow-x: hidden`. Let me check how the live implements it (body class vs CSS rule):
Brace-count bug in my eval. Let me rewrite it carefully:
**Fix spec complete**: the live has a single `html, body, #root { overflow-x: hidden }` rule. Before implementing, let me complete the survey with **Focus B: the prod-mode battery** (dev 3000 vs prod 3001):
99%+ diff — that's a page-state mismatch, not rendering drift. Let me check what the prod server actually renders:
The prod server died between invocations (the sandbox process killer). Let me check and restart it robustly:
Prod server restarted with setsid. Let me quickly capture and diff before anything dies:
Still 99% — the pages must be in different states. Let me inspect both captures directly:
The prod server keeps dying between invocations — only the old double-forked dev server survives. Solution: run the entire prod battery within a **single Bash invocation**:
The login didn't take — let me check the seeded demo credentials:
Password is `StudioDemo2026!`. Redoing the prod login + dashboard capture in one invocation:
Prod captures look right now (dark app palette). Now the dev dashboard equivalents:
The dev origin already has a live session ("APP"). Just capture directly:
Login dev/prod is **byte-identical (0.000%)** — the r28 badge fix enabled true equivalence. The dashboard shows 2.9-4.3% in specific regions. Let me check if it's stable or a timing fluke:
The re-capture is **byte-identical (0.000%)** — the earlier diff was a first-load transient. Let me confirm the mobile pair too:
**Prod-mode battery: CLEAN — 0.000% on all four probes.** The survey is complete. Now let me review the existing test pins before writing the TDD plan:
The survey is complete and the fix spec is validated. Let me look at the test conventions before writing the RED pins:
Conventions clear. **TDD RED phase** — writing the failing pins for r29:
Now updating the r27 pin in login-fidelity.test.ts (the re-measure):
Now confirming the RED phase — exactly the intended pins should fail:
**RED confirmed** — exactly the 3 intended pins fail. Now the **GREEN phase** — applying the fixes:
Now the globals.css overflow rule:
**GREEN confirmed** (63/63). Now the full gate suite:
All gates green — **374/374 tests**, build clean, CSS 151,432 (+150 for the new utilities/rule). Let me verify hygiene and that the running dev server picked up the changes:
Dev server hot-reloaded with the fix. Now the full band verification against the live's numbers:
**All nine viewports match the live** — including the 768 cascade (grid y=70 h=705) and the exactly-480 clip. Now the paired pixel-diff battery across the band:
**The band collapsed from 10-39% to 0.002-0.003%** — essentially byte-exact. Let me characterize the residual pixels, then run the steady-state regression battery:
Residuals are sub-perceptual AA noise (max delta 10, 2 pixels) — the band is at parity. Now the **steady-state regression battery** at the canonical viewports (the overflow rule is global — the dashboard needs re-verification):
Mixed capture states — the login/dashboard sequencing broke (the eval chain raced the session state). Let me redo the clone captures with explicit state verification per the r27 rule:
Inconsistent DOM state — let me inspect what's actually on the page:
The clone's form uses `name="email"` (not `username` like the live) — my fills were failing silently. The browser is on the fresh login now, so capture it first, then log in properly:
The new login captures caught a post-error state (my earlier empty-field submit likely rendered the auth alert). Let me reload cleanly and re-capture:
Clean login records restored (0.001%/0.012% — the r28 baselines hold). Let me verify the dashboard 0.307% with a stable re-capture:
Stable 0.307%. Let me profile the diff rows to confirm they're the known data-only residuals:
Both residual bands are the documented data-only set (header email glyphs, chat's 6th live message) — no regressions. Now the E2E and smoke suites:
**E2E 28/28 ✓.** Now the smoke suite:
All suites green. Now re-shooting the 9 reference screenshots per the repo convention:
Desktop shots done (login captured in LOGIN state ✓). Now the mobile set — logging back in first:
The mobile drawer shots had state issues (scrim selector failed, chat toggle errored). Let me redo them one by one with state verification:
The sidebar drawer is still OPEN — my dashboard shot just captured the wrong state. Let me fix the sequence properly:
The drawer toggle clicked was the wrong button (the drawer's internal header, not the header toggle). Let me find the actual header toggle:
Let me check how the E2E suite targets the drawer toggle:
The E2E target is `☰ Studio Tools`. Let me click it precisely and verify the drawer state:
Found it — my earlier click hit the invisible desktop sidebar's button (first in DOM). Clicking the real mobile toggle now:
Sidebar drawer captured correctly. Now the chat drawer — checking the E2E selector:
All 9 screenshots re-shot in verified states. Now the documentation alignment — writing session_51.md first:
Now updating AGENTS.md — the test-count row and the r29 quirk entries:
Fixing a punctuation slip and adding the r29 session-doc entry + quirk blocks:
Now adding the r29 quirk blocks after the r28 ones:
AGENTS.md done. Now CLAUDE.md and README.md:
Now the README r29 row (after the r28 row):
README done. Now the PAD — R29 revision entry, test matrix count, and ledger:
Now the PAD test matrix count and ledger:
PAD done. Now the SKILL.md updates:
All docs aligned. Re-running the gates after the doc edits (the docs-token pin scans .md files):
All gates green. Now updating the worklogs (repo's worklog.md + agent worklog):
Now committing in the repo's two-commit convention:
Both commits landed. Now the SSH push via the wrapper:
The **r29 round is complete and pushed** — remote main verified `@ 11c3953`, worktree clean, main-branch only, deploy key shredded after use.

**What this round delivered:**
- **Prod-mode battery answered clean**: dev vs prod renders **0.000%** on all four probes — the r28 badge fix was the only dev/prod gap
- **Closed the 480-768px blind spot** (10-39% diffs found): the live's login card is *fixed 480px from viewport 480 up* — fixed via the `min-[480px]:min-w/max-w` pair whose min-content holds the grid's 1fr track open at 768, plus the live's own `overflow-x: hidden` clip
- **TDD-verified**: 3 RED→GREEN pins (374 total tests), E2E 28/28, smoke 23/23, band captures now 0.002-0.003%, steady-state records hold

**Suggested next:** watch the CI verify-gate on the pushed commit. Remaining r30 candidates per session_51: the twin-copy state-instance split (mid-session only) and a sub-390 viewport audit of the studio views.
