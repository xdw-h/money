import { expect, test } from '@playwright/test'

test('installs its service worker and reopens offline', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await expect(page.getByText('本月支出').first()).toBeVisible()
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByText('本月支出').first()).toBeVisible()
})
