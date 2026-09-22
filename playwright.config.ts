import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config (the Playwright half of the testing contract; see AGENTS.md).
 *
 * The suite drives the golden paths against a running app — the dev server
 * by default (`bun run dev`, which pins DATABASE_URL to the repo-root
 * db/custom.db via scripts/prisma-url.ts — r16), or any server reachable at
 * E2E_BASE_URL (e.g. the standalone production build on :3100):
 *
 *   bun run build && E2E_PORT=3100 bun .next/standalone/server.js &
 *   E2E_BASE_URL=http://127.0.0.1:3100 bun run test:e2e
 *
 * Prerequisites: `bun run db:push && bun run db:seed` (the demo account the
 * specs sign in with — demo@artsupplytracker.com / StudioDemo2026!).
 *
 * Serial, single-worker, one browser: the app is a single route over one
 * shared SQLite file — parallel contexts would race the same studio state.
 * Specs clean up every row they create (the smoke-suite discipline), so the
 * studio stays pristine for the next run.
 */
const PORT = Number(process.env.E2E_PORT ?? 3000);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // One UI sign-in per run, saved as a storageState — the sign-in rate
    // limiter (5 attempts/IP/minute, a pinned contract) makes per-test
    // sign-ins self-throttling. Auth specs opt OUT per-describe with an
    // empty storageState to exercise the logged-out surface.
    {
      name: "setup",
      testMatch: /setup\.spec\.ts/,
    },
    {
      name: "chromium",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1536, height: 844 },
        storageState: "e2e/.auth/user.json",
      },
      // setup.spec.ts belongs to the setup project ONLY — a second run here
      // would start from the saved storageState and fail on the signed-in
      // page. mobile-navigation runs in its own mobile viewport project.
      testIgnore: [/mobile-navigation\.spec\.ts/, /setup\.spec\.ts/],
    },
    {
      // The mobile drawer contract (r10/r15 pins) verified at the live's
      // mobile viewport — the same 390×844 the parity captures use.
      name: "mobile-chromium",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        storageState: "e2e/.auth/user.json",
      },
      testMatch: /mobile-navigation\.spec\.ts/,
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `bun run dev`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
