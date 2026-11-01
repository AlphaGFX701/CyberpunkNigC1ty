import { test } from 'node:test'
import assert from 'node:assert/strict'
import { statSync } from 'node:fs'
import { resolveMusicScene, sceneTracks, defaultNextMusicScene } from '../src/entry/scene-tracks.ts'

const base = {
  screen: 'game',
  view: 'street',
  activeChapter: 'arun',
  connectionRunning: false,
} as const
test('scene ownership selects all six tracks and only a running connection changes field music', () => {
  for (const screen of ['access', 'account', 'title'] as const)
    assert.equal(resolveMusicScene({ ...base, screen }), 'entry')
  assert.equal(resolveMusicScene({ ...base, screen: 'story' }), 'story')
  assert.equal(resolveMusicScene({ ...base, view: 'map' }), 'game')
  assert.equal(resolveMusicScene(base), 'arun')
  assert.equal(resolveMusicScene({ ...base, activeChapter: 'relay' }), 'relay')
  // The connection window itself is not a running connection.
  assert.equal(resolveMusicScene({ ...base, connectionRunning: false }), 'arun')
  assert.equal(resolveMusicScene({ ...base, connectionRunning: true }), 'hack')
  assert.equal(resolveMusicScene({ ...base, view: 'device' }), 'hack')
  assert.equal(resolveMusicScene({ ...base, view: 'boss' }), 'hack')
  assert.equal(resolveMusicScene({ ...base, view: 'map', connectionRunning: true }), 'game')
})

test('all scene music files exist locally and new songs start at zero', () => {
  assert.equal(sceneTracks.entry.cue, 3)
  for (const [scene, track] of Object.entries(sceneTracks)) {
    assert.ok(statSync(new URL(`../public${track.src}`, import.meta.url)).size > 1000, scene)
    if (scene !== 'entry') assert.equal(track.cue, 0, scene)
  }
  assert.equal(new Set(Object.values(sceneTracks).map((t) => t.src)).size, 6)
  assert.equal(defaultNextMusicScene('relay'), 'hack')
})
