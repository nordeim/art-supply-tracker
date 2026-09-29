# Session 67 — r37: the section-contract correction + the timeline artwork images

Date: 2026-09-29 · Round 37 · Session doc continuation of session_65/66
(r36 complete and pushed at b206cfc + d64f543; the session-log commit
a872702 added session_66 — the user's r36 narration).

## What this round set out to do

1. Refresh the workspace (pull the session-log commit), re-verify the
   baseline gates (468/468).
2. The candidates session_65 queued: the **canonical drift re-check**
   (the live deploys between rounds), the **Art History tab's timeline
   panels at the scrolled position** (the panel is tall; its bottom
   region had only been compared at the email-band level), and the
   **rail drawer's panel states** (the sidebar rail's cards, driven from
   the open mobile drawer — never paired).
3. Remediate anything found TDD-first; re-shoot the reference
   screenshots; align docs; commit and push to main.

## The drift re-check — clean, no new redeploy

The canonical pairs answered dash-1280 **5.702% any / 0.258% visible**
and dash-390 **6.322% any / 0.175% visible** — byte-identical numbers to
r34/r35/r36, the visible bands localizing to exactly the email band,
and the live's asset URLs still carrying the r33-redeploy hashes
(`portrait-01-BthGA3Kd.jpg`). **No drift.**

## The r37 discovery — the section contract was mis-read in r35/r36

The round's first battery (the drawer rail-card drives) surfaced a
behavior the records contradicted: on the LIVE, the **dashboard's Studio
Spotlight card OPENS the Kevin Lewis panel and scrolls the page** — but
the r35/r36 records pinned "the hardcoded spotlight-kevin-lewis id
matches no seeded entry — inert". The bundle extraction settled it:

- The live's Feed (bundle fn `TB`) keys its active panel on a **RAW
  STRING `r`** set directly from `location.state.section` —
  `useEffect(() => { e && i(e) }, [e])` — **never a resolved entry id**.
- The live's spotlight seed carries `id: 'kevin-lewis'` /
  `'kim-wyatt'` — the panel keys are `spotlight-${e.id}` with those
  slugs, so **`'spotlight-kevin-lewis'` MATCHES** (the dashboard card
  opens Kevin's panel — measured y517 h539, scrollY 109).
- The **sidebar RAIL's** spotlight card (both the drawer and desktop
  copies) navigates with **`'featured-artist'`** — THAT is the inert
  string (no panel, no scroll). The r35 record had assigned
  `spotlight-kevin-lewis` to the rail — conflating it with the
  dashboard card.
- The rail's quote card passes plain `'quote'` — also inert (the quote
  panels key on `quote-${date}`), which means an open panel CLOSES on
  that navigation.

### The four observable divergences (the clone vs the live)

1. **The dashboard Kevin card**: live → the panel + the scroll; clone →
   nothing (the resolver looked for an entry with cuid `'kevin-lewis'`).
2. **The rail's spotlight card**: live → nothing at all; clone → the
   r36 scroll effect fired (its prefix test matched the wrong string).
3. **The rail's TODAY IN ART HISTORY from the Art History tab**: live →
   NO panel (the today panel only mounts on the Today tab; the timeline
   panels key on bare dates); clone → the panel opened after the
   timeline (the resolved entry rendered per-TYPE).
4. **The rail's QUOTE card with a panel open**: live → the panel
   closes (`r='quote'` matches nothing); clone → the panel stayed
   (resolve → null → no state change).

## The second discovery — the timeline artwork images

The history-panel-top pixel pair (scrollTop 0) answered **0.852%
visible** with two identical bands (56×55px at x951-1006, y244-300 +
y369-425) — exactly the right-column timeline tiles' thumbs. The live's
timeline:

- **Van Gogh (2026-05-31) and Monet (2026-06-17) carry WORKING
  wikimedia `image_url`s** — their tiles render IMG thumbs (`fB`:
  `ast-img-safe shrink-0 w-14 rounded-xl object-contain object-center
  bg-transparent` + `maxHeight 3.5rem`; measured 56×44 / 56×43), the
  other six render the gradient fallback (`shrink-0 w-14 rounded-xl` +
  gradient + **inline `style height 3.5rem`** — no h-14 class).
