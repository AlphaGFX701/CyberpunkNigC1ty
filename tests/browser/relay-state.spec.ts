import { privateAnswers } from '../private-answers'
import { test, expect, type Page } from '@playwright/test'
import { enterGame, openSettings, dismissTutorial, passAccessGate } from './helpers'
import { relayPoints } from '../../src/relay/layout'

test.use({ viewport: { width: 1440, height: 900 }, actionTimeout: 12000 })

/** Only episode-one completion is a fixture. Relay mid-state below is earned through real validators. */
async function seedArun(page: Page, cloudFinished = false) {
  await page.addInitScript(
    ({ cloudFinished }) => {
      if (window !== window.top || localStorage.getItem('relay-state-seeded')) return
      localStorage.setItem('relay-state-seeded', 'true')
      const caseData = {
        version: 2,
        completed: cloudFinished ? ['recover-cam07', 'recover-relay'] : ['recover-cam07'],
        currentArea: 'arun',
      }
      localStorage.setItem('techcare.auth.guest.v1', 'true')
      localStorage.setItem(
        'techcare.player.v1:guest',
        JSON.stringify({
          version: 1,
          player: {
            name: 'เจ้าหน้าที่ตรวจเซฟ',
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
            attempts: 1,
            usedHint: false,
            revealed: false,
          })),
          imageRecovered: true,
          storageWarning: false,
        })
      )
      localStorage.setItem(
        'techcare.entry.v1',
        JSON.stringify({
          version: 1,
          name: 'เจ้าหน้าที่ตรวจเซฟ',
          music: 0,
          sfx: 60,
          talkSound: true,
          reduceMotion: false,
        })
      )
    },
    { cloudFinished }
  )
}
async function state(page: Page) {
  return page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map((r) => r.name)
    const url = (pattern: RegExp, fallback: string) =>
      urls.findLast((u) => pattern.test(u)) ?? fallback
    const [{ relay }, { store }, { account }, { cityProgress }] = await Promise.all([
      import(url(/\/src\/relay\/model\.ts(?:\?|$)/, '/src/relay/model.ts')),
      import(url(/\/src\/model\.ts(?:\?|$)/, '/src/model.ts')),
      import(url(/\/src\/account\/account\.ts(?:\?|$)/, '/src/account/account.ts')),
      import(url(/\/src\/city\/progression\.ts(?:\?|$)/, '/src/city/progression.ts')),
    ])
    return {
      relay: relay.get(),
      world: store.get(),
      scope: account.getSaveScope(),
      city: cityProgress.get(),
    }
  })
}
async function earnMidState(page: Page, count: number) {
  await page.evaluate(async ({ count, answers }) => {
    const urls = performance.getEntriesByType('resource').map((r) => r.name)
    const { relay } = await import(
      urls.findLast((u) => /\/src\/relay\/model\.ts(?:\?|$)/.test(u)) ?? '/src/relay/model.ts'
    )
    const { puzzles } = await import('/src/relay/puzzles.ts')
    const { cityProgress } = await import(
      urls.findLast((u) => /\/src\/city\/progression\.ts(?:\?|$)/.test(u)) ??
        '/src/city/progression.ts'
    )
    relay.markStory('arrival')
    relay.talkToOfficer()
    relay.collectClue('workorder')
    relay.collectClue('module')
    if (!relay.startHack()) throw new Error('fixture investigation did not unlock relay')
    for (let i = 0; i < count; i++) {
      if (
        !relay.submitPuzzle(i, puzzles[i].solution).ok ||
        !relay.submitTask(i, answers[i]).ok
      )
        throw new Error('fixture repair failed validation')
    }
    cityProgress.arrive('relay')
  }, { count, answers: privateAnswers.relay })
}
async function skipDeparture(page: Page) {
  const departure = page.getByRole('dialog', { name: 'ก่อนออกจากร้าน', exact: true })
  await expect(departure).toBeVisible()
  await departure.getByRole('button', { name: 'ข้ามบท', exact: true }).click()
}
async function visitStation(page: Page) {
  await page.getByRole('button', { name: 'รายชื่อพื้นที่', exact: true }).click()
  await page.getByRole('button', { name: 'สำรวจ สถานีสื่อสาร', exact: true }).click()
  await page.getByRole('button', { name: 'เข้าสำรวจ', exact: true }).click()
  await expect(page.locator('.world-frame[data-view="street"]')).toBeVisible()
}
async function interact(page: Page, point: { x: number; y: number }) {
  await expect.poll(async () => (await state(page)).world.ready, { timeout: 25000 }).toBe(true)
  await page.evaluate(async (point) => {
    const urls = performance.getEntriesByType('resource').map((r) => r.name)
    const { setPosition } = await import(
      urls.findLast((u) => /\/src\/model\.ts(?:\?|$)/.test(u)) ?? '/src/model.ts'
    )
    setPosition(point)
  }, point)
  await page.waitForTimeout(80)
  await page.keyboard.press('e')
}
async function enterCircuit(page: Page) {
  await interact(page, relayPoints.terminal)
  await page.screenshot({ path: 'evidence/relay/field-traces-connect.png' })
  await page.getByRole('button', { name: 'เริ่มเชื่อมต่อ RELAY-02 →', exact: true }).click()
  await expect(page.locator('.circuit-map[data-chapter="relay"]')).toBeVisible({ timeout: 25000 })
  await expect(page.locator('.circuit-loading')).toHaveCount(0, { timeout: 25000 })
}

