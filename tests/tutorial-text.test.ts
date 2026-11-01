import { test } from 'node:test'
import assert from 'node:assert/strict'
import { segmentDialogue } from '../src/tutorial/text.ts'

test('Thai typing preserves the original sentence and never reveals detached tone marks', () => {
  const text = 'คินกำลังพูดอยู่ กิ่น นี่คือหลักฐาน'
  const parts = segmentDialogue(text)
  assert.equal(parts.join(''), text)
  assert.ok(parts.includes('กิ่'))
  assert.ok(parts.every((part) => !/^\p{Mark}/u.test(part)))
})

test('Thai combining marks remain attached when Intl.Segmenter is unavailable', () => {
  const descriptor = Object.getOwnPropertyDescriptor(Intl, 'Segmenter')!
  try {
    Object.defineProperty(Intl, 'Segmenter', { value: undefined, configurable: true })
    assert.deepEqual(segmentDialogue('กิ่ นี่'), ['กิ่', ' ', 'นี่'])
  } finally {
    Object.defineProperty(Intl, 'Segmenter', descriptor)
  }
})
