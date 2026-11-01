import { Group, Mesh, TorusGeometry } from 'three'
import { box, cylinder, material } from './primitives.ts'
import { PCB, type CircuitStage } from './model-geometry.ts'

/** Positions share the learned 7+1 route; hardware and silhouettes belong to RELAY-02. */
export const RELAY_STAGES: readonly CircuitStage[] = [
  { title: 'สะพานแฟ้ม', short: 'LINK', x: -35, z: 24, kind: 'bridge' },
  { title: 'เส้นทางข้อมูล', short: 'PATH', x: -39, z: -1, kind: 'router' },
  { title: 'จุดอ้างอิง', short: 'ANCHOR', x: -27, z: -26, kind: 'antenna' },
  { title: 'คลังอุปกรณ์', short: 'INVENTORY', x: 0, z: -27, kind: 'rack' },
  { title: 'ลำดับเหตุการณ์', short: 'TIMELINE', x: 30, z: -24, kind: 'clock' },
  { title: 'ศูนย์ประกอบรายงาน', short: 'DOCUMENT', x: 38, z: 1, kind: 'report' },
  { title: 'แฟ้มที่ถูกซ่อน', short: 'SECTION', x: 30, z: 25, kind: 'archive' },
  { title: 'หอบันทึกต้นฉบับ', short: 'ORIGINAL', x: 0, z: 4, kind: 'core' },
]

