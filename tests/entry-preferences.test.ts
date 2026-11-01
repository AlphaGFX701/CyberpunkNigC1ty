import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  defaultPreferences,
  loadPreferences,
  savePreferences,
  officerName,
} from '../src/entry/preferences.ts'

test('invalid and inaccessible storage falls back to a playable local officer file', () => {
  assert.deepEqual(loadPreferences({ getItem: () => '{broken' }), defaultPreferences)
  assert.deepEqual(
    loadPreferences({
      getItem: () => {
        throw new Error('denied')
      },
    }),
    defaultPreferences
  )
  assert.deepEqual(
    loadPreferences({ getItem: () => '{"version":2,"music":100}' }),
    defaultPreferences
  )
  assert.equal(
    savePreferences(
      {
        setItem: () => {
          throw new Error('quota')
        },
      },
      defaultPreferences
    ),
    false
  )
})
test('stored volumes are clamped and Thai names survive the local file round trip', () => {
  let value = ''
  const storage = {
    setItem: (_key: string, next: string) => {
      value = next
    },
    getItem: () => value,
  }
  assert.equal(
    savePreferences(storage, { ...defaultPreferences, name: 'เจ้าหน้าที่กิตติ', music: 0, sfx: 0 }),
    true
  )
  assert.deepEqual(loadPreferences(storage), {
    ...defaultPreferences,
    name: 'เจ้าหน้าที่กิตติ',
    music: 0,
    sfx: 0,
  })
  const loaded = loadPreferences({
    getItem: () => '{"version":1,"name":"  คิน  ","music":-50,"sfx":150}',
  })
  assert.equal(loaded.name, 'คิน')
  assert.equal(loaded.music, 0)
  assert.equal(loaded.sfx, 100)
  assert.equal(officerName('   '), 'คิน')
})

test('talk sound defaults on for old saves and preserves an explicit mute', () => {
  for (const talkSound of [undefined, 'false', 0]) {
    const loaded = loadPreferences({
      getItem: () => JSON.stringify({ version: 1, name: 'อรุณ', music: 21, sfx: 47, talkSound }),
    })
    assert.equal(loaded.talkSound, true)
    assert.equal(loaded.name, 'อรุณ')
    assert.equal(loaded.music, 21)
    assert.equal(loaded.sfx, 47)
  }
  let value = ''
  const storage = {
    setItem: (_key: string, next: string) => {
      value = next
    },
    getItem: () => value,
  }
  assert.equal(savePreferences(storage, { ...defaultPreferences, talkSound: false }), true)
  assert.equal(loadPreferences(storage).talkSound, false)
})
