import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  commandFromKeyboard,
  executeGameCommand,
  closeGameOverlay,
  type CommandKey,
} from '../src/game-commands.ts'
import { store } from '../src/model.ts'
import { tutorial } from '../src/tutorial/model.ts'
import { cityProgress } from '../src/city/progression.ts'
import { chapter } from '../src/chapter/model.ts'

const initial = store.get()
afterEach(() => {
  tutorial.skip()
  store.set(initial)
})
const key = (code: string, patch: Partial<CommandKey> = {}): CommandKey => ({
  code,
  repeat: false,
  isComposing: false,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  shiftKey: false,
  target: null,
  defaultPrevented: false,
  ...patch,
})
const ready = () => {
  tutorial.skip()
  store.set({
    ready: true,
    view: 'street',
    activeChapter: 'arun',
    overlay: null,
    paused: false,
    connectionRunning: false,
    hintOpen: false,
  })
}

test('commands use physical J/M/H codes and ignore editing, composition, repeat and modifier chords', () => {
  assert.equal(commandFromKeyboard(key('KeyJ')), 'journal')
  assert.equal(commandFromKeyboard(key('KeyM')), 'map')
  assert.equal(commandFromKeyboard(key('KeyH')), 'hint')
  assert.equal(commandFromKeyboard(key('KeyE')), null)
  for (const flag of [
    'ctrlKey',
    'altKey',
    'metaKey',
    'shiftKey',
    'repeat',
    'isComposing',
    'defaultPrevented',
  ] as const)
    assert.equal(commandFromKeyboard(key('KeyJ', { [flag]: true })), null)
  assert.equal(
    commandFromKeyboard(
      key('KeyM', { target: { isContentEditable: true } as unknown as EventTarget })
    ),
    null
  )
  assert.equal(
    commandFromKeyboard(
      key('KeyJ', { target: { closest: () => ({ tagName: 'INPUT' }) } as unknown as EventTarget })
    ),
    null
  )
})
test('journal command toggles and uses the same close path without mutating case progress', () => {
  ready()
  const before = cityProgress.get()
  assert.equal(executeGameCommand('journal'), true)
  assert.equal(store.get().overlay, 'journal')
  assert.equal(executeGameCommand('journal'), true)
  assert.equal(store.get().overlay, null)
  assert.equal(cityProgress.get(), before)
})
test('M returns field or Circuit City to map without changing owner learning or case evidence', () => {
  ready()
  const before = cityProgress.get(),
    learning = chapter.get()
  assert.equal(executeGameCommand('map'), true)
  assert.equal(store.get().view, 'map')
  assert.equal(cityProgress.get(), before)
  assert.equal(chapter.get(), learning)
  assert.equal(executeGameCommand('map'), false)
  store.set({ view: 'device', ready: true })
  assert.equal(executeGameCommand('map'), true)
  assert.equal(cityProgress.get(), before)
})
test('commands cannot interrupt pause, modal, connection, inactive game or loading', () => {
  ready()
  for (const block of [
    { paused: true },
    { overlay: 'terminal' as const },
    { overlay: 'witness' as const },
    { connectionRunning: true },
    { ready: false },
  ]) {
    ready()
    store.set(block)
    const before = store.get()
    for (const command of ['journal', 'map', 'hint'] as const)
      assert.equal(executeGameCommand(command), false)
    assert.equal(store.get(), before)
  }
  ready()
  assert.equal(executeGameCommand('journal', { active: false }), false)
})
test('H shares one hint state and closing/changing a view clears the connection flag', () => {
  ready()
  assert.equal(executeGameCommand('hint'), true)
  assert.equal(store.get().hintOpen, true)
  assert.equal(executeGameCommand('hint'), true)
  assert.equal(store.get().hintOpen, false)
  store.set({ overlay: 'hack', connectionRunning: true })
  closeGameOverlay()
  assert.equal(store.get().connectionRunning, false)
  store.set({ overlay: 'hack', connectionRunning: true })
  store.set({ view: 'map' })
  assert.equal(store.get().connectionRunning, false)
})
