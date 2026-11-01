// Original RELAY-02 hardware geometry, reproducible without a browser.
import { mkdirSync, writeFileSync } from 'node:fs'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { buildRelayModel } from '../src/circuit/relay-geometry.ts'

globalThis.FileReader = class {
  result = null
  onloadend = null
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((value) => {
      this.result = value
      this.onloadend?.()
    })
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((value) => {
      this.result = `data:${blob.type};base64,${Buffer.from(value).toString('base64')}`
      this.onloadend?.()
    })
  }
}
const { root } = buildRelayModel([0, 1, 2, 3, 4, 5, 6], 7)
const binary = await new GLTFExporter().parseAsync(root, { binary: true, onlyVisible: true })
if (!(binary instanceof ArrayBuffer)) throw new Error('Expected binary GLB')
mkdirSync('public/assets/relay/circuit', { recursive: true })
writeFileSync('public/assets/relay/circuit/relay-city.glb', Buffer.from(binary))
writeFileSync(
  'public/assets/relay/circuit/CREDITS.txt',
  `TechCare RELAY-02 — original low-poly circuit hardware, 2 November 2026.
Editable source: src/circuit/relay-geometry.ts and src/circuit/primitives.ts
Rebuild: node --experimental-strip-types tools/export-relay-circuit.mjs
GLB includes original PCB, seven network districts, original-record tower, connectors and fans.
Runtime animations, DOM markers, text and Kin portrait are separate in the game.
No Sketchfab mesh, vendor texture or proprietary model was imported.
`
)
console.log(`Exported RELAY-02 GLB: ${binary.byteLength} bytes`)
