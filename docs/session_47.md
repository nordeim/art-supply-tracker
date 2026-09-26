# Session 47 — r27: the login input chrome, the eye's a11y contract, and the reset views

Date: 2026-09-26 · Round 27 · Session doc continuation of session_45/46
(r26 complete and pushed at 545317e + 6d6e116; the user committed the raw
r26 narration as session_46.md).

## What this round set out to do

1. `git clone` (the workspace had been reset), re-review the core docs,
   validate against the codebase, run the baseline gates.
2. A fresh live-vs-clone survey focused on the surfaces the steady-state
   batteries never measured at depth — the LOGIN card's input chrome
   (the session_45 next-steps list: the create-modal fields at the MOBILE
   viewport, the duplicate-email Create Account alert, and a paired
   capture battery that drives both sides through identical interaction
   scripts before capturing).
3. Remediate anything found, TDD-first; align docs; re-shoot the
   reference screenshots; commit and push to main.

## Baseline state on the pulled tree

- Tree clean at 6d6e116; lint ✓, typecheck ✓, vitest 358/358 ✓, build ✓;
  production CSS 151,058 bytes (the r26 record, exactly); 0
  forced-colors, 0 selection — hygiene clean.

## The probes that came back CLEAN (no action)

- **The create modals at 390×844 (session_45's first candidate):** the
  project modal card 358×625 @ y110 and the supply modal card 358×812
  (capped by max-h) — every label (14px/20px), input (42px), select
  (37px), textarea (90px project / 66px supply), and the r26 button row
  (Cancel/Create 42px @ 16px/24px) measured byte-exact on both sides.
- **The duplicate-email Create Account alert (session_45's second
  candidate):** "User already exists" in the #FCE9E9 box, 58px tall at
  document-y 868, 2 SVGs, the 50×34 "Dismiss alert" button — identical
  on both sides, along with the form (doc-y 566, h450) and the submit
  (doc-y 942, 42px). The live's tab buttons carry type=submit (an
  Amplify quirk) — the first "Create Account" match is the TAB, not the
  submit; probe both.
- **The steady-state paired capture battery with pre-capture state
  verification** (scrim-in-DOM, drawer x, scrollY, visible view — the
  session_45 methodology candidate): mobile dashboard 0.97% (the email +
  one extra live chat message), projects 0.22%, supplies 0.22%,
  inspiration 0.81%; desktop 0.36% / 0.35% / 0.35% / 0.54% / login
  0.23%. Every surface inside the documented accepted set.
- **The mobile chat drawer:** input 183×34 @ x112 (12px), Send 54×34
  (12px/500) — identical geometry (the y offset is the message count).

The 13.38% first-pass "diff" on the projects view was a STATE MISMATCH —
the live's chat drawer was still open behind the capture. `offsetParent`
is null for `position: fixed` elements (both the drawers and the scrim),
so visibility probes must use the scrim's DOM presence + the drawer's
translate x instead. This is now the paired-capture rule: assert state
equality BEFORE every capture.

## The findings — all in the login chrome, the batteries' blind spot

**r27-F1 (HIGH): the login inputs' font metrics and padding.** Measured
on the live DOM (sign-in, create, reset email, and reset confirmation
views, at both 390×844 and 1280×800): every `amplify-input` computes
font-size 16px / line-height 24px with padding 8px 16px (the 42px box
height emerges from 8+24+8+2borders). The clone's `text-sm` (14px/20px)
+ `px-3` (12px) rendered the typed text and the placeholders 2px smaller
with a 4px narrower inset — visible in the low-tolerance capture diff
(0.51% concentrated exactly in the input rows). Fix: the two input class
constants carry `px-4 py-2 text-base` (the deterministic h-[42px] stays —
its 24px content box exactly fits the 24px line).

**r27-F2 (MEDIUM): the eye toggle's a11y contract.** Measured on the
live: the show-password button keeps its accessible name CONSTANT
("Show password") in both states (role=switch + aria-checked carries the
state) and announces the flip through an sr-only
`aria-live="polite"` span that reads "Password is hidden" /
"Password is shown" (verified by clicking the live's eye — the text
flips). The clone flipped its label to "Hide password" and had no
announcement. Fix: constant label + the sr-only span before the icon.

**r27-F3 (MEDIUM): the reset EMAIL view's content-sized card.** Measured
on the live at 390×844: the reset email view renders its card
content-sized at 307px (the h3 "Reset Password" at 32px drives the
max-content: 241 + 64 form padding), centered in the 358px auth column —
the email input and Send code render 241px. The reset CONFIRMATION view
stays full-width (355px form). The clone rendered the email view
full-width (292px inputs). Fix: the card's width ternary —
`mode === "reset" ? "w-fit md:w-full" : "w-full"` (the live's desktop
copy renders the email view full-width; the twin copies disagree, the
single copy renders both).

