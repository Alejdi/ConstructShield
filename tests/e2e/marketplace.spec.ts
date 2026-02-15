import { test, expect } from "@playwright/test";

test.describe("Marketplace (unauthenticated)", () => {
  test("job board redirects to login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/marketplace/jobs", { waitUntil: "commit" });
    await page.waitForURL(/\/login/, { timeout: 60_000 });
    expect(page.url()).toContain("/login");
  });

  test("services page redirects to login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/marketplace/services", { waitUntil: "commit" });
    await page.waitForURL(/\/login/, { timeout: 60_000 });
    expect(page.url()).toContain("/login");
  });
});