export function buildRelayModel(completed: readonly number[] = [], current = 0) {
  const root = new Group()
  root.name = 'TECHCARE_RELAY_02'
  root.userData = { author: 'TechCare', chapter: 'relay', layout: 'seven-plus-core' }
  const effects: Mesh[] = [],
    fans: Group[] = []
  box(root, [0, -1.35, 0], [112, 2.5, 84], '#071e25')
  box(root, [0, 0, 0], [110, 0.5, 82], PCB.board)
  // Copper edge connectors, solder pads and two parallel perimeter buses.
  for (let x = -49; x <= 49; x += 7)
    for (const z of [-39, 39]) {
      box(root, [x, 0.48, z], [2.1, 0.35, 2.8], PCB.copper)
      cylinder(root, [x, 0.7, z], 0.4, 0.16, '#eadbb1')
    }
  for (const z of [-37, 37])
    for (const offset of [0, 1.2])
      box(root, [0, 0.32, z - Math.sign(z) * offset], [101, 0.1, 0.18], '#376c68')
  for (const x of [-52, 52]) {
    box(root, [x, 0.32, 0], [0.18, 0.1, 74], '#376c68')
    for (let z = -30; z <= 30; z += 7.5) cylinder(root, [x, 0.42, z], 0.42, 0.15, PCB.copper)
  }
  RELAY_STAGES.slice(1).forEach((node, i) => {
    const from = RELAY_STAGES[i],
      middle = (node.z + from.z) / 2
    const points = [
      [from.x, from.z],
      [from.x, middle],
      [node.x, middle],
      [node.x, node.z],
    ]
    const live = i + 1 <= current
    points.slice(1).forEach((p, j) => {
      const q = points[j]
      box(
        root,
        [(p[0] + q[0]) / 2, 0.37, (p[1] + q[1]) / 2],
        [Math.abs(p[0] - q[0]) + 0.8, 0.13, Math.abs(p[1] - q[1]) + 0.8],
        live ? PCB.cyan : '#29494b',
        live
      )
      box(
        root,
        [(p[0] + q[0]) / 2 + 1.25, 0.32, (p[1] + q[1]) / 2 + 1.25],
        [Math.abs(p[0] - q[0]) + 0.16, 0.08, Math.abs(p[1] - q[1]) + 0.16],
        '#53785e'
      )
    })
  })

  RELAY_STAGES.forEach((stage, index) => {
    const district = new Group()
    district.name = `relay-district-${index + 1}-${stage.short.toLowerCase()}`
    district.userData = { stage: index, kind: stage.kind }
    district.position.set(stage.x, 0, stage.z)
    root.add(district)
    const open = index <= current,
      done = completed.includes(index)
    const face = open ? PCB.chip : '#405251',
      dark = open ? '#24474b' : '#2d3e40'
    const light = done ? '#78e2b2' : index === current ? PCB.cyan : '#3f575a'
    const copper = open ? PCB.copper : '#606155'
    box(district, [0, 0.7, 0], [17, 1, 15], '#17454a')
    box(district, [0, 1.35, 0], [14, 0.4, 12], light, open)
    for (let pin = -4; pin <= 4; pin += 2)
      for (const sign of [-1, 1]) box(district, [pin, 1.4, sign * 6], [0.6, 0.45, 2], copper)

    const fan = (x: number, y: number, z: number) => {
      const assembly = new Group()
      assembly.name = `relay-fan-${index}`
      assembly.position.set(x, y, z)
      cylinder(district, [x, y - 0.25, z], 2.4, 0.35, '#142f36')
      for (let i = 0; i < 4; i++) {
        const blade = box(assembly, [0, 0, 0], [4, 0.15, 0.75], face)
        blade.rotation.y = (i * Math.PI) / 4
      }
      district.add(assembly)
      fans.push(assembly)
    }
    const strip = (x: number, y: number, z: number, width = 7) => {
      const led = box(district, [x, y, z], [width, 0.25, 0.16], light, open)
      if (open) effects.push(led)
    }

    if (stage.kind === 'bridge') {
      // Dual connector towers with a suspended, supported patch bridge.
      for (const x of [-5, 5]) {
        box(district, [x, 5.5, 0], [3.2, 7.2, 8], face)
        for (let port = 0; port < 3; port++) {
          box(district, [x, 3 + port * 2, 4.1], [2, 1.1, 0.2], dark)
          strip(x, 3 + port * 2, 4.25, 1.6)
        }
      }
      box(district, [0, 8, 0], [8, 1, 4], dark)
      box(district, [0, 8.6, 0], [8, 0.15, 0.7], light, open)
    } else if (stage.kind === 'router') {
      box(district, [0, 4, 0], [11, 4.5, 9], face)
      for (let port = -4; port <= 4; port += 2) {
        box(district, [port, 3.8, 4.6], [1.4, 1.3, 0.25], dark)
        strip(port, 4.9, 4.8, 0.65)
      }
      for (const x of [-4.3, 4.3]) cylinder(district, [x, 10, -2], 0.28, 9, copper)
      fan(0, 6.4, 0)
    } else if (stage.kind === 'antenna') {
      box(district, [0, 4, 0], [9, 4, 8], face)
      for (const x of [-2.8, 2.8]) {
        cylinder(district, [x, 10, 0], 0.45, 12, dark)
        for (let y = 9; y < 16; y += 2.8) box(district, [x, y, 0], [6, 0.4, 0.5], face)
      }
      box(district, [0, 16, 0], [7, 0.4, 1.2], light, open)
      strip(0, 4, 4.2)
    } else if (stage.kind === 'rack') {
      for (const x of [-4.2, 0, 4.2]) {
        box(district, [x, 6.2, 0], [3.4, 8.6, 8], dark)
        for (let y = 3; y < 10; y += 1.6) {
          box(district, [x, y, 0], [3.2, 1.1, 7.8], face)
          strip(x, y, 4.1, 2)
        }
      }
      fan(0, 10.7, 0)
    } else if (stage.kind === 'clock') {
      box(district, [0, 6, 0], [10, 8, 8], face)
      const ring = new Mesh(new TorusGeometry(3.4, 0.35, 6, 20), material(light, open))
      ring.position.set(0, 6.5, 4.25)
      district.add(ring)
      if (open) effects.push(ring)
      box(district, [0, 7.6, 4.3], [0.3, 2.2, 0.35], copper)
      box(district, [1.1, 6.5, 4.3], [2.2, 0.3, 0.35], copper)
      for (const x of [-3, 3]) cylinder(district, [x, 12, 0], 1.3, 4, dark)
    } else if (stage.kind === 'report') {
      for (let level = 0; level < 3; level++) {
        box(district, [0, 3.2 + level * 3.6, 0], [11 - level, 2.8, 9 - level], face)
        strip(0, 3.2 + level * 3.6, 4.6 - level / 2, 8 - level)
      }
      fan(0, 12.2, 0)
    } else if (stage.kind === 'archive') {
      for (const x of [-3.6, 3.6]) {
        box(district, [x, 5.7, 0], [5.8, 7.6, 9], dark)
        for (let shelf = 0; shelf < 4; shelf++) {
          box(district, [x, 2.8 + shelf * 1.8, 0], [5.4, 1.3, 8.6], face)
          strip(x, 2.8 + shelf * 1.8, 4.5, 4.3)
        }
      }
    } else {
      // Eight-sided record tower: real archive bays, no camera lens.
      cylinder(district, [0, 8.2, 0], 5.8, 12.5, dark)
      for (let sector = 0; sector < 8; sector++) {
        const bay = new Group()
        bay.rotation.y = (sector * Math.PI) / 4
        district.add(bay)
        box(bay, [0, 8, 5.3], [2.6, 10, 0.75], face)
        for (let row = 0; row < 4; row++) {
          const led = box(bay, [0, 4.7 + row * 2.1, 5.75], [1.9, 0.35, 0.1], light, open)
          if (open) effects.push(led)
        }
      }
      cylinder(district, [0, 15.4, 0], 6.2, 1.1, face)
      cylinder(district, [0, 18.7, 0], 0.45, 6, copper)
      const crown = new Mesh(new TorusGeometry(3.5, 0.35, 6, 20), material(light, open))
      crown.rotation.x = -Math.PI / 2
      crown.position.y = 18
      district.add(crown)
      if (open) effects.push(crown)
    }
  })

  // Auxiliary network chips populate empty board regions without hiding landmarks.
  for (const [i, [x, z]] of [
    [-13, 22],
    [-14, -6],
    [15, -10],
    [16, 17],
    [-47, -31],
    [47, 30],
    [4, 33],
    [10, -36],
  ].entries()) {
    box(root, [x, 2, z], [4.5, 3, 5.4], '#395e60')
    for (let fin = -1; fin <= 1; fin++)
      box(root, [x + fin * 1.4, 4.1, z], [0.5, 1.4, 5.4], '#748b84')
    for (const side of [-1, 1])
      for (let pin = -1; pin <= 1; pin++)
        box(root, [x + pin * 1.2, 0.9, z + side * 3.5], [0.5, 0.3, 1.8], PCB.copper)
    cylinder(root, [x + 3.8, 2.6, z], 0.7, 4.3, i % 2 ? '#597c68' : '#6b827d')
    box(root, [x - Math.sign(x) * 4, 0.32, z + 3], [8, 0.1, 0.18], '#376c68')
  }
  return { root, effects, fans }
}
