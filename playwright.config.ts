import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: 'pwa-offline.spec.ts',
  webServer: { command: 'npm run dev -- --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: true },
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  projects: [
    { name: 'mobile-375', use: { ...devices['iPhone 13 mini'], browserName: 'chromium', viewport: { width: 375, height: 812 } } },
    { name: 'mobile-390', use: { ...devices['iPhone 13'], browserName: 'chromium', viewport: { width: 390, height: 844 } } },
    { name: 'mobile-430', use: { ...devices['iPhone 14 Pro Max'], browserName: 'chromium', viewport: { width: 430, height: 932 } } },
  ],
})
