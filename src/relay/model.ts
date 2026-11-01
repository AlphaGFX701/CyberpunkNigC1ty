import { tasks, finalTask, relayClues, type ClueId } from './content.ts'
import { validateTask, validateImage, type AnswerResult } from './validate.ts'
import { validatePuzzle, type PuzzleAnswer } from './puzzles.ts'
import type { TaskObservation } from '../chapter/model.ts'

export type RelaySnapshot = Readonly<{
  version: 1
  spoken: boolean
  clues: readonly ClueId[]
  entered: boolean
  completed: readonly number[]
  puzzleCompleted: readonly number[]
  observations: readonly TaskObservation[]
  finalRecovered: boolean
  departureSeen: boolean
  arrivalSeen: boolean
  conclusionSeen: boolean
  storageWarning: boolean
}>
type RelayStorage = Pick<Storage, 'getItem' | 'setItem'>
type StoryId = 'departure' | 'arrival' | 'conclusion'
const clues: readonly ClueId[] = ['workorder', 'module']
const freshObservation = (): TaskObservation => ({ attempts: 0, usedHint: false, revealed: false })
const immutable = (value: RelaySnapshot): RelaySnapshot =>
  Object.freeze({
    ...value,
    clues: Object.freeze([...value.clues]),
    completed: Object.freeze([...value.completed]),
    puzzleCompleted: Object.freeze([...value.puzzleCompleted]),
    observations: Object.freeze(value.observations.map((v) => Object.freeze({ ...v }))),
  })
const fresh = (storageWarning = false) =>
  immutable({
    version: 1,
    spoken: false,
    clues: [],
    entered: false,
    completed: [],
    puzzleCompleted: [],
    observations: Array.from({ length: 8 }, freshObservation),
    finalRecovered: false,
    departureSeen: false,
    arrivalSeen: false,
    conclusionSeen: false,
    storageWarning,
  })
const resolveStorage = (): RelayStorage | null => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}
const sequence = (value: unknown): value is number[] =>
  Array.isArray(value) && value.length <= 7 && value.every((v, i) => v === i)
function read(storage: RelayStorage | null, key: string): RelaySnapshot {
  if (!storage) return fresh()
  try {
    const raw = storage.getItem(key)
    if (!raw) return fresh()
    const v = JSON.parse(raw) as RelaySnapshot
    if (
      !v ||
      v.version !== 1 ||
      ![
        'spoken',
        'entered',
        'finalRecovered',
        'departureSeen',
        'arrivalSeen',
        'conclusionSeen',
      ].every((k) => typeof v[k as keyof RelaySnapshot] === 'boolean') ||
      !Array.isArray(v.clues) ||
      v.clues.length > 2 ||
      v.clues.some((c) => !clues.includes(c)) ||
      new Set(v.clues).size !== v.clues.length ||
      !sequence(v.completed) ||
      !sequence(v.puzzleCompleted) ||
      v.puzzleCompleted.length < v.completed.length ||
      v.puzzleCompleted.length > v.completed.length + 1 ||
      !Array.isArray(v.observations) ||
      v.observations.length !== 8 ||
      !v.observations.every(
        (o) =>
          o &&
          Number.isSafeInteger(o.attempts) &&
          o.attempts >= 0 &&
          typeof o.usedHint === 'boolean' &&
          typeof o.revealed === 'boolean'
      ) ||
      (v.clues.length > 0 && !v.spoken) ||
      (v.entered && v.clues.length !== 2) ||
      (v.puzzleCompleted.length > 0 && !v.entered) ||
      (v.finalRecovered && v.completed.length !== 7) ||
      (v.conclusionSeen && !v.finalRecovered)
    )
      return fresh(true)
    return immutable({
      ...v,
      clues: clues.filter((c) => v.clues.includes(c)),
      storageWarning: false,
    })
  } catch {
    return fresh(true)
  }
}

