import { test, expect } from '@playwright/test'
import { enterGame, enterTitle } from './helpers'

const titles = ['ของที่หายไป', 'งานจากอาราซาก้า', 'คู่หูที่หายไป', 'ร่องรอยแรก', 'คนที่รออยู่']

test('BLACKBOX opener keeps the thief anonymous until the final challenge and leads to the same case objective', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await enterTitle(page)
  await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
  const story = page.locator('.story-screen')
  const turnChecks = [
    ['กุญแจยืนยันคำสั่ง'],
    ['ทีมกู้ภัย', 'แล้วทำไมต้องเป็นผม', 'หมายเลขหน่วยเก่า'],
    ['เปิดต้นฉบับดู', 'ตั้งแต่เขาหายตัว'],
    ['เขาลบเฉพาะช่วง', 'เก็บเครื่องไว้'],
    ['NULL', 'นายรู้เรื่องหน่วยเก่า', 'อาราซาก้าตัดอะไรออก'],
  ]
  for (let index = 0; index < titles.length; index++) {
    await expect(story).toHaveAttribute('data-shot', String(index))
    await expect(story.getByRole('heading', { level: 2 })).toHaveText(titles[index])
    if (index === 3) await expect(story).toContainText('CAM-07')
    for (const [line, fragment] of turnChecks[index].entries()) {
      await expect(story).toHaveAttribute('data-line', String(line))
      await expect(page.locator('.story-lines > p')).toHaveCount(1)
      await expect(page.locator('.story-lines')).toContainText(fragment)
      if (index < 4) await expect(story).not.toContainText('NULL')
      if (index !== 4 || line !== turnChecks[index].length - 1)
        await page.getByRole('button', { name: 'ถัดไป', exact: true }).click()
    }
  }
  await page.getByRole('button', { name: 'เริ่มตามรอย', exact: true }).click()
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 })
  await expect(page.locator('.world-frame')).toHaveAttribute('data-view', 'map')
  await expect(page.locator('.objective strong')).toHaveText(
    'ตรวจหลักฐานที่ร้านอรุณ เพื่อตามเส้นทาง BLACKBOX'
  )
  expect(errors).toEqual([])
})

test('casebook agrees that Arasaka owns BLACKBOX and the camera is only an evidence source', async ({
  page,
}) => {
  await enterGame(page)
  await page.getByRole('button', { name: 'สมุดคดี', exact: true }).click()
  const journal = page.getByRole('dialog', { name: /สมุดคดี/ })
  await expect(journal).toContainText('อาราซาก้า')
  await expect(journal).toContainText('ยืนยันคำสั่ง')
  await expect(journal).toContainText('CAM-07')
  await expect(journal).not.toContainText('อุปกรณ์ต้นแบบจากห้องแล็บ TechCare')
  await expect(journal).not.toContainText('คนร้ายคือคู่หู')
})

test('all five Thai dialogue frames and navigation remain usable at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await enterTitle(page)
  await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
  for (let index = 0; index < titles.length; index++) {
    const next = page.getByRole('button', {
      name: index === 4 ? 'เริ่มตามรอย' : 'ถัดไป',
      exact: true,
    })
    await expect(next).toBeInViewport()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const lines = page.locator('.story-lines')
    expect(
      await lines.evaluate(
        (e) => e.scrollHeight <= e.clientHeight + 1 || getComputedStyle(e).overflowY !== 'hidden'
      )
    ).toBe(true)
    if (index === 4)
      await page.screenshot({ path: 'evidence/blackbox-story-narrow.png', fullPage: true })
    else await next.click()
  }
})

test('menu cursor follows the true click position and parallax leaves all menu hit targets fixed', async ({
  page,
}) => {
  await enterTitle(page)
  await page.evaluate(() => document.fonts.ready)
  const title = page.locator('.title-screen')
  const play = page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true })
  const heading = title.getByRole('heading', { level: 1 })
  const playBefore = await play.boundingBox()
  const titleBefore = await heading.boundingBox()
  await page.mouse.move(1200, 180)
  await expect(title).toHaveAttribute('data-menu-cursor', 'active')
  const cursor = page.locator('.menu-reticle')
  await expect(cursor).toHaveAttribute('data-visible', 'true')
  const box = await cursor.boundingBox()
  expect(box).not.toBeNull()
  expect(Math.abs(box!.x + box!.width / 2 - 1200)).toBeLessThan(1)
  expect(Math.abs(box!.y + box!.height / 2 - 180)).toBeLessThan(1)
  const offset = await title.evaluate((e) => ({
    x: parseFloat(e.style.getPropertyValue('--menu-x')),
    y: parseFloat(e.style.getPropertyValue('--menu-y')),
  }))
  expect(Math.abs(offset.x)).toBeLessThanOrEqual(8)
  expect(Math.abs(offset.y)).toBeLessThanOrEqual(8)
  expect(Math.abs(offset.x) + Math.abs(offset.y)).toBeGreaterThan(0)
  expect(await play.boundingBox()).toEqual(playBefore)
  expect(await heading.boundingBox()).toEqual(titleBefore)

  const settings = page.getByRole('button', { name: 'ตั้งค่า', exact: true })
  await settings.hover()
  await expect(cursor).toHaveAttribute('data-hover', 'true')
  await page.mouse.down()
  await expect(cursor).toHaveAttribute('data-pressed', 'true')
  await page.mouse.up()
  await expect(page.getByRole('dialog', { name: 'ตั้งค่า', exact: true })).toBeVisible()
  await expect(cursor).toBeHidden()
  expect(await title.getAttribute('data-menu-cursor')).toBeNull()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'แฟ้มเจ้าหน้าที่', exact: true }).click()
  await page.getByRole('button', { name: 'ผู้เยี่ยมชม', exact: true }).click()
  const name = page.getByRole('textbox', { name: 'ชื่อเจ้าหน้าที่', exact: true })
  await name.hover()
  expect(await name.evaluate((e) => getComputedStyle(e).cursor)).not.toBe('none')
})

test('all four menu buttons share keyboard feedback and reduced motion retains native pointing', async ({
  page,
}) => {
  await enterTitle(page)
  await page.evaluate(() => document.fonts.ready)
  const buttons = page.locator('.title-menu button')
  await expect(buttons).toHaveCount(4)
  // The real account→guest path restores Login focus; start this tab-order check explicitly.
  const heading = page.locator('.title-screen').getByRole('heading', { level: 1 })
  await heading.focus()
  await expect(heading).toBeFocused()
  for (let index = 0; index < 4; index++) {
    const button = buttons.nth(index)
    await expect(button).toHaveAttribute('data-feedback', 'menu')
    await page.keyboard.press('Tab')
    await expect(button).toBeFocused()
    const feedback = await button.evaluate((e) => ({
      outline: getComputedStyle(e).outlineStyle,
      animation: getComputedStyle(e, '::after').animationName,
    }))
    expect(feedback.outline).toBe('solid')
    expect(feedback.animation).not.toBe('none')
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.mouse.move(1200, 200)
  await expect(page.locator('.entry-shell')).toHaveAttribute('data-reduced-motion', 'true')
  await expect(page.locator('.menu-reticle')).toBeHidden()
  await expect(page.locator('.title-screen')).not.toHaveAttribute('data-menu-cursor', 'active')
  await buttons.first().hover()
  expect(await buttons.first().evaluate((e) => getComputedStyle(e).cursor)).not.toBe('none')
  expect(await buttons.first().evaluate((e) => getComputedStyle(e, '::after').animationName)).toBe(
    'none'
  )
})
