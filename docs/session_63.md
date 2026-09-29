# Session 63 — r35: the inspiration overlay panels rebuilt + the chat send contract

Date: 2026-09-29 · Round 35 · Session doc continuation of session_61/62
(r34 complete and pushed at 743b7eb + 9955d42; the session-log commits
4062825 + be8804f added session_60/62 — the users' r33/r34 narrations).

## What this round set out to do

1. Refresh the workspace (pull the session-log commit), re-verify the
   baseline gates (410/410).
2. The candidates session_61 queued: the **inspiration overlay panels as
   paired captures under populated states** (the r28 rail pairs were clean
   but the overlay detail panels had never been pixel-paired since the
   live's r33 redeploy), the **chat composer's error state** (pinned in
   source, never driven with a real failing send), and the standing
   **drift re-check**.
3. Remediate anything found TDD-first; re-shoot the reference screenshots
   (with the Inspiration-navigation fix discovered en route); align docs;
   commit and push to main.

## The drift re-check — clean, no new redeploy

The canonical pairs answered dash-1280 **5.702% any / 0.258% visible** and
dash-390 **6.322% any / 0.175% visible** — byte-identical numbers to r34,
the visible bands localizing to exactly the email band (y27-61 desktop /
y57-71 mobile), and the live's asset URLs still carrying the r33-redeploy
hashes. **No drift.**

## The inspiration overlay battery — the round's target, ten findings

The four detail panels (QUOTE OF THE DAY, STUDIO SPOTLIGHT, TODAY IN ART
HISTORY, PARTNERS) were DOM-probed and pixel-paired on both sides at 1280
and 390. The first battery read **8.1% visible on the quote pair** — the
panels had never been measured, and the clone's single shared panel
component diverged from the live's per-type contracts on every axis.

### F1 (HIGH) — the panel chrome is per-type on the live

The live renders each family with its own border/padding: quote
`border-ast_turquoise/40 p-5` (and NO top margin — it mounts inside the
Artist Quotes section flush below the tile grid, gap 0), spotlight
`border-ast_purple/50 p-4 mt-3`, history `border-ast_lavender/40 p-5`,
partner `border-ast_blue/40 p-5`. The clone rendered all four with one
shared `mt-3 ... turquoise/40 p-5` class. Fixed: a per-type `PANEL_CHROME`
map with the measured strings; the spotlight accent map's pink corrected
to the live's FAINT (the spotlight header is `text-ast_faint`, not pink).

### F2 (HIGH) — the spotlight panel's artwork gallery

The live's spotlight panel renders a full-width main artwork image
(`w-full rounded-xl object-contain object-center mb-3` with inline
`max-height: 16rem` — 633×256 at desktop) plus a **thumbnail selector**
(`flex gap-2 mb-3` of `w-12 h-12` border-2 buttons, the selected one
`border-ast_turquoise/60`); thumb clicks swap the artwork and move the
border. Kevin Lewis carries five artworks (artwork-01..04 + studio-01 —
all byte-identical in the repo's public/assets since the initial commit,
md5-verified against the live CDN this round, never wired up); Kim Wyatt
carries a single external wixstatic image (no thumb strip). The clone
rendered a 96px portrait + text-only layout (h177.8 vs the live's h539).
Fixed: the `gallery` field on the detail schema + seed, the gallery UI
with client-side selection state, and the name/handle/bio/attribution
stack at the live's measured classes (name in `font-bold text-ast_turquoise
text-base`).

### F3 (HIGH) — the mounts and the auto-scroll

The live's mount points: the quote panel nests INSIDE the quotes section
(gap 0); the spotlight panel mounts as its own child of the feed container
AFTER the whole spotlight section (the section's header + tiles stay
visible) and the DOCUMENT SCROLLS it into view (scrollIntoView block
"nearest" — the panel's bottom aligns to the viewport's bottom, measured
scrollY 365); the history/partner panels mount as direct children of the
feed container after their grids (the timeline panel NOT nested inside the
grid as the clone's col-span-2 wrapper). Fixed: all four mounts rebuilt;
the spotlight panel scrolls via a ref effect.

### F4 (MEDIUM) — the art-history panel's image-unavailable notice

The live renders `Image unavailable · rights protected — search the web to
discover this artist's work.` in `text-[10px] text-ast_faint/60 italic
mb-3 leading-snug` between the header and the title for imageless
entries. The clone lacked it. Fixed: the conditional renders the notice
verbatim.

### F5 (MEDIUM) — the inner structures and the tag chips

The live splits the citation stack OUT of the quote's flex row
(`mt-3 space-y-1` with the artwork line, the citation LINK, and the
rights line); the artwork caption composes THREE spans (title / " (year)"
/ " · author" — `splitArtworkCaption` now reproduces the split); the
citation renders as an underlined external link
(`text-ast-turquoise/80 underline underline-offset-2`, target _blank)
carrying a `citationUrl` (artic.edu, musee-orsay.fr, rijksmuseum.nl…
12 hrefs collected from the live and seeded); the tag chips are SOFT
PILLS (`text-[10px] uppercase tracking-wide bg-ast-lavender/10
text-ast-muted px-2 py-0.5 rounded-full` spans), not the scaffold's
bordered `<li>`s; the partner panel is FLAT (header mb-2 + title P in the
#8D5CFF literal + body P). The Kim Wyatt link renders WITHOUT underline at
`text-ast-turquoise/70` (the scaffold's underlined /80 was wrong).

### F6 (MEDIUM) — the selected-state family

The live MARKS the tile whose panel is open: the quote tile gains
`border-ast-turquoise/60`; the spotlight tile's gradient frame goes
full-opacity (`from-ast-electric-blue via-ast-purple to-ast-pink`, no
hover tokens); the today/timeline cards gain `border-ast-lavender/60
ring-1 ring-white/10` (the partner card `border-ast-blue/60`), dropping
their hover. The clone had no selected states. Fixed: ternaries on all
five surfaces.

### F7 (LOW) — the DOM-contract cleanup

The live's panels are plain `<div>`s (the clone's `<section
aria-label>` — the r34 article-tag class); the feed tabs are PLAIN
buttons (the clone's orphan `role="tab"` + `aria-selected` had no tablist
parent — invalid ARIA, removed); the spotlight tiles' redundant
aria-label stripped (the tile's visible name already provides it). KEPT
as documented a11y additions (the aria-pressed/role="log" class, now
pinned): the quote tiles' `aria-label` (the gradient tiles are unnamed
without it) and the panel close button's `aria-label`.

### F8 (MEDIUM) — the chat send contract

Measured on the live: the composer input carries NO maxLength attribute
and a 600-character message POSTS VERBATIM (the wall now carries the
probe — permanent, the auth rules allow read+create only, the r27
"Hello from clone test" precedent); the send-failure copy is "Could not
send message." (bundle source). The clone's `maxLength={500}` + the
schema's `.max(500, "Message is too long (500 characters max).")` + the
generic INTERNAL flattening were all scaffold-era inventions (initial
commit, never measured). Fixed: the attribute and the cap removed; the
action's catch returns the live's copy; the error `<p>` keeps its
role="alert" (documented addition — the live's is a plain p).

### F9 (documented) — the 7th live chat message

The over-length probe (600 chars of "x") is permanently on the live's
wall — no delete path exists (AppSync auth rules: read + create only;
verified in the bundle's model introspection). All future chat
comparisons carry the two extra messages (the 6th + this one).

### F10 (LOW) — the screenshot script's Inspiration navigation

`find role button click --name "Inspiration"` FUZZY-MATCHES the sidebar
rail's PARTNER card (its body text contains "partner inspiration") — the
click navigated with the partner section state and every prior round's
inspiration-desktop.png captured the PARTNER PANEL OPEN. The navigation
now clicks the INSPO stat tile via a JS probe; the re-shot captures the
clean base view (the only screenshot that changed; the other 8
byte-identical to HEAD).

## Measurement artifacts documented (no clone action)

- **The offline DataStore pend**: driving the live's chat error state via
  `set offline on` does NOT fail the send — Amplify DataStore queues the
  mutation locally and the promise stays pending (the input uncleared,
  no error rendered); a reload while offline drops it (verified: the
  message never posted). The error family is therefore bundle-pinned
  (the catch's copy + the p's class), not driven.
- **The twin-copy state split on mobile pairs** (the r26 record, re-hit):
  the live's mobile copy carries its own view-state — a load-time
  section navigation (the F10 fuzzy find) opens the partner panel on the
  MOBILE copy while the desktop copy's later interactions never touch it;
  the first mobile pairs read 14.2% on exactly this. The re-take drives
  the visible copy's state after crossing down (the r33/r34 methodology).
- **The TW3/TW4 space-y mechanics around the inline citation link**: the
  live's `space-y-1` puts margin-top on the later children — the
  citation link is INLINE, so its margin is layout-ineffective; the only
  rendered gap in the live's citation stack is the rights line's own
  mt-1. TW4's space-y emits margin-BOTTOM on the preceding block, which
  IS effective — the clone's first rebuild rendered the link 4px low and
  the rights line 4px high. Fixed by dropping the stack's space-y and
  keeping the rights' mt-1 (the class string now matches the live's
  exactly); the pin documents the mechanics.
- **The VLM small-text misreads**: two VLM passes misread the citation's
  tiny underlined text ("Mowell"/final-period claims) — the DOM string
  comparison is authoritative (byte-identical). One VLM pass degenerated
  into an HTML mockup response; re-prompt or fall back to DOM probes.

## The verification battery

- TDD: **39 RED pins → GREEN** on the first full run (2 schema + 3 seed +
  2 chat-fidelity + 2 action + 29 view pins, then 10 more pins added
  during the selected-state + space-y remediation passes).
  **459/459 vitest** (410 + 49 net-new), lint/typecheck/build clean,
  production CSS **154,031 bytes** (+2,499 — the per-type chrome, the
  gallery, and the selected-state utilities, all consumed), 0
  forced-colors / 0 ::selection.
- E2E 28/28; smoke 23/23.
- Browser verification through the real UI: the quote panel renders the
  live's exact chrome at the live's exact geometry (y417.8, gap 0 —
  byte-equal); the citation link + three-span caption + soft tag pills
  render; the spotlight panel renders the gallery (main 633×256 capped
  at 16rem, five 44px thumbs) with working thumb selection; the
  spotlight section stays visible; the partner/history panels render
  the flat structures; the mobile quote panels measure byte-identical
  (h405.8 at y415 on both sides).
- The post-fix pixel battery: **all 10 pairs converged** — base/history/
  inspire/inspo-390 at the email band alone (0.258%/0.175%); the panel
  pairs at 0.258-0.653% (the email band + ≤30-magnitude text AA, the
  citation/rights content verified byte-identical via DOM after two VLM
  misreads); VLM side-by-side on the desktop citation crop reads
  visually identical.
- The 9 reference screenshots re-shot with state checks: 8 byte-identical
  to HEAD; inspiration-desktop.png re-captured at the CORRECT clean state
  (the F10 artifact fixed).
- `.env.example` re-verified: no new environment variables (the gallery
  and citationUrl are seed data; the schema column is the existing
  detailJson).

## Suggested next steps

The inspiration overlay family is now pinned end-to-end (chrome, mounts,
galleries, selected states, citation links). A future round could re-run
the **canonical drift check** against the AA baseline (the live deploys
between rounds — r31 and r33 both caught one), drive the **chat
composer's error state on the clone** through a real failing send (the
action's catch path now carries the live's copy but has never rendered
in a browser), or pair the **Kim Wyatt spotlight panel** (the single
external wixstatic artwork renders on both sides — never captured as a
pair).
