import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/account-config', (route) =>
    route.fulfill({ json: { configured: false } })
  )
})

test('holding E opens the real account panel; early release cancels without taking over input', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('.access-gate')).toBeVisible()
  await expect(
    page.locator('.access-gate').getByRole('button', { name: 'เล่นแบบผู้เยี่ยมชม', exact: true })
  ).toHaveCount(0)
  await page.keyboard.down('e')
  await page.waitForTimeout(240)
  await expect(
    page.getByRole('progressbar', { name: 'เปิดช่องเชื่อมต่อบัญชี' })
  ).not.toHaveAttribute('aria-valuenow', '0')
  await page.keyboard.up('e')
  await expect(page.locator('.account-screen')).toHaveCount(0)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('progressbar', { name: 'เปิดช่องเชื่อมต่อบัญชี' })).toHaveAttribute(
    'aria-valuenow',
    '0'
  )
  await page.keyboard.down('e')
  await expect(page.getByRole('region', { name: 'แฟ้มเจ้าหน้าที่', exact: true })).toBeVisible({
    timeout: 3000,
  })
  await page.keyboard.up('e')
  await page.getByRole('button', { name: 'ผู้เยี่ยมชม', exact: true }).click()
  const name = page.getByRole('textbox', { name: 'ชื่อเจ้าหน้าที่', exact: true })
  await name.fill('operator')
  await name.press('End')
  await page.keyboard.down('e')
  await page.waitForTimeout(1250)
  await page.keyboard.up('e')
  await expect(name).toHaveValue('operatore')
})

test('reader click opens two physical door leaves once before the account page', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const gate = page.locator('.access-gate')
  await expect(page.getByText('มีคดีรออยู่ข้างใน', { exact: true })).toHaveCount(0)
  await expect(page.locator('.access-gate-copy')).toHaveCount(0)
  await page.getByRole('button', { name: 'เปิดช่องเข้าสู่ระบบ', exact: true }).click()
  await expect(gate).toHaveAttribute('data-phase', 'opening')
  await expect(page.locator('.account-screen')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'เปิดช่องเข้าสู่ระบบ', exact: true })
  ).toBeDisabled()
  await page.keyboard.down('e')
  await page.waitForTimeout(300)
  await page.keyboard.up('e')
  const offset = await page
    .locator('.access-door-left')
    .evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41)
  expect(offset).toBeLessThan(-5)
  await expect(page.getByRole('region', { name: 'แฟ้มเจ้าหน้าที่', exact: true })).toBeVisible()
  await page.waitForTimeout(1100)
  await expect(page.locator('.account-screen')).toHaveCount(1)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('reduced motion suppresses glitch and ambient motion and snaps the door transition', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.gate-light-emission').first()).toHaveCSS('animation-name', 'none')
  const glitch = await page
    .locator('.access-reader-label .gate-glitch')
    .first()
    .evaluate((el) => getComputedStyle(el, '::before').animationName)
  expect(glitch).toBe('none')
  await page.getByRole('button', { name: 'เปิดช่องเข้าสู่ระบบ', exact: true }).click()
  await expect(page.getByRole('region', { name: 'แฟ้มเจ้าหน้าที่', exact: true })).toBeVisible({
    timeout: 700,
  })
})

test('unconfigured Neon is honest, account forms do not claim email delivery, guest still plays', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'เปิดช่องเข้าสู่ระบบ', exact: false }).click()
  await expect(
    page.getByText('ระบบบัญชีคลาวด์ยังไม่ได้เชื่อมต่อในเว็บนี้', { exact: false })
  ).toBeVisible()
  await page.getByRole('button', { name: 'สมัครบัญชี', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'สมัครและรับรหัสยืนยัน', exact: true })
  ).toBeDisabled()
  await page.getByRole('button', { name: 'ขอลองเล่นผู้เยี่ยมชมก่อน →', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
  await expect(page.locator('.story-screen')).toBeVisible()
})

