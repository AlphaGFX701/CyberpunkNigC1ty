/** Re-export edited, same-size SVG sources without redrawing them from the generator. */
import sharp from 'sharp'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'public/assets/ui')
const manifest = JSON.parse(await readFile(path.join(out, 'manifest.json'), 'utf8'))
const atlas = JSON.parse(await readFile(path.join(out, 'atlas.json'), 'utf8'))
const composites = []
for (const [name, s] of Object.entries(manifest.sprites)) {
  const input = await readFile(path.join(root, s.source))
  const buffer = await sharp(input).png().toBuffer()
  const meta = await sharp(buffer).metadata()
  if (meta.width !== s.width || meta.height !== s.height)
    throw Error(
      `${name}: expected ${s.width}×${s.height}. Keep native dimensions when editing an existing sprite.`
    )
  await writeFile(path.join(out, 'png', `${name}.png`), buffer)
  const frame = atlas.frames[name].frame
  composites.push({ input: buffer, left: frame.x, top: frame.y })
}
await sharp({
  create: {
    width: atlas.meta.size.w,
    height: atlas.meta.size.h,
    channels: 4,
    background: '#00000000',
  },
})
  .composite(composites)
  .png()
  .toFile(path.join(out, 'atlas.png'))
await writeFile(
  path.join(root, 'src/ui/manifest.generated.json'),
  JSON.stringify(manifest, null, 2)
)
console.log('Exported 55 edited SVGs to transparent PNGs and shared atlas.')
