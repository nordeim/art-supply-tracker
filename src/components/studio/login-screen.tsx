"use client";

/**
 * Login screen — faithful clone of the live "Join the Art Supply Tracker
 * Artist Beta" gate: marketing column + the live app's AWS-Amplify-styled
 * auth card (sharp-cornered #120724 card with a 1px #5B3FD3 border,
 * text-only tabs — active #047d95 / inactive #304050 — 4px-radius inputs
 * with grey #89949b borders, the #FE5FA7 primary button, and the eye-icon
 * password toggle rendered as a switch). Submits through Server Actions
 * and refreshes the route on success so the server component re-renders
 * with the session cookie present. All chrome values were measured against
 * the deployed Amplify UI on 2026-09-17 (computed styles + pixel sampling).
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

import { signInAction, signUpAction } from "@/actions/auth";
import type { ActionResult } from "@/lib/result";

type Mode = "signin" | "signup";

export function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
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
    setNotice(null);

    if (mode === "signin") {
      startTransition(async () => {
        handleResult(await signInAction({ email, password }));
      });
    } else {
      if (!displayName.trim()) {
        setError("Display name is required.");
        return;
      }
      startTransition(async () => {
        handleResult(await signUpAction({ email, password, displayName }));
      });
    }
  }

  return (
    <main className="min-h-screen bg-[#050009] text-[#F7F2FF] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid gap-8 md:grid-cols-[1fr_420px] items-center studio-fade">
        {/* Marketing column */}
        <section>
          <p className="text-[#F4F27A] font-semibold tracking-wide">🎨 Calling All Artists</p>
          <h1 className="mt-3 text-4xl md:text-5xl font-bold leading-tight">
            Join the Art Supply Tracker Artist Beta
          </h1>
          <p className="mt-4 text-lg text-[#DCC7FF] max-w-xl">
            A studio assistant built by an artist, for artists. Track supplies,
            projects, notes, and creative workflows so you can spend less time
            searching and more time creating.
          </p>
          <p className="mt-4 text-sm text-[#DCC7FF]">
            After creating your account, please check your spam folder if you
            don&apos;t receive your confirmation email within a few minutes.
          </p>
        </section>

        {/* Artist Opportunities badge — the live grid's top-right cell. */}
        <div className="rounded-2xl border border-[#5B3FD3]/50 bg-[#120724]/80 px-4 py-3 text-center shadow-lg">
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
         * corners, 1px #5B3FD3 border, solid #120724 surface (no blur). */}
        <section className="w-full" aria-label="Account access">
          <div className="w-full max-w-[480px] border border-[#5B3FD3] bg-[#120724] p-6">
            <div
              role="tablist"
              aria-label="Account access"
              className="mb-6 flex"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signin"}
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
                className={`px-4 py-3 text-sm font-bold transition ${
                  mode === "signin"
                    ? "text-[#047d95]"
                    : "text-[#304050] hover:text-[#3f5266]"
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
                className={`px-4 py-3 text-sm font-bold transition ${
                  mode === "signup"
                    ? "text-[#047d95]"
                    : "text-[#304050] hover:text-[#3f5266]"
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={onSubmit} noValidate className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label
                    htmlFor="displayName"
                    className="mb-1.5 block text-base font-normal text-[#304050]"
                  >
                    Display name
                  </label>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    autoComplete="name"
                    required
                    maxLength={60}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your artist name"
                    className="h-[42px] w-full rounded-[4px] border border-[#89949b] bg-transparent px-3 text-sm text-[#F7F2FF] placeholder:text-[#89949b]/70 focus:border-[#047d95] focus:outline-none focus:ring-2 focus:ring-[#047d95]/30"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-base font-normal text-[#304050]"
                >
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
                  className="h-[42px] w-full rounded-[4px] border border-[#89949b] bg-transparent px-3 text-sm text-[#F7F2FF] placeholder:text-[#89949b]/70 focus:border-[#047d95] focus:outline-none focus:ring-2 focus:ring-[#047d95]/30"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-base font-normal text-[#304050]"
                >
                  Password
                </label>
                <div className="relative">
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
                    className="h-[42px] w-full rounded-[4px] border border-[#89949b] bg-transparent px-3 pr-12 text-sm text-[#F7F2FF] placeholder:text-[#89949b]/70 focus:border-[#047d95] focus:outline-none focus:ring-2 focus:ring-[#047d95]/30"
                  />
                  {/* The live app's Amplify show-password control: an eye
                   * icon announced as a switch with checked state. */}
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    role="switch"
                    aria-checked={showPassword}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[#89949b] transition hover:text-[#c5cdd6]"
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <Eye aria-hidden="true" className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p role="alert" className="text-sm text-ast-coral">
                  {error}
                </p>
              )}
              {notice && (
                <p role="status" className="text-sm text-ast-turquoise">
                  {notice}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="h-[42px] w-full rounded-[4px] bg-[#FE5FA7] px-4 text-sm font-semibold text-white transition hover:bg-[#fe77b6] disabled:opacity-60 disabled:cursor-not-allowed"
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
                  onClick={() =>
                    setNotice(
                      "Password reset is handled by the studio team — email support@artsupplytracker.com from your account address.",
                    )
                  }
                  className="w-full text-center text-sm text-[#047d95] underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </button>
              )}
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
