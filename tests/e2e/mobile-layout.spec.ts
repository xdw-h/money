import { expect, test } from '@playwright/test'

for (const route of ['/', '/record/new', '/bills', '/settings']) {
  test(`${route} has no horizontal overflow and keeps primary actions visible`, async ({ page }) => {
    await page.goto(`/#${route}`)
    const announcement = page.getByRole('button', { name: '关闭版本公告' })
    if (await announcement.isVisible()) await announcement.click()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (route !== '/record/new') await expect(page.getByRole('link', { name: '新增记账' })).toBeVisible()
    else await expect(page.getByRole('button', { name: '保存' })).toBeVisible()
  })
}

test('record helper controls share the same height', async ({ page }) => {
  await page.goto('/#/record/new')
  const announcement = page.getByRole('button', { name: '关闭版本公告' })
  if (await announcement.isVisible()) await announcement.click()
  const boxes = await Promise.all([
    page.locator('.note-trigger').boundingBox(),
    page.locator('.date-field').boundingBox(),
    page.locator('.upload-tile').boundingBox(),
  ])
  expect(boxes.every(Boolean)).toBe(true)
  expect(boxes.map((box) => Math.round(box!.height))).toEqual([38, 38, 38])
  expect(Math.max(...boxes.map((box) => box!.y)) - Math.min(...boxes.map((box) => box!.y))).toBeLessThanOrEqual(1)
})
