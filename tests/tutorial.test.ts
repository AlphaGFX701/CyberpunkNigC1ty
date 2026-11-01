import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  createTutorial,
  tutorialKey,
  type Tutorial,
  type TutorialEvent,
  type TutorialStorage,
  type TutorialStepId,
} from '../src/tutorial/model.ts'
import { getTutorialPrompt } from '../src/tutorial/content.ts'

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  const writes: string[] = []
  const storage: TutorialStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      writes.push(key)
      values.set(key, value)
    },
  }
  return { values, writes, storage }
}

const path: readonly (readonly [TutorialStepId, TutorialEvent, TutorialStepId])[] = [
  ['camera-demo', 'camera-demo-done', 'rotate'],
  ['rotate', 'camera-rotated', 'zoom'],
  ['zoom', 'camera-zoomed', 'reset'],
  ['reset', 'camera-reset', 'journal-open'],
  ['journal-open', 'journal-opened', 'journal-read'],
  ['journal-read', 'journal-closed', 'menu-open'],
  ['menu-open', 'menu-opened', 'menu-settings'],
  ['menu-settings', 'settings-opened', 'settings-read'],
  ['settings-read', 'settings-closed', 'menu-return'],
  ['menu-return', 'menu-closed', 'list-open'],
  ['list-open', 'areas-opened', 'select-arun'],
  ['select-arun', 'area-arun-selected', 'travel'],
  ['travel', 'street-arrived', 'street-walk'],
  ['street-walk', 'walked', 'witness-open'],
  ['witness-open', 'witness-opened', 'witness-read'],
  ['witness-read', 'witness-closed', 'traces'],
  ['traces', 'clues-collected', 'field-map'],
  ['field-map', 'map-returned', 'field-return'],
  ['field-return', 'street-arrived', 'camera-enter'],
  ['camera-enter', 'device-arrived', 'chip-open'],
  ['chip-open', 'terminal-opened', 'puzzle'],
  ['puzzle', 'puzzle-solved', 'snippet'],
  ['snippet', 'editor-snippet', 'undo'],
  ['undo', 'editor-undo', 'repair'],
  ['repair', 'code-checked', 'repair-submit'],
  ['repair-submit', 'first-repair-submitted', 'repair-read'],
  ['repair-read', 'terminal-closed', 'return-map'],
  ['return-map', 'map-returned', 'done'],
]

function startCamera(guide: Tutorial) {
  guide.start()
  assert.equal(guide.choose('brief'), true)
  assert.equal(guide.choose('ready'), true)
  assert.equal(guide.get().step, 'camera-intro')
  assert.equal(
    guide.notify('camera-demo-done'),
    false,
    'reading the instruction is not a camera command'
  )
  assert.equal(guide.next(), true)
  assert.equal(guide.get().step, 'camera-demo')
}

test('closing an unfinished witness returns to interaction; reading an NPC never completes the guide', () => {
  const guide = createTutorial(memoryStorage().storage)
  startCamera(guide)
  for (const [before, event] of path) {
    if (before === 'witness-read') break
    guide.notify(event)
  }
  assert.equal(guide.get().step, 'witness-read')
  assert.equal(guide.notify('witness-dismissed'), true)
  assert.equal(guide.get().step, 'witness-open')
  guide.notify('witness-opened')
  assert.equal(guide.notify('witness-closed'), true)
  assert.equal(guide.get().status, 'active')
  assert.equal(guide.get().step, 'traces')
  assert.equal(guide.notify('first-repair-submitted'), false)
})

test('fresh map starts once; authored choices change Kin response and rejoin the same case', () => {
  const guide = createTutorial(memoryStorage().storage)
  guide.activateFirstMap(false)
  assert.equal(guide.get().step, 'intro')
  assert.equal(guide.get().offered, false)
  assert.equal(guide.choose('chief'), true)
  assert.equal(guide.get().step, 'intro-joke')
  assert.match(getTutorialPrompt('intro-joke').text, /อย่าเพิ่งเพิ่มอายุ/)
  assert.equal(getTutorialPrompt('intro-joke').mood, 'smirk')
  guide.activateFirstMap(false)
  assert.equal(guide.get().step, 'intro-joke', 'repeat renderer readiness cannot restart the guide')
  guide.next()
  assert.equal(guide.get().step, 'case')
  assert.equal(guide.choose('more'), true)
  assert.equal(guide.get().step, 'case-more')
  assert.match(getTutorialPrompt('case-more').text, /ยังบอกไม่ได้/)
  guide.next()
  assert.equal(guide.get().step, 'camera-intro')
  guide.next()
  assert.equal(guide.get().step, 'camera-demo')
})

