import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const root = new URL('../', import.meta.url)
const manifest = JSON.parse(await readFile(new URL('external-assets.json', root), 'utf8'))
const missing = []
for (const asset of manifest.assets) {
  try {
    const data = await readFile(new URL(asset.path, root))
    if (createHash('sha256').update(data).digest('hex') !== asset.sha256)
      missing.push(`${asset.path}: checksum mismatch`)
  } catch {
    missing.push(`${asset.path}: missing`)
  }
}
if (missing.length) {
  console.error('Prepare your licensed runtime artwork as described in ASSETS_SETUP.md:\n' + missing.join('\n'))
  process.exitCode = 1
} else console.log(`Verified ${manifest.assets.length} external runtime assets (not distributed in Git).`)