test('relay refresh restores actual earned mid-state; New Case clears both chapters through a new owner generation', async ({
  page,
}) => {
  test.setTimeout(150000)
  await seedArun(page)
  await enterGame(page)
  await skipDeparture(page)
  await earnMidState(page, 2)
  expect((await state(page)).relay.completed).toEqual([0, 1])
  await page.reload()
  await passAccessGate(page)
  await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
  await page.getByRole('button', { name: 'ข้ามบทนำ', exact: true }).click()
  await expect(page.locator('.city-map')).toHaveAttribute('data-ready', 'true', { timeout: 25000 })
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect((await state(page)).relay.completed).toEqual([0, 1])
  expect((await state(page)).relay.observations[0].attempts).toBe(1)
  expect((await state(page)).city.completed).not.toContain('recover-relay')
  await visitStation(page)
  await enterCircuit(page)
  await expect(page.locator('.circuit-map')).toHaveAttribute('data-completed', '2')
  await page.getByRole('button', { name: 'รายชื่อด่าน Circuit City', exact: true }).click()
  await expect(page.getByTestId('circuit-stage-2')).toBeEnabled()
  await expect(page.getByTestId('circuit-stage-3')).toBeDisabled()
  await expect(page.getByTestId('circuit-stage-7')).toBeDisabled()
  await page.getByTestId('circuit-stage-2').click()
  await page.getByTestId('circuit-start').click()
  await expect(page.locator('.circuit-canvas')).toHaveAttribute('data-camera-paused', 'true')
  await page.keyboard.press('Escape')
  await expect(page.locator('.circuit-canvas')).toHaveAttribute('data-camera-paused', 'false')
  // Use the real reset confirmation, not a direct chapter.reset() call.
  await page.getByRole('button', { name: 'เปิดเมนูเกม', exact: true }).click()
  await page.getByRole('button', { name: 'เริ่มคดีใหม่', exact: true }).click()
  await page.getByRole('button', { name: 'ยืนยันเริ่มคดีใหม่', exact: true }).click()
  await expect(page.locator('.story-screen')).toBeVisible()
  await page.getByRole('button', { name: 'ข้ามบทนำ', exact: true }).click()
  await expect(page.locator('.city-map')).toHaveAttribute('data-ready', 'true', { timeout: 25000 })
  await dismissTutorial(page)
  const reset = await state(page)
  expect(reset.scope.generation).toBe(1)
  expect(reset.relay.completed).toEqual([])
  expect(reset.relay.spoken).toBe(false)
  expect(reset.relay.departureSeen).toBe(false)
  expect(reset.city.completed).toEqual([])
  expect(reset.world.activeChapter).toBe('arun')
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('techcare.player.v1:guest')!).player.name
    )
  ).toBe('เจ้าหน้าที่ตรวจเซฟ')
})

