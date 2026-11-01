import type { AreaId } from './progression'
export type CityAreaId = AreaId
export type Building = {
  x: number
  z: number
  w: number
  d: number
  h: number
  area: CityAreaId | null
  roof: number
}
export const AREA_LOCATIONS = {
  base: {
    position: [-31, 0, 22] as [number, number, number],
    label: 'ฐาน TechCare',
    district: 'WEST BANK / 01',
    height: 5,
  },
  arun: {
    position: [-24, 0, -8] as [number, number, number],
    label: 'ร้านช่างอรุณ',
    district: 'OLD QUARTER / 02',
    height: 5.5,
  },
  relay: {
    position: [27, 0, -24] as [number, number, number],
    label: 'สถานีสื่อสาร',
    district: 'RELAY HEIGHTS / 05',
    height: 14,
  },
  control: {
    position: [25, 0, 15] as [number, number, number],
    label: 'ศูนย์ควบคุม',
    district: 'CIVIC CORE / 06',
    height: 17,
  },
} satisfies Record<
  CityAreaId,
  { position: [number, number, number]; label: string; district: string; height: number }
>

export const BANKS: [number, number][][] = [
  [
    [-87, -61],
    [-11, -61],
    [-10, -35],
    [-7, -21],
    [-11, -5],
    [-4, 9],
    [-8, 61],
    [-87, 61],
  ],
  [
    [0, -61],
    [87, -61],
    [87, 61],
    [1, 61],
    [5, 13],
    [-1, -4],
    [4, -18],
  ],
]
export const ROADS: {
  points: [number, number][]
  width: number
  primary?: boolean
  bridge?: boolean
}[] = [
  {
    points: [
      [-44, -28],
      [-18, -28],
      [-14, -19],
      [-16, -4],
      [-12, 13],
      [-16, 29],
      [-43, 29],
      [-44, -28],
    ],
    width: 2.4,
    primary: true,
  },
  {
    points: [
      [10, -29],
      [40, -29],
      [44, -20],
      [42, 22],
      [35, 29],
      [13, 29],
      [9, 17],
      [12, 8],
      [7, -7],
      [11, -20],
      [10, -29],
    ],
    width: 2.6,
    primary: true,
  },
  {
    points: [
      [-44, -1],
      [-17, -1],
    ],
    width: 2,
  },
  {
    points: [
      [-42, 14],
      [-13, 14],
    ],
    width: 2,
  },
  {
    points: [
      [-34, -27],
      [-34, 29],
    ],
    width: 1.8,
  },
  {
    points: [
      [-23, -26],
      [-23, 28],
    ],
    width: 1.5,
  },
  {
    points: [
      [12, -10],
      [43, -10],
    ],
    width: 2,
  },
  {
    points: [
      [11, 6],
      [42, 6],
    ],
    width: 2,
  },
  {
    points: [
      [24, -28],
      [24, 28],
    ],
    width: 2,
  },
  {
    points: [
      [34, -27],
      [34, 27],
    ],
    width: 1.4,
  },
  {
    points: [
      [-16, -20],
      [10, -20],
    ],
    width: 2.8,
    primary: true,
    bridge: true,
  },
  {
    points: [
      [-13, 15],
      [10, 15],
    ],
    width: 2.8,
    primary: true,
    bridge: true,
  },
  {
    points: [
      [-82, -54],
      [-16, -54],
      [-12, -39],
      [-47, -39],
      [-48, 41],
      [-16, 41],
      [-15, 54],
      [-82, 54],
      [-82, -54],
    ],
    width: 3.2,
    primary: true,
  },
  {
    points: [
      [11, -54],
      [80, -54],
      [82, 51],
      [12, 51],
      [10, 39],
      [48, 39],
      [48, -36],
      [12, -36],
      [11, -54],
    ],
    width: 3.4,
    primary: true,
  },
  {
    points: [
      [-82, -25],
      [-46, -25],
    ],
    width: 2.5,
  },
  {
    points: [
      [-82, 23],
      [-44, 23],
    ],
    width: 2.6,
  },
  {
    points: [
      [-70, -53],
      [-70, 54],
    ],
    width: 2.2,
  },
  {
    points: [
      [-82, -4],
      [-47, -4],
    ],
    width: 2.2,
  },
  {
    points: [
      [48, -13],
      [82, -13],
    ],
    width: 2.8,
  },
  {
    points: [
      [48, 28],
      [82, 28],
    ],
    width: 2.8,
  },
  {
    points: [
      [72, -53],
      [72, 52],
    ],
    width: 2.2,
  },
  {
    points: [
      [-16, -45],
      [12, -45],
    ],
    width: 3.4,
    bridge: true,
  },
  {
    points: [
      [-16, 46],
      [12, 46],
    ],
    width: 3.4,
    bridge: true,
  },
  {
    points: [
      [-44, -28],
      [-48, -39],
    ],
    width: 2.4,
  },
  {
    points: [
      [42, 22],
      [48, 28],
    ],
    width: 2.4,
  },
]

