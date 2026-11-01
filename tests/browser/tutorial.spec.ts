import { test, expect, type Page } from '@playwright/test'
import { enterTitle, passAccessGate } from './helpers'
import { arunLines, tasks as taskDefinitions } from '../../src/chapter/content'
import { streetPoints } from '../../src/chapter/layout'
import { privateAnswers, withPrivateAnswers } from '../private-answers'
const tasks = withPrivateAnswers('arun', taskDefinitions)

test.use({ video: { mode: 'on', size: { width: 1440, height: 900 } }, actionTimeout: 12000 })
test.afterEach(async ({ page }, info) => {
  if (info.status !== 'passed' || !info.title.startsWith('Kin guides real controls')) return
  const video = page.video()
  await page.context().close()
  await video?.saveAs('evidence/kin-tutorial-real-flow.webm')
})

const coach = (page: Page) => page.locator('.kin-coach')
const target = (page: Page, id: string) => page.locator(`[data-tutorial-target="${id}"]`)
const visibleLine = (page: Page) => coach(page).locator('.kin-line > [aria-hidden="true"]')

async function expectStep(page: Page, step: string) {
  await expect(coach(page)).toHaveAttribute('data-tutorial-step', step, { timeout: 15000 })
}

async function startGame(page: Page) {
  await enterTitle(page)
  await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
  await page.getByRole('button', { name: 'ข้ามบทนำ', exact: true }).click()
  await expect(page.locator('.city-map')).toHaveAttribute('data-ready', 'true', { timeout: 20000 })
}

async function choose(page: Page, name: string) {
  const reveal = coach(page).getByRole('button', { name: 'แสดงข้อความทั้งหมด', exact: true })
  if (await reveal.isVisible()) await reveal.click()
  // Next actions include a decorative arrow in their accessible name.
  const button = coach(page).getByRole('button', { name })
  await expect(button).toBeVisible()
  await button.click()
}

async function clickTarget(page: Page, id: string) {
  const button = target(page, id)
  await expect(button).toBeVisible()
  await expect(button).toBeEnabled()
  await button.click()
}

async function position(page: Page) {
  return page.locator('.world-frame').evaluate(node => ({ x: Number((node as HTMLElement).dataset.playerX), y: Number((node as HTMLElement).dataset.playerY) }))
}

async function placeNear(page: Page, point: {x:number;y:number}) {
  // Spatial fixture only, after the real movement acknowledgement. Interactions,
  // witness reading, clues, puzzles and all code/score decisions still use real UI.
  await page.evaluate(async point => {
    const urls=performance.getEntriesByType('resource').map(r=>r.name)
    const {setPosition}=await import(urls.findLast(u=>u.includes('/src/model.ts'))??'/src/model.ts')
    setPosition(point)
  },point)
  await page.waitForTimeout(80)
}

async function chapterSnapshot(page: Page) {
  return page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map(r => r.name)
    const { chapter } = await import(urls.findLast(u => u.includes('/src/chapter/model.ts')) ?? '/src/chapter/model.ts')
    return chapter.get()
  })
}

