import { expect, test } from "@playwright/test";

import { openStudio } from "./helpers";

/**
 * The dashboard — "Today in the Studio" cards, the sidebar stat tiles, the
 * community chat panel, and the seeded inspiration content (15 entries).
 */

test.describe("dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await openStudio(page);
  });

  test("stat tiles show the pristine studio counts", async ({ page }) => {
    // Accessible names carry the DOM text ("Projects 0 0 active") — the
    // tiles' ALL-CAPS look is a CSS uppercase transform, invisible to roles.
    await expect(page.getByRole("button", { name: /^Projects/ })).toContainText("0");
    await expect(page.getByRole("button", { name: /^Supplies/ })).toContainText("0");
    await expect(page.getByRole("button", { name: /^Inspo/ })).toContainText("15");
  });

  test("Today in the Studio renders its four cards", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Partner name placeholder" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "The Starry Night" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Kevin Lewis" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Quote of the Day/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Today in Art History/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Partners/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Studio Spotlight/ })).toContainText("Kim Wyatt");
  });

  test("the community chat panel renders the seeded history", async ({ page }) => {
    // exact: true — the community panel's own header is the mixed-case
    // "Studio Chat" h2; the drawer's ALL-CAPS h2 must not match here.
    await expect(page.getByRole("heading", { name: "STUDIO CHAT", exact: true })).toBeVisible();
    // The chat body renders in BOTH the desktop panel and the (md:hidden)
    // mobile drawer — getByRole filters to the visible one, so the log
    // region is unique on desktop; toContainText avoids text-node dupes.
    const chat = page.getByRole("log");
    // The live history's five messages — the author's own typos included
    // ("KIm", "brower" — pinned byte-for-byte by seed-fidelity.test.ts).
    await expect(chat).toContainText("hi This is KIm I hope you love this app");
    await expect(chat).toContainText(/brower app for now/);
  });

  test("chat send stays disabled until text is entered (no mutation)", async ({ page }) => {
    // The chat history is seeded byte-for-byte to mirror the live community
    // content (seed-fidelity.test.ts) — a sent message would persist in the
    // shared demo DB and pollute later parity captures, so this spec pins
    // the input CONTRACT without sending: disabled empty, enabled filled.
    // The chat input is placeholder-labelled ("Message..." — the live's
    // markup carries no <label>); :visible picks the desktop panel's copy
    // (the mobile drawer's duplicate is md:hidden on this viewport).
    const input = page.locator('input[placeholder="Message..."]:visible');
    const send = page.getByRole("button", { name: "Send", exact: true });
    await expect(send).toBeDisabled();
    await input.fill("E2E probe");
    await expect(send).toBeEnabled();
    await expect(page.getByRole("log")).toBeVisible();
  });

  test("the header memory button is inert (the live's behavior)", async ({ page }) => {
    const before = await page
      .getByRole("heading", { name: "Today in the Studio" })
      .isVisible();
    await page.getByRole("button", { name: "✧ What was I working on?" }).click();
    // The live's button opens a popover only on the live's own account data;
    // on the pristine studio the view must not change.
    expect(before).toBe(true);
    await expect(page.getByRole("heading", { name: "Today in the Studio" })).toBeVisible();
  });
});
