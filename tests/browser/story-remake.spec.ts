import { test, expect } from '@playwright/test'
import { dismissTutorial, enterTitle, selectScene } from './helpers'

test.use({ viewport: { width: 1440, height: 900 } })

test('the first key starts entry music even when body has focus', async ({ page }) => {
  await page.goto('/')
  const active = page.locator('audio[data-music-role="active"]')
  await expect(active).toHaveAttribute('src', '/assets/music/concrete-tears.mp3')
  await page.keyboard.press('Space')
  await expect
    .poll(() =>
      active.evaluate((audio: HTMLAudioElement) => !audio.paused && audio.currentTime > 3)
    )
    .toBe(true)
  await expect(page.locator('.entry-shell')).toHaveAttribute('data-screen', 'access')
})

const turns = [
  [0, 0, 'ถอดกุญแจยืนยันคำสั่งออกจากระบบ'],
  [1, 0, 'ถ้าเขาปลอมคำสั่งได้ ทีมกู้ภัยอาจถูกส่งผิดที่ เราต้องได้ BLACKBOX คืน'],
  [1, 1, 'แล้วทำไมต้องเป็นผม?'],
  [1, 2, 'เขาทิ้งหมายเลขหน่วยเก่าของคุณไว้'],
  [2, 0, 'เปิดต้นฉบับดู นายเชื่อรายงานคนอื่นง่ายไปแล้ว'],
  [2, 1, 'หมายเลขนี้เลิกใช้ไปตั้งแต่เขาหายตัว'],
  [3, 0, 'เขาลบเฉพาะช่วงที่เดินผ่านร้าน ก่อนหน้านั้นยังอยู่ครบ'],
  [3, 1, 'เก็บเครื่องไว้ ผมจะตรวจต้นฉบับ'],
  [4, 0, 'ยังอ่านแต่รายงานที่เขายื่นให้อีกเหรอ คิน?'],
  [4, 1, 'นายรู้เรื่องหน่วยเก่าได้ยังไง?'],
  [4, 2, 'อยากได้ BLACKBOX คืน ก็ตามมา แล้วดูเองว่าอาราซาก้าตัดอะไรออก'],
] as const

test('all eleven turns appear one at a time, Back preserves order, and the last turn enters the case map', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await enterTitle(page)
  await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
  const story = page.locator('.story-screen')
  for (const [i, [shot, line, text]] of turns.entries()) {
    await expect(story).toHaveAttribute('data-shot', String(shot))
    await expect(story).toHaveAttribute('data-line', String(line))
    await expect(page.locator('.story-lines > p')).toHaveCount(1)
    await expect(page.locator('.story-lines > p > span')).toHaveText(text)
    if (shot < 4) await expect(story).not.toContainText('NULL')
    if (i === 2) {
      await page.getByRole('button', { name: 'ย้อนกลับ', exact: true }).click()
      await expect(story).toHaveAttribute('data-line', '0')
      await expect(page.locator('.story-lines')).toContainText(turns[1][2])
      await page.getByRole('button', { name: 'ถัดไป', exact: true }).click()
      await expect(page.locator('.story-lines')).toContainText(text)
    }
    const font = await page
      .locator('.story-lines > p > span')
      .evaluate((element) => parseFloat(getComputedStyle(element).fontSize))
    expect(font).toBeGreaterThanOrEqual(24)
    await page
      .getByRole('button', { name: i === turns.length - 1 ? 'เริ่มตามรอย' : 'ถัดไป', exact: true })
      .click()
  }
  await expect(page.locator('.world-frame')).toHaveAttribute('data-view', 'map')
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 })
  expect(errors).toEqual([])
})

test('the theft escape starts only on Next and lasts before advancing exactly once', async ({
  page,
}) => {
  await enterTitle(page)
  await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
  const story = page.locator('.story-screen')
  await expect(story).toHaveAttribute('data-phase', 'reading')
  // Reading is manual: no mount timer can start the escape or change this shot.
  await page.waitForTimeout(900)
  await expect(story).toHaveAttribute('data-phase', 'reading')
  const next = page.getByRole('button', { name: 'ถัดไป', exact: true, includeHidden: true })
  const start = Date.now()
  await next.click()
  await expect(story).toHaveAttribute('data-phase', 'escape')
  await expect(next).toBeDisabled()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Enter')
  await expect(story).toHaveAttribute('data-shot', '0')
  await expect(story).toHaveAttribute('data-shot', '1', { timeout: 4500 })
  expect(Date.now() - start).toBeGreaterThanOrEqual(2500)
  await expect(story).toHaveAttribute('data-line', '0')
  await expect(story).toHaveAttribute('data-phase', 'reading')
  await page.waitForTimeout(350)
  await expect(story).toHaveAttribute('data-line', '0')
})

