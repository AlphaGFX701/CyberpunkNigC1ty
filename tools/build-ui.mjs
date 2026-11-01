/** Original pixel geometry for TechCare. Edit this file or the exported SVG sources.
 * No artwork is extracted from the reference pack. All coordinates are integer pixels. */
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'public/assets/ui')
const source = path.join(root, 'ui-source')
await mkdir(path.join(out, 'png'), { recursive: true })
await mkdir(path.join(source, 'svg'), { recursive: true })

const C = {
  void: '#09151f',
  shadow: '#0d202b',
  dark: '#142732',
  panel: '#1b303b',
  plate: '#2d4752',
  edge: '#617f85',
  light: '#b3c9bd',
  amber: '#e7bf77',
  gold: '#aa8653',
  cyan: '#90c5c0',
  teal: '#527e84',
  pink: '#ed9fba',
  rose: '#a76b87',
  muted: '#778f96',
  green: '#a6d8b0',
  white: '#e2e9dc',
}
const rect = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`
const poly = (points, c) =>
  `<polygon points="${points.map((p) => p.join(',')).join(' ')}" fill="${c}"/>`
const stroke = (points, c, width = 1) =>
  `<polyline points="${points.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${c}" stroke-width="${width}" stroke-linecap="square" stroke-linejoin="miter"/>`
const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${body}</svg>`
function cut(x, y, w, h, c = 3) {
  return [
    [x + c, y],
    [x + w - c, y],
    [x + w - c, y + 1],
    [x + w - 1, y + 1],
    [x + w - 1, y + c],
    [x + w, y + c],
    [x + w, y + h - c],
    [x + w - 1, y + h - c],
    [x + w - 1, y + h - 1],
    [x + w - c, y + h - 1],
    [x + w - c, y + h],
    [x + c, y + h],
    [x + c, y + h - 1],
    [x + 1, y + h - 1],
    [x + 1, y + h - c],
    [x, y + h - c],
    [x, y + c],
    [x + 1, y + c],
    [x + 1, y + 1],
    [x + c, y + 1],
  ]
}
function chassis(w, h, accent = C.cyan, fill = C.panel) {
  return (
    poly(cut(0, 0, w, h, 4), C.void) +
    poly(cut(1, 1, w - 2, h - 3, 3), C.edge) +
    poly(cut(2, 2, w - 4, h - 5, 2), C.plate) +
    poly(cut(3, 3, w - 6, h - 7, 1), C.shadow) +
    rect(4, 4, w - 8, h - 9, fill) +
    rect(7, 2, 9, 1, accent) +
    rect(w - 15, h - 5, 7, 1, accent) +
    rect(4, 5, 2, 1, C.light) +
    rect(5, 4, 1, 2, C.light) +
    rect(w - 6, h - 8, 2, 1, C.muted) +
    rect(w - 5, h - 9, 1, 2, C.muted)
  )
}
function button(kind, state) {
  const size = kind === 'icon' ? 24 : 64
  const disabled = state === 'disabled',
    hover = state === 'hover',
    pressed = state === 'pressed'
  const accent = disabled
    ? '#64777b'
    : kind === 'primary'
      ? C.amber
      : kind === 'solution'
        ? C.pink
        : C.cyan
  const fill = disabled
    ? '#29383e'
    : kind === 'primary'
      ? pressed
        ? '#b0915e'
        : hover
          ? '#edc984'
          : '#d3b273'
      : kind === 'solution'
        ? pressed
          ? '#312632'
          : hover
            ? '#624356'
            : '#46333f'
        : pressed
          ? '#142731'
          : hover
            ? '#34525e'
            : '#253e48'
  let body =
    poly(cut(0, 0, size, 24, 3), C.void) +
    poly(cut(1, 1, size - 2, 21, 2), disabled ? '#4b6068' : accent) +
    poly(cut(2, 2, size - 4, 19, 1), C.shadow) +
    rect(3, pressed ? 4 : 3, size - 6, pressed ? 16 : 17, fill)
  body += rect(
    5,
    pressed ? 4 : 3,
    size - 10,
    1,
    disabled ? '#50646b' : kind === 'primary' ? '#f4d99d' : accent
  )
  body += rect(4, 20, size - 8, 2, C.shadow) + rect(4, 22, size - 8, 1, C.void)
  body += rect(3, 6, 1, 9, accent) + rect(size - 4, 7, 1, 8, accent)
  if (hover) body += rect(size - 8, 4, 3, 2, C.white)
  return svg(size, 24, body)
}

