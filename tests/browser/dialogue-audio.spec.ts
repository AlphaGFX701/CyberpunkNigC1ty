import { test, expect } from '@playwright/test'
import { enterTitle } from './helpers'

test('Kin emits multiple short speech pulses with static reduced-motion text', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    const scope = window as typeof window & { __dialogueTones?: number[] }
    scope.__dialogueTones = []
    const create = AudioContext.prototype.createOscillator
    AudioContext.prototype.createOscillator = function () {
      const oscillator = create.call(this)
      const start = oscillator.start.bind(oscillator)
      oscillator.start = (at?: number) => {
        scope.__dialogueTones!.push(oscillator.frequency.value)
        start(at)
      }
      return oscillator
    }
  })
  await enterTitle(page)
  await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
  await page.getByRole('button', { name: 'ข้ามบทนำ', exact: true }).click()
  await expect(page.locator('.kin-coach')).toHaveAttribute('data-tutorial-step', 'intro', {
    timeout: 20000,
  })
  await expect
    .poll(() =>
      page.evaluate(() => {
        const tones = (window as typeof window & { __dialogueTones: number[] }).__dialogueTones
        return tones.filter((hz) => [290, 326, 308].includes(hz)).length
      })
    )
    .toBeGreaterThanOrEqual(2)
  await page.getByRole('button', { name: 'ได้เลย หัวหน้า', exact: true }).click()
  await expect(page.locator('.kin-coach')).toHaveAttribute('data-tutorial-step', 'intro-joke')
  await expect(page.locator('.kin-line')).toContainText('อย่าเพิ่งเพิ่มอายุ')
})