test('menu clock follows Bangkok while Blackbox wave respects reduced motion', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-01T09:15:30.000Z') })
  await page.clock.pauseAt(new Date('2026-11-01T09:15:31.000Z'))
  await page.goto('/')
  await expect(page.getByLabel('เวลาประเทศไทย')).toContainText('16:15:31')
  await page.clock.fastForward(2000)
  await expect(page.getByLabel('เวลาประเทศไทย')).toContainText('16:15:33')
  // This test deliberately pauses browser time; advance the authored door timeout explicitly.
  await page.getByRole('button', { name: 'เปิดช่องเข้าสู่ระบบ', exact: true }).click()
  await expect(page.locator('.access-gate')).toHaveAttribute('data-phase', 'opening')
  await page.clock.runFor(1000)
  await page.getByRole('button', { name: 'ขอลองเล่นผู้เยี่ยมชมก่อน →', exact: true }).click()
  await page.getByRole('button', { name: 'ตั้งค่า', exact: true }).click()
  await page.getByRole('checkbox', { name: 'ลดการเคลื่อนไหว', exact: true }).check()
  await page.keyboard.press('Escape')
  await expect(page.locator('.entry-shell')).toHaveAttribute('data-reduced-motion', 'true')
  await expect(page.locator('.blackbox-wave i').first()).toHaveCSS('animation-name', 'none')
})

test('account form remains readable and keyboard-operable at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'เปิดช่องเข้าสู่ระบบ', exact: false }).click()
  const dialog = page.getByRole('region', { name: 'แฟ้มเจ้าหน้าที่', exact: true })
  await expect(dialog).toBeVisible()
  await page
    .locator('.account-tabs')
    .getByRole('button', { name: 'เข้าสู่ระบบ', exact: true })
    .click()
  await page.getByRole('textbox', { name: 'อีเมล', exact: true }).fill('operator@example.com')
  await page.getByLabel('รหัสผ่าน', { exact: true }).fill('test-password')
  await page.getByRole('button', { name: 'แสดงรหัสผ่าน', exact: true }).click()
  await expect(page.getByLabel('รหัสผ่าน', { exact: true })).toHaveAttribute('type', 'text')
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 2)).toBe(true)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('mocked Neon signup and OTP activate the verified cloud file, then sign-out returns to guest', async ({
  page,
}) => {
  // Fixtures exercise frontend state transitions only; they do not prove real email delivery.
  let user: { id: string; email: string; name: string; emailVerified: boolean } | null = null
  const profile = {
    name: 'เจ้าหน้าที่ทดสอบ',
    case: { version: 1, completed: [], currentArea: 'base' },
    revision: 0,
    generation: 0,
    isNew: true,
  }
  await page.route('**/api/account-config', (route) =>
    route.fulfill({ json: { configured: true } })
  )
  await page.route('**/api/player', (route) => {
    expect(route.request().headers()['x-techcare-account']).toBe('operator-a')
    return route.fulfill({ json: profile })
  })
  await page.route('**/api/auth/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/sign-up/email'))
      user = {
        id: 'operator-a',
        email: 'operator@example.com',
        name: 'เจ้าหน้าที่ทดสอบ',
        emailVerified: false,
      }
    if (path.endsWith('/email-otp/verify-email') && user) user = { ...user, emailVerified: true }
    if (path.endsWith('/sign-out')) user = null
    await route.fulfill({
      json:
        path.endsWith('/send-verification-otp') || path.endsWith('/sign-out')
          ? { success: true }
          : user
            ? { user, session: { id: 'fixture-session', userId: user.id } }
            : null,
    })
  })
  await page.goto('/')
  await expect(page.locator('.access-gate')).toBeVisible()
  await page.getByRole('button', { name: 'เปิดช่องเข้าสู่ระบบ', exact: false }).click()
  await page.getByRole('button', { name: 'สมัครบัญชี', exact: true }).click()
  await page.getByRole('textbox', { name: 'ชื่อเจ้าหน้าที่', exact: true }).fill('เจ้าหน้าที่ทดสอบ')
  await page.getByRole('textbox', { name: 'อีเมล', exact: true }).fill('operator@example.com')
  await page.getByLabel('รหัสผ่าน', { exact: true }).fill('FixturePassword123!')
  await page.getByLabel('ยืนยันรหัสผ่าน', { exact: true }).fill('FixturePassword123!')
  await page.getByRole('button', { name: 'สมัครและรับรหัสยืนยัน', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'รหัสยืนยันอีเมล', exact: true })).toBeVisible()
  await expect(page.locator('.title-screen')).toHaveCount(0)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('textbox', { name: 'รหัสยืนยันอีเมล', exact: true }).fill('123456')
  await page.getByRole('button', { name: 'ยืนยันอีเมล', exact: true }).click()
  await expect(page.getByText('สัญญาณของคุณ พร้อมแล้ว', { exact: true })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'ชื่อเจ้าหน้าที่', exact: true })).toHaveValue(
    'เจ้าหน้าที่ทดสอบ'
  )
  await expect(page.getByText('✓ เซฟคลาวด์เป็นปัจจุบัน', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'ออกจากบัญชี', exact: true }).click()
  await expect(page.getByText('แฟ้มของคุณ จุดเริ่มภารกิจ', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true })).toBeEnabled()
})