test('field M roundtrip requires actual map return and arrival before connecting the terminal', () => {
  const guide = createTutorial(memoryStorage().storage)
  startCamera(guide)
  for (const [before, event] of path) {
    if (before === 'field-map') break
    guide.notify(event)
  }
  assert.equal(guide.get().step, 'field-map')
  assert.deepEqual(getTutorialPrompt('field-map').targets, ['return-map'])
  assert.equal(guide.notify('device-arrived'), false)
  assert.equal(guide.notify('street-arrived'), false)
  assert.equal(guide.notify('map-returned'), true)
  assert.equal(guide.get().step, 'field-return')
  assert.deepEqual(getTutorialPrompt('field-return').targets, ['areas', 'area-arun', 'enter-arun'])
  assert.equal(guide.notify('areas-opened'), false, 'opening a list is not arriving at the shop')
  assert.equal(guide.notify('area-arun-selected'), false, 'selecting a destination is not travel')
  assert.equal(guide.notify('device-arrived'), false)
  assert.equal(guide.notify('street-arrived'), true)
  assert.equal(guide.get().step, 'camera-enter')
})

test('real acknowledgements complete the ordered map and first-recovery loop, not next clicks', () => {
  const { storage, values, writes } = memoryStorage({
    'techcare.case.v1': '{"unchanged":true}',
    'techcare.entry.v1': '{"name":"อรุณ"}',
  })
  const guide = createTutorial(storage)
  startCamera(guide)
  for (const [before, event, after] of path) {
    assert.equal(guide.get().step, before)
    const stable = guide.get()
    assert.equal(guide.next(), false, `${before} requires a real action`)
    assert.equal(guide.get(), stable)
    assert.equal(guide.notify(event), true)
    assert.equal(guide.get().step, after)
    const changed = guide.get()
    assert.equal(guide.notify(event), false, `${event} cannot advance twice`)
    assert.equal(guide.get(), changed)
  }
  assert.equal(guide.next(), true)
  assert.deepEqual(
    { status: guide.get().status, step: guide.get().step, offered: guide.get().offered },
    { status: 'completed', step: null, offered: false }
  )
  assert.deepEqual(JSON.parse(values.get(tutorialKey)!), {
    version: 1,
    status: 'completed',
    guideVersion: 2,
  })
  assert.equal(values.get('techcare.case.v1'), '{"unchanged":true}')
  assert.equal(values.get('techcare.entry.v1'), '{"name":"อรุณ"}')
  assert.ok(
    writes.every((key) => key === tutorialKey),
    'guide never writes a case milestone or preference'
  )
})

test('wrong choices, stale signals and repeated events leave the snapshot and listeners alone', () => {
  const guide = createTutorial(memoryStorage().storage)
  let notifications = 0
  const unsubscribe = guide.subscribe(() => {
    notifications++
  })
  const initial = guide.get()
  assert.ok(Object.isFrozen(initial))
  assert.equal(guide.get(), initial)
  assert.equal(guide.notify('cam-repaired'), false)
  assert.equal(guide.choose('ready'), false)
  assert.equal(guide.next(), false)
  assert.equal(notifications, 0)
  guide.start()
  const active = guide.get()
  assert.ok(Object.isFrozen(active))
  assert.equal(guide.notify('street-arrived'), false)
  assert.equal(guide.choose('more'), false)
  assert.equal(guide.get(), active)
  assert.equal(notifications, 1)
  unsubscribe()
  guide.skip()
  assert.equal(notifications, 1)
})

