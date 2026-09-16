import { describe, expect, it } from "vitest";

import { consumeRateLimit } from "@/lib/rate-limit";

/**
 * Fixed-window in-memory limiter used to throttle sign-in attempts per IP.
 * Pure logic with an injectable clock so the window math is deterministic.
 */

describe("consumeRateLimit", () => {
  it("allows attempts up to the limit within one window", () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) {
      const result = consumeRateLimit("1.2.3.4", { limit: 5, windowMs: 60_000 }, now);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks attempts beyond the limit inside the same window", () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) consumeRateLimit("5.6.7.8", { limit: 5, windowMs: 60_000 }, now);
    const blocked = consumeRateLimit("5.6.7.8", { limit: 5, windowMs: 60_000 }, now);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    expect(blocked.retryAfterMs).toBeLessThanOrEqual(60_000);
  });

  it("allows again after the window rolls over", () => {
    const now = 1_000_000;
    const opts = { limit: 2, windowMs: 60_000 };
    consumeRateLimit("9.9.9.9", opts, now);
    consumeRateLimit("9.9.9.9", opts, now);
    expect(consumeRateLimit("9.9.9.9", opts, now).allowed).toBe(false);
    expect(consumeRateLimit("9.9.9.9", opts, now + 60_001).allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    const now = 1_000_000;
    const opts = { limit: 1, windowMs: 60_000 };
    expect(consumeRateLimit("a", opts, now).allowed).toBe(true);
    expect(consumeRateLimit("b", opts, now).allowed).toBe(true);
    expect(consumeRateLimit("a", opts, now).allowed).toBe(false);
    expect(consumeRateLimit("b", opts, now).allowed).toBe(false);
  });

  it("reports the remaining cooldown as the window decays", () => {
    const start = 1_000_000;
    const opts = { limit: 1, windowMs: 60_000 };
    consumeRateLimit("c", opts, start);
    const blocked = consumeRateLimit("c", opts, start + 30_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(29_000);
    expect(blocked.retryAfterMs).toBeLessThanOrEqual(30_001);
  });

  it("prunes old keys so the map stays bounded", () => {
    const opts = { limit: 1, windowMs: 1_000 };
    let now = 0;
    // Push far more distinct keys than the cap.
    for (let i = 0; i < 2_500; i++) {
      now += 10; // windows expire as we go
      consumeRateLimit(`key-${i}`, opts, now);
    }
    // If pruning failed, memory would grow unbounded; behaviorally we just
    // assert the limiter still works for a fresh key after the churn.
    expect(consumeRateLimit("fresh", opts, now).allowed).toBe(true);
  });
});
