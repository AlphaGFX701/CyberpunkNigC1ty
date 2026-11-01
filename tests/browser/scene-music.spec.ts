import { test, expect, type Page } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { enterTitle, openSettings } from './helpers'
import { streetPoints } from '../../src/chapter/layout'
import { relayPoints } from '../../src/relay/layout'

test.use({ viewport: { width: 1440, height: 900 }, actionTimeout: 15000 })

async function music(page: Page) {
  return page.locator('audio[data-techcare-music]').evaluateAll((nodes) =>
    nodes.map((node) => {
      const audio = node as HTMLAudioElement
      return {
        scene: audio.dataset.musicScene,
        role: audio.dataset.musicRole,
        src: audio.currentSrc || audio.src,
        paused: audio.paused,
        time: audio.currentTime,
        volume: audio.volume,
        ready: audio.readyState,
        error: audio.error?.code,
      }
    })
  )
}
async function settled(page: Page, scene: string) {
  await expect
    .poll(
      async () => {
        const slots = await music(page)
        const playing = slots.filter((s) => !s.paused)
        return (
          slots.length === 2 &&
          playing.length === 1 &&
          playing[0].scene === scene &&
          playing[0].role === 'active' &&
          playing[0].ready >= 2 &&
          playing[0].volume > 0 &&
          !playing[0].error
        )
      },
      { timeout: 20000, message: `real HTMLAudio playback settled to ${scene}` }
    )
    .toBe(true)
  return (await music(page)).find((s) => !s.paused)!
}
async function interactAt(page: Page, point: { x: number; y: number }) {
  await page.evaluate(async (p) => {
    const urls = performance.getEntriesByType('resource').map((r) => r.name)
    const { setPosition } = await import(
      urls.findLast((u) => /\/src\/model\.ts(?:\?|$)/.test(u)) ?? '/src/model.ts'
    )
    setPosition(p)
  }, point)
  await page.waitForTimeout(80)
  await page.keyboard.press('e')
}
async function travel(page: Page, name: string) {
  await page.getByRole('button', { name: 'รายชื่อพื้นที่', exact: true }).click()
  await page.getByRole('button', { name: `สำรวจ ${name}`, exact: true }).click()
  await page.getByRole('button', { name: 'เข้าสำรวจ', exact: true }).click()
  await expect(page.locator('.world-frame')).toHaveAttribute('data-view', 'street')
  await expect(page.getByText('กำลังเตรียมฉาก…')).toBeHidden({ timeout: 20000 })
}

