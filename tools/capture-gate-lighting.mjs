import { chromium } from '@playwright/test'
import { copyFile, mkdir } from 'node:fs/promises'

await mkdir('evidence/recordings', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
const context = await browser.newContext({ viewport: { width: 1280, height: 720 },
  recordVideo: { dir: 'evidence/recordings', size: { width: 1280, height: 720 } } })
const page = await context.newPage()
await page.goto('http://127.0.0.1:5180/')
await page.locator('.gate-kin-body').evaluate(img => img.decode())
await page.waitForTimeout(1400)
await page.screenshot({ path: 'evidence/gate-neon-live-1280.png' })
console.log('rain count:', await page.locator('.access-window-rain').count())
console.log('first light sample:', await page.locator('.gate-light-emission').evaluateAll(nodes => nodes.map(n => getComputedStyle(n).opacity)))
await page.waitForTimeout(5900)
console.log('second light sample:', await page.locator('.gate-light-emission').evaluateAll(nodes => nodes.map(n => getComputedStyle(n).opacity)))
await page.keyboard.down('e')
await page.locator('.account-screen').waitFor({ state: 'visible' })
await page.keyboard.up('e')
await page.close()
await context.close()
await copyFile(await page.video().path(), 'evidence/gate-neon-lights.webm')
for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
  const p = await browser.newPage({ viewport })
  await p.goto('http://127.0.0.1:5180/')
  await p.locator('.gate-kin-body').evaluate(img => img.decode())
  for (const phase of ['bright', 'dim']) {
    await p.locator('.gate-light-fixture').evaluateAll((nodes, phase) => {
      const dim = { door: .44, ceiling: .26, amber: .46, reader: .8 }
      for (const node of nodes) {
        const animation = node.querySelector('.gate-light-emission').getAnimations()[0]
        animation.pause()
        const timing = animation.effect.getTiming()
        animation.currentTime = Number(timing.delay) + Number(timing.duration) * (1 + (phase === 'bright' ? .15 : dim[node.dataset.light]))
      }
    }, phase)
    await p.screenshot({ path: `evidence/gate-neon-${phase}-${viewport.width}.png` })
  }
  await p.close()
}
await browser.close()
