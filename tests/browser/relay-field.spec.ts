import { test, expect, type Page } from '@playwright/test'
import { enterGame } from './helpers'
import { relayPoints } from '../../src/relay/layout'
import { tasks as taskDefinitions, finalTask as finalDefinition } from '../../src/relay/content'
import { solveRelayPuzzle } from './relay-helpers'
import { expectNoAnswers } from './no-answers'
import { privateAnswers, withPrivateAnswers } from '../private-answers'
const tasks = withPrivateAnswers('relay', taskDefinitions)
const finalTask = { ...finalDefinition, solution: privateAnswers.relay[7] }

test.use({
  viewport: { width: 1440, height: 900 },
  video: { mode: 'on', size: { width: 1440, height: 900 } },
  actionTimeout: 15000,
})

async function seedCompletedArun(page: Page) {
  await page.addInitScript(() => {
    if (window !== window.top || localStorage.getItem('relay-field-seeded')) return
    localStorage.setItem('relay-field-seeded', 'true')
    const caseData = { version: 2, completed: ['recover-cam07'], currentArea: 'arun' }
    localStorage.setItem('techcare.auth.guest.v1', 'true')
    localStorage.setItem(
      'techcare.player.v1:guest',
      JSON.stringify({
        version: 1,
        player: {
          name: 'เจ้าหน้าที่ทดสอบ',
          case: caseData,
          revision: 0,
          generation: 0,
          isNew: false,
        },
        pending: false,
      })
    )
    localStorage.setItem('techcare.case.v1:guest', JSON.stringify(caseData))
    localStorage.setItem(
      'techcare.tutorial.v1:guest:0',
      JSON.stringify({ version: 1, status: 'completed' })
    )
    localStorage.setItem(
      'techcare.chapter-one.v1:guest:0',
      JSON.stringify({
        version: 2,
        spoken: true,
        clues: ['receipt', 'relay'],
        entered: true,
        completed: [0, 1, 2, 3, 4, 5, 6],
        puzzleCompleted: [0, 1, 2, 3, 4, 5, 6],
        observations: Array.from({ length: 8 }, () => ({
          attempts: 0,
          usedHint: false,
          revealed: false,
        })),
        imageRecovered: true,
        storageWarning: false,
      })
    )
  })
}
async function world(page: Page) {
  return page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map((r) => r.name)
    const { store } = await import(
      urls.findLast((u) => /\/src\/model\.ts(?:\?|$)/.test(u)) ?? '/src/model.ts'
    )
    return store.get()
  })
}
async function relayState(page: Page) {
  return page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map((r) => r.name)
    const { relay } = await import(
      urls.findLast((u) => /\/src\/relay\/model\.ts(?:\?|$)/.test(u)) ?? '/src/relay/model.ts'
    )
    return relay.get()
  })
}
async function position(page: Page, point: { x: number; y: number }) {
  await expect.poll(async () => (await world(page)).ready, { timeout: 25000 }).toBe(true)
  await page.evaluate(async (point) => {
    const urls = performance.getEntriesByType('resource').map((r) => r.name)
    const { setPosition } = await import(
      urls.findLast((u) => /\/src\/model\.ts(?:\?|$)/.test(u)) ?? '/src/model.ts'
    )
    setPosition(point)
  }, point)
  await page.waitForTimeout(80)
}
async function interactAt(page: Page, point: { x: number; y: number }) {
  await position(page, point)
  await page.keyboard.press('e')
}
async function fits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)).toBe(
    true
  )
  const box = await page.locator('.world-frame').boundingBox(),
    viewport = page.viewportSize()!
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1)
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1)
}

