import { test } from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import { KIN_FRAME, KIN_FOOT_EDGE, KIN_DIRECTIONS } from '../src/field/kin-frames.ts'

test('Kin runtime foot pivots match the actual alpha edge in all sixteen direction frames', async () => {
  const { data, info } = await sharp(
    new URL(
      '../public/assets/chapter-one/characters/kin-walk.png',
      import.meta.url
    ).pathname.replace(/^\/(\w:)/, '$1')
  )
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  assert.equal(info.width, KIN_FRAME.width * 4)
  assert.equal(info.height, KIN_FRAME.height * 4)
  assert.equal(KIN_DIRECTIONS.length, 4)
  for (let i = 0; i < 16; i++) {
    let bottom = -1
    for (let y = 0; y < KIN_FRAME.height; y++)
      for (let x = 0; x < KIN_FRAME.width; x++) {
        if (
          data[
            ((Math.floor(i / 4) * KIN_FRAME.height + y) * info.width +
              (i % 4) * KIN_FRAME.width +
              x) *
              4 +
              3
          ] > 128
        )
          bottom = Math.max(bottom, y)
      }
    assert.equal(KIN_FOOT_EDGE[i], bottom + 1, `frame${i} must not float above its pivot`)
  }
})
