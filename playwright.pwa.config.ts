import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'pwa-offline.spec.ts',
  webServer: { command: 'npm run build:pwa-test && npm run preview -- --port 4174', url: 'http://127.0.0.1:4174', reuseExistingServer: false },
  use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:4174' },
})

