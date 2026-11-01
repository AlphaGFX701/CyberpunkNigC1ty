import { test, expect, type Page } from '@playwright/test'
import { enterGame, selectScene, openSettings } from './helpers'
import { tasks, finalTask, arunLines } from '../../src/chapter/content'
import { puzzles } from '../../src/chapter/puzzles'
import { streetPoints } from '../../src/chapter/layout'

test.use({
  viewport: { width: 1440, height: 900 },
  video: { mode: 'on', size: { width: 1440, height: 900 } },
})
test.beforeEach(async ({ page }) => {
  page.on('console', (message) => {
    if (message.type() === 'error') console.log('BROWSER:', message.text())
  })
})
test.afterEach(async ({ page }, info) => {
  if (info.status !== 'passed') return
  const video = page.video()
  await page.context().close()
  await video?.saveAs(
    info.title.startsWith('two traces')
      ? 'evidence/circuit/full-playthrough.webm'
      : 'evidence/circuit/desktop-ui.webm'
  )
})
async function state(page: Page) {
  return page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map((r) => r.name)
    const { chapter } = await import(
      urls.findLast((u) => /\/src\/chapter\/model\.ts(?:\?|$)/.test(u)) ?? '/src/chapter/model.ts'
    )
    return chapter.get()
  })
}
async function interactAt(page: Page, point: { x: number; y: number }) {
  await page.evaluate(async (point) => {
    const urls = performance.getEntriesByType('resource').map((r) => r.name)
    const { setPosition } = await import(
      urls.findLast((u) => /\/src\/model\.ts(?:\?|$)/.test(u)) ?? '/src/model.ts'
    )
    setPosition(point)
  }, point)
  await page.waitForTimeout(70)
  await page.keyboard.press('e')
}
async function enterCircuit(page: Page) {
  await enterGame(page)
  await selectScene(page, /ร้านช่างอรุณ/)
  await page.screenshot({ path: 'evidence/circuit/street.png' })
  await interactAt(page, streetPoints.arun)
  const witness = page.getByRole('dialog', { name: 'อรุณ / พยานร้านซ่อม', exact: true })
  for (let i = 1; i < arunLines.length; i++)
    await witness.getByRole('button', { name: 'ถัดไป →', exact: true }).click()
  await witness.getByRole('button', { name: 'ออกค้นร่องรอย →', exact: true }).click()
  for (const point of [streetPoints.receipt, streetPoints.relay]) {
    await interactAt(page, point)
    await page.getByRole('button', { name: 'เก็บลงสมุดคดี +', exact: true }).click()
  }
  await interactAt(page, streetPoints.terminal)
  await page.getByRole('button', { name: /เริ่มเชื่อมต่อ/ }).click()
  await expect(page.locator('.circuit-map')).toBeVisible()
  await expect(page.locator('.circuit-loading')).toHaveCount(0, { timeout: 20000 })
  await expect(page.locator('canvas')).toHaveCount(1)
}
async function openStage(page: Page, index: number) {
  if (!(await page.getByTestId(`circuit-stage-${index}`).isVisible()))
    await page.getByRole('button', { name: 'รายชื่อด่าน Circuit City', exact: true }).click()
  await page.getByTestId(`circuit-stage-${index}`).click()
  await page.getByTestId('circuit-start').click()
  await expect(page.getByRole('dialog')).toBeVisible()
}
async function setCode(page: Page, code: string) {
  const editor = page.locator('.cm-content')
  await editor.click()
  await editor.press('Control+a')
  await page.keyboard.insertText(code)
}
async function solvePuzzle(page: Page, index: number) {
  const board = page.getByRole('region', { name: 'Puzzle ก่อนซ่อมโค้ด' })
  // section with aria-label is an accessible region.
  for (const slot of puzzles[index].slots) {
    const option = puzzles[index].options.find((o) => o.id === puzzles[index].solution[slot.id])!
    await board.getByRole('button', { name: option.label, exact: true }).click()
    await board
      .getByRole('button', {
        name: new RegExp('^' + slot.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':'),
      })
      .click()
  }
  await board.getByRole('button', { name: 'ต่อวงจร Puzzle', exact: true }).click()
  await expect(page.locator('.cm-content')).toBeVisible()
}
async function fits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)).toBe(
    true
  )
  const box = await page.locator('.world-frame').boundingBox()
  const viewport = page.viewportSize()!
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1)
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1)
}

