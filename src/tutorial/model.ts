export type TutorialStatus = 'unseen' | 'active' | 'completed' | 'skipped'
export type TutorialStepId =
  | 'intro'
  | 'intro-joke'
  | 'case'
  | 'case-more'
  | 'camera-intro'
  | 'camera-demo'
  | 'camera-fallback'
  | 'rotate'
  | 'zoom'
  | 'reset'
  | 'journal-open'
  | 'journal-read'
  | 'menu-open'
  | 'menu-settings'
  | 'settings-read'
  | 'menu-return'
  | 'list-open'
  | 'select-arun'
  | 'travel'
  | 'street-walk'
  | 'witness-open'
  | 'witness-read'
  | 'traces'
  | 'field-map'
  | 'field-return'
  | 'camera-enter'
  | 'chip-open'
  | 'puzzle'
  | 'snippet'
  | 'undo'
  | 'repair'
  | 'repair-submit'
  | 'repair-read'
  | 'return-map'
  | 'done'
export type StepId = TutorialStepId
export type TutorialChoice = 'chief' | 'brief' | 'ready' | 'more'
export type TutorialEvent =
  | 'camera-demo-done'
  | 'camera-rotated'
  | 'camera-zoomed'
  | 'camera-reset'
  | 'renderer-list'
  | 'journal-opened'
  | 'journal-closed'
  | 'menu-opened'
  | 'settings-opened'
  | 'settings-closed'
  | 'menu-closed'
  | 'areas-opened'
  | 'area-arun-selected'
  | 'street-arrived'
  | 'walked'
  | 'witness-opened'
  | 'witness-closed'
  | 'witness-dismissed'
  | 'device-arrived'
  | 'clues-collected'
  | 'terminal-opened'
  | 'puzzle-solved'
  | 'editor-snippet'
  | 'editor-undo'
  | 'code-checked'
  | 'first-repair-submitted'
  | 'cam-repaired'
  | 'terminal-closed'
  | 'map-returned'

export type TutorialSnapshot = Readonly<{
  status: TutorialStatus
  step: TutorialStepId | null
  offered: boolean
  storageWarning: boolean
  revision: number
}>
export type TutorialStorage = Pick<Storage, 'getItem' | 'setItem'>
export const tutorialKey = 'techcare.tutorial.v1'
export const tutorialStorageKey = tutorialKey

const statuses: readonly TutorialStatus[] = ['unseen', 'active', 'completed', 'skipped']
const cameraSteps: readonly TutorialStepId[] = [
  'camera-intro',
  'camera-demo',
  'rotate',
  'zoom',
  'reset',
]
const events: Partial<Record<TutorialStepId, readonly [TutorialEvent, TutorialStepId]>> = {
  'camera-demo': ['camera-demo-done', 'rotate'],
  rotate: ['camera-rotated', 'zoom'],
  zoom: ['camera-zoomed', 'reset'],
  reset: ['camera-reset', 'journal-open'],
  'journal-open': ['journal-opened', 'journal-read'],
  'journal-read': ['journal-closed', 'menu-open'],
  'menu-open': ['menu-opened', 'menu-settings'],
  'menu-settings': ['settings-opened', 'settings-read'],
  'settings-read': ['settings-closed', 'menu-return'],
  'menu-return': ['menu-closed', 'list-open'],
  'list-open': ['areas-opened', 'select-arun'],
  'select-arun': ['area-arun-selected', 'travel'],
  travel: ['street-arrived', 'street-walk'],
  'street-walk': ['walked', 'witness-open'],
  'witness-open': ['witness-opened', 'witness-read'],
  'witness-read': ['witness-closed', 'traces'],
  traces: ['clues-collected', 'field-map'],
  'field-map': ['map-returned', 'field-return'],
  'field-return': ['street-arrived', 'camera-enter'],
  'camera-enter': ['device-arrived', 'chip-open'],
  'chip-open': ['terminal-opened', 'puzzle'],
  puzzle: ['puzzle-solved', 'snippet'],
  snippet: ['editor-snippet', 'undo'],
  undo: ['editor-undo', 'repair'],
  repair: ['code-checked', 'repair-submit'],
  'repair-submit': ['first-repair-submitted', 'repair-read'],
  'repair-read': ['terminal-closed', 'return-map'],
  'return-map': ['map-returned', 'done'],
}
const nextSteps: Partial<Record<TutorialStepId, TutorialStepId>> = {
  'intro-joke': 'case',
  'case-more': 'camera-intro',
  'camera-intro': 'camera-demo',
  'camera-fallback': 'journal-open',
}

