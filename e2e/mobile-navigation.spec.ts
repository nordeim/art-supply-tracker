import { expect, test } from "@playwright/test";

import { openStudio } from "./helpers";

/**
 * The mobile navigation menu — the user-critical surface. Pins the live's
 * measured drawer contract (r10 drawer-scrim pins, r15 keyboard pins,
 * DOM-verified against the live app this session):
 *
 *   - the "☰ Studio Tools" toggle bar opens the left drawer (312px wide,
 *     z-50, slides in from x=-312)
 *   - ONE shared scrim dims the page: `fixed inset-0 z-40 bg-black/60
 *     md:hidden` — NO backdrop blur, BELOW the drawers, instant unmount
 *   - drawer navigation switches the view AND closes the drawer
 *   - the scrim click dismisses the drawer
 *   - the closed chat drawer carries `inert` (r5) and sits off-screen
 *   - Escape is a no-op on the drawers (the live ignores it)
 *   - the "Chat ☰" toggle opens the right drawer (312px at x=78)
 *
 * Runs in the mobile-chromium project (390×844) — the parity viewport.
 */

test.describe("mobile navigation", () => {
  test.beforeEach(async ({ page }) => {
    await openStudio(page);
  });

  test("the Studio Tools toggle opens the drawer with the shared scrim", async ({ page }) => {
    await page.getByRole("button", { name: "☰ Studio Tools" }).click();

    const drawer = page.locator('nav[aria-label="Studio tools"]');
    await expect(drawer).toBeVisible();
    // The drawer slides in over 0.3s — wait out the transition before
    // measuring geometry, else boundingBox catches it mid-flight.
    await page.waitForTimeout(450);
    const box = await drawer.boundingBox();
    expect(box?.width).toBe(312);
    expect(box?.x).toBe(0);

    // The scrim: one shared dim layer, no blur, below the drawer, and gone
    // from the DOM the moment the drawer closes (instant unmount, r10).
    const scrim = page.locator("div.fixed.inset-0.z-40.bg-black\\/60.md\\:hidden").first();
    await expect(scrim).toBeVisible();
    // bg-black/60 — Tailwind v4 emits color-mix, which Chromium serializes
    // as oklab(0 0 0 / 0.6); accept either spelling of the same 60% dim.
    await expect(scrim).toHaveCSS(
      "background-color",
      /rgba\(0, 0, 0, 0\.6\)|oklab\(0 0 0 \/ 0\.6\)/,
    );
    await expect(scrim).toHaveCSS("backdrop-filter", "none");
    await expect(scrim).toHaveCSS("z-index", "40");
  });

  test("drawer navigation switches the view and closes the drawer", async ({ page }) => {
    await page.getByRole("button", { name: "☰ Studio Tools" }).click();
    await page.getByRole("button", { name: /^Projects/ }).click();

    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
    // The drawer slides off-screen (0.3s transition) — wait out the
    // animation, then verify the geometry: x=-312 is fully hidden left.
    await page.waitForTimeout(450);
    const drawer = page.locator('nav[aria-label="Studio tools"]');
    const box = await drawer.boundingBox();
    expect(box?.x).toBe(-312);
    // The scrim unmounts with the drawer — instant, no fade.
    await expect(
      page.locator("div.fixed.inset-0.z-40.bg-black\\/60.md\\:hidden"),
    ).toHaveCount(0);
  });

  test("the scrim click dismisses the drawer without navigating", async ({ page }) => {
    await page.getByRole("button", { name: "☰ Studio Tools" }).click();
    const scrim = page.locator("div.fixed.inset-0.z-40.bg-black\\/60.md\\:hidden").first();
    await scrim.click({ position: { x: 370, y: 400 } });

    await page.waitForTimeout(450);
    const box = await page.locator('nav[aria-label="Studio tools"]').boundingBox();
    expect(box?.x).toBe(-312);
    await expect(
      page.getByRole("heading", { name: "Today in the Studio" }),
    ).toBeVisible();
  });

  test("Escape is a no-op on the open drawer (the live's keyboard contract)", async ({ page }) => {
    await page.getByRole("button", { name: "☰ Studio Tools" }).click();
    await page.keyboard.press("Escape");
    await expect(page.locator('nav[aria-label="Studio tools"]')).toBeVisible();
  });

  test("the Chat toggle opens the right drawer at the live's geometry", async ({ page }) => {
    await page.getByRole("button", { name: /Chat ☰/ }).click();

    // The right drawer: 312px wide anchored at x = 390 - 312 = 78.
    const chatDrawer = page
      .locator("aside.fixed.inset-y-0.right-0.z-50")
      .first();
    await expect(chatDrawer).toBeVisible();
    // The drawer slides in over 0.3s — settle before measuring geometry.
    await page.waitForTimeout(450);
    const box = await chatDrawer.boundingBox();
    expect(box?.width).toBe(312);
    expect(box?.x).toBe(78);
    // exact: true — the dashboard's community panel carries a "Studio Chat"
    // h2 that role-matching would hit case-insensitively.
    await expect(page.getByRole("heading", { name: "STUDIO CHAT", exact: true })).toBeVisible();

    // And the shared scrim dims the page behind it too.
    await expect(
      page.locator("div.fixed.inset-0.z-40.bg-black\\/60.md\\:hidden").first(),
    ).toBeVisible();
  });

  test("the closed drawers are inert and off-screen", async ({ page }) => {
    // Nothing opened: the sidebar drawer is translated off-screen and the
    // chat drawer carries inert (r5) — neither is interactive.
    const chatDrawer = page.locator("aside.fixed.inset-y-0.right-0.z-50").first();
    await expect(chatDrawer).toHaveJSProperty("inert", true);
    const chatBox = await chatDrawer.boundingBox();
    expect(chatBox?.x).toBe(390);
  });
});
