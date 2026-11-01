import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  createCityProgress,
  canAccessArea,
  cityProgressKey,
  type StorageLike,
} from '../src/city/progression.ts'

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  const removed: string[] = []
  const storage: StorageLike = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
    removeItem: (key) => {
      removed.push(key)
      values.delete(key)
    },
  }
  return { values, removed, storage }
}

test('new case offers base and Arun; locked actions cannot mutate state', () => {
  const { storage } = memoryStorage()
  const progress = createCityProgress(storage)
  const initial = progress.get()
  assert.equal(initial.currentArea, 'base')
  assert.equal(initial.storageWarning, false)
  assert.deepEqual(initial.completed, [])
  assert.equal(canAccessArea(initial, 'base'), true)
  assert.equal(canAccessArea(initial, 'arun'), true)
  assert.equal(canAccessArea(initial, 'relay'), false)
  assert.equal(canAccessArea(initial, 'control'), false)
  assert.equal(progress.arrive('relay'), false)
  assert.equal(progress.readIntel('relay'), false)
  assert.equal(progress.readIntel('control'), false)
  assert.equal(progress.get(), initial)
})

test('only playable relay recovery opens control; old intel action cannot bypass it', () => {
  const progress = createCityProgress(memoryStorage().storage)
  progress.recordRelayRecovery()
  assert.deepEqual(progress.get().completed, [])
  progress.recordCamRecovery()
  assert.equal(canAccessArea(progress.get(), 'relay'), true)
  assert.equal(canAccessArea(progress.get(), 'control'), false)
  assert.equal(progress.arrive('relay'), true)
  assert.equal(progress.get().currentArea, 'relay')
  assert.equal(progress.readIntel('relay'), false)
  assert.equal(canAccessArea(progress.get(), 'control'), false)
  progress.recordRelayRecovery()
  assert.equal(canAccessArea(progress.get(), 'control'), true)
  assert.equal(progress.get().currentArea, 'relay', 'recovery does not implicitly travel')
  assert.equal(progress.readIntel('control'), true)
  assert.deepEqual(progress.get().completed, ['recover-cam07', 'recover-relay', 'read-control'])
  assert.equal(progress.arrive('control'), true)
})

test('browser save reloads progress only, retaining preferences outside the case key', () => {
  const preferences = '{"version":1,"name":"คินทดสอบ","music":0}'
  const { storage, values } = memoryStorage({ 'techcare.entry.v1': preferences })
  const progress = createCityProgress(storage)
  progress.recordCamRecovery()
  progress.recordRelayRecovery()
  progress.arrive('control')
  const payload = JSON.parse(values.get(cityProgressKey)!)
  assert.deepEqual(Object.keys(payload).sort(), ['completed', 'currentArea', 'version'])
  assert.deepEqual(payload, {
    version: 2,
    completed: ['recover-cam07', 'recover-relay'],
    currentArea: 'control',
  })
  assert.deepEqual(createCityProgress(storage).get(), progress.get())
  assert.equal(values.get('techcare.entry.v1'), preferences)
})

test('malformed, unknown-version and inconsistent saves recover defaults with a warning', () => {
  const invalid = [
    '{broken',
    'null',
    '[]',
    '{"version":3,"completed":[],"currentArea":"base"}',
    '{"version":1,"completed":["read-relay"],"currentArea":"base"}',
    '{"version":1,"completed":["recover-cam07","read-control"],"currentArea":"base"}',
    '{"version":1,"completed":[],"currentArea":"control"}',
    '{"version":1,"completed":["unknown-task"],"currentArea":"base"}',
    '{"version":1,"completed":["recover-cam07","recover-cam07"],"currentArea":"base"}',
  ]
  for (const raw of invalid) {
    const progress = createCityProgress(memoryStorage({ [cityProgressKey]: raw }).storage)
    assert.deepEqual(
      progress.get(),
      {
        version: 2,
        completed: [],
        currentArea: 'base',
        storageWarning: true,
      },
      raw
    )
  }
})

test('saved unlock claims are ignored and valid milestone order is normalized', () => {
  const forged = JSON.stringify({
    version: 1,
    completed: [],
    currentArea: 'base',
    unlocked: ['relay', 'control'],
  })
  const initial = createCityProgress(memoryStorage({ [cityProgressKey]: forged }).storage)
  assert.equal(canAccessArea(initial.get(), 'control'), false)
  const reordered = JSON.stringify({
    version: 1,
    completed: ['read-relay', 'recover-cam07'],
    currentArea: 'relay',
  })
  const loaded = createCityProgress(memoryStorage({ [cityProgressKey]: reordered }).storage)
  assert.deepEqual(loaded.get().completed, ['recover-cam07', 'read-relay'])
  assert.equal(loaded.get().storageWarning, false)
})

