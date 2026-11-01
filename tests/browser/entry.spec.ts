import { test, expect } from '@playwright/test'
import {
  dismissTutorial,
  enterGame,
  enterTitle,
  passAccessGate,
  openSettings,
  selectScene,
} from './helpers'

test('title leads through all five manual story shots to the existing case map', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await enterTitle(page)
  await expect(page.locator('.entry-shell')).toHaveAttribute('data-screen', 'title')
  await expect(page.locator('canvas')).toHaveCount(0)
  await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
  const story = page.locator('.story-screen')
  await expect(story).toHaveAttribute('data-shot', '0')
  await expect(page.getByRole('button', { name: 'ย้อนกลับ', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'ถัดไป', exact: true }).click()
  await expect(story).toHaveAttribute('data-shot', '1')
  await page.getByRole('button', { name: 'ย้อนกลับ', exact: true }).click()
  await expect(story).toHaveAttribute('data-shot', '0')
  for (let i = 1; i <= 4; i++) {
    await page.getByRole('button', { name: 'ถัดไป', exact: true }).click()
    await expect(story).toHaveAttribute('data-shot', String(i))
  }
  await expect(story).toContainText('อยากได้ BLACKBOX คืน')
  await page.getByRole('button', { name: 'เริ่มตามรอย', exact: true }).click()
  await expect(page.locator('.world-frame')).toHaveAttribute('data-view', 'map')
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 })
  expect(errors).toEqual([])
})

test('Thai guest profile persists on its dedicated page and returns to its menu trigger', async ({
  page,
}) => {
  await enterTitle(page)
  const profile = page.getByRole('button', { name: 'แฟ้มเจ้าหน้าที่', exact: true })
  await profile.click()
  await page.getByRole('button', { name: 'ผู้เยี่ยมชม', exact: true }).click()
  const dialog = page.getByRole('region', { name: 'แฟ้มเจ้าหน้าที่', exact: true })
  await page.getByRole('textbox', { name: 'ชื่อเจ้าหน้าที่', exact: true }).fill('กิตติ · คิน')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: 'บันทึกแฟ้ม', exact: true })).toBeFocused()
  await dialog.getByRole('button', { name: 'บันทึกแฟ้ม', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(profile).toBeFocused()
  await page.reload()
  await passAccessGate(page)
  await profile.click()
  await page.getByRole('button', { name: 'ผู้เยี่ยมชม', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'ชื่อเจ้าหน้าที่', exact: true })).toHaveValue(
    'กิตติ · คิน'
  )
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('settings persist mute and reduced motion and remain usable when fullscreen is denied', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Element.prototype.requestFullscreen = () =>
      Promise.reject(new Error('Fullscreen denied for test'))
  })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await enterTitle(page)
  await openSettings(page)
  for (const name of ['ระดับเสียงเพลง', 'ระดับเอฟเฟกต์']) {
    const slider = page.getByRole('slider', { name, exact: true })
    await slider.focus()
    await slider.press('Home')
    await expect(slider).toHaveValue('0')
  }
  await page.getByRole('checkbox', { name: 'ลดการเคลื่อนไหว', exact: true }).check()
  await expect(page.locator('.entry-shell')).toHaveAttribute('data-reduced-motion', 'true')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /เต็มจอ/ })
    .click()
  await expect(page.getByRole('dialog', { name: 'ตั้งค่า', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.reload()
  await passAccessGate(page)
  await openSettings(page)
  await expect(page.getByRole('slider', { name: 'ระดับเสียงเพลง', exact: true })).toHaveValue('0')
  await expect(page.getByRole('slider', { name: 'ระดับเอฟเฟกต์', exact: true })).toHaveValue('0')
  await expect(page.getByRole('checkbox', { name: 'ลดการเคลื่อนไหว', exact: true })).toBeChecked()
  expect(errors).toEqual([])
})

test('mission menu pauses movement and Exit retains the same in-tab investigation state', async ({
  page,
}) => {
  await enterGame(page)
  await selectScene(page, /ร้านช่าง/)
  const world = page.locator('.world-frame')
  const position = async () => ({
    x: await world.getAttribute('data-player-x'),
    y: await world.getAttribute('data-player-y'),
  })
  await page.keyboard.down('d')
  await page.waitForTimeout(180)
  await page.keyboard.up('d')
  const before = await position()
  await page.getByRole('button', { name: 'เปิดเมนูเกม', exact: true }).click()
  await page.keyboard.down('a')
  await page.waitForTimeout(200)
  await page.keyboard.up('a')
  expect(await position()).toEqual(before)
  await page.getByRole('button', { name: 'ออกสู่หน้าเมนู', exact: true }).click()
  await expect(page.locator('.entry-shell')).toHaveAttribute('data-screen', 'title')
  await page.keyboard.press('j')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'กลับสู่ภารกิจ', exact: true }).click()
  await expect(world).toHaveAttribute('data-view', 'street')
  expect(await position()).toEqual(before)
  await page.getByRole('button', { name: 'เปิดเมนูเกม', exact: true }).click()
  await page.getByRole('button', { name: 'ออกสู่หน้าเมนู', exact: true }).click()
  await page.getByRole('button', { name: 'ดูบทนำอีกครั้ง', exact: true }).click()
  await expect(page.locator('.story-screen')).toHaveAttribute('data-shot', '0')
  await page.getByRole('button', { name: 'ข้ามบทนำ', exact: true }).click()
  await expect(world).toHaveAttribute('data-view', 'street')
  expect(await position()).toEqual(before)
  await page.reload()
  await passAccessGate(page)
  await expect(page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'กลับสู่ภารกิจ', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
  await page.getByRole('button', { name: 'ข้ามบทนำ', exact: true }).click()
  await expect(world).toHaveAttribute('data-view', 'map')
})