test('two traces, seven real Puzzle/HTML repairs, and stage eight camera complete the case', async ({
  page,
}) => {
  test.setTimeout(150000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await enterCircuit(page)
  await fits(page)
  await page.screenshot({ path: 'evidence/circuit/city.png' })
  await page.getByRole('button', { name: 'รายชื่อด่าน Circuit City', exact: true }).click()
  await expect(page.getByTestId('circuit-stage-7')).toBeDisabled()
  await openStage(page, 0)
  await page.getByRole('button', { name: 'ต่อวงจร Puzzle', exact: true }).click()
  await expect(page.locator('.cm-content')).toHaveCount(0)
  for (let i = 0; i < 7; i++) {
    if (i) await openStage(page, i)
    await solvePuzzle(page, i)
    if (i === 0) {
      await setCode(page, 'abc')
      await page.locator('.cm-content').press('Control+End')
      await page.getByRole('button', { name: 'แทรก <p>', exact: true }).click()
      await expect(page.locator('.cm-content')).toHaveText('abc<p>')
      await page.locator('.cm-content').press('Control+z')
      await expect(page.locator('.cm-content')).toHaveText('abc')
      await setCode(page, '<p>\n<strong>ลายเซ็นหน่วยเก่า</p>')
      await page.getByRole('button', { name: 'ตรวจโครงสร้าง', exact: true }).click()
      await expect(page.getByRole('button', { name: 'ไปบรรทัด 2 ↗', exact: true })).toBeVisible()
      await expect(page.locator('.tc-code-error-line')).toHaveCount(1)
      await page.getByRole('button', { name: 'ไปบรรทัด 2 ↗', exact: true }).click()
    }
    await setCode(page, tasks[i].solution)
    await page.getByRole('button', { name: 'ตรวจโครงสร้าง', exact: true }).click()
    expect((await state(page)).completed).toHaveLength(i)
    if (i === 0) await page.screenshot({ path: 'evidence/circuit/editor.png' })
    await page.locator('.cm-content').press('Control+Enter')
    await expect(page.locator('.repair-complete')).toBeVisible()
    expect((await state(page)).completed).toHaveLength(i + 1)
    await page.getByRole('button', { name: 'กลับสู่ Circuit City →', exact: true }).click()
  }
  await page.screenshot({ path: 'evidence/circuit/seven-complete.png' })
  if (!(await page.getByTestId('circuit-stage-7').isVisible()))
    await page.getByRole('button', { name: 'รายชื่อด่าน Circuit City', exact: true }).click()
  await expect(page.getByTestId('circuit-stage-7')).toBeEnabled()
  await openStage(page, 7)
  await setCode(page, finalTask.solution)
  await page.getByRole('button', { name: 'ส่งคำสั่งซ่อม ↵', exact: true }).click()
  await expect(page.locator('.repair-evidence img')).toBeVisible()
  expect((await state(page)).imageRecovered).toBe(true)
  await page.screenshot({ path: 'evidence/circuit/evidence.png' })
  await page.getByRole('button', { name: 'กลับสู่ Circuit City', exact: true }).click()
  await page.getByRole('button', { name: 'กลับร้านอรุณ ↗', exact: true }).click()
  const departure = page.getByRole('dialog', { name: 'ก่อนออกจากร้าน', exact: true })
  await expect(departure).toBeVisible()
  for (let i = 0; i < 3; i++)
    await departure.getByRole('button', { name: 'ถัดไป →', exact: true }).click()
  await departure.getByRole('button', { name: 'กลับแผนที่เมือง →', exact: true }).click()
  await expect(page.locator('.city-map')).toBeVisible()
  await page.getByRole('button', { name: 'รายชื่อพื้นที่', exact: true }).click()
  await page.getByRole('button', { name: 'สำรวจ ร้านช่างอรุณ', exact: true }).click()
  await page.getByRole('button', { name: 'เข้าสำรวจ', exact: true }).click()
  await expect(page.locator('.world-frame')).toHaveAttribute('data-view', 'street')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('canvas')).toHaveCount(1)
  await fits(page)
  expect(errors).toEqual([])
})

test('desktop frame fits, editor preserves draft across Puzzle, escape releases camera', async ({
  page,
}) => {
  test.setTimeout(90000)
  await enterCircuit(page)
  for (const size of [
    { width: 1280, height: 720 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(size)
    await fits(page)
  }
  await openSettings(page)
  await page.getByRole('button', { name: /^เต็มจอ/ }).click()
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true)
  await fits(page)
  await page.getByRole('button', { name: /ออกจากเต็มจอ/ }).click()
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await page.setViewportSize({ width: 1280, height: 720 })
  await openStage(page, 0)
  await solvePuzzle(page, 0)
  await setCode(page, '<p>เก็บร่างนี้</p>')
  await page.getByRole('button', { name: 'ดู Puzzle อีกครั้ง', exact: true }).click()
  await page.getByRole('button', { name: 'กลับไปเขียนโค้ด', exact: true }).click()
  await expect(page.locator('.cm-content')).toHaveText('<p>เก็บร่างนี้</p>')
  const submitBounds = await page
    .getByRole('button', { name: 'ส่งคำสั่งซ่อม ↵', exact: true })
    .boundingBox()
  expect(submitBounds!.y + submitBounds!.height).toBeLessThanOrEqual(720)
  await page.screenshot({ path: 'evidence/circuit/editor-1280.png' })
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.circuit-canvas')).toHaveAttribute('data-camera-paused', 'false')
  await page.getByRole('button', { name: 'หมุนขวา', exact: true }).click()
  await page.getByRole('button', { name: 'คืนมุมมอง', exact: true }).click()
  await page.locator('.circuit-canvas canvas').evaluate((canvas: HTMLCanvasElement) => {
    canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext()
  })
  await expect(page.locator('.circuit-map')).toHaveAttribute('data-renderer', 'list')
  await expect(page.getByTestId('circuit-stage-0')).toBeEnabled()
  await expect(page.getByTestId('circuit-stage-1')).toBeDisabled()
})