**r27-F4 (MEDIUM): the reset forms' bottom padding.** Measured on the
live (three independent probes, both viewports, both reset views):
padding 32px on ALL four sides (fieldset margin 0, padding 0). The r9
pin's `pb-5` (20px) left the clone's reset cards 12px short (form height
471 vs the live's 483 on the confirmation view). Fix: `space-y-4 p-8`.

**r27-F6 (the sub-pixel card cap):** below md the live's auth card is
content-sized at **357px** — at 390 the 358px column centers it with
0.5px margins each side (card x16.5, inputs x49.5); at 375 the column
(343) is narrower than the intrinsic so the card fills it (measured
identical on both sides at 375). The clone's `w-full` card rendered
x16/x49 at 390, shifting every 1px border and glyph edge half a pixel —
a 0.93% AA residual concentrated in the input rows. Fix:
`max-w-[357px] md:max-w-[480px]` over the base w-full — verified
byte-exact after (357.00 @ 16.50, input 291.00 @ 49.50 on both sides;
mobile login capture 0.93% → 0.14%). At md+ both sides render the card
480.00 @ x174.00 y323.50 — byte-exact before and after.

**r27-F5 (LOW, documented only):** the project modal's "Photos" label
renders as a `<span>` on the clone vs a bare `<label>` (no `for`
attribute, no nested control) on the live — zero visual, a11y-tree, and
behavioral difference (measured: same classes, same computed styles,
same 20px box at the same position). Accepted divergence.

## The fix (TDD)

1. RED: 6 pin changes — the input-chrome regex (login-fidelity),
   the two input class-string pins (login-motion-fidelity), the
   reset-form padding pin, plus 4 new pins (the eye's constant name, the
   sr-only aria-live span, the reset-email card ternary, the 357 cap)
   and one updated card-tail pin (the className became a template
   literal). Exactly the intended pins failed on the first run; two
   adjacent pins needed their matchers adjusted for the new class
   strings (the pb-3 tail regex, the w-fit count — the comment text
   itself matched the token).
2. GREEN: five edits in `login-screen.tsx` — the two input constants
   (`px-4 py-2 text-base`), the eye toggle (constant label + the sr-only
   span), the card's width ternary + the 357/480 max-w pair, and the two
   reset forms (`space-y-4 p-8`). No layout logic touched.
3. Post-fix, byte-exact on every measured metric: inputs 16px/24px on
   8px/16px padding at 42px (414/364 wide at desktop — the live's exact
   values); the reset email card 307 @ x42 (live 307) with the input and
   Send code at 241 @ x75 (live 241 @ x75); the confirmation form height
   483 (live 483); the sign-in card 357.00 @ x16.50 (live 357.00 @
   x16.50); the eye's a11y tree carries "Password is hidden" under the
   constant "Show password" switch name (the live's exact structure).

## Post-fix verification

- vitest 362/362 (358 + 4 net new); lint ✓ typecheck ✓ build ✓;
  production CSS 151,176 bytes (+118: the sr-only, w-fit, and 357/480
  max-w utilities — all live consumers); 0 forced-colors, 0 selection.
- E2E 28/28 and smoke 23/23 on a clean re-seeded database.
- Paired captures after the fix: desktop login 0.23% → **0.04%**;
  mobile login 0.93% → **0.14%**; mobile reset email view 0.43% (the
  shrunk card matches the live's).
- All 9 reference screenshots re-shot on the remediated tree (4
  byte-identical: the studio desktop views; 5 re-rendered: the login +
  mobile shots).
- The live left pristine: zero projects / zero supplies / 15 inspo
  entries (no rows created or deleted; no chat messages posted; the
  duplicate-email attempt creates nothing).

## Remediation summary

| ID | Finding | Resolution |
|---|---|---|
| F1 (HIGH) | Login inputs 14px/20px on 12px padding vs the live's 16px/24px on 8/16 | `px-4 py-2 text-base` on both input constants; 2 pins updated + the negative text-sm pin |
| F2 (MEDIUM) | Eye toggle relabeled to "Hide password" and made no state announcement | Constant "Show password" label + the sr-only aria-live span; 2 new pins |
| F3 (MEDIUM) | Reset email view full-width vs the live's content-sized 307px card | The card's `w-fit md:w-full` ternary on mode === "reset"; 1 new pin |
| F4 (MEDIUM) | Reset forms' bottom padding 20px vs the live's 32px | `space-y-4 p-8` on both reset forms; the pin re-measured |
| F6 | The auth card's half-pixel centering (357px content-driven below md) | `max-w-[357px] md:max-w-[480px]`; 1 new pin with the full measurement record |
| F5 (DOCS) | Photos label span-vs-label (invisible) | Accepted divergence, documented here + AGENTS.md |

## Verification

All claims executed and observed this session. The live account was
left pristine (the 0/0/15 contract holds).

## Suggested next steps

Watch the CI verify-gate on the pushed commit. Future candidates: the
login inputs at the 480-768 viewport band (the max-w handoff), the
eye-toggle icon paths (Amplify's ViewIcon vs lucide-eye — near-invisible
at #0d1a26 but a potential icon-shape probe), and the tab strip's
type=submit quirk on the clone (the live's tabs are submit-type buttons;
the clone's are type=button — invisible, but a DOM-contract candidate).