test('Kin guides real controls through Circuit City and a first BODY repair without awarding CAM-07', async ({
  page,
}) => {
  test.setTimeout(180000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 900 })
  const errors: string[] = []
  const diagnostics: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) diagnostics.push(message.text())
  })
  await startGame(page)
  await expectStep(page, 'intro')
  await expect(page.locator('.city-map'), diagnostics.join('\n')).toHaveAttribute(
    'data-renderer',
    '3d'
  )
  await expect
    .poll(() => page.getByRole('dialog', { name: 'คินพาฝึกเล่น', exact: true }).evaluate((node) => node.contains(document.activeElement)))
    .toBe(true)
  expect(await page.locator('#root').evaluate(node => node.inert)).toBe(true)
  expect(await page.locator('.modal-backdrop').evaluate(node => getComputedStyle(node).backdropFilter)).toContain('blur(4px)')
  await expect(coach(page)).toContainText('ฝากช่วยดูเทอร์มินัล')
  await page.screenshot({
    path: 'evidence/kin-tutorial-desktop.png',
    fullPage: true,
    animations: 'disabled',
  })
  await choose(page, 'ได้เลย หัวหน้า')
  await expectStep(page, 'intro-joke')
  await expect(coach(page)).toHaveAttribute('data-mood', 'smirk')
  await expect(coach(page)).toContainText('อย่าเพิ่งเพิ่มอายุ')
  await choose(page, 'แล้วคดีนี้เป็นยังไง?')
  await choose(page, 'ทำไมถึงจ้างคิน?')
  await expectStep(page, 'case-more')
  await expect(coach(page)).toContainText('ยังบอกไม่ได้')
  await choose(page, 'งั้นไปดูหลักฐานกัน')
  await expectStep(page, 'camera-intro')
  await choose(page, 'ดูเมืองอีกมุม')
  await expectStep(page, 'rotate')
  // Rotating, not unrelated zooming, is the first player action requested.
  await expect(target(page, 'zoom-in')).toBeDisabled()
  await clickTarget(page, 'rotate-right')
  await expectStep(page, 'zoom')
  await clickTarget(page, 'zoom-in')
  await expectStep(page, 'reset')
  await clickTarget(page, 'reset-camera')
  await expectStep(page, 'journal-open')
  await clickTarget(page, 'journal')
  await expectStep(page, 'journal-read')
  const journal = page.getByRole('dialog', { name: /สมุดคดี/ })
  await expect(journal.locator('.kin-coach')).toBeVisible()
  await journal.getByRole('button', { name: 'ปิดหน้าต่าง', exact: true }).click()
  await expectStep(page, 'menu-open')
  await clickTarget(page, 'menu')
  await expectStep(page, 'menu-settings')
  await clickTarget(page, 'settings')
  await expectStep(page, 'settings-read')
  const settings = page.getByRole('dialog', { name: 'ตั้งค่า', exact: true })
  await expect(settings.locator('.kin-coach')).toBeVisible()
  await settings.getByRole('button', { name: 'ปิดหน้าต่าง', exact: true }).click()
  await expectStep(page, 'menu-return')
  await clickTarget(page, 'resume-game')
  await expectStep(page, 'list-open')
  await clickTarget(page, 'areas')
  await expectStep(page, 'select-arun')
  await clickTarget(page, 'area-arun')
  await expectStep(page, 'travel')
  await expect(page.locator('.city-map')).toHaveAttribute('data-current-area', 'base')
  await clickTarget(page, 'enter-arun')
  await expectStep(page, 'street-walk')
  await expect(page.getByText('กำลังเตรียมฉาก…')).toBeHidden({ timeout: 15000 })
  await page.keyboard.press('e')
  await expectStep(page, 'street-walk')
  await page.keyboard.down('w')
  await expectStep(page, 'witness-open')
  await page.keyboard.up('w')
  await placeNear(page, streetPoints.arun)
  await page.keyboard.press('e')
  const witness = page.getByRole('dialog', { name: /อรุณ/ })
  await expect(witness).toBeVisible()
  for (let i = 1; i < arunLines.length; i++)
    await witness.getByRole('button', { name: 'ถัดไป →', exact: true }).click()
  await witness.getByRole('button', { name: 'ออกค้นร่องรอย →', exact: true }).click()
  await expectStep(page, 'traces')
  await placeNear(page, streetPoints.receipt)
  await page.keyboard.press('e')
  await page.getByRole('button', { name: 'เก็บลงสมุดคดี +', exact: true }).click()
  await expectStep(page, 'traces')
  await placeNear(page, streetPoints.relay)
  await page.keyboard.press('e')
  await page.getByRole('button', { name: 'เก็บลงสมุดคดี +', exact: true }).click()
  await expectStep(page, 'field-map')
  const beforeFieldReturn = await chapterSnapshot(page)
  expect(beforeFieldReturn.clues).toEqual(['receipt', 'relay'])
  expect(beforeFieldReturn.completed).toEqual([])
  await page.keyboard.press('m')
  await expectStep(page, 'field-return')
  await expect(page.locator('.city-map')).toHaveAttribute('data-ready', 'true', { timeout: 20000 })
  expect(await chapterSnapshot(page)).toEqual(beforeFieldReturn)
  await clickTarget(page, 'areas')
  await clickTarget(page, 'area-arun')
  await expectStep(page, 'field-return')
  await clickTarget(page, 'enter-arun')
  await expectStep(page, 'camera-enter')
  await expect(page.getByText('กำลังเตรียมฉาก…')).toBeHidden({ timeout: 15000 })
  expect(await chapterSnapshot(page)).toEqual(beforeFieldReturn)
  await placeNear(page, streetPoints.terminal)
  await page.keyboard.press('e')
  await page.getByRole('button', { name: /เริ่มเชื่อมต่อ/ }).click()
  await expectStep(page, 'chip-open')
  await expect(page.locator('.circuit-loading')).toHaveCount(0, { timeout: 20000 })
  await clickTarget(page, 'circuit-list')
  await page.getByTestId('circuit-stage-0').click()
  await page.setViewportSize({width:1280,height:720})
  const taskText=coach(page).locator('.dialogue-surface__text')
  expect(await taskText.evaluate(node=>node.scrollHeight<=node.clientHeight+1)).toBe(true)
  const startBox=await target(page,'circuit-start').boundingBox(),coachBox=await coach(page).boundingBox()
  expect(startBox!.x+startBox!.width<=coachBox!.x||startBox!.y+startBox!.height<=coachBox!.y||startBox!.x>=coachBox!.x+coachBox!.width||startBox!.y>=coachBox!.y+coachBox!.height).toBe(true)
  await page.setViewportSize({width:1440,height:900})
  await clickTarget(page, 'circuit-start')
  await expectStep(page, 'puzzle')
  const puzzle = page.getByRole('region', { name: 'Puzzle ก่อนซ่อมโค้ด', exact: true })
  await puzzle.getByRole('button', { name: '<body>', exact: true }).click()
  await puzzle.getByRole('button', { name: /^เนื้อหาที่คนอ่านมองเห็น:/ }).click()
  await puzzle.getByRole('button', { name: '<head>', exact: true }).click()
  await puzzle.getByRole('button', { name: /^ข้อมูลของเอกสาร:/ }).click()
  await puzzle.getByRole('button', { name: 'ต่อวงจร Puzzle', exact: true }).click()
  await expectStep(page, 'snippet')
  await page.locator('.cm-content').click()
  await page.locator('.cm-content').press('Control+End')
  await page.getByRole('button', { name: 'แทรก <p>', exact: true }).click()
  await expectStep(page, 'undo')
  await page.locator('.cm-content').press('Control+z')
  await expectStep(page, 'repair')
  const code = page.locator('.cm-content')
  await code.click()
  await code.press('Control+a')
  await page.keyboard.insertText('<img src="suspect.png" alt="คนร้าย">')
  await clickTarget(page, 'check-code')
  await expectStep(page, 'repair')
  await code.click()
  await code.press('Control+a')
  await page.keyboard.insertText(tasks[0].solution)
  await clickTarget(page, 'check-code')
  await expectStep(page, 'repair-submit')
  const learning = () =>
    page.evaluate(async () => {
      const urls = performance.getEntriesByType('resource').map((r) => r.name)
      const { chapter } = await import(
        urls.findLast((u) => u.includes('/src/chapter/model.ts')) ?? '/src/chapter/model.ts'
      )
      return chapter.get()
    })
  expect((await learning()).completed).toEqual([])
  await code.click()
  await code.press('Control+Enter')
  await expectStep(page, 'repair-read')
  expect((await learning()).completed).toEqual([0])
  await page.screenshot({ path: 'evidence/kin-tutorial-terminal.png' })
  await page.getByRole('dialog').getByRole('button', { name: 'ปิดหน้าต่าง', exact: true }).click()
  await expectStep(page, 'return-map')
  await page.keyboard.press('m')
  await expectStep(page, 'done')
  await expect(page.locator('[data-city-pin="relay"]')).toHaveCount(0)
  await choose(page, 'เริ่มสำรวจอิสระ')
  await expect(coach(page)).toHaveCount(0)
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('techcare.tutorial.v1:guest:0')!).status
    )
  ).toBe('completed')
  expect((await learning()).completed).toEqual([0])
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('techcare.player.v1:guest')!).player.case.completed
    )
  ).toEqual([])
  expect(errors).toEqual([])
})

