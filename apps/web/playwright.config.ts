import { defineConfig, devices } from "@playwright/test";

// Overridable so several checkouts can run e2e side by side.
const SERVER_PORT = Number(process.env.E2E_SERVER_PORT ?? 2577);
const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 3100);
const MOBILE_SPECS = /\.mobile\.spec\.ts$/;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  // Every test joins the one lobby, so tests in different files must not overlap.
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
  },
  // Files named `*.mobile.spec.ts` run on phone profiles, every other spec on the desktop one.
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, testIgnore: MOBILE_SPECS },
    { name: "pixel-7", use: { ...devices["Pixel 7"] }, testMatch: MOBILE_SPECS },
  ],
  webServer: [
    {
      name: "server",
      command: "pnpm --filter @bumbadum/server exec tsx src/index.ts",
      url: `http://localhost:${SERVER_PORT}/health`,
      // The fake track catalog and music search: e2e runs never call YouTube
      // (apps/server/src/radio/fake-track-catalog.ts, fake-music-search.ts).
      env: { PORT: String(SERVER_PORT), TRACK_CATALOG: "fake", MUSIC_SEARCH: "fake" },
      reuseExistingServer: false,
    },
    {
      name: "web",
      command: `pnpm exec next dev --port ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      env: { NEXT_PUBLIC_SERVER_URL: `http://localhost:${SERVER_PORT}`, NEXT_PUBLIC_E2E: "1" },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
