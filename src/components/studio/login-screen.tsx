"use client";

/**
 * Login screen — faithful clone of the live "Join the Art Supply Tracker
 * Artist Beta" gate: marketing column + auth card with Sign In / Create
 * Account tabs, show-password toggle, and the ArtDeadline listing badge.
 * Submits through Server Actions and refreshes the route on success so the
 * server component re-renders with the session cookie present.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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

        {/* Auth card */}
        <section className="w-full" aria-label="Account access">
          <div className="rounded-2xl border border-ast-lavender/30 bg-[#120724]/90 backdrop-blur-xl p-6 shadow-xl">
            <div
              role="tablist"
              aria-label="Account access"
              className="grid grid-cols-2 gap-1 mb-6 rounded-xl bg-[#0B0018] p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signin"}
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  mode === "signin"
                    ? "bg-ast-lavender/15 text-ast-cyan"
                    : "text-[#9f7fd6] hover:text-[#DCC7FF]"
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
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  mode === "signup"
                    ? "bg-ast-lavender/15 text-ast-cyan"
                    : "text-[#9f7fd6] hover:text-[#DCC7FF]"
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
                    className="block text-sm font-medium text-[#DCC7FF] mb-1.5"
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
                    className="w-full rounded-xl border border-ast-purple/40 bg-[#0B0018] px-3.5 py-2.5 text-sm text-[#F7F2FF] placeholder:text-[#9f7fd6] focus:border-ast-cyan/60 focus:outline-none focus:ring-2 focus:ring-ast-cyan/30"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[#DCC7FF] mb-1.5"
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
                  className="w-full rounded-xl border border-ast-purple/40 bg-[#0B0018] px-3.5 py-2.5 text-sm text-[#F7F2FF] placeholder:text-[#9f7fd6] focus:border-ast-cyan/60 focus:outline-none focus:ring-2 focus:ring-ast-cyan/30"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#DCC7FF] mb-1.5"
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
                    className="w-full rounded-xl border border-ast-purple/40 bg-[#0B0018] px-3.5 py-2.5 pr-12 text-sm text-[#F7F2FF] placeholder:text-[#9f7fd6] focus:border-ast-cyan/60 focus:outline-none focus:ring-2 focus:ring-ast-cyan/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-xs text-[#9f7fd6] hover:text-[#DCC7FF]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
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
                className="w-full rounded-xl bg-ast-pink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ast-pink/85 disabled:opacity-60 disabled:cursor-not-allowed"
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
                  className="w-full text-center text-sm text-[#9f7fd6] underline-offset-4 hover:text-ast-cyan hover:underline"
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
