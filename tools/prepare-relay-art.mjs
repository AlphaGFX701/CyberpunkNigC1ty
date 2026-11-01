import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
const source = 'art-source/relay/'
const out = 'public/assets/relay/'
await mkdir(out + 'scenes', { recursive: true })
await mkdir(out + 'characters', { recursive: true })
await mkdir('art-source/relay', { recursive: true })
const scene = source + 'station-original.png'
await sharp(scene)
  .resize(1600, 900, { fit: 'fill' })
  .webp({ quality: 94 })
  .toFile(out + 'scenes/station.webp')
const plate = await sharp(scene).resize(1600, 900, { fit: 'fill' }).png().toBuffer()
for (const [name, left, top, width, height] of [
  ['city', 250, 25, 960, 190],
  ['server-front', 518, 470, 575, 165],
  ['foreground', 1200, 735, 400, 165],
])
  await sharp(plate)
    .extract({ left, top, width, height })
    .webp({ quality: 94 })
    .toFile(out + 'scenes/' + name + '.webp')
const officer = source + 'officer-original.png'
await sharp(officer)
  .trim({ threshold: 15 })
  .resize({ height: 256, kernel: 'nearest' })
  .webp({ quality: 95 })
  .toFile(out + 'characters/officer-standing.webp')
await sharp(source + 'officer-sheet-source.png')
  .extract({ left: 575, top: 90, width: 955, height: 858 })
  .resize(420, 420, { fit: 'cover', position: 'top', kernel: 'nearest' })
  .webp({ quality: 95 })
  .toFile(out + 'characters/officer-portrait.webp')
await sharp(source + 'dish-original.png')
  .trim({ threshold: 15 })
  .resize({ height: 300, kernel: 'nearest' })
  .webp({ quality: 95 })
  .toFile(out + 'scenes/dish.webp')
await writeFile(
  out + 'CREDITS.txt',
  'TechCare RELAY-02 original environment and duty technician. Generated with built-in imagegen using the original Arun workshop as style reference, 2 November 2026. Source art retained locally under art-source/relay. Crops are source-aligned runtime layers, not independent perspective props. See RELAY_CHAPTER.md and tools/prepare-relay-art.mjs.\n'
)
console.log('Relay artwork prepared.')