function icon(name, color = C.cyan) {
  let s = ''
  const r = (x, y, w, h, c = color) => {
    s += rect(x, y, w, h, c)
  }
  const l = (p, c = color, w = 1) => {
    s += stroke(p, c, w)
  }
  const p = (points, c = color) => {
    s += poly(points, c)
  }
  if (name === 'close') {
    for (let i = 0; i < 8; i++) {
      r(4 + i, 4 + i, 2, 1)
      r(11 - i, 4 + i, 2, 1)
    }
  }
  if (name === 'back') {
    l(
      [
        [7, 3],
        [2, 8],
        [7, 13],
      ],
      color,
      2
    )
    r(4, 7, 10, 2)
  }
  if (name === 'settings') {
    r(6, 1, 4, 14)
    r(1, 6, 14, 4)
    r(3, 3, 10, 10)
    r(5, 5, 6, 6, C.dark)
    r(7, 7, 2, 2)
  }
  if (name === 'music-on' || name === 'music-off') {
    r(6, 3, 2, 9)
    r(8, 2, 6, 2)
    r(12, 3, 2, 7)
    r(3, 10, 5, 3)
    r(9, 8, 5, 3)
    if (name.endsWith('off'))
      l(
        [
          [2, 2],
          [14, 14],
        ],
        C.pink,
        2
      )
  }
  if (name === 'sfx-on' || name === 'sfx-off') {
    p([
      [2, 6],
      [5, 6],
      [9, 2],
      [9, 14],
      [5, 10],
      [2, 10],
    ])
    if (name.endsWith('on')) {
      l([
        [11, 5],
        [13, 7],
        [13, 9],
        [11, 11],
      ])
      r(15, 6, 1, 4)
    } else {
      l(
        [
          [11, 6],
          [15, 10],
        ],
        C.pink,
        2
      )
      l(
        [
          [15, 6],
          [11, 10],
        ],
        C.pink,
        2
      )
    }
  }
  if (name === 'interact') {
    r(3, 5, 2, 6)
    r(6, 2, 2, 9)
    r(9, 4, 2, 7)
    r(12, 6, 2, 5)
    r(5, 9, 8, 5)
    r(6, 14, 6, 1)
    r(7, 4, 1, 5, C.dark)
  }
  if (name === 'journal') {
    r(3, 2, 10, 12)
    r(2, 3, 1, 10, C.amber)
    r(5, 3, 1, 10, C.dark)
    r(8, 5, 3, 1, C.white)
    r(8, 8, 3, 1)
    r(8, 11, 2, 1)
  }
  if (name === 'evidence') {
    p([
      [3, 1],
      [10, 1],
      [14, 5],
      [14, 15],
      [3, 15],
    ])
    r(5, 3, 4, 1, C.dark)
    r(5, 6, 7, 1, C.dark)
    r(5, 9, 5, 1, C.dark)
    r(10, 2, 1, 4, C.dark)
    r(10, 5, 3, 1, C.dark)
    r(6, 12, 5, 1, C.amber)
  }
  if (name === 'lock') {
    r(3, 7, 10, 7)
    l(
      [
        [5, 7],
        [5, 3],
        [7, 1],
        [9, 1],
        [11, 3],
        [11, 7],
      ],
      color,
      2
    )
    r(7, 9, 2, 3, C.dark)
  }
  if (name === 'check')
    l(
      [
        [2, 8],
        [6, 12],
        [14, 3],
      ],
      color,
      2
    )
  return svg(16, 16, s)
}
function shield(full) {
  return svg(
    16,
    16,
    poly(
      [
        [3, 1],
        [13, 1],
        [14, 3],
        [13, 10],
        [8, 15],
        [3, 10],
        [2, 3],
      ],
      C.void
    ) +
      poly(
        [
          [4, 2],
          [12, 2],
          [13, 4],
          [12, 10],
          [8, 13],
          [4, 10],
          [3, 4],
        ],
        full ? C.amber : C.edge
      ) +
      poly(
        [
          [5, 4],
          [11, 4],
          [10, 10],
          [8, 12],
          [5, 9],
        ],
        full ? C.gold : C.dark
      ) +
      (full ? rect(7, 4, 2, 7, C.white) + rect(5, 6, 6, 2, C.white) : rect(5, 7, 6, 1, C.muted))
  )
}
function marker(kind) {
  const color = kind === 'complete' ? C.green : kind === 'active' ? C.cyan : C.amber
  return svg(
    16,
    20,
    poly(
      [
        [3, 0],
        [13, 0],
        [16, 3],
        [16, 13],
        [8, 20],
        [0, 13],
        [0, 3],
      ],
      C.void
    ) +
      poly(
        [
          [3, 1],
          [13, 1],
          [15, 3],
          [15, 12],
          [8, 18],
          [1, 12],
          [1, 3],
        ],
        color
      ) +
      rect(3, 3, 10, 10, C.dark) +
      (kind === 'complete'
        ? stroke(
            [
              [4, 8],
              [7, 11],
              [12, 5],
            ],
            color,
            2
          )
        : kind === 'active'
          ? rect(7, 4, 2, 5, color) + rect(7, 11, 2, 2, color)
          : rect(6, 4, 4, 2, color) +
            rect(9, 6, 2, 3, color) +
            rect(7, 8, 3, 2, color) +
            rect(7, 11, 2, 2, color))
  )
}
function mapIcon(kind) {
  let body = ''
  if (kind === 'player')
    body =
      poly(
        [
          [8, 1],
          [15, 14],
          [8, 11],
          [1, 14],
        ],
        C.void
      ) +
      poly(
        [
          [8, 3],
          [12, 11],
          [8, 9],
          [4, 11],
        ],
        C.cyan
      )
  if (kind === 'npc')
    body = rect(5, 2, 6, 5, C.amber) + rect(3, 9, 10, 5, C.amber) + rect(7, 8, 2, 1, C.amber)
  if (kind === 'device')
    body =
      rect(2, 2, 12, 10, C.teal) +
      rect(3, 3, 10, 7, C.dark) +
      rect(4, 4, 8, 5, C.cyan) +
      rect(7, 12, 2, 2, C.cyan) +
      rect(4, 14, 8, 1, C.cyan)
  if (kind === 'exit')
    body =
      rect(2, 1, 10, 14, C.edge) +
      rect(4, 3, 6, 12, C.dark) +
      stroke(
        [
          [7, 8],
          [15, 8],
          [12, 5],
        ],
        C.amber,
        2
      ) +
      stroke(
        [
          [15, 8],
          [12, 11],
        ],
        C.amber,
        2
      )
  return svg(16, 16, body)
}

