import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
// Ship a pre-generated Function as well: Vercel discovers api entries before its build.
await import('./build-api.mjs')
// New staging directory each time: never mix an older build with current source.
const stage = resolve(root, 'output', `deploy-${Date.now()}`)
await mkdir(stage, { recursive: true })
const entries = ['src', 'server', 'api', 'public', 'tools/check-runtime-assets.mjs', 'tools/build-api.mjs',
  'external-assets.json', 'package.json', 'package-lock.json', 'index.html',
  'tsconfig.json', 'tsconfig.server.json', 'vite.config.ts', 'vercel.json', '.vercelignore']
for (const entry of entries) await cp(resolve(root, entry), resolve(stage, entry), { recursive: true })
// Unused NULLSIGNAL image files are omitted from public Git and deploy alike.
const { rm } = await import('node:fs/promises')
for (const name of ['corner-bracket.png', 'status-standby.png'])
  await rm(resolve(stage, 'public/assets/vendor/nullsignal', name), { force: true })
const version = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8')).version
await writeFile(resolve(root, 'output/latest-stage.json'), JSON.stringify({ stage, version }, null, 2) + '\n')
console.log(stage)
