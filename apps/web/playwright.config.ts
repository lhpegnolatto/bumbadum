import { defineConfig, devices } from "@playwright/test";

const SERVER_PORT = 2577;
const WEB_PORT = 3100;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      name: "server",
      command: "pnpm --filter @bumbadum/server exec tsx src/index.ts",
      url: `http://localhost:${SERVER_PORT}/health`,
      env: { PORT: String(SERVER_PORT) },
      reuseExistingServer: false,
    },
    {
      name: "web",
      command: `pnpm exec next dev --port ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      env: { NEXT_PUBLIC_SERVER_URL: `http://localhost:${SERVER_PORT}` },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
