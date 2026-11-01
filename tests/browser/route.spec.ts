import { test, expect } from '@playwright/test'
import { enterGame } from './helpers'
test('city destination inspection and travel open the selected investigation', async ({ page }) => {
  await enterGame(page)
  await page.getByRole('button', { name: 'รายชื่อพื้นที่', exact: true }).click()
  await page.getByRole('button', { name: 'สำรวจ ร้านช่างอรุณ', exact: true }).click()
  await expect(page.locator('.city-map')).toHaveAttribute('data-current-area', 'base')
  await page.getByRole('button', { name: 'เข้าสำรวจ', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ร้านช่างอรุณ')
  await page.getByRole('button', { name: 'แผนที่เมือง', exact: true }).click()
  await expect(page.locator('.city-map')).toHaveAttribute('data-current-area', 'arun')
})
