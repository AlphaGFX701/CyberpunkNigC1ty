// Coordinates share one authored 2.5D plate. A footprint blocks the visible furniture;
// its interaction point stays on the walkable side of that furniture.
export const streetSize = { width: 1600, height: 900 }
export const deviceSize = { width: 1600, height: 1000 }

export const streetPoints = {
  arun: { x: 622, y: 450 },
  receipt: { x: 408, y: 610 },
  relay: { x: 1450, y: 565 },
  terminal: { x: 896, y: 427 },
  camera: { x: 1324, y: 425 },
  exit: { x: 154, y: 823 },
} as const

export const streetSolids = [
  { x: 218, y: 230, w: 536, h: 160 }, // Arun's back-wall bench
  { x: 0, y: 478, w: 369, h: 167 }, // intake counter
  { x: 552, y: 483, w: 300, h: 214 }, // central stock island
  { x: 1043, y: 485, w: 220, h: 233 }, // second stock island
  { x: 1139, y: 152, w: 323, h: 228 }, // camera cabinet
  { x: 1474, y: 315, w: 126, h: 204 }, // right wall work surface
] as const

// Service pads are distributed around the two giant chips. They are reached by
// walking the floor, not by following the old single-width zigzag.
export const recoveryPoints = [
  { x: 330, y: 512, title: 'ปลุกหน้าบันทึก', tag: '01' },
  { x: 408, y: 250, title: 'คืนชื่อแฟ้ม', tag: '02' },
  { x: 610, y: 623, title: 'ซ่อมหัวเอกสาร', tag: '03' },
  { x: 1068, y: 302, title: 'ต่อวงจรแท็ก', tag: '04' },
  { x: 1342, y: 514, title: 'ตั้งภาษาสัญญาณ', tag: '05' },
  { x: 1112, y: 780, title: 'จัดชั้นแฟ้มคดี', tag: '06' },
  { x: 711, y: 794, title: 'แยกคำให้การ', tag: '07' },
] as const
export const deviceEntry = { x: 185, y: 823 }
export const deviceExit = { x: 1450, y: 820 }
export const deviceSolids = [
  { x: 500, y: 321, w: 468, h: 172 }, // raised central memory chip
  { x: 854, y: 513, w: 405, h: 205 }, // lower processor island
  { x: 681, y: 0, w: 447, h: 167 }, // processor housing at rear wall
] as const

// Faint floor-only data flow follows the aisles. These are visual routes, not
// movement constraints; the player can explore around the chip islands.
export const circuitSegments = [
  [deviceEntry, recoveryPoints[0]],
  [recoveryPoints[0], recoveryPoints[1]],
  [recoveryPoints[0], recoveryPoints[2]],
  [recoveryPoints[1], recoveryPoints[3]],
  [recoveryPoints[2], recoveryPoints[6]],
  [recoveryPoints[3], recoveryPoints[4]],
  [recoveryPoints[4], recoveryPoints[5]],
  [recoveryPoints[5], recoveryPoints[6]],
  [recoveryPoints[5], deviceExit],
] as const
