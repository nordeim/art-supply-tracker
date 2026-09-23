# Session 32 — r19: CSS compile hygiene + the caret/selection, contrast, and DPI probe dimensions

**Scope:** `git pull` (brought in `docs/session_31.md`), core docs re-read
(AGENTS/CLAUDE/README/PAD v1.17, session_30/31, the Tailwind-V4 validation
report), baseline gates on the r18 tree (lint ✓ typecheck ✓ 310/310 vitest ✓),
then the r19 audit: the standard 8-pair battery plus the three probe
dimensions session_30 queued (caret/selection rendering, `prefers-contrast:
more` emulated captures, the devicePixelRatio 1x-vs-2x matrix).

## The round in brief

**Standard battery — PARITY (8/8 at or below baselines):**

| surface | hot% | baseline |
|---|---|---|
| dashboard-desktop | 0.34% | 0.53% |
| projects-desktop | 0.34% | 0.39% |
| supplies-desktop | 0.34% | 0.39% |
| inspiration-desktop | 0.49% | 0.54% |
| dashboard-mobile | 0.17% | 0.17% |
| sidebar-drawer-mobile | 0.47% | 0.47% |
| chat-drawer-mobile | 0.76% | 0.76% |
| login-desktop | 0.17% | 0.21% |

Drawer geometry byte-identical (312×844 z-50, sidebar x=0 open / −312
closed, chat x=78). Export envelope byte-identical modulo its timestamp.
23/23 smoke.

**Probe 1 — caret / ::selection / ::placeholder rendering: PARITY.**
Probed input-by-input on both sides (the dashboard chat input, the file
inputs, and every field of the open Create Project modal): caret
`rgb(255,255,255)`, `::selection` background transparent (the UA default
selection renders), placeholder white at 40% — identical on both sides,
including the photo file-input's lavender `rgb(220,199,255)` chrome. The
clone's computed styles serialize the alpha-composited values in oklab
(e.g. `oklab(0.199327 0.00554707 -0.0587953 / 0.7)`) where the live
serializes `rgba(15, 18, 48, 0.7)` — numerically verified equal (the oklab
converts to exactly rgb(15,18,48); the placeholder's oklab-white to exactly
rgb(255,255,255) at 0.4): the documented sub-perceptual TW4-compositing
class, invisible in pixels.

**Probe 2 — `prefers-contrast: more` emulated rendering: PARITY.**
Under active emulation (`computedContrast: true` verified), both CSSOMs
author zero `prefers-contrast` and zero `forced-colors` rules (r18's
inventory finding, now re-confirmed with the media actually emulated), and
the rendered paired captures sit at the standard baselines: desktop
0.34%, mobile 0.17%. Chromium's contrast boost affects both sides
identically.

**Probe 3 — devicePixelRatio matrix (1x vs 2x): PARITY.** dpr1 at 0.34%
(the standard baseline), dpr2 (3072×1688 physical) at 0.40% — the small
delta is 2x text rasterization, within the accepted envelope. No
DPI-dependent layout divergence, no half-pixel shifts, no image-rendering
artifacts at 2x.

## Findings