const sprites = []
const add = (name, group, label, width, height, xml, slice) =>
  sprites.push({
    name,
    group,
    label,
    width,
    height,
    xml,
    nineSlice: slice ? { top: slice, right: slice, bottom: slice, left: slice } : null,
  })
const kinds = { primary: 'ปุ่มหลัก', secondary: 'ปุ่มรอง', solution: 'ปุ่มเฉลย', icon: 'ปุ่มไอคอน' }
const states = { normal: 'ปกติ', hover: 'ชี้เมาส์', pressed: 'กด', disabled: 'ปิดใช้งาน' }
for (const [kind, label] of Object.entries(kinds))
  for (const [state, thai] of Object.entries(states))
    add(
      `button-${kind}-${state}`,
      'buttons',
      `${label} · ${thai}`,
      kind === 'icon' ? 24 : 64,
      24,
      button(kind, state),
      6
    )
for (const [name, label, accent] of [
  ['window', 'หน้าต่าง', C.cyan],
  ['dialogue', 'บทสนทนา', C.amber],
  ['objective', 'ภารกิจ', C.amber],
  ['tooltip', 'คำแนะนำ', C.cyan],
  ['inventory', 'เก็บหลักฐาน', C.cyan],
  ['minimap', 'มินิแมพ', C.cyan],
  ['keycap', 'ปุ่มคีย์บอร์ด', C.light],
]) {
  const size = name === 'keycap' ? 24 : ['tooltip', 'minimap'].includes(name) ? 32 : 48
  let body = chassis(size, size, accent, name === 'dialogue' ? '#20333c' : C.panel)
  if (name === 'inventory')
    body +=
      rect(9, size - 6, 2, 2, C.cyan) +
      rect(13, size - 6, 2, 2, C.cyan) +
      rect(17, size - 6, 2, 2, C.cyan)
  if (name === 'tooltip') body += rect(size - 7, 4, 2, 2, C.cyan)
  if (name === 'minimap') body += rect(4, size - 9, 1, 5, C.cyan) + rect(4, size - 5, 5, 1, C.cyan)
  add(
    `panel-${name}`,
    'panels',
    `กรอบ${label}`,
    size,
    size,
    svg(size, size, body),
    name === 'keycap' ? 7 : 8
  )
}
for (const [name, label, color] of [
  ['shield', 'โล่', C.amber],
  ['boss', 'บอส', C.pink],
  ['progress', 'ความคืบหน้า', C.cyan],
]) {
  add(
    `bar-${name}-frame`,
    'bars',
    `กรอบแถบ${label}`,
    96,
    16,
    svg(96, 16, chassis(96, 16, color, C.dark)),
    6
  )
  add(
    `bar-${name}-fill`,
    'bars',
    `ส่วนเติมแถบ${label}`,
    80,
    8,
    svg(
      80,
      8,
      poly(cut(0, 0, 80, 8, 1), name === 'boss' ? C.rose : name === 'shield' ? C.gold : C.teal) +
        rect(1, 0, 78, 2, color) +
        rect(0, 3, 80, 3, color) +
        rect(1, 6, 78, 1, C.plate)
    ),
    2
  )
}
for (const [name, full] of [
  ['full', true],
  ['empty', false],
])
  add(`shield-${name}`, 'shields', full ? 'โล่มีพลัง' : 'โล่หมดพลัง', 16, 16, shield(full))
