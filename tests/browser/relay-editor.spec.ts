import { test, expect, type Page } from '@playwright/test'
import { tasks as taskDefinitions, finalTask as finalDefinition } from '../../src/relay/content'
import { solveRelayPuzzle } from './relay-helpers'
import { expectNoAnswers } from './no-answers'
import { privateAnswers, withPrivateAnswers } from '../private-answers'
const tasks = withPrivateAnswers('relay', taskDefinitions)
const finalTask = { ...finalDefinition, solution: privateAnswers.relay[7] }

test.use({
  viewport: { width: 1440, height: 900 },
  actionTimeout: 10000,
  video: { mode: 'on', size: { width: 1440, height: 900 } },
})
test.afterEach(async ({ page }, info) => {
  if (info.status !== 'passed') return
  const video = page.video()
  await page.context().close()
  await video?.saveAs('evidence/relay/editor-minigames.webm')
})
async function setCode(page: Page, code: string) {
  const editor = page.locator('.cm-content')
  await editor.click()
  await editor.press('Control+a')
  await page.keyboard.insertText(code)
}
const getState = (page: Page) => page.evaluate(() => (window as any).relayEditorHarness.state())
async function open(page: Page, index: number) {
  await page.evaluate((index) => (window as any).relayEditorHarness.open(index), index)
  await expect(page.getByRole('dialog')).toBeVisible()
  await expectNoAnswers(page)
}
test('relay editor: seven real minigames, fixture navigation, runtime draft and final original record', async ({
  page,
}) => {
  test.setTimeout(140000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (message) => {
    if (message.type() === 'error') console.log('RELAY PREVIEW:', message.text())
  })
  await page.route('**/relay-editor-harness.html', async (route) => {
    const response = await page.request.get('/')
    const html = (await response.text()).replace(
      '/src/main.tsx',
      '/tests/browser/relay-editor-harness.tsx'
    )
    await route.fulfill({ status: 200, contentType: 'text/html', body: html })
  })
  await page.goto('/relay-editor-harness.html')
  await expect(page.locator('[data-puzzle-kind="connections"]')).toBeVisible()
  await page.getByRole('button', { name: 'ตรวจ Puzzle → เขียน HTML', exact: true }).click()
  await expect(page.locator('.cm-content')).toHaveCount(0)
  for (let i = 0; i < 7; i++) {
    if (i) await open(page, i)
    await solveRelayPuzzle(page, i)
    await setCode(page, tasks[i].solution)
    if (i === 0) {
      await setCode(page, 'abc')
      await page.locator('.cm-content').press('Control+End')
      await page.getByRole('button', { name: 'แทรก href', exact: true }).click()
      await expect(page.locator('.cm-content')).toHaveText('abchref=""')
      await page.locator('.cm-content').press('Control+z')
      await expect(page.locator('.cm-content')).toHaveText('abc')
      await setCode(
        page,
        '<a href="https://example.com" target="_top">ออกนอกพรีวิว</a><script>parent.location="https://example.com"</script>'
      )
      await expect(page.frameLocator('iframe').getByRole('link')).toHaveCount(0)
      await expect(page.locator('iframe')).toHaveAttribute('sandbox', 'allow-same-origin')
      expect(page.url()).toContain('/relay-editor-harness.html')
      await setCode(page, tasks[i].solution)
      const preview = page.frameLocator('iframe[title="พรีวิวหน้าเว็บภารกิจ"]')
      await preview.getByRole('link', { name: 'แฟ้มสถานี', exact: true }).click()
      await expect(preview.getByRole('heading', { name: 'แฟ้มสถานีฝั่งตะวันออก' })).toBeVisible()
      await expect(preview.getByRole('link', { name: 'เปิดบันทึกรับอุปกรณ์' })).toHaveCount(0)
      expect((await getState(page)).completed.length).toBe(0)
      await page.getByRole('button', { name: 'กลับพรีวิวโค้ด ↺', exact: true }).click()
      await expect(preview.getByRole('link', { name: 'แฟ้มสถานี', exact: true })).toBeVisible()
      await page.getByRole('button', { name: 'ดู Puzzle อีกครั้ง', exact: true }).click()
      await page.getByRole('button', { name: 'กลับไปเขียนโค้ด', exact: true }).click()
      await expect(page.locator('.cm-content')).toHaveText(tasks[i].solution)
      // Closing/reopening the editor preserves this runtime draft, scoped to the current owner.
      await page.keyboard.press('Escape')
      await open(page, 0)
      await expect(page.locator('.cm-content')).toHaveText(tasks[i].solution)
      await page.screenshot({ path: 'evidence/relay/editor.png' })
      for (const size of [
        { width: 1280, height: 720 },
        { width: 1920, height: 1080 },
      ]) {
        await page.setViewportSize(size)
        const box = await page
          .getByRole('button', { name: 'ส่งคำสั่งซ่อม ↵', exact: true })
          .boundingBox()
        expect(box!.y + box!.height).toBeLessThanOrEqual(size.height)
      }
      await page.setViewportSize({ width: 1440, height: 900 })
    }
    if (i === 1) {
      const preview = page.frameLocator('iframe')
      await preview.getByRole('link', { name: 'บันทึกรับอุปกรณ์', exact: true }).click()
      await expect(
        preview.getByRole('heading', { name: 'บันทึกรับอุปกรณ์', exact: true })
      ).toBeVisible()
      await expect(
        preview.getByRole('link', { name: 'อ่านบันทึกต้นฉบับ', exact: true })
      ).toHaveCount(0)
      await page.getByRole('button', { name: 'กลับพรีวิวโค้ด ↺', exact: true }).click()
    }
    if (i === 2) {
      await page
        .frameLocator('iframe')
        .getByRole('link', { name: 'หลังเหตุโจรกรรม', exact: true })
        .click()
      await expect
        .poll(() =>
          page
            .frames()
            .find((frame) => frame.parentFrame())
            ?.url()
        )
        .toContain('#after-theft')
      expect(
        page
          .frames()
          .find((frame) => frame.parentFrame())
          ?.url()
      ).toMatch(/^blob:/)
      await expect(
        page.frameLocator('iframe').getByRole('heading', { name: 'หลังเหตุโจรกรรม', exact: true })
      ).toBeVisible()
    }
    await page.getByRole('button', { name: 'ตรวจโครงสร้าง', exact: true }).click()
    expect((await getState(page)).completed.length).toBe(i)
    await page.locator('.cm-content').press('Control+Enter')
    await expect(page.locator('.repair-complete')).toBeVisible()
    expect((await getState(page)).completed.length).toBe(i + 1)
    await page.getByRole('button', { name: 'กลับสู่ Circuit City →', exact: true }).click()
  }
  await open(page, 7)
  await setCode(page, finalTask.solution)
  await page
    .frameLocator('iframe')
    .getByRole('link', { name: 'บันทึกต้นฉบับ', exact: true })
    .click()
  await expect(
    page.frameLocator('iframe').getByRole('heading', { name: 'บันทึกต้นฉบับ', exact: true })
  ).toBeVisible()
  expect((await getState(page)).finalRecovered).toBe(false)
  await page.getByRole('button', { name: 'ส่งคำสั่งซ่อม ↵', exact: true }).click()
  await expect(page.locator('.relay-recovered-record')).toContainText('ศูนย์ควบคุม')
  expect((await getState(page)).finalRecovered).toBe(true)
  await expect(page.locator('.repair-footer')).toContainText('100/100 PTS')
  await page.screenshot({ path: 'evidence/relay/original-record.png' })
  expect(errors).toEqual([])
})
