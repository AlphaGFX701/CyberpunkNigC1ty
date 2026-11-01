import { test, expect } from '@playwright/test'
import { enterGame, openSettings, selectScene } from './helpers'
test.beforeEach(async ({ page }) => {
  await enterGame(page)
})
test('all scenes render, including reselecting the current map', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  for (const label of ['แผนที่คดี', 'ร้านช่างอรุณ', 'ภายในกล้อง', 'ห้องบอส']) {
    await selectScene(page, new RegExp(label))
    await expect(page.getByText('กำลังเตรียมฉาก…')).toBeHidden()
    await expect(page.locator('canvas')).toBeVisible()
  }
  expect(errors).toEqual([])
})
test('movement works and stops under a keyboard-accessible modal', async ({ page }) => {
  await selectScene(page, /ร้านช่าง/)
  const position = async () => ({
    x: Number(await page.locator('.world-frame').getAttribute('data-player-x')),
    y: Number(await page.locator('.world-frame').getAttribute('data-player-y')),
  })
  const before = await position()
  await page.keyboard.down('d')
  await page.waitForTimeout(250)
  await page.keyboard.up('d')
  const moved = await position()
  expect(moved.x).toBeGreaterThan(before.x)
  await page.keyboard.press('j')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.down('a')
  await page.waitForTimeout(200)
  await page.keyboard.up('a')
  expect(await position()).toEqual(moved)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
})
test('sample code accepts equivalent HTML, explains errors and preserves sandbox', async ({
  page,
}) => {
  await selectScene(page, /ห้องบอส/)
  await page.getByRole('button', { name: 'ดูหน้าต่างโจทย์บอส' }).click()
  await page.getByRole('button', { name: 'ตรวจและกู้ภาพ' }).click()
  await expect(page.getByRole('status')).toContainText('ยังเปิดภาพไม่ได้')
  await page.getByRole('button', { name: 'ดูเฉลย' }).click()
  await expect(page.locator('.solution')).toContainText('suspect.png')
  await page
    .getByLabel(/evidence.html/)
    .fill("<IMG alt='ผู้ต้องสงสัยเสื้อดำหน้าร้าน' SRC='suspect.png' >")
  await page.getByRole('button', { name: 'ตรวจและกู้ภาพ' }).click()
  await expect(page.getByRole('status')).toContainText('กู้ภาพสำเร็จ')
  await expect(page.locator('iframe')).toHaveAttribute('sandbox', '')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
})
test('music loads and advances after user interaction', async ({ page }) => {
  await openSettings(page)
  const music = page.getByRole('slider', { name: 'ระดับเสียงเพลง', exact: true })
  await music.focus()
  await music.press('End')
  await expect(music).toHaveValue('100')
  await expect
    .poll(() => page.locator('audio').evaluate((a: HTMLAudioElement) => a.currentTime), {
      timeout: 8000,
    })
    .toBeGreaterThan(0)
  await music.press('Home')
  await expect.poll(() => page.locator('audio').evaluate((a: HTMLAudioElement) => a.volume)).toBe(0)
})
test('narrow review layout has reachable controls and no page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  )
  await selectScene(page, /ห้องบอส/)
  await expect(page.getByText('ต้นแบบนี้ออกแบบสำหรับคอมพิวเตอร์', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'ดูหน้าต่างโจทย์บอส' }).click()
  await expect(page.getByRole('button', { name: 'ปิดหน้าต่าง' })).toBeVisible()
  await page.screenshot({ path: 'evidence/narrow.png', fullPage: true })
})
