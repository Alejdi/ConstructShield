import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("renders hero section with headline and CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=ConstructShield").first()).toBeVisible();
    await expect(page.locator("text=confidence")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /start your project/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /browse contractors/i })
    ).toBeVisible();
  });

  test("renders how it works section", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=How It Works")).toBeVisible();
    await expect(page.locator("text=Escrow Protection")).toBeVisible();
    await expect(page.locator("text=Video Verification")).toBeVisible();
    await expect(page.locator("text=Leakage Protection")).toBeVisible();
  });

  test("navigates to signup when Start Your Project is clicked", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /start your project/i }).click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("navigates to contractors directory when Browse Contractors is clicked", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /browse contractors/i }).click();
    await expect(page).toHaveURL(/\/contractors/);
  });
});
