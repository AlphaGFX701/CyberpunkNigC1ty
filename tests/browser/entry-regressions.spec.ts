import { test, expect } from '@playwright/test'
import { enterGame, enterTitle } from './helpers'

test('pause dialog traps keyboard focus with its scene drawer closed and open', async ({
  page,
}) => {
  await enterGame(page)
  await page.getByRole('button', { name: 'เปิดเมนูเกม', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'เมนูภารกิจ', exact: true })
  const close = dialog.getByRole('button', { name: 'ปิดหน้าต่าง', exact: true })
  const summary = dialog.locator('summary')
  await expect(close).toBeFocused()

  // Closed drawer content is outside the tab sequence; summary is its last stop.
  await summary.focus()
  await page.keyboard.press('Tab')
  await expect(close).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(summary).toBeFocused()

  await page.keyboard.press('Enter')
  await expect(dialog.locator('details')).toHaveAttribute('open', '')
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true)
  }
  const gallery = dialog.getByRole('link', { name: /ดูชุด Pixel UI/ })
  await expect(gallery).toBeFocused()
  await page.keyboard.press('Tab')
  const credits = dialog.getByRole('link', { name: /เครดิตภาพ UI/ })
  await expect(credits).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(close).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(credits).toBeFocused()
})

test('closing settings invalidates a test effect still waiting for music activation', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const probe = { oscillators: 0, releaseMusic: null as (() => void) | null }
    Object.defineProperty(window, '__entryAudioProbe', { value: probe })
    HTMLMediaElement.prototype.play = function () {
      return new Promise<void>((resolve) => {
        probe.releaseMusic = resolve
      })
    }
    const original = AudioContext.prototype.createOscillator
    AudioContext.prototype.createOscillator = function () {
      probe.oscillators++
      return original.call(this)
    }
  })
  const probe = () =>
    page.evaluate(() => {
      return (window as unknown as { __entryAudioProbe: { oscillators: number } }).__entryAudioProbe
        .oscillators
    })
  const releaseMusic = () =>
    page.evaluate(async () => {
      const audio = (
        window as unknown as { __entryAudioProbe: { releaseMusic: (() => void) | null } }
      ).__entryAudioProbe
      audio.releaseMusic?.()
      // Drain the play→unlock→test callback chain before observing emitted audio.
      await new Promise((resolve) => setTimeout(resolve, 80))
    })
  await enterTitle(page)
  await page.getByRole('button', { name: 'ตั้งค่า', exact: true }).click()
  await page.getByRole('button', { name: 'ทดสอบเสียงเอฟเฟกต์', exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await releaseMusic()
  expect(await probe()).toBe(0)

  // Positive control: an active settings screen can still emit the same effect.
  await page.getByRole('button', { name: 'ตั้งค่า', exact: true }).click()
  await page.getByRole('button', { name: 'ทดสอบเสียงเอฟเฟกต์', exact: true }).click()
  await releaseMusic()
  await expect.poll(probe).toBeGreaterThan(0)
})