function resolveStorage(provided: TutorialStorage | null | undefined) {
  if (provided !== undefined) return { storage: provided, warning: provided === null }
  if (typeof window === 'undefined') return { storage: null, warning: false }
  try {
    return { storage: window.localStorage as TutorialStorage, warning: false }
  } catch {
    return { storage: null, warning: true }
  }
}

function load(
  storage: TutorialStorage | null,
  warning: boolean,
  key = tutorialKey
): TutorialSnapshot {
  let status: TutorialStatus = 'unseen'
  let updateAvailable = false
  if (storage) {
    try {
      const text = storage.getItem(key)
      if (text !== null) {
        const raw = JSON.parse(text)
        if (!raw || Array.isArray(raw) || raw.version !== 1 || !statuses.includes(raw.status))
          warning = true
        else {
          status = raw.status
          updateAvailable = ['completed', 'skipped'].includes(status) && raw.guideVersion !== 2
        }
      }
    } catch {
      warning = true
    }
  }
  // A stored active guide is an invitation to resume, never a hidden input lock.
  return Object.freeze({
    status,
    step: null,
    offered: status === 'active' || updateAvailable,
    storageWarning: warning,
    revision: 0,
  })
}

/** Finite instruction flow. Drawing, real actions and case progress remain in their owners. */
export function createTutorial(providedStorage?: TutorialStorage | null) {
  const { storage, warning } = resolveStorage(providedStorage)
  let current = load(storage, warning)
  let storageKey = tutorialKey
  let firstMapActivated = false
  const listeners = new Set<() => void>()

  const publish = (
    status: TutorialStatus,
    step: TutorialStepId | null,
    offered = false,
    storageWarning = current.storageWarning
  ) => {
    if (
      current.status === status &&
      current.step === step &&
      current.offered === offered &&
      current.storageWarning === storageWarning
    )
      return false
    current = Object.freeze({
      status,
      step,
      offered,
      storageWarning,
      revision: current.revision + 1,
    })
    for (const listener of [...listeners]) listener()
    return true
  }
  const save = (status: TutorialStatus) => {
    if (!storage) return warning
    try {
      // Steps, camera commands and code drafts deliberately never enter storage.
      storage.setItem(storageKey, JSON.stringify({ version: 1, status, guideVersion: 2 }))
      return false
    } catch {
      return true
    }
  }
  const begin = () => {
    firstMapActivated = true
    return publish('active', 'intro', false, save('active'))
  }
  const move = (step: TutorialStepId) => publish('active', step)

  return {
    activateOwner: (key: string): void => {
      storageKey = key
      firstMapActivated = false
      const next = load(storage, warning, key)
      publish(next.status, null, next.offered, next.storageWarning)
    },
    get: () => current,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    activateFirstMap: (hasCaseProgress: boolean): void => {
      if (firstMapActivated) return
      firstMapActivated = true
      if (current.step !== null || current.status === 'completed' || current.status === 'skipped')
        return
      if (current.status === 'active' || hasCaseProgress) publish(current.status, null, true)
      else begin()
    },
    start: begin,
    replay: begin,
    dismissOffer: (): boolean => publish(current.status, null, false, save(current.status)),
    skip: (): boolean => {
      if (current.status === 'skipped' && current.step === null && !current.offered) return false
      return publish('skipped', null, false, save('skipped'))
    },
    resetNewCase: (): void => {
      firstMapActivated = false
      publish('unseen', null, false, save('unseen'))
    },
    choose: (choice: TutorialChoice): boolean => {
      if (current.step === 'intro') {
        if (choice === 'chief') return move('intro-joke')
        if (choice === 'brief') return move('case')
      }
      if (current.step === 'case') {
        if (choice === 'ready') return move('camera-intro')
        if (choice === 'more') return move('case-more')
      }
      return false
    },
    next: (): boolean => {
      if (current.step === 'done') return publish('completed', null, false, save('completed'))
      const next = current.step ? nextSteps[current.step] : undefined
      return next ? move(next) : false
    },
    notify: (event: TutorialEvent): boolean => {
      const step = current.step
      if (!step) return false
      if (event === 'witness-dismissed' && step === 'witness-read') return move('witness-open')
      // Closing an unfinished editor must release the player to reopen it.
      if (
        event === 'terminal-closed' &&
        ['puzzle', 'snippet', 'undo', 'repair', 'repair-submit'].includes(step)
      )
        return move('chip-open')
      if (event === 'renderer-list' && cameraSteps.includes(step)) return move('camera-fallback')
      const expected = events[step]
      return expected?.[0] === event ? move(expected[1]) : false
    },
  }
}
export type Tutorial = ReturnType<typeof createTutorial>
export const tutorial = createTutorial()
