"use client";

/**
 * Login screen — faithful clone of the live "Join the Art Supply Tracker
 * Artist Beta" gate: marketing column + the live app's AWS-Amplify-styled
 * auth card. All chrome values were measured against the deployed app on
 * 2026-09-17 (computed styles, post-hydration steady state — the live
 * renders different pre-hydration markup, so only settled DOM counts):
 *
 * - Card: centered in the grid's 1fr column (mx-auto), zero card padding
 *   (the form carries mt-3 px-8 pt-8 pb-8) plus a 12px card tail (pb-3),
 *   1px #5B3FD3 border, solid #120724 surface, and the soft shadow
 *   `0 2px 6px rgba(13, 26, 38, 0.15)`.
 * - Tabs: equal-width (flex-1) 50px text-base/700 — active #047d95,
 *   inactive #304050.
 * - Password row: the eye toggle is a 50px sibling OUTSIDE the input
 *   (the live's Amplify layout), not an icon inside the field.
 * - Submit: 42px, 16px/700 #FE5FA7. SERVER auth errors render as the
 *   live's Amplify ALERT BOX (r9, DOM-measured): div[role=alert], flex row,
 *   16px gap, px-4 py-3, bg #FCE9E9, no radius, content-driven height
 *   (58px one line / 72px two), a 24px warning icon and a 50x34 "Dismiss
 *   alert" button (both in the live's #660000); dismissing restores the
 *   no-error layout. CLIENT validation stays inline at 16px #660000: the
 *   Cognito password-policy stack (contiguous 24px lines after the
 *   Password field, one per violated rule — "Password must have at least 8
 *   characters" etc.) and "Your passwords must match" after Confirm.
 * - Forms rely on NATIVE validation — the browser blocks empty and
 *   malformed-email submissions (password inputs carry `required` only; the
 *   live has no min/maxLength attributes).
 * - Create Account asks Email / Password / Confirm Password (the live's
 *   Cognito form — no display name; the action derives it from the email
 *   local part).
 * - "Forgot your password?" swaps the card to the live's Reset Password
 *   view (32px/500 #0d1a26 heading — the live's dark-on-dark quirk —
 *   "Enter your email" label, pink "Send code", teal "Back to Sign In",
 *   tabs hidden). A valid email then swaps to the live's CONFIRMATION view
 *   ("Code *", New Password + Confirm Password with eyes, pink Submit,
 *   teal "Resend Code" — r9). No mailer exists (ADR-003), so no code can
 *   ever be valid: Submit answers with the live's exact Cognito rejection
 *   ("Invalid verification code provided, please try again.") and Resend
 *   is a silent no-op, exactly like the deployed app's code redelivery.
 * - Link buttons are CONTENT-WIDTH 35px centered (r9): Forgot 182px, Back
 *   to Sign In 127px, Resend Code 115px — the r8 51px full-width forgot pin
 *   was a pre-hydration artifact.
 *
 * Submits through Server Actions and refreshes the route on success so the
 * server component re-renders with the session cookie present.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

import { signInAction, signUpAction } from "@/actions/auth";
import { passwordPolicyViolations } from "@/lib/validation";
import type { ActionResult } from "@/lib/result";

type Mode = "signin" | "signup" | "reset" | "reset-confirm";

/** The live's AWS-Amplify error alert, chrome-measured on the deployed app
 * (r9): a pale-pink full-width box (#FCE9E9, no radius/border) with the 24px
 * warning icon, the 16px #660000 message in a flex:1 body, and a 50x34
 * dismiss button (transparent, 4px radius, X icon). The height is
 * content-driven — the 34px button + 24px v-padding sets the 58px one-line
 * floor; a wrapped message grows it (the live's invalid-code alert renders
 * 72px). Dismissing collapses it back to the no-error layout. */
