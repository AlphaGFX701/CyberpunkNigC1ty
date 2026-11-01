import { tasks, finalTask, chapterClues, type ClueId } from './content.ts'
import { validateTask, validateImage, type AnswerResult } from './validate.ts'
import { validatePuzzle, type PuzzleAnswer } from './puzzles.ts'

export type TaskObservation = Readonly<{ attempts: number; usedHint: boolean; revealed: boolean }>
export type ChapterSnapshot = Readonly<{
  version: 2
  spoken: boolean
  clues: readonly ClueId[]
  entered: boolean
  completed: readonly number[]
  puzzleCompleted: readonly number[]
  observations: readonly TaskObservation[]
  imageRecovered: boolean
  storageWarning: boolean
}>
type ChapterStorage = Pick<Storage, 'getItem' | 'setItem'>
const clueOrder: readonly ClueId[] = ['receipt', 'relay']
const freshObservation = (): TaskObservation => ({ attempts: 0, usedHint: false, revealed: false })
const fresh = (storageWarning = false): ChapterSnapshot =>
  immutable({
    version: 2,
    spoken: false,
    clues: [],
    entered: false,
    completed: [],
    puzzleCompleted: [],
    observations: Array.from({ length: 8 }, freshObservation),
    imageRecovered: false,
    storageWarning,
  })
function immutable(value: ChapterSnapshot): ChapterSnapshot {
  return Object.freeze({
    ...value,
    clues: Object.freeze([...value.clues]),
    completed: Object.freeze([...value.completed]),
    puzzleCompleted: Object.freeze([...value.puzzleCompleted]),
    observations: Object.freeze(
      value.observations.map((observation) => Object.freeze({ ...observation }))
    ),
  })
}
const resolveStorage = (): ChapterStorage | null => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}
const validObservation = (value: unknown): value is TaskObservation => {
  if (!value || typeof value !== 'object') return false
  const v = value as TaskObservation
  return (
    Number.isSafeInteger(v.attempts) &&
    v.attempts >= 0 &&
    typeof v.usedHint === 'boolean' &&
    typeof v.revealed === 'boolean'
  )
}
function read(storage: ChapterStorage | null, key: string): ChapterSnapshot {
  if (!storage) return fresh()
  try {
    const raw = storage.getItem(key)
    if (!raw) return fresh()
    const value = JSON.parse(raw) as ChapterSnapshot | (Omit<ChapterSnapshot, 'version' | 'puzzleCompleted'> & { version: 1 })
    if (
      (value?.version !== 1 && value?.version !== 2) ||
      typeof value.spoken !== 'boolean' ||
      typeof value.entered !== 'boolean' ||
      typeof value.imageRecovered !== 'boolean' ||
      !Array.isArray(value.clues) ||
      value.clues.length > 2 ||
      !value.clues.every((clue) => clueOrder.includes(clue)) ||
      new Set(value.clues).size !== value.clues.length ||
      !Array.isArray(value.completed) ||
      value.completed.length > 7 ||
      !value.completed.every((item, index) => item === index) ||
      !Array.isArray(value.observations) ||
      value.observations.length !== 8 ||
      !value.observations.every(validObservation)
    )
      return fresh(true)
    // A completed legacy code task is already earned; only unfinished tasks gain a puzzle step.
    const puzzleCompleted = value.version === 1 ? [...value.completed] : value.puzzleCompleted
    if (
      !Array.isArray(puzzleCompleted) ||
      puzzleCompleted.length > 7 ||
      puzzleCompleted.length > value.completed.length + 1 ||
      !puzzleCompleted.every((item, index) => item === index) ||
      !value.completed.every((item) => puzzleCompleted.includes(item)) ||
      (puzzleCompleted.length > 0 && !value.entered)
    ) return fresh(true)
    if (
      (value.clues.length && !value.spoken) ||
      (value.entered && value.clues.length !== 2) ||
      (value.completed.length && !value.entered) ||
      (value.imageRecovered && value.completed.length !== 7)
    )
      return fresh(true)
    return immutable({
      ...value,
      version: 2,
      puzzleCompleted,
      clues: clueOrder.filter((clue) => value.clues.includes(clue)),
      storageWarning: false,
    })
  } catch {
    return fresh(true)
  }
}