test('relay muted speech and reduced motion retain keyboard movement; WebGL loss falls back to gated stage list', async ({
  page,
}) => {
  test.setTimeout(150000)
  await page.addInitScript(() => {
    const scope = window as typeof window & { __relayTones: number[] }
    scope.__relayTones = []
    const create = AudioContext.prototype.createOscillator
    AudioContext.prototype.createOscillator = function () {
      const oscillator = create.call(this),
        start = oscillator.start.bind(oscillator)
      oscillator.start = (at?: number) => {
        scope.__relayTones.push(oscillator.frequency.value)
        start(at)
      }
      return oscillator
    }
  })
  const tones = () =>
    page.evaluate(
      () =>
        (window as typeof window & { __relayTones: number[] }).__relayTones.filter((hz) =>
          [290, 326, 308].includes(hz)
        ).length
    )
  await seedArun(page)
  await enterGame(page)
  await skipDeparture(page)
  await earnMidState(page, 0)
  await visitStation(page)
  const beforeHint = await tones()
  await page.getByRole('button', { name: /คิน ขอคำใบ้หน่อย/ }).click()
  await expect.poll(tones).toBeGreaterThanOrEqual(beforeHint + 2)
  await openSettings(page)
  await page.getByRole('button', { name: /^เต็มจอ/ }).click()
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true)
  const fullFrame = await page.locator('.world-frame').boundingBox()
  const fullSize = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }))
  expect(fullFrame!.x + fullFrame!.width).toBeLessThanOrEqual(fullSize.width + 1)
  expect(fullFrame!.y + fullFrame!.height).toBeLessThanOrEqual(fullSize.height + 1)
  await page.getByRole('button', { name: /ออกจากเต็มจอ/ }).click()
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false)
  const beforePause = (await state(page)).world.positions.street
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(200)
  await page.keyboard.up('ArrowRight')
  expect((await state(page)).world.positions.street).toEqual(beforePause)
  await page.getByRole('checkbox', { name: 'เสียงข้อความคิน', exact: true }).uncheck()
  await page.getByRole('checkbox', { name: 'ลดการเคลื่อนไหว', exact: true }).check()
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await expect(page.locator('.entry-shell')).toHaveAttribute('data-reduced-motion', 'true')
  const beforeMute = await tones()
  await page.keyboard.press('h')
  await page.keyboard.press('h')
  await page.waitForTimeout(650)
  expect(await tones()).toBe(beforeMute)
  const beforeWalk = (await state(page)).world.positions.street
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(300)
  await page.keyboard.up('ArrowRight')
  expect((await state(page)).world.positions.street.x).toBeGreaterThan(beforeWalk.x)
  await enterCircuit(page)
  await expect(page.locator('.circuit-map')).toHaveAttribute('data-reduced-motion', 'true')
  await page.locator('.circuit-canvas canvas').evaluate((canvas: HTMLCanvasElement) => {
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }))
  })
  await expect(page.locator('.circuit-map')).toHaveAttribute('data-renderer', 'list')
  await expect(page.locator('canvas')).toHaveCount(0)
  await expect(page.getByTestId('circuit-stage-0')).toBeEnabled()
  await expect(page.getByTestId('circuit-stage-1')).toBeDisabled()
  await page.getByTestId('circuit-stage-0').click()
  await page.getByTestId('circuit-start').click()
  await expect(page.locator('.relay-puzzle')).toBeVisible()
  expect((await state(page)).relay.completed).toEqual([])
})

test('a cloud case completion does not invent local relay Puzzle or code history', async ({
  page,
}) => {
  test.setTimeout(90000)
  await seedArun(page, true)
  await enterGame(page)
  await skipDeparture(page)
  await visitStation(page)
  await page
    .getByRole('dialog', { name: 'สถานีที่ควรปิด', exact: true })
    .getByRole('button', { name: 'ข้ามบท', exact: true })
    .click()
  const restored = await state(page)
  expect(restored.city.completed).toContain('recover-relay')
  expect(restored.relay.completed).toEqual([])
  expect(restored.relay.puzzleCompleted).toEqual([])
  expect(
    restored.relay.observations.every(
      (o: { attempts: number; usedHint: boolean; revealed: boolean }) =>
        o.attempts === 0 && !o.usedHint && !o.revealed
    )
  ).toBe(true)
  expect(restored.relay.finalRecovered).toBe(false)
  await expect(page.locator('.relay-objective')).toContainText('เปิดฝึกซ่อมในเครื่องนี้ได้')
})