// Blocks are authored by neighbourhood; deterministic variation only fills each block.
function random(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0
    return (seed >>> 0) / 4294967296
  }
}
const out: Building[] = []
function block(
  x: number,
  z: number,
  cols: number,
  rows: number,
  stepX: number,
  stepZ: number,
  area: CityAreaId | null,
  kind: 'old' | 'residential' | 'tower' | 'industrial',
  seed: number
) {
  const r = random(seed)
  for (let c = 0; c < cols; c++)
    for (let row = 0; row < rows; row++) {
      const w = kind === 'industrial' ? 3.9 : kind === 'tower' ? 2.2 + r() * 1.3 : 1.4 + r() * 1.25
      const d = kind === 'industrial' ? 2.8 : kind === 'tower' ? 2 + r() * 1.1 : 1.3 + r() * 1.3
      const h =
        kind === 'old'
          ? 1.1 + r() * 2.1
          : kind === 'residential'
            ? 2.4 + r() * 3.5
            : kind === 'industrial'
              ? 1.1 + r() * 1.7
              : 5 + r() * 8
      out.push({
        x: x + c * stepX + (r() - 0.5) * 0.3,
        z: z + row * stepZ + (r() - 0.5) * 0.3,
        w,
        d,
        h,
        area,
        roof: Math.floor(r() * 3),
      })
    }
}
// Western low-rise city, canal-side repair streets and a residential terrace.
block(-41, -24, 2, 5, 3.2, 4.1, 'arun', 'old', 11)
block(-30, -24, 2, 4, 3.1, 4.8, 'arun', 'old', 18)
block(-31, -13, 2, 3, 3.1, 3.6, 'arun', 'old', 24)
block(-20, -14, 1, 3, 3.3, 4.6, 'arun', 'old', 32)
block(-40, 3, 2, 2, 3.3, 4.3, 'base', 'residential', 43)
block(-30, 4, 2, 2, 3.5, 4.5, 'base', 'old', 48)
block(-40, 20, 2, 2, 3.4, 4.2, 'base', 'old', 50)
block(-20, 20, 1, 2, 3.7, 4.4, 'base', 'residential', 57)
// Dense corporate skyline, civic towers, industrial yards and harbour sheds.
block(15, -24, 2, 3, 4.1, 4.5, 'relay', 'tower', 61)
block(28, -18, 2, 2, 4.2, 4.4, 'relay', 'tower', 67)
block(15, -5, 2, 2, 4.1, 4.7, null, 'residential', 72)
block(29, -5, 3, 2, 4, 4.5, null, 'residential', 77)
block(15, 11, 1, 3, 4, 4.7, 'control', 'tower', 82)
block(29, 10, 2, 3, 4.1, 4.7, 'control', 'tower', 86)
block(38, -25, 1, 3, 4, 5, null, 'industrial', 91)
block(14, 31, 5, 1, 5.1, 4, null, 'industrial', 94)
block(-42, 32, 5, 1, 5.2, 4, null, 'industrial', 99)
// A broader city surrounds the case sites. Each block leaves authored streets and landmark plots.
block(-77, -48, 2, 5, 3.1, 4.1, 'arun', 'residential', 111)
block(-65, -49, 6, 2, 3.0, 4.0, 'arun', 'old', 112)
block(-78, -18, 2, 3, 3.5, 4, 'arun', 'old', 113)
block(-78, 3, 2, 4, 3.5, 4.3, 'base', 'residential', 114)
block(-65, 34, 5, 2, 3.4, 3.4, 'base', 'old', 115)
block(-38, -48, 6, 2, 3.5, 4, 'arun', 'residential', 116)
block(-37, 45, 5, 2, 4.2, 4.2, null, 'industrial', 117)
block(16, -49, 5, 2, 5, 4.7, 'relay', 'tower', 121)
block(51, -49, 4, 2, 5.2, 4.7, null, 'tower', 122)
block(77, -46, 1, 5, 4, 5.6, null, 'tower', 123)
block(53, -8, 4, 2, 4.6, 4.5, null, 'residential', 124)
block(77, 0, 1, 6, 4, 4.6, null, 'residential', 125)
block(13, 42, 6, 2, 5.2, 4.8, null, 'industrial', 126)
export const BUILDINGS = out

