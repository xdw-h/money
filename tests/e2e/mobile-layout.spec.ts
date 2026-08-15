import { expect, test } from '@playwright/test'

for (const route of ['/', '/record/new', '/bills', '/settings']) {
  test(`${route} has no horizontal overflow and keeps primary actions visible`, async ({ page }) => {
    await page.goto(route)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (route !== '/record/new') await expect(page.getByRole('link', { name: '新增记账' })).toBeVisible()
    else await expect(page.getByRole('button', { name: '保存' })).toBeVisible()
  })
}