test('choosing guest cancels a delayed account lookup instead of adopting its late session', async ({
  page,
}) => {
  let release!: () => void
  const delayed = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/api/account-config', (route) =>
    route.fulfill({ json: { configured: true } })
  )
  await page.route('**/api/auth/get-session', async (route) => {
    await delayed
    await route
      .fulfill({
        json: {
          user: {
            id: 'old-user',
            name: 'เจ้าหน้าที่คนก่อน',
            email: 'old@example.com',
            emailVerified: true,
          },
        },
      })
      .catch(() => {})
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'เปิดช่องเข้าสู่ระบบ', exact: false }).click()
  await page.getByRole('button', { name: 'เล่นแบบผู้เยี่ยมชมแทน', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true })).toBeEnabled()
  release()
  await page.waitForTimeout(250)
  await expect(page.locator('.officer-name')).toContainText('ผู้เยี่ยมชม')
  await expect(page.locator('.officer-name')).not.toContainText('เจ้าหน้าที่คนก่อน')
})

test('Kin phone presentation animates locally without covering the real reader', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const kin = page.locator('.gate-kin')
  await expect(kin).toBeVisible()
  await expect(kin.locator('img').first()).toBeVisible()
  await expect(page.locator('.gate-kin-phone-glow')).not.toHaveCSS('animation-name', 'none')
  const movingCharacter = await kin.evaluate((el) =>
    [el, ...el.querySelectorAll('*')]
      .filter((node) => !node.closest('.gate-kin-phone-glow'))
      .some((node) => getComputedStyle(node).animationName !== 'none')
  )
  expect(movingCharacter).toBe(true)
  await expect(
    page.locator('.access-gate').getByRole('button', { name: 'เล่นแบบผู้เยี่ยมชม', exact: true })
  ).toHaveCount(0)
  await page.getByRole('button', { name: 'เปิดช่องเข้าสู่ระบบ', exact: true }).click()
  await expect(page.getByRole('region', { name: 'แฟ้มเจ้าหน้าที่', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'ขอลองเล่นผู้เยี่ยมชมก่อน →', exact: true }).click()
  await expect(page.locator('.entry-shell')).toHaveAttribute('data-screen', 'title')
})

test('Kin and phone glow stop decorative motion when reduced motion is requested', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const kin = page.locator('.gate-kin')
  await expect(kin).toBeVisible()
  await expect(page.locator('.gate-kin-phone-glow')).toHaveCSS('animation-name', 'none')
  const movingCharacter = await kin.evaluate((el) =>
    [el, ...el.querySelectorAll('*')].some(
      (node) => getComputedStyle(node).animationName !== 'none'
    )
  )
  expect(movingCharacter).toBe(false)
})

test('a missing Kin portrait never blocks the reader or guest option on the account page', async ({
  page,
}) => {
  await page.goto('/')
  const image = page.locator('.gate-kin img').first()
  await expect(image).toBeVisible()
  const src = await image.getAttribute('src')
  expect(src).toBeTruthy()
  await page.route(new URL(src!, page.url()).href, (route) => route.abort())
  await page.reload()
  const reader = page.getByRole('button', { name: 'เปิดช่องเข้าสู่ระบบ', exact: true })
  await expect(reader).toBeEnabled()
  await reader.click()
  await expect(page.getByRole('region', { name: 'แฟ้มเจ้าหน้าที่', exact: true })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'ขอลองเล่นผู้เยี่ยมชมก่อน →', exact: true })
  ).toBeVisible()
})

test('narrow Kin placement keeps the reader hit target usable and the page within the viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const kin = page.locator('.gate-kin')
  await expect(kin).toBeVisible()
  const bounds = await kin.boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds!.x + bounds!.width).toBeGreaterThan(0)
  expect(bounds!.x).toBeLessThan(390)
  const reader = page.getByRole('button', { name: 'เปิดช่องเข้าสู่ระบบ', exact: true })
  const box = await reader.boundingBox()
  expect(box).not.toBeNull()
  const target = await page.evaluate(
    ({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.getAttribute('aria-label'),
    { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 }
  )
  expect(target).toBe('เปิดช่องเข้าสู่ระบบ')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await reader.click()
  await expect(page.getByRole('region', { name: 'แฟ้มเจ้าหน้าที่', exact: true })).toBeVisible()
})
