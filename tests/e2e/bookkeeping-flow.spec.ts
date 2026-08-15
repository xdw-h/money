import { expect, test } from '@playwright/test'
import path from 'node:path'

test('adds an expense with an immediate image preview and persists it', async ({ page }) => {
  await page.goto('/record/new')
  await page.getByRole('button', { name: '2' }).click()
  await page.getByRole('button', { name: '4' }).click()
  await page.getByRole('button', { name: '0' }).click()
  await page.getByLabel('备注').fill('牙科检查')
  await page.locator('input[type=file]').setInputFiles(path.resolve('tests/fixtures/receipt.svg'))
  await expect(page.getByAltText('receipt.svg')).toBeVisible()
  await page.getByRole('button', { name: '保存' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText('牙科检查')).toBeVisible()
  await expect(page.getByText('¥240.00').first()).toBeVisible()
  await page.reload()
  await expect(page.getByText('牙科检查')).toBeVisible()

  await page.getByText('牙科检查').click()
  await expect(page.getByRole('dialog', { name: '图片预览' })).toBeVisible()
  await expect(page.getByAltText('receipt.svg')).toBeVisible()
})

test('updates bills and exports a ZIP backup', async ({ page }) => {
  await page.goto('/record/new')
  for (const digit of ['1', '2', '8']) await page.getByRole('button', { name: digit }).click()
  await page.getByLabel('备注').fill('晚餐')
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page).toHaveURL(/\/$/)
  await page.getByRole('link', { name: '账单', exact: true }).click()
  await expect(page.getByText('¥128.00').first()).toBeVisible()

  await page.getByRole('link', { name: '设置', exact: true }).last().click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出 ZIP 备份' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^钱迹备份-\d{4}-\d{2}-\d{2}\.zip$/)
})

test('edits and deletes an existing record', async ({ page }) => {
  await page.goto('/record/new')
  await page.getByRole('button', { name: '6' }).click()
  await page.getByRole('button', { name: '8' }).click()
  await page.getByLabel('备注').fill('水果')
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page).toHaveURL(/\/$/)

  await page.getByRole('button', { name: '编辑 水果' }).click()
  await expect(page).toHaveURL(/\/record\//)
  await expect(page.getByText('¥68.00', { exact: true })).toBeVisible()
  await page.getByLabel('备注').fill('水果和零食')
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByText('水果和零食')).toBeVisible()

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: '删除 水果和零食' }).click()
  await expect(page.getByText('水果和零食')).toHaveCount(0)
})
