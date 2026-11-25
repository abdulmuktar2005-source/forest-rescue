import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 8_000 },
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4182',
    browserName: 'chromium',
    headless: true,
    launchOptions: {
      executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    },
  },
  webServer: {
    command: 'npm run dev -- --port 4182',
    url: 'http://127.0.0.1:4182',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
