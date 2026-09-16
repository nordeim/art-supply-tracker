/**
 * Fixed-window in-memory rate limiter.
 *
 * Used to throttle sign-in attempts per client IP (the PAD §10
 * credential-stuffing mitigation). In-memory is the right scope for a
 * single-process SQLite app: no infrastructure, and a restart merely
 * resets the throttle. The clock is injectable so the window math is
 * deterministic under test.
 *
 * Keys are bounded (MAX_KEYS): on overflow, expired windows are pruned
 * first, then the oldest survivors are evicted — a churning attacker
 * cannot grow the map unboundedly.
 */

export interface RateLimitOptions {
  /** Attempts allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Present only when blocked: ms until the window resets. */
  retryAfterMs?: number;
}

const MAX_KEYS = 1_000;

interface WindowState {
  windowStart: number;
  count: number;
}

// Module-level store survives across requests in the same process.
const windows = new Map<string, WindowState>();

export function consumeRateLimit(
  key: string,
  options: RateLimitOptions,
  now: number = Date.now(),
): RateLimitResult {
  const { limit, windowMs } = options;
  const state = windows.get(key);

  if (!state || now - state.windowStart >= windowMs) {
    windows.set(key, { windowStart: now, count: 1 });
    pruneIfNeeded(now, windowMs);
    return { allowed: true };
  }

  if (state.count < limit) {
    state.count += 1;
    return { allowed: true };
  }

  return {
    allowed: false,
    retryAfterMs: state.windowStart + windowMs - now,
  };
}

function pruneIfNeeded(now: number, currentWindowMs: number) {
  if (windows.size <= MAX_KEYS) return;

  // Drop expired windows first (relative to the longest plausible window:
  // the current caller's).
  for (const [key, state] of windows) {
    if (now - state.windowStart >= currentWindowMs) windows.delete(key);
  }

  // Still over the cap? Evict the oldest window starts until bounded.
  if (windows.size > MAX_KEYS) {
    const ordered = [...windows.entries()].sort(
      (a, b) => a[1].windowStart - b[1].windowStart,
    );
    const excess = windows.size - MAX_KEYS;
    for (let i = 0; i < excess; i++) {
      const entry = ordered[i];
      if (entry) windows.delete(entry[0]);
    }
  }
}

/** Test helper: clear all tracked windows. */
export function resetRateLimiter(): void {
  windows.clear();
}
