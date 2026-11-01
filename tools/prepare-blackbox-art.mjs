import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const destination = new URL('../public/assets/blackbox/', import.meta.url)
await mkdir(destination, { recursive: true })
const assets = []
for (const name of ['vault', 'briefing', 'memory']) {
  const source = fileURLToPath(new URL(`../art-source/blackbox/${name}.png`, import.meta.url))
  const pixels = await sharp(source)
    .resize(1280, 720, { kernel: 'nearest', fit: 'fill' })
    .png()
    .toBuffer()
  await sharp(pixels).toFile(fileURLToPath(new URL(`${name}.png`, destination)))
  await sharp(pixels)
    .webp({ lossless: true })
    .toFile(fileURLToPath(new URL(`${name}.webp`, destination)))
  assets.push({
    name,
    width: 1280,
    height: 720,
    png: `/assets/blackbox/${name}.png`,
    runtime: `/assets/blackbox/${name}.webp`,
  })
}
await writeFile(
  new URL('art-manifest.json', destination),
  JSON.stringify(
    {
      version: 1,
      generator: 'built-in imagegen',
      normalization: 'nearest-neighbor, lossless WebP',
      assets,
      reused: [
        '/assets/entry/lab.webp',
        '/assets/entry/kin.png',
        '/assets/entry/shop.webp',
        '/assets/entry/null.webp',
      ],
      shotComposition: 'src/narrative/case.ts',
      renderer: 'src/entry/CinematicArt.tsx',
    },
    null,
    2
  )
)
console.log('BLACKBOX: three PNG sources and lossless runtime plates prepared.')
