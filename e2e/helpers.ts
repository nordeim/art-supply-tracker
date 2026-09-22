import { expect, type Page } from "@playwright/test";

/**
 * Shared E2E helpers — sign-in and pristine-state guards. The specs use the
 * seeded demo account (README "Demo Account"); every created row is deleted
 * through the real UI (native confirm included), the smoke-suite discipline.
 */

export const DEMO_EMAIL = "demo@artsupplytracker.com";
export const DEMO_PASSWORD = "StudioDemo2026!";

export async function signIn(page: Page): Promise<void> {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Join the Art Supply Tracker Artist Beta" }),
  ).toBeVisible();
  await page.getByLabel("Email").fill(DEMO_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Today in the Studio" })).toBeVisible();
}

/** Open the studio with the shared storageState session (already signed in). */
export async function openStudio(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Today in the Studio" })).toBeVisible();
}

/** Accept the native confirm() the delete buttons trigger. */
export function acceptConfirms(page: Page): void {
  page.on("dialog", (dialog) => void dialog.accept());
}