- Their history panels render the artwork image (`ast-img-safe w-full
  rounded-xl object-contain object-center mb-4` + `maxHeight 11rem`;
  the Van Gogh panel h=565 vs the image-less 490) instead of the rights
  notice.
- The `fB` component itself: `(!src || error) ? fallback : img` — the
  quote panels' wikimedia images FAIL on the live (rendered nothing,
  which is why the r35/r36 quote pairs converged with no image); the
  timeline URLs load.

The clone rendered gradient thumbs + the notice for ALL eight entries.

## The converged batteries (before the fixes)

The NEW pairs all converged, pinning the previously-uncompared regions:
**history-panel-SCROLLED 0.044%** (the citation/rights/tags region in
frame for the first time), **drawer-today-top 0.175%**,
**drawer-today-scrolled 0.022%**, **drawer-partner 0.175%** (the mobile
drawer-nav states — the drawer closes and the panel opens in the feed,
matching the clone; the session_65 suggestion's "expand panels in the
drawer" reading corrected). The drawer-close + no-panel-inside-drawer
contract verified on both sides at 390.

## The remediation (TDD: 39 RED pins → 496/496 GREEN)

- **`src/lib/inspiration.ts`**: `resolveInspirationFocus` REPLACED by
  the raw-string grammar — `spotlightSlug` (title→slug:
  'kevin-lewis'/'kim-wyatt'), `spotlightKey`, `quoteKey`, and
  `inspirationEntryForKey` (the inverted lookup: 'art-history-today' →
  pickToday, 'partner' → the first partner, `spotlight-<slug>` → the
  matching spotlight, `quote-<date>` → the quote, a bare date → the
  timeline entry, else null). The schema gained `imageAlt`.
- **`inspiration-view.tsx`**: the `activeKey` RAW-STRING state (the
  section sets the key verbatim — no resolution); the tile keys
  (`quote-${date}` / `spotlight-${slug}` / `art-history-today` /
  `partner` / the bare date); the per-tab panel lookups; the scroll
  condition `activeKey?.startsWith("spotlight-")` (the live's exact
  prefix test — covers the tile clicks + the dashboard card, EXCLUDES
  `'featured-artist'`); the `AstImg` component mirroring the live's
  `fB`; the timeline tile + today card's img-vs-gradient-fallback thumb
  contracts (the inline height style); the history panel's
  img-vs-notice contract; the quote tiles in the live's date order
  (past desc + upcoming asc, capped at 4).
- **`studio-sidebar.tsx`**: the rail's spotlight card passes
  `'featured-artist'` (the live's string).
- **`scripts/seed.ts`**: the four quote dates (Cassatt 2026-07-26,
  Degas 2026-07-19, Kollwitz 2026-07-13, Klee 2026-06-27 — the quote
  tile keys); the Van Gogh + Monet wikimedia `imageUrl`s + `imageAlt`s
  (the live's `image_alt_texts` verbatim).

RED: 39 intended failures across 3 files (inspiration.test 15,
seed-fidelity 5, inspiration-view-fidelity 19). GREEN: **496/496
vitest** (468 + 28 net-new), lint/typecheck/build clean, the production
CSS **154,330 bytes UNCHANGED** (every new utility was already
compiled; the max-heights are inline styles like the live's), 0
forced-colors / 0 ::selection. E2E 28/28; smoke 23/23.

## The post-fix browser drives — all ten PASS

(a) the dashboard Kevin card → the Feed + the KEVIN LEWIS panel + the
scroll; (b) the rail's spotlight card → no panel, no scroll, and the
previously-open Kevin panel CLOSES (the key changed); (c) the rail's
TODAY IN ART HISTORY from the Art History tab → NO panel; (d) the
rail's QUOTE card with a timeline panel open → the panel CLOSES. All
four now byte-match the live's measured behavior.

## The post-fix pixel battery — ALL pairs converged

The full battery (the r36 standard pairs + the r37 additions, both sides
driven through identical state sequences with the pointer parked at a
neutral corner):

- **inspo-base 0.258% / today-panel 0.258% / partner-panel 0.258% /
  history-tab 0.258% / history-panel-top 0.258% /
  history-panel-scrolled 0.258% / vangogh-panel 0.258% / inspire-tab
  0.258%** — the email band alone.
- **spotlight-panel 0.302% / kevin-scrolled 0.302% / kim-scrolled
  0.044%** — the r36 documented baselines.
- **quote-panel 0.411% / quote-panel-390 0.653%** — the documented
  quote-panel AA residue family, byte-identical to r36's numbers.
- **kevin-card-state 0.046%** — the round's signature pair: the
  dashboard Studio Spotlight card, driven through the real UI on both
  sides, opens the Kevin Lewis panel and scrolls — pixel-identical
  (the F1a fix verified at the pixel level).
- **inspo-390 0.175%** — the mobile email band (after the twin-copy
  re-take, below).
- The earlier drawer-nav pairs: **drawer-today-top 0.175%,
  drawer-today-scrolled 0.022%, drawer-partner 0.175%** — the mobile
  drawer rail-card states (the drawer closes, the panel opens in the
  feed) converged.
- The history-panel-top pair's TWO tile-thumb bands (the r37 survey's
  0.852% divergence) are GONE — both sides render the fB gradient
  fallbacks symmetrically under the rate limit, converging at the email
  band.

A NEW reference screenshot: `docs/screenshots/history-panel.png` — the
Art History timeline panel (Carmen Herrera) at the scrolled position,
documenting the round's signature convergence (the
citation/rights/tags region in frame). The other 11 references re-shot
byte-identical to HEAD.

## Measurement artifacts documented (no clone action)

- **The wikimedia 429**: the repeated probing this round rate-limited
  the sandbox IP (`Retry-After: 600`, IP-wide, persisting past an
  hour) — the timeline images render the gradient fallback while
  limited, on BOTH sides (the live's own fB error path — the
  symmetric-fallback strategy: a FRESH browser context makes both
  sides re-request, so the pairs converge on the fallback contract
  either way). The img-loaded state's pixel pair is environment-
  blocked; the img contract is pinned by the tests (the exact
  live-measured class strings + maxHeight values) and the live's
  measured geometry (56x44 / 56x43, object-contain). A trap for any
  future round that loads the CDN images repeatedly: the failure mode
  looks like a code bug but is environmental — verify `naturalWidth`
  before diffing.
- **The login-pointer hover artifact (NEW)**: the fresh-browser login's
  find/click leaves the pointer at the SIGN-IN button's coordinates —
  at the default 1280x577 viewport those land ON THE FIRST QUOTE TILE
  after the feed renders at 1280x800, and the live's UN-GUARDED hover
  (the r13 `:hover` semantics) renders the hover border — an
  asymmetric first-tile band (0.382% visible on inspo-base, 1.435% on
  history-tab). The fix: `agent-browser mouse move 2 2` right after the
  login — park the pointer at a neutral corner (the r13 note's
  methodology, now load-bearing for fresh-context batteries).
- **The live's drawer-card finder**: the live's dashboard Studio
  Spotlight card is a DIV with cursor-pointer; the clone's is a
  SECTION — a `querySelectorAll('section')` finder silently no-ops on
  the live (the kevin-card pair read 73% divergent before the fix).
  Match `'div,section'` with the cursor-pointer class.
- **The twin-copy mobile state, re-hit**: the live's MOBILE copy's Feed
  mounted with the kevin-card section state (its own r), so ITS panel
  stayed open after the desktop copy's close — the inspo-390 pair read
  29.6% until the re-take drove the visible copy's state after
  crossing down (the r35 twin-copy methodology).
- **The double-encoded eval JSON**: agent-browser's eval output
  double-wraps JSON strings intermittently — the batteries' parsers
  now unwrap defensively (three iterations).

## Suggested next steps

The section contract is now pinned end-to-end (the raw-string keying,
the four panel families, the scroll prefix, the timeline artwork
images). A future round could: re-run the **canonical drift check**
(the live deploys between rounds), pair the **Van Gogh + Monet panels
at the scrolled position** (their artwork-image bottoms — the panels
are 565px tall), or sweep the **Inspire Me tab's states** (the
placeholder's own keying — `inspire-me` — is pinned but its panel
surface has never been paired beyond the base state).