test('skipping, replay, interrupted reload and New Case use real UI without changing case progress', async ({
  page,
}) => {
  test.setTimeout(60000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await startGame(page)
  await expectStep(page, 'intro')
  await page.getByRole('button', { name: 'ข้ามการฝึก', exact: true }).click()
  await expect(coach(page)).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('techcare.case.v1'))).toBeNull()
  await page.getByRole('button', { name: 'เปิดเมนูเกม', exact: true }).click()
  await page.getByRole('button', { name: 'ฝึกเล่นกับคินอีกครั้ง', exact: true }).click()
  await expectStep(page, 'intro')
  await choose(page, 'ขอสรุปคดีก่อน')
  await expectStep(page, 'case')
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(
    coach(page).getByRole('button', { name: 'ทำไมถึงจ้างคิน?', exact: true })
  ).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({
    path: 'evidence/kin-tutorial-narrow-case.png',
    fullPage: true,
    animations: 'disabled',
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.reload()
  await passAccessGate(page)
  await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
  await page.getByRole('button', { name: 'ข้ามบทนำ', exact: true }).click()
  await expect(page.getByRole('button', { name: 'ฝึกกับคินต่อ', exact: true })).toBeVisible({
    timeout: 15000,
  })
  await expect(coach(page)).toHaveCount(0)
  await page.getByRole('button', { name: 'ฝึกกับคินต่อ', exact: true }).click()
  await expectStep(page, 'intro')
  await page.getByRole('button', { name: 'ข้ามการฝึก', exact: true }).click()
  await page.getByRole('button', { name: 'เปิดเมนูเกม', exact: true }).click()
  await page.getByRole('button', { name: 'เริ่มคดีใหม่', exact: true }).click()
  await page.getByRole('button', { name: 'ยืนยันเริ่มคดีใหม่', exact: true }).click()
  await page.getByRole('button', { name: 'ข้ามบทนำ', exact: true }).click()
  await expectStep(page, 'intro')
  expect(await page.evaluate(() => localStorage.getItem('techcare.case.v1'))).toBeNull()
})

test('an existing recovery save offers opt-in guidance and keeps its unlocked area', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() =>
    localStorage.setItem(
      'techcare.case.v1',
      JSON.stringify({ version: 1, completed: ['recover-cam07'], currentArea: 'arun' })
    )
  )
  await startGame(page)
  // A migrated CAM-07 save receives the newly added shop departure first.
  // Dismiss the real story before checking the optional guide invitation.
  const departure = page.getByRole('dialog', { name: 'ก่อนออกจากร้าน', exact: true })
  await expect(departure).toBeVisible()
  await departure.getByRole('button', { name: 'ข้ามบท', exact: true }).click()
  await expect(coach(page)).toHaveCount(0)
  await expect(page.locator('[data-city-pin="relay"]')).toBeVisible()
  await expect(page.getByRole('button', { name: 'เริ่มฝึกกับคิน', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'เริ่มฝึกกับคิน', exact: true }).click()
  await expectStep(page, 'intro')
  await page.getByRole('button', { name: 'ข้ามการฝึก', exact: true }).click()
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('techcare.player.v1:guest')!).player.case.completed
    )
  ).toEqual(['recover-cam07'])
})

