export const preferenceKey = 'techcare.entry.v1'
export type Preferences = {
  version: 1
  name: string
  music: number
  sfx: number
  talkSound: boolean
  reduceMotion: boolean
}
export const defaultPreferences: Preferences = {
  version: 1,
  name: 'คิน',
  music: 35,
  sfx: 60,
  talkSound: true,
  reduceMotion: false,
}
const volume = (v: unknown, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : fallback
export function officerName(value: string) {
  return value.trim().slice(0, 32) || defaultPreferences.name
}
export function loadPreferences(storage: Pick<Storage, 'getItem'> | null): Preferences {
  try {
    const raw = JSON.parse(storage?.getItem(preferenceKey) ?? 'null')
    if (!raw || raw.version !== 1) return { ...defaultPreferences }
    return {
      version: 1,
      name: typeof raw.name === 'string' ? officerName(raw.name) : defaultPreferences.name,
      music: volume(raw.music, defaultPreferences.music),
      sfx: volume(raw.sfx, defaultPreferences.sfx),
      talkSound: typeof raw.talkSound === 'boolean' ? raw.talkSound : defaultPreferences.talkSound,
      reduceMotion: typeof raw.reduceMotion === 'boolean' ? raw.reduceMotion : false,
    }
  } catch {
    return { ...defaultPreferences }
  }
}
export function savePreferences(storage: Pick<Storage, 'setItem'> | null, prefs: Preferences) {
  try {
    if (!storage) return false
    storage.setItem(preferenceKey, JSON.stringify(prefs))
    return true
  } catch {
    return false
  }
}
export function localPreferencesStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}