export type ArchitecturePart = {
  x: number
  z: number
  y: number
  w: number
  d: number
  h: number
  area: CityAreaId | null
  material: 'concrete' | 'glass' | 'metal' | 'amber' | 'pink' | 'paving'
  floors?: boolean
}
const parts: ArchitecturePart[] = []
function part(
  x: number,
  z: number,
  w: number,
  d: number,
  h: number,
  y = 0,
  area: CityAreaId | null = null,
  material: ArchitecturePart['material'] = 'concrete',
  floors = false
) {
  parts.push({ x, z, w, d, h, y, area, material, floors })
}
// 1. West-bank archive: three wings frame a pedestrian courtyard, with a recessed glass hall.
part(-58, 8, 19, 21, 0.18, 0, 'base', 'paving')
part(-65, 7, 4, 17, 7, 0, 'base', 'concrete', true)
part(-51, 7, 4, 17, 7, 0, 'base', 'concrete', true)
part(-58, -0.5, 11, 3, 9, 0, 'base', 'glass', true)
part(-58, 15, 9, 2, 3, 0, 'base', 'glass')
part(-58, 2, 8, 3, 0.4, 9, 'base', 'metal')
part(-58, 9, 5, 5, 0.2, 0.2, 'base', 'metal')
// 2. Twin corporate headquarters: shared podium, unequal towers, high skybridge.
part(60, -26, 18, 15, 2, 0, null, 'concrete')
part(54.8, -27, 5.4, 8, 24, 2, null, 'glass', true)
part(64.8, -25, 5.4, 8, 19, 2, null, 'concrete', true)
part(60, -26, 6, 3, 2, 16, null, 'glass')
part(54.8, -27, 6, 8.5, 0.5, 26, null, 'metal')
part(64.8, -25, 5.8, 8.4, 0.5, 21, null, 'metal')
// 3. Arcology: inhabited towers carry a large public hall over an open central void.
part(58, 16, 22, 18, 0.2, 0, null, 'paving')
part(50, 17, 5, 12, 18, 0, null, 'concrete', true)
part(66, 17, 5, 12, 18, 0, null, 'concrete', true)
part(58, 17, 21, 12, 4, 18, null, 'glass', true)
part(58, 17, 23, 13, 0.6, 22, null, 'metal')
part(58, 22, 10, 2, 2, 7, null, 'glass')
// 4. Terrace hotel: a stair-stepped silhouette with broad roof gardens.
for (let i = 0; i < 4; i++)
  part(-58, -33, 14 - i * 2.7, 9 - i * 1.2, 3, i * 3, 'arun', i % 2 ? 'glass' : 'concrete', true)
part(-58, -33, 3, 3, 1, 12, 'arun', 'metal')
// 5. Market street: paired shophouses, loading arcade and individual awnings.
for (let i = 0; i < 7; i++) {
  const x = -65 + i * 2.6
  part(x, -16, 2.35, 5, 3.5 + (i % 3) * 0.65, 0, 'arun', 'concrete', true)
  part(x, -12.9, 2.5, 1.4, 0.17, 2, 'arun', i === 4 ? 'pink' : 'amber')
  part(x, -13.45, 1.5, 0.12, 1.3, 0.3, 'arun', 'glass')
}
// 6. Port authority: L-shaped terminal, projecting glazed concourse and rooftop equipment.
part(-63, 46, 22, 5, 4.5, 0, null, 'concrete', true)
part(-73, 40, 4, 10, 5.5, 0, null, 'concrete', true)
part(-60, 42, 13, 3, 2.5, 0, null, 'glass')
part(-64, 46, 7, 3, 1, 4.5, null, 'metal')
// 7. Industrial shed: the separate roof teeth are generated by the renderer.
part(61, 43, 17, 12, 3.4, 0, null, 'metal', true)
part(76, 43, 4, 12, 5.5, 0, null, 'concrete', true)
// 8. Elevated rail station: long island platform and offset canopy.
part(-56, 28, 20, 4, 0.55, 3.7, 'base', 'metal')
part(-56, 28, 16, 4.5, 0.3, 6, 'base', 'concrete')
for (const x of [-62, -56, -50]) part(x, 28, 0.3, 0.3, 2, 4, 'base', 'metal')
// 9. Canal housing courts have roofs, recesses, and an open centre rather than single blocks.
for (const [x, z] of [
  [-58, -47],
  [34, -38],
  [17, 35],
] as const) {
  const a: CityAreaId | null = x < 0 ? 'arun' : null
  part(x - 4, z, 2.6, 10, 6.5, 0, a, 'concrete', true)
  part(x + 4, z, 2.6, 10, 6.5, 0, a, 'concrete', true)
  part(x, z - 4, 5.5, 2.4, 7.8, 0, a, 'glass', true)
}
// 10. Civic complex: low wings emphasize the existing communications spire.
part(25, 21, 15, 3, 3, 0, 'control', 'concrete', true)
part(18, 17, 3, 8, 4.5, 0, 'control', 'concrete', true)
part(32, 17, 3, 8, 4.5, 0, 'control', 'concrete', true)
// Smaller apartment compounds fill the neighbourhood perimeter without closing the streets.
for (const [x, z] of [
  [-58, -8],
  [-58, 35],
  [-73, -33],
  [-31, 36],
  [20, -36],
  [42, -43],
  [62, 3],
  [61, -17],
  [19, 52],
  [38, 52],
] as const) {
  const a: CityAreaId | null = x < 0 ? (z < 0 ? 'arun' : 'base') : null
  part(x, z, 7, 3.3, 5, 0, a, 'concrete', true)
  part(x - 2.5, z + 3.2, 2, 3, 4, 0, a, 'glass', true)
}
export const ARCHITECTURE = parts
