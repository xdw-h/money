import { expect, test } from '@playwright/test'

test('installs its service worker and reopens offline', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect(page.getByText('本月结余')).toBeVisible()
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByText('本月结余')).toBeVisible()
})
