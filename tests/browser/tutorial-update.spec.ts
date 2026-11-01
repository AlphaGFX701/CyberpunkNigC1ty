import { test, expect } from '@playwright/test'
import { enterGame } from './helpers'

test.use({ viewport: { width: 1440, height: 900 }, actionTimeout: 12000 })
test('old completed training offers new controls without input lock or case reset', async ({ page }) => {
  test.setTimeout(70000)
  await page.addInitScript(() => {
    if (localStorage.getItem('guide-update-seeded')) return
    localStorage.setItem('guide-update-seeded', 'true')
    const old = JSON.stringify({ version: 1, status: 'completed' })
    localStorage.setItem('techcare.tutorial.v1', old)
    localStorage.setItem('techcare.tutorial.v1:guest:0', old)
  })
  await enterGame(page)
  await expect(page.locator('.kin-coach')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'ลองระบบใหม่กับคิน', exact: true })).toBeVisible()
  expect(await page.locator('#root').evaluate(node => node.inert)).toBe(false)
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('techcare.player.v1:guest')!).player.case)
  await page.getByRole('button', { name: 'ลองระบบใหม่กับคิน', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'คินพาฝึกเล่น', exact: true })).toBeVisible()
  await expect(page.locator('.kin-coach')).toHaveAttribute('data-tutorial-step', 'intro')
  expect(await page.locator('#root').evaluate(node => node.inert)).toBe(true)
  await page.getByRole('button', { name: 'ข้ามการฝึก', exact: true }).click()
  await expect(page.locator('.kin-coach')).toHaveCount(0)
  expect(await page.locator('#root').evaluate(node => node.inert)).toBe(false)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('techcare.player.v1:guest')!).player.case)).toEqual(before)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('techcare.tutorial.v1:guest:0')!).guideVersion)).toBe(2)
  await enterGame(page)
  await expect(page.locator('.kin-offer')).toHaveCount(0)
})
