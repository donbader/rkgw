import { defineConfig, devices } from '@playwright/test';

require('dotenv').config({ path: '../.env' });

// Use backend directly to avoid frontend proxy issues
const BASE_UI_URL = 'http://localhost:9999/_ui';

export default defineConfig({
  testDir: './specs/ui',
  testMatch: 'totp-debug.spec.ts',
  timeout: 30_000,
  reporter: 'list',
  // globalSetup: './global-setup.ts', // skip: session already created manually
  projects: [
    {
      name: 'totp-debug',
      use: {
        baseURL: BASE_UI_URL,
        ignoreHTTPSErrors: true,
        storageState: '.auth/session.json',
        screenshot: 'only-on-failure',
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
