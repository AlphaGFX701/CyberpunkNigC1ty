export type AreaId = 'base' | 'arun' | 'relay' | 'control'
export type CityMilestone = 'recover-cam07' | 'read-relay' | 'read-control'
export type CityProgressSnapshot = Readonly<{
  version: 1
  completed: readonly CityMilestone[]
  currentArea: AreaId
  storageWarning: boolean
}>
export type StorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}
export const cityProgressKey = 'techcare.case.v1'

const milestones: readonly CityMilestone[] = ['recover-cam07', 'read-relay', 'read-control']
const areas: readonly AreaId[] = ['base', 'arun', 'relay', 'control']

/** Visibility, pin selection and travel all consume this same dependency rule. */
export function canAccessArea(
  snapshot: Pick<CityProgressSnapshot, 'completed'>,
  area: AreaId
): boolean {
  switch (area) {
    case 'base':
    case 'arun':
      return true
    case 'relay':
      return snapshot.completed.includes('recover-cam07')
    case 'control':
      return (
        snapshot.completed.includes('recover-cam07') && snapshot.completed.includes('read-relay')
      )
    default:
      return false
  }
}

function snapshot(
  completed: readonly CityMilestone[] = [],
  currentArea: AreaId = 'base',
  storageWarning = false
): CityProgressSnapshot {
  return Object.freeze({
    version: 1 as const,
    completed: Object.freeze([...completed]),
    currentArea,
    storageWarning,
  })
}

function resolveStorage(provided: StorageLike | null | undefined) {
  if (provided !== undefined) return { storage: provided, unavailable: provided === null }
  // Importing the store in Node or during server rendering must not touch window.
  if (typeof window === 'undefined') return { storage: null, unavailable: false }
  try {
    return { storage: window.localStorage as StorageLike, unavailable: false }
  } catch {
    return { storage: null, unavailable: true }
  }
}

function load(
  storage: StorageLike | null,
  unavailable: boolean,
  key = cityProgressKey
): CityProgressSnapshot {
  if (!storage) return snapshot([], 'base', unavailable)
  try {
    const value = storage.getItem(key)
    if (value === null) return snapshot()
    const raw = JSON.parse(value)
    if (
      !raw ||
      Array.isArray(raw) ||
      raw.version !== 1 ||
      !Array.isArray(raw.completed) ||
      raw.completed.length > milestones.length ||
      !raw.completed.every((item: unknown) => milestones.includes(item as CityMilestone)) ||
      new Set(raw.completed).size !== raw.completed.length ||
      !areas.includes(raw.currentArea)
    )
      return snapshot([], 'base', true)

    const completed = milestones.filter((item) => raw.completed.includes(item))
    if (
      (completed.includes('read-relay') && !completed.includes('recover-cam07')) ||
      (completed.includes('read-control') && !completed.includes('read-relay')) ||
      !canAccessArea({ completed }, raw.currentArea)
    )
      return snapshot([], 'base', true)

    // Extra stored fields (including claimed unlocks) are never authoritative.
    return snapshot(completed, raw.currentArea)
  } catch {
    return snapshot([], 'base', true)
  }
}

export function createCityProgress(providedStorage?: StorageLike | null) {
  const { storage, unavailable } = resolveStorage(providedStorage)
  let current = load(storage, unavailable)
  let storageKey = cityProgressKey
  const listeners = new Set<() => void>()

  const publish = (
    completed: readonly CityMilestone[],
    currentArea: AreaId,
    storageWarning: boolean
  ) => {
    if (
      current.currentArea === currentArea &&
      current.storageWarning === storageWarning &&
      completed.length === current.completed.length &&
      completed.every((item, index) => item === current.completed[index])
    )
      return
    current = snapshot(completed, currentArea, storageWarning)
    for (const listener of [...listeners]) listener()
  }

  const save = (completed: readonly CityMilestone[], currentArea: AreaId) => {
    if (!storage) return unavailable
    try {
      storage.setItem(storageKey, JSON.stringify({ version: 1, completed, currentArea }))
      return false
    } catch {
      return true
    }
  }

  const complete = (milestone: CityMilestone) => {
    if (current.completed.includes(milestone) && !current.storageWarning) return
    const completed = milestones.filter(
      (item) => item === milestone || current.completed.includes(item)
    )
    publish(completed, current.currentArea, save(completed, current.currentArea))
  }

  return {
    activateOwner: (
      key: string,
      value?: { version: 1; completed: readonly CityMilestone[]; currentArea: AreaId }
    ): void => {
      storageKey = key
      const source = value
        ? { getItem: () => JSON.stringify(value), setItem: () => {}, removeItem: () => {} }
        : storage
      const next = load(source, unavailable, key)
      publish(next.completed, next.currentArea, next.storageWarning)
    },
    hydrate: (value: {
      version: 1
      completed: readonly CityMilestone[]
      currentArea: AreaId
    }): void => {
      const next = load(
        { getItem: () => JSON.stringify(value), setItem: () => {}, removeItem: () => {} },
        false
      )
      publish(next.completed, next.currentArea, save(next.completed, next.currentArea))
    },
    get: () => current,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    recordCamRecovery: (): void => {
      complete('recover-cam07')
    },
    readIntel: (area: 'relay' | 'control'): boolean => {
      if ((area !== 'relay' && area !== 'control') || !canAccessArea(current, area)) return false
      complete(area === 'relay' ? 'read-relay' : 'read-control')
      return true
    },
    arrive: (area: AreaId): boolean => {
      if (!canAccessArea(current, area)) return false
      if (current.currentArea !== area || current.storageWarning) {
        publish(current.completed, area, save(current.completed, area))
      }
      return true
    },
    reset: (): void => {
      let warning = unavailable
      if (storage) {
        try {
          storage.removeItem(storageKey)
        } catch {
          warning = true
        }
      }
      publish([], 'base', warning)
    },
  }
}

export type CityProgress = ReturnType<typeof createCityProgress>
export const cityProgress = createCityProgress()