function AmplifyAlert({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex items-center gap-4 bg-[#FCE9E9] px-4 py-3"
    >
      <span
        aria-hidden="true"
        className="shrink-0 leading-none text-[#660000]"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <div className="flex-1">
        <p className="text-base text-[#660000]">{message}</p>
      </div>
      <button
        type="button"
        aria-label="Dismiss alert"
        onClick={onDismiss}
        className="flex h-[34px] shrink-0 items-center justify-center rounded-[4px] border border-transparent px-4 font-bold text-[#660000] ast-amplify-button transition-all duration-[250ms] ease-[ease]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}

/** r27: the live's amplify-input computes 16px/24px on 8px/16px padding
 * (measured on the live DOM at both viewports); the box height stays the
 * deterministic h-[42px] — its 24px content box exactly fits the 24px
 * line the live's 8+24+8+2borders emerges to. */
const inputClasses =
  "h-[42px] w-full rounded-[4px] border border-[#89949f] bg-transparent px-4 py-2 text-base text-[#0d1a26] placeholder:text-[#9ca3af] focus:border-[#047d95] focus:outline-none focus:ring-2 focus:ring-[#047d95]/30 transition-all duration-[250ms] ease-[ease]";
/** The password variant: the live's Amplify input group rounds the input's
 * LEFT corners only (`4px 0px 0px 4px`) — the 50px eye toggle continues the
 * group's #89949f border and rounds the right side. */
const passwordInputClasses =
  "h-[42px] w-full rounded-l-[4px] border border-[#89949f] bg-transparent px-4 py-2 text-base text-[#0d1a26] placeholder:text-[#9ca3af] focus:border-[#047d95] focus:outline-none focus:ring-2 focus:ring-[#047d95]/30 transition-all duration-[250ms] ease-[ease]";
const labelClasses = "mb-2 block text-base font-normal text-[#304050]";

export function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The r25 blur-gated engagement model (measured keystroke-level on the
   * live 2026-09-24): the deployed Amplify signUp / reset-confirmation
   * forms validate each field on its first BLUR and then live-update on
   * every keystroke — pw blur renders the Cognito policy stack (empty pw
   * = all five lines), confirm blur renders the mismatch line (confirm
   * !== pw, including an emptied confirm). Pristine forms render nothing
   * regardless of content; a SUBMIT (click or Enter) validates every
   * field at once. The lines below replace the r9/r20 submit-only
   * policyErrors/mismatch state with the derivation the live computes. */
  const [pwTouched, setPwTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  /** The reset-confirmation view's code field. */
  const [resetCode, setResetCode] = useState("");
  /** r20-F3: the live's submit button holds its label, enabled state, and
   * full opacity through the whole auth round-trip (measured at 120ms
   * intervals on the deployed app: text/disabled/aria-busy/opacity/cursor
   * all constant) — no pending affordances are rendered. The transition
   * still wraps the action (React's non-blocking update semantics); only
   * its isPending flag is deliberately not consumed. */
  const [, startTransition] = useTransition();

  /** Clears every client-validation surface (mode switches reset the card
   * to its pristine state, like the live's Amplify route changes — the
   * r25 engagement flags reset with it: re-entering a view renders
   * nothing until the pw blurs again, measured on the live). */
  function clearValidation() {
    setError(null);
    setPwTouched(false);
    setConfirmTouched(false);
  }

  /** The r25 derived validation state — the live's per-field touch model:
   * the stack renders when the pw has blurred AND the current value
   * violates the policy (live-updating on every keystroke); the mismatch
   * renders when the confirm has blurred AND the values differ. On the
   * sign-in view neither flag can be true (the blur handler is mode-
   * gated and clearValidation resets on every switch — the live's
   * sign-in form has NO pre-submission validation). */
  const policyViolations = passwordPolicyViolations(password);
  const showPolicyStack = pwTouched && policyViolations.length > 0;
  const showMismatch = confirmTouched && confirmPassword !== password;
  /** The sign-up submit's touch-gated disabled state (measured on the
   * live): the button disables EXACTLY while a validation line renders
   * — email format is irrelevant (bad email + valid matching pw stays
   * enabled while form.checkValidity() is false). The sign-in submit and
   * both reset-view submits never disable (measured in every state). */
  const signupSubmitDisabled = mode === "signup" && (showPolicyStack || showMismatch);

  function handleResult(result: ActionResult<{ email: string; displayName: string }>) {
    if (result.ok) {
      // Re-render the server component with the fresh session cookie.
      router.refresh();
      // The live's SPA swaps the login view for the dashboard on auth
      // success and the document lands scrolled to top; router.refresh()
      // re-renders in place and the browser would otherwise PRESERVE the
      // pre-submit offset (measured r24: pre 201 -> live 0 / clone 201 on
      // WebKit mobile, pre 128 -> live 0 / clone 128 on Chromium with a
      // forced wheel — reachable whenever the login card exceeds the fold).
      window.scrollTo(0, 0);
      return;
    }
    setError(result.error.message);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearValidation();

    if (mode === "signin") {
      startTransition(async () => {
        handleResult(await signInAction({ email, password }));
      });
      return;
    }
    // The live's Cognito client validation: every violated policy rule
    // stacks after the Password field AND the confirmation mismatch shows
    // after Confirm — both at once when both are broken (submission
    // blocked until the form is clean). A submit touches EVERY field
    // (measured on the live: Enter in the pw field on a pristine form
    // renders the stack and disables the button; r9's submitted abc/xyz
    // state carried stack + mismatch together).
    setPwTouched(true);
    setConfirmTouched(true);
    const violations = passwordPolicyViolations(password);
    if (violations.length > 0 || password !== confirmPassword) return;
    startTransition(async () => {
      handleResult(await signUpAction({ email, password }));
    });
  }

  function onResetSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // The live's Amplify flow: a valid email swaps the card to the
    // confirmation view (Cognito emails a code from here). Invalid formats
    // never reach this handler — native type=email validation blocks them,
    // exactly like the deployed form.
    clearValidation();
    setPassword("");
    setConfirmPassword("");
    setResetCode("");
    setMode("reset-confirm");
  }

  function onResetConfirmSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearValidation();
    // Same client validation as sign-up: the policy stack after New
    // Password, the mismatch after Confirm — and a submit touches every
    // field at once (the live's Enter/click path, r25).
    setPwTouched(true);
    setConfirmTouched(true);
    const violations = passwordPolicyViolations(password);
    if (violations.length > 0 || password !== confirmPassword) return;
    // No mailer exists (ADR-003) — no code was ever emailed, so no code can
    // be valid. Cognito's exact rejection, measured on the live app.
    setError("Invalid verification code provided, please try again.");
  }

  /** The live's Amplify show-password control: an eye icon announced as a
   * switch with checked state, positioned OUTSIDE the input (50px block). */
  function renderEyeToggle(
    shown: boolean,
    onToggle: () => void,
  ) {
    return (
      <button
        type="button"
        onClick={onToggle}
        role="switch"
        aria-checked={shown}
        aria-label="Show password"
        className="flex h-[42px] w-[50px] shrink-0 items-center justify-center rounded-r-[4px] border-y border-r border-[#89949f] text-[#0d1a26] ast-amplify-button transition-all duration-[250ms] ease-[ease] hover:text-[#c5cdd6]"
      >
        {/* r27: the live keeps the accessible name CONSTANT ("Show
         * password") — role=switch + aria-checked carries the state —
         * and announces the flip through this sr-only aria-live span
         * (measured: "Password is hidden" / "Password is shown"). */}
        <span className="sr-only" aria-live="polite">
          {shown ? "Password is shown" : "Password is hidden"}
        </span>
        {shown ? (
          <EyeOff aria-hidden="true" className="h-4 w-4" />
        ) : (
          <Eye aria-hidden="true" className="h-4 w-4" />
        )}
      </button>
    );
  }

  return (
    <main className="min-h-screen bg-[#050009] text-[#F7F2FF] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid gap-8 md:grid-cols-[1fr_420px] items-center">
        {/* Marketing column — the live's contiguous stack: eyebrow, h1
         * (leading-none), description, and the spam-folder note carry no
         * vertical margins between them. */}
        <section>
          <p className="text-[#F4F27A] font-semibold tracking-wide">🎨 Calling All Artists</p>
          <h1 className="text-4xl font-bold leading-[1.25] md:text-5xl md:leading-none">
            Join the Art Supply Tracker Artist Beta
          </h1>
          <p className="max-w-xl text-lg text-[#DCC7FF]">
            A studio assistant built by an artist, for artists. Track supplies,
            projects, notes, and creative workflows so you can spend less time
            searching and more time creating.
          </p>
          <p className="text-sm text-[#DCC7FF]">
            After creating your account, please check your spam folder if you
            don&apos;t receive your confirmation email within a few minutes.
          </p>
        </section>

        {/* Artist Opportunities badge — the live grid's top-right cell (the
         * live's computed shadow parts are all transparent — no shadow). */}
        <div className="rounded-2xl border border-[#5B3FD3]/50 bg-[#120724]/80 px-4 py-3 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#DCC7FF]">
            Artist Opportunities
          </p>
          <a
            href="https://artdeadline.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex justify-center"
          >
            <Image
              src="/assets/listed-with-ADC2.jpg"
              alt="Listed with ArtDeadline.Com"
              width={280}
              height={80}
              className="h-auto max-h-20 w-auto"
            />
          </a>
        </div>

        {/* Auth card — the live app's Amplify authenticator chrome: sharp
         * corners, 1px #5B3FD3 border, solid #120724 surface, the soft
         * Amplify shadow, zero card padding (the form carries it). */}
        <section className="w-full" aria-label="Account access">
          {/* r27: below md the live's reset EMAIL view sizes its card to
           * the content (307px at 390 — the h3 "Reset Password" at 32px
           * drives the max-content) and centers it; every other view (and
           * md+ everywhere) renders the card full-width. The twin copies
           * disagree on the reset email view — the single copy renders
           * both behaviors with w-fit md:w-full. The mobile cap 357 is
           * the live's own content-driven card width (see the fidelity
           * pin for the 0.5px-centering measurement record). */}
          <div
            className={`mx-auto max-w-[357px] md:max-w-[480px] border border-[#5B3FD3] bg-[#120724] shadow-[0_2px_6px_rgba(13,26,38,0.15)] pb-3 ${
              mode === "reset" ? "w-fit md:w-full" : "w-full"
            }`}
          >
            {mode !== "reset" && mode !== "reset-confirm" ? (
              <>
                <div
                  role="tablist"
                  aria-label="Account access"
                  className="flex"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "signin"}
                    onClick={() => {
                      setMode("signin");
                      clearValidation();
                    }}
                    className={`flex h-[50px] flex-1 items-center justify-center border-t-2 text-base font-bold ${
                      mode === "signin"
                        ? "border-[#2ec4b6] text-[#047d95] transition-none duration-[250ms] ease-[ease]"
                        : "border-[#dcdee0] text-[#304050] hover:text-[#3f5266] transition-all duration-[250ms] ease-[ease]"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "signup"}
                    onClick={() => {
                      setMode("signup");
                      clearValidation();
                    }}
                    className={`flex h-[50px] flex-1 items-center justify-center border-t-2 text-base font-bold ${
                      mode === "signup"
                        ? "border-[#2ec4b6] text-[#047d95] transition-none duration-[250ms] ease-[ease]"
                        : "border-[#dcdee0] text-[#304050] hover:text-[#3f5266] transition-all duration-[250ms] ease-[ease]"
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                <form onSubmit={onSubmit} className="mt-3 space-y-4 px-8 pt-8 pb-8">
                  <div>
                    <label htmlFor="email" className={labelClasses}>
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your Email"
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className={labelClasses}>
                      Password
                    </label>
                    <div className="flex items-center">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete={mode === "signin" ? "current-password" : "new-password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => { if (mode !== "signin") setPwTouched(true); }}
                        placeholder="Enter your Password"
                        className={`${passwordInputClasses} min-w-0 flex-1`}
                      />
                      {renderEyeToggle(showPassword, () => setShowPassword((v) => !v))}
                    </div>
                  </div>

                  {/* The live's Cognito policy stack: every violated rule as
                   * its own contiguous 24px line, directly under the Password
                   * field (measured on the live: no vertical gaps). Rendered
                   * pre-submission once the pw has blurred (r25) and on the
                   * submit path (a submit touches every field). */}
                  {mode === "signup" && showPolicyStack && (
                    <div>
                      {policyViolations.map((message) => (
                        <p key={message} className="text-base text-[#660000]">
                          {message}
                        </p>
                      ))}
                    </div>
                  )}

                  {mode === "signup" && (
                    <div>
                      <label htmlFor="confirmPassword" className={labelClasses}>
                        Confirm Password
                      </label>
                      <div className="flex items-center">
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onBlur={() => setConfirmTouched(true)}
                          placeholder="Please confirm your Password"
                          className={`${passwordInputClasses} min-w-0 flex-1`}
                        />
                        {renderEyeToggle(
                          showConfirmPassword,
                          () => setShowConfirmPassword((v) => !v),
                        )}
                      </div>
                    </div>
                  )}

                  {/* The live's confirmation mismatch line (client-side,
                   * inline — never in the alert box; rendered pre-submission
                   * once the confirm has blurred, r25). */}
                  {mode === "signup" && showMismatch && (
                    <p className="text-base text-[#660000]">
                      Your passwords must match
                    </p>
                  )}

                  {/* Server auth errors render in the live's Amplify alert
                   * box (bad credentials, duplicate email). */}
                  {error && (
                    <AmplifyAlert message={error} onDismiss={() => setError(null)} />
                  )}

                  <button
                    type="submit"
                    disabled={signupSubmitDisabled}
                    className="h-[42px] w-full rounded-[4px] bg-[#FE5FA7] px-4 text-base font-bold text-white ast-amplify-button transition-all duration-[250ms] ease-[ease] hover:bg-[#fe77b6] disabled:bg-[#EFF0F0] disabled:text-[#89949F] disabled:cursor-not-allowed disabled:hover:bg-[#EFF0F0]"
                  >
                    {mode === "signin" ? "Sign in" : "Create Account"}
                  </button>

                  {mode === "signin" && (
                    <div className="flex w-full justify-center pb-4">
                      <button
                        type="button"
                        onClick={() => {
                          clearValidation();
                          setMode("reset");
                        }}
                        className="flex h-[35px] items-center justify-center border border-transparent px-3 text-sm font-bold text-[#047d95] ast-amplify-button transition-all duration-[250ms] ease-[ease]"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  )}
                </form>
              </>
            ) : mode === "reset" ? (
              <form onSubmit={onResetSubmit} className="space-y-4 p-8">
                {/* The live's Amplify heading renders #0d1a26 on the
                 * #120724 card — dark on dark, an authentic quirk kept
                 * deliberately (do not "fix" the contrast). */}
                <h3 className="text-[32px] font-medium leading-tight text-[#0d1a26]">
                  Reset Password
                </h3>
                <div>
                  <label htmlFor="reset-email" className={labelClasses}>
                    Enter your email
                  </label>
                  <input
                    id="reset-email"
                    name="reset-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className={inputClasses}
                  />
                </div>

                <button
                  type="submit"
                  className="h-[42px] w-full rounded-[4px] bg-[#FE5FA7] px-4 text-base font-bold text-white ast-amplify-button transition-all duration-[250ms] ease-[ease] hover:bg-[#fe77b6]"
                >
                  Send code
                </button>

                <div className="flex w-full justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      clearValidation();
                      setMode("signin");
                    }}
                    className="flex h-[35px] items-center justify-center border border-transparent px-3 text-sm font-bold text-[#047d95] ast-amplify-button transition-all duration-[250ms] ease-[ease]"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={onResetConfirmSubmit} className="space-y-4 p-8">
                {/* The live's confirmation view (after "Send code" with a
                 * valid email): Code + New Password + Confirm + Submit +
                 * Resend Code — same dark-on-dark heading quirk. */}
                <h3 className="text-[32px] font-medium leading-tight text-[#0d1a26]">
                  Reset Password
                </h3>
                <div>
                  <label htmlFor="reset-code" className={labelClasses}>
                    Code *
                  </label>
                  <input
                    id="reset-code"
                    name="reset-code"
                    type="text"
                    required
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label htmlFor="new-password" className={labelClasses}>
                    New Password
                  </label>
                  <div className="flex items-center">
                    <input
                      id="new-password"
                      name="new-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setPwTouched(true)}
                      className={`${passwordInputClasses} min-w-0 flex-1`}
                    />
                    {renderEyeToggle(showPassword, () => setShowPassword((v) => !v))}
                  </div>
                </div>

                {showPolicyStack && (
                  <div>
                    {policyViolations.map((message) => (
                      <p key={message} className="text-base text-[#660000]">
                        {message}
                      </p>
                    ))}
                  </div>
                )}

                <div>
                  <label htmlFor="confirm-password" className={labelClasses}>
                    Confirm Password
                  </label>
                  <div className="flex items-center">
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => setConfirmTouched(true)}
                      className={`${passwordInputClasses} min-w-0 flex-1`}
                    />
                    {renderEyeToggle(
                      showConfirmPassword,
                      () => setShowConfirmPassword((v) => !v),
                    )}
                  </div>
                </div>

                {showMismatch && (
                  <p className="text-base text-[#660000]">
                    Your passwords must match
                  </p>
                )}

                {error && (
                  <AmplifyAlert message={error} onDismiss={() => setError(null)} />
                )}

                <button
                  type="submit"
                  className="h-[42px] w-full rounded-[4px] bg-[#FE5FA7] px-4 text-base font-bold text-white ast-amplify-button transition-all duration-[250ms] ease-[ease] hover:bg-[#fe77b6]"
                >
                  Submit
                </button>

                {/* The live's code-redelivery link — a silent no-op here (no
                 * mailer, ADR-003), exactly like the deployed app's
                 * "Resend Code" click with nothing observable changing. */}
                <div className="flex w-full justify-center">
                  <button
                    type="button"
                    onClick={() => {}}
                    className="flex h-[35px] items-center justify-center border border-transparent px-3 text-sm font-bold text-[#047d95] ast-amplify-button transition-all duration-[250ms] ease-[ease]"
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