/** Owns chapter learning gates and observations, never city unlocks or account sessions. */
export function createChapter(storage: ChapterStorage | null = resolveStorage()) {
  let key = 'techcare.chapter-one.v1:guest:0'
  let current = read(storage, key)
  const listeners = new Set<() => void>()
  const publish = (next: ChapterSnapshot) => {
    let storageWarning = false
    try {
      if (storage) storage.setItem(key, JSON.stringify(next))
    } catch {
      storageWarning = true
    }
    current = immutable({ ...next, storageWarning })
    for (const listener of [...listeners]) listener()
  }
  const patch = (value: Partial<ChapterSnapshot>) => publish({ ...current, ...value })
  const observation = (index: number, value: Partial<TaskObservation>) =>
    patch({
      observations: current.observations.map((item, i) =>
        i === index ? { ...item, ...value } : item
      ),
    })
  const canHack = () => current.spoken && current.clues.length === 2
  const canOpenTask = (index: number) =>
    Number.isInteger(index) &&
    index >= 0 &&
    index < 7 &&
    current.entered &&
    index <= current.completed.length
  const canRecoverImage = () => current.completed.length === 7
  const canEditTask = (index: number) => canOpenTask(index) && current.puzzleCompleted.includes(index)
  return {
    get: () => current,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    activateOwner: (owner: string, generation: number) => {
      const nextKey = `techcare.chapter-one.v1:${encodeURIComponent(owner)}:${Number.isSafeInteger(generation) && generation >= 0 ? generation : 0}`
      if (key === nextKey) return
      key = nextKey
      current = read(storage, key)
      for (const listener of [...listeners]) listener()
    },
    talkToArun: () => {
      if (!current.spoken) patch({ spoken: true })
    },
    collectClue: (id: ClueId): boolean => {
      if (!current.spoken || !clueOrder.includes(id)) return false
      if (!current.clues.includes(id))
        patch({ clues: clueOrder.filter((clue) => clue === id || current.clues.includes(clue)) })
      return true
    },
    canHack,
    startHack: (): boolean => {
      if (!canHack()) return false
      if (!current.entered) patch({ entered: true })
      return true
    },
    canOpenTask,
    canEditTask,
    submitPuzzle: (index: number, answer: PuzzleAnswer): AnswerResult => {
      if (!canOpenTask(index))
        return { ok: false, feedback: 'จุดนี้ยังล็อก ทำด่านก่อนหน้าให้สำเร็จก่อน' }
      const result = validatePuzzle(index, answer)
      if (result.ok && !current.puzzleCompleted.includes(index))
        patch({ puzzleCompleted: [...current.puzzleCompleted, index] })
      return result
    },
    checkTask: (index: number, input: string): AnswerResult => {
      if (index === 7) return canRecoverImage()
        ? validateImage(input)
        : { ok: false, feedback: 'คืนระบบทั้งเจ็ดส่วนก่อนเปิดหอกล้อง CAM-07' }
      if (!canEditTask(index))
        return { ok: false, feedback: 'ต่อ Puzzle ของด่านนี้ให้สำเร็จก่อนเติมโค้ด' }
      return validateTask(index, input)
    },
    submitTask: (index: number, input: string): AnswerResult => {
      if (!canOpenTask(index))
        return { ok: false, feedback: 'ยังเปิดจุดนี้ไม่ได้ ทำจุดก่อนหน้าให้สำเร็จก่อน' }
      if (!canEditTask(index))
        return { ok: false, feedback: 'ต่อ Puzzle ของด่านนี้ให้สำเร็จก่อนส่งคำสั่งซ่อม' }
      const answer = validateTask(index, input)
      const observations = current.observations.map((item, i) =>
        i === index ? { ...item, attempts: item.attempts + 1 } : item
      )
      const completed =
        answer.ok && !current.completed.includes(index)
          ? [...current.completed, index]
          : current.completed
      patch({ observations, completed })
      return answer
    },
    useHint: (index: number): string => {
      if (index === 7 ? !canRecoverImage() : !canOpenTask(index))
        return 'เปิดจุดก่อนหน้านี้ให้ครบก่อน'
      observation(index, { usedHint: true })
      return index === 7 ? finalTask.hint : tasks[index].hint
    },
    canRecoverImage,
    submitImage: (input: string): AnswerResult => {
      if (!canRecoverImage())
        return {
          ok: false,
          feedback: `หน้าบันทึกยังไม่ครบ กู้จุด HTML ให้ครบ 7 จุดก่อน (${current.completed.length}/7)`,
        }
      const answer = validateImage(input)
      const observations = current.observations.map((item, i) =>
        i === 7 ? { ...item, attempts: item.attempts + 1 } : item
      )
      patch({ observations, imageRecovered: current.imageRecovered || answer.ok })
      return answer
    },
    reset: () => publish(fresh()),
  }
}
export const chapter = createChapter()
export const chapterScore = (state: ChapterSnapshot) =>
  state.completed.length * 10 + (state.imageRecovered ? 30 : 0)