test('replaying guidance cancels an uncommitted map journey instead of moving Kin behind the introduction', async ({
  page,
}) => {
  test.setTimeout(45000)
  await startGame(page)
  await expectStep(page, 'intro')
  await page.getByRole('button', { name: 'ข้ามการฝึก', exact: true }).click()
  await page.getByRole('button', { name: 'รายชื่อพื้นที่', exact: true }).click()
  await page.getByRole('button', { name: 'สำรวจ ร้านช่างอรุณ', exact: true }).click()
  await page.getByRole('button', { name: 'เข้าสำรวจ', exact: true }).click()
  await page.keyboard.press('Escape')
  const menu = page.getByRole('dialog', { name: 'เมนูภารกิจ', exact: true })
  await expect(menu).toBeVisible()
  await expect(page.locator('.city-travel')).toBeVisible()
  await menu.getByRole('button', { name: 'ฝึกเล่นกับคินอีกครั้ง', exact: true }).click()
  await expectStep(page, 'intro')
  await page.waitForTimeout(800)
  await expect(page.locator('.city-map')).toHaveAttribute('data-current-area', 'base')
  await expect(page.locator('.city-travel')).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('techcare.case.v1'))).toBeNull()
})

test('pausing the scripted camera freezes it and resume returns the real controls without a stuck step', async ({
  page,
}) => {
  await startGame(page)
  await expectStep(page, 'intro')
  await choose(page, 'ขอสรุปคดีก่อน')
  await choose(page, 'พร้อมแล้ว เริ่มตรงไหน?')
  await expectStep(page, 'camera-intro')
  await choose(page, 'ดูเมืองอีกมุม')
  await page.keyboard.press('Escape')
  const menu = page.getByRole('dialog', { name: 'เมนูภารกิจ', exact: true })
  await expect(menu).toBeVisible()
  const camera = page.locator('.city-canvas')
  const pose = await camera.getAttribute('data-camera-position')
  await page.waitForTimeout(300)
  await expect(camera).toHaveAttribute('data-camera-position', pose!)
  await menu.getByRole('button', { name: 'กลับสู่เกม', exact: true }).click()
  await expectStep(page, 'rotate')
  await expect(target(page, 'rotate-right')).toBeEnabled()
  const before = await camera.getAttribute('data-camera-position')
  await clickTarget(page, 'rotate-right')
  await expectStep(page, 'zoom')
  await expect.poll(() => camera.getAttribute('data-camera-position')).not.toBe(before)
})