for (const [name, color, label] of [
  ['normal', C.edge, 'ปกติ'],
  ['selected', C.amber, 'เลือกอยู่'],
  ['locked', C.muted, 'ล็อก'],
]) {
  let body = chassis(32, 32, color, C.shadow) + rect(7, 7, 18, 18, C.dark)
  if (name === 'selected')
    body += rect(1, 1, 5, 1, C.amber) + rect(1, 1, 1, 5, C.amber) + rect(26, 29, 5, 1, C.amber)
  if (name === 'locked')
    body +=
      rect(13, 14, 6, 7, C.muted) +
      stroke(
        [
          [14, 14],
          [14, 11],
          [18, 11],
          [18, 14],
        ],
        C.muted
      ) +
      rect(15, 16, 2, 3, C.dark)
  add(`slot-${name}`, 'slots', `ช่องไอเทม · ${label}`, 32, 32, svg(32, 32, body))
}
const icons = {
  close: 'ปิด',
  back: 'ย้อนกลับ',
  settings: 'ตั้งค่า',
  'music-on': 'เพลงเปิด',
  'music-off': 'เพลงปิด',
  'sfx-on': 'เอฟเฟกต์เปิด',
  'sfx-off': 'เอฟเฟกต์ปิด',
  interact: 'โต้ตอบ',
  journal: 'สมุดคดี',
  evidence: 'หลักฐาน',
  lock: 'ล็อก',
  check: 'สำเร็จ',
}
for (const [name, label] of Object.entries(icons))
  add(`icon-${name}`, 'icons', label, 16, 16, icon(name))
for (const [name, label] of [
  ['new', 'เควสต์ใหม่'],
  ['active', 'กำลังทำ'],
  ['complete', 'สำเร็จ'],
])
  add(`quest-${name}`, 'quests', label, 16, 20, marker(name))
add(
  'cursor-pointer',
  'selectors',
  'เคอร์เซอร์',
  16,
  16,
  svg(
    16,
    16,
    poly(
      [
        [2, 0],
        [2, 14],
        [6, 10],
        [9, 16],
        [12, 14],
        [9, 9],
        [15, 9],
      ],
      C.void
    ) +
      poly(
        [
          [3, 2],
          [3, 11],
          [6, 8],
          [10, 14],
          [11, 13],
          [8, 7],
          [12, 8],
        ],
        C.white
      )
  )
)
add(
  'selector-focus',
  'selectors',
  'กรอบเลือก',
  32,
  32,
  svg(
    32,
    32,
    rect(0, 0, 9, 2, C.amber) +
      rect(0, 0, 2, 9, C.amber) +
      rect(23, 0, 9, 2, C.amber) +
      rect(30, 0, 2, 9, C.amber) +
      rect(0, 30, 9, 2, C.amber) +
      rect(0, 23, 2, 9, C.amber) +
      rect(23, 30, 9, 2, C.amber) +
      rect(30, 23, 2, 9, C.amber)
  ),
  10
)
for (const [name, label] of [
  ['player', 'ผู้เล่น'],
  ['npc', 'พยาน'],
  ['device', 'อุปกรณ์'],
  ['exit', 'ทางออก'],
])
  add(`map-${name}`, 'minimap', `มินิแมพ · ${label}`, 16, 16, mapIcon(name))
