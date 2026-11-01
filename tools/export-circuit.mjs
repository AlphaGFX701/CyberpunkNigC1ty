// Reproduce with: node --experimental-strip-types tools/export-circuit.mjs
// Uses original runtime geometry; no browser renderer, labels, portraits or vendor assets.
import { mkdirSync, writeFileSync } from 'node:fs'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { buildCircuitModel } from '../src/circuit/model-geometry.ts'

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
const model = buildCircuitModel([0, 1, 2, 3, 4, 5, 6], 7).root
const exporter = new GLTFExporter()
const binary = await exporter.parseAsync(model, { binary: true, onlyVisible: true })
if (!(binary instanceof ArrayBuffer)) throw new Error('GLB exporter did not return binary')
mkdirSync('public/assets/circuit', { recursive: true })
writeFileSync('public/assets/circuit/circuit-city.glb', Buffer.from(binary))
writeFileSync(
  'public/assets/circuit/CREDITS.txt',
  `TechCare Circuit City — original geometry and material design, 1 November 2026.
Editable source: src/circuit/model-geometry.ts
Rebuild: node --experimental-strip-types tools/export-circuit.mjs
This static GLB contains the PCB, eight original districts, traces, hardware and fans.
Runtime light/data animation, Kin portrait, DOM markers and camera are implemented separately.
Circuit City reference screenshots guided the concept; no Sketchfab model, texture or geometry was imported.
`
)
console.log(`Exported ${binary.byteLength} bytes to public/assets/circuit/circuit-city.glb`)
