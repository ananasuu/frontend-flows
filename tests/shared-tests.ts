import { expect, test } from "@playwright/test";
import { makeAxeBuilder } from "./fixtures/a11y.ts";
import { thresholds } from "./fixtures/performance.ts";

export async function pageTests(url: string, tags: string[]): Promise<void> {
  test.describe("a11y", { tag: [...tags, "@a11y"] }, () => {
    test(`a11y test for ${url}`, async ({ page }) => {
      await page.goto(url);

      const accessibilityScanResults = await makeAxeBuilder(page).analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe("performance", { tag: [...tags, "@performance"] }, () => {
    test(`lighthouse tests of ${url}`, async ({ page }, testInfo) => {
      await page.goto(url);

      const { playAudit } = await import("playwright-lighthouse");
      const port = testInfo.project.name === "chromium-dark" ? 9223 : 9222;
      await playAudit({
        page,
        thresholds,
        port,
      });
    });
  });
}
