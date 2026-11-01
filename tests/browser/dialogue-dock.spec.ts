import { test, expect, type Page } from '@playwright/test'
import { enterGame, enterTitle, selectScene } from './helpers'
import { arunLines } from '../../src/chapter/content'
import { streetPoints } from '../../src/chapter/layout'

test.use({ viewport: { width: 1440, height: 900 }, actionTimeout: 15000 })
async function at(page: Page, point: { x: number; y: number }) {
  await expect(page.getByText('กำลังเตรียมฉาก…')).toBeHidden({ timeout: 20000 })
  await page.evaluate(async (point) => {
    const urls = performance.getEntriesByType('resource').map((r) => r.name)
    const { setPosition } = await import(
      urls.findLast((u) => /\/src\/model\.ts(?:\?|$)/.test(u)) ?? '/src/model.ts'
    )
    setPosition(point)
  }, point)
  await page.waitForTimeout(100)
  await page.keyboard.press('e')
}
async function dockFits(page: Page, selector: string) {
  const size = page.viewportSize()!,
    box = await page.locator(selector).boundingBox()
  expect(box!.width / size.width).toBeGreaterThan(0.84)
  expect(box!.width / size.width).toBeLessThan(0.94)
  expect(box!.y).toBeGreaterThan(size.height * 0.5)
  expect(box!.y + box!.height).toBeLessThanOrEqual(size.height - 8)
  expect(box!.height).toBeGreaterThanOrEqual(200)
  expect(box!.height).toBeLessThanOrEqual(270)
}
test('opening speech shares the readable bottom dock across desktop sizes', async ({ page }) => {
  test.setTimeout(90000)
  await enterTitle(page)
  await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
  for (const [width, height] of [
    [1280, 720],
    [1440, 900],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height })
    await page.waitForTimeout(250)
    await dockFits(page, '.story-dialogue')
    expect(await page.locator('.scene-plate').first().evaluate((e) => getComputedStyle(e).filter)).toBe('none')
    expect(
      await page
        .locator('.story-lines > p > span')
        .evaluate((e) => parseFloat(getComputedStyle(e).fontSize))
    ).toBeGreaterThanOrEqual(24)
    await page.screenshot({ path: `evidence/dialogue/story-${width}.png` })
  }
  await page.getByRole('button', { name: 'ถัดไป', exact: true }).click()
  await expect(page.locator('.story-screen')).toHaveAttribute('data-shot', '1', { timeout: 5000 })
  await expect(page.locator('.network-brief')).toBeVisible()
  expect(await page.locator('.layer-network').evaluate((e) => getComputedStyle(e).filter)).toBe(
    'none'
  )
  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'evidence/dialogue/story-briefing.png' })
})
test('Arun and clue speech use one blocking dock; Kin hints remain nonblocking', async ({
  page,
}) => {
  test.setTimeout(100000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await enterGame(page)
  await selectScene(page, /ร้านช่างอรุณ/)
  await at(page, streetPoints.arun)
  const witness = page.getByRole('dialog', { name: 'อรุณ / พยานร้านซ่อม', exact: true })
  await expect(witness).toBeVisible()
  expect(await page.locator('#root').evaluate((e) => e.inert)).toBe(true)
  await expect(page.locator('[aria-modal="true"]')).toHaveCount(1)
  for (const [width, height] of [
    [1280, 720],
    [1440, 900],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height })
    await page.waitForTimeout(220)
    await dockFits(page, '.modal-backdrop[data-placement="dialogue"] .dialogue-surface')
    await page.screenshot({ path: `evidence/dialogue/arun-${width}.png` })
  }
  await page.setViewportSize({ width: 1280, height: 720 })
  for (let i = 1; i < arunLines.length; i++) {
    const measured = await witness
      .locator('.dialogue-surface__text')
      .evaluate((e) => ({ scroll: e.scrollHeight, client: e.clientHeight, text: e.textContent }))
    expect(measured.scroll).toBeLessThanOrEqual(measured.client + 1)
    await witness.getByRole('button', { name: 'ถัดไป →', exact: true }).click()
    await expect(witness.locator('.dialogue-surface__text')).toHaveText(arunLines[i].text)
  }
  await witness.getByRole('button', { name: 'ออกค้นร่องรอย →', exact: true }).click()
  await page.setViewportSize({ width: 1280, height: 720 })
  await at(page, streetPoints.receipt)
  await expect(page.locator('.dialogue-evidence-above')).toBeVisible()
  expect(
    await page.locator('.dialogue-evidence-above').evaluate((e) => getComputedStyle(e).filter)
  ).toBe('none')
  await page.waitForTimeout(250)
  await page.screenshot({ path: 'evidence/dialogue/clue-1280.png' })
  await page.getByRole('button', { name: 'เก็บลงสมุดคดี +', exact: true }).click()
  await page.getByRole('button', { name: 'แสดงคำใบ้คิน กด H', exact: true }).click()
  await expect(page.locator('.field-guide .dialogue-surface--compact')).toBeVisible()
  expect(await page.locator('#root').evaluate((e) => e.inert)).toBe(false)
  await expect(page.locator('[aria-modal="true"]')).toHaveCount(0)
  await page.waitForTimeout(250)
  const hintMeasure = await page
    .locator('.field-guide .dialogue-surface__text')
    .evaluate((e) => ({ client: e.clientHeight, scroll: e.scrollHeight }))
  expect(hintMeasure.scroll).toBeLessThanOrEqual(hintMeasure.client + 1)
  for(const[width,height]of[[1280,720],[1440,900],[1920,1080]]) {
    await page.setViewportSize({width,height});await page.waitForTimeout(250)
    const hint=await page.locator('.field-guide .dialogue-surface').boundingBox()
    const interaction=await page.locator('.interaction').boundingBox()
    expect(interaction!.y+interaction!.height).toBeLessThanOrEqual(hint!.y)
    await expect(page.locator('.interaction button')).toBeVisible()
    await page.screenshot({path:'evidence/dialogue/hint-'+width+'.png'})
  }
  expect(errors).toEqual([])
})
