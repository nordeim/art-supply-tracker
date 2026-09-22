import { expect, test } from "@playwright/test";

import { acceptConfirms, openStudio } from "./helpers";

/**
 * Supplies golden path — the category grid, the create modal (per-category
 * subcategory picker), the post-create flat list, away-and-back to the grid
 * (the navigation regression), stock filters, and the detail panel with a
 * native-confirm delete. Every created supply is deleted through the UI.
 */

const MARK = "E2E Probe Paint";

test.describe("supplies", () => {
  test.beforeEach(async ({ page }) => {
    acceptConfirms(page);
    await openStudio(page);
  });

  test("the supplies tile shows the category grid", async ({ page }) => {
    await page.getByRole("button", { name: /^Supplies/ }).click();
    await expect(page.getByRole("heading", { name: "Supplies" })).toBeVisible();
    // The category cards are BUTTONS (accessible names like "Paint 0
    // items · 6 types"), the label a <p> inside — not headings.
    for (const category of ["Paint", "Brushes & Tools", "Pastels", "Paper"]) {
      await expect(
        page.getByRole("button", { name: new RegExp(`^${category}( |$)`) }),
      ).toBeVisible();
    }
  });

  test("create a supply, land on the flat list, away-and-back returns to the grid", async ({ page }) => {
    await page.getByRole("button", { name: /^Supplies/ }).click();
    await page.getByRole("button", { name: "+ Add Supply" }).click();

    await page.getByLabel("Supply Name").fill(MARK);
    await page.getByLabel("Category", { exact: true }).selectOption("Paint");
    await page.getByLabel("Subcategory").selectOption("Watercolor");
    await page.getByLabel("Quantity").fill("2");
    await page.getByRole("button", { name: "Add Supply", exact: true }).click();

    // Post-create: the flat supply list with the stock-filter tabs.
    // .first() — residue from a failed earlier run would duplicate the
    // row; the guard keeps the spec on its own row.
    await expect(page.getByText(MARK).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "All", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Low Stock" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Out of Stock" })).toBeVisible();

    // Away-and-back → the category grid (the live's navigation contract):
    // the categories are TILE buttons ("Paint 0 items · 6 types"), and the
    // flat list is gone — count 0, not visibility (multi-match safety).
    await page.getByRole("button", { name: /^Projects/ }).click();
    await page.getByRole("button", { name: /^Supplies/ }).click();
    await expect(
      page.getByRole("button", { name: new RegExp(`^Paint( |$)`) }),
    ).toBeVisible();
    await expect(page.getByText(MARK)).toHaveCount(0);

    // Cleanup — walk back into the Paint list (category tile → All Paint)
    // and delete through the UI so the studio stays pristine for the next
    // spec: the grid assertion above hides names, it does NOT mean the
    // supply is gone.
    await page.getByRole("button", { name: new RegExp(`^Paint( |$)`) }).click();
    await page.getByRole("button", { name: /^All Paint/ }).click();
    await page.getByRole("button", { name: new RegExp(MARK) }).first().click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByText(MARK)).toHaveCount(0);
  });

  test("the supply detail panel opens and deletes with native confirm", async ({ page }) => {
    await page.getByRole("button", { name: /^Supplies/ }).click();
    await page.getByRole("button", { name: "+ Add Supply" }).click();
    await page.getByLabel("Supply Name").fill(MARK);
    await page.getByLabel("Category", { exact: true }).selectOption("Paint");
    await page.getByLabel("Subcategory").selectOption("Watercolor");
    await page.getByRole("button", { name: "Add Supply", exact: true }).click();
    await expect(page.getByText(MARK).first()).toBeVisible();

    // Chip → detail panel; scope the assertions to the labelled region —
    // "Watercolor" also appears on the flat-list chip and in the community
    // panel's "You were working on Watercolor Botanicals." memory line.
    await page.getByRole("button", { name: new RegExp(MARK) }).first().click();
    const panel = page.getByRole("region", { name: `Supply details for ${MARK}` });
    await expect(panel).toBeVisible();
    // exact: true — "Category" is a substring of "Subcategory" (the next
    // DetailField label over) and getByText matches by substring.
    await expect(panel.getByText("Category", { exact: true })).toBeVisible();
    await expect(panel.getByText("Watercolor")).toBeVisible();

    // Delete with confirm (auto-accepted) — the studio returns to pristine:
    // the flat list stays mounted and drops to its empty state (the live
    // keeps the list shell; only the away-and-back walk returns to the
    // category grid).
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByText(MARK)).toHaveCount(0);
    await expect(page.getByText("No supplies here yet.")).toBeVisible();
  });

  test("stock filters show the live's empty states on a pristine studio", async ({ page }) => {
    await page.getByRole("button", { name: /^Supplies/ }).click();
    await page.getByRole("button", { name: "+ Add Supply" }).click();
    await page.getByLabel("Supply Name").fill(MARK);
    await page.getByLabel("Category", { exact: true }).selectOption("Paint");
    await page.getByRole("button", { name: "Add Supply", exact: true }).click();

    await page.getByRole("button", { name: "Low Stock" }).click();
    await expect(page.getByText("No supplies match this filter.")).toBeVisible();
    await page.getByRole("button", { name: "Out of Stock" }).click();
    await expect(page.getByText("No supplies match this filter.")).toBeVisible();

    // Cleanup.
    await page.getByRole("button", { name: "All", exact: true }).click();
    await page.getByRole("button", { name: new RegExp(MARK) }).first().click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByText(MARK)).toHaveCount(0);
  });
});