test('reload offers interrupted training without locking input or storing a runtime step', () => {
  const { storage, values } = memoryStorage()
  const first = createTutorial(storage)
  startCamera(first)
  first.notify('camera-demo-done')
  assert.equal(first.get().step, 'rotate')
  assert.deepEqual(JSON.parse(values.get(tutorialKey)!), {
    version: 1,
    status: 'active',
    guideVersion: 2,
  })
  const restored = createTutorial(storage)
  assert.equal(restored.get().status, 'active')
  assert.equal(restored.get().step, null)
  assert.equal(restored.get().offered, true)
  restored.activateFirstMap(false)
  assert.equal(restored.get().step, null)
  restored.start()
  assert.equal(restored.get().step, 'intro', 'resume safely starts the map instructions')
})

test('existing case progress receives an opt-in offer rather than compulsory training', () => {
  const { storage } = memoryStorage()
  const guide = createTutorial(storage)
  guide.activateFirstMap(true)
  assert.equal(guide.get().status, 'unseen')
  assert.equal(guide.get().step, null)
  assert.equal(guide.get().offered, true)
  guide.activateFirstMap(false)
  assert.equal(guide.get().step, null, 'later map callbacks cannot reinterpret an existing case')
  guide.start()
  assert.equal(guide.get().step, 'intro')
})

test('skip and completion survive reload; replay and New Case remain independent of case data', () => {
  const { storage, values } = memoryStorage({
    'techcare.case.v1': '{"completed":["recover-cam07"]}',
    'techcare.entry.v1': '{"music":0}',
  })
  const guide = createTutorial(storage)
  guide.start()
  guide.skip()
  const skipped = createTutorial(storage)
  skipped.activateFirstMap(false)
  assert.equal(skipped.get().step, null)
  assert.equal(skipped.get().offered, false)
  assert.equal(skipped.get().status, 'skipped')
  assert.equal(skipped.skip(), false)
  skipped.replay()
  assert.equal(skipped.get().step, 'intro')
  skipped.resetNewCase()
  assert.equal(skipped.get().status, 'unseen')
  assert.equal(skipped.get().step, null)
  skipped.activateFirstMap(false)
  assert.equal(skipped.get().step, 'intro')
  assert.equal(values.get('techcare.case.v1'), '{"completed":["recover-cam07"]}')
  assert.equal(values.get('techcare.entry.v1'), '{"music":0}')
  const completed = createTutorial(
    memoryStorage({ [tutorialKey]: '{"version":1,"status":"completed","guideVersion":2}' }).storage
  )
  completed.activateFirstMap(false)
  assert.equal(completed.get().step, null)
  assert.equal(completed.get().offered, false)
})

test('legacy completed or skipped training gets an optional version-two offer without resetting case history', () => {
  for (const status of ['completed', 'skipped'] as const) {
    const { storage, values } = memoryStorage({
      [tutorialKey]: JSON.stringify({ version: 1, status }),
      'techcare.case.v1': '{"completed":["recover-cam07"]}',
    })
    const guide = createTutorial(storage)
    guide.activateFirstMap(true)
    assert.equal(guide.get().step, null)
    assert.equal(guide.get().offered, true)
    assert.equal(guide.get().status, status)
    guide.dismissOffer()
    assert.equal(createTutorial(storage).get().offered, false)
    assert.equal(JSON.parse(values.get(tutorialKey)!).guideVersion, 2)
    assert.equal(values.get('techcare.case.v1'), '{"completed":["recover-cam07"]}')
  }
})

test('WebGL list fallback bypasses only camera practice and rejoins the real journal instruction', () => {
  const reading = createTutorial(memoryStorage().storage)
  reading.start()
  reading.choose('brief')
  reading.choose('ready')
  assert.equal(reading.get().step, 'camera-intro')
  assert.equal(reading.notify('renderer-list'), true)
  assert.equal(reading.get().step, 'camera-fallback')
  for (let i = 0; i < 4; i++) {
    const guide = createTutorial(memoryStorage().storage)
    startCamera(guide)
    for (let j = 0; j < i; j++) guide.notify(path[j][1])
    assert.equal(guide.notify('renderer-list'), true)
    assert.equal(guide.get().step, 'camera-fallback')
    assert.equal(guide.notify('journal-opened'), false)
    assert.equal(guide.next(), true)
    assert.equal(guide.get().step, 'journal-open')
    assert.equal(guide.notify('journal-opened'), true)
  }
  const guide = createTutorial(memoryStorage().storage)
  guide.start()
  const before = guide.get()
  assert.equal(guide.notify('renderer-list'), false)
  assert.equal(guide.get(), before)
})

