import { expect, test } from "@playwright/test";

import { DEMO_EMAIL, signIn } from "./helpers";

/**
 * The auth gate — the Amplify login chrome (r8/r9 pins) plus the sign-in /
 * sign-out round-trip. Server errors render in the pale-pink dismissible
 * Amplify alert box (role=alert); client validation stays inline.
 *
 * These specs exercise the LOGGED-OUT surface: an empty storageState opts
 * them out of the shared authenticated session.
 */
test.describe("auth", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("login screen renders the Amplify chrome", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Join the Art Supply Tracker Artist Beta" }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: "Sign In" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tab", { name: "Create Account" })).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveAttribute("required");
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("required");
    await expect(page.getByRole("switch", { name: "Show password" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Forgot your password?" })).toBeVisible();
  });

  test("bad credentials render the Amplify alert box", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Email").fill(DEMO_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill("WrongPassword1!");
    await page.getByRole("button", { name: "Sign in" }).click();
    // Next's route announcer also carries role=alert — scope to the login
    // card's Account access region so the assertion names the Amplify box.
    const alert = page
      .getByRole("region", { name: "Account access" })
      .getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Incorrect username or password.");
    // The alert is dismissible and restores the no-error layout.
    await page.getByRole("button", { name: "Dismiss alert" }).click();
    await expect(alert).not.toBeVisible();
  });

  test("demo sign-in reaches the dashboard and sign-out returns to login", async ({ page }) => {
    await signIn(page);
    await expect(page.getByRole("heading", { name: "Today in the Studio" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign Out" })).toBeVisible();

    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(
      page.getByRole("heading", { name: "Join the Art Supply Tracker Artist Beta" }),
    ).toBeVisible();
  });

  test("the header shows the demo account's email and the memory button", async ({ page }) => {
    await signIn(page);
    await expect(page.getByText(DEMO_EMAIL)).toBeVisible();
    await expect(page.getByRole("button", { name: "✧ What was I working on?" })).toBeVisible();
  });
});
