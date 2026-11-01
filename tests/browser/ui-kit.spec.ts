import { test, expect } from '@playwright/test'
import { enterGame, selectScene } from './helpers'

test('gallery exposes all 55 sprites, category counts, transparency backgrounds and state previews', async ({
  page,
}) => {
  await page.goto('/?ui=1')
  await expect(page.locator('.sprite-card')).toHaveCount(55)
  expect(await page.locator('canvas').count()).toBe(0)
  await expect
    .poll(() =>
      page
        .locator('.sprite-card img')
        .evaluateAll((imgs) =>
          imgs
            .filter(
              (i) => !(i as HTMLImageElement).complete || !(i as HTMLImageElement).naturalWidth
            )
            .map((i) => (i as HTMLImageElement).src)
        )
    )
    .toEqual([])
  await page
    .getByRole('navigation', { name: 'หมวด Asset' })
    .getByRole('button', { name: /ปุ่ม/ })
    .click()
  await expect(page.locator('.sprite-card')).toHaveCount(16)
  await page.getByRole('button', { name: 'พื้นอ่อน', exact: true }).click()
  await expect(page.locator('.sprite-grid')).toHaveClass(/backdrop-light/)
  await page.getByRole('button', { name: 'พื้นฉาก', exact: true }).click()
  await expect(page.locator('.sprite-grid')).toHaveClass(/backdrop-scene/)
  const b = page.locator('.state-row').first().locator('button')
  expect(await b.nth(0).evaluate((e) => getComputedStyle(e).borderImageSource)).not.toBe(
    await b.nth(1).evaluate((e) => getComputedStyle(e).borderImageSource)
  )
  await expect(b.nth(3)).toBeDisabled()
  await page.keyboard.press('Tab')
  await b.nth(0).focus()
  expect(await b.nth(0).evaluate((e) => getComputedStyle(e).outlineStyle)).toBe('solid')
  await b.nth(0).click()
  await expect(page.getByRole('status')).toContainText('สำเร็จ')
})
test('nine-slice frames keep fixed borders at different widths and Thai text fits', async ({
  page,
}) => {
  await page.goto('/?ui=1')
  const small = await page.locator('.slice-small').evaluate((e) => ({
    border: getComputedStyle(e).borderLeftWidth,
    slice: getComputedStyle(e).borderImageSlice,
    w: e.clientWidth,
    scroll: e.scrollWidth,
  }))
  const wide = await page.locator('.slice-wide').evaluate((e) => ({
    border: getComputedStyle(e).borderLeftWidth,
    slice: getComputedStyle(e).borderImageSlice,
    w: e.clientWidth,
    scroll: e.scrollWidth,
  }))
  expect(small.border).toBe('16px')
  expect(wide.border).toBe('16px')
  expect(small.slice).toBe(wide.slice)
  expect(wide.w).toBeGreaterThan(small.w)
  expect(small.scroll).toBeLessThanOrEqual(small.w)
  expect(wide.scroll).toBeLessThanOrEqual(wide.w)
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(page.getByRole('link', { name: 'ดาวน์โหลดชุด Asset ZIP ↓' })).toBeVisible()
})
test('game uses pixel frames, pink answer sprites and the shared Phaser atlas without losing behavior', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await enterGame(page)
  const texture = await page.request.get('/assets/ui/atlas.png')
  expect(texture.ok()).toBe(true)
  await selectScene(page, /ห้องบอส/)
  await expect(page.getByRole('progressbar', { name: 'เกราะข้อมูล WATCHER' })).toBeVisible()
  await page.getByRole('button', { name: 'ดูหน้าต่างโจทย์บอส' }).click()
  expect(
    await page.getByRole('dialog').evaluate((e) => getComputedStyle(e).borderImageSource)
  ).toContain('panel-window.png')
  const reveal = page.getByRole('button', { name: 'ดูเฉลย' })
  expect(await reveal.evaluate((e) => getComputedStyle(e).borderImageSource)).toContain(
    'button-solution-normal.png'
  )
  await reveal.click()
  await expect(page.locator('.solution')).toBeVisible()
  await page.getByRole('button', { name: 'ปิดหน้าต่าง' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  expect(errors).toEqual([])
})
