import sharp from 'sharp'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'

const project = path.resolve(import.meta.dirname, '..')
const source = path.join(project, 'art-source/kin-tutorial/portraits-raw.png')
const out = path.join(project, 'public/assets/tutorial/kin')
const moods = ['neutral', 'smile', 'smirk', 'serious', 'surprised']
const states = ['idle', 'talk', 'blink']
const size = { width: 256, height: 320 }
await mkdir(out, { recursive: true })
const metadata = await sharp(source).metadata()

// Technical normalization only: discard alpha fringe and isolated generator
// specks, then use one scale and one bottom-centre anchor across all 15 frames.
function connectedSprite(data, width, height) {
  const seen = new Uint8Array(width * height)
  let largest = []
  for (let first = 0; first < seen.length; first++) {
    if (seen[first] || data[first * 4 + 3] < 128) continue
    const group = [first]
    seen[first] = 1
    for (let k = 0; k < group.length; k++) {
      const p = group[k], x = p % width, y = Math.floor(p / width)
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy
        if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue
        const next = yy * width + xx
        if (!seen[next] && data[next * 4 + 3] >= 128) {
          seen[next] = 1
          group.push(next)
        }
      }
    }
    if (group.length > largest.length) largest = group
  }
  if (largest.length < 1000) throw new Error('Portrait component missing')
  const clean = Buffer.alloc(data.length)
  let x0 = width, y0 = height, x1 = 0, y1 = 0
  for (const p of largest) {
    const x = p % width, y = Math.floor(p / width), i = p * 4
    clean[i] = data[i]; clean[i + 1] = data[i + 1]; clean[i + 2] = data[i + 2]; clean[i + 3] = 255
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y)
  }
  return { clean, bounds: { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 } }
}

const frames = []
for (let row = 0; row < moods.length; row++) for (let column = 0; column < states.length; column++) {
  const left = Math.round(column * metadata.width / 3)
  const right = Math.round((column + 1) * metadata.width / 3)
  const top = Math.round(row * metadata.height / 5)
  const bottom = Math.round((row + 1) * metadata.height / 5)
  // The sheet uses hard crop baselines. Exclude the bottom registration fringe.
  const width = right - left, height = bottom - top - 3
  const { data } = await sharp(source).extract({ left, top, width, height }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const normalized = connectedSprite(data, width, height)
  frames.push({ mood: moods[row], state: states[column], width, height, ...normalized })
}
const maxWidth = Math.max(...frames.map(f => f.bounds.width))
const maxHeight = Math.max(...frames.map(f => f.bounds.height))
const sharedScale = Math.min(240 / maxWidth, 304 / maxHeight)
const manifest = {
  generator: 'built-in image_gen (identity-preserve sprite sheet + edge cleanup)',
  canonicalReference: '/assets/entry/kin.png',
  source: 'art-source/kin-tutorial/portraits-raw.png',
  frame: { ...size, anchor: [128, 320], sharedScale, alphaThreshold: 128 },
  moods, states, frames: [],
}
const contact = []
for (const [i, f] of frames.entries()) {
  const width = Math.round(f.bounds.width * sharedScale), height = Math.round(f.bounds.height * sharedScale)
  const input = await sharp(f.clean, { raw: { width: f.width, height: f.height, channels: 4 } })
    .extract(f.bounds).resize(width, height, { kernel: 'nearest' }).png().toBuffer()
  const png = await sharp({ create: { ...size, channels: 4, background: '#00000000' } })
    .composite([{ input, left: Math.round((size.width - width) / 2), top: size.height - height }]).png().toBuffer()
  const name = `${f.mood}-${f.state}.png`
  await writeFile(path.join(out, name), png)
  manifest.frames.push({ mood: f.mood, state: f.state, file: `/assets/tutorial/kin/${name}`, sha256: createHash('sha256').update(png).digest('hex'), sourceBounds: f.bounds })
  const label = Buffer.from(`<svg width="256" height="26"><text x="12" y="18" font-family="monospace" font-size="13" fill="#e7bf77">${f.mood} / ${f.state}</text></svg>`)
  contact.push({ input: png, left: (i % 3) * 256, top: Math.floor(i / 3) * 348 + 28 })
  contact.push({ input: label, left: (i % 3) * 256, top: Math.floor(i / 3) * 348 })
}
await writeFile(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
await sharp({ create: { width: 768, height: 1740, channels: 4, background: '#142b35' } }).composite(contact).png().toFile(path.join(project, 'art-source/kin-tutorial/contact-sheet.png'))
console.log(JSON.stringify({ generated: frames.length, frame: size, sharedScale, maxWidth, maxHeight }))
