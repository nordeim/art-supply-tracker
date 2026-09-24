# Session 43 — r25: the sign-up pre-submission state machine + the error/reset-view engine matrix

Date: 2026-09-24 · Round 25 · Session doc continuation of session_41/42
(r24 complete and pushed at 53c03f4; the user committed the raw r24
narration as session_42.md — token-clean, so the docs-token pin stayed
GREEN on pulled main for the first time in four rounds).

## What this round set out to do

1. `git pull` (53c03f4 → af6cef2: session_42.md only), re-review the
   core docs, validate against the codebase, run the baseline gates.
2. Close the session_41 queued probe dimensions: the **error/reset-view
   captures** (the battery covers steady-state only) and the **Firefox
   third-engine opinion** on the r24 scroll fix + the mobile flows.
3. Remediate anything found, TDD-first; align docs (the SKILL.md
   distillation was stale at r16); re-shoot the reference screenshots;
   commit and push to main.

## Baseline state on the pulled tree

- Tree clean at af6cef2; lint ✓, typecheck ✓, vitest 335/335 ✓ (the
  docs-token pin GREEN — session_42's narration quoted the stripped
  tokens only descriptively), build ✓, production CSS 150,821 bytes
  (content hash `de83a4a2`, byte-identical to the r23/r24 records).
- The fresh Chromium battery: 9/9 EXACTLY at the documented baselines
  (login 0.232 / dashboard 0.333 / projects 0.305 / supplies 0.305 /
  inspiration 0.466 / scrolled 0.148 / mobile 0.328 / sidebar-drawer
  0.577 / chat-drawer 1.144; geometry 982/138/982; drawers 312@0 and
  312@78).

## The finding — the sign-up/reset pre-submission state machine

Driving the error/reset states on the live exposed that the Create
Account submit is DISABLED while the form holds weak content — the
entry point to a whole interactive surface neither r9 (which measured
the SUBMITTED states) nor r20 (which measured the sign-IN round-trip)
had covered. Measured keystroke-level on the live (20+ states):

- **Validation is per-field BLUR-gated.** The password field's first
  blur renders the Cognito policy stack (empty pw = all five lines,
  24px each) and live-updates it on every later keystroke; the confirm
  field's first blur renders the mismatch line (confirm !== pw,
  including an emptied confirm). Pristine forms render NOTHING
  regardless of content. There is NO cross-field short-circuit: the
  mismatch renders regardless of pw validity once the confirm has
  blurred.
- **A submit validates every field at once** (click or Enter — Enter
  in the pw field on a pristine form renders the stack and disables
  the button; r9's submitted abc/xyz state carried stack + mismatch
  together).
- **The sign-up submit disables exactly while a validation line
  renders**: bg `#EFF0F0`, text `#89949F`, cursor not-allowed,
  label/height/opacity constant; re-enables (pink, pointer) when the
  form cleans up. The email format is IRRELEVANT (bad email + valid
  matching pw stays enabled while `form.checkValidity()` is false).
- **The sign-IN form has no pre-submission validation at all** (the
  blur handler must be mode-gated), and **both reset-view submits never
  disable** (measured in every state) — the reset-confirmation view
  renders the same stack/mismatch after the New Password field blurs
  but keeps its Submit clickable.
