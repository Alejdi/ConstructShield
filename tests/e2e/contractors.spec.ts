import { test, expect } from "@playwright/test";

test.describe("Contractors Directory", () => {
  test("renders directory page with heading and filter bar", async ({
    page,
  }) => {
    await page.goto("/contractors");
    await expect(
      page.getByRole("heading", { name: /find contractors/i })
    ).toBeVisible();
    // Filter bar should be present
    await expect(page.locator("text=Verified Only")).toBeVisible();
  });

  test("has sort dropdown with options", async ({ page }) => {
    await page.goto("/contractors");
    // The sort select should exist
    const sortTrigger = page.locator('[data-slot="select-trigger"]').last();
    await sortTrigger.click();
    await expect(page.locator("text=Verified First")).toBeVisible();
    await expect(page.locator("text=Top Rated")).toBeVisible();
    await expect(page.locator("text=Newest")).toBeVisible();
  });

  test("search filter updates URL", async ({ page }) => {
    await page.goto("/contractors");
    const searchInput = page.getByPlaceholder(/search by name/i);
    await searchInput.fill("test");
    // Wait for debounced URL update
    await page.waitForURL(/q=test/);
    expect(page.url()).toContain("q=test");
  });
});