test('manual Thai text reveal stays complete and speech blips stop after reveal and skip', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'techcare.entry.v1',
      JSON.stringify({
        version: 1,
        name: 'คิน',
        music: 0,
        sfx: 60,
        reduceMotion: false,
        talkSound: true,
      })
    )
    const probe = { count: 0 }
    Object.defineProperty(window, '__kinSound', { value: probe })
    const original = AudioContext.prototype.createOscillator
    AudioContext.prototype.createOscillator = function () {
      probe.count++
      return original.call(this)
    }
  })
  const soundCount = () =>
    page.evaluate(() => (window as unknown as { __kinSound: { count: number } }).__kinSound.count)
  await startGame(page)
  await expectStep(page, 'intro')
  await expect.poll(soundCount).toBeGreaterThan(0)
  await coach(page).getByRole('button', { name: 'แสดงข้อความทั้งหมด', exact: true }).click()
  const line = await visibleLine(page).textContent()
  expect(line).toContain('ฝากช่วยดูเทอร์มินัล')
  const count = await soundCount()
  await page.waitForTimeout(400)
  await expect(visibleLine(page)).toHaveText(line!)
  expect(await soundCount()).toBe(count)
  await page.getByRole('button', { name: 'ข้ามการฝึก', exact: true }).click()
  await page.waitForTimeout(300)
  expect(await soundCount()).toBe(count)
})

