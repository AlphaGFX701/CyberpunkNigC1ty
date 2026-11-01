import { cityProgress, canAccessArea } from './city/progression.ts'
import { chapter } from './chapter/model.ts'
import { relay } from './relay/model.ts'
import { relayEntry, relayPoints, relaySolids, relayClosedGate } from './relay/layout.ts'
import {
  streetSize,
  deviceSize,
  streetPoints,
  streetSolids,
  deviceSolids,
  recoveryPoints,
  deviceEntry,
  deviceExit,
} from './chapter/layout.ts'
import { tutorial } from './tutorial/model.ts'
import { recordTutorialWalk, tutorialAllows } from './tutorial/controls.ts'
export type View = 'map' | 'street' | 'device' | 'boss'
export type Point = { x: number; y: number }
export type Rect = Point & { w: number; h: number }
export type Overlay =
  | 'relay-departure'
  | 'relay-arrival'
  | 'relay-conclusion'
  | 'brief'
  | 'witness'
  | 'terminal'
  | 'journal'
  | 'boss'
  | 'intel'
  | 'clue-receipt'
  | 'clue-relay'
  | 'hack'
  | 'recovery'
  | null
export const stops = [
  { x: 165, y: 565, title: 'ฐาน TechCare', tag: 'จุดเริ่มต้น' },
  { x: 385, y: 330, title: 'ร้านช่างอรุณ', tag: 'ตอน 01 · ภาพสุดท้าย' },
  { x: 740, y: 495, title: 'สถานีสื่อสาร', tag: 'ตอน 02 · สัญญาณที่ไม่มีในรายงาน' },
  { x: 1070, y: 230, title: 'ศูนย์ควบคุม', tag: 'ตอน 03 · เส้นทางที่ถูกลบ' },
]
export const route: Point[] = [
  { x: 165, y: 565 },
  { x: 165, y: 470 },
  { x: 385, y: 470 },
  { x: 385, y: 330 },
  { x: 575, y: 330 },
  { x: 575, y: 580 },
  { x: 740, y: 580 },
  { x: 740, y: 495 },
  { x: 950, y: 495 },
  { x: 950, y: 230 },
  { x: 1070, y: 230 },
]
export const nodes = recoveryPoints
export const circuitPath: Point[] = [deviceEntry, ...nodes]
export const solids: Record<View, Rect[]> = {
  map: [],
  street: [...streetSolids],
  device: [...deviceSolids],
  boss: [],
}
export function movePoint(
  p: Point,
  dx: number,
  dy: number,
  dt: number,
  obstacles: Rect[],
  tiny = false
): Point {
  const norm = Math.hypot(dx, dy) || 1,
    speed = tiny ? 145 : 220,
    radius = tiny ? 8 : 13
  const amount = Math.min(dt, 0.05) * speed
  if (state.view === 'street' && state.activeChapter === 'relay')
    obstacles = [...relaySolids, ...(!relay.get().spoken ? [relayClosedGate] : [])]
  const size = tiny
    ? deviceSize
    : state.view === 'street'
      ? streetSize
      : { width: 1280, height: 720 }
  const valid = (x: number, y: number) =>
    x >= 60 &&
    x <= size.width - 60 &&
    y >=
      (tiny
        ? 190
        : state.view === 'street'
          ? state.activeChapter === 'relay'
            ? 355
            : 390
          : 220) &&
    y <= size.height - 55 &&
    !obstacles.some(
      (r) =>
        x + radius > r.x && x - radius < r.x + r.w && y + radius > r.y && y - radius < r.y + r.h
    )
  const x = p.x + (dx / norm) * amount,
    y = p.y + (dy / norm) * amount
  const next = { ...p }
  if (valid(x, p.y)) next.x = x
  if (valid(next.x, y)) next.y = y
  return next
}
export const initialPositions: Record<View, Point> = {
  map: { ...stops[0] },
  street: { x: 475, y: 782 },
  device: { ...deviceEntry },
  boss: { x: 330, y: 565 },
}
type State = {
  activeChapter: 'arun' | 'relay'
  view: View
  positions: Record<View, Point>
  overlay: Overlay
  taskIndex: number
  paused: boolean
  connectionRunning: boolean
  hintOpen: boolean
  reduceMotion: boolean
  selectedStop: number
  destination: number | null
  repaired: boolean
  toast: string
  ready: boolean
  error: string
}
let state: State = {
  activeChapter: 'arun',
  view: 'map',
  positions: structuredClone(initialPositions),
  overlay: null,
  taskIndex: 0,
  paused: false,
  connectionRunning: false,
  hintOpen: false,
  reduceMotion: false,
  selectedStop: 0,
  destination: null,
  repaired: false,
  toast: '',
  ready: false,
  error: '',
}
const listeners = new Set<() => void>()
export const store = {
  get: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  set: (patch: Partial<State>) => {
    state = { ...state, ...patch }
    if (('overlay' in patch && patch.overlay !== 'hack') || 'view' in patch)
      state.connectionRunning = false
    listeners.forEach((l) => l())
  },
}
export function changeView(view: View) {
  const step = tutorial.get().step
  if (
    step &&
    ((view === 'street' && step !== 'travel' && step !== 'field-return') ||
      (view === 'device' && step !== 'camera-enter') ||
      (view === 'map' && step !== 'return-map' && step !== 'field-map') ||
      view === 'boss')
  )
    return
  const current = state.activeChapter === 'relay' ? relay : chapter
  if (view !== 'map' && !canAccessArea(cityProgress.get(), state.activeChapter)) return
  if (view === 'device' && !current.canHack()) {
    store.set({ toast: 'คุยกับพยานและค้นเบาะแสสองจุดก่อนเชื่อมต่อเครื่อง' })
    return
  }
  if (view === 'device' && !current.startHack()) return
  if (view !== 'map' && !cityProgress.arrive(state.activeChapter)) return
  store.set({
    view,
    connectionRunning: false,
    overlay: null,
    destination: null,
    ready: state.view === view ? state.ready : false,
    toast: '',
  })
  if (view === 'street' && state.activeChapter === 'arun') tutorial.notify('street-arrived')
  if (view === 'device' && state.activeChapter === 'arun') tutorial.notify('device-arrived')
  if (view === 'map') tutorial.notify('map-returned')
}
export function enterField(chapterId: 'arun' | 'relay') {
  if (tutorial.get().step && chapterId !== 'arun') return
  if (!cityProgress.arrive(chapterId)) return
  const changed = state.activeChapter !== chapterId
  store.set({
    activeChapter: chapterId,
    positions: changed
      ? {
          ...state.positions,
          street: chapterId === 'relay' ? { ...relayEntry } : { ...initialPositions.street },
        }
      : state.positions,
  })
  changeView('street')
}
export function setPosition(p: Point) {
  const before = state.positions[state.view]
  store.set({ positions: { ...state.positions, [state.view]: p } })
  if (state.view === 'street') recordTutorialWalk(Math.hypot(p.x - before.x, p.y - before.y))
}
export function interact() {
  const s = store.get()
  if (s.overlay || s.paused) return
  if (!tutorialAllows('world-interact')) return
  if (s.view === 'map') {
    store.set({ toast: 'เลือกหมุดหรือรายชื่อพื้นที่ แล้วกดเข้าสำรวจ' })
    return
  }
  if (s.view === 'boss') {
    store.set({ overlay: 'boss' })
    return
  }
  if (s.view === 'street') {
    if (s.activeChapter === 'relay') {
      const p = s.positions.street
      const near = (key: keyof typeof relayPoints, range = 100) =>
        Math.hypot(p.x - relayPoints[key].x, p.y - relayPoints[key].y) < range
      if (near('officer', 105)) {
        store.set({ overlay: 'witness' })
        return
      }
      if (near('workorder', 95) || near('module', 95)) {
        if (!relay.get().spoken) {
          store.set({ toast: 'ถามเจ้าหน้าที่เวรก่อน เขายังไม่ได้เปิดทางให้เรา' })
          return
        }
        store.set({ overlay: near('workorder', 95) ? 'clue-receipt' : 'clue-relay' })
        return
      }
      if (near('terminal', 110)) {
        if (!relay.canHack()) {
          store.set({ toast: 'ยังขาดใบงานหรือโมดูลบันทึก ตรวจสองจุดให้ครบก่อนเชื่อม RELAY-02' })
          return
        }
        store.set({ overlay: 'hack' })
        return
      }
      if (near('evidence', 90)) {
        if (
          !relay.get().finalRecovered &&
          !cityProgress.get().completed.includes('recover-relay')
        ) {
          store.set({ toast: 'ต้นฉบับยังล็อก เข้า RELAY-02 เพื่อกู้หน้าบันทึกให้ครบก่อน' })
          return
        }
        store.set({ overlay: 'relay-conclusion' })
        return
      }
      if (near('exit')) {
        changeView('map')
        return
      }
      store.set({ toast: 'เดินตาม Marker ไปคุยพยาน ตรวจแผง หรือเข้าใกล้ RELAY-02 แล้วกด E' })
      return
    }
    const p = s.positions.street
    const near = (key: keyof typeof streetPoints, range = 100) =>
      Math.hypot(p.x - streetPoints[key].x, p.y - streetPoints[key].y) < range
    if (near('arun', 120)) {
      if (tutorial.get().step && tutorial.get().step !== 'witness-open') return
      store.set({ overlay: 'witness' })
      tutorial.notify('witness-opened')
      return
    }
    if (near('receipt') || near('relay')) {
      if (!chapter.get().spoken) {
        store.set({ toast: 'ถามลุงอรุณก่อนค้นของในร้าน' })
        return
      }
      store.set({ overlay: near('receipt') ? 'clue-receipt' : 'clue-relay' })
      return
    }
    if (near('terminal', 120)) {
      if (!chapter.canHack()) {
        store.set({ toast: 'ยังขาดร่องรอย ค้นใบรับของที่เคาน์เตอร์ซ้ายกับตัวส่งสัญญาณฝั่งขวาก่อน' })
        return
      }
      store.set({ overlay: 'hack' })
      return
    }
    if (near('camera', 120)) {
      if (!chapter.get().imageRecovered) {
        store.set({
          toast: chapter.canRecoverImage()
            ? 'หอกล้องเปิดแล้ว เข้า Circuit City จากเครื่องซ่อมกลางร้านเพื่อกู้ภาพด่านที่ 8'
            : 'CAM-07 ยังล็อก: ซ่อม HTML ให้ครบ 7 จุดก่อน (' +
              chapter.get().completed.length +
              '/7)',
        })
        return
      }
      store.set({ overlay: 'recovery' })
      return
    }
    if (near('exit', 100)) {
      changeView('map')
      return
    }
    store.set({
      toast: 'เข้าใกล้คนหรือสิ่งของที่มีเครื่องหมาย แล้วกด E — อ้อมชั้นอะไหล่ตามทางเดิน',
    })
    return
  }
  const p = s.positions.device
  if (
    Math.hypot(p.x - deviceEntry.x, p.y - deviceEntry.y) < 85 ||
    Math.hypot(p.x - deviceExit.x, p.y - deviceExit.y) < 85
  ) {
    changeView('street')
    return
  }
  const index = nodes.findIndex((n) => Math.hypot(p.x - n.x, p.y - n.y) < 90)
  if (index >= 0) {
    if (!chapter.canOpenTask(index)) {
      store.set({
        toast: 'จุดนี้ยังล็อก ไปกู้จุด ' + (chapter.get().completed.length + 1) + ' ก่อน',
      })
      return
    }
    store.set({ overlay: 'terminal', taskIndex: index })
    tutorial.notify('terminal-opened')
    return
  }
  store.set({ toast: 'เดินตามวงจรไปหาจุดสีฟ้าที่เปิดอยู่ แล้วกด E' })
}
