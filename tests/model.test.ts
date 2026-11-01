import { test } from 'node:test'
import assert from 'node:assert/strict'
import { movePoint, changeView, interact, store, initialPositions } from '../src/model.ts'
import { deviceEntry, deviceSolids, recoveryPoints, streetPoints, streetSolids } from '../src/chapter/layout.ts'
import { chapter, tasks } from '../src/chapter/model.ts'
import { puzzles } from '../src/chapter/puzzles.ts'
test('diagonal walking is normalized and a stalled frame cannot teleport', () => {
  const p = { x: 600, y: 550 },
    a = movePoint(p, 1, 0, 0.05, []),
    b = movePoint(p, 1, 1, 0.05, [])
  assert.ok(Math.abs(Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)) < 0.001)
  assert.equal(movePoint(p, 1, 0, 100, []).x, a.x)
})
test('character cannot cross building walls or world bounds', () => {
  const r = [{ x: 100, y: 200, w: 100, h: 100 }]
  let p = { x: 85, y: 240 }
  for (let i = 0; i < 30; i++) p = movePoint(p, 1, 0, 0.016, r)
  assert.ok(p.x < 88)
  assert.deepEqual(movePoint({ x: 45, y: 170 }, -1, -1, 0.1, []), { x: 45, y: 170 })
})
test('tiny character can explore the device floor but cannot walk through raised chips', () => {
  assert.ok(recoveryPoints.every(({ x, y }) => !deviceSolids.some((r) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h)))
  let p = { ...deviceEntry }
  for (let i = 0; i < 80; i++) p = movePoint(p, 1, 0, 0.016, [...deviceSolids], true)
  assert.ok(p.x > deviceEntry.x + 100)
  p = { x: 480, y: 390 }
  for (let i = 0; i < 80; i++) p = movePoint(p, 1, 0, 0.016, [...deviceSolids], true)
  assert.ok(p.x < 493)
})
test('the authored shop and recorder routes reach every gated station around visible furniture', () => {
  const previous = store.get()
  const walk = (start: {x:number;y:number}, stops: readonly {x:number;y:number}[], tiny: boolean) => {
    const obstacles = tiny ? [...deviceSolids] : [...streetSolids]
    let current = { ...start }
    for (const stop of stops) {
      for (const axis of ['x', 'y'] as const) {
        for (let step = 0; step < 400 && Math.abs(stop[axis] - current[axis]) > 1; step++) {
          const remaining = stop[axis] - current[axis]
          const dt = Math.min(0.05, Math.abs(remaining) / (tiny ? 145 : 220))
          current = movePoint(current, axis === 'x' ? Math.sign(remaining) : 0, axis === 'y' ? Math.sign(remaining) : 0, dt, obstacles, tiny)
        }
        assert.ok(Math.abs(stop[axis] - current[axis]) <= 1, `blocked before ${JSON.stringify(stop)}`)
      }
    }
  }
  try {
    store.set({ view: 'street' })
    walk(initialPositions.street, [
      { x: 475, y: 440 }, streetPoints.arun,
      { x: 408, y: 450 }, streetPoints.receipt,
      { x: 408, y: 760 }, { x: 1380, y: 760 }, streetPoints.relay,
      { x: 1380, y: 427 }, streetPoints.terminal, streetPoints.camera,
      { x: 1324, y: 770 }, { x: 154, y: 770 }, streetPoints.exit,
    ], false)
    store.set({ view: 'device' })
    walk(deviceEntry, [
      { x: 330, y: 823 }, recoveryPoints[0],
      { x: 408, y: 512 }, recoveryPoints[1],
      { x: 408, y: 623 }, recoveryPoints[2],
      { x: 408, y: 250 }, { x: 1068, y: 250 }, recoveryPoints[3],
      { x: 1342, y: 302 }, recoveryPoints[4],
      { x: 1342, y: 780 }, recoveryPoints[5], recoveryPoints[6],
      { x: 711, y: 820 }, { x: 1450, y: 820 },
    ], true)
  } finally {
    store.set(previous)
  }
})
test('selecting the current scene does not leave the loading screen stuck', () => {
  store.set({ ready: true })
  changeView('map')
  assert.equal(store.get().ready, true)
  changeView('street')
  assert.equal(store.get().ready, false)
})

test('entry pause blocks interaction without discarding the current destination or scene', () => {
  const before = store.get()
  try {
    for (const view of ['map', 'street', 'device', 'boss'] as const) {
      store.set({ view, paused: true, overlay: null, destination: view === 'map' ? 1 : null })
      const paused = store.get()
      interact()
      assert.deepEqual(store.get(), paused)
    }
    store.set({ view: 'map', paused: false, overlay: null, destination: null })
    interact()
    assert.equal(store.get().view, 'map')
    assert.match(store.get().toast, /เลือกหมุด/)
  } finally {
    store.set(before)
  }
})

test('physical shop camera cannot bypass the city tower and becomes a viewer after recovery', () => {
  const before = store.get()
  try {
    chapter.reset()
    chapter.talkToArun()
    chapter.collectClue('receipt'); chapter.collectClue('relay'); chapter.startHack()
    for (let i = 0; i < 7; i++) {
      chapter.submitPuzzle(i, puzzles[i].solution)
      chapter.submitTask(i, tasks[i].solution)
    }
    store.set({ view: 'street', overlay: null, paused: false, positions: { ...before.positions, street: streetPoints.camera } })
    interact()
    assert.equal(store.get().overlay, null)
    assert.match(store.get().toast, /ด่านที่ 8/)
    chapter.submitImage('<img src="suspect.png" alt="ผู้ต้องสงสัยเสื้อดำหน้าร้าน">')
    interact()
    assert.equal(store.get().overlay, 'recovery')
  } finally {
    chapter.reset()
    store.set(before)
  }
})
