// playwright.config.mjs
import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "tests",
  testMatch: "**/*.test.ts",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? "github" : "html",
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
    reducedMotion: "reduce",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        colorScheme: "light",
        launchOptions: {
          args: [
            "--remote-debugging-port=9222",
            "--no-sandbox",
            "--disable-dev-shm-usage",
          ],
        },
      },
    },
    {
      name: "chromium-dark",
      use: {
        ...devices["Desktop Chrome"],
        colorScheme: "dark",
        launchOptions: {
          args: [
            "--remote-debugging-port=9223",
            "--no-sandbox",
            "--disable-dev-shm-usage",
          ],
        },
      },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "npm run build && npm run preview -- --port 4321 --host",
    url: "http://localhost:4321",
    reuseExistingServer: !isCI,
  },
});