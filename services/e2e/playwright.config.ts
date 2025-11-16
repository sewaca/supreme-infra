import { defineConfig, devices } from '@playwright/test';

const BACKEND_PORT = process.env.BACKEND_PORT || 4000;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${FRONTEND_PORT}`;
const BACKEND_URL =
  process.env.BACKEND_URL || `http://localhost:${BACKEND_PORT}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  globalSetup: './tests/setup/global-setup.ts',
  globalTeardown: './tests/setup/global-teardown.ts',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: [
    {
      command: 'cd ../backend && pnpm dev',
      url: BACKEND_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'cd ../frontend && pnpm dev',
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
