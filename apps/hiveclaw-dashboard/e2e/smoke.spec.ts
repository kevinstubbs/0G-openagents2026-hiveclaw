import { expect, test } from "@playwright/test";

/** Routes that must return OK and render without uncaught JS errors. */
const ROUTES: { path: string; titleSnippet: RegExp }[] = [
  { path: "/", titleSnippet: /HiveClaw/i },
  { path: "/docs/", titleSnippet: /HiveClaw/i },
  { path: "/status", titleSnippet: /HiveClaw|status/i },
  { path: "/hive", titleSnippet: /HiveClaw|registry|memory/i },
];

test.describe("page smoke", () => {
  for (const { path, titleSnippet } of ROUTES) {
    test(`${path} loads (HTTP + no page errors)`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (err) => pageErrors.push(err.message));

      const response = await page.goto(path, { waitUntil: "load", timeout: 90_000 });
      expect(response, `expected response for ${path}`).toBeTruthy();
      expect(response!.status(), `${path} HTTP status`).toBeLessThan(400);

      await expect(page).toHaveTitle(titleSnippet);

      const h1 = page.locator("h1").first();
      await expect(h1, `visible main heading on ${path}`).toBeVisible({ timeout: 30_000 });

      expect(pageErrors, `uncaught errors on ${path}: ${pageErrors.join("; ")}`).toEqual([]);
    });
  }

  test("/docs without trailing slash loads (rewrite to index.html)", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));
    const res = await page.goto("/docs", { waitUntil: "load", timeout: 90_000 });
    expect(res?.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30_000 });
    expect(pageErrors).toEqual([]);
  });
});
