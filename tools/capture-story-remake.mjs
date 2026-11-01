import { chromium } from '@playwright/test'
import { copyFile, mkdir } from 'node:fs/promises'

await mkdir('evidence/story-remake', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
async function title(page) {
  await page.goto('http://127.0.0.1:5180/')
  await page.locator('.gate-kin-body').evaluate((img) => img.decode())
  await page.locator('audio[data-music-role="active"]').evaluate((a) => {
    window.__firstMusicGesture = performance.now()
    a.addEventListener('playing', () => { window.__firstMusicOnset = performance.now() }, { once: true })
  })
  await page.keyboard.down('e')
  await page.waitForTimeout(1250)
  await page.keyboard.up('e')
  await page.locator('.account-screen').waitFor()
  await page
    .getByRole('button', {
      name: /^(ขอลองเล่นผู้เยี่ยมชมก่อน →|เล่นแบบผู้เยี่ยมชมแทน|เล่นแบบผู้เยี่ยมชม)$/,
    })
    .click()
  await page.locator('.title-screen').waitFor()
}
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: 'evidence/story-remake/raw', size: { width: 1440, height: 900 } },
})
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await title(page)
await page.waitForFunction(() =>
  [...document.querySelectorAll('audio[data-music-role="active"]')].some(
    (a) => !a.paused && a.currentTime > 3.05
  )
)
console.log(
  'entry playback:',
  await page
    .locator('audio[data-music-role="active"]')
    .evaluate((a) => ({ src: a.getAttribute('src'), at: a.currentTime, volume: a.volume }))
)
console.log('gesture-to-playing ms:', await page.evaluate(() => Math.round(window.__firstMusicOnset - window.__firstMusicGesture)))
await page.screenshot({ path: 'evidence/story-remake/title-1440.png' })
await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
await page.locator('.story-screen').waitFor()
await page.screenshot({ path: 'evidence/story-remake/vault-ready-1440.png' })
await page.getByRole('button', { name: 'ถัดไป', exact: true }).click()
await page.waitForTimeout(1050)
await page.screenshot({ path: 'evidence/story-remake/vault-opening-1440.png' })
await page.locator('.story-screen[data-shot="1"]').waitFor()
await page.waitForTimeout(900)
await page.screenshot({ path: 'evidence/story-remake/briefing-1440.png' })
console.log(
  'story playback:',
  await page
    .locator('audio[data-music-role="active"]')
    .evaluate((a) => ({ src: a.getAttribute('src'), at: a.currentTime, volume: a.volume }))
)
await page.getByRole('button', { name: 'ถัดไป', exact: true }).click()
await page.waitForTimeout(500)
await page.getByRole('button', { name: 'ข้ามบทนำ', exact: true }).click()
await page.waitForFunction(() =>
  [...document.querySelectorAll('audio[data-music-role="active"]')].some(
    (a) => a.getAttribute('src')?.includes('midnight') && !a.paused && a.currentTime > 0.1
  )
)
await page.waitForTimeout(450)
console.log(
  'game playback:',
  await page
    .locator('audio[data-music-role="active"]')
    .evaluate((a) => ({ src: a.getAttribute('src'), at: a.currentTime, volume: a.volume }))
)
console.log('page errors:', errors)
await page.close()
await context.close()
await copyFile(await page.video().path(), 'evidence/story-remake/desktop-story.webm')
for (const viewport of [
  { width: 1280, height: 720 },
  { width: 1920, height: 1080 },
]) {
  const p = await browser.newPage({ viewport })
  await title(p)
  await p.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
  await p.locator('.story-screen').waitFor()
  await p.getByRole('button', { name: 'ถัดไป', exact: true }).click()
  await p.locator('.story-screen[data-shot="1"]').waitFor()
  await p.waitForTimeout(900)
  await p.screenshot({ path: `evidence/story-remake/briefing-${viewport.width}.png` })
  await p.close()
}
await browser.close()
