import { test, expect } from "@playwright/test";

test.describe("Authentication Pages", () => {
  test("login page renders with email and password fields", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.locator("text=Welcome back")).toBeVisible();
    await expect(page.getByPlaceholder(/you@example/i)).toBeVisible();
    await expect(page.getByPlaceholder(/enter your password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("login page has link to signup", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("link", { name: /sign up/i })
    ).toBeVisible();
  });

  test("signup page renders with role selection", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("text=Create your account")).toBeVisible();
    await expect(page.getByPlaceholder(/john smith/i)).toBeVisible();
    await expect(page.getByPlaceholder(/you@example/i)).toBeVisible();
    await expect(page.locator("text=Client")).toBeVisible();
    await expect(page.locator("text=Contractor")).toBeVisible();
  });

  test("signup page has link to login", async ({ page }) => {
    await page.goto("/signup");
    await expect(
      page.getByRole("link", { name: /sign in/i })
    ).toBeVisible();
  });

  test("redirects to login when accessing protected client route", async ({
    page,
  }) => {
    await page.goto("/client", { waitUntil: "commit" });
    await page.waitForURL(/\/login/, { timeout: 60_000 });
    expect(page.url()).toContain("/login");
  });

  test("redirects to login when accessing protected contractor route", async ({
    page,
  }) => {
    await page.goto("/contractor", { waitUntil: "commit" });
    await page.waitForURL(/\/login/, { timeout: 60_000 });
    expect(page.url()).toContain("/login");
  });

  test("redirects to login when accessing protected settings route", async ({
    page,
  }) => {
    await page.goto("/settings", { waitUntil: "commit" });
    await page.waitForURL(/\/login/, { timeout: 60_000 });
    expect(page.url()).toContain("/login");
  });

  test("redirects to login when accessing protected admin route", async ({
    page,
  }) => {
    await page.goto("/admin", { waitUntil: "commit" });
    await page.waitForURL(/\/login/, { timeout: 60_000 });
    expect(page.url()).toContain("/login");
  });
});
