import { expect, test } from "@playwright/test";

/**
 * The sign-up pre-submission validation state machine (r25) — the live's
 * blur-gated behavior, measured keystroke-level on the deployed Amplify
 * form 2026-09-24:
 *
 * - Pristine forms render NOTHING regardless of content; the submit stays
 *   enabled (typing a weak password without blurring shows no stack).
 * - The PASSWORD field's first blur renders the Cognito policy stack and
 *   disables the submit (gray chrome); every later keystroke live-updates
 *   the stack (strengthening the pw clears it and re-enables).
 * - The CONFIRM field's first blur renders the mismatch line when the
 *   values differ (including an emptied confirm) — also disabling.
 * - The sign-IN form has NO pre-submission validation (weak content, blur,
 *   nothing renders).
 *
 * Zero auth requests are made in this spec — every state is client-side,
 * so the sign-in rate-limiter budget (a pinned contract) is untouched.
 * The final state never submits valid data, so no account is created.
 */
test.describe("signup pre-submission validation", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("pristine form renders nothing; pw blur engages the stack and disables the submit", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Create Account" }).click();
    const submit = page.getByRole("button", { name: "Create Account", exact: true });

    // Pristine: weak content, no blur yet — nothing renders, button enabled.
    await page.getByLabel("Email").fill("probe@example.com");
    await page.getByLabel("Password", { exact: true }).click();
    await page.keyboard.type("abc");
    await expect(
      page.getByText("Password must have at least 8 characters"),
    ).toBeHidden();
    await expect(submit).toBeEnabled();

    // pw blur: the stack renders (all violated rules) and the submit flips
    // to the disabled gray chrome.
    await page.getByLabel("Email").click();
    await expect(
      page.getByText("Password must have at least 8 characters"),
    ).toBeVisible();
    await expect(
      page.getByText("Password must have upper case letters"),
    ).toBeVisible();
    await expect(submit).toBeDisabled();
    await expect(submit).toHaveCSS("cursor", "not-allowed");
    await expect(submit).toHaveCSS("background-color", "rgb(239, 240, 240)");
    await expect(submit).toHaveCSS("color", "rgb(137, 148, 159)");

    // A later keystroke live-updates the stack: strengthening the pw
    // clears every line and re-enables the submit (the live's revalidation).
    await page.getByLabel("Password", { exact: true }).fill("Abcdef123!");
    await expect(
      page.getByText("Password must have at least 8 characters"),
    ).toBeHidden();
    await expect(submit).toBeEnabled();
    await expect(submit).toHaveCSS("cursor", "pointer");
    await expect(submit).toHaveCSS("background-color", "rgb(254, 95, 167)");
  });

  test("confirm blur renders the mismatch line and disables; matching re-enables", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Create Account" }).click();
    const submit = page.getByRole("button", { name: "Create Account", exact: true });

    await page.getByLabel("Email").fill("probe@example.com");
    await page.getByLabel("Password", { exact: true }).fill("Abcdef123!");
    // pw blurred by the confirm click — valid, so nothing renders yet.
    await page.getByLabel("Confirm Password", { exact: true }).click();
    await expect(page.getByText("Your passwords must match")).toBeHidden();

    // confirm blur with differing values: the mismatch line renders and
    // the submit disables.
    await page.getByLabel("Email").click();
    await expect(page.getByText("Your passwords must match")).toBeVisible();
    await expect(submit).toBeDisabled();

    // Fixing the confirm live-clears the line and re-enables.
    await page.getByLabel("Confirm Password", { exact: true }).fill("Abcdef123!");
    await expect(page.getByText("Your passwords must match")).toBeHidden();
    await expect(submit).toBeEnabled();
  });

  test("the sign-in form has no pre-submission validation", async ({ page }) => {
    await page.goto("/");
    const submit = page.getByRole("button", { name: "Sign in", exact: true });
    await page.getByLabel("Email").fill("demo@artsupplytracker.com");
    await page.getByLabel("Password", { exact: true }).click();
    await page.keyboard.type("abc");
    await page.getByLabel("Email").click(); // blur — nothing may engage
    await expect(
      page.getByText("Password must have at least 8 characters"),
    ).toBeHidden();
    await expect(submit).toBeEnabled();
  });
});
