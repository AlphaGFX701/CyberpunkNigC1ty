import { chromium } from '@playwright/test'
import { copyFile, mkdir } from 'node:fs/promises'

await mkdir('evidence', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: 'evidence/recordings', size: { width: 1280, height: 720 } },
})
const page = await context.newPage()
await page.goto('http://127.0.0.1:5180/')
await page.locator('.gate-kin-body').evaluate(img => img.decode())
await page.waitForTimeout(1200)
await page.screenshot({ path: 'evidence/kin-phone-gate-1280.png' })
await page.waitForTimeout(4800)
await page.keyboard.down('e')
await page.waitForTimeout(1250)
await page.keyboard.up('e')
await page.locator('.account-screen').waitFor({ state: 'visible' })
await page.screenshot({ path: 'evidence/kin-phone-account-after-door.png' })
await page.waitForTimeout(650)
await page.close()
await context.close()
const video = await page.video().path()
await copyFile(video, 'evidence/kin-phone-gate-final.webm')
for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  const p = await browser.newPage({ viewport })
  await p.goto('http://127.0.0.1:5180/')
  await p.locator('.gate-kin-body').evaluate(img => img.decode())
  await p.waitForTimeout(700)
  await p.screenshot({ path: `evidence/kin-phone-gate-${viewport.width}.png` })
  await p.close()
}
await browser.close()
console.log('Kin gate screenshots and actual-motion recording saved in evidence/.')
