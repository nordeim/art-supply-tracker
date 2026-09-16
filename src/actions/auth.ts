"use server";

/**
 * Auth actions — sign in / create account / sign out.
 *
 * Contract: every action returns ActionResult<T>; nothing throws across the
 * boundary. Unexpected errors are logged with context and flattened to a safe
 * INTERNAL error for the client. Sign-in is throttled per client IP by the
 * in-memory fixed-window limiter (the PAD §10 credential-stuffing
 * mitigation); the throttle is per-process, which matches the app's
 * single-process deployment contract.
 */
import { headers } from "next/headers";

import { db } from "@/lib/db";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import {
  internalError,
  validationError,
  type ActionResult,
} from "@/lib/result";
import { consumeRateLimit } from "@/lib/rate-limit";
import { signInSchema, signUpSchema } from "@/lib/validation";

const SIGN_IN_RATE_LIMIT = { limit: 5, windowMs: 60_000 };

/** Best-effort client IP from proxy headers; "local" when no proxy is set. */
async function clientIp(): Promise<string> {
  try {
    const store = await headers();
    const forwarded = store.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0]?.trim() || "local";
    return store.get("x-real-ip") ?? "local";
  } catch {
    return "local";
  }
}

/** Prisma's unique-constraint violation code (email already registered). */
function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export async function signInAction(
  input: unknown,
): Promise<ActionResult<{ email: string; displayName: string }>> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid email or password.");
  }
  const { email, password } = parsed.data;

  const throttle = consumeRateLimit(`signin:${await clientIp()}`, SIGN_IN_RATE_LIMIT);
  if (!throttle.allowed) {
    return validationError("Too many sign-in attempts. Please wait a minute and try again.");
  }

  try {
    const user = await db.user.findUnique({ where: { email } });
    // Uniform error for unknown email and wrong password — no account probing.
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return validationError("Incorrect email or password.");
    }
    await createSession(user.id);
    return { ok: true, data: { email: user.email, displayName: user.displayName } };
  } catch (error) {
    console.error("[auth:signIn] failed", { email: email.slice(0, 3) + "***", error });
    return internalError();
  }
}

export async function signUpAction(
  input: unknown,
): Promise<ActionResult<{ email: string; displayName: string }>> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Please check the form and try again.");
  }
  const { email, password, displayName } = parsed.data;

  try {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return validationError("An account with this email already exists. Try signing in.");
    }
    const user = await db.user.create({
      data: {
        email,
        displayName,
        passwordHash: hashPassword(password),
        lastWorkedOn: "Watercolor Botanicals",
      },
    });
    await createSession(user.id);
    return { ok: true, data: { email: user.email, displayName: user.displayName } };
  } catch (error) {
    // Two concurrent sign-ups with the same email race past the findUnique
    // check; surface the friendly duplicate-account copy, not an INTERNAL.
    if (isUniqueConstraintViolation(error)) {
      return validationError("An account with this email already exists. Try signing in.");
    }
    console.error("[auth:signUp] failed", { email: email.slice(0, 3) + "***", error });
    return internalError();
  }
}

export async function signOutAction(): Promise<ActionResult<true>> {
  try {
    await destroySession();
    return { ok: true, data: true };
  } catch (error) {
    console.error("[auth:signOut] failed", { error });
    return internalError();
  }
}