test('denied storage keeps in-memory progress usable and exposes its warning', () => {
  const inaccessible: StorageLike = {
    getItem: () => {
      throw new Error('denied')
    },
    setItem: () => {
      throw new Error('quota')
    },
    removeItem: () => {
      throw new Error('denied')
    },
  }
  const progress = createCityProgress(inaccessible)
  assert.equal(progress.get().storageWarning, true)
  progress.recordCamRecovery()
  assert.equal(canAccessArea(progress.get(), 'relay'), true)
  assert.equal(progress.get().storageWarning, true)
  progress.reset()
  assert.equal(progress.get().currentArea, 'base')
  assert.deepEqual(progress.get().completed, [])
  assert.equal(progress.get().storageWarning, true)
  assert.equal(createCityProgress(null).get().storageWarning, true)
})

test('snapshot identity is stable and frozen; duplicate completion does not notify again', () => {
  const progress = createCityProgress(memoryStorage().storage)
  const first = progress.get()
  assert.equal(progress.get(), first)
  assert.equal(Object.isFrozen(first), true)
  assert.equal(Object.isFrozen(first.completed), true)
  let notifications = 0
  const unsubscribe = progress.subscribe(() => {
    notifications++
  })
  progress.recordCamRecovery()
  const recovered = progress.get()
  assert.notEqual(recovered, first)
  progress.recordCamRecovery()
  progress.arrive('base')
  assert.equal(progress.get(), recovered)
  assert.equal(notifications, 1)
  unsubscribe()
  progress.arrive('relay')
  assert.equal(notifications, 1)
})

test('new case removes only case progress and preserves local name/settings', () => {
  const preferences = '{"version":1,"name":"เจ้าหน้าที่"}'
  const { storage, removed, values } = memoryStorage({ 'techcare.entry.v1': preferences })
  const progress = createCityProgress(storage)
  progress.recordCamRecovery()
  progress.recordRelayRecovery()
  progress.arrive('control')
  progress.reset()
  assert.deepEqual(removed, [cityProgressKey])
  assert.equal(values.get('techcare.entry.v1'), preferences)
  assert.equal(values.has(cityProgressKey), false)
  assert.deepEqual(progress.get(), {
    version: 2,
    completed: [],
    currentArea: 'base',
    storageWarning: false,
  })
  assert.deepEqual(createCityProgress(storage).get(), progress.get())
})

test('legacy control intel migrates without losing history or completing the relay chapter', () => {
  const old = {
    version: 1,
    completed: ['recover-cam07', 'read-relay', 'read-control'],
    currentArea: 'control',
  }
  const { storage, values } = memoryStorage({ [cityProgressKey]: JSON.stringify(old) })
  const progress = createCityProgress(storage)
  assert.equal(progress.get().version, 2)
  assert.equal(progress.get().currentArea, 'relay')
  assert.deepEqual(progress.get().completed, old.completed)
  assert.equal(progress.get().storageWarning, false)
  assert.equal(canAccessArea(progress.get(), 'control'), false)
  progress.recordRelayRecovery()
  assert.equal(canAccessArea(progress.get(), 'control'), true)
  assert.deepEqual(progress.get().completed, [
    'recover-cam07',
    'read-relay',
    'recover-relay',
    'read-control',
  ])
  assert.equal(JSON.parse(values.get(cityProgressKey)!).version, 2)
  assert.deepEqual(createCityProgress(storage).get(), progress.get())
})

test('owner switching cannot leak recovered relay progress and reset keeps other owner intact', () => {
  const { storage } = memoryStorage()
  const progress = createCityProgress(storage)
  progress.activateOwner('alice-case')
  progress.recordCamRecovery()
  progress.recordRelayRecovery()
  progress.activateOwner('bob-case')
  assert.deepEqual(progress.get().completed, [])
  progress.recordCamRecovery()
  assert.equal(canAccessArea(progress.get(), 'control'), false)
  progress.activateOwner('alice-case')
  assert.equal(canAccessArea(progress.get(), 'control'), true)
  progress.reset()
  progress.activateOwner('bob-case')
  assert.deepEqual(progress.get().completed, ['recover-cam07'])
  progress.activateOwner('alice-case')
  assert.deepEqual(progress.get().completed, [])
})
