import { expect, test } from "@playwright/test";

import { openStudio } from "./helpers";

/**
 * The import/export surface — the wire format is the ORIGINAL app's JSON
 * shape (byte-compatible round-trip; pinned by export-payload.test.ts).
 * The export path is exercised read-only here: a pristine studio's export
 * downloads and parses with the live's envelope. The destructive import
 * (delete + re-create restore) stays in the unit/action layer, which pins
 * its atomicity and rollback contracts.
 */

test.describe("import/export", () => {
  test.beforeEach(async ({ page }) => {
    await openStudio(page);
  });

  test("Export Data downloads the original app's JSON envelope", async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export Data" }).click(),
    ]);
    const path = await download.path();
    expect(path).toBeTruthy();

    const fs = await import("node:fs");
    const payload = JSON.parse(fs.readFileSync(path!, "utf8"));
    // The live envelope (export-payload.test.ts pins the full shape).
    expect(payload.app).toBe("AST Studio");
    expect(payload.version).toBe(1);
    expect(Array.isArray(payload.projects)).toBe(true);
    expect(Array.isArray(payload.supplies)).toBe(true);
    expect(payload.projects).toHaveLength(0);
    expect(payload.supplies).toHaveLength(0);
  });

  test("the Import JSON control is present on the data views", async ({ page }) => {
    // The live app carries the utility row on the DATA surfaces (dashboard,
    // projects, supplies) — the inspiration Feed view has none (verified
    // against the live; the smoke suite pins the same set).
    for (const tile of [/^Projects/, /^Supplies/]) {
      await page.getByRole("button", { name: tile }).click();
      await expect(page.getByRole("button", { name: "Import JSON" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Export Data" })).toBeVisible();
    }
  });
});
