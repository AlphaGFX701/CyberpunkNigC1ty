import { build } from 'esbuild'
import { mkdir, readFile } from 'node:fs/promises'

await mkdir(new URL('../api/', import.meta.url), { recursive: true })
await build({
  entryPoints: [new URL('../server/vercel.ts', import.meta.url).pathname.replace(/^\/(\w:)/, '$1')],
  outfile: new URL('../api/index.mjs', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'),
  platform: 'node', target: 'node24', format: 'esm', bundle: true,
  packages: 'external', sourcemap: false,
})
const source = await readFile(new URL('../api/index.mjs', import.meta.url), 'utf8')
if (/\b(?:from\s*|import\s*\()\s*['"][^'"]+\.ts['"]/.test(source))
  throw Error('Bundled Function still imports a TypeScript source file')
console.log('Bundled Node 24 API: api/index.mjs (no runtime TypeScript imports)')
