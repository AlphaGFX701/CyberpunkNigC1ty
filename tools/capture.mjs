import { chromium, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
await mkdir('evidence', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
})
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.goto('http://127.0.0.1:5180/')
await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
await page.getByRole('button', { name: 'ข้ามบทนำ', exact: true }).click()
await expect(page.locator('.city-map')).toHaveAttribute('data-ready', 'true', { timeout: 20000 })
await page.getByRole('button', { name: 'ข้ามการฝึก', exact: true }).click()
await page.waitForTimeout(500)
await page.screenshot({ path: 'evidence/city-wide.png', fullPage: true })
for (const [name, file] of [
  ['ร้านช่างอรุณ', 'street'],
  ['ภายในกล้อง', 'device'],
  ['ห้องบอส', 'boss'],
]) {
  await page.getByRole('button', { name: 'เปิดเมนูเกม', exact: true }).click()
  await page.locator('summary').filter({ hasText: 'ฉากและข้อมูลต้นแบบ' }).click()
  await page
    .getByRole('navigation', { name: 'เลือกฉากตัวอย่าง' })
    .getByRole('button', { name: new RegExp(name) })
    .click()
  await page.getByRole('button', { name: 'กลับสู่เกม', exact: true }).click()
  await expect(page.getByText('กำลังเตรียมฉาก…')).toBeHidden({ timeout: 15000 })
  await page.waitForTimeout(500)
  await page.screenshot({ path: `evidence/${file}.png`, fullPage: true })
}
await page.getByRole('button', { name: /ดูหน้าต่างโจทย์บอส/ }).click()
await page.locator('iframe').contentFrame().getByText('ยังไม่พบไฟล์ภาพ').waitFor()
await page.screenshot({ path: 'evidence/terminal.png', fullPage: true })
console.log(JSON.stringify({ errors }))
await browser.close()