test('blocked local storage and unavailable story images do not prevent starting the game', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error('Storage unavailable')
    }
    Storage.prototype.setItem = () => {
      throw new Error('Storage unavailable')
    }
  })
  await page.route('**/*', (route) => {
    const request = route.request()
    if (
      request.resourceType() === 'image' &&
      /\/assets\/(story|entry|blackbox)\//.test(request.url())
    ) {
      return route.abort()
    }
    return route.continue()
  })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await enterTitle(page)
  await page.getByRole('button', { name: 'แฟ้มเจ้าหน้าที่', exact: true }).click()
  await page.getByRole('button', { name: 'ผู้เยี่ยมชม', exact: true }).click()
  await page.getByRole('textbox', { name: 'ชื่อเจ้าหน้าที่', exact: true }).fill('คินทดสอบ')
  await page.getByRole('button', { name: 'บันทึกแฟ้ม', exact: true }).click()
  // An unavailable persistent store may keep an inline warning in the dialog.
  const dialog = page.getByRole('dialog')
  if (await dialog.isVisible()) await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
  await expect(page.locator('.story-screen')).toContainText('03:12')
  await expect(page.locator('.story-art')).toHaveAttribute('data-art-error', 'true')
  await expect(page.getByRole('button', { name: 'ลองโหลดภาพใหม่', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'ข้ามบทนำ', exact: true }).click()
  await expect(page.locator('canvas')).toBeVisible()
  expect(errors).toEqual([])
})

test('narrow title and long Thai profile stay readable without horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await enterTitle(page)
  await expect(page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true })).toBeInViewport()
  await page.getByRole('button', { name: 'แฟ้มเจ้าหน้าที่', exact: true }).click()
  await page.getByRole('button', { name: 'ผู้เยี่ยมชม', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'ชื่อเจ้าหน้าที่', exact: true })
    .fill('เจ้าหน้าที่ทดสอบภาษาไทย')
  await page.getByRole('button', { name: 'บันทึกแฟ้ม', exact: true }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
  await expect(page.getByRole('button', { name: 'ถัดไป', exact: true })).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('one music player survives repeated story and game transitions without duplicate tracks', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const players = new Set<HTMLMediaElement>()
    const original = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function () {
      players.add(this)
      return original.call(this)
    }
    Object.defineProperty(window, '__musicPlayers', { value: players })
  })
  await enterTitle(page)
  expect(
    await page.evaluate(() => {
      const players = (window as unknown as { __musicPlayers: Set<HTMLMediaElement> })
        .__musicPlayers
      return [...players].some((player) => !player.paused)
    })
  ).toBe(false)
  await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
  await page.getByRole('button', { name: 'ข้ามบทนำ', exact: true }).click()
  await expect(page.locator('canvas')).toBeVisible()
  await dismissTutorial(page)
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: 'เปิดเมนูเกม', exact: true }).click()
    await page.getByRole('button', { name: 'ออกสู่หน้าเมนู', exact: true }).click()
    await page.getByRole('button', { name: 'ดูบทนำอีกครั้ง', exact: true }).click()
    await page.getByRole('button', { name: 'ข้ามบทนำ', exact: true }).click()
  }
  expect(
    await page.evaluate(() => {
      const players = (window as unknown as { __musicPlayers: Set<HTMLMediaElement> })
        .__musicPlayers
      return [...players].filter((player) => !player.paused).length
    })
  ).toBeLessThanOrEqual(1)
})
