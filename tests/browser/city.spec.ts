import { test, expect, type Page } from '@playwright/test'
import {
  dismissTutorial,
  enterGame,
  enterTitle,
  openSettings,
  passAccessGate,
  selectScene,
} from './helpers'

async function showAreas(page: Page) {
  const arun = page.getByRole('button', { name: 'สำรวจ ร้านช่างอรุณ', exact: true })
  if (!(await arun.isVisible()))
    await page.getByRole('button', { name: 'รายชื่อพื้นที่', exact: true }).click()
}

async function inspectArea(page: Page, name: string) {
  await showAreas(page)
  await page.getByRole('button', { name: `สำรวจ ${name}`, exact: true }).click()
  await expect(page.locator('.city-detail')).toBeVisible()
}

async function recoverCamera(page: Page) {
  await selectScene(page, /ภายในกล้อง/)
  await page.keyboard.down('d')
  await page.keyboard.down('s')
  await page.waitForTimeout(350)
  await page.keyboard.up('d')
  await page.keyboard.up('s')
  await page.getByRole('button', { name: /โต้ตอบกับจุดใกล้ตัว/ }).click()
  await page
    .getByLabel(/evidence.html/)
    .fill('<img src="suspect.png" alt="ผู้ถือกล่องสีดำผ่านร้านอรุณ">')
  await page.getByRole('button', { name: /ตรวจและกู้ภาพ/ }).click()
  await expect(page.getByRole('status')).toContainText('กู้ภาพสำเร็จ')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'แผนที่เมือง', exact: true }).click()
  await expect(page.locator('.city-map')).toBeVisible()
}

async function startFromTitle(page: Page) {
  await enterTitle(page)
  await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
  await page.getByRole('button', { name: 'ข้ามบทนำ', exact: true }).click()
  await expect(page.locator('.city-map')).toBeVisible({ timeout: 15000 })
  await dismissTutorial(page)
}

