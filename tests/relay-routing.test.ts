import { test } from 'node:test'
import assert from 'node:assert/strict'
import { store, enterField, changeView, interact, movePoint, setPosition } from '../src/model.ts'
import { cityProgress } from '../src/city/progression.ts'
import { relay } from '../src/relay/model.ts'
import { relayPoints, relayEntry } from '../src/relay/layout.ts'

test('relay entrance and device cannot mutate progress before city access; field return keeps chapter', () => {
  const before = store.get()
  try {
    cityProgress.reset()
    relay.reset()
    store.set({ view: 'map', activeChapter: 'arun', overlay: null, paused: false })
    enterField('relay')
    assert.equal(store.get().activeChapter, 'arun')
    assert.equal(cityProgress.get().currentArea, 'base')
    store.set({ activeChapter: 'relay' })
    changeView('device')
    assert.equal(relay.get().entered, false)
    store.set({ activeChapter: 'arun' })
    cityProgress.recordCamRecovery()
    enterField('relay')
    assert.equal(store.get().view, 'street')
    assert.equal(store.get().activeChapter, 'relay')
    assert.deepEqual(store.get().positions.street, relayEntry)
    changeView('device')
    assert.equal(store.get().view, 'street')
    relay.talkToOfficer()
    relay.collectClue('workorder')
    relay.collectClue('module')
    changeView('device')
    assert.equal(store.get().view, 'device')
    changeView('street')
    assert.equal(cityProgress.get().currentArea, 'relay')
    enterField('arun')
    assert.equal(cityProgress.get().currentArea, 'arun')
    assert.equal(store.get().activeChapter, 'arun')
  } finally {
    relay.reset()
    cityProgress.reset()
    store.set(before)
  }
})
test('station furniture is grounded in walkable circulation and gate opens only after witness', () => {
  const before = store.get()
  try {
    relay.reset()
    store.set({ view: 'street', activeChapter: 'relay', overlay: null, paused: false })
    let p = { x: 1170, y: 690 }
    for (let i = 0; i < 30; i++) p = movePoint(p, 1, 0, 0.016, [])
    assert.ok(p.x < 1183)
    relay.talkToOfficer()
    for (let i = 0; i < 30; i++) p = movePoint(p, 1, 0, 0.016, [])
    assert.ok(p.x > 1250)
    p = { ...relayEntry }
    for (const stop of [
      { x: 340, y: 430 },
      relayPoints.officer,
      { x: 240, y: 430 },
      relayPoints.workorder,
      { x: 240, y: 780 },
      { x: 1140, y: 780 },
      { x: 1140, y: 690 },
      { x: 1405, y: 690 },
      relayPoints.module,
      { x: 1140, y: 650 },
      { x: 1140, y: 395 },
      relayPoints.terminal,
    ]) {
      for (const axis of ['x', 'y'] as const) {
        for (let i = 0; i < 500 && Math.abs(p[axis] - stop[axis]) > 1; i++) {
          const diff = stop[axis] - p[axis]
          p = movePoint(
            p,
            axis === 'x' ? Math.sign(diff) : 0,
            axis === 'y' ? Math.sign(diff) : 0,
            Math.min(0.05, Math.abs(diff) / 220),
            []
          )
        }
        assert.ok(Math.abs(p[axis] - stop[axis]) <= 1, `blocked path to ${JSON.stringify(stop)}`)
      }
    }
  } finally {
    relay.reset()
    store.set(before)
  }
})
test('cloud case evidence can be read without fabricating local Puzzle completion', () => {
  const before = store.get()
  try {
    relay.reset()
    cityProgress.hydrate({
      version: 2,
      completed: ['recover-cam07', 'recover-relay'],
      currentArea: 'relay',
    })
    store.set({ view: 'street', activeChapter: 'relay', paused: false, overlay: null })
    setPosition(relayPoints.evidence)
    interact()
    assert.equal(store.get().overlay, 'relay-conclusion')
    assert.equal(relay.get().completed.length, 0)
    assert.equal(relay.get().finalRecovered, false)
  } finally {
    relay.reset()
    cityProgress.reset()
    store.set(before)
  }
})
