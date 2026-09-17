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
 * - Submit: 42px, 16px/700 #FE5FA7. Errors render in the live's #660000
 *   at 16px with the exact Amplify copy ("Incorrect username or
 *   password.", "Your passwords must match").
 * - Create Account asks Email / Password / Confirm Password (the live's
 *   Cognito form — no display name; the action derives it from the email
 *   local part).
 * - "Forgot your password?" swaps the card to the live's Reset Password
 *   view (32px/500 #0d1a26 heading — the live's dark-on-dark quirk —
 *   "Enter your email" label, pink "Send code", teal "Back to Sign In",
 *   tabs hidden). This deployment has no mailer (ADR-003), so Send code
 *   surfaces the support notice instead of emailing a code.
 *
 * Submits through Server Actions and refreshes the route on success so the
 * server component re-renders with the session cookie present.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

import { signInAction, signUpAction } from "@/actions/auth";
import type { ActionResult } from "@/lib/result";

type Mode = "signin" | "signup" | "reset";

const inputClasses =
  "h-[42px] w-full rounded-[4px] border border-[#89949f] bg-transparent px-3 text-sm text-[#0d1a26] placeholder:text-[#9ca3af] focus:border-[#047d95] focus:outline-none focus:ring-2 focus:ring-[#047d95]/30";
/** The password variant: the live's Amplify input group rounds the input's
 * LEFT corners only (`4px 0px 0px 4px`) — the 50px eye toggle continues the
 * group's #89949f border and rounds the right side. */
const passwordInputClasses =
  "h-[42px] w-full rounded-l-[4px] border border-[#89949f] bg-transparent px-3 text-sm text-[#0d1a26] placeholder:text-[#9ca3af] focus:border-[#047d95] focus:outline-none focus:ring-2 focus:ring-[#047d95]/30";
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
  const [pending, startTransition] = useTransition();

  function handleResult(result: ActionResult<{ email: string; displayName: string }>) {
    if (result.ok) {
      // Re-render the server component with the fresh session cookie.
      router.refresh();
      return;
    }
    setError(result.error.message);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (mode === "signin") {
      startTransition(async () => {
        handleResult(await signInAction({ email, password }));
      });
      return;
    }
    if (password !== confirmPassword) {
      // The live app's Amplify copy for a mismatched confirmation.
      setError("Your passwords must match");
      return;
    }
    startTransition(async () => {
      handleResult(await signUpAction({ email, password }));
    });
  }

  function onResetSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    // No mailer exists on this deployment (ADR-003) — the live app would
    // email a confirmation code here; surface the support path instead.
    setError(
      "Password reset is not configured for this deployment — email support@artsupplytracker.com from your account address.",
    );
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
        aria-label={shown ? "Hide password" : "Show password"}
        className="flex h-[42px] w-[50px] shrink-0 items-center justify-center rounded-r-[4px] border-y border-r border-[#89949f] text-[#0d1a26] transition hover:text-[#c5cdd6]"
      >
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
      <div className="w-full max-w-5xl grid gap-8 md:grid-cols-[1fr_420px] items-center studio-fade">
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
          <div className="mx-auto w-full max-w-[480px] border border-[#5B3FD3] bg-[#120724] shadow-[0_2px_6px_rgba(13,26,38,0.15)] pb-3">
            {mode !== "reset" ? (
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
                      setError(null);
                    }}
                    className={`flex h-[50px] flex-1 items-center justify-center border-t-2 text-base font-bold transition ${
                      mode === "signin"
                        ? "border-[#2ec4b6] text-[#047d95]"
                        : "border-[#dcdee0] text-[#304050] hover:text-[#3f5266]"
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
                      setError(null);
                    }}
                    className={`flex h-[50px] flex-1 items-center justify-center border-t-2 text-base font-bold transition ${
                      mode === "signup"
                        ? "border-[#2ec4b6] text-[#047d95]"
                        : "border-[#dcdee0] text-[#304050] hover:text-[#3f5266]"
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                <form onSubmit={onSubmit} noValidate className="mt-3 space-y-4 px-8 pt-8 pb-8">
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
                      maxLength={254}
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
                        minLength={8}
                        maxLength={128}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your Password"
                        className={`${passwordInputClasses} min-w-0 flex-1`}
                      />
                      {renderEyeToggle(showPassword, () => setShowPassword((v) => !v))}
                    </div>
                  </div>

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
                          maxLength={128}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
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

                  {error && (
                    <p role="alert" className="text-base text-[#660000]">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={pending}
                    className="h-[42px] w-full rounded-[4px] bg-[#FE5FA7] px-4 text-base font-bold text-white transition hover:bg-[#fe77b6] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pending
                      ? mode === "signin"
                        ? "Signing in…"
                        : "Creating account…"
                      : mode === "signin"
                        ? "Sign in"
                        : "Create Account"}
                  </button>

                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setMode("reset");
                      }}
                      className="flex h-[51px] w-full items-center justify-center text-sm font-bold text-[#047d95]"
                    >
                      Forgot your password?
                    </button>
                  )}
                </form>
              </>
            ) : (
              <form onSubmit={onResetSubmit} noValidate className="space-y-4 px-8 pt-8 pb-5">
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
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className={inputClasses}
                  />
                </div>

                {error && (
                  <p role="alert" className="text-base text-[#660000]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="h-[42px] w-full rounded-[4px] bg-[#FE5FA7] px-4 text-base font-bold text-white transition hover:bg-[#fe77b6]"
                >
                  Send code
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode("signin");
                  }}
                  className="flex h-[35px] w-full items-center justify-center text-sm font-bold text-[#047d95]"
                >
                  Back to Sign In
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
