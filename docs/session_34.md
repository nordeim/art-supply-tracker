# Session 34 — r20: the media-contract pass — forced-colors CSSOM, the login chrome's transition contract, and the Firefox engine matrix

**Scope:** `git pull` (brought in `docs/session_33.md`), core docs re-read
(AGENTS/CLAUDE/README/PAD v1.18, session_32/33, the Tailwind-V4 validation
report), baseline gates on the r19 tree (lint ✓ typecheck ✓ 315/315 vitest ✓),
then the r20 audit: the standard 8-pair battery plus the three probe
dimensions session_32 queued (`forced-colors: active` emulated captures,
`prefers-reduced-transparency` emulation, the WebKit/Firefox engine matrix).

## The round in brief

**Standard battery — PARITY (8/8 at or below baselines):**

| surface | hot% | baseline |
|---|---|---|
| dashboard-desktop | 0.38% | 0.53% |
| projects-desktop | 0.37% | 0.39% |
| supplies-desktop | 0.37% | 0.39% |
| inspiration-desktop | 0.53% | 0.54% |
| dashboard-mobile | 0.17% | 0.17% |
| sidebar-drawer-mobile | 0.47% | 0.47% |
| chat-drawer-mobile | 0.76% | 0.76% |
| login-desktop | 0.17% | 0.21% |

Drawer geometry byte-identical (312×844 z-50, sidebar x=0 open / −312
closed, chat x=78). Export envelope byte-identical modulo its timestamp.
23/23 smoke.

**Probe 1 — `forced-colors: active` emulated rendering: captures PARITY,
CSSOM DIVERGENCE FOUND AND FIXED (r20-F1).** The paired captures sit at
the standard baselines (desktop 0.35%, mobile 0.14%), and under active
emulation both CSSOMs author zero contrast/forced-colors *responsive*
rules — but the r20 probe extended the inventory to a full media-rule
class sweep (recursing into `@layer` blocks, which the earlier r18/r19
inventories missed — TW4 nests utilities in `@layer`, so a plain
`@media`-only walk undercounts the clone), and that sweep found the
clone's compiled CSS carrying **six `@media (forced-colors: active)`
rules**: TW4's forced-colors-aware transparent-outline utility — its
base, `focus:`-, `focus-visible:`-, and three recharts-scoped variants —
emitted from the UNUSED shadcn scaffold's class strings (29 tokens across
13 `src/components/ui/` files). The live authors **zero**. The rules were
dead (no element carries the class on either side — verified), the same
class as r19-F2. Fixed by stripping the 29 tokens: dev CSS 189,849 →
188,388 bytes, production CSS 153,077 → 152,241 with **0 forced-colors
rules**, rendering verified unchanged (all 8 screenshots byte-identical).

**Probe 2 — `prefers-reduced-transparency: reduce`: PARITY** — with a
methodology catch (r20-M1): Playwright's
`emulateMedia({ reducedTransparency: "reduce" })` SILENTLY FAILS in this
environment (matchMedia stays `no-preference`); raw CDP
`Emulation.setEmulatedMedia` engages it (verified `true` on both sides
before capturing). Paired captures at the standard baselines (desktop
0.34%, mobile 0.17%); zero authored reduced-transparency rules in either
CSSOM.

**Probe 3 — engine matrix: Firefox PARITY, WebKit UNLAUNCHABLE.**
Playwright's WebKit cannot start in this sandbox (missing GTK-4 /
libsoup / manette system libraries — an environment limitation,
documented). Firefox 155: 8/8 paired surfaces at or below the Chromium
baselines (0.36 / 0.32 / 0.32 / 0.50 / 0.17 / 0.30 / 0.31 / 0.18%) —
the mobile drawers land BELOW their Chromium baselines — plus the
attribution controls: live-vs-live across two fresh Firefox contexts
0.00%, clone-vs-clone 0.00% (both sides render deterministically), and
the cross-engine delta is symmetric (live 7.83% / clone 7.71% —
Firefox-vs-Chromium font rasterization shifts both sides equally, which
is exactly why the paired in-engine diff stays at 0.3%).

## The login chrome's transition contract (r20-F2 + r20-F3)

