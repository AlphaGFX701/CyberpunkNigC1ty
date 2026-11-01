# RELAY-02 — Circuit City

Original station hardware model for episode two. Its seven outer districts use the same coordinates and controls as Arun's Circuit City, then connect to an original-record archive at the center. The station model contains no camera tower or imported Sketchfab mesh.

## Editable model

- `src/circuit/relay-geometry.ts`: stage labels, hardware geometry, materials and animation groups.
- `src/circuit/primitives.ts`: shared box/cylinder/material construction used by both original models.
- `src/circuit/chapter-adapter.ts`: two chapter adapters normalize map status and commands without making the map own lesson progression.

Coordinates `(x,z)` are LINK `(-35,24)`, PATH `(-39,-1)`, ANCHOR `(-27,-26)`, INVENTORY `(0,-27)`, TIMELINE `(30,-24)`, DOCUMENT `(38,1)`, SECTION `(30,25)`, ORIGINAL `(0,4)`. Each district has `userData.stage` and a descriptive object name. PCB footprint is 112×84 scene units.

## Export

Run from the project directory:

```powershell
node --experimental-strip-types tools/export-relay-circuit.mjs
```

Output: `public/assets/relay/circuit/relay-city.glb`, with `CREDITS.txt` beside it. GLB contains static original geometry. Runtime packet motion, fan rotation, emissive lighting, DOM labels and Kin's portrait are implemented separately by the game.

## Shared controls

`CircuitCityMap` accepts `chapterId="arun"` (default) or `chapterId="relay"`. The host should key it by active chapter. Both adapters use the existing coordinate-based camera module for focus/orbit/zoom/reset, pause gating and reduced motion. The renderer is paused while a repair window is open. Dragging more than six pixels does not select a building. A stage list remains available if WebGL fails.

Clicking a district only inspects it; the explicit start action opens the repair console. Only the chapter's validated repair submission can award progress. Selecting, rendering or focusing never awards evidence.

## Checks

`node --experimental-strip-types --test tests/relay-circuit.test.ts` verifies the familiar route, eight selectable hardware districts, model bounds, finite geometry and original-record tower identity. Full desktop interaction and old chapter regression are checked through the game rather than the static export.

Local project output only; no publication or third-party asset redistribution is included.
