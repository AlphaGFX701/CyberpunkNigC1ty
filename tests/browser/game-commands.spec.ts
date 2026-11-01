import { privateAnswers } from '../private-answers'
import { test, expect, type Page } from '@playwright/test'
import { enterGame, selectScene } from './helpers'

test.use({ viewport: { width: 1440, height: 900 }, actionTimeout: 12000 })
async function physical(
  page: Page,
  code: string,
  key: string,
  extra: Record<string, boolean> = {}
) {
  await page.locator('body').dispatchEvent('keydown', { code, key, bubbles: true, ...extra })
}
async function world(page: Page) {
  return page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map((r) => r.name)
    const { store } = await import(
      urls.findLast((u) => /\/src\/model\.ts(?:\?|$)/.test(u)) ?? '/src/model.ts'
    )
    return store.get()
  })
}

test('physical Thai J/M/H share toolbar actions, J restores focus and modifiers cannot interrupt dialogs', async ({
  page,
}) => {
  test.setTimeout(90000)
  await enterGame(page)
  const journal = page.getByRole('button', { name: 'สมุดคดี', exact: true })
  const menu = page.getByRole('button', { name: 'เปิดเมนูเกม', exact: true })
  // A rejected loading-time command must not steal focus before its shared guard runs.
  await menu.focus()
  await page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map((r) => r.name)
    const { store } = await import(
      urls.findLast((u) => /\/src\/model\.ts(?:\?|$)/.test(u)) ?? '/src/model.ts'
    )
    store.set({ ready: false })
  })
  await physical(page, 'KeyJ', '่')
  await expect(menu).toBeFocused()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map((r) => r.name)
    const { store } = await import(
      urls.findLast((u) => /\/src\/model\.ts(?:\?|$)/.test(u)) ?? '/src/model.ts'
    )
    store.set({ ready: true })
  })
  await physical(page, 'KeyJ', '่')
  await expect(page.getByRole('dialog', { name: /สมุดคดี/ })).toBeVisible()
  await physical(page, 'KeyJ', '่', { ctrlKey: true })
  await expect(page.getByRole('dialog', { name: /สมุดคดี/ })).toBeVisible()
  await physical(page, 'KeyJ', '่')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(journal).toBeFocused()
  await journal.click()
  await page.keyboard.press('j')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await selectScene(page, /ร้านช่างอรุณ/)
  await expect(page.locator('.world-frame')).toHaveAttribute('data-view', 'street')
  const hintBefore = (await world(page)).hintOpen
  await physical(page, 'KeyH', '้')
  expect((await world(page)).hintOpen).toBe(!hintBefore)
  await physical(page, 'KeyH', '้', { ctrlKey: true })
  expect((await world(page)).hintOpen).toBe(!hintBefore)
  await page.getByRole('button', { name: 'เปิดเมนูเกม', exact: true }).click()
  await physical(page, 'KeyM', 'ท')
  await expect(page.getByRole('dialog', { name: 'เมนูภารกิจ', exact: true })).toBeVisible()
  expect((await world(page)).view).toBe('street')
  await page.keyboard.press('Escape')
  const evidence = await page.evaluate(() => localStorage.getItem('techcare.player.v1:guest'))
  await physical(page, 'KeyM', 'ท')
  await expect(page.locator('.city-map')).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('techcare.player.v1:guest'))).toBe(evidence)
})

test('J/M/H typed in the real CodeMirror stay code, and M after closing preserves earned chapter progress', async ({
  page,
}) => {
  test.setTimeout(90000)
  await enterGame(page)
  // Focused editor fixture: earn the first task through its real validators; no case milestone is injected.
  await page.evaluate(async (answer) => {
    const urls = performance.getEntriesByType('resource').map((r) => r.name)
    const { chapter } = await import(
      urls.findLast((u) => /\/src\/chapter\/model\.ts(?:\?|$)/.test(u)) ?? '/src/chapter/model.ts'
    )
    const { puzzles } = await import('/src/chapter/puzzles.ts')
    const { changeView, store } = await import(
      urls.findLast((u) => /\/src\/model\.ts(?:\?|$)/.test(u)) ?? '/src/model.ts'
    )
    chapter.talkToArun()
    chapter.collectClue('receipt')
    chapter.collectClue('relay')
    chapter.startHack()
    if (
      !chapter.submitPuzzle(0, puzzles[0].solution).ok ||
      !chapter.submitTask(0, answer).ok
    )
      throw Error('fixture repair invalid')
    store.set({ activeChapter: 'arun' })
    changeView('device')
  }, privateAnswers.arun[0])
  await expect(page.locator('.circuit-map')).toBeVisible({ timeout: 20000 })
  await expect(page.locator('.circuit-loading')).toHaveCount(0, { timeout: 20000 })
  await page.getByRole('button', { name: 'รายชื่อด่าน Circuit City', exact: true }).click()
  await page.getByTestId('circuit-stage-0').click()
  await page.getByTestId('circuit-start').click()
  const editor = page.locator('.cm-content')
  await expect(editor).toBeVisible()
  await editor.click()
  await editor.press('Control+a')
  await page.keyboard.insertText('mjh')
  await editor.dispatchEvent('keydown', { code: 'KeyJ', key: '่', bubbles: true })
  await editor.dispatchEvent('keydown', { code: 'KeyM', key: 'ท', bubbles: true })
  await editor.dispatchEvent('keydown', { code: 'KeyH', key: '้', bubbles: true })
  await expect(editor).toHaveText('mjh')
  await expect(page.getByRole('dialog')).toContainText('ปลุกหน้าบันทึก')
  expect((await world(page)).view).toBe('device')
  await page.keyboard.press('Escape')
  await physical(page, 'KeyM', 'ท')
  await expect(page.locator('.city-map')).toBeVisible()
  const completed = await page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map((r) => r.name)
    const { chapter } = await import(
      urls.findLast((u) => /\/src\/chapter\/model\.ts(?:\?|$)/.test(u)) ?? '/src/chapter/model.ts'
    )
    return chapter.get().completed
  })
  expect(completed).toEqual([0])
})