if (sprites.length !== 55) throw Error(`Expected 55 sprites, got ${sprites.length}`)

const entries = {},
  frames = {},
  composites = []
let x = 4,
  y = 4,
  rowH = 0
for (const s of sprites) {
  if (x + s.width + 4 > 512) {
    x = 4
    y += rowH + 8
    rowH = 0
  }
  const buffer = await sharp(Buffer.from(s.xml)).png({ palette: true }).toBuffer()
  await writeFile(path.join(source, 'svg', `${s.name}.svg`), s.xml)
  await writeFile(path.join(out, 'png', `${s.name}.png`), buffer)
  entries[s.name] = {
    group: s.group,
    label: s.label,
    file: `/assets/ui/png/${s.name}.png`,
    source: `ui-source/svg/${s.name}.svg`,
    width: s.width,
    height: s.height,
    nineSlice: s.nineSlice,
  }
  frames[s.name] = {
    frame: { x, y, w: s.width, h: s.height },
    rotated: false,
    trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w: s.width, h: s.height },
    sourceSize: { w: s.width, h: s.height },
  }
  composites.push({ input: buffer, left: x, top: y })
  x += s.width + 8
  rowH = Math.max(rowH, s.height)
}
const atlasHeight = Math.ceil((y + rowH + 4) / 32) * 32
await sharp({ create: { width: 512, height: atlasHeight, channels: 4, background: '#00000000' } })
  .composite(composites)
  .png()
  .toFile(path.join(out, 'atlas.png'))
await writeFile(
  path.join(out, 'atlas.json'),
  JSON.stringify(
    {
      frames,
      meta: {
        app: 'TechCare Pixel UI builder',
        version: '1.0',
        image: 'atlas.png',
        format: 'RGBA8888',
        size: { w: 512, h: atlasHeight },
        scale: '1',
      },
    },
    null,
    2
  )
)
const manifest = JSON.stringify(
  { name: 'TechCare Pixel UI', version: 1, count: 55, pixelScale: 2, palette: C, sprites: entries },
  null,
  2
)
await writeFile(path.join(out, 'manifest.json'), manifest)
await mkdir(path.join(root, 'src/ui'), { recursive: true })
await writeFile(path.join(root, 'src/ui/manifest.generated.json'), manifest)
// A contact sheet is documentation, not an extra sprite.
const cols = 7,
  cellW = 180,
  cellH = 136,
  rows = Math.ceil(sprites.length / cols),
  sheet = []
let labels = ''
for (const [i, s] of sprites.entries()) {
  const cx = (i % cols) * cellW,
    cy = Math.floor(i / cols) * cellH
  const scale = s.width > 80 ? 1 : 2
  const img = await sharp(path.join(out, 'png', `${s.name}.png`))
    .resize(s.width * scale, s.height * scale, { kernel: 'nearest' })
    .png()
    .toBuffer()
  sheet.push({ input: img, left: cx + Math.floor((cellW - s.width * scale) / 2), top: cy + 10 })
  labels +=
    rect(cx + 1, cy + cellH - 23, cellW - 2, 22, '#152832') +
    `<text x="${cx + 8}" y="${cy + cellH - 9}" font-family="monospace" font-size="9" fill="#bfd0c8">${s.name}</text>`
}
sheet.push({ input: Buffer.from(svg(cols * cellW, rows * cellH, labels)), left: 0, top: 0 })
await sharp({
  create: { width: cols * cellW, height: rows * cellH, channels: 4, background: C.dark },
})
  .composite(sheet)
  .png()
  .toFile(path.join(source, 'overview.png'))
console.log(`Built ${sprites.length} original PNG/SVG sprites; atlas 512×${atlasHeight}`)
