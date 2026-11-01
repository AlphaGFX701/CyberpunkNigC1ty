export const relaySize = { width: 1600, height: 900 }
export const relayEntry = { x: 340, y: 780 }
export const relayPoints = {
  officer: { x: 430, y: 430 },
  workorder: { x: 240, y: 545 },
  module: { x: 1405, y: 650 },
  terminal: { x: 1055, y: 395 },
  evidence: { x: 850, y: 400 },
  exit: { x: 160, y: 820 },
} as const
export const relaySolids = [
  { x: 0, y: 0, w: 1600, h: 345 },
  { x: 0, y: 350, w: 205, h: 185 },
  { x: 520, y: 477, w: 575, h: 169 },
  { x: 1200, y: 735, w: 400, h: 165 },
  { x: 1500, y: 345, w: 100, h: 235 },
] as const
export const relayClosedGate = { x: 1195, y: 345, w: 30, h: 390 }
