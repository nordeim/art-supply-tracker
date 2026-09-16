/**
 * ActionResult — the single Server Action return contract.
 *
 * Server Actions must never throw across the client boundary: an unhandled
 * throw surfaces as an opaque opaque "Internal Server Error" digest in the
 * browser. Every action returns a discriminated union instead, and unexpected
 * failures are logged server-side with context before being flattened to a
 * safe `INTERNAL` code (operator detail never reaches the client DOM).
 */
export type ActionError =
  | { code: "VALIDATION"; message: string }
  | { code: "UNAUTHORIZED"; message: string }
  | { code: "NOT_FOUND"; message: string }
  | { code: "CONFLICT"; message: string }
  | { code: "INTERNAL"; message: string };

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };

export function validationError(message: string): ActionResult<never> {
  return { ok: false, error: { code: "VALIDATION", message } };
}

export function unauthorized(
  message = "Please sign in again.",
): ActionResult<never> {
  return { ok: false, error: { code: "UNAUTHORIZED", message } };
}

export function notFound(message = "Not found."): ActionResult<never> {
  return { ok: false, error: { code: "NOT_FOUND", message } };
}

export function internalError(): ActionResult<never> {
  // Customer-safe copy — operator context goes to the server log only.
  return { ok: false, error: { code: "INTERNAL", message: "Something went wrong. Please try again." } };
}
