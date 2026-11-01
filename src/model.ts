import { cityProgress } from './city/progression.ts'
import { tutorial } from './tutorial/model.ts'
import { recordTutorialWalk, tutorialAllows } from './tutorial/controls.ts'
export type View = 'map' | 'street' | 'device' | 'boss'
export type Point = { x: number; y: number }
export type Rect = Point & { w: number; h: number }
export type Overlay = 'brief' | 'witness' | 'terminal' | 'journal' | 'boss' | 'intel' | null
export const stops = [
  { x: 165, y: 565, title: 'ฐาน TechCare', tag: 'จุดเริ่มต้น' },
  { x: 385, y: 330, title: 'ร้านช่างอรุณ', tag: 'ตอน 01 · ภาพสุดท้าย' },
  { x: 740, y: 495, title: 'สถานีสื่อสาร', tag: 'ตอน 02 · เสียงจากเงา' },
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
export const nodes = [
  { x: 180, y: 565, title: 'ชนิดไฟล์ภาพ', tag: '01' },
  { x: 330, y: 370, title: 'แท็กแสดงภาพ', tag: '02' },
  { x: 520, y: 520, title: 'แหล่งที่อยู่ภาพ', tag: '03' },
  { x: 680, y: 300, title: 'คำอธิบายภาพ', tag: '04' },
  { x: 865, y: 480, title: 'ขนาดภาพ', tag: '05' },
  { x: 1010, y: 290, title: 'ภาพที่เป็นลิงก์', tag: '06' },
  { x: 1160, y: 500, title: 'คืนภาพหลักฐาน', tag: '07' },
]
export const circuitPath: Point[] = [{ x: 115, y: 500 }, ...nodes]
export function onCircuit(p: Point) {
  return circuitPath.slice(1).some((b, i) => {
    const a = circuitPath[i],
      dx = b.x - a.x,
      dy = b.y - a.y
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)))
    return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy) < 33
  })
}
export const solids: Record<View, Rect[]> = {
  map: [],
  street: [
    { x: 55, y: 100, w: 265, h: 310 },
    { x: 365, y: 100, w: 245, h: 310 },
    { x: 770, y: 70, w: 355, h: 340 },
    { x: 1040, y: 525, w: 100, h: 90 },
  ],
  device: [],
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
  const valid = (x: number, y: number) =>
    x >= 45 &&
    x <= 1235 &&
    y >= 170 &&
    y <= 665 &&
    (!tiny || onCircuit({ x, y })) &&
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
  street: { x: 650, y: 565 },
  device: { x: 115, y: 500 },
  boss: { x: 330, y: 565 },
}
type State = {
  view: View
  positions: Record<View, Point>
  overlay: Overlay
  paused: boolean
  reduceMotion: boolean
  selectedStop: number
  destination: number | null
  repaired: boolean
  toast: string
  ready: boolean
  error: string
}
let state: State = {
  view: 'map',
  positions: structuredClone(initialPositions),
  overlay: null,
  paused: false,
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
    listeners.forEach((l) => l())
  },
}
export function changeView(view: View) {
  const step = tutorial.get().step
  if (
    step &&
    ((view === 'street' && step !== 'travel') ||
      (view === 'device' && step !== 'camera-enter') ||
      (view === 'map' && step !== 'return-map') ||
      view === 'boss')
  )
    return
  if (view !== 'map' && !cityProgress.arrive('arun')) return
  store.set({
    view,
    overlay: null,
    destination: null,
    ready: state.view === view ? state.ready : false,
    toast: '',
  })
  if (view === 'street') tutorial.notify('street-arrived')
  if (view === 'device') tutorial.notify('device-arrived')
  if (view === 'map') tutorial.notify('map-returned')
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
    const p = s.positions.street
    if (Math.hypot(p.x - 575, p.y - 470) < 120) {
      if (tutorial.get().step && tutorial.get().step !== 'witness-open') return
      store.set({ overlay: 'witness' })
      tutorial.notify('witness-opened')
      return
    }
    if (Math.hypot(p.x - 850, p.y - 460) < 125) {
      changeView('device')
      return
    }
    store.set({ toast: 'เดินไปหาช่างอรุณ หรือเครื่องบันทึกกล้องที่มีแสงสีอำพัน' })
    return
  }
  const p = s.positions.device
  const near = nodes.find((n) => Math.hypot(p.x - n.x, p.y - n.y) < 90)
  if (near) {
    store.set({ overlay: 'terminal' })
    tutorial.notify('terminal-opened')
    return
  }
  store.set({ toast: 'เดินเข้าใกล้จุดกู้ระบบ แล้วกด E' })
}