test('relay field: real departure, travel, arrival, locked gate, witness, two traces and Circuit City', async ({
  page,
}) => {
  test.setTimeout(300000)
  const errors: string[] = []
  page.on('pageerror', (e) => {
    errors.push(e.message)
    console.log('FIELD PAGE ERROR:', e.message)
  })
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') console.log('FIELD CONSOLE:', m.text())
  })
  await seedCompletedArun(page)
  await enterGame(page)
  const departure = page.getByRole('dialog', { name: 'ก่อนออกจากร้าน', exact: true })
  await expect(departure).toBeVisible()
  await page.screenshot({ path: 'evidence/relay/field-departure.png' })
  for (let i = 0; i < 3; i++)
    await departure.getByRole('button', { name: 'ถัดไป →', exact: true }).click()
  await departure.getByRole('button', { name: 'กลับแผนที่เมือง →', exact: true }).click()
  expect((await relayState(page)).departureSeen).toBe(true)
  await page.getByRole('button', { name: 'รายชื่อพื้นที่', exact: true }).click()
  await page.getByRole('button', { name: 'สำรวจ สถานีสื่อสาร', exact: true }).click()
  await page.getByRole('button', { name: 'เข้าสำรวจ', exact: true }).click()
  const arrival = page.getByRole('dialog', { name: 'สถานีที่ควรปิด', exact: true })
  await expect(arrival).toBeVisible()
  await page.screenshot({ path: 'evidence/relay/field-arrival.png' })
  const beforeArrivalMovement = (await world(page)).positions.street
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(250)
  await page.keyboard.up('ArrowRight')
  expect((await world(page)).positions.street).toEqual(beforeArrivalMovement)
  await arrival.getByRole('button', { name: 'ข้ามบท', exact: true }).click()
  expect((await relayState(page)).spoken).toBe(false)
  expect((await relayState(page)).clues).toEqual([])
  await expect(page.locator('.world-frame[data-view="street"]')).toBeVisible()
  const beforeWalk = (await world(page)).positions.street
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(350)
  await page.keyboard.up('ArrowRight')
  expect((await world(page)).positions.street.x).toBeGreaterThan(beforeWalk.x + 5)
  // Real movement must not cross the maintenance gate before the witness opens it.
  await position(page, { x: 1150, y: 690 })
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(650)
  await page.keyboard.up('ArrowRight')
  expect((await world(page)).positions.street.x).toBeLessThan(1195)
  await interactAt(page, relayPoints.module)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect((await relayState(page)).clues).toEqual([])
  await interactAt(page, relayPoints.officer)
  const witness = page.getByRole('dialog', { name: 'ใบงานที่ผ่านประตู', exact: true })
  await expect(witness).toBeVisible()
  await witness.getByRole('button', { name: 'ถัดไป →', exact: true }).click()
  await page.screenshot({ path: 'evidence/relay/field-witness.png' })
  for (let i = 0; i < 3; i++)
    await witness.getByRole('button', { name: 'ถัดไป →', exact: true }).click()
  await witness.getByRole('button', { name: 'เปิดทางซ่อมบำรุง →', exact: true }).click()
  expect((await relayState(page)).spoken).toBe(true)
  await position(page, { x: 1150, y: 690 })
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(850)
  await page.keyboard.up('ArrowRight')
  expect((await world(page)).positions.street.x).toBeGreaterThan(1225)
  for (const point of [relayPoints.workorder, relayPoints.module]) {
    await interactAt(page, point)
    await page.getByRole('button', { name: 'เก็บลงสมุดคดี +', exact: true }).click()
  }
  expect((await relayState(page)).clues).toEqual(['workorder', 'module'])
  for (const [width, height] of [
    [1280, 720],
    [1440, 900],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height })
    await page.waitForTimeout(250)
    await fits(page)
    await page.screenshot({ path: `evidence/relay/station-${width}.png` })
  }
  await page.setViewportSize({ width: 1440, height: 900 })
  await interactAt(page, relayPoints.terminal)
  await page.getByRole('button', { name: 'เริ่มเชื่อมต่อ RELAY-02 →', exact: true }).click()
  const map = page.locator('.circuit-map[data-chapter="relay"]')
  await expect(map).toBeVisible({ timeout: 20000 })
  await expect(map.locator('.circuit-loading')).toHaveCount(0, { timeout: 20000 })
  await page.screenshot({ path: 'evidence/relay/circuit-map.png' })
  console.log('Circuit renderer:', await map.getAttribute('data-renderer'))
  await expect(page.locator('canvas')).toHaveCount(1)
  await page.getByRole('button', { name: 'รายชื่อด่าน Circuit City', exact: true }).click()
  await expect(page.getByTestId('circuit-stage-1')).toBeDisabled()
  await expect(page.getByTestId('circuit-stage-7')).toBeDisabled()
  await page.getByRole('button', { name: 'รายชื่อด่าน Circuit City', exact: true }).click()
  const canvas = page.locator('.circuit-canvas'),
    box = await canvas.boundingBox()
  await page.mouse.move(box!.x + box!.width * 0.5, box!.y + box!.height * 0.65)
  await page.mouse.down()
  await page.mouse.move(box!.x + box!.width * 0.65, box!.y + box!.height * 0.65, { steps: 12 })
  await page.mouse.up()
  await expect(page.locator('.circuit-detail')).toHaveCount(0)
  await page.getByRole('button', { name: 'หมุนซ้าย', exact: true }).click()
  await page.getByRole('button', { name: 'ซูมเข้า', exact: true }).click()
  await page.getByRole('button', { name: 'คืนมุมมอง', exact: true }).click()
  await page.getByRole('button', { name: 'รายชื่อด่าน Circuit City', exact: true }).click()
  await page.getByTestId('circuit-stage-0').click()
  await expect(page.locator('.circuit-detail')).toContainText('สะพานแฟ้ม')
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'evidence/relay/circuit-selected.png' })
  await page.getByTestId('circuit-start').click()
  await expect(page.locator('.relay-puzzle')).toBeVisible()
  await expect(canvas).toHaveAttribute('data-camera-paused', 'true')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(canvas).toHaveAttribute('data-camera-paused', 'false')
  expect((await relayState(page)).completed).toEqual([])
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'กลับสถานีสื่อสาร ↗', exact: true }).click()
  await expect(page.locator('.world-frame[data-view="street"]')).toBeVisible()
  expect((await world(page)).activeChapter).toBe('relay')
  await expect(page.locator('canvas')).toHaveCount(1)
  // Continue the same real case through all seven repairs: no relay progress is seeded.
  await interactAt(page, relayPoints.terminal)
  await page.getByRole('button', { name: 'เริ่มเชื่อมต่อ RELAY-02 →', exact: true }).click()
  await expect(map).toBeVisible({ timeout: 20000 })
  await expect(map.locator('.circuit-loading')).toHaveCount(0, { timeout: 20000 })
  async function openStage(index: number) {
    if (!(await page.getByTestId('circuit-stage-' + index).isVisible()))
      await page.getByRole('button', { name: 'รายชื่อด่าน Circuit City', exact: true }).click()
    await page.getByTestId('circuit-stage-' + index).click()
    await page.getByTestId('circuit-start').click()
    await expectNoAnswers(page)
  }
  async function fillCode(code: string) {
    const editor = page.locator('.cm-content')
    await editor.click()
    await editor.press('Control+a')
    await page.keyboard.insertText(code)
  }
  for (let i = 0; i < 7; i++) {
    console.log('Integrated relay repair', i + 1)
    await openStage(i)
    await solveRelayPuzzle(page, i)
    await fillCode(tasks[i].solution)
    await page.getByRole('button', { name: 'ตรวจโครงสร้าง', exact: true }).click()
    expect((await relayState(page)).completed.length).toBe(i)
    await page.locator('.cm-content').press('Control+Enter')
    await expect(page.locator('.repair-complete')).toBeVisible()
    expect((await relayState(page)).completed.length).toBe(i + 1)
    await page.getByRole('button', { name: 'กลับสู่ Circuit City →', exact: true }).click()
  }
  await openStage(7)
  await fillCode(finalTask.solution)
  await page.locator('.cm-content').press('Control+Enter')
  await expect(page.locator('.relay-recovered-record')).toContainText('ศูนย์ควบคุม')
  await expect(page.locator('.repair-footer')).toContainText('100/100 PTS')
  await page.screenshot({ path: 'evidence/relay/integrated-original-record.png' })
  await page.getByRole('button', { name: 'กลับสู่ Circuit City', exact: true }).click()
  const conclusion = page.getByRole('dialog', { name: 'บันทึกที่ถูกตัด', exact: true })
  await expect(conclusion).toBeVisible()
  await conclusion.getByRole('button', { name: 'ถัดไป →', exact: true }).click()
  await page.screenshot({ path: 'evidence/relay/integrated-null-conclusion.png' })
  for (let i = 0; i < 3; i++)
    await conclusion.getByRole('button', { name: 'ถัดไป →', exact: true }).click()
  await conclusion.getByRole('button', { name: 'กลับแผนที่เมือง →', exact: true }).click()
  await expect(page.locator('.city-map')).toBeVisible()
  expect((await relayState(page)).finalRecovered).toBe(true)
  expect((await relayState(page)).conclusionSeen).toBe(true)
  await page.getByRole('button', { name: 'รายชื่อพื้นที่', exact: true }).click()
  await expect(page.getByRole('button', { name: 'สำรวจ ศูนย์ควบคุม', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'สำรวจ ศูนย์ควบคุม', exact: true }).click()
  await page.screenshot({ path: 'evidence/relay/integrated-control-unlocked.png' })
  expect(errors).toEqual([])
  const video = page.video()
  await page.context().close()
  await video?.saveAs('evidence/relay/field-route.webm')
})