/** Relay learning owns its gates; only the integration awards a city milestone. */
export function createRelay(storage: RelayStorage | null = resolveStorage()) {
  let key = 'techcare.chapter-relay.v1:guest:0'
  let draftEpoch = 0
  let current = read(storage, key)
  const listeners = new Set<() => void>()
  const notify = () => {
    for (const listener of [...listeners]) listener()
  }
  const publish = (next: RelaySnapshot) => {
    let storageWarning = false
    try {
      storage?.setItem(key, JSON.stringify(next))
    } catch {
      storageWarning = true
    }
    current = immutable({ ...next, storageWarning })
    notify()
  }
  const patch = (next: Partial<RelaySnapshot>) => publish({ ...current, ...next })
  const observe = (index: number, next: Partial<TaskObservation>) =>
    patch({
      observations: current.observations.map((o, i) => (i === index ? { ...o, ...next } : o)),
    })
  const canHack = () => current.spoken && current.clues.length === 2
  const canOpenTask = (index: number) =>
    Number.isInteger(index) &&
    index >= 0 &&
    index < 7 &&
    current.entered &&
    index <= current.completed.length
  const canEditTask = (index: number) =>
    canOpenTask(index) && current.puzzleCompleted.includes(index)
  const canRecoverImage = () => current.entered && current.completed.length === 7
  const available = (index: number) => (index === 7 ? canRecoverImage() : canOpenTask(index))
  return {
    get: () => current,
    getDraftScope: () => `${key}:draft-${draftEpoch}`,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    activateOwner: (owner: string, generation: number) => {
      const next = `techcare.chapter-relay.v1:${encodeURIComponent(owner)}:${Number.isSafeInteger(generation) && generation >= 0 ? generation : 0}`
      if (key === next) return
      key = next
      current = read(storage, key)
      notify()
    },
    markStory: (id: StoryId) => {
      if (
        !['departure', 'arrival', 'conclusion'].includes(id) ||
        (id === 'conclusion' && !current.finalRecovered)
      )
        return false
      const field = `${id}Seen` as 'departureSeen' | 'arrivalSeen' | 'conclusionSeen'
      if (!current[field]) patch({ [field]: true })
      return true
    },
    talkToOfficer: () => {
      if (!current.spoken) patch({ spoken: true })
    },
    collectClue: (id: ClueId) => {
      if (!current.spoken || !clues.includes(id)) return false
      if (!current.clues.includes(id))
        patch({ clues: clues.filter((c) => c === id || current.clues.includes(c)) })
      return true
    },
    canHack,
    startHack: () => {
      if (!canHack()) return false
      if (!current.entered) patch({ entered: true })
      return true
    },
    canOpenTask,
    canEditTask,
    submitPuzzle: (index: number, answer: PuzzleAnswer): AnswerResult => {
      if (!canOpenTask(index))
        return { ok: false, feedback: 'เขตนี้ยังล็อก ซ่อมเขตก่อนหน้าให้สำเร็จก่อน' }
      const result = validatePuzzle(index, answer)
      if (result.ok && !current.puzzleCompleted.includes(index))
        patch({ puzzleCompleted: [...current.puzzleCompleted, index] })
      return result
    },
    checkTask: (index: number, input: string): AnswerResult => {
      if (index === 7)
        return canRecoverImage()
          ? validateImage(input)
          : { ok: false, feedback: 'คืนระบบเจ็ดเขตก่อนเปิดหอบันทึกต้นฉบับ' }
      return canEditTask(index)
        ? validateTask(index, input)
        : { ok: false, feedback: 'ผ่าน Puzzle ของเขตนี้ก่อนเริ่มตรวจโค้ด' }
    },
    submitTask: (index: number, input: string): AnswerResult => {
      if (!canEditTask(index))
        return { ok: false, feedback: 'ผ่าน Puzzle ของเขตนี้ก่อนส่งคำสั่งซ่อม' }
      const result = validateTask(index, input)
      patch({
        observations: current.observations.map((o, i) =>
          i === index ? { ...o, attempts: o.attempts + 1 } : o
        ),
        completed:
          result.ok && !current.completed.includes(index)
            ? [...current.completed, index]
            : current.completed,
      })
      return result
    },
    useHint: (index: number) => {
      if (!available(index)) return 'เปิดเขตก่อนหน้าให้ครบก่อน'
      observe(index, { usedHint: true })
      return index === 7 ? finalTask.hint : tasks[index].hint
    },
    reveal: (index: number) => {
      if (!available(index)) return ''
      observe(index, { revealed: true })
      return index === 7 ? finalTask.solution : tasks[index].solution
    },
    canRecoverImage,
    submitImage: (input: string): AnswerResult => {
      if (!canRecoverImage())
        return {
          ok: false,
          feedback: `คืนระบบทั้งเจ็ดเขตก่อนเปิดต้นฉบับ (${current.completed.length}/7)`,
        }
      const result = validateImage(input)
      patch({
        finalRecovered: current.finalRecovered || result.ok,
        observations: current.observations.map((o, i) =>
          i === 7 ? { ...o, attempts: o.attempts + 1 } : o
        ),
      })
      return result
    },
    reset: () => {
      draftEpoch++
      publish(fresh())
    },
  }
}
export const relay = createRelay()
export const relayScore = (state: RelaySnapshot) =>
  state.completed.length * 10 + (state.finalRecovered ? 30 : 0)
export function relayObjective(s: RelaySnapshot) {
  if (!s.spoken) return 'คุยกับเจ้าหน้าที่เวรเพื่อเปิดทางซ่อมบำรุง'
  if (s.clues.length < 2) return `ตรวจใบงานและโมดูลบันทึก (${s.clues.length}/2)`
  if (!s.entered) return 'เชื่อม RELAY-02 เข้าสู่ Circuit City'
  if (s.completed.length < 7)
    return `คืนระบบ: ${tasks[s.completed.length].title} (${s.completed.length}/7)`
  if (!s.finalRecovered) return 'เปิดหอบันทึกต้นฉบับกลาง Circuit City'
  return 'เก็บบันทึกต้นฉบับ แล้วตามต่อไปศูนย์ควบคุม'
}
export function relayGuidance(s: RelaySnapshot) {
  if (!s.spoken) return 'ถามคนเฝ้าก่อน ถ้าปีนรั้วเข้าไปเลย ฉันต้องเป็นฝ่ายอธิบายยาว'
  if (!s.clues.includes('workorder'))
    return 'ใบงานอยู่โต๊ะเวร อ่านเลขหน่วยด้วย ฉันเริ่มไม่ชอบลายมือคนนี้แล้ว'
  if (!s.clues.includes('module'))
    return 'อ้อมไปฐานเสาด้านขวา โมดูลบันทึกยังติดอยู่กับแผง ไม่ต้องถอดทั้งเสานะ'
  if (!s.entered) return 'ได้ข้อมูลครบแล้ว ไปตู้ RELAY-02 ฉันดูทางให้ เธอดูโค้ด'
  if (s.completed.length < 7)
    return `เขต ${s.completed.length + 1} รออยู่ ข้อมูลไม่หนี แต่คนส่งมันอาจหนีไปแล้ว ค่อย ๆ อ่านให้ครบ`
  if (!s.finalRecovered) return 'หอบันทึกเปิดแล้ว ไปดูต้นฉบับ อย่าเพิ่งเชื่อฉบับที่เขาคัดมาให้เรา'
  return 'มีรายการหายจริง แต่ยังไม่รู้ว่าใครลบ เก็บหลักฐานไปถามที่ศูนย์ควบคุม'
}
export { tasks, finalTask, relayClues }