test('skipping during the escape cancels its late transition and leaves the map usable', async ({
  page,
}) => {
  await enterTitle(page)
  await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
  await page.getByRole('button', { name: 'ถัดไป', exact: true }).click()
  await expect(page.locator('.story-screen')).toHaveAttribute('data-phase', 'escape')
  await page.getByRole('button', { name: 'ข้ามบทนำ', exact: true }).click()
  await expect(page.locator('.world-frame')).toHaveAttribute('data-view', 'map')
  await dismissTutorial(page)
  await page.waitForTimeout(3100)
  await expect(page.locator('.entry-shell')).toHaveAttribute('data-screen', 'game')
  await expect(page.locator('.story-screen')).toHaveCount(0)
  await page.getByRole('button', { name: 'สมุดคดี', exact: true }).click()
  await expect(page.getByRole('dialog', { name: /สมุดคดี/ })).toBeVisible()
})

test('reduced motion skips the escape motion without skipping the first contract line', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await enterTitle(page)
  await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
  await page.getByRole('button', { name: 'ถัดไป', exact: true }).click()
  await expect(page.locator('.story-screen')).toHaveAttribute('data-shot', '1', { timeout: 1200 })
  await expect(page.locator('.story-screen')).toHaveAttribute('data-line', '0')
  await expect(page.locator('.story-lines > p')).toHaveCount(1)
  await expect(page.locator('.story-lines')).toContainText('ทีมกู้ภัยอาจถูกส่งผิดที่')
})

test('the three scene tracks switch at entry/story/game and gameplay music persists on available areas', async ({
  page,
}) => {
  await enterTitle(page)
  const activeTrack = page.locator('audio[data-techcare-music][data-music-role="active"]')
  await expect(activeTrack).toHaveAttribute('src', '/assets/music/concrete-tears.mp3')
  expect(await page.locator('audio[data-techcare-music]').count()).toBeLessThanOrEqual(2)
  await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
  await expect(activeTrack).toHaveAttribute('src', '/assets/music/rain-over-glass-monoliths.mp3')
  await page.getByRole('button', { name: 'ข้ามบทนำ', exact: true }).click()
  await expect(page.locator('.world-frame')).toHaveAttribute('data-view', 'map')
  await dismissTutorial(page)
  // Real street → device → street continuity is covered by chapter-one.spec.ts,
  // which earns both clues and completes the repair flow rather than bypassing its gates.
  for (const scene of [/ร้านช่างอรุณ/, /ห้องบอส/, /แผนที่คดี/]) {
    await selectScene(page, scene)
    await expect(activeTrack).toHaveAttribute('src', '/assets/music/midnight-protocol.mp3')
    expect(await page.locator('audio[data-techcare-music]').count()).toBeLessThanOrEqual(2)
  }
})

test('missing escape assets fall back to the still and Next proceeds without trapping the reader', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('**/assets/story/escape/**', (route) => route.abort())
  await enterTitle(page)
  await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
  const fallback = page.getByRole('img', {
    name: 'ผู้บุกรุกนำ BLACKBOX ออกจากห้องนิรภัย',
    exact: true,
  })
  await expect(fallback).toBeVisible()
  await expect(fallback).toHaveAttribute('src', '/assets/blackbox/vault.webp')
  await expect
    .poll(() => fallback.evaluate((image) => (image as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0)
  const story = page.locator('.story-screen')
  await expect(story).toHaveAttribute('data-shot', '0')
  await page.getByRole('button', { name: 'ถัดไป', exact: true }).click()
  await expect(story).toHaveAttribute('data-shot', '1', { timeout: 1200 })
  await expect(story).toHaveAttribute('data-line', '0')
  await expect(page.locator('.story-lines > p')).toHaveCount(1)
  await expect(page.locator('.story-lines')).toContainText('ทีมกู้ภัยอาจถูกส่งผิดที่')
  expect(errors).toEqual([])
})
