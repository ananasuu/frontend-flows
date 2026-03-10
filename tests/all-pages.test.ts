import { expect, test } from "@playwright/test";
import { makeAxeBuilder } from "./fixtures/a11y.ts";
import { thresholds } from "./fixtures/performance.ts";

const routes = (process.env.FRONTEND_FLOWS_URLS || "/")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const enableLighthouse =
  process.env.FRONTEND_FLOWS_ENABLE_LIGHTHOUSE === "true";

function getTagsForRoute(route: string): string[] {
  const tags = ["@all-pages"];

  if (route === "/") {
    tags.push("@homepage");
  }

  if (route.startsWith("/de")) {
    tags.push("@de");
  } else {
    tags.push("@default-lang");
  }

  return tags;
}

for (const route of routes) {
  const tags = getTagsForRoute(route);

  test.describe(`frontend checks for ${route}`, () => {
    test.describe("functional", { tag: [...tags, "@functional"] }, () => {
      test.skip(
        ({ browserName }) => browserName.endsWith("--dark"),
        "Functional checks are skipped in dark mode project",
      );

      test(`page responds successfully: ${route}`, async ({ page }) => {
        const response = await page.goto(route, { waitUntil: "networkidle" });

        expect(response, "No response returned by page.goto").not.toBeNull();
        expect(
          response?.status(),
          `Unexpected status code for ${route}`,
        ).toBeLessThan(400);

        await expect(page).toHaveTitle(/.+/);
      });
    });

    test.describe("a11y", { tag: [...tags, "@a11y"] }, () => {
      test.skip(
        ({ browserName }) => !browserName.startsWith("chromium"),
        "A11y checks run in chromium only",
      );

      test(`axe scan has no violations: ${route}`, async ({ page }) => {
        await page.goto(route, { waitUntil: "networkidle" });

        const scanResults = await makeAxeBuilder(page).analyze();
        expect(scanResults.violations).toEqual([]);
      });
    });

    test.describe("performance", { tag: [...tags, "@performance"] }, () => {
      test.skip(
        !enableLighthouse,
        "Set FRONTEND_FLOWS_ENABLE_LIGHTHOUSE=true to enable performance checks",
      );
      test.skip(
        ({ browserName }) => !browserName.startsWith("chromium"),
        "Lighthouse checks run in chromium only",
      );

      test(`lighthouse score thresholds: ${route}`, async ({
        page,
      }, testInfo) => {
        test.setTimeout(90000);

        await page.goto(route, { waitUntil: "networkidle", timeout: 30000 });

        const { playAudit } = await import("playwright-lighthouse");
        const port = testInfo.project.name === "chromium-dark" ? 9223 : 9222;

        await playAudit({
          page,
          thresholds,
          port,
          opts: {
            logLevel: "error",
            onlyCategories: [
              "performance",
              "accessibility",
              "best-practices",
              "seo",
            ],
          },
        });
      });
    });
  });
}
