import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e',
  tsconfig: './tsconfig.e2e.json',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  webServer: [
    {
      command: 'pnpm --filter api dev',
      url: 'http://localhost:3000/health',
      timeout: process.env.CI ? 120_000 : 60_000,
      reuseExistingServer: true,
      stdout: 'ignore',
      stderr: 'ignore',
    },
    {
      command: 'pnpm --filter web dev',
      url: 'http://localhost:5173',
      timeout: process.env.CI ? 120_000 : 60_000,
      reuseExistingServer: true,
      stdout: 'ignore',
      stderr: 'ignore',
    },
  ],

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