Decomposing the CSSOM media-class inventory surfaced the live's FIVE
`prefers-reduced-motion` rules (the r17 inventory had counted `@keyframes`
only and missed them — the record is corrected): four are dead on both
sides (two `.amplify-loader`, one `.amplify-placeholder` — no
loader/placeholder ever renders in the reachable login flow, probed
through the auth round-trip; one TW3-preflight `html:focus-within`
scroll-behavior guard — a no-op, nothing scrolls smoothly on either
side). The rendered one: `.amplify-button { transition: none }` — under
reduce, the live's eye toggle, submits, link buttons, and the alert's
Dismiss stop transitioning.

That led to a computed-style probe of the login chrome's base transition
spec, which found the full divergence the steady-state battery could
never see: the live's login elements compute `transition: all 0.25s ease`
— the INACTIVE tabs, every input, the eye toggle, all three submits, the
three link buttons (Forgot / Back to Sign In / Resend Code), and the
alert's Dismiss — with `transition-property: none` on the ACTIVE tab
(Amplify's active-tab override). The clone carried the TW utility's
0.15s cubic-bezier(0.4,0,0.2,1) fades on the tabs/eye/submits, NOTHING
on the inputs/links/Dismiss, and no reduced-motion guard. A keyboard
user directly experienced it: the live's input focus border fades over
250ms, the clone's snapped.

**Fixed (r20-F2):** `transition-all duration-[250ms] ease-[ease]` on all
twelve measured elements + `transition-none duration-[250ms] ease-[ease]`
on the active-tab branches + the scoped `.ast-amplify-button` marker (8
elements) with ONE globals.css guard rule
(`@media (prefers-reduced-motion: reduce) { .ast-amplify-button {
transition: none } }`). The tabs, inputs, and every studio surface stay
UNGUARDED on both sides (the live's rule targets `.amplify-button only).
Verified per element: every computed spec is byte-identical to the
live's measurement (`all | 0.25s | ease`, `none | 0.25s | ease` on the
active tab, `none | 0s | ease` on the guarded elements under reduce).
Two TW4 mechanics were load-bearing: there is NO bare `ease` utility
(the token is silently ignored and the cubic-bezier default kicks in —
measured), hence the arbitrary-value `ease-[ease]`; and the r17
motion-fidelity pin ("globals.css carries no prefers-reduced-motion
guard") was refined to "exactly the one scoped login-button guard".

**Fixed (r20-F3):** the live's login submit holds its label ("Sign In"),
enabled state, and full opacity CONSTANT through the whole auth
round-trip (measured at 120ms intervals: text / disabled / aria-busy /
opacity / cursor all constant) — the clone's "Signing in…" swap,
`disabled` attribute, and 60%-opacity dim removed (the r15 modal-escape
precedent: affordances the live does not have). The `useTransition`
isPending flag is deliberately left unconsumed.

## Findings

| ID | Finding | Class | Action |
|---|---|---|---|
| **r20-F1** | The clone's compiled CSS carried six `@media (forced-colors: active)` rules — TW4's forced-colors-aware transparent-outline utility emitted from the unused shadcn scaffold's class strings (29 tokens / 13 files); the live authors zero. Dead while unused (no element carries the class on either side), the r19-F2 class — but a measurable authored-rule-class divergence the forced-colors probe dimension exists to catch. | MEDIUM — CSSOM authored-rule class | 29 tokens stripped. Dev CSS 189,849 → 188,388 bytes; production CSS 153,077 → 152,241 with 0 forced-colors rules; rendering unchanged (all 8 screenshots byte-identical). Pinned by the extended `css-hygiene.test.ts` — whose matcher is constructed at runtime from non-utility fragments, because TW4's content detection scans test sources too and a literal token in a comment or regex would compile the utility straight back into the CSS. |
| **r20-F2** | The login chrome's transition contract diverged (base spec + reduced-motion guard): live `all 0.25s ease` everywhere measured / `property: none` on the active tab / `.amplify-button` guarded under reduce; clone TW-utility 0.15s fades, no transitions on the inputs/links/Dismiss, no guard. Invisible in every steady-state capture (why nineteen rounds never saw it), directly user-experienced on focus/hover. | MEDIUM — motion contract | `transition-all duration-[250ms] ease-[ease]` + the active-tab override + the scoped `.ast-amplify-button` guard. Computed specs verified byte-identical per element (base + reduced-motion). Pinned by the new `login-motion-fidelity.test.ts` (12 pins) + the refined r17 pin. |
| **r20-F3** | The login submit carried pending affordances the live lacks (label swap, disabled dim). | LOW — affordance parity | Constant label, no disabled, dead `disabled:` classes stripped. Pinned. |
| **r20-M1** | Playwright's `emulateMedia({ reducedTransparency })` silently fails in this environment (matchMedia stays no-preference); raw CDP `Emulation.setEmulatedMedia` engages it. | Methodology | The reduced-transparency probe uses raw CDP and verifies engagement (matchMedia true) before capturing. Recorded for future rounds. |
| **r20-M2** | A plain `@media`-only CSSOM walk undercounts TW4 stylesheets — utilities nest inside `@layer` blocks (the fixed walk: recurse into every grouping rule; clone 113 → 1,924 rules). The r18/r19 rule inventories were run with walks that did not recurse into `@layer`. | Methodology | The r20 media-class sweep uses the fixed walk. (The r18/r19 *findings* stand — their conclusions were about rule classes that live at `@media` level.) |

## The TDD cycle

New/extended suites (13 pins):
- `css-hygiene.test.ts` +1: no source file under src/ carries the
  forced-colors outline token (runtime-constructed matcher).
- NEW `login-motion-fidelity.test.ts` (12): the transition spec on the
  tabs/inputs/eye/submits/links/Dismiss, the active-tab override, the
  guard's existence + scope + marker count (8) + the tabs/inputs
  non-guard, and the pending-state contract (no label swap, no disable).
- `motion-fidelity.test.ts` (refined): exactly one prefers-reduced-motion
  rule, scoped to `.ast-amplify-button`; no animation-targeting guard.

Red→green verified honestly: pre-fix 13 failed / 23 passed across the
three files (the pre-fix state), post-fix **36/36 green**.
**328/328 vitest** (315 + 13), lint ✓, typecheck ✓, 25/25 E2E,
production build ✓, production CSS verified (0 forced-colors, 0
transparent-outline utilities, the guard present).

## Screenshots & docs

All 8 `docs/screenshots/` re-shot from the remediated dev server with the
state-check discipline (visible-h1 verification before every capture;
neutral pointer; drawer geometry verified before the drawer captures; the
mobile set navigates at desktop before the viewport switch) — **all 8
byte-identical to the r19 parity-verified references** (deterministic
rendering; the fixes change only transient behavior and the CSSOM).

Documentation aligned: README (328 counts, the r20 status row, the
Verification row's forced-colors/reduced-transparency/Firefox additions),
AGENTS.md (328 inventory + two new framework quirks: the zero
forced-colors contract and the login transition contract), CLAUDE.md
(328 count + the Tailwind forced-colors note + the login-motion testing
bullet), PAD v1.19 ([R20] revision, §5.4 refined + the login transition
contract, §5.6 forced-colors contract, §7.1 300+28+25, §10 three
resolved rows + three accepted rows), and this session record.
`.env.example` verified against the codebase (unchanged — the single
`DATABASE_URL` contract).

**Session 34 (r20) complete — the UI was already at visual and functional
parity on the standard battery AND on the newly-probed dimensions
(forced-colors captures, reduced-transparency, Firefox); this round's
real output is the media-contract remediation: the compiled CSS no longer
authors rules the live does not (zero forced-colors rules on both
sides), the login chrome's motion is now Amplify's own (computed
byte-identical, base and reduced-motion), the login pending state
matches the live's constant button, and all three contracts are pinned
so they cannot silently return.**

**Verification:** all claims executed and observed this session; the live
account left pristine (read-only recon — 0 projects / 0 supplies / 15
inspo; no chat messages posted; every probe view reached by navigation
only); the accepted divergences remain documented (dev badge, account
email, the live's residue chat message, the mobile login card's 0.5px
offset, the nav-vs-aside + labeled-drawer landmarks, the chat role="log"
improvement, the closed-drawer inert + aria-hidden pair, the
single-main/single-copy structure, sub-perceptual oklab-vs-rgba
compositing and fractional text-row rounding, the TW3/TW4
gradient-interpolation and transition property-list internals, the
live's four dead reduced-motion rules, WebKit unmeasurable in this
sandbox, and the documented dead-scaffold CSS state).

**Suggested next steps:** watch the CI verify-gate on the pushed commit;
candidate probe dimensions still unexplored: the WebKit engine matrix
(needs a host with GTK system libraries — the one environment gap this
round), `scripting: none` / media-capability emulated rendering, and a
slow-network first-paint capture matrix (the live's async style
application, r19-M1, characterized only at settle); re-shoot
`docs/screenshots/` after any chrome-level change (pointer parked
neutrally, view state verified, the paint-settle gate for fresh
contexts).
