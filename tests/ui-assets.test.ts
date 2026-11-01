import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import sharp from 'sharp'

const base = new URL('../public/assets/ui/', import.meta.url)
const manifest = JSON.parse(await readFile(new URL('manifest.json', base), 'utf8'))
const atlas = JSON.parse(await readFile(new URL('atlas.json', base), 'utf8'))
test('55 original transparent sprites match atlas pixels and frame metadata', async () => {
  const files = (await readdir(new URL('png/', base))).filter((f) => f.endsWith('.png'))
  assert.equal(files.length, 55)
  assert.equal(Object.keys(manifest.sprites).length, 55)
  assert.equal(Object.keys(atlas.frames).length, 55)
  const atlasPng = await readFile(new URL('atlas.png', base))
  for (const [name, s] of Object.entries(manifest.sprites) as [string, any][]) {
    const png = await readFile(new URL(`png/${name}.png`, base)),
      data = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    assert.equal(data.info.width, s.width, name)
    assert.equal(data.info.height, s.height, name)
    const alpha = []
    for (let i = 3; i < data.data.length; i += 4) alpha.push(data.data[i])
    assert.ok(alpha.includes(0), `${name}: no transparent pixels`)
    assert.ok(alpha.includes(255), `${name}: no visible pixels`)
    const f = atlas.frames[name].frame
    assert.ok(
      f.x >= 0 && f.y >= 0 && f.x + f.w <= atlas.meta.size.w && f.y + f.h <= atlas.meta.size.h,
      name
    )
    const extracted = await sharp(atlasPng)
      .extract({ left: f.x, top: f.y, width: f.w, height: f.h })
      .ensureAlpha()
      .raw()
      .toBuffer()
    for (let i = 0; i < extracted.length; i += 4) {
      if (extracted[i + 3] === 0) extracted.fill(0, i, i + 3)
      if (data.data[i + 3] === 0) data.data.fill(0, i, i + 3)
    }
    assert.deepEqual(extracted, data.data, `${name}: atlas differs from individual PNG`)
    if (s.nineSlice) {
      assert.ok(s.nineSlice.left + s.nineSlice.right < s.width)
      assert.ok(s.nineSlice.top + s.nineSlice.bottom < s.height)
    }
  }
})
test('each button has four visually distinct states and all sources are editable SVG', async () => {
  for (const kind of ['primary', 'secondary', 'solution', 'icon']) {
    const images = await Promise.all(
      ['normal', 'hover', 'pressed', 'disabled'].map((s) =>
        readFile(new URL(`png/button-${kind}-${s}.png`, base))
      )
    )
    assert.equal(new Set(images.map((b) => b.toString('base64'))).size, 4, kind)
  }
  for (const s of Object.values(manifest.sprites) as any[]) {
    const svg = await readFile(new URL(`../${s.source}`, import.meta.url), 'utf8')
    assert.ok(svg.includes('shape-rendering="crispEdges"'))
    assert.ok(!svg.includes('<image'))
  }
})