test('3D map starts with only accessible pins and inspecting a destination does not teleport Kin', async ({
  page,
}) => {
  test.setTimeout(45000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await enterGame(page)
  const city = page.locator('.city-map')
  await expect(city).toHaveAttribute('data-current-area', 'base')
  await expect(page.locator('[data-city-pin="arun"]')).toBeVisible({ timeout: 15000 })
  await expect(page.locator('[data-city-pin="relay"], [data-city-pin="control"]')).toHaveCount(0)
  await page.screenshot({
    path: 'evidence/city-desktop.png',
    fullPage: true,
    animations: 'disabled',
  })
  await page.locator('[data-city-pin="arun"]').click()
  await expect(page.locator('.city-detail')).toContainText('ร้านช่างอรุณ')
  await expect(city).toHaveAttribute('data-current-area', 'base')
  await page.screenshot({
    path: 'evidence/city-destination.png',
    fullPage: true,
    animations: 'disabled',
  })
  await page.getByRole('button', { name: 'ปิดข้อมูลพื้นที่', exact: true }).click()
  await showAreas(page)
  await expect(page.getByRole('button', { name: 'สำรวจ สถานีสื่อสาร', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'สำรวจ ศูนย์ควบคุม', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'สำรวจ ร้านช่างอรุณ', exact: true }).click()
  await expect(page.locator('.city-detail')).toContainText('ร้านช่างอรุณ')
  await expect(city).toHaveAttribute('data-current-area', 'base')
  await page.getByRole('button', { name: 'เข้าสำรวจ', exact: true }).click()
  await expect(page.locator('.world-frame')).toHaveAttribute('data-view', 'street', {
    timeout: 15000,
  })
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ร้านช่างอรุณ')
  await expect(page.getByText('กำลังเตรียมฉาก…')).toBeHidden({ timeout: 15000 })
  await expect(page.locator('canvas')).toHaveCount(1)
  await page.getByRole('button', { name: 'แผนที่เมือง', exact: true }).click()
  await expect(city).toHaveAttribute('data-current-area', 'arun')
  await expect(page.locator('canvas')).toHaveCount(1)
  // A new Phaser instance and Three renderer own the playfield on each transition.
  // Repeat it to catch delayed teardown callbacks reaching the next renderer.
  for (let visit = 0; visit < 2; visit++) {
    await expect(city).toHaveAttribute('data-ready', 'true')
    await inspectArea(page, 'ร้านช่างอรุณ')
    await page.getByRole('button', { name: 'เข้าสำรวจ', exact: true }).click()
    await expect(page.locator('.world-frame')).toHaveAttribute('data-view', 'street')
    await expect(page.getByText('กำลังเตรียมฉาก…')).toBeHidden({ timeout: 15000 })
    await expect(page.locator('.world canvas')).toBeVisible()
    await expect(page.locator('canvas')).toHaveCount(1)
    await page.getByRole('button', { name: 'แผนที่เมือง', exact: true }).click()
    await expect(city).toHaveAttribute('data-ready', 'true')
    await expect(page.locator('canvas')).toHaveCount(1)
  }
  await openSettings(page)
  await page.getByRole('checkbox', { name: 'ลดการเคลื่อนไหว', exact: true }).check()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'เมนูภารกิจ', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(city).toHaveAttribute('data-ready', 'true')
  await expect(page.locator('.city-canvas')).toHaveAttribute('data-camera-paused', 'false')
  await expect(page.locator('canvas')).toHaveCount(1)
  expect(errors).toEqual([])
})

test('camera controls change the real 3D pose, drag does not select a pin, and pause gates orbit', async ({
  page,
}) => {
  await enterGame(page)
  const camera = page.locator('.city-canvas')
  await expect(camera).toHaveAttribute('data-camera-position', /.+/)
  const original = await camera.getAttribute('data-camera-position')
  await page.getByRole('button', { name: 'หมุนขวา', exact: true }).click()
  await expect.poll(() => camera.getAttribute('data-camera-position')).not.toBe(original)
  const beforeZoom = Number(await camera.getAttribute('data-camera-distance'))
  await page.getByRole('button', { name: 'ซูมเข้า', exact: true }).click()
  await expect
    .poll(async () => Number(await camera.getAttribute('data-camera-distance')))
    .toBeLessThan(beforeZoom)
  await page.getByRole('button', { name: 'คืนมุมมอง', exact: true }).click()
  await expect.poll(() => camera.getAttribute('data-camera-position')).toBe(original)
  const bounds = await camera.boundingBox()
  expect(bounds).not.toBeNull()
  // Start on the empty upper-right canvas rather than a projected DOM pin.
  await page.mouse.move(bounds!.x + bounds!.width * 0.7, bounds!.y + bounds!.height * 0.2)
  await page.mouse.down()
  await page.mouse.move(bounds!.x + bounds!.width * 0.8, bounds!.y + bounds!.height * 0.3, {
    steps: 10,
  })
  await page.mouse.up()
  await expect.poll(() => camera.getAttribute('data-camera-position')).not.toBe(original)
  await expect(page.locator('.city-detail')).toBeHidden()
  await page.getByRole('button', { name: 'เปิดเมนูเกม', exact: true }).click()
  await expect(camera).toHaveAttribute('data-camera-paused', 'true')
  const paused = await camera.getAttribute('data-camera-position')
  await page.mouse.move(bounds!.x + 20, bounds!.y + 100)
  await page.mouse.down()
  await page.mouse.move(bounds!.x + 150, bounds!.y + 100, { steps: 4 })
  await page.mouse.up()
  expect(await camera.getAttribute('data-camera-position')).toBe(paused)
  await page.keyboard.press('Escape')
  await expect(camera).toHaveAttribute('data-camera-paused', 'false')
})

test('genuine recovery opens relay intel, reading it opens control intel, and progress survives reload', async ({
  page,
}) => {
  await enterGame(page)
  await recoverCamera(page)
  await expect(page.locator('[data-city-pin="relay"]')).toBeVisible({ timeout: 15000 })
  await expect(page.locator('[data-city-pin="control"]')).toHaveCount(0)
  await inspectArea(page, 'สถานีสื่อสาร')
  await page.getByRole('button', { name: 'อ่านข่าวกรอง', exact: true }).click()
  const intel = page.getByRole('dialog', { name: 'ข่าวกรอง — สถานีสื่อสาร', exact: true })
  await expect(intel).toBeVisible()
  await expect(page.locator('.city-map')).toHaveAttribute('data-current-area', 'relay')
  await expect(intel).toContainText(/ภารกิจ|พัฒนา/)
  await intel.getByRole('button', { name: 'บันทึกเบาะแส', exact: true }).click()
  await expect(page.locator('[data-city-pin="control"]')).toBeVisible({ timeout: 15000 })
  await page.reload()
  await passAccessGate(page)
  await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
  await page.getByRole('button', { name: 'ข้ามบทนำ', exact: true }).click()
  await expect(page.locator('[data-city-pin="relay"]')).toBeVisible({ timeout: 15000 })
  await expect(page.locator('[data-city-pin="control"]')).toBeVisible()
  await inspectArea(page, 'ศูนย์ควบคุม')
  await page.getByRole('button', { name: 'อ่านข่าวกรอง', exact: true }).click()
  await expect(
    page.getByRole('dialog', { name: 'ข่าวกรอง — ศูนย์ควบคุม', exact: true })
  ).toBeVisible()
})

test('boss preview success cannot unlock districts and starting a new case keeps profile and settings', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'techcare.entry.v1',
      JSON.stringify({
        version: 1,
        name: 'เจ้าหน้าที่สำรวจ',
        music: 0,
        sfx: 0,
        reduceMotion: false,
      })
    )
  })
  await enterGame(page)
  await selectScene(page, /ห้องบอส/)
  await page.getByRole('button', { name: /ดูหน้าต่างโจทย์บอส/ }).click()
  await page
    .getByLabel(/evidence.html/)
    .fill('<img src="suspect.png" alt="คนถือกล่องสีดำหน้าร้านช่าง">')
  await page.getByRole('button', { name: /ตรวจและกู้ภาพ/ }).click()
  await expect(page.getByRole('status')).toContainText('กู้ภาพสำเร็จ')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'แผนที่เมือง', exact: true }).click()
  await expect(page.locator('[data-city-pin="relay"]')).toHaveCount(0)
  await recoverCamera(page)
  await expect(page.locator('[data-city-pin="relay"]')).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: 'เปิดเมนูเกม', exact: true }).click()
  await page.getByRole('button', { name: 'เริ่มคดีใหม่', exact: true }).click()
  await page.getByRole('button', { name: 'ยืนยันเริ่มคดีใหม่', exact: true }).click()
  await expect(page.locator('.story-screen')).toHaveAttribute('data-shot', '0')
  await page.getByRole('button', { name: 'ข้ามบทนำ', exact: true }).click()
  await expect(page.locator('[data-city-pin="relay"]')).toHaveCount(0)
  await expect(page.locator('.city-map')).toHaveAttribute('data-current-area', 'base')
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('techcare.entry.v1')!).name)
  ).toBe('เจ้าหน้าที่สำรวจ')
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('techcare.entry.v1')!).music)
  ).toBe(0)
})

