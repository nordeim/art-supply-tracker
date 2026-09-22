import { expect, test } from "@playwright/test";

import { DEMO_EMAIL, DEMO_PASSWORD } from "./helpers";

/**
 * The storageState setup — signs in ONCE per run through the real UI and
 * saves the session cookie for the dependent projects. The sign-in rate
 * limiter (5 attempts/IP/minute) is a pinned contract: per-test sign-ins
 * would throttle the suite.
 */
test("authenticate", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Join the Art Supply Tracker Artist Beta" }),
  ).toBeVisible();
  await page.getByLabel("Email").fill(DEMO_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Today in the Studio" })).toBeVisible();

  await page.context().storageState({ path: "e2e/.auth/user.json" });
});
