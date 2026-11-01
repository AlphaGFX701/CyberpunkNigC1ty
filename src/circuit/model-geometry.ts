import { CylinderGeometry, Group, Mesh, TorusGeometry } from 'three'
import { material, box, cylinder } from './primitives.ts'

export type CircuitStage = Readonly<{
  title: string
  short: string
  x: number
  z: number
  kind: string
}>

export const CIRCUIT_STAGES = [
  { title: 'ประตู BODY', short: 'BODY', x: -35, z: 24, kind: 'gate' },
  { title: 'คลังแฟ้ม', short: 'INDEX', x: -39, z: -1, kind: 'archive' },
  { title: 'หัวเอกสาร', short: 'DOCTYPE', x: -27, z: -26, kind: 'tower' },
  { title: 'โรงประกอบแท็ก', short: 'TAGS', x: 0, z: -27, kind: 'factory' },
  { title: 'สถานีภาษา', short: 'LANG', x: 30, z: -24, kind: 'relay' },
  { title: 'หอจัดหมวด', short: 'HEADINGS', x: 38, z: 1, kind: 'stack' },
  { title: 'คลังคำให้การ', short: 'PARAGRAPH', x: 30, z: 25, kind: 'memory' },
  { title: 'หอกล้อง CAM-07', short: 'CAM-07', x: 0, z: 4, kind: 'camera' },
] as const
export const PCB = {
  board: '#082b2b',
  chip: '#a5bec0',
  dark: '#183d43',
  cyan: '#57e8f2',
  copper: '#bd8654',
  gray: '#3b4f54',
}
export function buildCircuitModel(completed: readonly number[] = [], current = 0) {
  const root = new Group()
  root.name = 'TECHCARE_CIRCUIT_CITY'
  const effects: Mesh[] = [],
    fans: Group[] = []
  box(root, [0, -1.35, 0], [112, 2.5, 84], '#071e25')
  box(root, [0, 0, 0], [110, 0.5, 82], PCB.board)
  for (const x of [-53, 53])
    for (let z = -37; z <= 37; z += 5) cylinder(root, [x, 0.45, z], 0.5, 0.6, PCB.copper)
  for (let x = -49; x <= 49; x += 7)
    for (const z of [-39, 39]) cylinder(root, [x, 0.45, z], 0.5, 0.6, PCB.copper)
  const route = [...CIRCUIT_STAGES.slice(0, 7), CIRCUIT_STAGES[7]]
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1],
      b = route[i]
    const points = [
      [a.x, a.z],
      [a.x, (a.z + b.z) / 2],
      [b.x, (a.z + b.z) / 2],
      [b.x, b.z],
    ]
    points.slice(1).forEach((p, j) => {
      const q = points[j],
        dx = p[0] - q[0],
        dz = p[1] - q[1]
      box(
        root,
        [(p[0] + q[0]) / 2, 0.38, (p[1] + q[1]) / 2],
        [Math.abs(dx) + 1.25, 0.12, Math.abs(dz) + 1.25],
        i <= current ? PCB.cyan : '#29494b',
        i <= current
      )
      box(
        root,
        [(p[0] + q[0]) / 2 + 1.1, 0.35, (p[1] + q[1]) / 2 + 1.1],
        [Math.abs(dx) + 0.2, 0.1, Math.abs(dz) + 0.2],
        '#5b785e'
      )
    })
  }
  CIRCUIT_STAGES.forEach((stage, index) => {
    const district = new Group()
    district.name = `district-${index + 1}`
    district.userData.stage = index
    district.position.set(stage.x, 0, stage.z)
    root.add(district)
    const open = index <= current,
      done = completed.includes(index),
      face = open ? PCB.chip : PCB.gray
    const signal = done ? '#78e2b2' : index === current ? PCB.cyan : '#3b6668'
    box(district, [0, 0.7, 0], [17, 1, 15], '#17454a')
    box(district, [0, 1.35, 0], [14, 0.4, 12], signal, open)
    const bodyHeight = [5, 7, 12, 5, 9, 11, 6, 14][index]
    box(district, [0, bodyHeight / 2 + 1.8, 0], [10, bodyHeight, 8], face)
    for (let pin = -4; pin <= 4; pin += 2) {
      box(district, [pin, 1.35, 5.8], [0.6, 0.55, 2.2], PCB.copper)
      box(district, [pin, 1.35, -5.8], [0.6, 0.55, 2.2], PCB.copper)
    }
    for (let pin = -3; pin <= 3; pin += 1.5) {
      box(district, [-6.1, 1.35, pin], [1.4, 0.5, 0.45], PCB.copper)
      box(district, [6.1, 1.35, pin], [1.4, 0.5, 0.45], PCB.copper)
    }
    for (const side of [-1, 1]) {
      for (let capacitor = 0; capacitor < 3; capacitor++)
        cylinder(
          district,
          [side * 7.1, 3.2, -2.6 + capacitor * 2.6],
          0.62,
          3.4,
          open ? '#698b83' : '#385654'
        )
      for (let band = 0; band < bodyHeight; band += 1.25)
        box(district, [side * 5.12, 2.5 + band, 0], [0.35, 0.25, 7.5], open ? '#6b9193' : '#2d4c50')
    }
    for (let floor = 0; floor < bodyHeight; floor += 1.8)
      box(district, [0, 2.7 + floor, 4.08], [8.8, 0.34, 0.16], open ? signal : '#27454c', open)
    if (stage.kind === 'gate') {
      box(district, [-4, 7, 0], [2, 6, 8], face)
      box(district, [4, 7, 0], [2, 6, 8], face)
      box(district, [0, 9.7, 0], [10, 1.2, 8], face)
    } else if (stage.kind === 'factory' || stage.kind === 'memory') {
      for (let k = -4; k <= 4; k += 1.3) box(district, [k, bodyHeight + 3, 0], [0.45, 2.4, 7], face)
    } else if (stage.kind === 'relay') {
      cylinder(district, [0, bodyHeight + 5, 0], 0.35, 7, PCB.copper)
      cylinder(district, [0, bodyHeight + 8.5, 0], 1.2, 0.5, signal, open)
    } else if (stage.kind === 'camera') {
      cylinder(district, [0, bodyHeight + 3, 0], 5, 2.5, face)
      const ring = new Mesh(new TorusGeometry(3.2, 0.5, 6, 20), material(signal, open))
      ring.rotation.x = -Math.PI / 2
      ring.position.y = bodyHeight + 4.6
      district.add(ring)
      effects.push(ring)
      box(district, [0, 11.5, 4.45], [7.4, 6.8, 1.2], '#1b3c47')
      const lens = new Mesh(new CylinderGeometry(2.8, 2.8, 1.5, 20), material('#102a37'))
      lens.rotation.x = Math.PI / 2
      lens.position.set(0, 11.5, 5.6)
      district.add(lens)
      const glass = new Mesh(
        new CylinderGeometry(2.15, 2.15, 0.16, 20),
        material(open ? PCB.cyan : '#416c76', open)
      )
      glass.rotation.x = Math.PI / 2
      glass.position.set(0, 11.5, 6.4)
      district.add(glass)
      effects.push(glass)
      const bezel = new Mesh(new TorusGeometry(2.7, 0.28, 6, 20), material(PCB.copper))
      bezel.position.set(0, 11.5, 6.5)
      district.add(bezel)
    } else {
      box(district, [0, bodyHeight + 3, 0], [7, 2, 6], face)
      box(district, [0, bodyHeight + 4.3, 0], [4, 0.5, 4], signal, open)
    }
    const fan = new Group()
    fan.name = `fan-${index}`
    fan.position.set(0, bodyHeight + 5, 0)
    for (let blade = 0; blade < 4; blade++) {
      const b = box(fan, [0, 0, 0], [4.8, 0.24, 0.5], '#365960')
      b.rotation.y = (blade * Math.PI) / 4
    }
    if (stage.kind !== 'camera') {
      district.add(fan)
      fans.push(fan)
    }
    const led = cylinder(district, [5.5, 2, 4], 0.48, 0.4, signal, open)
    effects.push(led)
  })
  // Smaller supporting components are mounted on the board, outside the district pads.
  for (const [x, z] of [
    [-13, 19],
    [-13, -5],
    [17, -7],
    [-50, -29],
    [50, 28],
    [12, 31],
    [-6, -38],
  ]) {
    for (let i = 0; i < 3; i++) cylinder(root, [x + i * 2.4, 2.8, z], 0.8, 5, '#537b6e')
  }
  // Small memory blocks, stacked resistors and ground traces make a populated
  // circuit city without competing with the eight functional landmark pads.
  const secondary = [
    [-12, 29],
    [-13, 10],
    [-12, -10],
    [15, -12],
    [15, 15],
    [3, 33],
    [-45, 12],
    [46, -12],
    [-43, -33],
    [41, 33],
    [-10, -36],
    [14, -36],
    [-46, 34],
    [46, -35],
  ]
  secondary.forEach(([x, z], i) => {
    const height = 2.8 + (i % 4) * 0.8
    box(root, [x, height / 2 + 0.5, z], [4.4, height, 4.8], i % 2 ? '#385a5d' : '#52716e')
    for (let fin = 0; fin < 3; fin++)
      box(root, [x - 1.3 + fin * 1.3, height + 0.9, z], [0.45, 0.9, 4.8], '#2a494d')
    for (let pin = 0; pin < 3; pin++)
      box(root, [x - 1.3 + pin * 1.3, 0.6, z + 3], [0.45, 0.45, 1.2], PCB.copper)
    box(root, [x + 3, 0.32, z + 4], [8, 0.12, 0.18], '#36696a')
    box(root, [x + 7, 0.32, z], [0.18, 0.12, 8], '#36696a')
  })
  for (let lane = 0; lane < 10; lane++) {
    const x = -20 + lane * 4,
      z = 18 + (lane % 3) * 2
    box(root, [x, 0.31, z], [0.14, 0.09, 13], '#3b6964')
    box(root, [x + 2, 0.31, z + 6.5], [4.1, 0.09, 0.14], '#3b6964')
    cylinder(root, [x + 4, 0.42, z + 6.5], 0.32, 0.18, PCB.copper)
  }
  return { root, effects, fans }
}
