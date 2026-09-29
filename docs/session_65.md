# Session 65 — r36: the spotlight scroll + the per-tag pills + the chat failure paths

Date: 2026-09-29 · Round 36 · Session doc continuation of session_63/64
(r35 complete and pushed at e840760 + 213398b; the session-log commit
cd47161 added session_64 — the user's r35 narration).

## What this round set out to do

1. Refresh the workspace (pull the session-log commit), re-verify the
   baseline gates (459/459).
2. The candidates session_63 queued: the **Kim Wyatt spotlight panel as
   a paired capture** (her single external wixstatic artwork renders on
   both sides — never captured as a pair), the **clone's chat error
   state driven through a real failing send** (the action's catch path
   carries the live's copy but had never rendered in a browser), and
   the standing **drift re-check**.
3. Remediate anything found TDD-first; re-shoot the reference
   screenshots; align docs; commit and push to main.

## The drift re-check — clean, no new redeploy

The canonical pairs answered dash-1280 **5.702% any / 0.258% visible**
and dash-390 **6.322% any / 0.175% visible** — byte-identical numbers
to r34 AND r35, the visible bands localizing to exactly the email band,
and the live's asset URLs still carrying the r33-redeploy hashes
(`portrait-01-BthGA3Kd.jpg`). **No drift.**

## The Kim Wyatt pair — two defects that had masked each other

The pair opened both panels with byte-matching structure (the
wixstatic main image 633×256 under the inline `max-height: 16rem`, the
naturalWidth 460, no thumb strip, the link text/class/target/rel
identical, the tile images md5-identical: the live's external
profileUrl vs the clone's local `kim-wyatt.jpg`, `fd7027ef…`). But the
GEOMETRY diverged: the live's panel bottom sat **EXACTLY at the
viewport bottom** (scrollY 317, bottom 800) while the clone's hung
**256px below the fold** (scrollY 63).

### F2 (HIGH) — the spotlight auto-scroll

The live's bundle carries ONE scroll effect for the family, keyed on
the active id: `setTimeout(() => wrapper.scrollIntoView({behavior:
'smooth', block: 'nearest'}), 60)` — and the wrapper is an
**ALWAYS-RENDERED plain div inside the spotlight section**, right
after the tile grid (DOM-probed: the section = [header P, grid,
wrapper > panel]). The clone had TWO effects — a rail-navigation row
scroll and a **synchronous mount-time panel scroll**. The sync scroll
ran before the artwork image had sized, so `nearest` computed against
a ~237px-shorter panel and landed 63px into a 317px scroll. The 60ms
debounce is load-bearing: by the time the live's timeout fires, the
image has sized (even from cache) and `nearest` computes the full
alignment. Fixed: the unified effect (keyed `[activeId, initialSection,
activeType]`, the condition testing the active entry's type since the
clone's ids are DB cuids, not the live's `spotlight-*` slugs) scrolling
the always-rendered wrapper; the panel's own effect and the old row
scroll removed.

### F4 (LOW, structural) — the mount record corrected

The r35 record placed the spotlight panel "as its own child of the
feed container after the whole spotlight section." The bundle and the
DOM probe say otherwise: the panel renders **inside the section**, as
the wrapper's child. The difference is layout-neutral — the wrapper is
a zero-height plain div and CSS margins collapse through it, which is
exactly why every r35 pixel pair converged despite the structural
divergence — but the DOM contract differed, and the scaffold's extra
empty `<div />` feed spacer (the live's feed = [quotes-sec,
spotlight-sec, today-grid] exactly) is gone with the restructure.

### F5 (HIGH) — the per-tag colored pills, masked below the fold

The F2 defect had a consequence: at scrollTop 0 (every prior paired
capture's position) the panel's bottom region — **the tags, the link,
the attribution** — sat below the fold on both sides. It had NEVER been
pixel-compared. The DOM probe found the live's spotlight tags are
**per-tag colored pills** from a parallel `tagColors` data array
(bundle: `tags:[…], tagColors:['text-ast_pink bg-ast_pink/20', …]`):
Kevin's "Mixed Media / Textile / Spotlight" render pink/purple/turquoise
`/20` pills, Kim's "Founder / Studio Artist / Beta" render
turquoise/20, lavender/20, and faint-text-on-lavender/10 — all at
`text-[9px] px-2 py-0.5 rounded-full ${tagColors[n] ?? faint/lavender-
10}`, **mixed case**, no tracking-wide. The clone had rendered the
QUOTE panels' unified lavender family (10px uppercase tracking-wide)
on every panel — the r35 remediation's mis-generalization, invisible
until the scroll fix brought the region into frame. The quote/history
panels DO use the lavender family on the live too, capped at **four**
pills (`e.slice(0, 4)` — also unpinned in the clone). Fixed: the
tagColors field + seed data, the per-type pill rendering with the
faint fallback, and the slice cap.

### F3 (LOW) + F6 (MEDIUM) — the data contract

The live's spotlight data (bundle, extracted verbatim): Kim carries
`website: 'https://www.kimwyatt.art/'` + `websiteLabel: 'kimwyatt.art'`
(the JSX appends the arrow); the clone's seed had the bare host and the
arrow inside the label. The gallery is an array of **`{url, alt}`
objects** — Kevin's five carry "Kevin Lewis — artwork 1" … "Kevin
Lewis's studio", Kim's single carries "Liberty With Mask by Kim Wyatt"
— the main img's alt falls back to the entry name (`a.alt ?? e.name`),
both imgs carry the extra `ast-img-safe` class (a compiled no-op in the
clone, kept for the class-string contract), and the **thumb hover
border is `ast_purple/40`** (the clone rendered turquoise/40).

## The chat error battery — the round's target, two real findings

### F8a (HIGH) — the action's catch scope

Driving the server-side failure with a `BEGIN EXCLUSIVE` SQLite lock:
the send's `requireUser()` session read threw **P1008 (socket timeout)
OUTSIDE the r35 catch** — the try only wrapped the INSERT. The POST
answered **500**, the client's action promise rejected inside the
transition, and NOTHING rendered: the draft froze, no error, no append,
no feedback (the button un-disabled when the rejection settled). The
live's catch covers its whole send flow. Fixed: one try wrapping the
entire action body — the session read, the parse, the insert — every
failure now answers the r35 copy.

### F8b (HIGH) — the offline crash

Driving the transport failure with `agent-browser set offline on`: the
rejected action promise escaped `startTransition`'s async scope with
no error boundary in the tree — **the whole app unmounted** ("Application
error: a client-side exception has occurred", screenshot
`clone-offline-crash.png`; the page never recovered without a reload).
The live's handler catches everything client-side. Fixed: the client's
`onSend` wraps the await in try/catch, rendering the live's copy on any
rejection. Both drives verified post-fix: the error `<p>` renders
between the message list and the form with the exact copy + class, the
draft is preserved, the count is unchanged, and the recovery send
succeeds (the error clears, the message appends, the draft empties).
The live's own offline behavior — DataStore's silent local queue — is
an Amplify-specific mechanism documented as an accepted divergence
(the clone errors immediately instead of queueing).

### F1 (MEDIUM) — the Send label

The bundle's submit button: `children: d ? 'Sending' : 'Send'` — the
label swaps for the whole in-flight window. The clone rendered a
constant "Send". The locked-send drive displayed it directly: the
during-pending probe read **"Sending"** on the clone after the fix.
(The r20 login-submit "constant label" pin is the LOGIN family's
contract — the chat composer's is the opposite, measured.)

## The verification battery

- TDD: **16 RED pins → GREEN** (2 chat-fidelity: the label swap + the
  client catch; 1 action pin: the whole-path try; 2 inspiration schema
  pins: the {url, alt} objects + the bare-string rejection; 3
  seed-fidelity pins: the alts, the tagColors, the website/label; 8
  view-fidelity pins: the wrapper mount, the no-spacer negative, the
  scoped quote/history pills + slice, the spotlight pills, the
  arrow-appended link, the ast-img-safe main img, the purple thumb
  hover, the unified 60ms effect with the sync-scroll negative).
  **468/468 vitest** (459 + 9 net-new), lint/typecheck/build clean.
- Production CSS **154,330 bytes** (+299 — the pill utilities compile
  from the seed's tagColors class strings via TW4's own content
  detection of `scripts/seed.ts`, all consumed), **0 forced-colors /
  0 ::selection**.
- E2E 28/28; smoke 23/23 (the battery left both studios pristine — the
  probe messages cleaned from the local db, the live untouched).
- The post-fix browser drives: the Kevin panel settles at **scrollY
  365 / bottom 800** and Kim's at the 'nearest'-correct position —
  byte-equal to the live's measured geometry; the pills render the
  per-tag colors verbatim (hyphen family); the link carries the live's
  raw href + the JSX arrow.
- The post-fix pixel battery: **all 12 pairs converged** — the ten
  r35 pairs at their documented baselines (the email band, the
  quote-panel AA residue byte-identical to r35's numbers 0.411%/
  0.653%), plus the two NEW scrolled-position pairs that put the
  panel-bottom region in frame for the first time: **kevin-scrolled
  0.302%, kim-scrolled 0.044%**.
- The 9 reference screenshots re-shot with state checks: ALL 9
  byte-identical to HEAD (the r36 changes manifest only in interaction
  states the standard set does not capture); two NEW references added —
  `docs/screenshots/spotlight-panel-kevin.png` +
  `spotlight-panel-kim.png` — documenting the remediated gallery,
  pills, and scroll.
- `.env.example` re-verified: no new environment variables (the
  tagColors/gallery alts are seed data on the existing detailJson
  column).

## Measurement artifacts documented (no clone action)

- **The below-the-fold masking**: paired captures at scrollTop 0 only
  compare a tall panel's TOP ~174px — the r35 spotlight "convergence"
  never saw the tags/link/attribution region. The r36 battery adds the
  scrolled-position pair (capture at the auto-scrolled position, as the
  live leaves it) — future panel rounds must pair BOTH positions.
- **The Prisma socket timeout under lock**: `BEGIN EXCLUSIVE` blocks
  reads too — the polling action fails silently (non-fatal by design)
  while the send action's session read throws P1008 after ~5.5s. A
  clean, deterministic way to drive the server-side failure family.
- **The live's offline DataStore pend** (r35 record, re-confirmed): the
  live's chat errors CANNOT be driven offline — DataStore queues the
  mutation and the promise pends; the clone's Server Action transport
  fails immediately. Accepted divergence, documented in AGENTS.md.

## Suggested next steps

The spotlight family is now pinned end-to-end at BOTH scroll positions
(chrome, mounts, galleries, alts, selected states, per-tag pills,
links). A future round could re-run the **canonical drift check**
against the AA baseline (the live deploys between rounds — r31 and r33
both caught one), pair the **Art History tab's timeline panels at the
scrolled position** (the history-tab panel is tall; its bottom region
has only been compared at the email-band level), or sweep the **rail
drawer's panel states** (the sidebar rail's Art-History/Partners cards
expand panels in the drawer — never paired inside the drawer itself).
