// @ts-check
// Playwright config for browser e2e: serves web/ and runs specs in tests/e2e/browser/
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3333',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'], isMobile: true } },
  ],
  webServer: {
    command: 'npm run serve:web',
    url: 'http://127.0.0.1:3333',
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
