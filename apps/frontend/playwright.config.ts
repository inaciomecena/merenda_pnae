import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './playwright',
  reporter: [['html', { outputFolder: '../../output/e2e/sdd0101-mobile/report', open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4173', screenshot: 'on', trace: 'retain-on-failure' },
  webServer: { command: 'npm run preview -- --host 127.0.0.1 --port 4173', port: 4173, reuseExistingServer: false },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