test('closing an unfinished code editor allows reopening without granting recovery or completing training', () => {
  const { storage, values } = memoryStorage({ 'techcare.case.v1': '{"completed":[]}' })
  const guide = createTutorial(storage)
  startCamera(guide)
  for (const [before, event] of path) {
    if (before === 'repair') break
    guide.notify(event)
  }
  assert.equal(guide.get().step, 'repair')
  assert.equal(guide.notify('terminal-closed'), true)
  assert.equal(guide.get().step, 'chip-open')
  assert.equal(guide.notify('cam-repaired'), false)
  assert.equal(values.get('techcare.case.v1'), '{"completed":[]}')
  assert.equal(guide.get().status, 'active')
  assert.equal(guide.notify('terminal-opened'), true)
  assert.equal(guide.get().step, 'puzzle')
  guide.notify('puzzle-solved')
  guide.notify('editor-snippet')
  guide.notify('editor-undo')
  assert.equal(guide.notify('code-checked'), true)
  assert.equal(guide.get().step, 'repair-submit')
  assert.equal(guide.notify('first-repair-submitted'), true)
  assert.equal(guide.get().step, 'repair-read')
})

test('malformed/unknown saves and denied storage remain playable with warnings', () => {
  for (const value of [
    '{bad',
    'null',
    '[]',
    '{"version":2,"status":"active"}',
    '{"version":1,"status":"hacked"}',
  ]) {
    const guide = createTutorial(memoryStorage({ [tutorialKey]: value }).storage)
    assert.equal(guide.get().status, 'unseen')
    assert.equal(guide.get().step, null)
    assert.equal(guide.get().storageWarning, true)
    guide.activateFirstMap(false)
    assert.equal(guide.get().step, 'intro')
  }
  const denied: TutorialStorage = {
    getItem() {
      throw Error('denied')
    },
    setItem() {
      throw Error('denied')
    },
  }
  const guide = createTutorial(denied)
  guide.activateFirstMap(false)
  guide.choose('brief')
  assert.equal(guide.get().step, 'case')
  assert.equal(guide.get().storageWarning, true)
  guide.skip()
  assert.equal(guide.get().status, 'skipped')
  const unavailable = createTutorial(null)
  assert.equal(unavailable.get().storageWarning, true)
  unavailable.start()
  assert.equal(unavailable.get().step, 'intro')
})

test('every authored prompt has a usable context and truthful first-case language', () => {
  const steps: TutorialStepId[] = [
    'intro',
    'intro-joke',
    'case',
    'case-more',
    'camera-intro',
    'camera-fallback',
    ...path.map(([step]) => step),
    'done',
  ]
  for (const step of new Set(steps)) {
    const prompt = getTutorialPrompt(step)
    assert.ok(prompt.text.length > 10, step)
    assert.ok(Object.isFrozen(prompt), step)
    assert.ok(Object.isFrozen(prompt.targets), step)
    if (prompt.mode === 'dialogue') assert.ok(prompt.choices?.length || prompt.nextLabel, step)
  }
  assert.equal(getTutorialPrompt(null), null)
  assert.match(getTutorialPrompt('case').text, /อาราซาก้า/)
  assert.match(getTutorialPrompt('case').text, /ทีมกู้ภัย/)
  assert.match(getTutorialPrompt('journal-read').text, /CAM-07.*หลักฐานแรก/)
  assert.match(getTutorialPrompt('case-more').text, /ยังบอกไม่ได้/)
  assert.deepEqual(getTutorialPrompt('repair').targets, ['edit-code', 'check-code'])
  assert.match(getTutorialPrompt('chip-open').text, /เลือก.*01/)
  assert.match(getTutorialPrompt('repair').text, /body/)
  assert.doesNotMatch(getTutorialPrompt('repair').text, /suspect\.png/)
  assert.match(getTutorialPrompt('done').text, /อีกหกเขต|อีก.*หกเขต/)
})
