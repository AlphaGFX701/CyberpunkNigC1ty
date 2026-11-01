import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

// Source PNGs are original built-in imagegen output. No reference-pack files are used.
const out = new URL('../public/assets/entry/', import.meta.url)
await mkdir(out, { recursive: true })
const assets = []
for (const name of ['lab', 'dock', 'camera', 'null', 'shop', 'kin']) {
  const source = new URL(`../art-source/entry/${name}.png`, import.meta.url)
  const image = sharp(fileURLToPath(source))
  const size = name === 'kin' ? { height: 640 } : { width: 1280, height: 720, fit: 'fill' }
  const normalized = await image
    .resize({ ...size, kernel: 'nearest' })
    .png()
    .toBuffer()
  await sharp(normalized)
    .png()
    .toFile(fileURLToPath(new URL(`${name}.png`, out)))
  if (name !== 'kin')
    await sharp(normalized)
      .webp({ lossless: true })
      .toFile(fileURLToPath(new URL(`${name}.webp`, out)))
  const { width, height, hasAlpha } = await sharp(normalized).metadata()
  assets.push({
    name,
    png: `/assets/entry/${name}.png`,
    runtime: `/assets/entry/${name === 'kin' ? 'kin.png' : `${name}.webp`}`,
    width,
    height,
    hasAlpha,
  })
}
await writeFile(
  new URL('art-manifest.json', out),
  JSON.stringify(
    {
      version: 1,
      generator: 'Built-in imagegen; normalized with nearest-neighbor',
      assets,
      layers: [
        'background plate',
        'kin body',
        'kin head',
        'kin forearm',
        'foreground cable',
        'screen light',
        'rain',
        'signal corruption',
        'DOM Thai dialogue',
      ],
      composition: 'src/entry/CinematicArt.tsx',
      motion: 'src/entry/entry.css',
      storyboard: 'src/entry/story.ts',
    },
    null,
    2
  )
)
console.log('Prepared six original PNG assets, five lossless WebP plates, and layer manifest.')