export function chapterObjective(state: ChapterSnapshot): string {
  if (!state.spoken) return 'คุยกับลุงอรุณที่เคาน์เตอร์'
  if (state.clues.length < 2) return `ค้นร่องรอย NULL รอบร้าน (${state.clues.length}/2)`
  if (!state.entered) return 'เชื่อมต่อเครื่องซ่อมกลางร้านเพื่อเข้า Circuit City'
  if (state.completed.length < 7)
    return `กู้หน้าบันทึก HTML: ${tasks[state.completed.length].title} (${state.completed.length}/7)`
  if (!state.imageRecovered) return 'เปิดหอกล้อง CAM-07 กลาง Circuit City แล้วกู้ภาพผู้ต้องสงสัย'
  return 'หลักฐานครบแล้ว กลับแผนที่เพื่อตรวจสถานีสื่อสาร'
}
export function kinGuidance(state: ChapterSnapshot): string {
  if (!state.spoken) return 'ถามเจ้าของร้านก่อนนะ ถ้าฉันเดินค้นเลย ลุงจะคิดว่าโจรกลับมารอบสอง'
  if (!state.clues.includes('receipt'))
    return 'ใบรับของอยู่เคาน์เตอร์ซ้าย เก็บดูหน่อย ลุงเสียค่าซ่อมปลอมไปแล้ว อย่าไปเสียซ้ำ'
  if (!state.clues.includes('relay'))
    return 'อ้อมชั้นอะไหล่ไปฝั่งขวา ไฟตัวส่งสัญญาณยังติดอยู่ ทั้งที่ลุงปิดเบรกเกอร์แล้ว'
  if (!state.entered)
    return 'ได้ทั้งเวลาและปลายทางแล้ว ไปเครื่องซ่อมกลางร้าน ฉันเฝ้าให้ เธอจัดการโค้ด'
  if (state.completed.length < 7)
    return `จุด ${state.completed.length + 1} รออยู่ อ่านโจทย์ก่อนพิมพ์ได้ ไม่มีใครคิดค่าชั่วโมงเธอหรอก`
  if (!state.imageRecovered)
    return 'ครบเจ็ดส่วนแล้ว หอกล้องกลางเมืองวงจรเปิดแล้ว คราวนี้เราจะเห็นว่าใครเดินผ่านร้าน'
  return 'ภาพชัดแล้ว แต่ยังไม่รีบฟันธง เก็บเวลา ตรา และปลายทางไปเทียบที่สถานีสื่อสารก่อน'
}

export { tasks, chapterClues, validateTask, validateImage }
