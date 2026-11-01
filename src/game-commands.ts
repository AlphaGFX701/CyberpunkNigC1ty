import { store, changeView } from './model.ts'
import { chapter } from './chapter/model.ts'
import { tutorial } from './tutorial/model.ts'
import { tutorialAllows } from './tutorial/controls.ts'

export type GameCommand = 'journal' | 'map' | 'hint'
export type CommandKey = Pick<
  KeyboardEvent,
  | 'code'
  | 'repeat'
  | 'isComposing'
  | 'ctrlKey'
  | 'altKey'
  | 'metaKey'
  | 'shiftKey'
  | 'target'
  | 'defaultPrevented'
>

export function editableGameTarget(target: EventTarget | null): boolean {
  const node = target as HTMLElement | null
  return Boolean(
    node &&
    (node.isContentEditable ||
      node.closest?.('input,textarea,select,[contenteditable="true"],.cm-editor,[role="textbox"]'))
  )
}

/** Physical codes work under Thai and English layouts; never intercept text editing or chords. */
export function commandFromKeyboard(event: CommandKey): GameCommand | null {
  if (
    event.defaultPrevented ||
    event.repeat ||
    event.isComposing ||
    event.ctrlKey ||
    event.altKey ||
    event.metaKey ||
    event.shiftKey ||
    editableGameTarget(event.target)
  )
    return null
  return (
    ({ KeyJ: 'journal', KeyM: 'map', KeyH: 'hint' } as const)[
      event.code as 'KeyJ' | 'KeyM' | 'KeyH'
    ] ?? null
  )
}

/** Single close path for pointer buttons, J and Escape-owned modal callbacks. */
export function closeGameOverlay(): void {
  const { overlay, activeChapter } = store.get()
  store.set({ overlay: null, connectionRunning: false })
  if (overlay === 'journal') tutorial.notify('journal-closed')
  if (overlay === 'witness' && activeChapter === 'arun')
    tutorial.notify(chapter.get().spoken ? 'witness-closed' : 'witness-dismissed')
  if (overlay === 'terminal') tutorial.notify('terminal-closed')
}

export function executeGameCommand(
  command: GameCommand,
  options: { active?: boolean } = {}
): boolean {
  const state = store.get()
  if (options.active === false || state.paused || state.connectionRunning) return false
  if (command === 'journal' && state.overlay === 'journal') {
    closeGameOverlay()
    return true
  }
  if (state.overlay || !state.ready) return false
  if (command === 'journal') {
    if (!tutorialAllows('journal')) return false
    store.set({ overlay: 'journal' })
    tutorial.notify('journal-opened')
    return true
  }
  if (command === 'map') {
    if (state.view === 'map' || !tutorialAllows('return-map')) return false
    changeView('map')
    return store.get().view === 'map'
  }
  if (state.view !== 'street' || !tutorialAllows('hint')) return false
  store.set({ hintOpen: !state.hintOpen })
  return true
}