test('a WebGL failure keeps the accessible destination list usable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (contextId: string, ...args: any[]) {
      if (contextId === 'webgl' || contextId === 'webgl2' || contextId === 'experimental-webgl')
        return null
      return original.apply(this, [contextId, ...args] as any)
    } as typeof HTMLCanvasElement.prototype.getContext
  })
  await startFromTitle(page)
  await page.getByRole('button', { name: 'ใช้แผนที่แบบรายการ', exact: true }).click()
  await expect(page.getByRole('button', { name: 'สำรวจ ร้านช่างอรุณ', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'สำรวจ ร้านช่างอรุณ', exact: true }).click()
  await page.getByRole('button', { name: 'เข้าสำรวจ', exact: true }).click()
  await expect(page.locator('.world-frame')).toHaveAttribute('data-view', 'street', {
    timeout: 15000,
  })
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 })
})

test('reduced-motion and narrow map controls stay usable without horizontal overflow', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await enterGame(page)
  await expect(page.locator('.entry-shell')).toHaveAttribute('data-reduced-motion', 'true')
  await page.getByRole('button', { name: 'หมุนขวา', exact: true }).click()
  await page.getByRole('button', { name: 'คืนมุมมอง', exact: true }).click()
  await inspectArea(page, 'ร้านช่างอรุณ')
  await expect(page.getByRole('button', { name: 'เข้าสำรวจ', exact: true })).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({
    path: 'evidence/city-narrow.png',
    fullPage: true,
    animations: 'disabled',
  })
})
