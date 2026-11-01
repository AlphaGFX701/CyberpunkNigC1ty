import { test, expect, type Page } from '@playwright/test'

test.use({
  viewport: { width: 1440, height: 900 },
  actionTimeout: 12000,
  video: { mode: 'on', size: { width: 1440, height: 900 } },
})
test.afterEach(async ({ page }, info) => {
  if (info.status !== 'passed') return
  const video = page.video()
  await page.context().close()
  await video?.saveAs(`evidence/motion/kin-${info.title.includes('arun') ? 'arun' : 'relay'}.webm`)
})

async function boot(page: Page, chapterId: 'arun' | 'relay') {
  await page.goto('/')
  await page.evaluate(async (chapterId) => {
    const { makeGame } = await import('/src/World.ts')
    const urls = performance.getEntriesByType('resource').map((r) => r.name)
    const { store } = await import(
      urls.findLast((u) => /\/src\/model\.ts(?:\?|$)/.test(u)) ?? '/src/model.ts'
    )
    const host = document.createElement('div')
    host.style.cssText = 'position:fixed;inset:0;z-index:10000;background:#091923'
    document.body.append(host)
    store.set({
      view: 'street',
      activeChapter: chapterId,
      paused: false,
      overlay: null,
      positions: { ...store.get().positions, street: { x: 538, y: 550 } },
    })
    ;(window as any).__motion = { game: makeGame(host), store }
  }, chapterId)
  await page.waitForFunction(
    () => (window as any).__motion?.game.scene.getScene('World')?.player?.active,
    { timeout: 20000 }
  )
  await page.evaluate(() => {
    const h = (window as any).__motion
    h.game.loop.sleep()
    h.time = performance.now()
  })
}
async function advance(page: Page, ms: number) {
  await page.evaluate((ms) => {
    const h = (window as any).__motion
    for (let i = 0; i < Math.ceil(ms / 16); i++) {
      h.time += 16
      h.game.step(h.time, 16)
    }
  }, ms)
}
async function pose(page: Page) {
  return page.evaluate(() => {
    const { game, store } = (window as any).__motion,
      scene = game.scene.getScene('World'),
      sprite = scene.player
    return {
      point: store.get().positions.street,
      animation: sprite.anims.currentAnim?.key,
      frame: sprite.frame.name,
      scale: sprite.scaleX,
      facing: scene.facing,
      originY: sprite.originY,
      shadowY: scene.shadow.y,
      moving: scene.moving,
    }
  })
}
for (const chapterId of ['arun', 'relay'] as const)
  test(`Kin ${chapterId}: actual movement owns gait, stable scale and pause/blur stop held keys`, async ({
    page,
  }) => {
    test.setTimeout(90000)
    await boot(page, chapterId)
    // The right edge of the visible server/workbench island is a real collision test.
    await page.evaluate((chapterId) => {
      const { store } = (window as any).__motion
      store.set({
        positions: {
          ...store.get().positions,
          street: chapterId === 'arun' ? { x: 538, y: 550 } : { x: 506, y: 550 },
        },
      })
    }, chapterId)
    const blockedBefore = await pose(page)
    await page.keyboard.down('d')
    await advance(page, 650)
    const blockedAfter = await pose(page)
    expect(blockedAfter.point).toEqual(blockedBefore.point)
    expect(blockedAfter.animation).toMatch(/^kin-idle-/)
    expect(blockedAfter.moving).toBe(false)
    await page.keyboard.up('d')
    await page.evaluate(() => {
      const { store } = (window as any).__motion
      store.set({ positions: { ...store.get().positions, street: { x: 400, y: 760 } } })
    })
    for (const [key, direction] of [
      ['d', 'right'],
      ['a', 'left'],
      ['w', 'up'],
      ['s', 'down'],
    ]) {
      await page.evaluate(() => {
        const { store } = (window as any).__motion
        store.set({ positions: { ...store.get().positions, street: { x: 400, y: 760 } } })
      })
      const before = await pose(page)
      await page.keyboard.down(key)
      await advance(page, 180)
      const moving = await pose(page)
      expect(moving.animation).toBe(`kin-${direction}`)
      expect(moving.point).not.toEqual(before.point)
      expect(moving.scale).toBe(0.85)
      await page.keyboard.up(key)
      await advance(page, 70)
      expect((await pose(page)).animation).toBe(`kin-idle-${direction}`)
    }
    await page.keyboard.down('d')
    await page.keyboard.down('w')
    // Fix the simulation step here: screenshot/video encoding under parallel
    // software rendering must not turn a short diagonal into a wall-slide.
    const diagonal = await page.evaluate(() => {
      const { game, store } = (window as any).__motion,
        scene = game.scene.getScene('World')
      game.loop.sleep()
      store.set({ positions: { ...store.get().positions, street: { x: 400, y: 760 } } })
      const result = []
      for (let i = 0; i < 8; i++) {
        scene.update(i * 16, 16)
        result.push({ facing: scene.facing, scale: scene.player.scaleX })
      }
      return result
    })
    expect(new Set(diagonal.map((p) => p.facing)).size).toBe(1)
    expect(new Set(diagonal.map((p) => p.scale)).size).toBe(1)
    await page.keyboard.up('d')
    await page.keyboard.up('w')
    await advance(page, 80)
    const idleFrame = (await pose(page)).frame
    await advance(page, 650)
    expect((await pose(page)).frame).toBe(idleFrame)
    // A modal must reset held movement, not resume it after closing.
    await page.keyboard.down('a')
    await advance(page, 70)
    await page.evaluate(() => {
      ;(window as any).__motion.store.set({ overlay: 'journal' })
    })
    const dialogPoint = (await pose(page)).point
    await advance(page, 100)
    expect((await pose(page)).point).toEqual(dialogPoint)
    expect((await pose(page)).animation).toMatch(/^kin-idle-/)
    await page.evaluate(() => {
      ;(window as any).__motion.store.set({ overlay: null })
    })
    await advance(page, 100)
    expect((await pose(page)).point).toEqual(dialogPoint)
    await page.keyboard.up('a')
    await page.keyboard.down('d')
    await advance(page, 60)
    await page.evaluate(() => {
      ;(window as any).__motion.game.events.emit('blur')
    })
    const blurPoint = (await pose(page)).point
    await advance(page, 100)
    expect((await pose(page)).point).toEqual(blurPoint)
    expect((await pose(page)).animation).toMatch(/^kin-idle-/)
    await page.keyboard.up('d')
    // Also record the real-time renderer, rather than treating fixed-step assertions
    // as visual evidence of a readable gait. Every direction starts on clear floor.
    await page.evaluate(() => (window as any).__motion.game.loop.wake())
    for (const key of ['d', 'a', 'w', 's']) {
      await page.evaluate(() => {
        const { store } = (window as any).__motion
        store.set({ positions: { ...store.get().positions, street: { x: 400, y: 760 } } })
      })
      await page.keyboard.down(key)
      await page.waitForTimeout(380)
      await page.keyboard.up(key)
      await page.waitForTimeout(100)
    }
    await page.screenshot({ path: `evidence/motion/kin-${chapterId}.png` })
  })
