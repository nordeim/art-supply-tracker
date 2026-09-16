/**
 * Session auth — scrypt password hashing + opaque session tokens.
 *
 * Design notes (why not NextAuth): the original app is an Amplify/Cognito SPA;
 * this clone only needs email+password with a sign-out, so a session table +
 * httpOnly cookie is the smallest correct surface. Passwords are hashed with
 * Node's built-in scrypt (N=16384 default cost) and a per-user random salt —
 * no third-party crypto dependency to vet. Sessions are opaque 256-bit random
 * tokens (not JWTs) so they can be revoked server-side on sign-out.
 */
import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { db } from "@/lib/db";

export const SESSION_COOKIE = "ast_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  lastWorkedOn: string;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, expected] = parts;
  const derived = scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expected, "hex");
  if (expectedBuf.length !== derived.length) return false;
  return timingSafeEqual(derived, expectedBuf);
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({ data: { token, userId, expiresAt } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    // Best-effort row delete; cookie clearing below is the real logout.
    await db.session.deleteMany({ where: { token } }).catch(() => null);
  }
  jar.delete(SESSION_COOKIE);
}

/** Resolve the signed-in user from the session cookie, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findFirst({
    where: { token, expiresAt: { gt: new Date() } },
    include: { user: true },
  });
  if (!session) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    displayName: session.user.displayName,
    lastWorkedOn: session.user.lastWorkedOn,
  };
}

/** Action-guard: returns the user or null (callers map to UNAUTHORIZED). */
export async function requireUser(): Promise<SessionUser | null> {
  return getCurrentUser();
}