- **The cursor contract**: the live's eight `.amplify-button` chrome
  elements (three submits, both eye toggles, three link buttons, the
  alert's Dismiss) compute `cursor: pointer`; the clone's computed
  `default` (invisible in captures — a computed-style divergence of
  the class the repo pins). The tab strip carries `auto` on the live
  (an equivalent non-pointer rendering; no action).
- Probe lesson: the live's "Forgot your password?" is a `<button>` with
  `amplify-button--link`, not a link role.

## The fix (TDD)

1. RED: 13 new pins — `login-fidelity.test.ts` (the blur-gated
   engagement model, the touch-all submit path, the clearValidation
   reset, the disabled derivation + chrome, the exactly-one disabled
   attr) and `login-motion-fidelity.test.ts` (the cursor rule + the
   disabled override). The r20-F3 matcher that literally forbade
   `disabled:cursor-not-allowed` was refined (it was written against
   the sign-in round-trip; the pending contract itself stands), and
   the r9 stack-position pin followed the policyErrors →
   policyViolations rename.
2. GREEN: `pwTouched`/`confirmTouched` engagement state with derived
   `showPolicyStack`/`showMismatch` rendering (replacing the
   submit-only state), mode-gated onBlur handlers on both views'
   password + confirm fields, touch-all in both submit handlers, the
   sign-up submit's `disabled={signupSubmitDisabled}` + the measured
   gray chrome, and one globals rule
   `.ast-amplify-button:not(:disabled) { cursor: pointer; }`.
3. **The cascade-layers trap** (caught by the E2E spec): the first
   cursor-rule attempt was unscoped and outranked TW4's `@layer`
   utilities — an unlayered rule beats EVERY layered one regardless of
   specificity, so the sign-up submit's `disabled:cursor-not-allowed`
   utility lost. The `:not(:disabled)` scope fixes the precedence; the
   rule's comment and pin document the trap.
4. E2E: a new 3-spec `signup-validation.spec.ts` drives the whole
   machine through the real UI with ZERO auth requests (the
   rate-limiter budget is a pinned contract): pristine renders nothing,
   pw blur engages + disables + live-updates, confirm blur mismatches,
   the sign-in form stays inert.

State-for-state verification on the remediated tree: disabled / cursor
/ bg / color / stack geometry byte-equal between live and clone in
every measured state (y 699 pristine / 793 engaged-weak; the pristine
pink #FE5FA7 / the disabled gray #EFF0F0-#89949F; pointer /
not-allowed).

## The error/reset-view engine matrix (the queued probe)

Five states captured on both sides — login-error (the bad-credentials
alert), login-policy (the Cognito stack), reset-email, reset-confirm,
reset-code-error (the invalid-code alert):

- **Chromium**: 5/5 at parity — fresh baselines 0.146 / 0.352 / 0.148
  / 0.207 / 0.125%; same-side determinism 0.000% both sides.
- **WebKit** (the r24 user-space GTK stack): 5/5 at fresh WebKit
  baselines 1.658 / 2.190 / 1.563 / 1.668 / 1.579%, determinism
  0.000%, and the cross-engine check is textbook symmetric — per-side
  engine shifts ~82–84% with live-vs-clone ASYMMETRY ≤ 0.017% (the
  r20 Firefox / r24 WebKit pattern: the elevated paired diffs are
  symmetric software-rasterization noise, not clone divergence).
- Live-account safety (the r9 precedent): one bad sign-in, one
  send-code email, one invalid-code submit per pass — failed attempts
  create no data; Cognito throttles but does not lock.

## The Firefox third-engine opinion (the second queued probe)

- **The r24 scroll fix is engine-independent**: live pre 201 → post 0
  and clone pre 201 → post 0 (RESET-OK both sides) — now verified on
  Chromium, WebKit, AND Firefox.
- Mobile surfaces at fresh Firefox baselines: dashboard 0.314 /
  sidebar drawer 0.387 / chat drawer 0.421 / desktop dashboard 0.287%
  (the Chromium family — Firefox needs no separate elevation).
- Desktop geometry byte-equal: docH 998 / scrollMax 154 / mainH 998 on
  both sides; drawers 312@0 and 312@78.

## Post-fix verification

- Chromium battery re-run: 9/9 EXACTLY at the documented baselines
  (the remediation is visually inert on every steady-state surface).
- Smoke 23/23; E2E 28/28 (25 existing + the 3 new specs); vitest
  348/348 (335 + 13); lint ✓ typecheck ✓ build ✓; production CSS
  151,043 bytes (+222: the disabled utilities + the cursor rule;
  0 forced-colors, 0 selection — hygiene clean).
- All 9 reference screenshots re-shot after a clean dev-server
  restart: **0.0000% vs the r24 references** — visually inert.
- `.env.example` re-verified against the codebase (unchanged:
  DATABASE_URL + AST_PRISMA_DIR documented; the DEPLOYMENT.md pointer
  resolves).

## Remediation summary

| ID | Finding | Resolution |
|---|---|---|
| F1 (HIGH) | Sign-up/reset pre-submission validation missing (submit-only rendering) | The blur-gated per-field engagement model with derived stack/mismatch rendering; 13 pins + the zero-auth E2E suite |
| F2 (HIGH) | The sign-up submit's touch-gated disabled chrome missing | `disabled={signupSubmitDisabled}` + the measured #EFF0F0/#89949F/not-allowed chrome; the other submits stay always-enabled (measured) |
| F3 (MEDIUM) | The amplify-button cursor contract diverged (pointer vs default) | One cascade-layers-safe globals rule; the :not(:disabled) scope is load-bearing |
| F4 (MEDIUM) | SKILL.md stale at r16 | Frontmatter, Appendix A ledger through r25, baselines, 9 surfaces, 42 sessions |
| F5 (MEDIUM) | Docs alignment | AGENTS (348 + 28 + three new quirks), CLAUDE (348 + 28), README (counts + the r25 row), PAD (R25 revision, §7.1 320+28+28, two §10 resolved rows), this record |

Confirmed at parity (no action): the full Chromium battery (9/9 at
baselines, pre- AND post-fix), the error/reset views on three engines,
the Firefox scroll opinion, geometry on every engine, the export
envelope (the r23 record stands — the live account left pristine:
navigation, captures, one code email, and the two measured failed
submits only).

## Verification

All claims executed and observed this session. The live account was
left pristine (0 projects / 0 supplies; no chat messages posted; one
reset-code email received and ignored — no code attempted, no password
changed). The accepted-divergence set is unchanged (no new entries —
the r25 findings were all clone-side fixes, not live-side
instabilities).

## Suggested next steps

Watch the CI verify-gate on the pushed commit. Future candidates: the
error-state battery could grow the Create Account duplicate-email
alert (a real account exists to duplicate), a print-stylesheet opinion
on the error views, and — environment permitting — an unpatched-wrapper
WebKit run on a host with real GPU/libGTK.
