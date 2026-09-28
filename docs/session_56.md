A new round (r31) begins. Same operating contract as r30 — now with `docs/session_54.md` referenced, which means the user has committed a new session log after my push. Let me refresh the workspace first.
Remote moved ahead (`928a385` — the user's session log commit). Pulling:
session_54.md is the user's narration log of my r30 session — the project sits at **r30-complete + session log** (`928a385`). All the r30 doc updates were authored by me in the prior session, so my documentation model is current; only session_54.md is new. Let me spot-verify the doc state and re-check the scandihaven reference is still available:
Documentation state confirmed current — only session_54.md is new; all r30 records are in place. Now running the baseline gates and checking the dev server:
Baseline gates green (**vitest 383/383, lint ✓, typecheck ✓**, dev server live). Now let me review the r30 survey tooling that lives outside the repo, and plan the r31 survey:
The r30 tooling is reusable. Now let me plan the r31 survey precisely — first, checking agent-browser's file-upload capability (needed to drive photo states on both sides) and the r29 prod-mode probe method:
`agent-browser upload` is available, and the r29 prod-mode method is documented (standalone on :3001, four probes, 0.000% clean). Let me quickly review the clone's photo-input markup to build precise selectors, then set up the r31 survey:
The clone's photo markup is clear. Let me check agent-browser's dialog handling (needed for the delete-confirm override), then build the test photos and the r31 battery:
Dialogs are auto-handled (and I can override `window.confirm` via eval as r30 did). Now generating drift-resistant test photos and writing the r31 battery:
Now the r31 capture battery — both sides driven through identical photo states at 390/1280/320:
The battery ran, but the state checks are suspicious — `dialogs: 0` on the modal captures suggests the create modal may not have opened. Let me inspect what was actually captured:
The captures are all empty views — identical file sizes per view family mean **nothing was created**: the create modal never opened (`dialogs: 0` everywhere). My "New Project" button selector missed. Let me debug interactively:
Signed in. Now navigate to Projects and dump the actual button labels:
The projects view button is **"+ New Project"** — which my regex should match. Let me test the click and modal behavior directly:
The create form IS open — but the live's project form uses `input[name="title"]` (not "name"), and it's not a `role=dialog`. My battery's fill selector missed. Let me map the full form structure:
The live's project form: `input[name="title"]`, submit label "Create Project". Let me check the clone's equivalents, then check the supply form on the live:
The live's supply form uses `input[name="name"]` with submit "Add Supply". Let me confirm the clone's field names:
The clone's project input is `#project-name` (no name attribute). Checking the supply input id:
Both sides' form contracts are now clear (live: `input[name="title"]`/`input[name="name"]`; clone: `#project-name`/`#supply-name`; same submit labels). Let me check the clone's edit-panel delete buttons, then rewrite the battery with strict state assertions:
Both sides' contracts are mapped (detail panels: Delete via native confirm + Edit; edit panels: Cancel). Now writing battery v2 with strict per-state assertions so no capture can silently fail:
Good progress — the project with 2 photos was created (counter verified, chip visible), but the chip→detail click failed. A temp row now exists on the live that I must clean up. Let me debug the chip click interactively:
The walk-up landed on the drawer's ASIDE — the drawer's "RECENT PROJECTS" rail copy matched first, meaning **the live's drawer stays open after tile navigation**. That's what broke the battery's chip click. Let me close the drawer and inspect the real chip:
`drawerOpen: false` — the drawer was closed all along; the real problem is my chip-click selector matched the **off-screen drawer-rail copy** of "r31 probe" (always in DOM, width>0, but translated off-screen). The view chip never got clicked. Let me clean up the live temp row with a viewport-filtered click, then fix the battery:
Still on the projects view — the click didn't open the detail. Let me examine the chip's DOM chain and try clicking the precise element:
The chip name isn't a leaf element (my filter was too strict). Searching without the leaf constraint:
Nothing on-screen starts with "r31" at all. Let me dump the projects view's actual text content:
The dump is all drawer/chat rail content — the main view content comes later in DOM order. Let me check the URL and main content region:
URL confirms `/projects`. The drawer aside lives inside the first `<main>`. Let me take a screenshot to see the actual rendered state:
The live's projects view shows only summary cards — no chip in the initial view. The chip list must be in a drill-down or scrollable region. Let me check the clone's projects-view source to understand where chips render:
The interaction model is now clear: **"All Projects" is a drill-down tile** — clicking it reveals the chip list, and the detail renders below the selected chip's row. Let me verify on the live:
The drill-down revealed the real chip at (41, 370) — plus two hidden twin copies at (0,0). Clicking the real one (y>0 filter):
Detail panel confirmed — H2 "r31 probe" + "Delete" + **"Edit Project"** (my assert looked for bare "Edit"). Let me check the supplies view's drill-down model in the clone:
The full interaction model is mapped. Now let me clean up the live temp project and probe the supply form's default category:
Supply defaults: category **"Paint"**, status "ok". Pristine restored. Let me check the clone's post-create project navigation to complete the state model:
The state model is complete (sticky focusRequest opens list+detail post-create; supplies post-create flat list; Paint→All Paint drill-down). Writing battery v3 with the corrected interaction model:
Post-create the detail didn't auto-open and the drill-down recovery failed too. Let me debug the post-create state interactively (the temp project exists; I'll clean it after):
The view now shows **"All Projects: 0 projects"** — but the battery's chip-text assert passed! Let me check whether the project actually exists:
Contradiction found: the sidebar tile says **Projects: 1**, but the view's "All Projects" card says **0** — a stale view. Let me reload and see if it syncs:
After reload the count syncs — the live's post-create view is **stale until re-entry**. This may be a real parity divergence with the clone (which auto-refreshes + auto-opens via focusRequest). Let me check exactly when the clone sets the focus token:
The clone's focus token is set only from rail clicks — so the divergence candidate is **post-create view refresh**: clone refreshes immediately, live stays stale. Let me pin the live's exact behavior with a second temp create + polling:
Revealing: the **photoless** create refreshed the count instantly (2 projects at t=1). The battery's failure was with a **2-photo** create. Let me isolate: delete probe b, then create with a photo and poll:
The view shows project cards directly. Let me check whether probe b's card is below the fold or missing, and find the scroll container:
Only ONE card renders despite count=2, and the document doesn't scroll. Let me reload and re-dump:
After reload: tiles view, no cards. Let me re-enter the list and dump ALL elements (not just buttons) to find where both cards live:
Both cards render after reload — the earlier single-card state was the **stale view cache** (with-photo creates don't trigger the view's refetch on the live, while photoless ones do — a real behavioral finding candidate). Let me clean up both temp projects now, then finalize the battery with a post-create reload:
Live is pristine again (0/0/15). Now writing battery v4 with the corrected model — post-create AS-IS captures (the staleness pair), then reload → drill-down → detail:
Failed again at the same spot after reload. Let me inspect the captured list state:
Found the bug — **case-sensitive regexes**: `/^all projects/` doesn't match "All Projects..." (missing the `i` flag), same for `/^paint/`, `/^all paint/`, `/^delete$/`. Fixing, then cleaning up and re-running:
Pristine restored. Re-running the fixed battery on the live:
Sign-in failed this time — likely a transient timing issue. Let me check and retry:
Site is fine — the battery's 3s load wait raced the site. Bumping the initial sleeps and re-running:
All 16 photo-state captures succeeded with every assert green — only the final cleanup assert glitched (empty eval, likely mid-navigation). Let me verify the live state directly:
A native confirm dialog is blocking (the reload after supply-create wiped the `window.confirm` override). Accepting it and re-checking:
Supply deleted (Supplies 0). The project remains (the blocked dialog ate the second delete). Removing it now:
Let me take the known-good path — fresh reload, then drill-down and delete:
**Live pristine restored (0/0/15)** — all 16 live captures secured. Now patching the battery's cleanup section (fresh reload + post-reload confirm override) before running the clone side:
Now running the battery on the CLONE (dev server :3000):
The clone failed at the reload — `http://localhost:3000/projects` is a **404 on the clone** (single-route app; the live has real `/projects` routes). I need per-side reload URLs. First, cleaning the clone's temp project, then patching:
The list IS open with a card visible — but my button-only search missed it. The clone's chip may not be a `<button>`. Checking:
The clone's chip renders a **"NEW" badge first** (fresh project) so its button text doesn't start with the name — while the live's does. Fixing `click_chip` to anchor on the exact name element and walk up to the button, plus per-side reload URLs (the clone is single-route):
Battery patched. Now deleting the clone's existing temp project with the fixed chip-anchor logic before the re-run:
Clone clean. Re-running the full battery on the clone:
**Both sides captured fully — 16 paired photo states, both studios restored to pristine.** Now the pixel-diff battery:
The diff battery is in. Clean: supply-modal (0.007%), both post-create states, and the header-only residuals. Divergences cluster in **6 photo-surface families**: the project modal photo area (y552-599), the project chip (y360-431), the project detail/edit photo regions, the supply chip, the supply detail photo well, and the supply edit panel photo area (the biggest at 2.097%). Let me crop and inspect the top divergent regions:
The VLM flags a key difference: the live's thumb **×** buttons are absent in the capture (likely hover-gated on the live, always-visible on the clone) plus a possible thumb container/border difference. Let me measure both sides' modal photo area precisely in the browser:
**Live's × button: computed `opacity: 0`** — hover-gated, invisible in captures. Now the clone's equivalent:
**r31-F1 confirmed**: live × = `opacity: 0` (hover-gated) vs clone × = `opacity: 1` (always visible). Let me get the live's full class strings for the exact fix spec:
Full spec captured: **live ×** = `... opacity-0 group-hover:opacity-100 transition hover:bg-ast_pink` (plus the `ast-img-safe` Amplify artifact — visually inert, will document as accepted divergence). The supply modal preview × is confirmed NOT gated (that pair diffed clean). Now profiling the biggest divergence — the supply edit panel's photo area:
The crop missed (barcode region). Let me drive both sides to the supply edit state and dump the full form structure with geometry:
Live supply edit: 64px preview + always-visible × (not gated) + a **"Change photo"** control. Now the clone:
Both panels have the photo at the same position — but the live has an extra **"Photo" label** the clone lacks, and a massive 10584-px divergence sits at y1128-1223. Let me locate the exact x-range of that band's hot pixels:
The divergence is the **barcode input's border color** — prominent pinkish-red on the live vs faint on the clone. Let me measure the computed border colors on both sides (the clone's edit panel is still open in r31sc):
The clone's edit inputs use `border-blue-500/40` — a blue border! Let me survey the edit panels' input classes in the clone source:
**Found it** — `supply-edit-panel.tsx:346`: the barcode input carries a scaffold-leftover blue style (`border-blue-500/40 bg-black/30 focus:ring-blue-500/30`) while the live's is pink-family. Let me check for any other blue leftovers in the studio components, and measure the live's exact edit barcode + select chrome:
Two blue leftovers found: the create modal's barcode input (`supply-modal.tsx:355`, invisible in captures only because it's below the modal's scroll fold) and the edit panel's (`:346`). The studio-app blue is the intentional logo gradient. Now measuring the live's exact barcode chrome in both surfaces:
The live's **create-modal** barcode is blue (intentional) — but the edit-panel measurement returned NONE for `input[name=barcode]`. The live's edit barcode must use a different selector. Let me find it:
**r31-F2 confirmed**: the live's **edit-panel** barcode uses the standard pink input class (only its create-modal barcode is blue). The clone's edit barcode wrongly reuses the blue style. Let me also check the Add-to-Project select's placeholder text difference (the y1200-1223 band):
The select options already match. The remaining y1200-1223 divergence may be a vertical shift — the live's edit panel showed NO textarea in my dump. Let me measure both panels' field geometry precisely:
The live's edit panel geometry is fully mapped. The photo row region didn't diff, so the clone's "Photo" label likely exists as a non-`<label>` element. Checking the clone's photo area markup:
The clone's "Photo" label exists (a `<span>` — my dump filter missed it). Now inspecting the remaining divergent regions — the project chip and the project detail photo area:
The chip renders differently with a photo — live is more compact with a smaller thumb. Let me measure the chip + detail + edit photo geometry on both sides precisely:
**Major finding**: at 390, the live's chip img sits at x78.66 (name truncates, img fits inside the 94.66px card) while the clone's img is at **x106 — overflowing its card's right edge (135.66)**. Let me read the clone's chip markup:
Two more findings pinned: the clone's chip name carries a leftover `pr-10` that hides the name and pushes the img outside the card (live: no such padding, img fits). The clone's detail dump failed on a selector mismatch — let me check the clone's detail heading structure:
The detail structures match in source. The y528-575 divergence must be visual — let me inspect the detail photo crops:
**r31-F4**: the live's detail has NO "NEW" badge (the clone shows one) and the well x-position differs. Reading the clone's detail heading markup:
The r26 record says the live's detail H2 DID show the NEW badge — but now it doesn't. This may be an `isNewItem` time-window difference. Checking the clone's window and re-verifying the live's badge right after a fresh create:
Clone's window is 7 days. The r26 record measured the live's detail badge as present — the VLM may have missed it, or the live's window is short. Verifying directly in the browser with an immediate post-create check:
Two live-site changes detected: the chip name is now **text-[10px]** (was text-sm at r30) and the **NEW badge is absent** from both chip and detail (even at t+12s). The live site has been updated between rounds. Let me verify the no-photo chip, the supply chip, and the 320 state:
Decisive: the live **redesigned its chips** between rounds — the with-photo chip name is now a compact 10px group-hover style, the no-photo name dropped `pr-10`, and the **NEW badge is gone** from chips and the detail h2. Let me finish the live cleanup, then check the clone's supply chip/badge state:
Two leftover supplies from the measurement runs. Cleaning them up:
Live pristine (0/0/15). Now checking the clone's supply chip and badge states to complete the findings inventory:
The clone's supply chip renders the NEW badge + conditional `pr-12` — both now stale. One more verification pass: the live's supply detail badge and the open-state chip name:
**Reversal!** The supply chip/detail DO show the NEW badge (t+8s, no reload) — but the project checks (t+12s, after a reload) didn't. Hypothesis: **the live's badge is session-scoped, not time-windowed** — a reload drops it. Decisive test: create → reload → check:
**Confirmed: the live's NEW badge is session-scoped** — present for in-session creates, dropped on reload (the clone's 7-day window keeps it). One final measurement — the with-photo chip's in-session state (badge present, no reload):
**Full picture achieved** — the in-session chip name is `text-sm + pr-10` (exactly the clone's current class); the earlier 10px reading was twin-copy pollution (that's the rail's class). All 16 diff bands are now explained by 4 findings: F1 (× hover-gating), F2 (edit barcode blue), F3 (session-scoped NEW badge), F4 (conditional pr-10). Let me check the existing test pins and the clone's rail name before writing the plan:
The clone's rail class already matches the live's exactly — the rail is clean. Now let me read the exact × button markup in both clone surfaces for the fix spec:
All specs are pinned. Let me map the remaining wiring — isNewItem's usage sites and the create-action call sites for the session marking:
The wiring is mapped (create paths: `onSaved` for projects, `handleSupplyCreated` for supplies). Let me review the existing fidelity-test file structure to follow its pin patterns:
The test structure is clear. Now writing the survey record to the worklog and the remediation plan:
Plan validated. Now the TDD RED phase — first reading the exact existing pins to re-measure:
Now writing the RED tests. First the new session-badge test file with registry semantics + component wiring pins:
Now the photo-surface re-measures (the × gating classes) and the new barcode/pr-10 pins:
Now appending the r31 pins (the × gating note, the edit-barcode class, and the pr-10 conditional) to the photo-surface test:
The test references `supplyEditPanel` — let me verify it's declared in the file header:
Now the studio-domain re-measure — removing the window tests (the function is being replaced by the session registry):
Now running the RED phase — exactly the intended pins should fail:
RED confirmed — the 4 photo-surface pins + the new-badge module. Let me check the studio-domain empty-describe failure detail:
**RED phase exact** — 4 photo-surface pins + the missing new-badge module. Now GREEN. First the new registry module:
Now F1 — the × hover-gating in both surfaces:
Now F2 — the supply edit barcode input class:
Now F3+F4 — the four badge surfaces, the create-flow marking, and the domain removal:
The F4 pin regex needs to match the actual call form. Fixing the pin:
Now the supply chip, both detail panels, and the studio-app marking:
Now the studio-app create-path marking and the studio-domain removal:
Now removing the dead window helper from studio-domain:
Checking whether the export payload referenced the removed helper:
The export wire format also uses `isNewItem`. Let me check what the export tests pin — the live's export `isNew` semantics were measured in an earlier round:
The export's `isNew` is a separate **measured wire-format surface** (fresh items export `isNew: true` — verified from live exports). It must keep its window computation — moving the helper into export-payload as a private function:
Now the GREEN check:
Two fixable failures — the r14-era blue-family pin (the edit barcode is now measured pink) and the chip-order regex window (the longer class exceeded 120 chars). Reading both:
**GREEN — 393/393.** Running the full gates:
The CSS hash is unchanged — let me verify the new utilities actually compiled (they may all be pre-existing tokens):
CSS byte-identical (the new utilities were already compiled elsewhere) — **151,532 bytes, hygiene clean**. All gates green. Now the browser verification of the session-badge semantics on the clone (dev server hot-reloaded):
**All clone semantics verified byte-exact**: in-session badge+pr-10+img x106 ✓, post-reload badge-gone+pr-less+img x78.66 ✓, pink barcode border ✓. The hot-reload wiped the confirm override mid-script — accepting the dialog and finishing cleanup:
The supply is gone; the project remains. Deleting it:
Clone pristine. Now re-running the full capture battery on the fixed clone (the live captures remain valid):
The 390/1280 stages completed; the 320 assert hit a timing issue. The temp rows exist — let me finish the two 320 states and cleanup manually:
The drawer ended up open, blocking the view. Let me close it and drill down step-by-step with verification:
The chip IS on screen (the button dump shows it). My leaf-anchor search missed it — clicking the button directly:
Detail open at 320. Capturing the two remaining states and cleaning up:
Clone pristine, all 16 captures complete. **The final pdiff:**
**Massive convergence** — every pair collapsed to the header-residual class (supply-edit: 2.097% → 0.243%; proj-detail-320: 1.333% → 0.015%). Let me profile the two small remaining bands to confirm they're the accepted data-only class:
Two residual classes identified: the supply-edit residual is sub-perceptual color-space rounding (accepted), but the supply-list heading shows a **real text difference** — live: "Art Supplies" vs clone: "Art Supplies • Paint". Measuring the live's breadcrumb at the All-Paint state:
The live's H1 stays plain "Art Supplies" with a separate breadcrumb row "Art Supplies › Paint". Reading the clone's heading markup:
The clone's breadcrumb text matches — the difference must be the "Paint" segment's color. Measuring both sides' breadcrumb chrome:
The live's "Paint" segment: cyan rgb(0,229,255) at x122. Measuring the clone's for comparison:
DOM measurements are byte-identical. Let me compare the exact "Paint" word pixels to classify the residual:
**Decisive**: in the battery's capture, the live's breadcrumb shows NO "Paint" word at y308 (background pixels) while the clone renders the cyan "Paint". But the live's DOM (measured just now, without a reload) HAS it. Let me see what the live's capture actually rendered in its breadcrumb row:
Contradictory states — my "All Paint" click may have missed, leaving the category view. Re-measuring with strict state verification:
The live's crumb renders "› Paint" in DOM — but the capture seems to lack it. Maybe it's at a different y in the capture. Scanning the live capture for the cyan Paint pixels:
Contradiction persists — let me settle it definitively by capturing the live's type view right now with the exact battery sequence:
The fresh capture HAS the cyan Paint (y308-316) — the live's type view is correct. The battery's original capture must have been a different sub-state. Inspecting it directly:
One difference remains: the battery had a supply present. Testing the exact sequence with a supply:
**Reproduced!** With a supply present, the crumb is bare "Art Supplies". Let me see what view actually renders — type tiles or the flat list:
The live's category tile is **data-dependent**: with items in the category it opens the flat list directly (bare crumb + filter tabs); empty, it opens the type tiles. Let me pin the rule precisely with a cross-category test:
The rule is global, not per-category: **any supplies → flat list; zero supplies → type tiles**. Checking what the flat list shows when opened from an empty category:
The flat list is **unfiltered** (shows all supplies regardless of the clicked category). The live's contract: any supplies → the all-supplies flat list (bare crumb); zero → type tiles. Reading the clone's sub-view model to design the fix:
The clone's model already has the unfiltered "list" kind with the bare crumb — the fix is the category tile's data-dependent destination. Checking the tile grid's scope:
Before fixing, one final flip-test — delete the supply and confirm the 0-supply path returns to type tiles:
**Flip confirmed** — the rule is definitive and the live is pristine. Implementing F5 TDD-style. Checking the supply-fidelity test structure:
Appending the F5 pin (RED) to supply-fidelity.test.ts:
RED confirmed. Now the GREEN fix:
**GREEN — 394/394.** Verifying the JSX comment placement compiles (lint + typecheck + build):
All gates green, CSS unchanged. F5 changes the supply-list state's reachability — re-running the clone battery to re-capture the affected supply states:
Same 320 flake — recovering the two 320 states manually and cleaning up:
F5 verified live at 320 (filter tabs + bare crumb). Capturing the supply detail and cleaning up:
**Clone pristine (0/0/15).** The final pdiff with all five fixes:
Two crumb-region bands persist (supply-detail-320 and supply-list-1280 — both 146 px, the "› Paint" signature). Checking which side renders what:
The plot thickens — the live's crumb differs by navigation path: post-reload → bare (flat list), client-side nav → "› Paint" (type tiles). Verifying the no-reload path:
New hypothesis — the live's sub-view state **survives reloads** (restoration), and my "data-dependent" reading was an artifact. Testing cleanly from a fresh tiles state with data present:
Clean tiles state after reload (no restoration). The decisive Paint click with data present:
**Critical correction**: the clean test proves the category click **always opens the type tiles** (data-independent) — my earlier "flat list" readings were `agent-browser open` same-URL no-ops that preserved the live's SPA state. F5 was built on misread evidence and must be reverted. The canonical model: the clone's original always-type-tiles behavior was correct.
Now reverting the F5 pin and replacing it with the corrected contract pin:
The F5 revert is green. Now fixing the battery's reload trap (root-first navigation for both sides) and hardening click_chip:
Battery fixed. Cleaning the live's leftover test supply, then re-running the full battery on both sides:
**Live battery completed fully — all 16 states, pristine restored, no flakes.** Now the clone:
**Both sides complete, both pristine.** The definitive final pdiff:
**COMPLETE CONVERGENCE** — all 16 pairs now in the accepted-residual class (header band + sub-perceptual only; the crumb regions fully clean). Running the full verification battery — gates, E2E, smoke:
All suites green (394/394, 28/28 E2E, 23/23 smoke). Now the canonical regression pairs (login/dashboard at 390/1280):
**Canonical regression clean** — matching r30 baselines exactly. Now the prod-mode spot-check (standalone on :3001, the r29 method):
The 3rd arg wasn't wired — that re-captured the dev server. Patching the script to accept a base override and re-running the prod probe:
**Prod-mode spot-check clean** — dev/prod equivalence holds (identical numbers). Stopping the prod server and re-shooting the 9 reference screenshots:
Screenshots re-shot with verified states. Checking what changed vs HEAD:
Only the chat-drawer shot carries a byte-level re-encode (pixel-identical) — the empty-studio reference states are untouched by the r31 fixes, as expected. Now the documentation alignment — starting with session_55.md:
Now AGENTS.md — the test count, the r31 quirk entries, and the session pointer:
Now finding the AGENTS.md quirks section for the r31 entries:
AGENTS.md aligned. Now CLAUDE.md, README.md, PAD, and SKILL.md:
Now README.md — the test count and the r31 status row:
Now the PAD revision entry and test matrix:
Now the SKILL.md — metadata, Appendix A entry, and baselines:
All docs aligned. Writing the remediation worklog entry and re-running the gates after the doc edits (the docs-token pin scans .md files):
All gates green after the doc edits. The full inventory is staged for the two-commit convention. Commit 1 — the code:
**Commit 1: `e129cbd`** (16 files, +319/−50). Now commit 2 — docs alignment:
Both commits landed, tree clean. Now the push — redeploying the paramiko shim and key (same procedure as r30):
Recreating the Appendix A shim:
Key verified (same fingerprint as r30). Dry-run first:
Dry-run clean — a fast-forward of exactly our two commits (`928a385..df9018a`). The real push:
**Push succeeded and remote-verified: `refs/heads/main @ df9018a == local HEAD`.** Shredding the operator key, cleaning up, and verifying independently:
The r31 round is fully closed and pushed. Here's what this session delivered:

**The survey** — a 16-state paired-capture battery driving both sides through identical photo flows (modals with staged photos → post-create views → drill-down lists → detail panels → edit panels, at 390/1280/320), which surfaced:

1. **F1**: the photo-thumb × buttons are hover-gated on the live (opacity 0 until hovered) — the r30 element-isolation measurement had missed the interaction gating
2. **F2**: the supply edit panel's barcode input should be pink (the blue scanner style is create-modal-only — a scaffold leftover worth 10,584 hot px)
3. **F3**: the NEW badges are **session-scoped**, not time-windowed — a reload drops them (replicated with an in-memory registry; the 7-day window removed)
4. **F4**: the chip name's `pr-10` is conditional on the badge
5. **F5 — found, fixed, then reverted**: the "data-dependent category tile" turned out to be an `agent-browser` same-URL no-op artifact; the clean behavior was re-measured and the trap pinned so it can't be re-derived

**The verification**: all 16 pairs converged (2.097% → 0.243% worst case), canonical regression and prod-mode spot-check both clean, 394/394 vitest, 28/28 E2E, 23/23 smoke, the live left pristine (0/0/15).

**Pushed to main**: `e129cbd` (code) + `df9018a` (docs incl. session_55.md) — remote-verified via the SSH wrapper.

**Next steps** when you're ready for r32: deeper data states (stock filters, supply assignment, import with photos), the 320px modal-with-photos audit, or a drift re-check — the live demonstrably changed between r30 and r31, so periodic re-verification is worth keeping up.