| ID | Finding | Class | Action |
|---|---|---|---|
| **r19-F1** | TW4's automatic content detection scanned the committed `skills/` folder — the repo's own task contract excludes skills/ from compilation, but nothing enforced it at the CSS layer. Skill docs/tools carry class-like strings in their examples (measured: the gift-evaluator skill's HTML template contributed two dead red-tinted `::selection` rules to the compiled stylesheet), and skills-scanned candidates inflated the dev CSS to 300,314 bytes / 3147 CSSOM rules (the live authors 1442). | HIGH — compile hygiene | `@source not "../../skills";` in globals.css. Dev CSS 300,314 → 189,577 bytes (−37%); production CSS 153,077 bytes; the CSSOM rule count 3147 → 1922; the skills-sourced rules gone. Rendering byte-identical (the rules were dead — verified 100.00% identical pre/post-fix captures). |
| **r19-F2** | The shadcn Input scaffold carried the selection-variant bg-primary / text-primary-foreground utility pair — dead while the component is unused (zero consumers render it), but the live authors ZERO `::selection` rules, so the scaffold default would render a styled selection the live never shows the moment the component is consumed. | MEDIUM — dead-rule parity | Stripped from `src/components/ui/input.tsx` (with the contract documented in a comment). The compiled CSS now carries zero `::selection` rules — matching the live's CSSOM. |
| **r19-M1** | The live's Vite SPA applies its styles asynchronously in fresh headless contexts: the first Playwright paired run measured 5.19% hot on the desktop dashboard — decomposed to the live's sidebar gradient button captured pre-paint (text visible, gradient absent). The control experiments: live-vs-live across the two browser contexts 4.97%, clone-vs-clone 0.00% — the clone renders deterministically across engines; the live has a transient style-application window a plain settle-wait can miss. | Methodology | Fresh-context captures now gate on a paint-settle condition (the visible Create Project button's computed `background-image` is non-none) — with the gate, every probe dimension lands at baseline. Recorded for future rounds. |

## The TDD cycle

New characterization suite `src/lib/css-hygiene.test.ts` (5 pins):

- globals.css carries the `@source not "../../skills";` directive (and the
  negative pin: skills/ is the ONLY excluded source — a broader pattern
  would silently drop real utilities).
- globals.css authors no `::selection` rules and no `caret-color`
  declarations (comment-stripped matching — comments are free to discuss
  the contract they guard).
- the shadcn Input carries no `selection:` utility classes.

Red→green verified the honest way: `git stash` of the two source fixes →
3 failed / 2 passed (the pre-fix state) → `git stash pop` → 5/5 green.
**315/315 vitest** (310 + 5), lint ✓, typecheck ✓, 25/25 E2E, production
build ✓, production CSS spot-checked (0 `::selection`, 0 skills-sourced
utilities).

## Screenshots & docs

All 8 `docs/screenshots/` re-shot from the remediated dev server with the
state-check discipline (visible-h1 verification before every capture;
neutral pointer; drawer geometry verified before the drawer captures; the
mobile set navigates at desktop before the viewport switch) — **all 8
byte-identical to the r18 parity-verified references** (deterministic
rendering; the fixes change only dead CSS).

Documentation aligned: README (315 counts, the r19 status row, the
Verification row's caret/contrast/DPI additions), AGENTS.md (315-test
inventory + the new Tailwind `@source not` framework quirk), CLAUDE.md
(315 count + the css-hygiene testing bullet), PAD v1.18 (revision block,
§5.x CSS compile hygiene, §7.1 distribution, §10 accepted-divergence
updates), and this session record. `.env.example` verified against the
codebase (unchanged — the single `DATABASE_URL` contract).

**Session 32 (r19) complete — the UI was already at visual and functional
parity on the standard battery AND on all three newly-probed dimensions
(caret/selection, emulated contrast, high-DPI); this round's real output is
the compile-hygiene remediation: the skills/ folder is now excluded from
Tailwind's content detection (a 37% smaller stylesheet and a CSSOM that no
longer drifts with the skills corpus), the last dead scaffold selection
rules are gone, and both contracts are pinned so they cannot silently
return.**

**Verification:** all claims executed and observed this session; the live
account left pristine (read-only recon — 0 projects / 0 supplies / 15
inspo; no chat messages posted; every probe view reached by navigation
only); the accepted divergences remain documented (dev badge, account
email, the live's residue chat message, the mobile login card's 0.5px
offset, the nav-vs-aside + labeled-drawer landmarks, the chat role="log"
improvement, the closed-drawer inert + aria-hidden pair, the
single-main/single-copy structure, sub-perceptual oklab-vs-rgba compositing
and fractional text-row rounding, the TW3/TW4 gradient-interpolation and
transition property-list internals).

**Suggested next steps:** watch the CI verify-gate on the pushed commit;
candidate probe dimensions still unexplored: `forced-colors: active`
emulated captures (the Windows high-contrast rendering — the authored-rule
inventory is pinned at zero on both sides, but the emulated-rendering
capture remains unmeasured), the `prefers-reduced-transparency` emulation,
and a WebKit/Firefox engine matrix (every capture so far is Chromium);
re-shoot `docs/screenshots/` after any chrome-level change (pointer parked
neutrally, view state verified — and fresh-context captures now require the
r19-M1 paint-settle gate).