test('real six-track transports follow scene ownership, connection Start, editor continuity and mute', async ({
  page,
}, info) => {
  test.setTimeout(180000)
  const errors: string[] = [],
    responses: { url: string; status: number }[] = [],
    trace: unknown[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('response', (r) => {
    if (/\/assets\/music\/.*\.mp3/.test(r.url()))
      responses.push({ url: r.url(), status: r.status() })
  })
  // Focused AUDIO fixture, not a claim of completing investigation/lessons through UI:
  // CAM case permits relay travel; local witnesses/clues permit actual connection buttons;
  // only Arun's first Puzzle is pre-complete so the real editor can be opened immediately.
  await page.addInitScript(() => {
    if (window !== window.top || localStorage.getItem('scene-music-fixture')) return
    localStorage.setItem('scene-music-fixture', '1')
    const c = { version: 2, completed: ['recover-cam07'], currentArea: 'base' }
    const observations = Array.from({ length: 8 }, () => ({
      attempts: 0,
      usedHint: false,
      revealed: false,
    }))
    localStorage.setItem('techcare.auth.guest.v1', 'true')
    localStorage.setItem(
      'techcare.player.v1:guest',
      JSON.stringify({
        version: 1,
        player: { name: 'ตรวจเพลง', case: c, revision: 0, generation: 0, isNew: false },
        pending: false,
      })
    )
    localStorage.setItem('techcare.case.v1:guest', JSON.stringify(c))
    localStorage.setItem(
      'techcare.tutorial.v1:guest:0',
      JSON.stringify({ version: 1, status: 'skipped' })
    )
    localStorage.setItem(
      'techcare.entry.v1',
      JSON.stringify({
        version: 1,
        name: 'ตรวจเพลง',
        music: 15,
        sfx: 0,
        talkSound: false,
        reduceMotion: false,
      })
    )
    localStorage.setItem(
      'techcare.chapter-one.v1:guest:0',
      JSON.stringify({
        version: 2,
        spoken: true,
        clues: ['receipt', 'relay'],
        entered: true,
        completed: [],
        puzzleCompleted: [0],
        observations,
        imageRecovered: false,
        storageWarning: false,
      })
    )
    localStorage.setItem(
      'techcare.chapter-relay.v1:guest:0',
      JSON.stringify({
        version: 1,
        spoken: true,
        clues: ['workorder', 'module'],
        entered: false,
        completed: [],
        puzzleCompleted: [],
        observations,
        finalRecovered: false,
        departureSeen: true,
        arrivalSeen: true,
        conclusionSeen: false,
        storageWarning: false,
      })
    )
  })
  const record = async (label: string, scene: string) => {
    const active = await settled(page, scene)
    trace.push({ label, slots: await music(page) })
    return active
  }
  await enterTitle(page)
  const entry = await record('entry/title', 'entry')
  expect(entry.src).toContain('/concrete-tears.mp3')
  expect(entry.time).toBeGreaterThanOrEqual(3)
  await page.getByRole('button', { name: 'เริ่มภารกิจ', exact: true }).click()
  await expect(page.locator('.story-screen')).toBeVisible()
  const story = await record('opening/story', 'story')
  expect(story.src).toContain('/rain-over-glass-monoliths.mp3')
  expect(story.time).toBeLessThan(6)
  await page.getByRole('button', { name: 'ข้ามบทนำ', exact: true }).click()
  await expect(page.locator('.city-map')).toHaveAttribute('data-ready', 'true', { timeout: 25000 })
  const map = await record('city map', 'game')
  expect(map.src).toContain('/midnight-protocol.mp3')

  await travel(page, 'ร้านช่างอรุณ')
  const field = await record('Arun field', 'arun')
  expect(field.src).toContain('/midnight-at-the-terminal.mp3')
  await interactAt(page, streetPoints.terminal)
  const connection = page.getByRole('dialog', { name: 'TECHCARE / RECOVERY LINK', exact: true })
  await expect(connection).toBeVisible()
  await page.waitForTimeout(650)
  const standby = await record('connection window / not started', 'arun')
  expect(standby.time).toBeGreaterThan(field.time)
  await connection.getByRole('button', { name: /เริ่มเชื่อมต่อ/ }).click()
  const link = await record('connection Start', 'hack')
  expect(link.src).toContain('/the-glass-key.mp3')
  await expect(page.locator('.circuit-map')).toBeVisible({ timeout: 15000 })
  const circuit = await record('Arun Circuit City', 'hack')
  expect(circuit.time).toBeGreaterThanOrEqual(link.time)
  await page.getByRole('button', { name: 'รายชื่อด่าน Circuit City', exact: true }).click()
  await page.getByTestId('circuit-stage-0').click()
  await page.getByTestId('circuit-start').click()
  await expect(page.locator('.cm-content')).toBeVisible()
  const editor = await record('real CodeMirror editor', 'hack')
  expect(editor.time).toBeGreaterThanOrEqual(circuit.time)
  await page.waitForTimeout(550)
  expect((await settled(page, 'hack')).time).toBeGreaterThan(editor.time)
  await page.keyboard.press('Escape')

  await page.locator('body').dispatchEvent('keydown', { code: 'KeyJ', key: '่', bubbles: true })
  await expect(page.getByRole('dialog', { name: /สมุดคดี/ })).toBeVisible()
  const journal = await record('journal / same device song', 'hack')
  expect(journal.time).toBeGreaterThan(editor.time)
  await page.locator('body').dispatchEvent('keydown', { code: 'KeyJ', key: '่', bubbles: true })
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await openSettings(page)
  const settings = await record('settings / same device song', 'hack')
  expect(settings.time).toBeGreaterThan(journal.time)
  const slider = page.getByRole('slider', { name: 'ระดับเสียงเพลง', exact: true })
  await slider.focus()
  await slider.press('Home')
  await expect.poll(async () => (await music(page)).every((s) => s.volume === 0)).toBe(true)
  await page.waitForTimeout(450)
  expect((await music(page)).every((s) => s.volume === 0)).toBe(true)
  trace.push({ label: 'muted', slots: await music(page) })
  for (let i = 0; i < 15; i++) await slider.press('ArrowRight')
  const unmuted = await record('unmuted / no seek', 'hack')
  expect(unmuted.time).toBeGreaterThan(settings.time)
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'กลับร้านอรุณ ↗', exact: true }).click()
  await record('return to Arun field', 'arun')
  await page.locator('body').dispatchEvent('keydown', { code: 'KeyM', key: 'ท', bubbles: true })
  await expect(page.locator('.city-map')).toHaveAttribute('data-ready', 'true', { timeout: 20000 })
  await record('return city map', 'game')
  await travel(page, 'สถานีสื่อสาร')
  const relay = await record('relay field', 'relay')
  expect(relay.src).toContain('/terminal-watch.mp3')
  await interactAt(page, relayPoints.terminal)
  await expect(
    page.getByRole('dialog', { name: 'RELAY-02 / เชื่อมเครื่องกู้บันทึก', exact: true })
  ).toBeVisible()
  await page.waitForTimeout(600)
  expect((await record('relay connection / not started', 'relay')).time).toBeGreaterThan(relay.time)
  await page.keyboard.press('Escape')
  await page.locator('body').dispatchEvent('keydown', { code: 'KeyM', key: 'ท', bubbles: true })
  await expect(page.locator('.city-map')).toBeVisible()
  await record('relay back to city', 'game')
  expect(errors).toEqual([])
  for (const filename of [
    'concrete-tears',
    'rain-over-glass-monoliths',
    'midnight-protocol',
    'midnight-at-the-terminal',
    'terminal-watch',
    'the-glass-key',
  ])
    expect(
      responses.some((r) => r.url.includes(`${filename}.mp3`) && [200, 206].includes(r.status)),
      filename
    ).toBe(true)
  const body = JSON.stringify({ trace, responses, errors }, null, 2)
  await mkdir(info.outputDir, { recursive: true })
  await writeFile(info.outputPath('actual-audio-transports.json'), body)
  await info.attach('actual-audio-transports-and-requests', {
    body: Buffer.from(body),
    contentType: 'application/json',
  })
})
