import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: { baseURL: 'http://localhost:4187', browserName: 'chromium', channel: 'msedge', trace: 'retain-on-failure' },
  webServer: { command: 'npm run preview -- --port 4187', url: 'http://localhost:4187', reuseExistingServer: false },
});
