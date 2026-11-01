import { test } from 'node:test'
import assert from 'node:assert/strict'
import { movePoint, onCircuit, changeView, interact, store } from '../src/model.ts'
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
test('tiny character stays within circuit corridors', () => {
  assert.equal(onCircuit({ x: 115, y: 500 }), true)
  assert.equal(onCircuit({ x: 40, y: 200 }), false)
  let p = { x: 115, y: 500 }
  for (let i = 0; i < 100; i++) p = movePoint(p, -1, 0, 0.016, [], true)
  assert.ok(onCircuit(p))
  assert.ok(p.x > 75)
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
