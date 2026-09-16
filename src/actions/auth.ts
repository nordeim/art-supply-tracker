"use server";

/**
 * Auth actions — sign in / create account / sign out.
 *
 * Contract: every action returns ActionResult<T>; nothing throws across the
 * boundary. Unexpected errors are logged with context and flattened to a safe
 * INTERNAL error for the client.
 */
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
import { signInSchema, signUpSchema } from "@/lib/validation";

export async function signInAction(
  input: unknown,
): Promise<ActionResult<{ email: string; displayName: string }>> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid email or password.");
  }
  const { email, password } = parsed.data;

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
