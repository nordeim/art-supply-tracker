import { expect, test } from "@playwright/test";

import { acceptConfirms, openStudio } from "./helpers";

/**
 * Projects golden path — the status columns, create modal (Planned default),
 * detail panel, the INLINE edit swap (the live's edit-in-place UX), and the
 * native-confirm delete. Every created project is deleted through the UI.
 */

const MARK = "E2E Probe Project";

test.describe("projects", () => {
  test.beforeEach(async ({ page }) => {
    acceptConfirms(page);
    await openStudio(page);
  });

  test("the projects view shows the status columns and Needs Sorting", async ({ page }) => {
    await page.getByRole("button", { name: /^Projects/ }).click();
    // The status columns are the live's tinted TILE buttons (accessible
    // names like "Planned 0 projects"), not headings.
    for (const column of ["Planned", "In Progress", "On Hold", "Completed"]) {
      await expect(
        page.getByRole("button", { name: new RegExp(`^${column} `) }),
      ).toBeVisible();
    }
    await expect(page.getByRole("button", { name: /^Needs Sorting/ })).toBeVisible();
  });

  test("create a project (Planned default), open its detail panel, edit inline", async ({ page }) => {
    await page.getByRole("button", { name: /^Projects/ }).click();
    await page.getByRole("button", { name: "+ New Project" }).click();

    await page.getByLabel("Project Title").fill(MARK);
    // No status touched — the modal defaults to Planned.
    await page.getByRole("button", { name: "Create Project", exact: true }).click();

    // The top level is the live's TILE grid — the fresh project lands in
    // the Planned tile's count and the sidebar rail, not a column chip.
    // ("Projects <digit>" — sub-views carry a bare "Projects" breadcrumb
    // button that the loose /^Projects/ would also hit.)
    await expect(page.getByRole("button", { name: /^Planned / })).toContainText("1");
    await expect(page.getByRole("button", { name: /^Projects \d/ })).toContainText("1");

    // The All Projects list carries the chip (NEW badge + status pill).
    await page.getByRole("button", { name: /^All Projects/ }).click();
    const chip = page.getByRole("button", { name: new RegExp(`NEW ${MARK}`) });
    await expect(chip).toBeVisible();
    await chip.click();

    // Chip → detail panel. The panel is a labelled region — scope the
    // assertions there: bare text like "NEW" or "Planned" also lives on
    // the column chip and the status tiles.
    const panel = page.getByRole("region", { name: `Project details for ${MARK}` });
    await expect(panel).toBeVisible();
    await expect(panel.getByText("NEW")).toBeVisible();
    await expect(panel.getByText("Planned", { exact: true })).toBeVisible();

    // Edit swaps the panel for the INLINE form in the same slot. Saving an
    // in-progress status keeps the chip in the ALL list (it would leave a
    // Planned-only sub-view) — that is why this flow uses All Projects.
    await page.getByRole("button", { name: "Edit Project" }).click();
    await expect(page.getByLabel("Project Title")).toHaveValue(MARK);
    await page.getByLabel("Status").selectOption("in-progress");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(panel.getByText("In Progress", { exact: true })).toBeVisible();

    // Delete with confirm — the studio returns to pristine. (Still in the
    // All Projects sub-view: the "Projects \d" pattern picks the sidebar
    // stat tile, not the sub-view's "Projects" breadcrumb back-button.)
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByText(MARK)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Projects \d/ })).toContainText("0");
  });

  test("the recent-projects rail focuses the project like the live (sticky focus)", async ({ page }) => {
    await page.getByRole("button", { name: /^Projects/ }).click();
    await page.getByRole("button", { name: "+ New Project" }).click();
    await page.getByLabel("Project Title").fill(MARK);
    await page.getByRole("button", { name: "Create Project", exact: true }).click();
    // The rail lists the fresh project — role queries see only the visible
    // desktop sidebar copy (the md:hidden drawer duplicate is filtered).
    await expect(page.getByRole("button", { name: new RegExp(MARK) })).toBeVisible();

    // Rail click → the "All Projects" list with the detail panel open.
    await page.getByRole("button", { name: new RegExp(MARK) }).first().click();
    const panel = page.getByRole("region", { name: `Project details for ${MARK}` });
    await expect(page.getByText("All Projects")).toBeVisible();
    await expect(panel.getByText("NEW")).toBeVisible();

    // Sticky across away-and-back (the live's focusRequest semantics).
    await page.getByRole("button", { name: /^Supplies/ }).click();
    await page.getByRole("button", { name: /^Projects/ }).click();
    await expect(page.getByText("All Projects")).toBeVisible();
    await expect(panel.getByText("NEW")).toBeVisible();

    // Cleanup: the panel's Delete.
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByText(MARK)).toHaveCount(0);
  });
});