test('Kin speech has an independent persistent mute and also obeys the SFX volume', async ({
  page,
}) => {
  test.setTimeout(45000)
  await page.addInitScript(() => {
    localStorage.setItem(
      'techcare.entry.v1',
      JSON.stringify({
        version: 1,
        name: 'คิน',
        music: 0,
        sfx: 60,
        reduceMotion: false,
        talkSound: false,
      })
    )
    const probe = { count: 0 }
    Object.defineProperty(window, '__kinMuteSound', { value: probe })
    const original = AudioContext.prototype.createOscillator
    AudioContext.prototype.createOscillator = function () {
      probe.count++
      return original.call(this)
    }
  })
  const soundCount = () =>
    page.evaluate(
      () => (window as unknown as { __kinMuteSound: { count: number } }).__kinMuteSound.count
    )
  await startGame(page)
  await expectStep(page, 'intro')
  const muted = await soundCount()
  await page.waitForTimeout(350)
  expect(await soundCount()).toBe(muted)
  // Reading now has one Modal owner: Escape closes that dialogue rather than
  // opening a second pause surface. Use the visible skip and replay routes.
  await page.getByRole('button', { name: 'ข้ามการฝึก', exact: true }).click()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'ตั้งค่า', exact: true }).click()
  await page.getByRole('checkbox', { name: 'เสียงข้อความคิน', exact: true }).check()
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('techcare.entry.v1')!).talkSound)
  ).toBe(true)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'ฝึกเล่นกับคินอีกครั้ง', exact: true }).click()
  await expectStep(page, 'intro')
  await expect.poll(soundCount).toBeGreaterThan(muted)
  await page.getByRole('button', { name: 'ข้ามการฝึก', exact: true }).click()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'ตั้งค่า', exact: true }).click()
  const sfx = page.getByRole('slider', { name: 'ระดับเอฟเฟกต์', exact: true })
  await sfx.focus()
  await sfx.press('Home')
  await expect(sfx).toHaveValue('0')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'ฝึกเล่นกับคินอีกครั้ง', exact: true }).click()
  await expectStep(page, 'intro')
  const zero = await soundCount()
  await page.waitForTimeout(350)
  expect(await soundCount()).toBe(zero)
})

test('missing Kin art and WebGL preserve the narrow reduced-motion lesson and skip route', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('**/assets/tutorial/kin/**', (route) => route.abort())
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (contextId: string, ...args: any[]) {
      if (['webgl', 'webgl2', 'experimental-webgl'].includes(contextId)) return null
      return original.apply(this, [contextId, ...args] as any)
    } as typeof HTMLCanvasElement.prototype.getContext
  })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await startGame(page)
  await expectStep(page, 'intro')
  await expect(coach(page).locator('.kin-portrait img')).toHaveAttribute(
    'src',
    '/assets/entry/kin.png'
  )
  await expect(
    coach(page).getByRole('button', { name: 'ข้ามการฝึก', exact: true })
  ).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await choose(page, 'ขอสรุปคดีก่อน')
  await choose(page, 'พร้อมแล้ว เริ่มตรงไหน?')
  await expectStep(page, 'camera-fallback')
  await page.screenshot({
    path: 'evidence/kin-tutorial-narrow-fallback.png',
    fullPage: true,
    animations: 'disabled',
  })
  await choose(page, 'ใช้รายชื่อแทนก็ได้')
  await expectStep(page, 'journal-open')
  await page.getByRole('button', { name: 'ข้ามการฝึก', exact: true }).click()
  await expect(coach(page)).toHaveCount(0)
  await page.getByRole('button', { name: 'รายชื่อพื้นที่', exact: true }).click()
  await expect(page.getByRole('button', { name: 'สำรวจ ร้านช่างอรุณ', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})
