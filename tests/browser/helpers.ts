import { expect, type Page } from '@playwright/test'

/** Game regressions use the same reader → account page → guest action as a player. */
export async function passAccessGate(page: Page) {
  await expect(page.locator('.entry-shell')).toBeVisible()
  if ((await page.locator('.entry-shell').getAttribute('data-screen')) === 'access') {
    await page.getByRole('button', { name: 'เปิดช่องเข้าสู่ระบบ', exact: true }).click()
    const accountPage = page.getByRole('region', { name: 'แฟ้มเจ้าหน้าที่', exact: true })
    await expect(accountPage).toBeVisible()
    await accountPage
      .getByRole('button', {
        name: /^(ขอลองเล่นผู้เยี่ยมชมก่อน →|เล่นแบบผู้เยี่ยมชมแทน|เล่นแบบผู้เยี่ยมชม)$/,
      })
      .click()
    await expect(page.locator('.entry-shell')).toHaveAttribute('data-screen', 'title')
  }
}

export async function enterTitle(page: Page) {
  await page.goto('/')
  await passAccessGate(page)
}

/** Legacy feature checks use the real skip action; dedicated tutorial checks never call this. */
export async function dismissTutorial(page: Page) {
  const status = await page.evaluate(() => {
    try {
      const generation =
        JSON.parse(localStorage.getItem('techcare.player.v1:guest') ?? 'null')?.player
          ?.generation ?? 0
      return JSON.parse(localStorage.getItem(`techcare.tutorial.v1:guest:${generation}`) ?? 'null')
        ?.status
    } catch {
      return null
    }
  })
  if (status === 'completed' || status === 'skipped') return
  const skip = page.getByRole('button', { name: 'ข้ามการฝึก', exact: true })
  await expect(skip).toBeVisible({ timeout: 15000 })
  await skip.click()
  await expect(page.locator('.kin-coach')).toHaveCount(0)
}

export async function enterGame(page: Page) {
  await enterTitle(page)
  await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
  await expect(page.locator('.story-screen')).toBeVisible()
  await page.getByRole('button', { name: 'ข้ามบทนำ', exact: true }).click()
  // Deferred renderers can take longer than 5s on a cold software-rendered Chrome boot.
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 })
  if (await page.locator('.city-map').count())
    await expect(page.locator('.city-map')).toHaveAttribute('data-ready', 'true', {
      timeout: 15000,
    })
  await expect(page.getByText('กำลังเตรียมฉาก…')).toBeHidden({ timeout: 15000 })
  await dismissTutorial(page)
}

export async function selectScene(page: Page, name: RegExp) {
  const nav = page.getByRole('navigation', { name: 'เลือกฉากตัวอย่าง' })
  if (!(await nav.isVisible())) {
    await page.getByRole('button', { name: 'เปิดเมนูเกม', exact: true }).click()
  }
  if (!(await nav.isVisible())) {
    await page.locator('summary').filter({ hasText: 'ฉากและข้อมูลต้นแบบ' }).click()
  }
  await nav.getByRole('button', { name }).click()
  const menu = page.getByRole('dialog', { name: 'เมนูภารกิจ', exact: true })
  if (await menu.isVisible()) {
    await menu.getByRole('button', { name: 'กลับสู่เกม', exact: true }).click()
  }
  await expect(page.getByText('กำลังเตรียมฉาก…')).toBeHidden()
}

export async function openSettings(page: Page) {
  const menu = page.getByRole('button', { name: 'เปิดเมนูเกม', exact: true })
  if (await menu.isVisible()) await menu.click()
  await page.getByRole('button', { name: 'ตั้งค่า', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'ตั้งค่า', exact: true })).toBeVisible()
}
